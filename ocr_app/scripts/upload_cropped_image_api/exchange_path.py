def fix_original_image_path(original_image_path: str) -> str:
    """
    フロントから渡されたパスが:
      - "http://localhost:8000/media/20241027_co_second_q01/..." (URL)
      - "/Users/shipro/Documents/CREATE_DATA2/... (絶対パス)
      - "20241027_co_second_q01/..." (相対パス)
    のいずれであっても、最終的にサーバー側で扱える絶対パスに整形して返す。
    """

    import os

    BASE_STORAGE_DIR = "/Users/shipro/Documents/CREATE_DATA2"  # 実際の保存ベースディレクトリ

    if not original_image_path:
        return ""

    # 1) URL形式 (http://.../media/) の場合、"/media/"の後ろを取り出して BASE_STORAGE_DIR と結合
    if original_image_path.startswith("http://") or original_image_path.startswith("https://"):
        splitted = original_image_path.split("/media/")
        if len(splitted) > 1:
            # splitted[1] => "20241027_co_second_q01/xxx.png"
            relative_part = splitted[1]
            # 絶対パスを組み立て
            return os.path.join(BASE_STORAGE_DIR, relative_part)
        else:
            # 一応fallbackとして元の文字列を返す
            return original_image_path

    # 2) 絶対パス ("/Users/...") の場合は、そのまま使う
    if original_image_path.startswith("/"):
        return original_image_path

    # 3) それ以外 => 相対パスとして BASE_STORAGE_DIR と結合
    return os.path.join(BASE_STORAGE_DIR, original_image_path)