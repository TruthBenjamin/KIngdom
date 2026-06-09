from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "images" / "kingdom-marketplace-logo.png"
RES = ROOT / "android" / "app" / "src" / "main" / "res"
DRAWABLE_NODPI = RES / "drawable-nodpi"

DENSITIES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

source = Image.open(SOURCE).convert("RGBA")
width, height = source.size

# Android launcher icons should use the symbol only. The source brand image also
# includes wordmark/tagline text in the lower area, so crop around the emblem.
left = int(width * 0.09)
right = int(width * 0.91)
top = int(height * 0.05)
bottom = int(height * 0.72)
source = source.crop((left, top, right, bottom))

canvas_size = max(source.size)
canvas = Image.new("RGBA", (canvas_size, canvas_size), (5, 13, 30, 255))
x = (canvas_size - source.width) // 2
y = (canvas_size - source.height) // 2
canvas.paste(source, (x, y))
source = canvas

DRAWABLE_NODPI.mkdir(parents=True, exist_ok=True)
adaptive_foreground = source.resize((432, 432), Image.Resampling.LANCZOS)
adaptive_foreground.save(DRAWABLE_NODPI / "ic_launcher_foreground_logo.png")

for folder, size in DENSITIES.items():
    out_dir = RES / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    icon = source.resize((size, size), Image.Resampling.LANCZOS)
    icon.save(out_dir / "ic_launcher.png")

    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    round_icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    round_icon.paste(icon, (0, 0), mask)
    round_icon.save(out_dir / "ic_launcher_round.png")

print("Generated Android launcher icons from the bundled logo.")
