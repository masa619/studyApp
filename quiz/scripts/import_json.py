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

    # 2. JSONファイルを読み込む
    with open(json_file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # 3. QuestionとChoiceをインポート
    for question_data in data:
        # Check if "No" key exists, otherwise skip or handle the question
        question_no = question_data.get("No")
        if question_no is None:
            print("Skipping question due to missing 'No' key.")
            continue

        # Questionを作成または取得
        question, created = Question.objects.get_or_create(
            no=int(question_no),
            exam=exam,
            defaults={
                "question_text_en": question_data["question"],
                "question_text_ja": question_data["question_jp"],
                "answer_key": question_data["answer_key"],
                "community_vote_distribution": question_data.get("community_vote_distribution", None),
                "page_images": question_data.get("page_images", []),
                "explanation_en": question_data.get("explanation_en", []),
                "explanation_ja": question_data.get("explanation_jp", []),
                "keywords": question_data.get("keywords", []),
            }
        )
        if created:
            print(f"Question '{question.no}' を作成しました。")
        else:
            print(f"Question '{question.no}' は既に存在します。")

        # Choiceを作成
        for choice_data in question_data["choices"]:
            choice, created = Choice.objects.get_or_create(
                question=question,
                key=choice_data["key"],
                defaults={
                    "choice_text_en": choice_data["text"],
                    "choice_text_ja": choice_data["text_jp"],
                }
            )
            if created:
                print(f"Choice '{choice.key}' を作成しました。")
            else:
                print(f"Choice '{choice.key}' は既に存在します。")

    print("JSONデータのインポートが完了しました。")

if __name__ == "__main__":
    # JSONファイルのパスを指定
    json_file_path = '/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/merged/merged_output.json'  # JSONファイルを配置するパス
    import_json_to_db(json_file_path)