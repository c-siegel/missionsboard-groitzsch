#!/usr/bin/env python3
"""Verkleinert die Bilder einer Excalidraw-Datei für die Web-Ansicht.

Aufruf:  python3 build/compress.py ~/Downloads/neue-version.excalidraw
Ergebnis: mindmap.excalidraw im Hauptordner des Repos (wird überschrieben).

- Bilder werden auf das 2,5-Fache ihrer Anzeigegröße begrenzt (800–2000 px)
  und als WebP (Qualität 80) gespeichert; SVGs bleiben unverändert.
- Gelöschte Elemente und unbenutzte Bilder werden entfernt.
Benötigt Pillow (pip install pillow).
"""
import argparse
import base64
import io
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def compress(src, dst, scale=2.5, min_px=800, max_px=2000, quality=80):
    d = json.loads(Path(src).read_text(encoding="utf-8"))
    els = [e for e in d["elements"] if not e.get("isDeleted")]

    # größte Anzeigegröße je Bild
    disp = {}
    for e in els:
        if e["type"] == "image" and e.get("fileId"):
            disp[e["fileId"]] = max(disp.get(e["fileId"], 0), e["width"], e["height"])

    files = {}
    for k, f in d.get("files", {}).items():
        if k not in disp:
            continue
        if f["mimeType"] == "image/svg+xml":
            files[k] = f
            continue
        im = Image.open(io.BytesIO(base64.b64decode(f["dataURL"].split(",", 1)[1])))
        im.load()
        target = int(min(max(disp[k] * scale, min_px), max_px))
        if max(im.size) > target:
            im.thumbnail((target, target), Image.LANCZOS)
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=quality, method=6)
        files[k] = {**f, "mimeType": "image/webp",
                    "dataURL": "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()}

    out = {
        "type": "excalidraw",
        "version": 2,
        "elements": els,
        "appState": {"viewBackgroundColor": d.get("appState", {}).get("viewBackgroundColor", "#ffffff")},
        "files": files,
    }
    Path(dst).write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print(f"{src}: {Path(src).stat().st_size / 1e6:.1f} MB -> {dst}: {Path(dst).stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("quelle", help="exportierte .excalidraw-Datei")
    p.add_argument("-o", "--ziel", default=ROOT / "mindmap.excalidraw", help="Ausgabedatei (Standard: mindmap.excalidraw)")
    a = p.parse_args()
    compress(a.quelle, a.ziel)
