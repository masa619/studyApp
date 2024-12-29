# ocr_app/models.py

from django.db import models
from django.utils import timezone

class InputJSON(models.Model):
    """
    ユーザーがWebからアップロードしたJSONファイルを
    そのままDBに保持するだけのシンプルなモデル。
    """
    description = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="任意の論理名など、ユーザーが付ける説明"
    )
    json_data = models.JSONField(
        null=False,
        blank=False,
        help_text="アップロードされたJSONの中身"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"InputJSON (id={self.pk}, desc={self.description})"


class OCRResult(models.Model):
    """
    1レコードにつき1画像のOCR結果を扱う想定。

    - image_path: 画像ファイルパス（ユニークにして二重実行回避）
    - vision_api_response: Vision APIのレスポンス全体を保存
    - full_text: textAnnotations[0].description など抽出テキスト
    - avg_confidence: wordレベルの平均confidence (0.0 ~ 1.0)
    - status: 'pending' / 'done' / 'error' 等
    - error_message: Vision APIエラー発生時の内容
    """

    image_path = models.CharField(
        max_length=500,
        unique=True,
        blank=True,
        null=True,
        help_text="OCR対象の画像ファイルパス（ユニークにして二重実行を回避できる）"
    )

    vision_api_response = models.JSONField(
        null=True,
        blank=True,
        help_text="Vision APIのレスポンスをまるっと保持"
    )

    full_text = models.TextField(
        null=True,
        blank=True,
        help_text="textAnnotations[0].description など全文"
    )
    normalized_text = models.TextField(
        null=True,
        blank=True,
        help_text="ノーマライズ済みテキスト"
    )
    avg_confidence = models.FloatField(
        default=0.0,
        help_text="wordレベル平均confidence"
    )

    status = models.CharField(
        max_length=50,
        default='pending',
        help_text="OCR実行状態: pending|done|error など"
    )
    error_message = models.TextField(
        null=True,
        blank=True,
        help_text="Vision APIエラー発生時のメッセージ"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def mark_done(self, response_dict, confidence=0.0, text=""):
        """
        Vision API完了後に呼ばれるメソッド:
        - vision_api_response を受け取り
        - avg_confidence, full_text を更新
        - status='done' に設定
        """
        self.vision_api_response = response_dict
        self.avg_confidence = confidence
        self.full_text = text
        self.status = 'done'
        self.save()

    def mark_error(self, error_msg):
        """
        Vision APIエラー時に呼ばれるメソッド:
        - status='error'
        - error_message にメッセージをセット
        """
        self.status = 'error'
        self.error_message = error_msg
        self.save()

    def __str__(self):
        return f"OCRResult(image_path={self.image_path}, status={self.status})"