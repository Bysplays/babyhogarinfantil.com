import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('migration/discovery.json'));const known=new Set(d.categories.map(c=>c.id)),roots=new Set(['820','818','824','823','811','840','812','814','788']),products=new Map(d.products.map(p=>[p.id,p])),extra=new Map();
for(const f of fs.readdirSync('migration/stage/products')){const r=JSON.parse(fs.readFileSync('migration/stage/products/'+f));if(known.has(r.sourceDefaultCategoryId))continue;const slug=new URL(r.sourceUrl).pathname.split('/')[1];if(!r.sourceCategoryName||!slug||slug.endsWith('.html'))continue;extra.set(r.sourceDefaultCategoryId,{id:r.sourceDefaultCategoryId,label:r.sourceCategoryName,url:`https://babyhogarinfantil.com/${r.sourceDefaultCategoryId}-${slug}`,parentId:products.get(r.id)?.categoryIds.find(id=>roots.has(id))||null,evidence:'Default category declared in public product data; category listing may be unavailable.'});}
fs.writeFileSync('migration/extra-categories.json',JSON.stringify([...extra.values()],null,2));
if(d.errors.length){fs.writeFileSync('migration/additional-category-checks.json',JSON.stringify(d.errors,null,2));d.errors=d.errors.filter(e=>known.has(e.category));d.complete=d.categories.every(c=>c.complete)&&!d.errors.length;fs.writeFileSync('migration/discovery.json',JSON.stringify(d,null,2));}
console.log('Additional source categories:',extra.size);

