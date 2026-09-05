#!/usr/bin/env python3
"""Tag practice-test questions with question-bank metadata (domain, skill, difficulty).

Most questions in College Board's paper practice tests also appear in the Question Bank
export that powers the adaptive trainer. This script matches each test question's text to
a bank question and records the bank id and its metadata in practice-tests.json.

Usage:
  python3 tag_practice_tests.py <tests_dir> <question_bank.pdf> <index.html>
"""
import bisect
import json
import pathlib
import re
import sys

import pymupdf


def norm(text):
    # Word-level normalization; used to pick the first N words of a probe.
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def squash(text):
    # The bank export splits some words with kerning gaps ("par t", "ear th"), so all
    # matching is done on text with every non-alphanumeric character removed.
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def words(text, count):
    return squash(" ".join(norm(text).split()[:count]))


def bank_question_texts(bank_pdf, bank_questions):
    """Normalized text of each bank question's question region (passage, stem, choices)."""
    doc = pymupdf.open(bank_pdf)
    texts = {}
    for question in bank_questions:
        height = question.get("pageHeight", 792.0)
        last_page = question.get("answerPage") or question.get("correctPage") or question["startPage"]
        parts = []
        for page_number in range(question["startPage"], last_page + 1):
            page = doc[page_number - 1]
            y0 = height - question["questionTopY"] if page_number == question["startPage"] else 0
            y1 = height - question.get("questionCropBottomY", 0) if page_number == last_page else height
            if y1 <= y0:
                y1 = height
            parts.append(page.get_text(clip=pymupdf.Rect(0, y0, page.rect.width, y1)))
        texts[question["id"]] = squash(" ".join(parts))
    return texts


def question_probes(doc, question):
    """Probes: passage opener, question line, and the first words of each choice."""
    stem_crops = question.get("stem") or question["crops"]
    stem_text = " ".join(doc[c[0] - 1].get_text(clip=pymupdf.Rect(c[1], c[2], c[3], c[4])) for c in stem_crops)
    lines = [l.strip() for l in stem_text.splitlines() if len(l.strip()) > 15]
    probes = {"passage": [], "question": [], "choices": []}
    if lines:
        probes["passage"].append(words(lines[0], 8))
        long_lines = sorted(lines, key=len, reverse=True)[:2]
        probes["passage"].extend(words(l, 8) for l in long_lines)
    for line in lines:
        if re.match(r"^(Which|What|According|Based on|As used|The student)", line):
            probes["question"].append(words(line, 8))
    for letter, crops in (question.get("choices") or {}).items():
        text = " ".join(doc[c[0] - 1].get_text(clip=pymupdf.Rect(c[1], c[2], c[3], c[4])) for c in crops)
        text = re.sub(r"^\s*[A-D]\)\s*", "", text.strip())
        text = re.sub(r"^\s*[•·●]\s*", "", text)
        if len(text.split()) >= 3:
            probes["choices"].append(words(text, 7))
    for key in probes:
        probes[key] = [p for p in dict.fromkeys(probes[key]) if len(p) >= 12]
    return probes


def match_question(probes, bank_texts):
    scores = {}
    for bank_id, text in bank_texts.items():
        score = 0
        for probe in probes["choices"]:
            if probe in text:
                score += 3
        for probe in probes["question"]:
            if probe in text:
                score += 1
        for probe in probes["passage"]:
            if probe in text:
                score += 2
        if score:
            scores[bank_id] = score
    if not scores:
        return None
    ranked = sorted(scores.items(), key=lambda item: -item[1])
    best_id, best = ranked[0]
    second = ranked[1][1] if len(ranked) > 1 else 0
    # Require passage or choice evidence and a clear margin over the runner-up.
    if best < 4 or best - second < 2:
        return None
    return best_id


def main():
    tests_dir = pathlib.Path(sys.argv[1])
    bank_pdf = sys.argv[2]
    html = pathlib.Path(sys.argv[3]).read_text(encoding="utf-8")
    bank_questions = json.loads(re.search(r'<script type="application/json" id="questionData">(.*?)</script>', html, re.S).group(1))
    by_id = {q["id"]: q for q in bank_questions}
    print(f"bank questions: {len(bank_questions)}")
    bank_texts = bank_question_texts(bank_pdf, bank_questions)

    manifest_path = tests_dir / "practice-tests.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for test in manifest["tests"]:
        doc = pymupdf.open(tests_dir / test["testPdf"])
        matched = 0
        total = 0
        used = set()
        for module in test["modules"]:
            for question in module["questions"]:
                total += 1
                bank_id = match_question(question_probes(doc, question), bank_texts)
                for key in ("bankId", "domain", "skill", "difficulty"):
                    question.pop(key, None)
                if bank_id and bank_id not in used:
                    used.add(bank_id)
                    bank = by_id[bank_id]
                    question["bankId"] = bank_id
                    question["domain"] = bank["domain"]
                    question["skill"] = bank["skill"]
                    question["difficulty"] = bank["difficulty"]
                    matched += 1
        counts = {}
        for module in test["modules"]:
            for question in module["questions"]:
                counts[question.get("difficulty", "?")] = counts.get(question.get("difficulty", "?"), 0) + 1
        print(f"test {test['id']}: tagged {matched}/{total} · difficulty mix {counts}")
    manifest_path.write_text(json.dumps(manifest, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {manifest_path} ({manifest_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
