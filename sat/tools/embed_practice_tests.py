#!/usr/bin/env python3
"""Refresh the practice-test manifest embedded in sat/index.html from sat/tests/practice-tests.json."""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
html_path = root / "index.html"
manifest = (root / "tests" / "practice-tests.json").read_text(encoding="utf-8").strip()
assert "</script" not in manifest
html = html_path.read_text(encoding="utf-8")
pattern = re.compile(r'(<script type="application/json" id="practiceTestData">)(.*?)(</script>)', re.S)
updated, count = pattern.subn(lambda m: m.group(1) + manifest + m.group(3), html)
assert count == 1, count
html_path.write_text(updated, encoding="utf-8")
print(f"embedded {len(manifest) // 1024} KB manifest")
