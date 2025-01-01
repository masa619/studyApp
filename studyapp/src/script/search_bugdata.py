import os
import re
import sys
from pathlib import Path
from dotenv import load_dotenv

# プロジェクトのルート設定
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

# 環境設定
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
env_file = BASE_DIR / f'.env.{ENVIRONMENT}'
load_dotenv(dotenv_path=env_file)

# Django設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', f'studyapp.settings.{ENVIRONMENT}')
import django
django.setup()

# モデルのインポート（Django設定後に行う）
from quiz.models import Question, Choice


def contains_japanese(text):
    """Check if text contains Japanese characters"""
    if text is None:
        return False
    # 辞書型の場合は文字列に変換
    if isinstance(text, dict):
        text = str(text)
    return bool(re.search(r'[\u3040-\u30FF\u4E00-\u9FFF]', text))


def check_japanese_content():
    """Check and report missing Japanese translations"""
    missing_data = []

    # Check Questions
    for question in Question.active().order_by('no'):
        missing_fields = []
        if not contains_japanese(question.question_text_ja):
            missing_fields.append("question_text_ja")
        
        explanation = question.explanation_ja
        if isinstance(explanation, list):
            has_japanese = any(contains_japanese(str(text)) for text in explanation)
        else:
            has_japanese = contains_japanese(str(explanation))
        
        if not has_japanese:
            missing_fields.append("explanation_ja")

        if missing_fields:
            missing_data.append({
                "exam_key": question.exam.key,
                "question_no": question.no,
                "missing_fields": missing_fields,
                "type": "Question"
            })

    # Check Choices
    for choice in Choice.objects.filter(question__in=Question.active()).order_by('question__no'):
        if not contains_japanese(choice.choice_text_ja):
            missing_data.append({
                "exam_key": choice.question.exam.key,
                "question_no": choice.question.no,
                "missing_fields": ["choice_text_ja"],
                "type": "Choice"
            })

    # 結果を問題番号でソート
    missing_data.sort(key=lambda x: x['question_no'])

    # Display results
    for entry in missing_data:
        print(
            f"Exam: {entry['exam_key']} - "
            f"Question {entry['question_no']} - "
            f"Missing: {', '.join(entry['missing_fields'])} "
            f"(Type: {entry['type']})"
        )


if __name__ == '__main__':
    check_japanese_content()