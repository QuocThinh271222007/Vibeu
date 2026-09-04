"""Semi-automated nail-region calibration for a new hand-variant photo.

Turns a real photographed base.jpg into a coordinates.json (NailCoord[] — see
src/types/vibeu.ts) without hand-clicking pixel coordinates: GrabCut segments each
nail from a rough seed rectangle (loosely containing it), the resulting contour is
arc-length resampled and smoothed to remove jagged segmentation noise, and the
cuticle->tip axis is oriented toward the photo's overall hand centroid (true for a
loose-fist/curled pose — verify visually for a very different hand pose).

Requires: pip install opencv-python-headless numpy pillow

Usage:
    python calibrate-hand-nails.py '{
      "image": "public/assets/hands/<tone>/variants/<shape>-<length>/base.jpg",
      "out_json": "coordinates.json",
      "out_preview": "preview.png",
      "fingers": [
        {"id": "thumb", "name": "Ngón cái", "rect": [x, y, w, h]},
        {"id": "index", "name": "Ngón trỏ", "rect": [x, y, w, h]},
        {"id": "middle", "name": "Ngón giữa", "rect": [x, y, w, h]},
        {"id": "ring", "name": "Ngón áp út", "rect": [x, y, w, h]},
        {"id": "little", "name": "Ngón út", "rect": [x, y, w, h]}
      ]
    }'

`rect` only needs to loosely contain the nail (with a bit of surrounding skin) — it
does not need to be precise, GrabCut finds the real edge. Find rough rects by eye
against a coordinate-gridded copy of the photo (draw one with PIL: vertical/
horizontal lines every 100px + axis labels). ALWAYS inspect `out_preview` (green
outline + magenta tip-direction arrow per nail) before trusting the output —
verify each arrow points at the nail's free edge, not the cuticle, and that no
outline bleeds onto skin or a neighboring nail. Re-run with adjusted rects if not.
"""

import sys, json
import numpy as np
import cv2
from PIL import Image, ImageDraw

def grabcut_nail(img_bgr, rect, iters=6):
    mask = np.zeros(img_bgr.shape[:2], np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    cv2.grabCut(img_bgr, mask, rect, bgdModel, fgdModel, iters, cv2.GC_INIT_WITH_RECT)
    fg = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
    m = np.zeros_like(fg)
    x, y, w, h = rect
    m[y:y+h, x:x+w] = fg[y:y+h, x:x+w]
    # Morphological closing (dilate then erode) fills small notches/holes caused by the
    # glossy specular highlight or a faint shadow being misclassified as background.
    kernel = np.ones((13, 13), np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return None
    c = max(contours, key=cv2.contourArea).reshape(-1, 2).astype(np.float64)

    # Resample to N evenly-spaced points by arc length, then smooth with a circular moving
    # average. A real nail edge is a smooth organic curve; GrabCut's raw per-pixel boundary
    # (and even a coarse approxPolyDP of it) reproduces small local segmentation errors
    # (one misclassified pixel run from the specular highlight, a faint shadow) as visible
    # jagged notches/teeth. Arc-length resampling + smoothing removes that high-frequency
    # noise while keeping the true overall nail silhouette (which only varies at low
    # frequency around the outline) intact.
    N = 72
    seg = np.diff(c, axis=0, append=c[:1])
    seg_len = np.hypot(seg[:, 0], seg[:, 1])
    cum = np.concatenate([[0], np.cumsum(seg_len)])
    total = cum[-1]
    if total <= 0:
        return None
    targets = np.linspace(0, total, N, endpoint=False)
    resampled = np.empty((N, 2))
    for i, t in enumerate(targets):
        idx = np.searchsorted(cum, t, side='right') - 1
        idx = min(idx, len(c) - 1)
        seg_t = (t - cum[idx]) / (seg_len[idx] if seg_len[idx] > 0 else 1)
        nxt = (idx + 1) % len(c)
        resampled[i] = c[idx] * (1 - seg_t) + c[nxt] * seg_t

    win = 5
    smoothed = np.empty_like(resampled)
    for i in range(N):
        idxs = [(i + k) % N for k in range(-win, win + 1)]
        smoothed[i] = resampled[idxs].mean(axis=0)

    return [(int(round(p[0])), int(round(p[1]))) for p in smoothed]

def process(image_path, fingers, out_json, out_preview):
    img = Image.open(image_path).convert('RGB')
    img_bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    W, H = img.size

    raw = {}
    for finger_id, name, rect in fingers:
        pts = grabcut_nail(img_bgr, rect)
        if pts is None or len(pts) < 3:
            print(f"FAILED: {finger_id}")
            continue
        raw[finger_id] = {"name": name, "pts": pts}

    hand_cx = np.mean([np.mean([p[0] for p in v["pts"]]) for v in raw.values()])
    hand_cy = np.mean([np.mean([p[1] for p in v["pts"]]) for v in raw.values()])

    preview = img.copy()
    draw = ImageDraw.Draw(preview)
    nails = []
    for finger_id, name, rect in fingers:
        if finger_id not in raw:
            continue
        pts = raw[finger_id]["pts"]
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        cx = sum(xs) / len(xs)
        cy = sum(ys) / len(ys)
        bbox = [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)]

        arr = np.array(pts, dtype=np.float64)
        arr_c = arr - arr.mean(axis=0)
        cov = np.cov(arr_c.T)
        evals, evecs = np.linalg.eigh(cov)
        long_axis = evecs[:, np.argmax(evals)]
        vx, vy = float(long_axis[0]), float(long_axis[1])
        # Orient v to point TOWARD the hand's centroid — empirically, in this curled/loose-
        # fist pose every fingertip (and thumb tip) gathers toward a central point near the
        # palm, while every cuticle sits at the outer/proximal edge near the knuckles, so
        # "toward centroid" == "toward the nail tip" for all 5 fingers including the thumb.
        towardx, towardy = hand_cx - cx, hand_cy - cy
        if vx * towardx + vy * towardy < 0:
            vx, vy = -vx, -vy
        vlen = (vx * vx + vy * vy) ** 0.5
        vx, vy = vx / vlen, vy / vlen
        ux, uy = vy, -vx  # rotate v by -90 deg (matches the existing dataset's convention)

        lus = [(p[0] - cx) * ux + (p[1] - cy) * uy for p in pts]
        lvs = [(p[0] - cx) * vx + (p[1] - cy) * vy for p in pts]

        path_d = "M " + " L ".join(f"{p[0]} {p[1]}" for p in pts) + " Z"

        nails.append({
            "id": finger_id,
            "name": name,
            "bbox": bbox,
            "center": [cx, cy],
            "axis": [vx, vy],
            "path": path_d,
            "uvFrame": {
                "u": [ux, uy], "v": [vx, vy],
                "minU": min(lus), "maxU": max(lus),
                "minV": min(lvs), "maxV": max(lvs),
            },
        })
        draw.polygon(pts, outline=(0, 255, 0), width=3)
        draw.ellipse([cx-4, cy-4, cx+4, cy+4], fill=(255, 255, 0))
        # tip direction arrow for visual sign-check
        tipx, tipy = cx + vx * 60, cy + vy * 60
        draw.line([cx, cy, tipx, tipy], fill=(255, 0, 255), width=4)

    preview.save(out_preview)
    with open(out_json, 'w') as f:
        json.dump({"width": W, "height": H, "nails": nails}, f, indent=2)
    print("wrote", out_json, out_preview)

if __name__ == '__main__':
    arg = sys.argv[1]
    # Accept either an inline JSON string or a path to a JSON config file
    # (a file path sidesteps shell-quoting issues with embedded Vietnamese/backslashes).
    raw = open(arg, encoding='utf-8').read() if not arg.strip().startswith('{') else arg
    cfg = json.loads(raw)
    process(cfg['image'], [(f['id'], f['name'], tuple(f['rect'])) for f in cfg['fingers']], cfg['out_json'], cfg['out_preview'])
