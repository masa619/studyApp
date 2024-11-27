from ..models import Question, AnswerLog, Choice

class QuizRepository:
    @staticmethod
    def get_questions_by_exam(exam_id: int, user=None):
        return Question.objects.filter(exam_id=exam_id, is_deleted=False)
    
    @staticmethod
    def get_unanswered_questions(exam_id: int, user):
        # 正解済みの質問IDを取得（is_correct=Trueのもの）
        correctly_answered_questions = AnswerLog.objects.filter(
            user=user,
            question__exam_id=exam_id,
            is_correct=True
        ).values_list('question_id', flat=True)
        
        # 未回答または不正解の質問を取得
        return Question.objects.filter(
            exam_id=exam_id, 
            is_deleted=False
        ).exclude(id__in=correctly_answered_questions)

    def get_choices_for_question(self, question):
        """
        Retrieve all choices associated with a specific question.
        """
        return Choice.objects.filter(question=question).order_by('key')