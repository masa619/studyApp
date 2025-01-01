from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.shortcuts import get_object_or_404

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

    areas[] の中身例:
      {
        "question_element": {
          "text": "問題文",
          "image_paths": ["/path/q1.png"]
        },
        "answer": "イ",
        "options_element": {
          "options_dict": {
            "イ": { "text": "2", "image_paths": ["/path/choice_i.png"] },
            "ロ": { "text": "3", "image_paths": [] },
            ...
          }
        },
        "question_image_path": "/some_path.png",             // 単独で入れている場合あり
        "options_image_path": "/some_options_path.png",      // 同上
        ...
      }
    """

    @transaction.atomic
    def post(self, request, exam_id=None, *args, **kwargs):
        data = request.data

        # 1) areas: OCRで抽出した問題群
        areas = data.get("areas")
        if not areas:
            return Response({"detail": "'areas' is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 2) categorySlug: どのカテゴリ(ExamCategory)に紐づけるか
        category_slug = data.get("categorySlug")
        if not category_slug:
            return Response({"detail": "'categorySlug' is required"}, status=status.HTTP_400_BAD_REQUEST)

        # カテゴリを取得
        category_obj = get_object_or_404(ExamCategory, slug=category_slug)

        # 3) examKey, examName: 新規Exam作成時に必須
        examKey = data.get("examKey")
        examName = data.get("examName")

        # 4) 新規 or 既存Exam の分岐
        if exam_id is not None:
            # 既存Examを上書き (category, examKey, examNameなど更新する)
            exam_obj = get_object_or_404(ExamCore, pk=exam_id)
            # カテゴリも上書き
            exam_obj.category = category_obj
            if examKey:
                exam_obj.key = examKey
            if examName:
                exam_obj.name = examName
            exam_obj.save()
            creating_new_exam = False
        else:
            # 新規ExamCore
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

        # 5) areasをループして問題/選択肢を登録
        created_questions = []

        for area in areas:
            # ---------------------------
            # (A) QuestionCore の作成
            # ---------------------------
            no_str = area.get("No")
            question_element = area.get("question_element", {})
            question_text = question_element.get("text", "")
            if no_str is None :
              return Response({"detail": "No is required"}, status=status.HTTP_400_BAD_REQUEST)
            question_no = int(no_str)
            # ここで "question_element.image_paths" や "question_image_path" をまとめて取得
            question_image_paths = []
            # 1) question_element内のimage_paths
            if "image_paths" in question_element:
                question_image_paths.extend(question_element["image_paths"])

            # 2) area["question_image_path"] があれば追加
            if area.get("question_image_path"):
                question_image_paths.append(area["question_image_path"])

            # 例: "area_image_path", "no_image_path" など別途考慮するならここで追加

            question_obj = QuestionCore.objects.create(
                exam=exam_obj,
                question_no=question_no,
                question_text=question_text,
                images=question_image_paths,  # モデルの JSONField に配列として保存
            )

            # ---------------------------
            # (B) ChoiceCore の作成
            # ---------------------------
            answer_label = area.get("answer")
            options_element = area.get("options_element", {})
            options_dict = options_element.get("options_dict", {})

            for label_key, opt_data in options_dict.items():
                choice_text = opt_data.get("text", "")

                # もし "image_paths" があるなら取り出す
                choice_image_paths = opt_data.get("image_paths", [])

                # ここで "options_image_path" が共通項目としてある場合、追加で入れるなど:
                # if area.get("options_image_path"):
                #     choice_image_paths.append(area["options_image_path"])

                ChoiceCore.objects.create(
                    question=question_obj,
                    label=label_key,
                    text=choice_text,
                    images=choice_image_paths,  # JSONField
                    is_correct=(label_key == answer_label),
                )

            created_questions.append(question_obj.id)

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