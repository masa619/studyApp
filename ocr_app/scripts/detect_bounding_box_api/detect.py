# ocr_app/scripts/bounding_box/detect.py

import cv2
import numpy as np
import base64

from .auto_crop import auto_crop_whitespace
from .expand import expand_with_uniform_margin

def detect_bounding_box(
    img: np.ndarray,
    margin: int = 10,
    return_base64: bool = False,
    expand_uniformly: bool = False,
    expand_margin: int = 50
) -> dict:
    """
    1) グレースケール＆二値化し、auto_crop_whitespaceで上下左右の余白をトリミング
       => cropped_img
    2) その範囲に margin ピクセルを足して、元画像上で最終的に切り出し => final_img
       (画像端を超えそうならクリップ)
    3) (option) final_imgを base64 で返す

    * expand_uniformly=True の場合 *
      => final_img を expand_with_uniform_margin() に通し、
         画像外にも上下左右等しい余白を持つ白背景キャンバスに配置する

    補足:
    - margin 指定が大きい場合、画像の境界を超えないようクリップされるため、
      左右/上下でマージン量が異なる場合がある。
    - expand_uniformly=True にすれば必ず "expand_margin" 分だけ均等余白を付与できる。

    戻り値:
    {
      "crop_range": {top, bottom, left, right},
      "margin": <int>,
      "final_box": {x1, y1, x2, y2},
      "expand_uniformly": <bool>,
      "expand_margin": <int>,
      "final_img_base64": "<...>"   # (return_base64=Trueの場合のみ)
    }
    """
    if img is None or img.size == 0:
        raise ValueError("Input image is empty or None")

    # ---- 1) グレースケール + 二値化
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, bin_img = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # ---- 2) auto_crop_whitespace
    top, bottom, left, right = auto_crop_whitespace(bin_img)
    cropped_img = img[top:bottom+1, left:right+1]
    print(f"[DEBUG] cropped_img size: {cropped_img.shape}")

    # ---- marginを考慮した最終切り出し (クリップ含む)
    h, w = bin_img.shape[:2]
    final_top = max(0, top - margin)
    final_bottom = min(h - 1, bottom + margin)
    final_left = max(0, left - margin)
    final_right = min(w - 1, right + margin)

    final_img = img[final_top:final_bottom+1, final_left:final_right+1]
    print(f"[DEBUG] final_img size (after margin={margin}): {final_img.shape}")

    # ---- (option) expand_uniformly
    if expand_uniformly:
        final_img = expand_with_uniform_margin(final_img, expand_margin)
        print(f"[DEBUG] final_img size (after expand_margin={expand_margin}): {final_img.shape}")

    # ---- return data
    result = {
        "crop_range": {
            "top": top,
            "bottom": bottom,
            "left": left,
            "right": right
        },
        "margin": margin,
        "final_box": {
            "x1": final_left,
            "y1": final_top,
            "x2": final_right,
            "y2": final_bottom
        },
        "expand_uniformly": expand_uniformly,
        "expand_margin": expand_margin
    }

    if return_base64:
        _, buffer = cv2.imencode('.png', final_img)
        final_img_b64 = base64.b64encode(buffer).decode('utf-8')
        result["final_img_base64"] = final_img_b64

    return result