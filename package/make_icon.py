"""Draws icon.ico: a light notebook page with two code cells (one with a run triangle) on a teal tile."""
import os
from PIL import Image, ImageDraw

S = 1024
im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.rounded_rectangle((40, 40, S - 40, S - 40), radius=200, fill=(13, 138, 125, 255))          # teal tile
d.rounded_rectangle((190, 170, S - 190, S - 170), radius=70, fill=(250, 250, 248, 255))        # page
for i, y in enumerate((260, 560)):                                                              # two cells
    d.rounded_rectangle((260, y, S - 260, y + 210), radius=36, outline=(13, 138, 125, 255), width=26)
    if i == 0:
        d.polygon([(310, y + 60), (310, y + 150), (385, y + 105)], fill=(242, 140, 40, 255))   # run triangle
        x0 = 420
    else:
        x0 = 310
    d.rounded_rectangle((x0, y + 70, S - 320, y + 100), radius=15, fill=(120, 130, 140, 255))
    d.rounded_rectangle((x0, y + 125, S - 420, y + 155), radius=15, fill=(170, 178, 186, 255))
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icon.ico")
im.save(out, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
im.resize((256, 256), Image.LANCZOS).save(out.replace(".ico", ".png"))
print(out)
