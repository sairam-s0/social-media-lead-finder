import os
from PIL import Image, ImageDraw

def create_lead_finder_icon(output_path="assets/app.ico"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Generate at 512x512 master resolution
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background with vibrant gradient / indigo-violet
    # Background circle/rounded rectangle
    r = 90
    draw.rounded_rectangle([32, 32, 480, 480], radius=r, fill=(79, 70, 229, 255)) # Indigo-600

    # Inner subtle glow ring
    draw.rounded_rectangle([44, 44, 468, 468], radius=r-10, outline=(129, 140, 248, 200), width=6)

    # Radar concentric arcs (Lead Finder motif)
    radar_center = (256, 256)
    draw.arc([100, 100, 412, 412], start=190, end=350, fill=(199, 210, 254, 180), width=10)
    draw.arc([140, 140, 372, 372], start=200, end=340, fill=(224, 231, 255, 210), width=12)
    
    # Stylized lightning bolt / pulse in center (Vibrant Amber/Gold)
    # Polygon points for a clean modern lightning bolt
    bolt_points = [
        (280, 90),
        (170, 270),
        (250, 270),
        (220, 420),
        (350, 230),
        (270, 230),
        (310, 90)
    ]
    # Bolt shadow
    bolt_shadow = [(x + 4, y + 6) for (x, y) in bolt_points]
    draw.polygon(bolt_shadow, fill=(30, 27, 75, 120))
    # Bolt body
    draw.polygon(bolt_points, fill=(251, 191, 36, 255)) # Amber-400
    
    # Inner bolt highlight
    inner_bolt = [
        (280, 120),
        (205, 250),
        (260, 250),
        (240, 360),
        (320, 245),
        (275, 245),
        (298, 120)
    ]
    draw.polygon(inner_bolt, fill=(254, 240, 138, 220))

    # Save as multi-resolution ICO
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save(output_path, format="ICO", sizes=icon_sizes)
    print(f"Professional icon generated at {output_path} with sizes: {icon_sizes}")

if __name__ == "__main__":
    create_lead_finder_icon()
