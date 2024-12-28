# ocr_app/views.py

import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.shortcuts import render, get_object_or_404
    
from .models import InputJSON, OCRResult
from .serializers import OCRResultSerializer
from .scripts.ocr_code import (
    call_vision_api,
    calc_confidence_from_dict,
    convert_absolute_to_relative
)
from google.protobuf.json_format import MessageToDict
import cv2,os
import numpy as np
import base64

# -------------------------------------------------------
# Utility function for single-image OCR
# -------------------------------------------------------
def run_vision_ocr_for_image(image_path):
    """
    1) OCRResult を image_path で検索
       - なければ作成(status='pending')
       - あれば status を確認し、done や error の場合は再実行しない
    2) Vision API呼び出し
    3) DB更新
    """
    obj, created = OCRResult.objects.get_or_create(
        image_path=image_path,
        defaults={'status': 'pending'}
    )

    # 既に status='done' なら skip
    if not created and obj.status == 'done':
        print(f"[INFO] Already done for {image_path}. Skipping.")
        return obj

    # 以前 error だった場合も skip (再実行したいならロジック変更)
    if obj.status == 'error':
        print(f"[WARN] Previous error. If you want to retry, reset status or create new record.")
        return obj

    # Vision API 呼び出し
    try:
        response_proto = call_vision_api(image_path)
        if response_proto.error.message:
            obj.mark_error(response_proto.error.message)
            return obj

        # dict化
        response_dict = MessageToDict(response_proto._pb)

        # confidence計算 & テキスト抽出
        avg_conf = calc_confidence_from_dict(response_dict)
        text_annots = response_dict.get("textAnnotations", [])
        full_text_0 = text_annots[0]["description"] if text_annots else ""

        # DB更新
        obj.mark_done(response_dict, confidence=avg_conf, text=full_text_0)
        return obj

    except Exception as e:
        obj.mark_error(str(e))
        return obj


# -------------------------------------------------------
# JSON Upload & optional OCR
# -------------------------------------------------------
class ImportJsonView(APIView):
    """
    フロントエンドからアップロードされた JSONファイル + description(論理名) + OCR実行フラグ を受け取り、
    1) DBに InputJSON を保存
    2) perform_ocr=true なら OCRを一括実行（question_image_path + options_image_path）
    """

    def post(self, request, format=None):
        # 'file' というキーでアップロードされる想定
        json_file = request.FILES.get('file')
        if not json_file:
            return Response({'detail': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        description = request.data.get('description', '')
        perform_ocr_value = request.data.get('perform_ocr', 'false').lower()
        perform_ocr = (perform_ocr_value == 'true')

        try:
            # ファイル内容を読み込み
            file_data = json_file.read().decode('utf-8')
            original_json_data = json.loads(file_data)

            # ここでページ構造を flatten して、page_idxを除外しつつareasのみの構造に
            # original_json_dataが「list of pages」になっている想定
            # [{'page_idx': 1, 'areas': [...]}, {'page_idx': 2, 'areas': [...]}, ...]
            flattened_areas = []
            if isinstance(original_json_data, list):
                for page_obj in original_json_data:
                    page_areas = page_obj.get('areas', [])
                    flattened_areas.extend(page_areas)
            else:
                # 万一リストじゃなければそのまま扱う or エラー
                return Response({'detail': 'Expected a list of pages'}, status=status.HTTP_400_BAD_REQUEST)

            # 変換後の構造: {"areas": [... all areas ...]} のみにする
            new_json_data = {
                "areas": flattened_areas
            }

            # ここでパス置換など (ローカルmacに合わせる) 
            # 例えば convert_absolute_to_relative(new_json_data)
            new_json_data = convert_absolute_to_relative(new_json_data)

            # InputJSONモデルに保存
            new_input_json = InputJSON.objects.create(
                description=description,
                json_data=new_json_data
            )

            resp_data = {
                'detail': 'JSON import success',
                'id': new_input_json.pk,
                'description': new_input_json.description,
                'perform_ocr': perform_ocr,
            }

            # --- OCR実行ロジック (perform_ocr=true) ---
            if perform_ocr:
                results = []
                for area in flattened_areas:
                    question_img = area.get("question_image_path")
                    options_img = area.get("options_image_path")

                    image_paths = []
                    if question_img:
                        image_paths.append(question_img)
                    if options_img:
                        image_paths.append(options_img)

                    for img_path in image_paths:
                        obj = run_vision_ocr_for_image(img_path)
                        if obj.status == 'done':
                            results.append({
                                'image_path': img_path,
                                'status': 'done',
                                'full_text': obj.full_text,
                                'avg_confidence': obj.avg_confidence
                            })
                        elif obj.status == 'error':
                            results.append({
                                'image_path': img_path,
                                'status': 'error',
                                'error_message': obj.error_message
                            })
                        else:
                            results.append({
                                'image_path': img_path,
                                'status': obj.status
                            })
                resp_data['ocr_results'] = results

            return Response(resp_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"[ERROR] {e}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# -------------------------------------------------------
# BATCH OCR: /api/trigger_ocr_for_image_BATCH
# -------------------------------------------------------
@api_view(['POST'])
def trigger_ocr_for_image_BATCH(request):
    """
    フロントエンドで JSON(list of pages) を送信し、
    各 question_image_path に対して Vision API を一括実行。
    """
    try:
        json_data = request.data  # JSON

        if not isinstance(json_data, list):
            return Response({'detail': 'Expected a list of pages'}, status=400)

        results = []
        for page_data in json_data:
            areas = page_data.get("areas", [])
            for area in areas:
                question_img = area.get("question_image_path")
                if not question_img:
                    continue

                # すでに status='done' のレコードがあるか？
                existing = OCRResult.objects.filter(image_path=question_img, status='done').first()
                if existing:
                    results.append({
                        'image_path': question_img,
                        'status': 'already_done',
                        'full_text': existing.full_text,
                        'avg_confidence': existing.avg_confidence,
                    })
                    continue

                # 実行
                resp_proto = call_vision_api(question_img)
                if resp_proto.error.message:
                    err_obj = OCRResult.objects.create(
                        image_path=question_img,
                        status='error',
                        error_message=resp_proto.error.message
                    )
                    results.append({
                        'image_path': question_img,
                        'status': 'error',
                        'error_message': resp_proto.error.message
                    })
                    continue

                response_dict = MessageToDict(resp_proto._pb)
                avg_conf = calc_confidence_from_dict(response_dict)
                text_annots = response_dict.get("textAnnotations", [])
                full_text_0 = text_annots[0]["description"] if text_annots else ""

                # DBに保存
                ocr_obj = OCRResult.objects.create(
                    image_path=question_img,
                    vision_api_response=response_dict,
                    full_text=full_text_0,
                    avg_confidence=avg_conf,
                    status='done'
                )

                results.append({
                    'image_path': question_img,
                    'status': 'done',
                    'avg_confidence': avg_conf,
                    'full_text': full_text_0
                })

        return Response({'results': results}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -------------------------------------------------------
# Single image OCR: /api/trigger_ocr_for_image_single
# -------------------------------------------------------
@api_view(['POST'])
def trigger_ocr_for_image_single(request):
    """
    単一の image_path に対して OCR実行。
    request.data = { "image_path": "/path/to/xxx.png" }
    """
    image_path = request.data.get("image_path")
    if not image_path:
        return Response({"detail": "No image_path"}, status=400)

    obj = run_vision_ocr_for_image(image_path)
    if obj.status == 'done':
        return Response({
            "detail": "OCR done",
            "image_path": image_path,
            "full_text": obj.full_text,
            "avg_confidence": obj.avg_confidence,
        }, status=200)
    elif obj.status == 'error':
        return Response({
            "detail": "OCR error",
            "image_path": image_path,
            "error_message": obj.error_message
        }, status=200)
    else:
        return Response({
            "detail": "No change",
            "image_path": image_path,
            "status": obj.status
        }, status=200)


class OCRResultView(APIView):
    """
    GET /api/ocr_results/            => 全OCRResult一覧 (many=True)
    GET /api/ocr_results/<pk>/        => 単体OCRResultの詳細
    PUT /api/ocr_results/<pk>/        => 単体OCRResultの更新
    """

    def get(self, request, pk=None, format=None):
        # pk がURLに含まれない => 一覧取得
        if 'pk' not in request.parser_context['kwargs']:
            ocr_results = OCRResult.objects.all()
            serializer = OCRResultSerializer(ocr_results, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # 個別取得
            pk = request.parser_context['kwargs'].get('pk')
            ocr_result = get_object_or_404(OCRResult, pk=pk)
            serializer = OCRResultSerializer(ocr_result)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk=None, format=None):
        """
        PUT /api/ocr_results/<pk>/
        JSON body例:
        {
          "full_text": "updated text",
          "status": "manual_corrected",
          ...
        }
        """
        if pk is None:
            # urls.pyで <int:pk> を指定しているので pk ありのパスで呼ばれる想定
            return Response({"detail": "No pk provided"}, status=status.HTTP_400_BAD_REQUEST)

        ocr_result = get_object_or_404(OCRResult, pk=pk)

        serializer = OCRResultSerializer(
            ocr_result,
            data=request.data,
            partial=True  # 部分的な更新を許容
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        


class InputJSONView(APIView):
    """
    GET: 単一の InputJSON (json_data) を取得
         /ocr_app/api/input_json/<id>/
    POST: ファイルアップロード + optionally OCRを実行
          /ocr_app/api/input_json/ (multipart/form-data)
    """

    def get(self, request, id=None, format=None):
        """
        GET /ocr_app/api/input_json/<id>/
        """
        if id is None:
            # IDが提供されていない場合、全件取得
            input_json_objects = InputJSON.objects.all()
            data = []
            for obj in input_json_objects:
                data.append({
                    "id": obj.pk,
                    "description": obj.description,
                    "json_data": obj.json_data,
                    "created_at": obj.created_at,
                    "updated_at": obj.updated_at,
                })
            return Response(data, status=200)

        input_json_obj = get_object_or_404(InputJSON, pk=id)
        data = {
            "id": input_json_obj.pk,
            "description": input_json_obj.description,
            "json_data": input_json_obj.json_data,
            "created_at": input_json_obj.created_at,
            "updated_at": input_json_obj.updated_at,
        }
        return Response(data, status=200)

    def put(self, request, id=None, format=None):
        """
        PUT /ocr_app/api/input_json/<id>/
        一括更新用:
        {
          "description": "xxx",
          "json_data": [...],
          "perform_ocr": false (任意フラグ例)
        }
        """
        if id is None:
            return Response({"detail": "No id provided"}, status=status.HTTP_400_BAD_REQUEST)

        # 既存レコードを取得
        input_json_obj = get_object_or_404(InputJSON, pk=id)

        # リクエストボディから更新項目を取り出し
        description = request.data.get("description")
        new_json_data = request.data.get("json_data")
        perform_ocr_value = request.data.get('perform_ocr', 'false').lower()
        perform_ocr = (perform_ocr_value == 'true')

        # 更新
        if description is not None:
            input_json_obj.description = description
        if new_json_data is not None:
            input_json_obj.json_data = new_json_data

        input_json_obj.save()

        # 必要なら、このタイミングで改めてOCRを再実行するなどの処理を挿入
        # (以下は例: perform_ocr=true なら question_image_path を再OCR)
        if perform_ocr and isinstance(new_json_data, list):
            from .views import run_vision_ocr_for_image
            results = []
            for page_data in new_json_data:
                areas = page_data.get("areas", [])
                for area in areas:
                    qimg = area.get("question_image_path")
                    if qimg:
                        obj = run_vision_ocr_for_image(qimg)
                        # OCRResultのstatus等に応じて結果を格納
                        if obj.status == 'done':
                            results.append({
                                'image_path': qimg,
                                'status': 'done',
                                'full_text': obj.full_text,
                                'avg_confidence': obj.avg_confidence
                            })
                        elif obj.status == 'error':
                            results.append({
                                'image_path': qimg,
                                'status': 'error',
                                'error_message': obj.error_message
                            })
                        else:
                            results.append({
                                'image_path': qimg,
                                'status': obj.status
                            })
            # 必要に応じてレスポンスに含める
            return Response({
                "detail": "Updated (with OCR)",
                "id": input_json_obj.pk,
                "description": input_json_obj.description,
                "json_data": input_json_obj.json_data,
                "ocr_results": results,
            }, status=status.HTTP_200_OK)

        # 通常レスポンス
        return Response({
            "detail": "Updated",
            "id": input_json_obj.pk,
            "description": input_json_obj.description,
            "json_data": input_json_obj.json_data,
        }, status=status.HTTP_200_OK)
        
    def delete(self, request, id=None, format=None):
        """
        DELETE /ocr_app/api/input_json/<id>/
        """
        if id is None:
            return Response({"detail":"No id provided"}, status=400)

        input_json_obj = get_object_or_404(InputJSON, pk=id)
        input_json_obj.delete()
        return Response({"detail":"Deleted"}, status=204)

@api_view(['GET'])
def find_ocr_result_by_path(request):
    image_path = request.query_params.get('image_path')
    if not image_path:
        return Response({"results":[]}, status=200)

    qs = OCRResult.objects.filter(image_path=image_path)
    data = []
    for obj in qs:
        data.append({
            "id": obj.pk,
            "status": obj.status,
            "full_text": obj.full_text,
            "avg_confidence": obj.avg_confidence,
            "vision_api_response": obj.vision_api_response,
            # ...
        })
    return Response({"results": data}, status=200)


@api_view(['POST'])
def detect_bounding_box_api(request):
    """
    POST /ocr_app/api/detect_bounding_box/
    期待するパラメータ:
      - "image_path" or "image_base64" or "image_file"
      - "margin": int, default=10
      - "return_base64": bool
      - "expand_uniformly": bool
      - "expand_margin": int
    """
    from .scripts.detect_bounding_box_api.detect import detect_bounding_box
    

    data = request.data
    margin = int(data.get("margin", 10))
    return_b64 = str(data.get("return_base64", "false")).lower() == "true"
    expand_uniformly = str(data.get("expand_uniformly", "false")).lower() == "true"
    expand_margin = int(data.get("expand_margin", 50))

    print("expand_uniformly", expand_uniformly)
    # (A) 画像読込
    img = None
    image_path = data.get("image_path")
    if image_path:
        img = cv2.imread(image_path)

    if (img is None) and data.get("image_base64"):
        decoded = base64.b64decode(data["image_base64"])
        arr = np.frombuffer(decoded, np.uint8)
        img_decoded = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        img = img_decoded

    if (img is None) and ('image_file' in request.FILES):
        file_obj = request.FILES['image_file']
        file_bytes = file_obj.read()
        arr = np.frombuffer(file_bytes, np.uint8)
        img_decoded = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        img = img_decoded

    if img is None:
        return Response({"detail": "No valid image provided."}, status=status.HTTP_400_BAD_REQUEST)

    # (B) bounding_box.detect_bounding_box 呼び出し
    try:
        result = detect_bounding_box(
            img,
            margin=margin,
            return_base64=return_b64,
            expand_uniformly=expand_uniformly,
            expand_margin=expand_margin
        )
        response_data = {
            "status": "ok",
            "margin": margin,
            "expand_uniformly": expand_uniformly,
            "expand_margin": expand_margin,
            "bounding_box_result": result
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def upload_cropped_image_api(request):
    """
    処理内容:
    1) actionパラメータで追加 or 削除を判定
       - action = "add":    画像をBase64で受け取りファイルに保存し、リストに追加
       - action = "delete": delete_filenameを受け取り、リストから削除

    2) question_image_path / options_image_path を「消さずに」保持。
       - 新規の切り抜き画像は question_image_paths / options_image_paths リストに追加していく。

    3) 単数キーを削除しないので、オリジナル(マニュアル修正されたパス)はそのまま残る。
    """

    import os
    import base64
    import cv2
    import numpy as np

    from django.shortcuts import get_object_or_404
    from .models import InputJSON
    from .scripts.upload_cropped_image_api.exchange_path import fix_original_image_path

    # ------------ 1) リクエストデータ取得とバリデーション ------------
    original_image_path = request.data.get("original_image_path")
    selected_image_type = request.data.get("selected_image_type", "question")  # "question" or "options"
    json_id = request.data.get("json_id")
    area_id = request.data.get("area_id")
    label_name = request.data.get("label_name", "1")
    no_number = request.data.get("no_number")
    cropped_image_base64 = request.data.get("cropped_image_base64")
    action = request.data.get("action", "add")  # "add" or "delete"
    delete_filename = request.data.get("delete_filename", None)

    if not json_id:
        return Response({"detail": "json_id not provided"}, status=400)
    if not area_id or not no_number:
        return Response({"detail": "area_id or no_number not provided"}, status=400)

    # "delete" の場合、削除対象ファイル名を要チェック
    if action == "delete":
        if not delete_filename:
            return Response({"detail": "delete_filename is required for action=delete"}, status=400)
    else:
        # "add" の場合、画像必須
        if not original_image_path or not cropped_image_base64:
            return Response(
                {"detail": "original_image_path or cropped_image_base64 not provided"},
                status=400
            )

    # ------------ 2) JSONデータの特定と Area の取得 ------------
    input_json_obj = get_object_or_404(InputJSON, pk=json_id)
    json_data = input_json_obj.json_data or {}
    areas = json_data.get("areas", [])

    area = next((a for a in areas if str(a.get("area_id")) == str(area_id)), None)
    if not area:
        return Response(
            {"detail": f"Area with area_id={area_id} not found in JSON"},
            status=status.HTTP_404_NOT_FOUND
        )

    # ------------ 3) question_image_paths / options_image_paths を作成 or 確保 ------------
    # 今回は「単数キー(question_image_path / options_image_path) は削除しない」方針
    # もし複数キーが存在しなければ新規で空リストを作るだけ。
    def ensure_list_key(area_dict, list_key):
        """list_key が無ければ空リストを作るだけ。単数キーは放置。"""
        if list_key not in area_dict:
            area_dict[list_key] = []

    ensure_list_key(area, "question_image_paths")
    ensure_list_key(area, "options_image_paths")

    # どのキーに対して追加/削除を行うか
    if selected_image_type == "question":
        image_list_key = "question_image_paths"
    else:
        image_list_key = "options_image_paths"

    # ------------ 4) action=="delete" の場合 ------------
    if action == "delete":
        # リストから該当ファイルパスを取り除く
        original_list = area.get(image_list_key, [])
        new_list = [path for path in original_list if path != delete_filename]
        area[image_list_key] = new_list

        # DB保存してレスポンス返す
        input_json_obj.json_data = json_data
        input_json_obj.save()

        return Response(
            {
                "detail": "Delete success",
                "deleted_filename": delete_filename,
                "input_json_id": input_json_obj.pk,
                "updated_json_data": input_json_obj.json_data
            },
            status=200
        )

    # ------------ 5) action=="add" の場合: Base64画像をファイルとして保存 ------------
    try:
        # パス整形
        fixed_path = fix_original_image_path(original_image_path)  # 絶対パスへ変換
        base_dir = os.path.dirname(fixed_path)

        # ファイル名生成
        new_filename = f"no_{no_number}_{selected_image_type}_image_{label_name}.png"
        new_file_path = os.path.join(base_dir, new_filename)

        # デコード
        decoded_bytes = base64.b64decode(cropped_image_base64)
        img_array = np.frombuffer(decoded_bytes, np.uint8)
        img_decoded = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img_decoded is None:
            return Response(
                {"detail": "Failed to decode base64 image"},
                status=400
            )

        # ディレクトリ作成
        if not os.path.exists(base_dir):
            os.makedirs(base_dir, exist_ok=True)

        success = cv2.imwrite(new_file_path, img_decoded)
        if not success:
            return Response({"detail": "Failed to write image file"}, status=500)

        # リストに追加
        area[image_list_key].append(new_file_path)

    except Exception as e:
        return Response({"detail": str(e)}, status=500)

    # ------------ 6) JSONを更新してDB保存 ------------
    input_json_obj.json_data = json_data
    input_json_obj.save()

    return Response(
        {
            "detail": "Upload success",
            "saved_path": new_file_path,
            "input_json_id": input_json_obj.pk,
            "updated_json_data": input_json_obj.json_data
        },
        status=200
    )