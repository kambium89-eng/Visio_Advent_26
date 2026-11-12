#!/usr/bin/env python3
"""Export the Adventstage plan from the existing XLSX without Excel dependencies."""
import argparse
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import zipfile

NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
HANDLERS = {1: "form", 5: "story", 6: "video", 7: "hunt", 9: "image", 23: "reveal"}

def read_plan(path):
    with zipfile.ZipFile(path) as book:
        shared = []
        if "xl/sharedStrings.xml" in book.namelist():
            shared = ["".join(node.itertext()) for node in ET.fromstring(book.read("xl/sharedStrings.xml"))]
        tree = ET.fromstring(book.read("xl/worksheets/sheet1.xml"))
        rows = []
        for row in tree.findall(".//x:sheetData/x:row", NS):
            cells = {}
            for cell in row.findall("x:c", NS):
                column = re.match(r"[A-Z]+", cell.attrib["r"])[0]
                value = cell.find("x:v", NS)
                text = value.text if value is not None else ""
                if cell.attrib.get("t") == "s":
                    text = shared[int(text)]
                elif cell.attrib.get("t") == "inlineStr":
                    text = "".join(node.text or "" for node in cell.findall(".//x:t", NS))
                cells[column] = text or ""
            if cells.get("A", "").isdigit():
                day = int(cells["A"])
                house = cells.get("I", "")
                if not re.fullmatch(r"house-(0[1-9]|1[0-9]|2[0-4])\.png", house):
                    raise ValueError(f"Tag {day}: Haus-PNG fehlt oder ist unbekannt")
                for field in ("C", "D", "G"):
                    if not cells.get(field, "").strip():
                        raise ValueError(f"Tag {day}: {field} ist leer")
                rows.append({"day": day, "title": cells["C"], "format": cells["D"], "description": cells["G"], "house": Path(house).stem, "type": HANDLERS.get(day, "placeholder")})
        rows.sort(key=lambda entry: entry["day"])
        if [entry["day"] for entry in rows] != list(range(1, 25)):
            raise ValueError("Die Planung muss genau die Tage 1 bis 24 enthalten")
        return rows

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "content/calendar.json")
    args = parser.parse_args()
    rows = read_plan(args.workbook)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"24 Tage exportiert: {sum(entry['type'] != 'placeholder' for entry in rows)} mit Inhalt, {sum(entry['type'] == 'placeholder' for entry in rows)} mit Platzhalter.")

if __name__ == "__main__":
    main()
