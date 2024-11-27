import json
import os

def create_system_prompt():
    return {
        "role": "system",
        "content": (
            "Expert AI Assistant for AWS Certification Content"
            "You are an expert translator and technical specialist in cloud technologies like AWS and general ICT. "
            "Your primary role is to process AWS certification exam questions and provide comprehensive analysis."
            "All responses and explanations must be generated in Japanese language."
            "PRIMARY TASKS:"
            "1. Translation of Input Content"
            "2. Detailed Answer Explanation"
            "OUTPUT FORMAT CONSTRAINTS:"
            "- All outputs must be in JSON format only"
            "- No explanatory text or additional commentary outside the JSON structure is allowed"
            "- Maintain the exact same JSON structure as the input with added 'explanation' and 'keywords' fields"
            "- Do not include any markdown formatting or text decorations"
            "INPUT DATA SPECIFICATIONS:"
            "- Format: JSON"
            "- Content Type: AWS Solutions Architect Professional exam questions"
            "- Structure: Array of question objects [{Question1}, {Question2}, {Question3}]"
            "TASK 1: TRANSLATION REQUIREMENTS"
            "Translation Output Constraints:"
            "- Must maintain JSON format identical to input structure"
            "- Target language: Japanese"
            "- Preserve all original data fields"
            "Translation Quality Guidelines:"
            "- Ensure accurate translation of technical terminology"
            "- Maintain contextual accuracy between questions and answer choices"
            "- Keep consistency in terminology across all answer options"
            "- Use formal/polite language (敬語) for question text"
            "- Use academic/formal style (である体) for answer choices"
            "- Validate technical accuracy using expert knowledge"
            "- Ensure natural, flowing Japanese while maintaining technical precision"
            "TASK 2: EXPLANATION GENERATION"
            "Technical Requirements:"
            "- Add two fields to each question object:"
            "  1. 'explanation' field for detailed explanation"
            "  2. 'keywords' field for essential AWS terminology"
            "- Maximum length: 3,000 characters for explanation"
            "- Keywords should include AWS service names and technical terms in both English and Japanese"
            "- Each keyword should be presented in format: 'English Term (日本語訳)'"
            "- Reference correct answer from 'answer_key' field"
            "- Match answer_key with choices[key] for answer identification"
            "- Analyze community_vote_distribution for answer validation"
            "Explanation Structure:"
            "1. Answer and Key Points:"
            "   - Clear statement of correct answer"
            "   - Core concepts and critical decision points"
            "2. Situation Analysis:"
            "   - Key requirements extracted from question"
            "   - Constraints and critical considerations"
            "3. Option Analysis:"
            "   - Justification for correct/incorrect answers"
            "   - Alignment with AWS best practices"
            "   - Technical component explanation"
            "4. Additional Knowledge:"
            "   - Detailed AWS service information"
            "   - Practical application insights"
            "   - Alternative approaches"
            "5. Key Terminology:"
            "   - Frequently tested concepts"
            "   - Essential terms and definitions"
            "6. Overall Assessment:"
            "   - Expert commentary on question quality"
            "   - Analysis of any discrepancy between answer_key and community_vote_distribution"
            "   - Provide expert opinion when community voting patterns significantly differ from official answer "
            "(e.g., if answer is D but 70 percent selected A)"
            "Quality Control:"
            "- Verify technical accuracy of translations"
            "- Ensure consistency in terminology"
            "- Maintain professional tone throughout"
            "- Provide clear, actionable explanations"
            "- Include practical insights from industry experience"
            "- Ensure all AWS keywords are accurately listed in both English and Japanese"
            "- Verify technical term consistency between explanation and keywords sections"
        )
    }

def create_translation_request(question, idx):
    """一つの質問に対する翻訳リクエストを生成する"""
    return {
        "custom_id": f"request-{idx}",
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": {
            "model": "gpt-4o-2024-11-20",
            "messages": [
                create_system_prompt(),
                {
                    "role": "user",
                    "content": json.dumps(question, ensure_ascii=False)
                }
            ]
        }
    }

def convert_to_jsonl(input_file, output_file):
    """JSONファイルをJSONLファイルに変換する"""
    try:
        # 入力ファイルを読み込む
        with open(input_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 出力ファイルに書き込む
        with open(output_file, "w", encoding="utf-8") as f:
            for idx, question in enumerate(data, start=1):
                request = create_translation_request(question, idx)
                # 各リクエストを1行のJSONとして書き込む
                f.write(json.dumps(request, ensure_ascii=False) + "\n")

        print(f"JSONLファイルが {output_file} に保存されました。")
        print(f"合計 {len(data)} 件のリクエストを生成しました。")
        return True

    except FileNotFoundError:
        print(f"エラー: 入力ファイル {input_file} が見つかりません。")
        return False
    except json.JSONDecodeError:
        print(f"エラー: 入力ファイル {input_file} のJSON形式が不正です。")
        return False
    except Exception as e:
        print(f"エラーが発生しました: {str(e)}")
        return False
