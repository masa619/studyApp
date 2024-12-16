import pymupdf4llm

pdf_path = "/Users/shipro/Projects/StudyApp/Class2_ElectricianExam/scripts/input_data/PoC/1p.pdf"
md_text = pymupdf4llm.to_markdown(pdf_path)

# Write the markdown text to a file
output_path = "/Users/shipro/Projects/StudyApp/Class2_ElectricianExam/scripts/output_data/PoC/output.md"
with open(output_path, "w") as file:
    file.write(md_text)