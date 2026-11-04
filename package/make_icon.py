"""Draws the Modern MySQL Workbench logo and its badge.

Logo: a teal tile with a faint grid, a pale database cylinder, and a notebook card in front of it: one code cell with
an orange run button and one result cell with a small bar chart. Badge: the cylinder and card alone, no tile. Drawn
at 4096 px and scaled down, so the edges stay smooth.

    py package/make_icon.py

Writes package/icon.ico (16 to 256 px, the installer's own icon and the shortcut icon when no MySQL Workbench icon is
found), package/icon.png (256 px), docs/images/logo.png (512 px, for the README) and package/badge.png (512 px wide,
with a soft shadow). On install, the badge goes on the corner of the user's own MySQL Workbench icon to make the
shortcut icon (see make_shortcut_icon in kgptalkie_workbench.py), so no Workbench artwork is in this repo.
"""
import os

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
S = 4096                      # drawing size; everything below is in 1024 units times K
K = S / 1024


def k(*v):
    return tuple(round(x * K) for x in v)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def vgrad(w, h, top, bottom):
    g = Image.new("RGBA", (1, h))
    for y in range(h):
        g.putpixel((0, y), lerp(top, bottom, y / max(1, h - 1)))
    return g.resize((w, h))


def hgrad(w, h, stops):
    """Left-to-right gradient through (position, colour) stops."""
    g = Image.new("RGBA", (w, 1))
    for x in range(w):
        t = x / max(1, w - 1)
        for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
            if p0 <= t <= p1:
                g.putpixel((x, 0), lerp(c0, c1, (t - p0) / max(1e-6, p1 - p0)))
                break
    return g.resize((w, h))


def mask_of(draw_fn):
    m = Image.new("L", (S, S), 0)
    draw_fn(ImageDraw.Draw(m))
    return m


def paste(base, fill, m):
    layer = fill if fill.size == (S, S) else None
    if layer is None:
        layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        layer.paste(fill, (0, 0))
    base.alpha_composite(Image.composite(layer, Image.new("RGBA", (S, S), (0, 0, 0, 0)), m))


def solid(c):
    return Image.new("RGBA", (S, S), c)


def shadow(base, m, offset, blur, alpha):
    sh = m.filter(ImageFilter.GaussianBlur(blur * K))
    sh = ImageChops.offset(sh, round(offset[0] * K), round(offset[1] * K))
    base.alpha_composite(Image.composite(solid((0, 0, 0, alpha)), solid((0, 0, 0, 0)), sh))


def draw(with_tile):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # 1. tile: teal with a faint grid and a light rim
    if with_tile:
        tile = mask_of(lambda d: d.rounded_rectangle(k(40, 40, 984, 984), radius=round(200 * K), fill=255))
        paste(img, vgrad(S, S, (0, 136, 165, 255), (0, 92, 114, 255)), tile)
        grid = mask_of(lambda d: [d.line([k(x, 40), k(x, 984)], fill=255, width=round(5 * K)) for x in range(158, 984, 118)]
                       + [d.line([k(40, y), k(984, y)], fill=255, width=round(5 * K)) for y in range(158, 984, 118)])
        paste(img, solid((255, 255, 255, 34)), ImageChops.multiply(grid, tile))
        rim = mask_of(lambda d: d.rounded_rectangle(k(40, 40, 984, 984), radius=round(200 * K), outline=255, width=round(14 * K)))
        paste(img, vgrad(S, S, (215, 236, 240, 255), (175, 210, 218, 255)), ImageChops.multiply(rim, tile))

    # 2. database cylinder (left, behind the card)
    cx0, cx1, top, bot, ry = 168, 600, 196, 742, 78
    body = mask_of(lambda d: [d.rectangle(k(cx0, top, cx1, bot), fill=255), d.ellipse(k(cx0, bot - ry, cx1, bot + ry), fill=255)])
    shadow(img, body, (0, 18), 26, 120)
    side = hgrad(S, S, [(0.0, (168, 220, 230, 255)), (cx0 / 1024, (168, 220, 230, 255)), ((cx0 + 120) / 1024, (236, 250, 252, 255)),
                        ((cx0 + 230) / 1024, (214, 241, 246, 255)), (cx1 / 1024, (150, 205, 217, 255)), (1.0, (150, 205, 217, 255))])
    paste(img, side, body)
    for yb in (top + 182, top + 364):                                   # two bands: a dark seam and a light lip
        seam = mask_of(lambda d, yb=yb: d.arc(k(cx0, yb - ry, cx1, yb + ry), 0, 180, fill=255, width=round(16 * K)))
        paste(img, solid((0, 110, 136, 150)), ImageChops.multiply(seam, body))
        lip = mask_of(lambda d, yb=yb: d.arc(k(cx0, yb - ry + 16, cx1, yb + ry + 16), 0, 180, fill=255, width=round(6 * K)))
        paste(img, solid((255, 255, 255, 120)), ImageChops.multiply(lip, body))
    lid = mask_of(lambda d: d.ellipse(k(cx0, top - ry, cx1, top + ry), fill=255))
    paste(img, vgrad(S, S, (255, 255, 255, 255), (222, 243, 247, 255)), lid)
    lid_rim = mask_of(lambda d: d.ellipse(k(cx0, top - ry, cx1, top + ry), outline=255, width=round(5 * K)))
    paste(img, solid((150, 205, 217, 200)), lid_rim)

    # 3. notebook card (front, right)
    card_box = (418, 412, 900, 884)
    card = mask_of(lambda d: d.rounded_rectangle(k(*card_box), radius=round(62 * K), fill=255))
    shadow(img, card, (0, 22), 34, 150)
    paste(img, vgrad(S, S, (255, 255, 255, 255), (238, 242, 247, 255)), card)

    # 3a. code cell: run button and two lines of code
    c1 = (462, 456, 856, 604)
    cell1 = mask_of(lambda d: d.rounded_rectangle(k(*c1), radius=round(30 * K), fill=255))
    paste(img, solid((246, 248, 251, 255)), cell1)
    c1_rim = mask_of(lambda d: d.rounded_rectangle(k(*c1), radius=round(30 * K), outline=255, width=round(7 * K)))
    paste(img, solid((14, 143, 168, 255)), c1_rim)
    run = mask_of(lambda d: d.ellipse(k(490, 488, 574, 572), fill=255))
    paste(img, vgrad(S, S, (255, 170, 60, 255), (236, 120, 16, 255)), run)
    tri = mask_of(lambda d: d.polygon([k(519, 509), k(519, 551), k(555, 530)], fill=255))
    paste(img, solid((255, 255, 255, 255)), tri)
    for (x0, y0, x1, col) in ((602, 500, 812, (14, 143, 168, 255)), (602, 544, 742, (148, 160, 176, 255))):
        ln = mask_of(lambda d, x0=x0, y0=y0, x1=x1: d.rounded_rectangle(k(x0, y0, x1, y0 + 26), radius=round(13 * K), fill=255))
        paste(img, solid(col), ln)

    # 3b. result cell: a small bar chart on a baseline
    c2 = (462, 632, 856, 840)
    cell2 = mask_of(lambda d: d.rounded_rectangle(k(*c2), radius=round(30 * K), fill=255))
    paste(img, solid((246, 248, 251, 255)), cell2)
    c2_rim = mask_of(lambda d: d.rounded_rectangle(k(*c2), radius=round(30 * K), outline=255, width=round(5 * K)))
    paste(img, solid((206, 214, 224, 255)), c2_rim)
    bars = [(504, 742, (52, 168, 196, 255)), (578, 700, (14, 143, 168, 255)), (652, 722, (52, 168, 196, 255)),
            (726, 668, (242, 145, 17, 255))]
    for x, y, col in bars:
        b = mask_of(lambda d, x=x, y=y: d.rounded_rectangle(k(x, y, x + 52, 800), radius=round(12 * K), fill=255))
        paste(img, solid(col), b)
    base = mask_of(lambda d: d.rounded_rectangle(k(492, 800, 826, 810), radius=round(5 * K), fill=255))
    paste(img, solid((120, 132, 148, 255)), base)
    return img.resize((1024, 1024), Image.LANCZOS)


big = draw(True)
ico = os.path.join(HERE, "icon.ico")
big.save(ico, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
big.resize((256, 256), Image.LANCZOS).save(os.path.join(HERE, "icon.png"))
os.makedirs(os.path.join(REPO, "docs", "images"), exist_ok=True)
big.resize((512, 512), Image.LANCZOS).save(os.path.join(REPO, "docs", "images", "logo.png"))

# badge: the mark cropped to what is drawn, with a soft shadow so it stands out on any icon
mark = draw(False)
mark = mark.crop(mark.split()[3].point(lambda a: 255 if a > 8 else 0).getbbox())
pad = 40
b = Image.new("RGBA", (mark.width + 2 * pad, mark.height + 2 * pad), (0, 0, 0, 0))
sh = Image.new("RGBA", b.size, (0, 0, 0, 0))
sh.paste((0, 0, 0, 120), (pad + 6, pad + 12), mark.split()[3])
b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
b.alpha_composite(mark, (pad, pad))
b = b.resize((512, round(b.height * 512 / b.width)), Image.LANCZOS)
b.save(os.path.join(HERE, "badge.png"), optimize=True)
print(ico)
