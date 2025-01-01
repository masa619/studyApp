# ocr_app/scripts/normalize.py
import re
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

###############################
# KaTeX テキスト装飾用
###############################
BOLD_KEYWORDS = [
    "正しいものは",
    "誤っているものは",
    "適切なものは",
    "不適切なものは",
    "省略できないものは",
    "従事できないものは",
    "使用されることのないものは",
    "使用されるものは",
    "使用できないものは",
    "使用できるものは",
]

UNITS = ["m", "A", "V", "Ω", "W", "kW", "kJ", "h", "%", "Ω","MΩ"]

def post_normalize_katexify(text: str) -> str:
    """
    Normalization後に呼び出し、KaTeXや太字の装飾を行うサンプル関数。

    処理の流れ:
      1) 特定キーワードを **キーワード** に変換 (太字)
      2) [任意文字] を [ $任意文字$ ] に変換  (例: [V] -> [ $V$ ])
      3) 「数字+単位」を " $数字単位$ " に変換  (例: 15m -> $15m$)
      4) 「数字のみ」も "$$数字$$" に変換       (例: 20 -> $$20$$)
      5) 「数字/数字」を "$$\frac{数字}{数字}$$" に変換 (例: 1/4 -> $$\frac{1}{4}$$)

    注意:
      - 実際には "数字+単位" の正規表現をどこまで厳密にするか検討が必要
      - [ ] 変換は「角括弧の中身全部を LaTeX扱い」にするための簡易例
    """

    # --- (1) 特定キーワード → 太字 ---
    pattern_bold = r"(正しいものは|誤っているものは|適切なものは|不適切なものは|省略できないものは|従事できないものは|使用されることのないものは|使用されるものは|使用できないものは|使用できるものは)"
    text = re.sub(pattern_bold, r"**\1**", text)

    # --- (2) [ 角括弧 ] 内を LaTeX数式 形式に変換 ---
    pattern_brackets = r"\[([^\]]+)\]"
    text = re.sub(pattern_brackets, r"[ $$\1$$ ]", text)

    # (3) 「数字+単位」 → "$$数字単位$$"
    #  例: "15m" -> "$$15m$$"
    #  拡張: " 15 m " → " $$15m$$ "
    unit_pattern = "|".join(UNITS)  # (m|A|V|Ω|W|...)
    pattern_unit = fr"(\d+(?:\.\d+)?)(?:\s*)({unit_pattern})"

    def repl_unit(m):
        num = m.group(1)
        unt = m.group(2)
        return f"$${num}{unt}$$"

    text = re.sub(pattern_unit, repl_unit, text)

    # (4) 「数字のみ」 → "$$数字$$"
    #     例: "20" -> "$$20$$"
    #   ただし、既に $$...$$ に変換した部分 (数字+単位) は重複しないようにする
    #   → Negative lookbehind/lookaheadを使って "すでに $$...$$ の中は除外" する
    #   例: (?<!\$\$)\b(\d+(?:\.\d+)?)(?!\$\$)
    #       これだと単純ですが、ある程度は重複を防げます
    pattern_number_only = r"(?<!\$\$)\b(\d+(?:\.\d+)?)(?!\$\$)\b"

    def repl_number_only(m):
        value = m.group(1)
        return f"$${value}$$"

    text = re.sub(pattern_number_only, repl_number_only, text)

    # --- (5) 「数字/数字」 → "$$\frac{数字}{数字}$$" ---
    fraction_pattern = r"(\d+)/(\d+)"
    text = re.sub(fraction_pattern, r"$$\\frac{\1}{\2}$$", text)

    return text