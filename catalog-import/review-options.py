import json,pathlib
import numpy as np
from PIL import Image,ImageDraw
root=pathlib.Path('catalog-import/migration/stage');plans=json.load(open('catalog-import/image-order-review.json'))
bad=[0,2,4,91,97,98,103,278,279,281,282,289,290,309,310,311,313,314,315,320,325,331,333,334,335,338,340,341,343,344,345,355,356,385,389,390,392,393,395,396,401,409,410,415,417,418,421,422,424,427,428,429,430,431,438,442,447,448,449,450,451,470,471,477,486,487,488,490,491,493,495,496,497,498,499,500,501,502,503,504,505,506,507,509,510,511,518,521]
for page in range((len(bad)+7)//8):
 sheet=Image.new('RGB',(1200,960),'white');d=ImageDraw.Draw(sheet)
 for row,idx in enumerate(bad[page*8:(page+1)*8]):
  p=plans[idx]
  for col,im in enumerate(p['photos'][:10]):
   pic=Image.open(root/im['path']);pic.thumbnail((110,92));sheet.paste(pic,(col*120,row*120));d.text((col*120,row*120+95),f'{idx}/{col}',fill='black')
 sheet.save(f'catalog-import/options-{page}.jpg')
json.dump(bad,open('catalog-import/detail-covers.json','w'))
print(len(bad))
