"""
Run this on your Mac to diagnose why extraction is failing:
  python3 debug_sds.py '/path/to/ACETONE-OPTIMA-GRADE-4L.pdf'
"""
import sys, traceback

pdf_path = sys.argv[1] if len(sys.argv) > 1 else "ACETONE-OPTIMA-GRADE-4L.pdf"

print(f"PDF: {pdf_path}\n")

# 1. pdfplumber version
try:
    import pdfplumber
    print(f"pdfplumber version : {pdfplumber.__version__}")
except ImportError:
    print("ERROR: pdfplumber not installed — run: pip install pdfplumber")
    sys.exit(1)

# 2. Can we open it?
try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Pages              : {len(pdf.pages)}")

        # 3. Plain extract_text()
        plain = pdf.pages[0].extract_text() or ""
        print(f"Plain text chars   : {len(plain)}")
        print(f"Plain sample       : {repr(plain[:120])}\n")

        # 4. layout=True
        try:
            layout = pdf.pages[0].extract_text(layout=True) or ""
            print(f"Layout text chars  : {len(layout)}")
            print(f"Layout sample      : {repr(layout[:120])}\n")
        except TypeError as e:
            print(f"layout=True failed : {e}  (old pdfplumber — plain mode will be used)\n")
        except Exception as e:
            print(f"layout=True error  : {e}\n")

        # 5. All pages combined
        all_plain = "\n".join(p.extract_text() or "" for p in pdf.pages)
        print(f"All pages combined : {len(all_plain)} chars")

        # 6. Key field check
        import re
        checks = {
            "Product Name" : r'Product\s+Name',
            "CAS No"       : r'CAS\s+No',
            "Revision Date": r'Revision\s+Date',
            "Flash Point"  : r'Flash\s+Point',
            "ThermoFisher" : r'Thermo\s*Fisher|Fisher\s*Scientific',
        }
        print("\nKeyword presence in combined plain text:")
        for label, pattern in checks.items():
            found = bool(re.search(pattern, all_plain, re.I))
            print(f"  {label:20s}: {'YES' if found else 'NO'}")

except Exception:
    print("ERROR opening PDF:")
    traceback.print_exc()