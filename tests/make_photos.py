"""photos 테스트용 이미지 생성: python3 make_photos.py <outdir>"""
import sys, os
from PIL import Image
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
# 3000x2000 : 왼쪽 빨강, 오른쪽 파랑, EXIF 회전 6 (시계 방향 90도로 보여야 함 -> 2000x3000)
im = Image.new('RGB', (3000, 2000), (220, 30, 30))
im.paste((30, 30, 220), (1500, 0, 3000, 2000))
exif = Image.Exif(); exif[0x0112] = 6
im.save(os.path.join(out, 'rot.jpg'), 'JPEG', quality=90, exif=exif)
# 투명 PNG (투명 부분은 흰색이 되어야 함)
p = Image.new('RGBA', (400, 300), (0, 0, 0, 0))
p.paste((0, 160, 0, 255), (0, 0, 200, 300))
p.save(os.path.join(out, 'alpha.png'))
open(os.path.join(out, 'note.txt'), 'w').write('not an image')
