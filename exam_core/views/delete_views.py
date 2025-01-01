from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from exam_core.models import ExamCore, QuestionCore, ChoiceCore


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from exam_core.models import ExamCore, QuestionCore, ChoiceCore

class ExamListDeleteAPIView(APIView):
    """
    GET: ExamCoreの一覧を取得
    DELETE: リクエストボディに「exam_idのリスト」があれば、それらを物理削除
            もしクエリパラメータなどで指定するなら別途実装
    """

    def get(self, request, *args, **kwargs):
        exams = ExamCore.objects.all()
        # 必要に応じて絞り込みや検索、ページネーションなど加えてもOK
        data = []
        for exam in exams:
            data.append({
                "id": exam.id,
                "key": exam.key,
                "name": exam.name,
                # "created_at": exam.created_at.isoformat() if exam.created_at else None,
                # メタデータも出すならここに追加
            })
        return Response(data, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        """
        リクエストボディから exam_id のリストを受け取り、一括削除する例
        
        例:
        DELETE /exam_core/api/exams/
        Body:
        {
            "exam_ids": [123, 124, 125]
        }
        """
        body = request.data
        exam_ids = body.get("exam_ids", [])
        if not isinstance(exam_ids, list):
            return Response({"detail": "exam_ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        deleted_ids = []
        for eid in exam_ids:
            # ひとつずつ削除
            exam_obj = get_object_or_404(ExamCore, pk=eid)
            exam_obj.delete()
            deleted_ids.append(eid)

        return Response({
            "detail": "Exams deleted successfully",
            "deleted_ids": deleted_ids
        }, status=status.HTTP_200_OK)


class QuestionListDeleteAPIView(APIView):
    """
    GET: QuestionCoreの一覧
    DELETE: リクエストボディから question_ids を受け取り、一括削除
    """
    def get(self, request, *args, **kwargs):
        questions = QuestionCore.objects.all()
        data = []
        for q in questions:
            data.append({
                "id": q.id,
                "exam_id": q.exam_id,
                "question_text": q.question_text,
                # ...
            })
        return Response(data, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        """
        Body:
        {
            "question_ids": [10, 11, 12]
        }
        """
        body = request.data
        question_ids = body.get("question_ids", [])
        if not isinstance(question_ids, list):
            return Response({"detail": "question_ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        deleted_ids = []
        for qid in question_ids:
            q_obj = get_object_or_404(QuestionCore, pk=qid)
            q_obj.delete()  # 紐づくChoiceCoreも削除
            deleted_ids.append(qid)

        return Response({
            "detail": "Questions deleted successfully",
            "deleted_ids": deleted_ids
        }, status=status.HTTP_200_OK)


class ChoiceListDeleteAPIView(APIView):
    """
    GET: ChoiceCoreの一覧
    DELETE: リクエストボディから choice_ids を受け取り、一括削除
    """
    def get(self, request, *args, **kwargs):
        choices = ChoiceCore.objects.all()
        data = []
        for c in choices:
            data.append({
                "id": c.id,
                "question_id": c.question_id,
                "label": c.label,
                "text": c.text,
                # ...
            })
        return Response(data, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        """
        Body:
        {
            "choice_ids": [100, 101, 102]
        }
        """
        body = request.data
        choice_ids = body.get("choice_ids", [])
        if not isinstance(choice_ids, list):
            return Response({"detail": "choice_ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        deleted_ids = []
        for cid in choice_ids:
            c_obj = get_object_or_404(ChoiceCore, pk=cid)
            c_obj.delete()
            deleted_ids.append(cid)

        return Response({
            "detail": "Choices deleted successfully",
            "deleted_ids": deleted_ids
        }, status=status.HTTP_200_OK)