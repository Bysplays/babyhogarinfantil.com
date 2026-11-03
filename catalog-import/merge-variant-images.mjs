import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseProduct} from './import-public-catalog.mjs';
const root='migration/stage', images=new Map();
for(const file of fs.readdirSync(root+'/responses')){
 try{const text=fs.readFileSync(root+'/responses/'+file,'utf8');const html=file.endsWith('.json')?JSON.parse(text).product_details:text;if(!html)continue;const p=parseProduct(html).product;let items=images.get(String(p.id));if(!items){items=new Map();images.set(String(p.id),items);}for(const image of p.images||[])if(image.id_image)items.set(String(image.id_image),image);}catch{}
}
const files=fs.readdirSync(root+'/products');let cursor=0;const report={added:0,errors:[],withoutImages:[]};
await Promise.all(Array.from({length:3},async()=>{while(cursor<files.length){const file=files[cursor++],p=JSON.parse(fs.readFileSync(root+'/products/'+file));for(const [id,image] of images.get(p.id)||[]){if(p.images.some(i=>i.sourceId===id))continue;const url=image.large?.url||image.bySize?.large_default?.url;if(!url)continue;const local=`assets/${p.id}-${id}.jpg`;try{if(new URL(url).origin!=='https://babyhogarinfantil.com')throw Error('Origin');if(!fs.existsSync(root+'/'+local)){const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error('HTTP '+r.status);fs.writeFileSync(root+'/'+local,Buffer.from(await r.arrayBuffer()));}p.images.push({path:local,sourceUrl:url,alt:image.legend||p.name,sourceId:id,variantIds:image.associatedVariants||[],sha256:crypto.createHash('sha256').update(fs.readFileSync(root+'/'+local)).digest('hex')});report.added++;}catch(e){report.errors.push({id:p.id,image:id,error:e.message});}}
if(p.images.length)p.issues=p.issues.filter(x=>x!=='No verified images');else report.withoutImages.push(p.id);fs.writeFileSync(root+'/products/'+file,JSON.stringify(p,null,2));}}));
fs.writeFileSync('variant-image-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
