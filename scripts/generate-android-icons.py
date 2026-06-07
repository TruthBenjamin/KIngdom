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
side = min(source.size)
left = (source.width - side) // 2
top = (source.height - side) // 2
source = source.crop((left, top, left + side, top + side))

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
