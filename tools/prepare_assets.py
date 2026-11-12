"""Prepare bundled assets for the PARALLEL app.

- Builds static font instances (Unbounded / Manrope) from the variable fonts,
  subsets them to Cyrillic + Latin and renames families so the JS key, the CSS
  family and the native family all match.
- Converts the reference artwork into compact JPEG covers.
- Generates a film-grain tile and an app icon.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ATTACH = Path.home() / ".dsh" / "attachments" / "v1" / "objects"

FONT_DIR = ROOT / "assets" / "fonts"
COVER_DIR = ROOT / "assets" / "covers"
BUILD_DIR = ROOT / ".cache" / "assets"

UNICODES = (
    "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,"
    "U+02DC,U+0304,U+0308,U+0329,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116,"
    "U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2197,U+2212,U+2215,U+2260,U+25CF,"
    "U+25CB,U+2605,U+2606,U+2713,U+2717,U+27F6,U+2B50,U+FEFF,U+FFFD"
)

FONTS = [
    ("Manrope", 400, "Manrope"),
    ("Manrope", 600, "ManropeSemi"),
    ("Manrope", 700, "ManropeBold"),
    ("Unbounded", 300, "UnboundedLight"),
    ("Unbounded", 400, "Unbounded"),
    ("Unbounded", 600, "UnboundedSemi"),
]

COVERS = [
    ("0214ea1b0d04aa46de94c1afabbc2da6ce1b941f13f2aa2ec7ee7272d0fb3498", "citadel"),
    ("002f5245a117c9bbdd2777007541748a3dbef8d49520fb7b94082a118dea1f82", "crossroads"),
    ("26f1feefb244037f5e45a19283b311796a3a10a95a513a1a19b7ba417f39c413", "islands"),
    ("5d884ec0c1f9bd5f128d2c9d17772b753a0a0fc0f93597efced3274f862d477e", "neon"),
    ("139bde14a0835b295b61e85942dbca6aa9cba624f7fa156dde00eaa4c3dd22ba", "memory"),
]


def build_fonts() -> list[dict]:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    made: list[dict] = []
    for source, weight, family in FONTS:
        src = FONT_DIR / f"{source}-Variable.ttf"
        if not src.exists():
            print(f"missing variable font {src}")
            continue
        font = instantiateVariableFont(TTFont(src), {"wght": weight}, inplace=False, updateFontNames=False)
        for record in font["name"].names:
            if record.nameID in (1, 4, 6, 16, 17):
                try:
                    text = record.toUnicode()
                except Exception:
                    text = family
                if record.nameID == 1:
                    new = family
                elif record.nameID in (4, 6):
                    new = family
                elif record.nameID == 16:
                    new = family
                else:
                    new = "Regular"
                record.string = new
        raw = BUILD_DIR / f"{family}-full.ttf"
        font.save(raw)
        out = FONT_DIR / f"{family}.ttf"
        subprocess.run(
            [
                sys.executable,
                "-m",
                "fontTools.subset",
                str(raw),
                f"--unicodes={UNICODES}",
                "--layout-features=kern,liga,calt,ccmp,mark,mkmk",
                "--drop-tables+=DSIG",
                "--name-IDs=*",
                "--recalc-bounds",
                f"--output-file={out}",
            ],
            check=True,
            capture_output=True,
        )
        made.append({"family": family, "weight": weight, "file": out.name, "bytes": out.stat().st_size})
    return made


def build_covers() -> list[dict]:
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    made: list[dict] = []
    for sha, name in COVERS:
        src = ATTACH / sha[:2] / sha
        if not src.exists():
            print(f"missing artwork {src}")
            continue
        image = Image.open(src).convert("RGB")
        width = 1080
        if image.width < width:
            width = image.width
        height = round(image.height * width / image.width)
        image = image.resize((width, height), Image.LANCZOS)
        out = COVER_DIR / f"{name}.jpg"
        image.save(out, "JPEG", quality=82, optimize=True, progressive=True)
        made.append({"name": name, "file": out.name, "size": f"{image.width}x{image.height}", "bytes": out.stat().st_size})
    return made


def build_grain() -> dict:
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    import random

    random.seed(7)
    size = 160
    tile = Image.new("RGBA", (size, size))
    pixels = tile.load()
    for y in range(size):
        for x in range(size):
            value = random.randint(90, 255)
            pixels[x, y] = (value, value, value, random.randint(0, 26))
    out = COVER_DIR / "grain.png"
    tile.save(out, "PNG", optimize=True)
    return {"file": out.name, "bytes": out.stat().st_size}


def build_icon() -> dict:
    size = 1024
    canvas = Image.new("RGB", (size, size), "#07060F")
    glow = Image.new("RGB", (size, size), "#07060F")
    gd = ImageDraw.Draw(glow)
    gd.ellipse((190, 190, 834, 834), fill="#2A1550")
    glow = glow.filter(ImageFilter.GaussianBlur(110))
    canvas = Image.blend(canvas, glow, 0.9)

    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    # orbital rings
    d.ellipse((150, 372, 874, 652), outline=(160, 134, 255, 190), width=6)
    d.ellipse((232, 420, 792, 604), outline=(120, 220, 242, 90), width=3)
    # core sphere
    d.ellipse((352, 352, 672, 672), fill=(30, 18, 62, 255), outline=(212, 200, 255, 230), width=5)
    d.ellipse((392, 388, 632, 560), fill=(139, 108, 255, 210))
    d.ellipse((430, 480, 660, 640), fill=(72, 190, 214, 120))
    # wandering star
    d.ellipse((796, 372, 852, 428), fill=(255, 197, 143, 255))
    layer = layer.filter(ImageFilter.GaussianBlur(2))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), layer)

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    out = ROOT / "assets" / "icon.png"
    canvas.convert("RGB").save(out, "PNG", optimize=True)
    splash = canvas.convert("RGB").resize((512, 512), Image.LANCZOS)
    splash.save(ROOT / "assets" / "splash.png", "PNG", optimize=True)
    return {"file": out.name, "bytes": out.stat().st_size}


def main() -> None:
    report = {
        "fonts": build_fonts(),
        "covers": build_covers(),
        "grain": build_grain(),
        "icon": build_icon(),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
