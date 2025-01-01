from rest_framework import serializers
from django.contrib.auth import get_user_model

from exam_core.models import (
    ExamCategory,
    ExamCore,
    QuestionCore,
    ChoiceCore,
    AnswerLogCore
)

User = get_user_model()

class ExamCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamCategory
        fields = ['id', 'slug', 'name', 'is_active']
        
class ChoiceCoreSerializer(serializers.ModelSerializer):
    """
    選択肢のシリアライザ。
    デフォルトではquestionの詳細は返さず、questionのIDのみ返却。
    """
    # question = serializers.PrimaryKeyRelatedField(queryset=QuestionCore.objects.all())
    # ↑ FKをIDだけにするならこのまま。詳細をネストしたければ別途NestedSerializerを作る。
    
    class Meta:
        model = ChoiceCore
        fields = [
            'id',
            'question',
            'label',
            'text',
            'images',
            'is_correct',
            'metadata',
        ]


class QuestionCoreSerializer(serializers.ModelSerializer):
    """
    問題のシリアライザ。
    exam の詳細を返す場合は、ExamCoreSerializer をネストする。
    choices をネストして一緒に返す例も示す。
    
    注意: 大量のデータを一度に返すとパフォーマンスに影響が出ることがあるので、
         必要に応じてネストをオプション化したり、別Serializerに分割する。
    """
    # exam = ExamCoreSerializer(read_only=True)      # Examの簡易情報をネスト表示する場合
    # exam_id = serializers.PrimaryKeyRelatedField(queryset=ExamCore.objects.all(), source='exam')
    
    # choices をネスト表示する例 (Question詳細を取得するときに選択肢一覧も返す)
    choices = ChoiceCoreSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuestionCore
        fields = [
            'id',
            'exam',
            'question_text',
            'images',
            'metadata',
            'is_deleted',
            'created_at',
            'updated_at',
            'choices',        # ネストした選択肢一覧
        ]


class ExamCoreSerializer(serializers.ModelSerializer):
    """
    試験マスタのシリアライザ。
    - 関連する問題をネストして返すサンプルコードを含む（コメントアウト）。
    """
    # questions = QuestionCoreSerializer(many=True, read_only=True)
    # ↑ 全問題をネストして返す場合は解除。ただし多い場合はパフォーマンスに注意。

    class Meta:
        model = ExamCore
        fields = [
            'id',
            'key',
            'name',
            'metadata',
            'is_active',
            'created_at',
            'updated_at',
            # 'questions',  # 必要に応じてネスト表示。
        ]


class AnswerLogCoreSerializer(serializers.ModelSerializer):
    """
    回答ログのシリアライザ。
    デフォルトではFKのIDのみ返すが、ユーザ名や問題文などを表示したければ
    ReadOnlyField や Nested Serializer でカスタマイズ可能。
    """
    # user_name = serializers.ReadOnlyField(source='user.username')
    # exam_key = serializers.ReadOnlyField(source='exam.key')
    # question_text = serializers.ReadOnlyField(source='question.question_text')
    # choice_label = serializers.ReadOnlyField(source='choice.label')
    
    class Meta:
        model = AnswerLogCore
        fields = [
            'id',
            'user',
            'exam',
            'question',
            'choice',
            'is_correct',
            'response_time',
            'metadata',
            'created_at',
            'updated_at',
        ]