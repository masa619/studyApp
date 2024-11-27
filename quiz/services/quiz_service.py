from ..repositories.quiz_repository import QuizRepository
from ..models import Choice

class QuizService:
    def __init__(self):
        self.repository = QuizRepository()
        self.alphabet_to_index = {chr(i): i - ord('A') for i in range(ord('A'), ord('Z') + 1)}

    def get_questions(self, exam_id: int, mode: str, user=None):
        if mode == 'unanswered':
            return self.repository.get_unanswered_questions(exam_id, user)
        return self.repository.get_questions_by_exam(exam_id, user)

    def format_choice_data(self, choice):
        return {
            "key": choice.key,
            "text_en": choice.choice_text_en,
            "text_ja": choice.choice_text_ja,
            "image_url": choice.image.url if choice.image else None
        }

    def format_question_data(self, questions):
        data = []
        for question in questions:
            choices = self.repository.get_choices_for_question(question)
            choice_data = [self.format_choice_data(choice) for choice in choices]
            
            data.append({
                "id": question.id,
                "no": question.no,
                "question_text_en": question.question_text_en,
                "question_text_ja": question.question_text_ja,
                "answer_key": question.answer_key,
                "correct_answer_index": self.alphabet_to_index.get(question.answer_key, None),
                "community_vote_distribution": question.community_vote_distribution,
                "page_images": question.page_images,
                "explanation_en": question.explanation_en,
                "explanation_ja": question.explanation_ja,
                "keywords": question.keywords,
                "choices": choice_data,
            })
        return data 