# ocr_app/scripts/ocr_code.py

from google.cloud import vision
from google.protobuf.json_format import MessageToDict
from google.api_core.client_options import ClientOptions
import os

from .normalize import ocr_normalize, post_normalize_katexify
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


def unify_to_mac_path(value, base1, base2):
    if value.startswith(base2):
        return value  # そのまま
    if value.startswith(base1):
        suffix = value[len(base1):]  # base1を除去
        return os.path.join(base2, suffix)
    return value


def convert_absolute_to_relative(data):
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


###################################
# OCR実行ユーティリティ
###################################
def run_vision_ocr_for_image(image_path: str, force_rerun: bool = False, image_type: str = None) -> OCRResult:
    """
    単一画像に対するOCR実行
    """
    obj, created = OCRResult.objects.get_or_create(
        image_path=image_path,
        defaults={'status': 'pending'}
    )

    # 既に成功済み＆再実行強制なし => スキップ
    if obj.status == 'done' or obj.status == 'manual_corrected' and not force_rerun:
        print(f"OCR skip: {image_path}")
        return obj
    # 既にエラー＆再実行強制なし => スキップ
    if obj.status == 'error' and not force_rerun:
        return obj

    try:
        response_proto = call_vision_api(image_path)
        if response_proto.error.message:
            obj.mark_error(response_proto.error.message)
            return obj

        response_dict = MessageToDict(response_proto._pb)
        avg_conf = calc_confidence_from_dict(response_dict)

        text_annots = response_dict.get("textAnnotations", [])
        full_text_0 = text_annots[0]["description"] if text_annots else ""

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


#############################################
# ★★ 共通処理: OCR + JSON書き戻し + KaTeX化
#############################################
def process_single_image(payload: dict) -> dict:
    """
    1枚分のOCR～書き戻し～KaTeX変換を行い、結果を返す。
    payload例:
      {
        "image_path": "...",
        "force_rerun": False,
        "image_type": "question" or "options",
        "json_id": 123,
        "No": "1",
      }
    """
    from django.shortcuts import get_object_or_404
    from ocr_app.models import InputJSON

    image_path = payload.get("image_path")
    force_rerun = payload.get("force_rerun", False)
    image_type = payload.get("image_type", "unknown")
    json_id = payload.get("json_id")
    No = payload.get("No")

    # OCR実行
    obj = run_vision_ocr_for_image(image_path, force_rerun=force_rerun, image_type=image_type)
    result_dict = ocr_result_to_dict(obj, image_type)

    # イロハニ分割 (options の場合)
    if obj.status == 'done' and image_type == "options":
        splitted = split_options_by_iroha(obj.normalized_text or obj.full_text)
        result_dict["option_check_result"] = splitted

    # JSON書き戻し + KaTeX化
    if obj.status == 'done' and json_id and No:
        input_json_obj = get_object_or_404(InputJSON, pk=json_id)
        data = input_json_obj.json_data or {}
        areas = data.get("areas", [])

        target_area = next((a for a in areas if str(a.get("No")) == str(No)), None)
        if target_area:
            normalized_text = obj.normalized_text or obj.full_text

            # KaTeX化
            # ※ 先に normalized_text を KaTeX変換して JSONへ保存
            normalized_katex = post_normalize_katexify(normalized_text)

            # areaのquestion_element or options_elementへ書き戻す
            if image_type == "question":
                if "question_element" not in target_area:
                    target_area["question_element"] = {}
                target_area["question_element"]["text"] = normalized_katex
            elif image_type == "options":
                if "options_element" not in target_area:
                    target_area["options_element"] = {}
                target_area["options_element"]["text"] = normalized_katex

            # DB保存
            input_json_obj.json_data = data
            input_json_obj.save()

    return result_dict


###########################################
# メインエンドポイント: unified_ocr_process
###########################################
def unified_ocr_process(payload: dict):
    """
    payload例:
      {
        "mode": "single" or "batch",
        "image_path": "xxx",        (single用)
        "force_rerun": true/false,
        "image_type": "question" or "options",
        "json_id": 123,
        "No": "1",

        "areas": [ ... ]           (batch用)
      }

    戻り値: OCR結果のリスト
    """
    mode = payload.get("mode", "single")
    force_rerun = payload.get("force_rerun", False)
    results = []

    if mode == "single":
        # 単独の処理
        res = process_single_image(payload)
        results.append(res)

    elif mode == "batch":
        # areasごとに process_single_image() を呼んで処理を再利用
        areas = payload.get("areas", [])
        json_id = payload.get("json_id")  # batch全体で同じjson_idならここで取得
        for area in areas:
            # question
            qpath = area.get("question_image_path")
            qtype = area.get("question_image_type", "question")
            # area_idやNoは area["No"] を使う
            No = area.get("No")

            if qpath:
                single_payload_q = {
                    "image_path": qpath,
                    "force_rerun": force_rerun,
                    "image_type": qtype,
                    "json_id": json_id,
                    "No": No
                }
                result_q = process_single_image(single_payload_q)
                results.append(result_q)

            # options
            opath = area.get("options_image_path")
            otype = area.get("options_image_type", "options")

            if opath:
                single_payload_o = {
                    "image_path": opath,
                    "force_rerun": force_rerun,
                    "image_type": otype,
                    "json_id": json_id,
                    "No": No
                }
                result_o = process_single_image(single_payload_o)
                results.append(result_o)

        # batch完了後、まとめて何か処理したい場合はここに書く

    else:
        results.append({"error": f"Unsupported mode: {mode}"})

    return results