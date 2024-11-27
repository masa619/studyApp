# Generated by Django 5.1.3 on 2024-11-19 00:55

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Exam',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=50, unique=True, verbose_name='試験識別キー')),
                ('name', models.CharField(max_length=200, verbose_name='試験名')),
                ('category', models.CharField(blank=True, max_length=100, null=True, verbose_name='カテゴリ')),
                ('description', models.TextField(blank=True, null=True, verbose_name='試験説明')),
                ('is_active', models.BooleanField(default=True, verbose_name='有効フラグ')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='作成日時')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新日時')),
            ],
        ),
        migrations.CreateModel(
            name='Question',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('no', models.IntegerField(unique=True, verbose_name='問題番号')),
                ('question_text_en', models.TextField(verbose_name='問題文（英語）')),
                ('question_text_ja', models.TextField(verbose_name='問題文（日本語）')),
                ('explanation_en', models.TextField(blank=True, null=True, verbose_name='解説（英語）')),
                ('explanation_ja', models.TextField(blank=True, null=True, verbose_name='解説（日本語）')),
                ('answer_key', models.CharField(max_length=1, verbose_name='正解キー')),
                ('is_deleted', models.BooleanField(default=False, verbose_name='削除フラグ')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='作成日時')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新日時')),
                ('exam', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='quiz.exam', verbose_name='関連試験')),
            ],
        ),
        migrations.CreateModel(
            name='Choice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=1, verbose_name='選択肢キー')),
                ('choice_text_en', models.TextField(verbose_name='選択肢のテキスト（英語）')),
                ('choice_text_ja', models.TextField(verbose_name='選択肢のテキスト（日本語）')),
                ('image', models.ImageField(blank=True, null=True, upload_to='choice_images/', verbose_name='選択肢の画像')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='choices', to='quiz.question', verbose_name='関連する問題')),
            ],
        ),
        migrations.CreateModel(
            name='AnswerLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_correct', models.BooleanField(verbose_name='正解かどうか')),
                ('response_time', models.DurationField(blank=True, null=True, verbose_name='解答時間')),
                ('timestamp', models.DateTimeField(auto_now_add=True, verbose_name='回答日時')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='ユーザー')),
                ('selected_choice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='quiz.choice', verbose_name='選択された選択肢')),
                ('exam', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='quiz.exam', verbose_name='関連試験')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='quiz.question', verbose_name='関連する問題')),
            ],
        ),
        migrations.CreateModel(
            name='UserExamEvaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_correct', models.PositiveIntegerField(default=0, verbose_name='正解回数')),
                ('total_incorrect', models.PositiveIntegerField(default=0, verbose_name='不正解回数')),
                ('average_response_time', models.DurationField(blank=True, null=True, verbose_name='平均解答時間')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新日時')),
                ('exam', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='quiz.exam', verbose_name='関連試験')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='ユーザー')),
            ],
        ),
        migrations.CreateModel(
            name='UserQuestionEvaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_attempts', models.PositiveIntegerField(default=0, verbose_name='試行回数')),
                ('correct_attempts', models.PositiveIntegerField(default=0, verbose_name='正解回数')),
                ('incorrect_attempts', models.PositiveIntegerField(default=0, verbose_name='不正解回数')),
                ('average_response_time', models.DurationField(blank=True, null=True, verbose_name='平均解答時間')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新日時')),
                ('exam', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='quiz.exam', verbose_name='関連試験')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='quiz.question', verbose_name='関連する問題')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='ユーザー')),
            ],
        ),
    ]
