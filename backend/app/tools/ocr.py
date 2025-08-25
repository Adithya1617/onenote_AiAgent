import pytesseract
import os
from PIL import Image

# Make Tesseract path configurable via environment variable
tesseract_path = os.getenv("TESSERACT_PATH", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
pytesseract.pytesseract.tesseract_cmd = tesseract_path

def ocr_image(path: str) -> str:
    img = Image.open(path)
    text = pytesseract.image_to_string(img)
    return text.strip()
