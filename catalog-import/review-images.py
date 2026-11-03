import json, pathlib, collections
from PIL import Image,ImageOps,ImageDraw
root=pathlib.Path('catalog-import/migration/stage'); groups=collections.defaultdict(list)
for f in (root/'products').glob('*.json'):
 p=json.loads(f.read_text(encoding='utf-8'))
 for i,im in enumerate(p['images']):groups[im['sha256']].append((p['id'],i,im['path']))
items=sorted(groups.items(),key=lambda x:-len(x[1]))[:80]
json.dump([{'hash':h,'items':v} for h,v in items],open('catalog-import/image-review.json','w'))
for page in range(2):
 sheet=Image.new('RGB',(1000,1000),'white');d=ImageDraw.Draw(sheet)
 for j,(h,v) in enumerate(items[page*40:(page+1)*40]):
  x=(j%8)*125;y=(j//8)*200
  im=Image.open(root/v[0][2]);im.thumbnail((120,165));sheet.paste(im,(x,y));d.text((x,y+170),f'{page*40+j}: {len(v)}',fill='black')
 sheet.save(f'catalog-import/review-{page}.jpg')
