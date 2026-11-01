"""Create versioned, editable Word copies from the locally rendered legal pages.

Requires python-docx and lxml for document preparation only, never at app runtime.
Run a local Next server, then: python3 scripts/export-legal-docx.py --base http://127.0.0.1:3102
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlopen
from docx import Document
from docx.shared import Cm, Pt
from lxml import html

parser = argparse.ArgumentParser()
parser.add_argument("--base", default="http://127.0.0.1:3102")
args = parser.parse_args()
base = args.base.rstrip("/")
if urlparse(base).hostname not in ("127.0.0.1", "localhost"):
    raise SystemExit("Use a local app server so the generated copies match the checked-out content.")
root = Path(__file__).resolve().parents[1]
version = json.loads((root / "content/booking.json").read_text())["termsVersion"]
destination = root / "public/dokumentumok/jogi"
destination.mkdir(parents=True, exist_ok=True)
manifest = []
for slug in ("adatkezelesi-tajekoztato", "adatvedelmi-es-adatbiztonsagi-szabalyzat"):
    with urlopen(base + "/" + slug, timeout=30) as response:
        page = html.fromstring(response.read())
    with urlopen(base + "/dokumentumok/" + slug + ".txt", timeout=30) as response:
        source = response.read()
    if version not in source.decode("utf-8-sig"):
        raise SystemExit("The local server is serving a different legal version.")
    doc = Document()
    section = doc.sections[0]
    section.page_width, section.page_height = Cm(21), Cm(29.7)
    section.top_margin = section.bottom_margin = Cm(2)
    doc.styles["Normal"].font.name = "Calibri"
    doc.styles["Normal"].font.size = Pt(10)
    doc.core_properties.author = "Fair Autószerviz Fehérvár Kft."
    doc.core_properties.created = datetime.now(timezone.utc)
    doc.core_properties.subject = "Üzemeltetői felülvizsgálatra váró változat: " + version
    doc.add_heading(page.xpath("//h1")[0].text_content().strip(), 0)
    doc.add_paragraph("Változat: " + version)
    note = page.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," legal-draft-note ")]')
    if note:
        doc.add_paragraph(" ".join(note[0].text_content().split()))
    for block in page.xpath('//section[contains(concat(" ",normalize-space(@class)," ")," legal-section ")]'):
        doc.add_heading(" ".join(block.xpath("./h3")[0].text_content().split()), 1)
        for row in block.xpath("./dl/div"):
            paragraph = doc.add_paragraph()
            paragraph.add_run(row.xpath("./dt")[0].text_content().strip() + ": ").bold = True
            paragraph.add_run(row.xpath("./dd")[0].text_content().strip())
        for paragraph in block.xpath("./p"):
            doc.add_paragraph(" ".join(paragraph.text_content().split()))
        for item in block.xpath("./ul/li"):
            text = " ".join(item.text_content().split())
            for link in item.xpath(".//a[@href]"):
                text += " (" + link.get("href") + ")"
            doc.add_paragraph(text, style="List Bullet")
    filename = slug + "-" + version + ".docx"
    doc.save(destination / filename)
    # Opening the result verifies that a usable Word package was written.
    assert len(Document(destination / filename).paragraphs) > 20
    manifest.append({"slug": slug, "version": version, "filename": filename,
                     "sourceSha256": hashlib.sha256(source).hexdigest()})
    print(filename)
(root / "content/legal-downloads.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
