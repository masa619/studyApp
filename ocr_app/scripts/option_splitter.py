import re

def remove_leading_symbols(text: str) -> str:
    """
    先頭にある空白文字や句読点等を除去するためのユーティリティ関数。
    例えば ".  ,  123" のように句読点・空白が連続していた場合、
    "123" に整形して返す。
    """
    # ^[\s\.,、…]* は、先頭にある空白(\s)や.や,や、などをすべてマッチさせる
    return re.sub(r'^[\s\.,、]+', '', text)

def split_options_by_iroha(text: str) -> dict:
    """
    イロハニ4つを行単位で判定し、重複チェック・不足チェックを行い、
    結果を返すロジック。
    
    期待する戻り値イメージ:
    {
      "status": "ok" or "error",
      "message": "イロハニが正常に4つ見つかりました" or エラー理由,
      "lines": {
         "イ": "(本文...)",
         "ロ": "(本文...)",
         "ハ": "(本文...)",
         "ニ": "(本文...)",
      },
      "duplicates": [],   # 重複があった場合、その先頭文字を格納
      "missing": [],      # 足りない場合、その先頭文字を格納
    }
    """

    # 1) 行に分割
    lines = text.split('\n')

    # Sort lines based on the order of イ, ロ, ハ, ニ
    iroha_order = {"イ": 0, "ロ": 1, "ハ": 2, "ニ": 3}
    lines.sort(key=lambda line: iroha_order.get(line[0], float('inf')))

    # 2) イロハニのマッピング用dictを用意 (None で未発見を示す)
    result_lines = {"イ": None, "ロ": None, "ハ": None, "ニ": None}

    # どの文字が重複したかを記録するリスト
    duplicates = []

    # 3) 行ごとに先頭1文字を判定
    for line in lines:
        if not line:
            continue  # 空行はスキップ
        first_char = line[0]  # 先頭文字
        if first_char in result_lines:
            # すでに格納済みなら重複
            if result_lines[first_char] is not None:
                duplicates.append(first_char)
            else:
                # はじめて出現したイロハニ
                # イロハニの1文字を除いた残りを整形して格納
                cleaned_text = remove_leading_symbols(line[1:])
                result_lines[first_char] = cleaned_text

    # 4) missingチェック (まだ None のキーを抽出)
    missing = [k for k, v in result_lines.items() if v is None]

    # 5) 結果判定
    if missing or duplicates:
        # 重複・不足があるので "error" を返す
        duplicates_str = ",".join(duplicates) if duplicates else ""
        missing_str = ",".join(missing) if missing else ""

        message_parts = []
        if missing:
            message_parts.append(f"missing=[{missing_str}]")
        if duplicates:
            message_parts.append(f"duplicates=[{duplicates_str}]")

        combined_message = " / ".join(message_parts)
        return {
            "status": "error",
            "message": f"イロハニ判定NG ({combined_message})",
            "lines": result_lines,
            "duplicates": duplicates,
            "missing": missing,
        }
    else:
        # 全部正常に揃っている
        return {
            "status": "ok",
            "message": "イロハニが正常に4つ見つかりました",
            "lines": result_lines,
            "duplicates": [],
            "missing": [],
        }