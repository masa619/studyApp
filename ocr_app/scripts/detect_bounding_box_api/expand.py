# ocr_app/scripts/bounding_box/expand.py

import numpy as np

def expand_with_uniform_margin(cropped_img: np.ndarray, margin: int = 50) -> np.ndarray:
    """
    1) cropped_img (H x W) の上下左右に "margin" ピクセル分の余白を付加した画像を作る
    2) 背景は白 (255,255,255)
    3) 戻り値は (H + 2*margin) x (W + 2*margin) の新しい画像

    -> 上下左右が同量の余白で囲まれた最終画像となる。
    """
    if cropped_img is None or cropped_img.size == 0:
        raise ValueError("cropped_img is empty or None")

    ch, cw = cropped_img.shape[:2]
    new_width = cw + margin * 2
    new_height = ch + margin * 2

    # 背景が白色 (BGR: 255,255,255) のキャンバス
    expanded = np.full((new_height, new_width, 3), (255, 255, 255), dtype=np.uint8)

    # (margin, margin) に貼り付け
    expanded[margin:margin+ch, margin:margin+cw] = cropped_img

    return expanded