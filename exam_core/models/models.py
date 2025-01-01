from django.db import models
from django.contrib.auth import get_user_model
from datetime import timedelta

User = get_user_model()

class ExamCategory(models.Model):
    """
    大きな試験カテゴリを表す:
    例: "第２種電気工事士" という１つのカテゴリ
    - is_active: ここをFalseにすると、この試験カテゴリそのものを無効化 (運用停止) できる
    """
    slug = models.SlugField(max_length=100, unique=True, verbose_name="試験カテゴリSLUG")
    name = models.CharField(max_length=255, verbose_name="試験カテゴリ名")
    is_active = models.BooleanField(default=True, verbose_name="有効フラグ")

    class Meta:
        verbose_name = "試験カテゴリ"
        verbose_name_plural = "試験カテゴリ一覧"

    def __str__(self):
        return self.name

class ExamCore(models.Model):

    """
    個別の試験(年度単位など)を表す。
    例: 2024年度 第２種電気工事士試験
    """
    category = models.ForeignKey(
        ExamCategory,
        on_delete=models.CASCADE,
        related_name="exams",
        verbose_name="試験カテゴリ",
        default=99
    )
    key = models.CharField(max_length=100, unique=True, verbose_name="試験識別キー")
    name = models.CharField(max_length=255, verbose_name="試験名")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="試験メタデータ")
    is_active = models.BooleanField(default=True, verbose_name="有効フラグ")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")
    class Meta:
        verbose_name = "汎用試験"
        verbose_name_plural = "汎用試験一覧"

    def __str__(self):
        return f"{self.name} ({self.key})"


class QuestionCore(models.Model):
    """
    問題モデル（汎用）。
    - exam: 紐づく試験 (ExamCore)
    - question_text: 問題文（言語対応や詳細はフロント側で行うか、別フィールドで管理）
    - images: 複数画像を配列で保持できるようJSONField化
    - metadata: 問題ごとの拡張用JSON (例: 難易度, 問題番号, 分野タグ, など)
    - is_deleted: 論理削除
    """
    exam = models.ForeignKey(
        ExamCore,
        on_delete=models.CASCADE,
        related_name="questions",
        verbose_name="関連試験"
    )
    question_no = models.PositiveIntegerField(
        verbose_name="問題番号",
        default=0,
        help_text="各試験内でユニークになるよう管理する"
    )
    question_text = models.TextField(verbose_name="問題文")
    images = models.JSONField(default=list, blank=True, verbose_name="問題画像一覧")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="問題メタデータ")
    is_deleted = models.BooleanField(default=False, verbose_name="削除フラグ")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        verbose_name = "汎用問題"
        verbose_name_plural = "汎用問題一覧"
        indexes = [
            models.Index(fields=["exam"]),
        ]
        unique_together = (('exam', 'question_no'),)

    def __str__(self):
        return f"[Exam: {self.exam.key}] Q: {self.question_text[:30]}"


class ChoiceCore(models.Model):
    """
    選択肢モデル（汎用）。
    - question: 紐づく問題 (QuestionCore)
    - label: 表示用ラベル(イ, ロ, ハ, ニ など試験毎に異なる文字列を直接格納)
    - text: 選択肢の本文
    - images: 選択肢に紐づく画像を複数保持する場合に備えてJSONField
    - is_correct: 1問1正解の場合に使用するフラグ (マルチアンサーの場合は別管理でもOK)
    - metadata: 拡張用JSON
    """
    question = models.ForeignKey(
        QuestionCore,
        on_delete=models.CASCADE,
        related_name="choices",
        verbose_name="関連する問題"
    )
    label = models.CharField(max_length=10, verbose_name="選択肢ラベル")
    text = models.TextField(verbose_name="選択肢本文")
    images = models.JSONField(default=list, blank=True, verbose_name="選択肢画像一覧")
    is_correct = models.BooleanField(default=False, verbose_name="正解フラグ")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="選択肢メタデータ")

    class Meta:
        verbose_name = "汎用選択肢"
        verbose_name_plural = "汎用選択肢一覧"
        indexes = [
            models.Index(fields=["question"]),
        ]

    def __str__(self):
        return f"Q({self.question.id}) - Choice [{self.label}]"


class AnswerLogCore(models.Model):
    """
    回答ログの汎用モデル。
    - user: 回答者
    - exam: どの試験か
    - question: どの問題か
    - choice: 選択した選択肢
    - is_correct: 正解かどうか
    - response_time: 回答にかかった時間
    - metadata: ログとして残したい付加情報（セッションID等）
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name="ユーザー",
        db_index=True
    )
    exam = models.ForeignKey(
        ExamCore,
        on_delete=models.CASCADE,
        verbose_name="関連試験",
        db_index=True
    )
    question = models.ForeignKey(
        QuestionCore,
        on_delete=models.CASCADE,
        verbose_name="関連問題",
        db_index=True
    )
    choice = models.ForeignKey(
        ChoiceCore,
        on_delete=models.CASCADE,
        verbose_name="選択された選択肢",
        db_index=True
    )
    is_correct = models.BooleanField(verbose_name="正解かどうか", default=False)
    response_time = models.DurationField(
        null=True, blank=True,
        verbose_name="解答時間"
    )
    metadata = models.JSONField(default=dict, blank=True, verbose_name="回答メタデータ")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="回答日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        verbose_name = "汎用回答ログ"
        verbose_name_plural = "汎用回答ログ一覧"
        indexes = [
            models.Index(fields=["user", "exam"]),
            models.Index(fields=["question"]),
            models.Index(fields=["choice"]),
        ]

    def __str__(self):
        return (
            f"{self.user.username} | Exam={self.exam.key} | QID={self.question.id} "
            f"| Choice={self.choice.label} | Correct={self.is_correct}"
        )