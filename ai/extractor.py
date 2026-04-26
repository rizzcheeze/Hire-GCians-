from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path

import fitz
import pytesseract
from pdf2image import convert_from_path
from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError


DEFAULT_MIN_CHARACTERS = 200
DEFAULT_MIN_WORDS = 30
DEFAULT_OCR_DPI = 200


@dataclass(slots=True)
class ExtractionResult:
    text: str
    method: str
    used_ocr: bool
    page_count: int
    char_count: int
    word_count: int


def normalize_text(text: str) -> str:
    normalized = text.replace("\x00", " ")
    normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[ \t]+", " ", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def count_words(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def text_needs_ocr(
    text: str,
    *,
    min_characters: int = DEFAULT_MIN_CHARACTERS,
    min_words: int = DEFAULT_MIN_WORDS,
) -> bool:
    normalized = normalize_text(text)
    return len(normalized) < min_characters or count_words(normalized) < min_words


def extract_text_with_pymupdf(pdf_path: str | os.PathLike[str]) -> tuple[str, int]:
    path = Path(pdf_path)
    if path.suffix.lower() != ".pdf":
        raise ValueError("Only PDF files are supported.")

    with fitz.open(path) as document:
        page_count = document.page_count
        text = "\n\n".join(page.get_text("text") for page in document)

    return normalize_text(text), page_count


def extract_text_with_ocr(
    pdf_path: str | os.PathLike[str],
    *,
    dpi: int = DEFAULT_OCR_DPI,
    poppler_path: str | None = None,
    tesseract_cmd: str | None = None,
) -> tuple[str, int]:
    path = Path(pdf_path)
    if path.suffix.lower() != ".pdf":
        raise ValueError("Only PDF files are supported.")

    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    try:
        images = convert_from_path(
            path,
            dpi=dpi,
            poppler_path=poppler_path,
        )
    except (PDFInfoNotInstalledError, PDFPageCountError) as error:
        raise RuntimeError(
            "OCR conversion failed. Ensure Poppler is installed and available to pdf2image."
        ) from error

    text_parts: list[str] = []
    for image in images:
        text_parts.append(pytesseract.image_to_string(image))

    return normalize_text("\n\n".join(text_parts)), len(images)


def extract_resume_text(
    pdf_path: str | os.PathLike[str],
    *,
    force_ocr: bool = False,
    min_characters: int = DEFAULT_MIN_CHARACTERS,
    min_words: int = DEFAULT_MIN_WORDS,
    dpi: int = DEFAULT_OCR_DPI,
    poppler_path: str | None = None,
    tesseract_cmd: str | None = None,
) -> ExtractionResult:
    direct_text, page_count = extract_text_with_pymupdf(pdf_path)

    if force_ocr or text_needs_ocr(
        direct_text,
        min_characters=min_characters,
        min_words=min_words,
    ):
        ocr_text, ocr_page_count = extract_text_with_ocr(
            pdf_path,
            dpi=dpi,
            poppler_path=poppler_path,
            tesseract_cmd=tesseract_cmd,
        )
        return ExtractionResult(
            text=ocr_text,
            method="ocr",
            used_ocr=True,
            page_count=ocr_page_count,
            char_count=len(ocr_text),
            word_count=count_words(ocr_text),
        )

    return ExtractionResult(
        text=direct_text,
        method="pymupdf",
        used_ocr=False,
        page_count=page_count,
        char_count=len(direct_text),
        word_count=count_words(direct_text),
    )


__all__ = [
    "DEFAULT_MIN_CHARACTERS",
    "DEFAULT_MIN_WORDS",
    "DEFAULT_OCR_DPI",
    "ExtractionResult",
    "count_words",
    "extract_resume_text",
    "extract_text_with_ocr",
    "extract_text_with_pymupdf",
    "normalize_text",
    "text_needs_ocr",
]
