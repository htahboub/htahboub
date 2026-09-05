#!/usr/bin/env python3
"""Build Reading & Writing practice-test data from College Board's linear SAT practice test PDFs.

Usage:
  python3 build_practice_tests.py <download_dir> <output_dir> [test numbers...]

As of September 2026 College Board publishes SAT Practice Tests 4 through 11 as PDFs at
https://satsuite.collegeboard.org/practice/practice-tests/paper (tests 1-3 were retired and
their old URLs redirect to that page). Download the three files per test into <download_dir>.

Expects, for each test N, these files in <download_dir> (as published by College Board):
  sat-practice-test-N-digital.pdf
  sat-practice-test-N-answers-digital.pdf
  scoring-sat-practice-test-N-digital.pdf

Writes to <output_dir>:
  ptN-rw.pdf            Reading & Writing pages of the test (both modules)
  ptN-explanations.pdf  Reading & Writing answer explanations
  practice-tests.json   Manifest with question crops, answer keys, and score tables

All crop coordinates use PDF points with a top-left origin and refer to page numbers
inside the extracted PDFs (1-based).
"""
import json
import pathlib
import re
import sys

import pymupdf

HEADER_BOTTOM = 80
CONTENT_TOP = 100
FOOTER_TOP = 735
COL_WIDTH = 246
BAR_GREY = (0.82, 0.826, 0.832)
STOP_PATTERNS = [
    re.compile(r"^STOP$"),
    re.compile(r"^If you finish before time is called", re.I),
    re.compile(r"^Do not turn to any other module", re.I),
    re.compile(r"Unauthorized copying", re.I),
    re.compile(r"^CONTINUE$"),
    re.compile(r"^No Test Material", re.I),
]
EXPL_BODY_X0 = 48
EXPL_BODY_X1 = 402
EXPL_HEADER_BOTTOM = 64
EXPL_FOOTER_TOP = 736


def r1(value):
    return round(float(value), 1)


def approx(a, b, tol=0.03):
    return all(abs(x - y) <= tol for x, y in zip(a, b))


# --------------------------------------------------------------------------------------
# Test booklet
# --------------------------------------------------------------------------------------

def rw_module_pages(doc):
    """Return [[pages of module 1], [pages of module 2]] (1-based) for the R&W section."""
    starts = []
    math_start = None
    for index, page in enumerate(doc):
        text = page.get_text()
        if "Reading and Writing" in text and "33 QUESTIONS" in text:
            starts.append(index + 1)
        elif math_start is None and "Math" in text and "27 QUESTIONS" in text:
            math_start = index + 1
    if len(starts) != 2 or math_start is None:
        raise RuntimeError(f"Could not locate R&W modules (starts={starts}, math={math_start})")
    modules = [list(range(starts[0], starts[1])), list(range(starts[1], math_start))]
    def usable(page_number):
        text = doc[page_number - 1].get_text()
        return "No Test Material" not in text
    return [[p for p in pages if usable(p)] for pages in modules]


def page_columns(page):
    header = None
    for block in page.get_text("dict")["blocks"]:
        if block["type"] == 1 and block["bbox"][1] < HEADER_BOTTOM and (block["bbox"][2] - block["bbox"][0]) > 400:
            header = block["bbox"]
            break
    if header is None:
        # Fall back to the grey question bars.
        bars = [d["rect"] for d in page.get_drawings() if is_bar(d)]
        if not bars:
            raise RuntimeError(f"No header or bars on page {page.number + 1}")
        left = min(b.x0 for b in bars)
        right = max(b.x1 for b in bars)
        if right - left < 300:
            right = left + 522
        header = (left, 0, right, 0)
    hx0, hx1 = header[0], header[2]
    return [(hx0 - 2, hx0 + COL_WIDTH), (hx1 - COL_WIDTH, hx1 + 2)]


def is_bar(drawing):
    rect = drawing["rect"]
    fill = drawing.get("fill")
    return (
        drawing.get("type") == "f"
        and fill is not None
        and approx(fill, BAR_GREY)
        and 200 <= rect.width <= 540
        and 8 <= rect.height <= 18
    )


def column_index(columns, x_center):
    for index, (x0, x1) in enumerate(columns):
        if x0 - 4 <= x_center <= x1 + 4:
            return index
    return None


def page_lines(page):
    lines = []
    for block in page.get_text("dict")["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            spans = [s for s in line["spans"] if s["text"].strip()]
            if not spans:
                continue
            text = "".join(s["text"] for s in spans).strip()
            bbox = line["bbox"]
            lines.append({
                "text": text,
                "x0": bbox[0], "y0": bbox[1], "x1": bbox[2], "y1": bbox[3],
                "size": max(s["size"] for s in spans),
                "white": all(s["color"] == 0xFFFFFF for s in spans),
            })
    return lines


def white_digit_spans(page):
    spans = []
    for block in page.get_text("dict")["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                text = span["text"].strip()
                if span["color"] == 0xFFFFFF and re.fullmatch(r"\d{1,2}", text):
                    x0, y0, x1, y1 = span["bbox"]
                    spans.append({"number": int(text), "x0": x0, "y0": y0, "x1": x1, "y1": y1})
    return spans


def booklet_items(page):
    """Return content items (text lines, drawings, images) with header/footer noise removed."""
    items = []
    for line in page_lines(page):
        if line["y0"] < HEADER_BOTTOM or line["y1"] > FOOTER_TOP:
            continue
        if any(p.search(line["text"]) for p in STOP_PATTERNS):
            continue
        items.append({"kind": "text", **line})
    for block in page.get_text("dict")["blocks"]:
        if block["type"] == 1:
            x0, y0, x1, y1 = block["bbox"]
            if y0 < HEADER_BOTTOM or y1 > FOOTER_TOP + 10:
                continue
            items.append({"kind": "image", "x0": x0, "y0": y0, "x1": x1, "y1": y1, "text": ""})
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if rect.y0 < HEADER_BOTTOM or rect.y1 > FOOTER_TOP:
            continue
        if rect.width < 1.5 and rect.height < 1.5:
            continue
        items.append({"kind": "draw", "x0": rect.x0, "y0": rect.y0, "x1": rect.x1, "y1": rect.y1, "text": ""})
    return items


def stop_block_top(page):
    """Top of the STOP block on the last page of a module, or None."""
    tops = []
    for line in page_lines(page):
        if re.fullmatch(r"STOP", line["text"]) and line["size"] > 14:
            tops.append(line["y0"])
    return min(tops) - 6 if tops else None


def parse_module_segments(doc, pages):
    """Walk a module's pages in reading order and return per-question segments.

    Pages are two-column, but a question with a wide table or figure can span the full
    page width. Each page is therefore split into vertical bands: a "wide" band belongs to
    one full-width question; a "columns" band is read left column first, then right column.
    Returns list of dicts {number, segments:[{page,col,x0,x1,y0,y1}], lines:[...]} in order.
    """
    questions = []
    current = None
    for page_number in pages:
        page = doc[page_number - 1]
        columns = page_columns(page)
        wide_box = (columns[0][0], columns[1][1])
        items = booklet_items(page)
        lines = page_lines(page)
        bars = []
        for drawing in page.get_drawings():
            if not is_bar(drawing):
                continue
            rect = drawing["rect"]
            if rect.width > 270:
                col = "wide"
            else:
                col = column_index(columns, (rect.x0 + rect.x1) / 2)
                if col is None:
                    continue
            number = None
            for span in white_digit_spans(page):
                if rect.y0 - 2 <= span["y0"] and span["y1"] <= rect.y1 + 2 and rect.x0 - 2 <= span["x0"] <= rect.x0 + 40:
                    number = span["number"]
                    break
            if number is None:
                raise RuntimeError(f"Bar without number on page {page_number} at {rect}")
            bars.append({"rect": rect, "col": col, "number": number})
        bars.sort(key=lambda b: b["rect"].y0)
        stop_top = stop_block_top(page)
        floor = min(FOOTER_TOP, stop_top) if stop_top else FOOTER_TOP

        # Split the page into bands.
        bands = []
        cursor = CONTENT_TOP
        for index, bar in enumerate(bars):
            if bar["col"] != "wide":
                continue
            top = bar["rect"].y0
            following = [b for b in bars[index + 1:]]
            bottom = following[0]["rect"].y0 if following else floor
            if top - cursor > 4:
                bands.append({"kind": "columns", "top": cursor, "bottom": top})
            bands.append({"kind": "wide", "top": top, "bottom": bottom, "bar": bar})
            cursor = bottom
        if floor - cursor > 4:
            bands.append({"kind": "columns", "top": cursor, "bottom": floor})

        def region_segments(box, top, bottom, region_bars, col_label):
            nonlocal current
            x0, x1 = box
            region_items = [it for it in items if it["x0"] >= x0 - 8 and it["x1"] <= x1 + 8 and it["y0"] >= top - 1 and it["y1"] <= bottom + 1]
            boundaries = [top] + [b["rect"].y0 for b in region_bars] + [bottom]
            for index in range(len(boundaries) - 1):
                seg_top, seg_bottom = boundaries[index], boundaries[index + 1]
                bar = region_bars[index - 1] if index >= 1 else None
                inside = [it for it in region_items if it["y0"] >= seg_top - 1 and it["y1"] <= seg_bottom + 1]
                if bar is not None:
                    inside = [it for it in inside if it["y0"] >= bar["rect"].y1 - 1]
                if not inside:
                    if bar is not None:
                        raise RuntimeError(f"Question {bar['number']} on page {page_number} has no content")
                    continue
                content_top = min(it["y0"] for it in inside)
                content_bottom = max(it["y1"] for it in inside)
                seg = {
                    "page": page_number,
                    "col": col_label,
                    "x0": r1(x0),
                    "x1": r1(x1),
                    "y0": r1(max(seg_top, (bar["rect"].y1 + 1) if bar else content_top - 6)),
                    "y1": r1(min(seg_bottom - 1, content_bottom + 6)),
                }
                text_lines = [dict(it, page=page_number, col=col_label) for it in inside if it["kind"] == "text"]
                if bar is not None:
                    current = {"number": bar["number"], "segments": [seg], "lines": text_lines}
                    questions.append(current)
                else:
                    if current is None:
                        continue  # directions text above question 1
                    current["segments"].append(seg)
                    current["lines"].extend(text_lines)

        for band in bands:
            if band["kind"] == "wide":
                region_segments(wide_box, band["top"], band["bottom"], [band["bar"]], "wide")
            else:
                for col, box in enumerate(columns):
                    col_bars = [b for b in bars if b["col"] == col and band["top"] <= b["rect"].y0 < band["bottom"]]
                    region_segments(box, band["top"], band["bottom"], col_bars, col)
    return questions


def detect_choices(question, columns_by_page):
    """Split a question into stem crops and per-choice crops using the A)–D) markers."""
    # Choice markers are "A)".."D)" at the text margin of the column. In a few files the
    # marker glyphs extract as bullets, so bullets at the text margin also count (note-list
    # bullets in the passage are indented further). The choices are always the last four.
    candidates = []
    for line in question["lines"]:
        match = re.match(r"^([A-D])\)", line["text"])
        bullet = re.match(r"^[\u2022\u00b7\u25cf]\s*\S", line["text"])
        if not match and not bullet:
            continue
        cx0 = next(seg["x0"] for seg in question["segments"] if seg["page"] == line["page"] and seg["col"] == line["col"])
        if not (cx0 + 10 <= line["x0"] <= cx0 + 28):
            continue
        candidates.append({"letter": match.group(1) if match else None, "page": line["page"], "col": line["col"], "y0": line["y0"]})
    if len(candidates) < 4:
        return None
    markers = candidates[-4:]
    for index, marker in enumerate(markers):
        expected = "ABCD"[index]
        if marker["letter"] not in (None, expected):
            return None
        marker["letter"] = expected
    segs = question["segments"]

    def seg_index(page, col):
        for i, seg in enumerate(segs):
            if seg["page"] == page and seg["col"] == col:
                return i
        return None

    marker_pos = [(seg_index(m["page"], m["col"]), m["y0"] - 3) for m in markers]
    if any(p[0] is None for p in marker_pos):
        return None
    for (s1, y1), (s2, y2) in zip(marker_pos, marker_pos[1:]):
        if s2 < s1 or (s1 == s2 and y2 <= y1):
            return None

    def crops_between(start, end):
        # start/end are (seg_index, y) with end possibly None (to end of question).
        result = []
        si, sy = start
        ei, ey = end if end else (len(segs) - 1, None)
        for i in range(si, ei + 1):
            seg = segs[i]
            top = sy if i == si else seg["y0"]
            bottom = ey if (end and i == ei) else seg["y1"]
            if bottom is None:
                bottom = seg["y1"]
            if bottom - top > 2:
                result.append([seg["page"], seg["x0"], r1(top), seg["x1"], r1(bottom)])
        return result

    stem = crops_between((0, segs[0]["y0"]), marker_pos[0])
    choices = {}
    for index, letter in enumerate("ABCD"):
        end = marker_pos[index + 1] if index < 3 else None
        choices[letter] = crops_between(marker_pos[index], end)
        if not choices[letter]:
            return None
    if not stem:
        return None
    return stem, choices


def build_booklet(doc, module_pages, page_offset):
    modules = []
    for module_index, pages in enumerate(module_pages):
        questions = parse_module_segments(doc, pages)
        numbers = [q["number"] for q in questions]
        if numbers != list(range(1, 34)):
            raise RuntimeError(f"Module {module_index + 1}: unexpected question numbers {numbers}")
        out = []
        for question in questions:
            split = detect_choices(question, None)
            full = [[seg["page"], seg["x0"], seg["y0"], seg["x1"], seg["y1"]] for seg in question["segments"]]
            entry = {"n": question["number"], "crops": full}
            if split:
                stem, choices = split
                entry["stem"] = stem
                entry["choices"] = choices
            out.append(entry)
        modules.append(out)
    # Re-map page numbers to the extracted document.
    for module in modules:
        for entry in module:
            for key in ("crops", "stem"):
                for crop in entry.get(key, []):
                    crop[0] = crop[0] - page_offset
            for crops in entry.get("choices", {}).values():
                for crop in crops:
                    crop[0] = crop[0] - page_offset
    return modules


# --------------------------------------------------------------------------------------
# Answer explanations
# --------------------------------------------------------------------------------------

def explanation_module_pages(doc):
    modules = {1: [], 2: []}
    for index, page in enumerate(doc):
        for line in page_lines(page):
            if line["y0"] < EXPL_HEADER_BOTTOM:
                match = re.search(r"READING AND WRITING: MODULE (\d)", line["text"])
                if match:
                    modules[int(match.group(1))].append(index + 1)
                    break
    if len(modules[1]) < 5 or len(modules[2]) < 5:
        raise RuntimeError(f"Explanation module pages look wrong: {modules}")
    return [modules[1], modules[2]]


def build_explanations(doc, module_pages, page_offset):
    modules = []
    for pages in module_pages:
        entries = []  # reading-order items: headers and body extents per page
        for page_number in pages:
            page = doc[page_number - 1]
            lines = [l for l in page_lines(page) if l["y0"] >= EXPL_HEADER_BOTTOM and l["y1"] <= EXPL_FOOTER_TOP]
            images = [b["bbox"] for b in page.get_text("dict")["blocks"] if b["type"] == 1 and b["bbox"][1] >= EXPL_HEADER_BOTTOM and b["bbox"][3] <= EXPL_FOOTER_TOP]
            drawings = [d["rect"] for d in page.get_drawings() if d["rect"].y0 >= EXPL_HEADER_BOTTOM and d["rect"].y1 <= EXPL_FOOTER_TOP and (d["rect"].width > 1.5 or d["rect"].height > 1.5)]
            headers = [l for l in lines if re.fullmatch(r"QUESTION \d+", l["text"]) and l["size"] >= 12]
            body_bottom = max([l["y1"] for l in lines] + [b[3] for b in images] + [r.y1 for r in drawings], default=None)
            body_top = min([l["y0"] for l in lines if l["size"] < 12] + [b[1] for b in images] + [r.y0 for r in drawings], default=None)
            entries.append({"page": page_number, "headers": headers, "body_top": body_top, "body_bottom": body_bottom})
        questions = {}
        order = []
        for pi, entry in enumerate(entries):
            for hi, header in enumerate(entry["headers"]):
                number = int(header["text"].split()[1])
                crops = []
                # From this header to the next header on the same page, or to the page's body bottom and onward.
                start_y = header["y0"] - 2
                next_header = entry["headers"][hi + 1] if hi + 1 < len(entry["headers"]) else None
                if next_header:
                    crops.append([entry["page"], EXPL_BODY_X0, r1(start_y), EXPL_BODY_X1, r1(next_header["y0"] - 4)])
                else:
                    crops.append([entry["page"], EXPL_BODY_X0, r1(start_y), EXPL_BODY_X1, r1(entry["body_bottom"] + 4)])
                    # Continue onto following pages until a page with a header.
                    for follow in entries[pi + 1:]:
                        if follow["headers"]:
                            first = follow["headers"][0]
                            if follow["body_top"] is not None and first["y0"] - follow["body_top"] > 12:
                                crops.append([follow["page"], EXPL_BODY_X0, r1(follow["body_top"] - 4), EXPL_BODY_X1, r1(first["y0"] - 4)])
                            break
                        if follow["body_bottom"] is not None:
                            crops.append([follow["page"], EXPL_BODY_X0, r1(follow["body_top"] - 4), EXPL_BODY_X1, r1(follow["body_bottom"] + 4)])
                questions[number] = crops
                order.append(number)
        if order != list(range(1, 34)):
            raise RuntimeError(f"Explanation question order unexpected: {order}")
        for crops in questions.values():
            for crop in crops:
                crop[0] -= page_offset
        modules.append([questions[n] for n in range(1, 34)])
    return modules


# --------------------------------------------------------------------------------------
# Scoring guide
# --------------------------------------------------------------------------------------

def parse_answer_key(doc):
    for page in doc:
        words = page.get_text("words")
        headers = sorted([w for w in words if w[4] == "QUESTION" and w[1] > 120], key=lambda w: w[0])
        if len(headers) < 4:
            continue
        # Check this is the real worksheet page (not the thumbnail on page 2): headers are large-ish spaced.
        if headers[1][0] - headers[0][0] < 40:
            continue
        header_y = headers[0][1]
        xs = [h[0] for h in headers] + [page.rect.width]
        keys = []
        for t in range(2):  # Reading and Writing module 1 and 2 are the two leftmost tables.
            x_from, x_to = xs[t] - 12, xs[t + 1] - 12
            cells = sorted([w for w in words if x_from <= w[0] < x_to and w[1] > header_y + 20 and w[1] < 700], key=lambda w: (round(w[1]), w[0]))
            pairs = []
            i = 0
            while i < len(cells) - 1:
                a, b = cells[i], cells[i + 1]
                if re.fullmatch(r"\d{1,2}", a[4]) and re.fullmatch(r"[A-D]", b[4].strip(". ")) and abs(a[1] - b[1]) < 3:
                    pairs.append((int(a[4]), b[4].strip(". ")))
                    i += 2
                else:
                    i += 1
            numbers = [p[0] for p in pairs]
            if numbers != list(range(1, 34)):
                raise RuntimeError(f"Answer key table {t + 1} unexpected: {pairs}")
            keys.append([p[1] for p in pairs])
        return keys
    raise RuntimeError("Answer key page not found")


def parse_conversion(doc):
    for page in doc:
        words = page.get_text("words")
        text = page.get_text()
        if "LOWER" not in text or "UPPER" not in text or "Raw Score Conversion Table" not in text:
            continue
        # Skip the thumbnail page: real table has many numeric rows.
        numeric = [w for w in words if re.fullmatch(r"\d+", w[4])]
        if len(numeric) < 200:
            continue
        rows = {}
        for w in numeric:
            key = None
            for existing in rows:
                if abs(existing - w[1]) <= 2.5:
                    key = existing
                    break
            if key is None:
                key = w[1]
                rows[key] = []
            rows[key].append(w)
        table = {}
        mid = page.rect.width / 2
        for y, row_words in rows.items():
            for side in (lambda w: w[0] < mid, lambda w: w[0] >= mid):
                cells = sorted([w for w in row_words if side(w)], key=lambda w: w[0])
                values = [int(w[4]) for w in cells]
                if len(values) >= 3 and 0 <= values[0] <= 66 and 200 <= values[1] <= 800 and 200 <= values[2] <= 800:
                    table[values[0]] = [values[1], values[2]]
        if sorted(table) != list(range(0, 67)):
            continue  # thumbnail of the worksheet, or a partial table
        return [table[n] for n in range(0, 67)]
    raise RuntimeError("Conversion table not found")


# --------------------------------------------------------------------------------------

def extract_pages(doc, pages, out_path):
    out = pymupdf.open()
    out.insert_pdf(doc, from_page=min(pages) - 1, to_page=max(pages) - 1)
    out.save(out_path, garbage=4, deflate=True, clean=True)
    out.close()


def build_test(number, src, out_dir):
    booklet = pymupdf.open(src / f"sat-practice-test-{number}-digital.pdf")
    answers = pymupdf.open(src / f"sat-practice-test-{number}-answers-digital.pdf")
    scoring = pymupdf.open(src / f"scoring-sat-practice-test-{number}-digital.pdf")

    module_pages = rw_module_pages(booklet)
    all_pages = module_pages[0] + module_pages[1]
    first_page = min(all_pages)
    modules = build_booklet(booklet, module_pages, first_page - 1)
    rw_pdf = f"pt{number}-rw.pdf"
    extract_pages(booklet, all_pages, out_dir / rw_pdf)

    expl_pages = explanation_module_pages(answers)
    expl_first = min(expl_pages[0] + expl_pages[1])
    explanations = build_explanations(answers, expl_pages, expl_first - 1)
    expl_pdf = f"pt{number}-explanations.pdf"
    extract_pages(answers, expl_pages[0] + expl_pages[1], out_dir / expl_pdf)

    keys = parse_answer_key(scoring)
    conversion = parse_conversion(scoring)

    out_modules = []
    for m in range(2):
        questions = []
        for q, entry in enumerate(modules[m]):
            item = {"n": entry["n"], "correct": keys[m][q], "crops": entry["crops"], "explanation": explanations[m][q]}
            if "stem" in entry:
                item["stem"] = entry["stem"]
                item["choices"] = entry["choices"]
            questions.append(item)
        out_modules.append({"questions": questions})
    split_count = sum(1 for m in out_modules for q in m["questions"] if "choices" in q)
    print(f"test {number}: R&W pages {first_page}-{max(all_pages)}, explanations pages {expl_first}-{max(expl_pages[1])}, choice splits {split_count}/66")
    return {
        "id": str(number),
        "title": f"Practice Test {number}",
        "source": {
            "test": f"https://satsuite.collegeboard.org/media/pdf/sat-practice-test-{number}-digital.pdf",
            "answers": f"https://satsuite.collegeboard.org/media/pdf/sat-practice-test-{number}-answers-digital.pdf",
            "scoring": f"https://satsuite.collegeboard.org/media/pdf/scoring-sat-practice-test-{number}-digital.pdf",
        },
        "testPdf": rw_pdf,
        "explanationsPdf": expl_pdf,
        "pageWidth": booklet[0].rect.width,
        "pageHeight": booklet[0].rect.height,
        "moduleMinutes": 39,
        "modules": out_modules,
        "conversion": conversion,
    }


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src = pathlib.Path(sys.argv[1])
    out_dir = pathlib.Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    numbers = [int(n) for n in sys.argv[3:]] or [4, 5, 6, 7, 8, 9, 10, 11]
    manifest_path = out_dir / "practice-tests.json"
    manifest = {"version": 1, "section": "Reading and Writing", "tests": []}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text())
        except json.JSONDecodeError:
            pass
    existing = {t["id"]: t for t in manifest.get("tests", [])}
    for number in numbers:
        existing[str(number)] = build_test(number, src, out_dir)
    manifest["tests"] = [existing[k] for k in sorted(existing, key=int)]
    manifest_path.write_text(json.dumps(manifest, separators=(",", ":")))
    print(f"wrote {manifest_path} ({manifest_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
