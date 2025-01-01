from django.contrib import admin
from .models import ExamCategory, ExamCore, QuestionCore, ChoiceCore


@admin.register(ExamCategory)
class ExamCategoryAdmin(admin.ModelAdmin):
    """
    大きな試験カテゴリ(例: 第2種電気工事士)を管理するAdmin。
    'is_active' をリスト編集可能にして、一覧画面からON/OFF切り替えできるようにする。
    """
    list_display = ('id', 'slug', 'name', 'is_active')
    list_editable = ('is_active',)  # 一覧で直接有効/無効を編集可能
    search_fields = ('slug', 'name')
    list_filter = ('is_active',)
    ordering = ('id',)
    actions = ['delete_selected']


@admin.register(ExamCore)
class ExamCoreAdmin(admin.ModelAdmin):
    """
    年度別試験(ExamCore)を管理するAdmin。
    例: 2024年度第2種電気工事士
    """
    list_display = ('id', 'category', 'key', 'name', 'is_active')
    list_editable = ('is_active',)  # 一覧上で有効/無効を切り替え
    list_filter = ('category', 'is_active')
    search_fields = ('key', 'name')
    ordering = ('id',)
    # metadata(JSONField)を管理画面に表示したい場合は、raw_id_fieldsなど検討してください。


@admin.register(QuestionCore)
class QuestionCoreAdmin(admin.ModelAdmin):
    """
    問題(QuestionCore)を管理するAdmin。
    ここでは 'is_deleted' などが論理削除用にある場合は、それを表示して操作可能に。
    """
    list_display = ('id', 'exam', 'question_text', 'is_deleted')
    list_filter = ('exam', 'is_deleted')
    search_fields = ('question_text',)
    ordering = ('id',)
    # is_deleted を有効/無効で使うなら、list_editable に追加してもOK。


@admin.register(ChoiceCore)
class ChoiceCoreAdmin(admin.ModelAdmin):
    """
    選択肢(ChoiceCore)を管理するAdmin。
    """
    list_display = ('id', 'question', 'label', 'text', 'is_correct')
    list_filter = ('question', 'is_correct')
    search_fields = ('label', 'text')
    ordering = ('id',)