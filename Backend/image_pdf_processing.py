import fitz  # PyMuPDF
from PIL import Image
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

class FileProcessing:
    @staticmethod
    def extract_text_from_image(file_path):
        text = ""
        print(file_path)
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
        except Exception as e:
            text = f"Error reading image: {str(e)}"
        return text.strip()

    @staticmethod
    def extract_text_from_pdf(file_path):
        text = ""
        print(file_path)
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        except Exception as e:
            text = f"Error reading PDF: {str(e)}"
        return text.strip()