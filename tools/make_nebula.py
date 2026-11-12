"""Procedural nebula cover (used where no painted artwork exists)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "covers" / "nebula.jpg"

W, H = 1400, 1000


def value_noise(rng: np.random.Generator, width: int, height: int, cells: int) -> np.ndarray:
    grid = rng.random((max(2, cells), max(2, cells)))
    image = Image.fromarray((grid * 255).astype("uint8")).resize((width, height), Image.BICUBIC)
    return np.asarray(image, dtype=np.float32) / 255.0


def fbm(rng: np.random.Generator, width: int, height: int, octaves) -> np.ndarray:
    total = np.zeros((height, width), dtype=np.float32)
    weight = 0.0
    for cells, w in octaves:
        total += value_noise(rng, width, height, cells) * w
        weight += w
    return total / weight


def main() -> None:
    rng = np.random.default_rng(20260214)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = xx / W
    ny = yy / H

    warp_x = fbm(rng, W, H, [(5, 0.6), (11, 0.4)]) - 0.5
    warp_y = fbm(rng, W, H, [(4, 0.6), (9, 0.4)]) - 0.5
    density = fbm(rng, W, H, [(3, 0.42), (7, 0.26), (17, 0.18), (41, 0.09), (97, 0.05)])
    density = np.clip(density + 0.16 * (warp_x + warp_y), 0, 1)

    ridged = 1.0 - np.abs(2.0 * fbm(rng, W, H, [(6, 0.5), (13, 0.3), (29, 0.2)]) - 1.0)
    filaments = ridged**3.4

    # РјСЏРіРєРѕРµ СЏРґСЂРѕ С‚СѓРјР°РЅРЅРѕСЃС‚Рё
    cx, cy = 0.38, 0.43
    radial = np.sqrt(((nx - cx) * 1.05) ** 2 + ((ny - cy) * 1.25) ** 2)
    lobe = np.sqrt(((nx - 0.66) * 1.5) ** 2 + ((ny - 0.32) * 1.8) ** 2)
    core = np.exp(-(radial**2) / 0.03) + 0.55 * np.exp(-(lobe**2) / 0.012)
    cloud = np.clip(density * (0.42 + 0.9 * core) + filaments * 0.34 * (0.3 + core), 0, 1) ** 1.3

    violet = np.array([0.42, 0.28, 0.95], dtype=np.float32)
    cyan = np.array([0.30, 0.86, 0.95], dtype=np.float32)
    rose = np.array([1.00, 0.42, 0.62], dtype=np.float32)
    gold = np.array([1.00, 0.75, 0.45], dtype=np.float32)
    base = np.array([0.016, 0.014, 0.035], dtype=np.float32)

    image = np.zeros((H, W, 3), dtype=np.float32) + base
    image += cloud[..., None] * violet * 0.82
    image += (np.clip(cloud - 0.36, 0, 1) ** 1.5)[..., None] * cyan * 1.05
    image += (filaments * (0.35 + core))[..., None] * np.array([0.55, 0.85, 1.0], dtype=np.float32) * 0.42
    image += (np.clip(0.3 - cloud, 0, 1) ** 2.4)[..., None] * rose * 0.7
    image += (core**1.6)[..., None] * gold * 0.32
    image += (core**3.4)[..., None] * np.array([1.0, 0.96, 0.99], dtype=np.float32) * 0.2

    # Р·РІС‘Р·РґС‹
    stars = Image.new("RGB", (W, H), (0, 0, 0))
    draw = ImageDraw.Draw(stars)
    for _ in range(720):
        x = rng.uniform(0, W)
        y = rng.uniform(0, H)
        r = rng.uniform(0.4, 1.5) ** 1.4
        b = int(80 + rng.uniform(0, 175))
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(b, b, min(255, b + 18)))
    for _ in range(9):
        x = rng.uniform(0.08, 0.92) * W
        y = rng.uniform(0.08, 0.92) * H
        draw.line((x - 9, y, x + 9, y), fill=(200, 210, 255), width=1)
        draw.line((x, y - 9, x, y + 9), fill=(200, 210, 255), width=1)
    star_layer = np.asarray(stars.filter(ImageFilter.GaussianBlur(1.3)), dtype=np.float32) / 255.0
    image += star_layer * (1.15 - cloud[..., None] * 0.35)

    # РІРёРЅСЊРµС‚РєР°
    vignette = np.clip(1.25 - 1.05 * (radial**1.25), 0.18, 1.0)
    image *= vignette[..., None]

    image = np.clip(image, 0, 1)
    image = np.clip(image**0.92 * 1.05, 0, 1)
    result = Image.fromarray((image * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.3))
    result.save(OUT, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

