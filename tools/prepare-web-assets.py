"""Create lightweight website copies; original PNGs remain the email/source assets."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]

def prepare(root=ROOT):
    output=root/'assets/web'
    for name in ['houses','decorations']:(output/name).mkdir(parents=True,exist_ok=True)
    with Image.open(root/'assets/backgrounds/Background_aquarel_unsplash.jpg') as original:
        image=ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((2000,2600))
        image.save(output/'background.webp','WEBP',quality=88,method=6)
    for source in sorted((root/'assets/houses').glob('house-*.png')):
        with Image.open(source) as original:
            image=original.convert('RGBA')
            factor=768/max(image.size)
            image=image.resize((round(image.width*factor),round(image.height*factor)),Image.Resampling.LANCZOS)
            canvas=Image.new('RGBA',(768,768),(0,0,0,0))
            canvas.alpha_composite(image,((768-image.width)//2,(768-image.height)//2))
            canvas.save(output/'houses'/f'{source.stem}.webp','WEBP',quality=88,method=6)
    for source in sorted((root/'assets/decorations').glob('*.png')):
        with Image.open(source) as original:
            image=original.convert('RGBA');image.thumbnail((1000,1000) if source.stem.startswith('snow') else (450,600))
            image.save(output/'decorations'/f'{source.stem}.webp','WEBP',quality=87,method=6)
    print(f'Prepared {len(list(output.rglob("*.webp")))} web assets, {sum(p.stat().st_size for p in output.rglob("*.webp"))//1024} KiB total. Original PNGs unchanged.')

if __name__=='__main__':
    import sys
    prepare(Path(sys.argv[1]) if len(sys.argv)>1 else ROOT)
