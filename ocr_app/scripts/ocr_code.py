from google.cloud import vision
from google.protobuf.json_format import MessageToDict
from google.api_core.client_options import ClientOptions
import os

###################################
# 設定
###################################
client = vision.ImageAnnotatorClient(
    client_options=ClientOptions(quota_project_id="genuine-cirrus-413901")
    #project_id="genuine-cirrus-413901"
    )
language_hints = ["ja", "en"]
features = [
    vision.Feature(
        type=vision.Feature.Type.DOCUMENT_TEXT_DETECTION,
        model="builtin/latest"
        )
    ]
image_context = vision.ImageContext(
    language_hints=["ja", "en"]
)

###################################
# OCR呼び出し & JSON保存
###################################
def call_vision_api(image_path):
    with open(image_path, "rb") as f:
        content = f.read()
    request = vision.AnnotateImageRequest(
        image=vision.Image(content=content),
        features=features,
        image_context=image_context
    )
    response = client.annotate_image(request)
    return response

###################################
# confidence計算 (word平均)
###################################
def calc_confidence_from_dict(response_dict):
    """
    Dictionary形式（MessageToDictで保存したJSON）から
    wordレベルのconfidenceを集計して平均を返す。
    （細かく文字単位で計算したい場合は symbols を辿る等の拡張が必要）
    """
    full_text_anno = response_dict.get("fullTextAnnotation", {})
    pages = full_text_anno.get("pages", [])
    word_conf_list = []

    for page in pages:
        blocks = page.get("blocks", [])
        for block in blocks:
            paragraphs = block.get("paragraphs", [])
            for para in paragraphs:
                words = para.get("words", [])
                for word in words:
                    wconf = word.get("confidence", 0.0)
                    word_conf_list.append(wconf)

    if not word_conf_list:
        return 1.0  # 単語なし → 1.0 とするなど適当

    return sum(word_conf_list)/len(word_conf_list)

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