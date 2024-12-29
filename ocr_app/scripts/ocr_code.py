# ocr_app/scripts/ocr_code.py

from google.cloud import vision
from google.protobuf.json_format import MessageToDict
from google.api_core.client_options import ClientOptions
import os
from .normalize import ocr_normalize 
from .option_splitter import split_options_by_iroha

# ==============================
# GCP Vision APIクライアント初期化
# ==============================
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
                # 変換をかける
                data[key] = unify_to_mac_path(value, local_base1, local_base2)
            elif isinstance(value, (dict, list)):
                convert_absolute_to_relative(value)

    elif isinstance(data, list):
        for i, item in enumerate(data):
            if isinstance(item, (dict, list)):
                convert_absolute_to_relative(item)
            elif isinstance(item, str):
                # 配列の文字列も置換したい場合
                data[i] = unify_to_mac_path(item, local_base1, local_base2)

    return data

def unify_to_mac_path(value, base1, base2):
    """
    もし value が base1(/home/masa619/...) で始まれば、
    /Users/shipro/Documents/CREATE_DATA2/ + (base1を除いたサフィックス)
    もし value が base2(/Users/shipro/Documents/...) で始まればそのまま or 
    必要なら相対パス化など。
    """
    # すでに Macローカルパスの場合: (/Users/shipro/...)
    if value.startswith(base2):
        return value  # そのまま or 相対パスにするならここで relpath

    # もし /home/... で始まるなら suffix を取り出して /Users/... に連結
    if value.startswith(base1):
        suffix = value[len(base1):]  # base1を除去
        return os.path.join(base2, suffix)

    # どちらでもない場合はそのまま
    return value


# ==============================
# OCRResult更新ユーティリティ
# ==============================
from ocr_app.models import OCRResult

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

    if obj.status == 'done' and not force_rerun:
        print(f"[INFO] Already done for {image_path}. Skipping.")
        return obj

    if obj.status == 'error' and not force_rerun:
        print(f"[WARN] Previous error for {image_path}. Skipping.")
        return obj

    try:
        response_proto = call_vision_api(image_path)
        if response_proto.error.message:
            obj.mark_error(response_proto.error.message)
            return obj

        # dict化
        response_dict = MessageToDict(response_proto._pb)
        avg_conf = calc_confidence_from_dict(response_dict)

        text_annots = response_dict.get("textAnnotations", [])
        full_text_0 = text_annots[0]["description"] if text_annots else ""

        # DB更新
        obj.mark_done(response_dict, confidence=avg_conf, text=full_text_0)
        if image_type:
            normalized = ocr_normalize(full_text_0, image_type)
            obj.normalized_text = normalized
            obj.save()

        return obj

    except Exception as e:
        obj.mark_error(str(e))
        return obj
    
# ==============================
# 統合エンドポイント用ロジック
# ==============================
def unified_ocr_process(payload: dict):
    mode = payload.get("mode", "single")
    force_rerun = payload.get("force_rerun", False)
    results = []

    if mode == "single":
        image_path = payload.get("image_path")
        image_type = payload.get("image_type", "unknown")
        if image_path:
            obj = run_vision_ocr_for_image(image_path, force_rerun=force_rerun)
            # ここでノーマライズをDB保存
            if obj.status == 'done':
                # ノーマライズ
                normalized = ocr_normalize(obj.full_text, image_type)
                obj.normalized_text = normalized
                obj.save()
                # イロハニのチェック
                check_result = split_options_by_iroha(normalized)
                base_dict = ocr_result_to_dict(obj, image_type)
                base_dict["option_check_result"] = check_result
                print(base_dict)
                results.append(base_dict)
            # レスポンス用dict
            results.append(ocr_result_to_dict(obj, image_type))
        else:
            results.append({"error": "No image_path provided for single mode"})

    elif mode == "batch":
        # --- pages を使わず、payload["areas"] を直接処理 ---
        areas = payload.get("areas", [])
        for area in areas:
            # 質問画像があれば
            qpath = area.get("question_image_path")
            qtype = area.get("question_image_type", "question")
            if qpath:
                q_obj = run_vision_ocr_for_image(qpath, force_rerun=force_rerun, image_type=qtype)
                # ノーマライズ済み (image_type指定済) → OCRResultに normalized_text が保存
                # OCRResultの情報を結果へ追加
                results.append(ocr_result_to_dict(q_obj, qtype))

            # 選択肢画像があれば
            opath = area.get("options_image_path")
            otype = area.get("options_image_type", "options")
            if opath:
                o_obj = run_vision_ocr_for_image(opath, force_rerun=force_rerun, image_type=otype)
                # ノーマライズ
                # run_vision_ocr_for_image() 内で image_type が指定されているので normalized_text も保存される

                # ここでイロハ分割し、結果をレスポンス用dictに詰める
                base_dict = ocr_result_to_dict(o_obj, otype)
                if o_obj.status == 'done':
                    check_result = split_options_by_iroha(o_obj.normalized_text or o_obj.full_text)
                    base_dict["option_check_result"] = check_result

                results.append(base_dict)

    else:
        # 未対応の mode
        results.append({"error": f"Unsupported mode: {mode}"})

    return results

def ocr_result_to_dict(obj: OCRResult, image_type: str = "unknown") -> dict:
    """
    DB上に normalized_text があればそれをレスポンスにも載せる
    """
    base_dict = {
        "image_path": obj.image_path,
        "status": obj.status,
    }
    if obj.status == "done":
        base_dict.update({
            "full_text": obj.full_text,
            "avg_confidence": obj.avg_confidence,
            "normalized_text": obj.normalized_text  # DBに保存されている内容
        })
    elif obj.status == "error":
        base_dict["error_message"] = obj.error_message
    return base_dict
