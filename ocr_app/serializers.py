# ocr_app/serializers.py

from rest_framework import serializers
from .models import OCRResult

class OCRResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = OCRResult
        fields = [
            'id',
            'image_path',
            'vision_api_response',
            'full_text',
            'avg_confidence',
            'status',
            'error_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']