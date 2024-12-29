# ocr_app/urls.py

from django.urls import path
from .views import (
    ImportJsonView,
    OCRResultView,
    InputJSONView,
    trigger_ocr,
    detect_bounding_box_api,
    upload_cropped_image_api,
)

urlpatterns = [
    path('import_json/', ImportJsonView.as_view(), name='import-json'),
    path('input_json/', InputJSONView.as_view(), name='input-json-post'),       # POST
    path('input_json/<int:id>/', InputJSONView.as_view(), name='input-json-get'), # GET
    # OCR実行
    path('trigger_ocr', trigger_ocr, name='trigger_ocr'),

    path('ocr_results/', OCRResultView.as_view(), name='ocr-results'),
    path('ocr_results/<int:pk>/', OCRResultView.as_view(), name='ocr_result_detail'),# 個別オブジェクト /api/ocr_results/<id>/
    
    path('detect_bounding_box/', detect_bounding_box_api, name='detect-bounding-box'),
    path('upload_cropped_image/', upload_cropped_image_api, name='upload-cropped-image'),
    
]