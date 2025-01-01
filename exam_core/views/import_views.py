from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.utils import IntegrityError

from exam_core.models import ExamCategory, ExamCore, QuestionCore, ChoiceCore
from exam_core.serializers.serializers import ExamCategorySerializer, ExamCoreSerializer

class ExamCategoryListAPIView(APIView):
    """
    GET /exam_core/api/categories/
      -> 全カテゴリ一覧を返す

    GET /exam_core/api/categories/?category_id=<int>
      -> 指定IDのカテゴリを1件返す

    GET /exam_core/api/categories/?slug=<str>
      -> 指定slugのカテゴリを1件返す

    どちらも指定があれば優先度: category_id > slug (例: 同時指定はお好みでエラーorID優先など要件に合わせる)
    """

    def get(self, request, *args, **kwargs):
        category_id = request.query_params.get("category_id")
        slug = request.query_params.get("slug")

        # 1) category_id が指定されていれば、1件取得
        if category_id is not None:
            category = get_object_or_404(ExamCategory, pk=category_id)
            serializer = ExamCategorySerializer(category)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # 2) slug が指定されていれば、1件取得
        if slug is not None:
            category = get_object_or_404(ExamCategory, slug=slug)
            serializer = ExamCategorySerializer(category)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # 3) パラメータ指定なし -> 一覧を返却
        categories = ExamCategory.objects.all().order_by('id')
        serializer = ExamCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CategoryExamListAPIView(APIView):
    """
    GET /exam_core/api/categories/<slug:cat_slug>/exams/
    -> そのカテゴリに紐づくExamCore[] を返す
    """
    def get(self, request, cat_slug, *args, **kwargs):
        category = get_object_or_404(ExamCategory, slug=cat_slug)
        exams = ExamCore.objects.filter(category=category).order_by('id')
        serializer = ExamCoreSerializer(exams, many=True)
        return Response(serializer.data, status=200)

class ImportAreasAPIView(APIView):
    """
    POST:
      - /exam_core/api/import-areas/ (新規Exam)
         Body: 
           {
             "areas": [...],
             "categorySlug": "electrician_2nd",
             "examKey": "2024",
             "examName":"..."
           }
      - /exam_core/api/import-areas/<exam_id>/ (既存Exam更新)
         Body: 
           {
             "areas": [...],
             "categorySlug": "...",
             "examKey": "...", (optional)
             "examName": "..." (optional)
           }

    ※ JSONサンプル:
    {
      "areas": [
        {
          "No": "1",
          "answer": "ロ",
          "options_element": {
            "options_dict": {
              "イ": { "text": "1", "image_paths": [] },
              "ニ": { "text": "4", "image_paths": [] },
              "ハ": { "text": "3", "image_paths": [] },
              "ロ": { "text": "2", "image_paths": [] }
            }
          },
          "question_element": {
            "text": "問題文",
            "image_paths": ["/path/q1.png"]
          },
          "...(他の無視する項目)..."
        },
        ...
      ],
      "categorySlug": "...",
      "examKey": "...",
      "examName": "..."
    }
    """

    @transaction.atomic
    def post(self, request, exam_id=None, *args, **kwargs):
        data = request.data

        # 1) areas
        areas = data.get("areas")
        if not areas:
            return Response({"detail": "'areas' is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 2) categorySlug
        category_slug = data.get("categorySlug")
        if not category_slug:
            return Response({"detail": "'categorySlug' is required"}, status=status.HTTP_400_BAD_REQUEST)

        category_obj = get_object_or_404(ExamCategory, slug=category_slug)

        # 3) examKey, examName
        examKey = data.get("examKey")
        examName = data.get("examName")

        # 4) 新規 or 既存Exam
        if exam_id is not None:
            # 既存Examを上書き
            exam_obj = get_object_or_404(ExamCore, pk=exam_id)
            exam_obj.category = category_obj
            if examKey:
                exam_obj.key = examKey
            if examName:
                exam_obj.name = examName
            exam_obj.save()
            creating_new_exam = False
        else:
            # 新規Exam作成
            if not examKey or not examName:
                return Response(
                    {"detail": "examKey and examName are required for new exam."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            exam_obj = ExamCore.objects.create(
                category=category_obj,
                key=examKey,
                name=examName,
            )
            creating_new_exam = True

        created_questions = []

        # --------------------------------------------------------------------
        #  (メイン) areas配列の要素をループ
        # --------------------------------------------------------------------
        for area in areas:
            # ※ area_id, area_bbox, no_image_path, area_image_path, ...
            #    options_image_path, question_image_path ... は無視

            #  (A) No
            no_str = area.get("No")
            if no_str is None:
                return Response({"detail": "No is required"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                question_no = int(no_str)
            except ValueError:
                return Response({"detail": f"Invalid No: {no_str}"}, status=status.HTTP_400_BAD_REQUEST)

            #  (B) question_element
            question_element = area.get("question_element", {})
            question_text = question_element.get("text")  # text は必須
            if not question_text:
                return Response({"detail": f"question_element.text is required (No={no_str})"}, status=status.HTTP_400_BAD_REQUEST)
            question_image_paths = question_element.get("image_paths", [])  # 画像なしケースあり

            #  QuestionCore作成
            question_obj = QuestionCore.objects.create(
                exam=exam_obj,
                question_no=question_no,
                question_text=question_text,
                images=question_image_paths,  # JSONFieldに格納
            )

            #  (C) answer
            answer_label = area.get("answer")  # 'イ' 'ロ' 'ハ' 'ニ'など
            # もし answer が必須でなければチェックしない

            #  (D) options_element
            options_element = area.get("options_element", {})
            options_dict = options_element.get("options_dict", {})

            #  (E) ループして ChoiceCore登録
            for label_key, opt_data in options_dict.items():
                choice_text = opt_data.get("text", "")
                choice_image_paths = opt_data.get("image_paths", [])

                try:
                    ChoiceCore.objects.create(
                        question=question_obj,
                        label=label_key,
                        text=choice_text or "",
                        images=choice_image_paths,
                        is_correct=(label_key == answer_label),
                    )
                except IntegrityError as e:
                    return Response({
                        "detail": f"IntegrityError occurred while creating ChoiceCore (No={no_str}, label={label_key}): {str(e)}"
                    }, status=status.HTTP_400_BAD_REQUEST)

            created_questions.append(question_obj.id)

        # 結果レスポンス
        result_msg = "Imported successfully"
        if creating_new_exam:
            result_msg += f" (New ExamCore created: id={exam_obj.id})"

        return Response(
            {
                "detail": result_msg,
                "exam_id": exam_obj.id,
                "created_questions": created_questions
            },
            status=status.HTTP_201_CREATED
        )