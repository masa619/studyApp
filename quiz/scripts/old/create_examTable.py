import os, sys
import json
import django

sys.path.append('/Users/shipro/Projects/StudyApp')
# Djangoプロジェクトの設定を読み込む
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studyapp.settings')
django.setup()

from quiz.models import Exam, Question, Choice


def import_json_to_db(json_file_path):
    """JSONデータをDjangoデータベースにインポートするスクリプト"""
    # 1. Examの初期データを作成
    exam, created = Exam.objects.get_or_create(
        key="1",
        defaults={
            "name": "AWS Solutions Architect - Professional",
            "category": None,  # または空文字やnullとして処理
            "is_active": True,
        }
    )
    if created:
        print(f"Exam '{exam.name}' を新規作成しました。")
    else:
        print(f"Exam '{exam.name}' は既に存在します。")


if __name__ == "__main__":
    # JSONファイルのパスを指定
    json_file_path = '/Users/shipro/Projects/StudyApp/data/exams.json'  # JSONファイルを配置するパス
    import_json_to_db(json_file_path)