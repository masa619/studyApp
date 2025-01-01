# ocr_app/scripts/normalize.py

def normalize_question_text(text: str) -> str:
    """
    問題文用のノーマライズ例:
    - 改行をスペースにする
    - 全角スペースを半角にする
    - 先頭/末尾の空白を削除
    etc...
    """
    # 自由に拡張
    text = text.replace('\r', ' ').replace('\n', ' ')
    text = text.replace('、', '、')
    text = text.replace(',', '、')
    text = text.strip()
    text.replace(' ', '')
    return text

def normalize_options_text(text: str) -> str:
    """
    選択肢用のノーマライズ例:
    - 行ごとに分割し、先頭に出てくる「イ」「ロ」「ハ」「ニ」を検出
    - OCRの誤認識(二,= など)を補正
    - 4つに分割して返す場合、ここで JSON形式にしても良いし、とりあえず1つの文字列にまとめても良い
    """
    # ここでは簡単に改行だけ整形する例
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    # OCR誤認識の補正例
    replaced_lines = []
    for line in lines:
        # 先頭文字が "ｲ" や "ﾛ" なら "イ" に直す
        if line.startswith("ｲ"):
            line = "イ" + line[1:]
        elif line.startswith("ﾛ"):
            line = "ロ" + line[1:]
        elif line.startswith("ﾊ"):
            line = "ハ" + line[1:]
        elif line.startswith("ﾆ") or line.startswith("二") or line.startswith("二") or line.startswith("="):
            line = "ニ" + line[1:]
        elif line.startswith("口") or line.startswith("ロ") or line.startswith("□"):
            line = "ロ" + line[1:]
        line = line.replace('、', '、')
        line = line.replace(',', '、')
        line = line.replace(' ', '')
        replaced_lines.append(line)

    # 改行でまとめて返す例
    return "\n".join(replaced_lines)

def ocr_normalize(text: str, image_type: str) -> str:
    """
    メインのノーマライズ関数
    image_type = "question", "options", それ以外なら無変換など
    """
    if image_type == "question":
        return normalize_question_text(text)
    elif image_type == "options":
        return normalize_options_text(text)
    else:
        # 未定義タイプならそのまま返す
        return text