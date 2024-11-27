from django.conf import settings
from django.db import models
from datetime import timedelta


class Exam(models.Model):
    """試験マスタ"""
    key = models.CharField(max_length=50, unique=True, verbose_name="試験識別キー")
    name = models.CharField(max_length=200, verbose_name="試験名")
    category = models.CharField(max_length=100, verbose_name="カテゴリ", null=True, blank=True)
    description = models.TextField(null=True, blank=True, verbose_name="試験説明")
    is_active = models.BooleanField(default=True, verbose_name="有効フラグ")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def __str__(self):
        return f"{self.name} ({self.key})"


class Question(models.Model):
    """問題を表すモデル（試験マスタ対応、論理削除対応）"""
    no = models.IntegerField(unique=True, verbose_name="問題番号")
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, verbose_name="関連試験")
    question_text_en = models.TextField(verbose_name="問題文（英語）")
    question_text_ja = models.TextField(verbose_name="問題文（日本語）")
    answer_key = models.CharField(max_length=1, verbose_name="正解キー")
    community_vote_distribution = models.CharField(max_length=100, null=True, blank=True, verbose_name="投票分布")
    page_images = models.JSONField(default=list, verbose_name="関連画像ファイル名", blank=True)
    explanation_en = models.JSONField(default=list, verbose_name="解説（英語）", blank=True)
    explanation_ja = models.JSONField(default=list, verbose_name="解説（日本語）", blank=True)
    keywords = models.JSONField(default=list, verbose_name="キーワード", blank=True)
    is_deleted = models.BooleanField(default=False, verbose_name="削除フラグ")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def __str__(self):
        return f"試験 {self.exam.key} - 問題 {self.no}: {self.question_text_ja[:50]}"

    @classmethod
    def active(cls):
        """論理削除されていない問題を取得"""
        return cls.objects.filter(is_deleted=False)


class Choice(models.Model):
    """選択肢を表すモデル"""
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE, verbose_name="関連する問題")
    key = models.CharField(max_length=1, verbose_name="選択肢キー")
    choice_text_en = models.TextField(verbose_name="選択肢のテキスト（英語）")
    choice_text_ja = models.TextField(verbose_name="選択肢のテキスト（日本語）")
    image = models.ImageField(upload_to='choice_images/', null=True, blank=True, verbose_name="選択肢の画像")

    def __str__(self):
        return f"問題 {self.question.no} - 選択肢 {self.key}"


class AnswerLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="ユーザー", db_index=True)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, verbose_name="関連する問題", db_index=True)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, verbose_name="関連試験", db_index=True)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, verbose_name="選択された選択肢", db_index=True)
    selected_choice_key = models.CharField(max_length=1, verbose_name="選択された選択肢キー", null=True, blank=True)
    is_correct = models.BooleanField(verbose_name="正解かどうか")
    response_time = models.DurationField(null=True, blank=True, verbose_name="解答時間")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="回答日時")

    def save(self, *args, **kwargs):
        if self.selected_choice and not self.selected_choice_key:
            self.selected_choice_key = self.selected_choice.key
        super().save(*args, **kwargs)


class UserExamEvaluation(models.Model):
    """試験ごとのパフォーマンス"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="ユーザー")
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, verbose_name="関連試験")
    total_correct = models.PositiveIntegerField(default=0, verbose_name="正解回数")
    total_incorrect = models.PositiveIntegerField(default=0, verbose_name="不正解回数")
    average_response_time = models.DurationField(null=True, blank=True, verbose_name="平均解答時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def update_performance(self):
        """回答履歴から試験の成績を更新"""
        responses = AnswerLog.objects.filter(user=self.user, exam=self.exam, question__is_deleted=False)
        self.total_correct = responses.filter(is_correct=True).count()
        self.total_incorrect = responses.filter(is_correct=False).count()
        total_responses = self.total_correct + self.total_incorrect
        self.average_response_time = (
            sum((r.response_time for r in responses if r.response_time), timedelta()) / total_responses
            if total_responses > 0 else None
        )
        self.save()

    def __str__(self):
        return f"ユーザー: {self.user.username}, 試験 {self.exam.key}, 正解率: {self.accuracy}%"

    @property
    def accuracy(self):
        """正解率を計算"""
        total_responses = self.total_correct + self.total_incorrect
        return (self.total_correct / total_responses * 100) if total_responses > 0 else 0.0


class UserQuestionEvaluation(models.Model):
    """問題ごとのパフォーマンスを記録するモデル（試験情報対応）"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name="ユーザー"
    )
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        verbose_name="関連試験"
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE, verbose_name="関連する問題")
    total_attempts = models.PositiveIntegerField(default=0, verbose_name="試行回数")
    correct_attempts = models.PositiveIntegerField(default=0, verbose_name="正解回数")
    incorrect_attempts = models.PositiveIntegerField(default=0, verbose_name="不正解回数")
    average_response_time = models.DurationField(null=True, blank=True, verbose_name="平均解答時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def update_performance(self, is_correct, response_time):
        """問題ごとのパフォーマンスを更新"""
        self.total_attempts += 1
        if is_correct:
            self.correct_attempts += 1
        else:
            self.incorrect_attempts += 1

        # 平均解答時間の更新
        if response_time is not None:
            total_time = (self.average_response_time or timedelta()) * (self.total_attempts - 1)
            self.average_response_time = (total_time + response_time) / self.total_attempts

        self.save()

    def __str__(self):
        return f"ユーザー: {self.user.username}, 試験 {self.exam.key}, 問題 {self.question.no} - 正解率: {self.accuracy}%"

    @property
    def accuracy(self):
        """正解率を計算"""
        if self.total_attempts == 0:
            return 0.0
        return (self.correct_attempts / self.total_attempts) * 100


class UserSession(models.Model):
    """試験進捗を記録するモデル"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="ユーザー")
    exam = models.ForeignKey('Exam', on_delete=models.CASCADE, verbose_name="関連試験")
    current_question = models.ForeignKey('Question', null=True, blank=True, on_delete=models.SET_NULL, verbose_name="現在の問題")
    progress = models.JSONField(default=dict, verbose_name="進捗データ")  # 回答済み問題と選択肢をJSONで保存
    is_completed = models.BooleanField(default=False, verbose_name="試験終了フラグ")
    started_at = models.DateTimeField(auto_now_add=True, verbose_name="開始日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def __str__(self):
        return f"ユーザー: {self.user.username}, 試験: {self.exam.key}, 完了: {self.is_completed}"
    
class QuestionPerformance(models.Model):
    question = models.OneToOneField(Question, on_delete=models.CASCADE, verbose_name="関連する問題")
    total_attempts = models.PositiveIntegerField(default=0, verbose_name="試行回数")
    correct_attempts = models.PositiveIntegerField(default=0, verbose_name="正解回数")
    incorrect_attempts = models.PositiveIntegerField(default=0, verbose_name="不正解回数")
    common_wrong_choices = models.JSONField(default=dict, verbose_name="よく間違える選択肢")  # 例: {"A": 10, "B": 5}
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def update_performance(self):
        """問題ごとのパフォーマンスを更新"""
        logs = AnswerLog.objects.filter(question=self.question)
        self.total_attempts = logs.count()
        self.correct_attempts = logs.filter(is_correct=True).count()
        self.incorrect_attempts = logs.filter(is_correct=False).count()

        # よく間違える選択肢の集計
        wrong_logs = logs.filter(is_correct=False)
        choice_counts = wrong_logs.values('selected_choice_key').annotate(count=models.Count('id'))
        self.common_wrong_choices = {
            entry['selected_choice_key']: entry['count'] for entry in choice_counts
        }

        self.save()