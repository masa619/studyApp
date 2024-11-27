import pdfplumber
import re
import json
from dataclasses import dataclass
from typing import List, Optional, Dict, Tuple
from pathlib import Path


@dataclass
class Choice:
    key: str
    text: str


@dataclass
class Question:
    number: str
    text: str
    choices: List[Choice]
    correct_answer: Optional[str]
    community_vote: Optional[str]
    page_images: List[str]  # 画像のファイル名リスト


class TextCleaner:
    @staticmethod
    def clean(text: str) -> str:
        """基本的なテキストクリーニング操作"""
        replacements = {
            r'\u0000': 'fi',     # 不正文字の置換
            r'’': "'",           # 正しいシングルクォートに置換
            r'ﬁ': 'fi',          # 特殊な文字を置換
            r'ﬂ': 'fl',          # 特殊な文字を置換
            r'Topic 1\n': '',
        }
        for old, new in replacements.items():
            text = re.sub(old, new, text)
        return TextCleaner.normalize_whitespace(text)

    @staticmethod
    def normalize_whitespace(text: str) -> str:
        """スペースを正規化し、改行を保持"""
        # タブをスペースに置換
        text = text.replace('\t', ' ')
        # 複数のスペースを単一のスペースに置換
        text = re.sub(r' {2,}', ' ', text)
        # 各行の先頭と末尾のスペースを削除
        lines = [line.strip() for line in text.split('\n')]
        # 空行を削除
        lines = [line for line in lines if line]
        # 行を再結合
        return '\n'.join(lines)


class QuestionExtractor:
    def __init__(self, page, page_text: str, page_num: int, images: List[Dict]):
        self.page = page
        self.page_text = page_text
        self.page_num = page_num
        self.images = images
        self.text_cleaner = TextCleaner()

    def extract_question_blocks(self) -> List[tuple]:
        """テキストを質問ブロックに分割"""
        blocks = re.split(r"(Question #[0-9]+)", self.page_text)
        question_blocks = []
        for i in range(1, len(blocks), 2):
            question_no = blocks[i]
            content = blocks[i + 1] if (i + 1) < len(blocks) else ''
            question_blocks.append((question_no, content))
        return question_blocks

    def extract_question_text(self, block: str) -> Optional[str]:
        """質問テキストをブロックから抽出"""
        # 選択肢の開始位置を特定
        choice_pattern = r'(?:^|\n)\s*[A-Z0-9](?:\.|\)|-)\s+'
        split_block = re.split(choice_pattern, block, maxsplit=1)
        question_text = split_block[0].strip()
        question_text = self.text_cleaner.clean(question_text)
        return question_text

    def extract_choices(self, block: str) -> List[Choice]:
        """質問ブロックから選択肢を抽出"""
        choice_pattern = r'(?:^|\n)\s*([A-Z0-9])(?:\.|\)|-)\s+(.*?)(?=(?:\n\s*[A-Z0-9](?:\.|\)|-)\s+|\nCorrect Answer:|\nCommunity vote|$))'
        matches = list(re.finditer(choice_pattern, block, re.MULTILINE | re.DOTALL))

        choices = []
        for match in matches:
            key = match.group(1)
            text = match.group(2).strip()
            text = self.text_cleaner.clean(text)
            choices.append(Choice(key=key, text=text))

        # 画像プレースホルダーを選択肢に挿入
        choices = self.insert_placeholders_in_choices(choices)
        return choices

    def is_image_related_to_text(self, image_bbox: Tuple[float, float, float, float], text_bbox: Tuple[float, float, float, float]) -> bool:
        """画像とテキストの位置関係をチェック"""
        img_left, img_top, img_right, img_bottom = image_bbox
        text_left, text_top, text_right, text_bottom = text_bbox

        # 垂直方向の重なりをチェック
        vertical_overlap = max(0, min(img_bottom, text_bottom) - max(img_top, text_top))
        # 水平方向の重なりをチェック
        horizontal_overlap = max(0, min(img_right, text_right) - max(img_left, text_left))

        # 重なりが一定の閾値以上であれば関連があると判断
        return vertical_overlap > 0 and horizontal_overlap > 0

    def insert_placeholders_in_choices(self, choices: List[Choice]) -> List[Choice]:
        """選択肢に画像プレースホルダーを挿入"""
        # 画像のバウンディングボックスを取得
        image_bboxes = []
        for idx, img in enumerate(self.images):
            image_bboxes.append((idx, img["x0"], img["top"], img["x1"], img["bottom"]))

        # 選択肢ごとにテキストのバウンディングボックスを取得
        for choice in choices:
            choice_text = choice.text
            words = self.page.extract_words()
            # 選択肢テキストに一致する単語を探す
            choice_words = [word for word in words if choice_text.startswith(word['text'])]
            if not choice_words:
                continue
            text_bbox = (
                min(word['x0'] for word in choice_words),
                min(word['top'] for word in choice_words),
                max(word['x1'] for word in choice_words),
                max(word['bottom'] for word in choice_words),
            )
            # 関連する画像をチェック
            related_images = []
            for idx, img_x0, img_top, img_x1, img_bottom in image_bboxes:
                image_bbox = (img_x0, img_top, img_x1, img_bottom)
                if self.is_image_related_to_text(image_bbox, text_bbox):
                    related_images.append(idx)
            # プレースホルダーを挿入
            for idx in related_images:
                placeholder = f"[image_{self.page_num}_{idx}]"
                choice.text += f" {placeholder}"
        return choices

    def extract_answer_and_votes(self, block: str) -> tuple:
        """正解とコミュニティ投票を抽出"""
        answer_match = re.search(r'Correct Answer:\s*([A-Z0-9])', block)
        correct_answer = answer_match.group(1) if answer_match else None

        vote_match = re.search(r'Community vote distribution\s*(.*?)(?=\n\n|$)', block, re.DOTALL)
        votes = self.text_cleaner.clean(vote_match.group(1)) if vote_match else None

        return correct_answer, votes

    def process_block(self, question_no: str, block: str) -> Optional[Question]:
        """単一の質問ブロックを処理"""
        question_text = self.extract_question_text(block)
        if not question_text:
            return None

        choices = self.extract_choices(block)
        correct_answer, community_vote = self.extract_answer_and_votes(block)

        # ページ内の画像ファイル名リストを作成
        image_filenames = [f"image_{self.page_num}_{idx}.png" for idx in range(len(self.images))]

        return Question(
            number=question_no.replace("Question #", "").strip(),
            text=question_text,
            choices=choices,
            correct_answer=correct_answer,
            community_vote=community_vote,
            page_images=image_filenames
        )


class PDFProcessor:
    def __init__(self, pdf_path: str):
        self.pdf_path = Path(pdf_path)

    def process_page(self, page) -> List[Question]:
        """単一のPDFページを処理"""
        page_text = page.extract_text() or ""
        page_text = TextCleaner.clean(page_text)

        extractor = QuestionExtractor(page, page_text, page.page_number, page.images)
        questions = []

        for question_no, block in extractor.extract_question_blocks():
            question = extractor.process_block(question_no, block)
            if question:
                questions.append(question)

        # 画像を保存
        for idx, img in enumerate(page.images):
            img_obj = page.crop((img["x0"], img["top"], img["x1"], img["bottom"]))
            img_filename = f"image_{page.page_number}_{idx}.png"
            img_obj.to_image(resolution=150).save(img_filename)

        return questions

    def process_pdf(self) -> List[dict]:
        """PDF全体を処理して質問を抽出"""
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                all_questions = []
                for page in pdf.pages:
                    try:
                        questions = self.process_page(page)
                        all_questions.extend(questions)
                    except Exception as e:
                        print(f"ページ {page.page_number} の処理中にエラー: {e}")

                # JSONシリアライズのためにQuestionオブジェクトを辞書に変換
                return [
                    {
                        "No": q.number,
                        "question": q.text,
                        "choices": [{"key": c.key, "text": c.text} for c in q.choices],
                        "answer_key": q.correct_answer,
                        "community_vote_distribution": q.community_vote,
                        "page_images": q.page_images
                    }
                    for q in all_questions
                ]
        except Exception as e:
            print(f"PDFの処理中にエラー: {e}")
            return []


def save_to_json(data: List[dict], output_path: str):
    """抽出したデータをJSONファイルに保存"""
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, indent=2, ensure_ascii=False, fp=f)
        print(f"JSONファイルを正常に保存しました: {output_path}")
    except Exception as e:
        print(f"JSONファイルの保存中にエラー: {e}")


def main():
    pdf_path = "/Users/shipro/Downloads/AWS Solutions Architect - Professional.pdf"
    output_path = "/Users/shipro/Downloads/extracted_data.json"

    processor = PDFProcessor(pdf_path)
    questions = processor.process_pdf()
    save_to_json(questions, output_path)


if __name__ == "__main__":
    main()
