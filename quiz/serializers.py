from rest_framework import serializers
from .models import Exam, Question, Choice, AnswerLog, UserExamEvaluation, UserQuestionEvaluation


class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = '__all__'


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = '__all__'

class AnswerLogSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField()  # question_id を明示的に受け取る
    selected_choice_id = serializers.CharField(source='selected_choice.key')  # 選択肢キーを受け取る
    selected_choice_key = serializers.CharField(read_only=True)  # キャッシュされたキーをレスポンス用に追加

    class Meta:
        model = AnswerLog
        fields = '__all__'
        extra_kwargs = {
            'is_correct': {'required': False},
            'question': {'required': False},
            'selected_choice': {'required': False},  
        }

    def validate(self, attrs):
        # question_id を取得
        question_id = attrs.get('question_id')
        if not question_id:
            raise serializers.ValidationError({"question_id": "Question ID is required."})

        # Question を取得して attrs に設定
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            raise serializers.ValidationError({"question_id": f"Question with ID {question_id} does not exist."})
        attrs['question'] = question

        # 選択肢を取得して attrs に設定
        selected_choice_key = attrs['selected_choice']['key']
        try:
            selected_choice = Choice.objects.get(key=selected_choice_key, question=question)
        except Choice.DoesNotExist:
            raise serializers.ValidationError({
                "selected_choice": "The selected choice does not belong to the specified question."
            })
        attrs['selected_choice'] = selected_choice
        attrs['selected_choice_key'] = selected_choice.key  # キャッシュとして保存
        return attrs

    def create(self, validated_data):
        # 正誤判定のロジック
        question = validated_data['question']
        selected_choice = validated_data['selected_choice']
        is_correct = (question.answer_key == selected_choice.key)
        validated_data['is_correct'] = is_correct

        # データベースに保存
        return AnswerLog.objects.create(**validated_data)    
    
class UserExamEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserExamEvaluation
        fields = '__all__'


class UserQuestionEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserQuestionEvaluation
        fields = '__all__'