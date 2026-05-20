"""
Backfill: derive signal_word for all existing sds_documents where signal_word IS NULL.
Run once: venv/bin/python backfill_signal_word.py
"""
import re
from database import SessionLocal
from models import SDSDocument, Section, Subsection


def extract_signal_word_from_db(doc_id: int, db) -> str | None:
    sections = db.query(Section).filter(Section.document_id == doc_id).all()

    # Prefer Section 2 first, then fall back to all sections
    sec2 = [s for s in sections if s.section_number == "2"] or sections

    for sec in sec2:
        subs = db.query(Subsection).filter(Subsection.section_id == sec.id).all()
        for sub in subs:
            title = (sub.title or "").strip().lower()
            if "signal" in title and "word" in title:
                content = (sub.content or "").strip()
                first_token = content.split()[0] if content else ""
                for word in ("Danger", "Warning"):
                    if first_token.lower() == word.lower():
                        return word
                for word in ("Danger", "Warning"):
                    if re.search(rf"\b{word}\b", content, re.IGNORECASE):
                        return word
    return None


def main():
    db = SessionLocal()
    docs = db.query(SDSDocument).filter(SDSDocument.signal_word == None).all()
    print(f"Found {len(docs)} documents with missing signal_word")

    updated = 0
    for doc in docs:
        sw = extract_signal_word_from_db(doc.id, db)
        doc.signal_word = sw
        if sw:
            updated += 1
        print(f"  Doc #{doc.id} ({doc.product_name[:40] if doc.product_name else 'N/A'}): {sw or '(none found)'}")

    db.commit()
    db.close()
    print(f"\nDone. Updated {updated}/{len(docs)} documents with a signal word.")


if __name__ == "__main__":
    main()
