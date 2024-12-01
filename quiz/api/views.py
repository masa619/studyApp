from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets
from ..models import Exam, Question, Choice, AnswerLog, UserExamEvaluation, UserQuestionEvaluation
from ..serializers import (
    ExamSerializer, QuestionSerializer, ChoiceSerializer,
    AnswerLogSerializer, UserExamEvaluationSerializer, UserQuestionEvaluationSerializer
)
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..services.quiz_service import QuizService

class QuizAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.quiz_service = QuizService()

    def get(self, request):
        exam_id = request.query_params.get('examId')
        mode = request.query_params.get('mode', 'normal')
        sub_mode = request.query_params.get('subMode', 'sequential')
        print(f"mode: {mode}, subMode: {sub_mode}")

        if not exam_id:
            return Response({'error': 'examId is required'}, status=400)
        
        VALID_MODES = ['normal', 'unanswered']
        VALID_SUB_MODES = ['sequential', 'ai']
        
        if mode not in VALID_MODES:
            return Response({'error': 'Invalid mode value'}, status=400)
        
        if sub_mode not in VALID_SUB_MODES:
            return Response({'error': 'Invalid subMode value'}, status=400)
        
        try:
            questions = self.quiz_service.get_questions(
                exam_id=exam_id,
                mode=mode,
                sub_mode=sub_mode,
                user=request.user
            )
            
            if not questions.exists():
                return Response(
                    {'error': f'No questions found for examId {exam_id}'}, 
                    status=404
                )

            data = self.quiz_service.format_question_data(questions)
            return Response(data)

        except ValueError:
            return Response({'error': 'Invalid examId'}, status=400)
    
class ExamViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer

    @action(detail=False, methods=['get'], url_path='key/(?P<key>[^/]+)')
    def get_by_key(self, request, key=None):
        """
        カスタムアクション: key を指定して Exam を取得
        """
        try:
            exam = Exam.objects.get(key=key)
            serializer = self.get_serializer(exam)
            return Response(serializer.data)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=404)


class QuestionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Question.objects.filter(is_deleted=False)
    serializer_class = QuestionSerializer


class ChoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer


class AnswerLogView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # ユーザー情報を含めてシリアライザにデータを渡す
        data = request.data.copy()
        data['user'] = request.user.id  # 認証されたユーザーを設定

        # デバッグログ: リクエストデータの出力
        print(f"Received data: {data}")

        serializer = AnswerLogSerializer(data=data)

        if serializer.is_valid():
            try:
                serializer.save(user=request.user)  # request.user を AnswerLog に登録
                # デバッグログ: 正常に保存できた場合
                print(f"AnswerLog saved successfully: {serializer.data}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                # デバッグログ: 保存時のエラー
                print(f"Error saving AnswerLog: {e}")
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # デバッグログ: シリアライザのエラー
            print(f"Serializer errors: {serializer.errors}")

        # バリデーションエラー時のレスポンス
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserExamEvaluationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = UserExamEvaluation.objects.all()
    serializer_class = UserExamEvaluationSerializer


class UserQuestionEvaluationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = UserQuestionEvaluation.objects.all()
    serializer_class = UserQuestionEvaluationSerializer
