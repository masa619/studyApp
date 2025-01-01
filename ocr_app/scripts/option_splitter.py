import re

def remove_leading_symbols(text: str) -> str:
    """
    先頭にある空白文字や句読点等を除去するためのユーティリティ関数。
    例えば ".  ,  123" のように句読点・空白が連続していた場合、
    "123" に整形して返す。
    """
    # ^[\s\.,、]+ は、先頭にある空白(\s)や.や,や、などをすべてマッチさせる
    return re.sub(r'^[\s\.,、]+', '', text)

def split_options_by_iroha(text: str) -> dict:
    """
    イロハニ4つを行単位で読み取り、複数行に跨る場合でもまとめて取得するロジック。
    
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
      "duplicates": [],   # 同じキーが2回以上登場した場合、そのキーを格納
      "missing": [],      # 一度も登場しなかったキーを格納
    }
    """

    if not text:
        return {
            "status": "error",
            "message": "入力テキストが空です",
            "lines": {"イ": "", "ロ": "", "ハ": "", "ニ": ""},
            "duplicates": [],
            "missing": ["イ", "ロ", "ハ", "ニ"],
        }

    # 選択肢4つを格納する辞書を初期化 (最初は空文字列)
    result_lines = {
        "イ": "",
        "ロ": "",
        "ハ": "",
        "ニ": ""
    }

    # duplicates: イロハニが2回以上登場した場合に格納
    duplicates = []
    # missing: 最終的に一度も登場しなかったキー
    # ※あとで判定する

    # 現在アペンド先になっているキー (イ,ロ,ハ,ニ のどれか / None)
    current_key = None

    # 1) 行単位で処理 (ソートしない)
    lines = text.split('\n')

    for line in lines:
        stripped = line.strip()
        if not stripped:
            # 空行の場合: 現在のキーに改行として追加するかどうかは運用次第
            # ここでは "\n" を追加
            if current_key:
                result_lines[current_key] += "\n"
            continue

        first_char = stripped[0]

        # 2) 先頭文字がイロハニのいずれかの場合、新しいキーとして切り替え
        if first_char in result_lines:
            # すでに内容がある場合は "duplicates" に追加しておく (重複という扱い)
            if result_lines[first_char]:
                duplicates.append(first_char)

            # イロハニ記号(先頭1文字)を除去した部分を整形
            remainder = remove_leading_symbols(stripped[1:])
            # ここでは"\n"をつけず、既存文があれば改行してからテキストを追加
            if result_lines[first_char]:
                result_lines[first_char] += "\n" + remainder
            else:
                result_lines[first_char] = remainder

            current_key = first_char
        else:
            # 3) 先頭文字がイロハニ以外の場合は、current_key に続きを追記
            if current_key is not None:
                # すでに何か書かれている場合は改行して連結
                if result_lines[current_key]:
                    result_lines[current_key] += "\n" + line
                else:
                    # 理論上は最初にキー行が来ているはずなので、
                    # ここに入るのは「キー行で初期化 → 続行行」のパターン
                    result_lines[current_key] = line
            else:
                # まだキーが決まっていないのにテキストがある場合 → 無視 or エラー判定
                # 今回は無視する例
                pass

    # 4) missingキーをチェック
    missing = [k for k, v in result_lines.items() if not v.strip()]

    # 5) 結果まとめ
    if missing or duplicates:
        # 重複・不足があるので "error" を返す
        duplicates_str = ",".join(duplicates) if duplicates else ""
        missing_str = ",".join(missing) if missing else ""
        message_parts = []
        if missing:
            message_parts.append(f"missing=[{missing_str}]")
        if duplicates:
            message_parts.append(f"duplicates=[{duplicates_str}]")
        combined_message = " / ".join(part for part in message_parts if part)

        return {
            "status": "error",
            "message": f"イロハニ判定NG ({combined_message})",
            "lines": result_lines,
            "duplicates": duplicates,
            "missing": missing,
        }
    else:
        return {
            "status": "ok",
            "message": "イロハニが正常に4つ見つかりました",
            "lines": result_lines,
            "duplicates": [],
            "missing": [],
        }