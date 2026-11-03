exec(open('catalog-import/review-images.py').read().split('items=sorted')[0])
review=json.load(open('catalog-import/image-review.json'))
chartids=list(range(11))+[17,18,19,21,22,23,26,27,31,53]
charts={review[i]['hash'] for i in chartids}
plans=[]
for f in (root/'products').glob('*.json'):
 p=json.loads(f.read_text(encoding='utf-8')); ims=p['images']
 if not any(im['sha256'] in charts for im in ims):continue
 photos=[im for im in ims if im['sha256'] not in charts]; guides=[im for im in ims if im['sha256'] in charts]
 plans.append({'source':p['id'],'photos':photos,'guides':guides})
json.dump(plans,open('catalog-import/image-order-review.json','w'))
for page in range((len(plans)+79)//80):
 sheet=Image.new('RGB',(1200,1000),'white');d=ImageDraw.Draw(sheet)
 for j,p in enumerate(plans[page*80:(page+1)*80]):
  x=(j%10)*120;y=(j//10)*125
  if p['photos']:
   im=Image.open(root/p['photos'][0]['path']);im.thumbnail((112,100));sheet.paste(im,(x,y))
  d.text((x,y+103),f'{page*80+j}:{p["source"]}',fill='black')
 sheet.save(f'catalog-import/covers-{page}.jpg')
print('Affected:',len(plans),'pages:',(len(plans)+79)//80,'no garment:',sum(not p['photos'] for p in plans))
