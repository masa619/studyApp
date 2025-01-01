import numpy as np

def auto_crop_whitespace(bin_image: np.ndarray):
    """
    二値画像(bin_image)の上下左右から、画素値が255(白)の連続部分をカットした
    (top, bottom, left, right) を返す。
    bin_imageは 0/255 の画像を想定。
    """
    h, w = bin_image.shape[:2]

    # 上方向 (top)
    top = 0
    for row in range(h):
        # 行全体が白(=255)かどうかを判定
        if np.all(bin_image[row, :] == 255):
            top += 1
        else:
            break

    # 下方向 (bottom)
    bottom = h - 1
    for row in range(h - 1, -1, -1):
        if np.all(bin_image[row, :] == 255):
            bottom -= 1
        else:
            break

    # 左方向 (left)
    left = 0
    for col in range(w):
        # 列全体が白(=255)かどうかを判定
        if np.all(bin_image[:, col] == 255):
            left += 1
        else:
            break

    # 右方向 (right)
    right = w - 1
    for col in range(w - 1, -1, -1):
        if np.all(bin_image[:, col] == 255):
            right -= 1
        else:
            break

    # 境界値の安全処理
    top = max(top, 0)
    bottom = min(bottom, h - 1)
    left = max(left, 0)
    right = min(right, w - 1)

    return top, bottom, left, right