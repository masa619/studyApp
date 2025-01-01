# ocr_app/scripts/ocr_code.py

from google.cloud import vision
from google.protobuf.json_format import MessageToDict
from google.api_core.client_options import ClientOptions
import os
from .normalize import ocr_normalize 
from .option_splitter import split_options_by_iroha

from ocr_app.models import OCRResult

####################################
# Google Vision APIクライアント設定
####################################
client = vision.ImageAnnotatorClient(
    client_options=ClientOptions(quota_project_id="genuine-cirrus-413901")
)
features = [
    vision.Feature(type=vision.Feature.Type.DOCUMENT_TEXT_DETECTION, model="builtin/latest")
]
image_context = vision.ImageContext(language_hints=["ja", "en"])

def call_vision_api(image_path: str):
    """
    単一画像をVision APIに投げてAnnotateImageResponseを返す
    """
    with open(image_path, "rb") as f:
        content = f.read()
    request = vision.AnnotateImageRequest(
        image=vision.Image(content=content),
        features=features,
        image_context=image_context
    )
    response = client.annotate_image(request)
    return response

def calc_confidence_from_dict(response_dict: dict) -> float:
    """
    response_dict から wordベースのconfidenceを平均して返す
    """
    full_text_anno = response_dict.get("fullTextAnnotation", {})
    pages = full_text_anno.get("pages", [])
    word_conf_list = []
    for page in pages:
        for block in page.get("blocks", []):
            for para in block.get("paragraphs", []):
                for word in para.get("words", []):
                    wconf = word.get("confidence", 0.0)
                    word_conf_list.append(wconf)
    if not word_conf_list:
        return 1.0
    return sum(word_conf_list) / len(word_conf_list)

###################################
# 絶対パス→mac環境用パス 置換 (例)
###################################
def convert_absolute_to_relative(data):
    """
    再帰的に辞書やリストを巡回し、
    'xxx_path' というキーを持つ文字列が base_dir で始まる場合に
    相対パスに変換する。
    """
    local_base1 = "/home/masa619/anaconda3/envs/layoutenv/src/CREATE_DATA2/"
    local_base2 = "/Users/shipro/Documents/CREATE_DATA2/"

    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, str) and key.endswith('_path'):
                data[key] = unify_to_mac_path(value, local_base1, local_base2)
            elif isinstance(value, (dict, list)):
                convert_absolute_to_relative(value)

    elif isinstance(data, list):
        for i, item in enumerate(data):
            if isinstance(item, (dict, list)):
                convert_absolute_to_relative(item)
            elif isinstance(item, str):
                data[i] = unify_to_mac_path(item, local_base1, local_base2)

    return data

def unify_to_mac_path(value, base1, base2):
    """
    もし value が base1(/home/masa619/...) で始まれば、
    /Users/shipro/Documents/CREATE_DATA2/ + (base1を除いたサフィックス)
    もし value が base2(/Users/shipro/Documents/...) で始まればそのまま
    必要なら相対パス化など。
    """
    if value.startswith(base2):
        return value  # そのまま
    if value.startswith(base1):
        suffix = value[len(base1):]  # base1を除去
        return os.path.join(base2, suffix)
    return value


###################################
# OCRResult更新ユーティリティ
###################################
def run_vision_ocr_for_image(image_path: str, force_rerun: bool = False, image_type: str = None) -> OCRResult:
    """
    単一画像に対するOCRを実行。
    - 既に status='done' かつ force_rerun=False ならスキップ
    - status='error' だったら同様にスキップ(再実行したい場合は force_rerun=True)
    """
    obj, created = OCRResult.objects.get_or_create(
        image_path=image_path,
        defaults={'status': 'pending'}
    )

    # 既に成功済み＆再実行強制なしの場合はスキップ
    if obj.status == 'done' and not force_rerun:
        print(f"[INFO] Already done for {image_path}. Skipping.")
        return obj

    # エラー状態で再実行オフの場合もスキップ
    if obj.status == 'error' and not force_rerun:
        print(f"[WARN] Previous error for {image_path}. Skipping.")
        return obj

    try:
        response_proto = call_vision_api(image_path)
        if response_proto.error.message:
            obj.mark_error(response_proto.error.message)
            return obj

        # dict化
        from google.protobuf.json_format import MessageToDict
        response_dict = MessageToDict(response_proto._pb)
        avg_conf = calc_confidence_from_dict(response_dict)

        text_annots = response_dict.get("textAnnotations", [])
        full_text_0 = text_annots[0]["description"] if text_annots else ""

        # DB更新
        obj.mark_done(response_dict, confidence=avg_conf, text=full_text_0)

        # ノーマライズ
        if image_type:
            normalized = ocr_normalize(full_text_0, image_type)
            obj.normalized_text = normalized
            obj.save()

        return obj

    except Exception as e:
        obj.mark_error(str(e))
        return obj


###################################################
# OCR結果を dict 形式に変換してレスポンス用に返す
###################################################
def ocr_result_to_dict(obj: OCRResult, image_type: str = "unknown") -> dict:
    base_dict = {
        "image_path": obj.image_path,
        "status": obj.status,
    }
    if obj.status == "done":
        base_dict.update({
            "full_text": obj.full_text,
            "avg_confidence": obj.avg_confidence,
            "normalized_text": obj.normalized_text
        })
    elif obj.status == "error":
        base_dict["error_message"] = obj.error_message
    return base_dict


###################################################
# 統合エンドポイント用ロジック (unified_ocr_process)
###################################################
def unified_ocr_process(payload: dict):
    """
    payload例:
      {
        "mode": "single" or "batch",
        "image_path": "xxx",       (single用)
        "areas": [ ... ],         (batch用)
        "force_rerun": true/false,
        "image_type": "question" or "options"
      }
    戻り値: OCR結果の配列 (辞書リスト)
    """
    mode = payload.get("mode", "single")
    force_rerun = payload.get("force_rerun", False)
    results = []

    if mode == "single":
        image_path = payload.get("image_path")
        image_type = payload.get("image_type", "unknown")
        if image_path:
            obj = run_vision_ocr_for_image(image_path, force_rerun=force_rerun, image_type=image_type)

            if obj.status == 'done':
                # イロハニのチェック (optionsの場合のみ)
                from .option_splitter import split_options_by_iroha
                if image_type == "options":
                    check_result = split_options_by_iroha(obj.normalized_text or obj.full_text)
                else:
                    check_result = {}

                base_dict = ocr_result_to_dict(obj, image_type)
                base_dict["option_check_result"] = check_result
                results.append(base_dict)
                # ▼▼▼ ここから SINGLE WRITEBACK ▼▼▼
                json_id = payload.get("json_id")
                No = payload.get("No")
                if json_id and No:
                    # JSONを取得
                    from ocr_app.models import InputJSON
                    from django.shortcuts import get_object_or_404

                    input_json_obj = get_object_or_404(InputJSON, pk=json_id)
                    data = input_json_obj.json_data or {}
                    areas = data.get("areas", [])

                    # 該当area を特定
                    target_area = next((
                        a for a in areas 
                        if str(a.get("No")) == str(No)
                    ), None)

                    if target_area:
                        normalized_text = obj.normalized_text or obj.full_text
                        if image_type == "question":
                            if "question_element" not in target_area:
                                target_area["question_element"] = {}
                            target_area["question_element"]["text"] = normalized_text
                        elif image_type == "options":
                            if "options_element" not in target_area:
                                target_area["options_element"] = {}
                            target_area["options_element"]["text"] = normalized_text

                        # DBへ保存
                        input_json_obj.json_data = data
                        input_json_obj.save()

                # ▲▲▲ SINGLE WRITEBACK END ▲▲▲
            else:
                results.append(ocr_result_to_dict(obj, image_type))
        else:
            results.append({"error": "No image_path provided for single mode"})

    elif mode == "batch":
        areas = payload.get("areas", [])
        # =========================
        # ★★★ START ADD ★★★
        # "書き戻し"を行うため、areasを加工する
        # =========================
        for area in areas:
            # 質問画像
            qpath = area.get("question_image_path")
            qtype = area.get("question_image_type", "question")
            q_result_dict = None

            if qpath:
                q_obj = run_vision_ocr_for_image(qpath, force_rerun=force_rerun, image_type=qtype)
                q_result_dict = ocr_result_to_dict(q_obj, qtype)
                results.append(q_result_dict)
                # ここでノーマライズ済テキストを JSON に書き戻す
                if q_obj.status == 'done':
                    normalized_text = q_obj.normalized_text or q_obj.full_text
                    if "question_element" not in area:
                        area["question_element"] = {}
                    # JSON上書き
                    area["question_element"]["text"] = normalized_text

            # 選択肢画像
            opath = area.get("options_image_path")
            otype = area.get("options_image_type", "options")
            o_result_dict = None

            if opath:
                o_obj = run_vision_ocr_for_image(opath, force_rerun=force_rerun, image_type=otype)
                o_result_dict = ocr_result_to_dict(o_obj, otype)

                # イロハニ分割
                if o_obj.status == 'done':
                    from .option_splitter import split_options_by_iroha
                    splitted = split_options_by_iroha(o_obj.normalized_text or o_obj.full_text)
                    o_result_dict["option_check_result"] = splitted

                    # JSON上書き
                    normalized_text = o_obj.normalized_text or o_obj.full_text
                    if "options_element" not in area:
                        area["options_element"] = {}
                    area["options_element"]["text"] = normalized_text

                results.append(o_result_dict)
        # =========================
        # ★★★ END ADD ★★★
        # "results"には OCRResult の情報が入る + area には text が書き戻される

    else:
        results.append({"error": f"Unsupported mode: {mode}"})

    return results