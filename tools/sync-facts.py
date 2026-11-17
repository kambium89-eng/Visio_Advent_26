#!/usr/bin/env python3
"""Export the five approved day-4 articles and sources from the Obsidian project."""
import argparse
import json
from pathlib import Path
import re

TOPICS = [
    ("wintergruen", "Wintergrün", "leaf", "Woher kommt der Brauch vom Weihnachtsbaum?"),
    ("nikolaus", "Samichlaus", "star", "Nikolaus"),
    ("sonnenwende", "Sonnenwende", "sun", "Weihnachten und Wintersonnenwende"),
    ("island", "Island", "mountain", "Weihnachten in Island"),
    ("adventskranz", "Adventskranz", "wreath", "Woher kommt der Adventskranz?"),
]


def read_articles(project):
    articles = []
    for identifier, label, symbol, name in TOPICS:
        text = (project / "Quellen/Fakten zu Weihnachten" / f"{name}.md").read_text(encoding="utf-8")
        article = text.split("## Artikel\n\n", 1)[1].split("\n## ", 1)[0].strip()
        plain = re.sub(r"\[\^\d+\]", "", article)
        paragraphs = [" ".join(part.splitlines()) for part in plain.split("\n\n")]
        if len(paragraphs) != 2 or len(re.findall(r"[^.!?]+[.!?]", plain)) != 6:
            raise ValueError(f"{name}: expected two paragraphs and six sentences")
        question = re.search(r"Kartenfrage: \*\*(.+?)\*\*", text)
        sources = []
        for match in re.finditer(r"^\[\^(\d+)\]: \[([^\]]+)\]\((https://[^)]+)\)(.*)$", text, re.M):
            number, title, url, note = match.groups()
            sources.append({"id": number, "title": title, "url": url, "note": note.lstrip(", ")})
        required = set(re.findall(r"\[\^(\d+)\]", article))
        if not question or not required <= {source["id"] for source in sources}:
            raise ValueError(f"{name}: missing question or source")
        articles.append({"id": identifier, "label": label, "symbol": symbol, "title": name,
                         "question": question[1], "paragraphs": paragraphs, "sources": sources})
    return articles


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", type=Path, help="Obsidian Advent project directory")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "content/04-fakten.json")
    args = parser.parse_args()
    data = {"researchDate": "17. November 2026", "facts": read_articles(args.project)}
    args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Exported five six-sentence articles with their questions and sources.")


if __name__ == "__main__":
    main()
