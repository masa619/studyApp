from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from exam_core.models import ExamCategory, ExamCore, QuestionCore, ChoiceCore
from exam_core.serializers.serializers import (
    ExamCategorySerializer,
    ExamCoreSerializer,
    QuestionCoreSerializer,
    ChoiceCoreSerializer
)


class AllExamCategoryListAPIView(APIView):
    """
    1) 試験カテゴリをすべて一覧で返す
    GET /exam_core/api/v2/all-categories/
    """
    def get(self, request, *args, **kwargs):
        categories = ExamCategory.objects.all().order_by('id')
        serializer = ExamCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CategoryExamListV2APIView(APIView):
    """
    2) 指定カテゴリslugから、紐づくExamCore一覧を返す
    GET /exam_core/api/v2/categories/<slug:cat_slug>/exams/
    """
    def get(self, request, cat_slug, *args, **kwargs):
        category = get_object_or_404(ExamCategory, slug=cat_slug)
        exams = ExamCore.objects.filter(category=category).order_by('id')
        serializer = ExamCoreSerializer(exams, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ExamDetailAPIView(APIView):
    """
    3) 指定Examの詳細(問題・選択肢含む)を返す
    GET /exam_core/api/v2/exams/<int:exam_id>/
    """
    def get(self, request, exam_id, *args, **kwargs):
        exam_obj = get_object_or_404(ExamCore, pk=exam_id)
        
        # Examに紐づく問題一覧を取得
        questions = QuestionCore.objects.filter(exam=exam_obj).order_by('question_no')
        
        # ExamとQuestionsを組み合わせてレスポンスを作成
        exam_data = ExamCoreSerializer(exam_obj).data
        questions_data = QuestionCoreSerializer(questions, many=True).data
        
        # ExamDataに問題一覧を追加
        exam_data['questions'] = questions_data
        
        return Response(exam_data, status=status.HTTP_200_OK)