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

from .scripts.ocr_code import convert_absolute_to_relative, unified_ocr_process
# -------------------------------------------------------
# Utility function for Google Vision API image OCR
# -------------------------------------------------------

@api_view(['POST'])
def trigger_ocr(request):
    """
    単一のエンドポイントで OCR 処理を行う。
    POSTデータ例:
    {
      "mode": "single" or "batch",
      "image_path": "/path/to/img.png",  # single用
      "pages": [ { "areas":[ {"question_image_path":"...", ...} ] }, ... ],  # batch用
      "force_rerun": true/false
    }

    戻り値:
    {
      "results": [
         { "image_path":"...", "status":"done", "full_text":"...", ... },
         ...
      ]
    }
    """
    data = request.data
    results = unified_ocr_process(data)
    return Response({"results": results}, status=status.HTTP_200_OK)

# -------------------------------------------------------
# JSON Upload & optional OCR
# -------------------------------------------------------
class ImportJsonView(APIView):
    """
    JSONファイル + description + OCR実行フラグ
    1) DBに InputJSON を保存
    2) perform_ocr=true => unified_ocr_process(mode="batch") を呼んでイロハ分割
    """

    def post(self, request, format=None):
        # 1) ファイルチェック
        json_file = request.FILES.get('file')
        if not json_file:
            return Response({"detail":"No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        description = request.data.get('description', '')
        perform_ocr_value = request.data.get('perform_ocr', 'false').lower()
        perform_ocr = (perform_ocr_value == 'true')

        try:
            # 2) JSON読込 & areasフラット化
            file_data = json_file.read().decode('utf-8')
            original_json_data = json.loads(file_data)

            flattened_areas = []
            if isinstance(original_json_data, list):
                for page_obj in original_json_data:
                    page_areas = page_obj.get('areas', [])
                    flattened_areas.extend(page_areas)
            else:
                return Response({'detail': 'Expected a list of pages'}, status=400)

            # 3) パス変換
            new_json_data = {"areas": flattened_areas}
            new_json_data = convert_absolute_to_relative(new_json_data)

            # 4) DB保存
            new_input_json = InputJSON.objects.create(
                description=description,
                json_data=new_json_data
            )

            resp_data = {
                "detail": "JSON import success",
                "id": new_input_json.pk,
                "description": new_input_json.description,
                "perform_ocr": perform_ocr,
            }

            # 5) OCRを実行する場合
            if perform_ocr:
                def lines_data_to_options_dict(lines_data):
                    """
                    lines_data 例: {"イ":"1", "ロ":"2", "ハ":"3", "ニ":"4"}
                    => options_dict 例:
                    {
                        "イ": {"text": "1", "image_paths": []},
                        "ロ": {"text": "2", "image_paths": []},
                        "ハ": {"text": "3", "image_paths": []},
                        "ニ": {"text": "4", "image_paths": []}
                    }
                    """
                    result = {}
                    for key, val in lines_data.items():
                        result[key] = {
                            "text": val,         # OCRで読み取ったテキスト
                            "image_paths": []    # まだ画像は紐づけ前なので空配列をとりあえずセット
                        }
                    return result

                # question_image_type / options_image_type を付与
                for area in flattened_areas:
                    if "question_image_path" in area:
                        area["question_image_type"] = "question"
                    if "options_image_path" in area:
                        area["options_image_type"] = "options"

                # payload作成
                payload = {
                    "mode": "batch",
                    "force_rerun": False,
                    "areas": flattened_areas
                }

                # OCR & イロハニ分割
                results = unified_ocr_process(payload)


                ocr_dict_by_path = {}
                for r in results:
                    path = r.get("image_path")
                    if path:
                        ocr_dict_by_path[path] = r

                for area in flattened_areas:
                    opath = area.get("options_image_path")
                    if opath and opath in ocr_dict_by_path:
                        odict = ocr_dict_by_path[opath]
                        check_result = odict.get("option_check_result")
                        if check_result and isinstance(check_result, dict):
                            lines_data = check_result.get("lines")
                            if lines_data and isinstance(lines_data, dict):
                                if "options_element" not in area:
                                    area["options_element"] = {}
                                area["options_element"]["options_dict"] = lines_data_to_options_dict(lines_data)


                # JSON更新 & DB保存
                new_input_json.json_data = {"areas": flattened_areas}
                new_input_json.save()

                resp_data["ocr_results"] = results

            # 7) レスポンス
            return Response(resp_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"[ERROR] {e}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
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

# -------------------------------------------------------
# OCRResultView (class-based) 
# -------------------------------------------------------
class OCRResultView(APIView):
    """
    GETクエリ: /ocr_app/api/ocr_results?image_path=xxx
    例: /ocr_app/api/ocr_results?image_path=/path/to/img.png
        => OCRResult の一覧を返す

    今回追加:
    PUT /ocr_app/api/ocr_results/<pk>/
        => 指定したOCRResultを更新
    """

    def get(self, request, pk=None, format=None):
        """
        (既存実装)
        GET /ocr_app/api/ocr_results?image_path=xxx  (クエリ)
        or
        GET /ocr_app/api/ocr_results/<pk>/           (ID指定)
        """
        image_path = request.query_params.get('image_path')
        if image_path:
            # image_path指定がある: フィルタして返す
            qs = OCRResult.objects.filter(image_path=image_path)
            data = []
            for obj in qs:
                data.append({
                    "id": obj.pk,
                    "image_path": obj.image_path,
                    "status": obj.status,
                    "full_text": obj.full_text,
                    "normalized_text": obj.normalized_text,
                    "avg_confidence": obj.avg_confidence,
                    "vision_api_response": obj.vision_api_response,
                })
            return Response({"results": data}, status=status.HTTP_200_OK)

        if pk is not None:
            # pk指定がある: 個別取得
            try:
                obj = OCRResult.objects.get(pk=pk)
                data = {
                    "id": obj.pk,
                    "image_path": obj.image_path,
                    "status": obj.status,
                    "full_text": obj.full_text,
                    "normalized_text": obj.normalized_text,
                    "avg_confidence": obj.avg_confidence,
                    "vision_api_response": obj.vision_api_response,
                }
                return Response({"results": [data]}, status=status.HTTP_200_OK)
            except OCRResult.DoesNotExist:
                return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        # pkもimage_pathも無い → 全件返す等、必要に応じて実装
        qs = OCRResult.objects.all()
        data = []
        for obj in qs:
            data.append({
                "id": obj.pk,
                "image_path": obj.image_path,
                "status": obj.status,
                "full_text": obj.full_text,
                "normalized_text": obj.normalized_text,
                "avg_confidence": obj.avg_confidence,
                "vision_api_response": obj.vision_api_response,
            })
        return Response({"results": data}, status=status.HTTP_200_OK)

    def put(self, request, pk=None, format=None):
        """
        PUT /ocr_app/api/ocr_results/<pk>/
        Body例:
        {
          "normalized_text": "...",
          "status": "manual_corrected",
          ...
        }
        => 指定したOCRResultを更新し、更新後の内容を返す。
        """
        if pk is None:
            return Response({"detail":"No pk provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ocr_obj = OCRResult.objects.get(pk=pk)
        except OCRResult.DoesNotExist:
            return Response({"detail":"Not found"}, status=status.HTTP_404_NOT_FOUND)

        # 送信されたデータを取得
        normalized_text = request.data.get("normalized_text")
        new_status = request.data.get("status")

        if normalized_text is not None:
            ocr_obj.normalized_text = normalized_text

        if new_status is not None:
            ocr_obj.status = new_status

        ocr_obj.save()

        # 更新後の内容を返却
        serializer = OCRResultSerializer(ocr_obj)  # もし既にSerializerがあるなら利用
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 必要に応じて patch() や delete() も定義する


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
    action = "add" or "delete"
    - add:  Base64画像をファイルとして書き込み
            selected_image_type="options" の場合は options_dict へパスを追記
            selected_iroha_key があれば "options_dict[イ].image_paths" などにappend
    - delete: 既存ファイルをリストから削除
    """
    import os
    import base64
    import cv2
    import numpy as np

    from django.shortcuts import get_object_or_404
    from .models import InputJSON
    from .scripts.upload_cropped_image_api.exchange_path import fix_original_image_path

    # ------------ 1) リクエストデータ取得 ------------
    original_image_path = request.data.get("original_image_path")
    selected_image_type = request.data.get("selected_image_type", "question")  # "question" or "options"
    json_id = request.data.get("json_id")
    area_id = request.data.get("area_id")
    label_name = request.data.get("label_name", "1")
    no_number = request.data.get("no_number")
    cropped_image_base64 = request.data.get("cropped_image_base64")
    action = request.data.get("action", "add")  # "add" or "delete"
    delete_filename = request.data.get("delete_filename", None)

    # ★ 今回追加: irohaキー
    selected_iroha_key = request.data.get("selected_iroha_key", "")

    if not json_id:
        return Response({"detail": "json_id not provided"}, status=400)
    if not area_id or not no_number:
        return Response({"detail": "area_id or no_number not provided"}, status=400)

    # "delete" の場合
    if action == "delete":
        if not delete_filename:
            return Response({"detail": "delete_filename is required for action=delete"}, status=400)
    else:
        # "add" の場合は画像必須
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

    # ------------ 3) Options or Question の要素を確保 ------------
    #  3-1) "Options" の場合 => area["options_element"] / area["options_element"]["options_dict"]
    #  3-2) "Question" の場合 => 従来 "question_image_paths" に入れても良いが、
    #        ご要望があれば "question_element" の中に "image_paths" を新設する選択肢もあり。
    
    if selected_image_type == "options":
        if "options_element" not in area:
            area["options_element"] = {}

        if "options_dict" not in area["options_element"]:
            area["options_element"]["options_dict"] = {}  # 空のdictを作る

        # 例えば options_dict が {"イ": {text:"1", image_paths:[]}, ...} の構造を想定
        # selected_iroha_key が空文字の場合や、 dictに該当キーが無い場合にエラーにするか自動生成するかは要件次第。
        if selected_iroha_key:
            # 該当キーが無ければ自動生成
            if selected_iroha_key not in area["options_element"]["options_dict"]:
                area["options_element"]["options_dict"][selected_iroha_key] = {
                    "text": "",
                    "image_paths": []
                }

    else:
        # === Question の場合 ===
        if "question_element" not in area:
            area["question_element"] = {}
        if "image_paths" not in area["question_element"]:
            area["question_element"]["image_paths"] = []

    # ------------ 4) 削除処理 (action="delete") ------------
    if action == "delete":
        # 既存ファイルをリストから除外
        if selected_image_type == "options":
            # options_dict 配下にある特定のキーの image_paths からdelete_filenameを削除するのか、
            # あるいは "options_image_paths" リストから削除するのか要検討。
            # ここでは「options_dict から削除」例:
            found_and_deleted = False
            for k, v in area["options_element"]["options_dict"].items():
                if "image_paths" in v:
                    new_list = [fp for fp in v["image_paths"] if fp != delete_filename]
                    if len(new_list) < len(v["image_paths"]):
                        found_and_deleted = True
                    v["image_paths"] = new_list

            if not found_and_deleted:
                return Response({"detail": f"{delete_filename} not found in any options_dict.image_paths"},
                                status=404)

        else:
            # Question の場合
            # question_image_paths から削除 or question_element["image_paths"] から削除
            # ここでは "question_element.image_paths" から削除 例
            old_list = area["question_element"]["image_paths"]
            new_list = [fp for fp in old_list if fp != delete_filename]
            area["question_element"]["image_paths"] = new_list

        # DB保存してレスポンス
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

    # ------------ 5) 追加処理 (action="add") ------------
    try:
        # パス整形
        from .scripts.upload_cropped_image_api.exchange_path import fix_original_image_path
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

        # === (5-b) JSONに追記 ===
        if selected_image_type == "options":
            # options_dict[selected_iroha_key].image_paths に追加
            if not selected_iroha_key:
                return Response({"detail": "selected_iroha_key is required for options type"}, status=400)

            area["options_element"]["options_dict"][selected_iroha_key]["image_paths"].append(new_file_path)

        else:
            # question_element["image_paths"] に追加 例
            area["question_element"]["image_paths"].append(new_file_path)

    except Exception as e:
        return Response({"detail": str(e)}, status=500)

    # ------------ 6) DB保存してレスポンス ------------
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