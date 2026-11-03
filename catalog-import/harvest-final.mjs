// Stages public source data only. Never modifies dist/ or publishes the site.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const decode = value => String(value||'').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/&(quot|apos|lt|gt|nbsp|amp);/g,(_,n)=>({quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',amp:'&'}[n]));
export const plain = value => decode(String(value||'').replace(/<\/(p|li|div|h\d)>/gi,'\n').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'')).replace(/[ \t]+/g,' ').trim();
export function parseProduct(html) {
  const raw=html.match(/data-product="([^"]+)"/);
  if(!raw)throw Error('Product data missing');
  const product=JSON.parse(decode(raw[1]));
  if(!product.id||!product.name||!Number.isFinite(Number(product.price_amount)))throw Error('Invalid product identity or price');
  const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{try{return [JSON.parse(m[1])]}catch{return []}});
  const schema=schemas.find(x=>x['@type']==='Product');
  const variantHtml=html.match(/class="product-variants[\s\S]*?(?=<div class="product-discounts)/)?.[0]||'';
  const groups=[];
  for(const select of variantHtml.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)) {
    const id=select[1].match(/name="group\[(\d+)\]"/)?.[1];if(!id)continue;
    const options=[...select[2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)].map(m=>({id:m[1].match(/value="([^"]+)"/)?.[1],label:plain(m[2])})).filter(x=>x.id);
    groups.push({id,label:decode(select[1].match(/aria-label="([^"]+)"/)?.[1]||'Atributo'),options});
  }
  for(const input of variantHtml.matchAll(/<input\b([^>]*)>/g)) {
    const id=input[1].match(/name="group\[(\d+)\]"/)?.[1],value=input[1].match(/value="([^"]+)"/)?.[1];if(!id||!value)continue;
    let group=groups.find(x=>x.id===id);if(!group){group={id,label:product.attributes?.[id]?.group||'Atributo',options:[]};groups.push(group)}
    if(!group.options.some(x=>x.id===value))group.options.push({id:value,label:decode(input[1].match(/(?:title|aria-label)="([^"]+)"/)?.[1]||'')});
  }
  return {product,groups,brand:schema?.brand?.name||null};
}
export function variant(product) {
  return {id:String(product.id_product_attribute||'0'),attributes:Object.values(product.attributes||{}).map(a=>({groupId:String(a.id_attribute_group),id:String(a.id_attribute),group:a.group,value:a.name})),sku:Object.values(product.attributes||{}).find(a=>a.reference)?.reference||product.reference||null,productSku:product.reference||null,taxRate:Number(product.rate||0),price:Number(product.price_amount),oldPrice:product.has_discount&&Number(product.price_without_reduction)>Number(product.price_amount)?Number(product.price_without_reduction):null,quantity:product.quantity!=null&&Number.isFinite(Number(product.quantity))?Number(product.quantity):null,availability:product.availability||'unknown',availabilityMessage:product.availability_message||null,availableForOrder:String(product.available_for_order)==='1',allowBackorder:product.allow_oosp===true,observedAt:new Date().toISOString()};
}
async function run(){
 const root=path.resolve('migration'),stage=path.join(root,'stage');for(const dir of ['products','assets','responses'])fs.mkdirSync(path.join(stage,dir),{recursive:true});
 const discovery=JSON.parse(fs.readFileSync(path.join(root,'discovery.json'),'utf8'));
 const report={startedAt:new Date().toISOString(),detected:discovery.products.length,sourceEnumerationComplete:discovery.complete,imported:0,errors:[],incomplete:[],images:0,complete:false};
 const limitArg=process.argv.find(x=>x.startsWith('--limit='));const limit=limitArg?Number(limitArg.split('=')[1]):Infinity;
 const save=()=>fs.writeFileSync(path.join(stage,'import-final-report.json'),JSON.stringify(report,null,2));
 async function request(url,json=false){const u=new URL(url);if(u.origin!=='https://babyhogarinfantil.com')throw Error('Unexpected remote origin');const file=path.join(stage,'responses',crypto.createHash('sha256').update(url).digest('hex')+(json?'.json':'.html'));if(fs.existsSync(file))return fs.readFileSync(file,'utf8');const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('HTTP '+response.status);const text=await response.text();fs.writeFileSync(file,text);return text;}
 const offset=Number(process.argv.find(x=>x.startsWith('--offset='))?.split('=')[1]||0); const queue=discovery.products.slice(offset,limit===Infinity?undefined:offset+limit); let cursor=0; await Promise.all(Array.from({length:3},async()=>{ while(cursor<queue.length) { const entry=queue[cursor++];
  const output=path.join(stage,'products',entry.id+'.json');
  try {
   if(fs.existsSync(output)){const existing=JSON.parse(fs.readFileSync(output));report.imported++;report.images+=existing.images.length;if(existing.issues.length)report.incomplete.push({id:entry.id,issues:existing.issues});continue;}
   const {product:p,groups,brand}=parseProduct(await request(entry.url));if(String(p.id)!==entry.id)throw Error('Source redirected to a different product');
   const variants=new Map([[String(p.id_product_attribute||'0'),variant(p)]]),issues=[];
   let combinations=[{}];for(const g of groups)combinations=combinations.flatMap(c=>g.options.map(o=>({...c,[g.id]:o.id})));
   if(combinations.length>512){issues.push('More than 512 possible combinations; needs official export');combinations=[];}
   for(const combination of combinations){if(Object.entries(combination).every(([g,a])=>String(p.attributes?.[g]?.id_attribute)===a))continue;
    try{const u=new URL(p.link||entry.url);u.hash='';u.search='';u.searchParams.set('ajax','1');u.searchParams.set('action','refresh');for(const [g,a]of Object.entries(combination))u.searchParams.set('group['+g+']',a);
     const response=JSON.parse(await request(u.href,true));const v=parseProduct(response.product_details).product;if(String(v.id)!==entry.id)throw Error('Variant identity mismatch');
     if(Object.entries(combination).every(([g,a])=>String(v.attributes?.[g]?.id_attribute)===a))variants.set(String(v.id_product_attribute||'0'),variant(v));
     else issues.push('Unresolved combination: '+JSON.stringify(combination));
    }catch(e){issues.push('Variant: '+e.message)}
   }
   const images=[];
   for(const image of p.images||[]){const remote=image.large?.url||image.bySize?.large_default?.url;if(!remote){issues.push('Image URL missing');continue;}
    const local='assets/'+entry.id+'-'+image.id_image+'.jpg',dest=path.join(stage,local);
    try{if(!fs.existsSync(dest)){const u=new URL(remote);if(u.origin!=='https://babyhogarinfantil.com')throw Error('Unexpected image origin');const r=await fetch(remote,{signal:AbortSignal.timeout(60000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error('Image unavailable');const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length<100)throw Error('Empty image');fs.writeFileSync(dest,bytes);}
     images.push({path:local,sourceUrl:remote,alt:image.legend||p.name,sourceId:String(image.id_image),variantIds:image.associatedVariants||[],sha256:crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex')});
    }catch(e){issues.push('Image '+image.id_image+': '+e.message)}
   }
   if(!images.length)issues.push('No verified images');
   const record={schemaVersion:1,id:entry.id,sourceUrl:p.link||entry.url,name:p.name,brand,sku:p.reference||null,description:plain(p.description_short),details:plain(p.description),sourceDescriptionHtml:p.description||'',features:p.features||[],categoryIds:[...new Set([...entry.categoryIds,String(p.id_category_default)])],sourceDefaultCategoryId:String(p.id_category_default),sourceCategoryName:p.category_name||null,price:Number(p.price_amount),oldPrice:p.has_discount&&Number(p.price_without_reduction)>Number(p.price_amount)?Number(p.price_without_reduction):null,new:p.new===1||p.new===true||p.new==='1',sourceAddedAt:p.date_add||null,sourceUpdatedAt:p.date_upd||null,taxRate:Number(p.rate||0),condition:p.condition||null,visibility:p.visibility||null,availability:p.availability||'unknown',availabilityMessage:p.availability_message||null,quantityAllVariants:p.quantity_all_versions??null,groups,variants:[...variants.values()],images,attachments:p.attachments||[],observedAt:new Date().toISOString(),issues};
   fs.writeFileSync(output,JSON.stringify(record,null,2));report.imported++;report.images+=images.length;if(issues.length)report.incomplete.push({id:entry.id,issues});console.log(entry.id+' imported; variants='+variants.size+' images='+images.length+' issues='+issues.length);
  }catch(e){report.errors.push({id:entry.id,url:entry.url,message:e.message});console.log(entry.id+' ERROR '+e.message)}save();
 }
 })); report.pending=report.detected-report.imported;report.complete=discovery.complete&&report.pending===0&&report.errors.length===0&&report.incomplete.length===0;report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify(report));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await run();



