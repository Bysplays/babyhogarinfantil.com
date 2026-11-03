import json
plans=json.load(open('catalog-import/image-order-review.json'));bad=json.load(open('catalog-import/detail-covers.json'));mapping=json.load(open('catalog-import/database-map.json'))
chosen={i:1 for i in bad};chosen.update({4:2,97:2,290:2,310:0,311:2,314:2,338:2,340:4,341:2,343:4,344:2,345:2,389:2,393:2,396:2,401:2,410:2,415:2,417:2,418:2,421:3,422:2,424:2,427:2,428:2,429:0,431:2,442:2,451:2,493:4,495:3,498:2,499:2,500:2,501:2,502:3,503:2,506:2,507:2,509:3,510:3,511:0,521:3})
out=[]
for idx,p in enumerate(plans):
 original=json.load(open('catalog-import/migration/stage/products/'+p['source']+'.json',encoding='utf-8'))['images'];photos=p['photos'];cover=photos[chosen.get(idx,0)];ordered=[cover]+[im for im in photos if im['sourceId']!=cover['sourceId']]+p['guides'];out.append({'product':int(mapping['done'][p['source']]['id']),'source':p['source'],'order':[next(i for i,o in enumerate(original) if o['sourceId']==im['sourceId']) for im in ordered],'guides':len(p['guides'])})
json.dump(out,open('catalog-import/image-order-plan.json','w'))
