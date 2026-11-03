import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const theme=path.join(root,'themes/babyhogarinfantil');
await fs.cp(path.join(root,'theme-base/classic'),theme,{recursive:true,filter:(src)=>!path.basename(src).startsWith('preview') && !src.includes(path.join('assets','cache'))});
const demo=path.resolve(root,'theme-src/demo');
const write=async(file,content)=>{const target=path.join(theme,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,content)};
let layout=await fs.readFile(path.join(theme,'templates/layouts/layout-both-columns.tpl'),'utf8');
layout=layout.replace('<div class="row">',`{if isset($listing)}<div class="bh-catalog-intro"><span class="eyebrow">BABY HOGAR INFANTIL</span><h1>{$listing.label}</h1><p>Una selección para descubrir, combinar y acompañarles.</p></div>{include file='catalog/_partials/products-top.tpl' listing=$listing}{/if}<div class="row">`);
await write('templates/layouts/layout-both-columns.tpl',layout);
let listing=await fs.readFile(path.join(theme,'templates/catalog/listing/product-list.tpl'),'utf8');
listing=listing.replace(/\{block name='product_list_header'\}[\s\S]*?\{\/block\}/,"{block name='product_list_header'}{/block}");
listing=listing.replace(/\{block name='product_list_top'\}[\s\S]*?\{\/block\}/,"{block name='product_list_top'}{/block}");
listing=listing.replace('<div id="js-product-list-top"></div>','');
await write('templates/catalog/listing/product-list.tpl',listing);
let categoryTpl=await fs.readFile(path.join(theme,'templates/catalog/listing/category.tpl'),'utf8');
categoryTpl=categoryTpl.replace(/\{block name='product_list_header'\}[\s\S]*?\{\/block\}/,"{block name='product_list_header'}{/block}");
await write('templates/catalog/listing/category.tpl',categoryTpl);
for(const name of ['editorial-baby.jpg','editorial-boy.jpg','editorial-girl.jpg','logo-babyhogar.png']){await fs.mkdir(path.join(theme,'assets/img/babyhogar'),{recursive:true});await fs.copyFile(path.join(demo,'assets',name),path.join(theme,'assets/img/babyhogar',name))}
let config=await fs.readFile(path.join(theme,'config/theme.yml'),'utf8');
config=config.replace(/^name:.*$/m,'name: babyhogarinfantil').replace(/^display_name:.*$/m,'display_name: BabyHogarInfantil').replace(/^version:.*$/m,'version: 1.0.0');
config=config.replace('name: "PrestaShop SA and Contributors"','name: "Baby Hogar Infantil (base Classic de PrestaShop)"');
config=config.replace('      - ps_linklist','      - ps_linklist\n      - babyhogarstudio\n      - ps_newproducts\n      - blockwishlist\n      - ps_shoppingcart');
config=config.replace('    PS_IMAGE_QUALITY: png','    PS_IMAGE_QUALITY: png\n    NEW_PRODUCTS_NBR: 4');
config+='\ndependencies:\n  modules:\n    - babyhogarstudio\n';
await write('config/theme.yml',config);
await write('templates/_partials/bh-icons.tpl',`{function name=bh_icon icon='bag'}<svg viewBox="0 0 24 24" aria-hidden="true">{if $icon=='search'}<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>{elseif $icon=='heart'}<path d="M12 21 3 12C-3 5 7-1 12 6c5-7 15-1 9 6Z"/>{elseif $icon=='account'}<circle cx="12" cy="7" r="3.5"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>{else}<path d="M4 7h16l1 15H3ZM8 8V5a4 4 0 0 1 8 0v3"/>{/if}</svg>{/function}`);
await write('templates/_partials/header.tpl',`{include file='_partials/bh-icons.tpl'}
<a class="bh-skip" href="#wrapper">Saltar al contenido</a>
<div class="bh-announcement"><span>CRECER ES TODA UNA AVENTURA.</span><span>Atención personal · <a href="tel:{$bh_phone|default:'886166179'|escape:'htmlall':'UTF-8'}">{$bh_phone|default:'886 166 179'|escape:'htmlall':'UTF-8'}</a></span></div>
<div class="bh-head"><button class="bh-icon bh-menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="bh-nav">☰</button><a href="{$urls.base_url}" class="bh-logo" aria-label="Baby Hogar Infantil, inicio"><img src="{$urls.theme_assets}img/babyhogar/logo-babyhogar.png" width="250" height="36" alt="Baby Hogar Infantil"></a><span class="bh-head-note">MODA PARA CRECER.</span><div class="bh-tools"><button class="bh-icon" type="button" data-bh-search aria-label="Buscar" aria-expanded="false" aria-controls="bh-search">{call name=bh_icon icon='search'}</button>{if isset($bh_wishlist_url)}<a class="bh-icon bh-wishlist-link" href="{$bh_wishlist_url}" aria-label="Mis favoritos">{call name=bh_icon icon='heart'}<span class="bh-count" data-bh-wishlist-count>{$bh_wishlist_count|default:0}</span></a>{/if}{widget name='ps_shoppingcart'}<a class="bh-icon" href="{$urls.pages.my_account}" aria-label="Mi cuenta">{call name=bh_icon icon='account'}</a></div></div>
<form id="bh-search" class="bh-search" action="{$urls.pages.search}" method="get" hidden><label class="sr-only" for="bh-search-input">Buscar prendas</label><input id="bh-search-input" type="search" name="s" placeholder="Buscar prendas, marcas…" required><button type="submit" class="btn btn-primary">Buscar</button></form>
<nav id="bh-nav" class="bh-nav" aria-label="Navegación principal">{if isset($bh_navigation)}{include file='_partials/bh-nav.tpl' items=$bh_navigation depth=0}{else}<a href="{$urls.pages.new_products}">Novedades</a><a href="{$urls.pages.prices_drop}" class="bh-sale">Ofertas</a>{/if}</nav>`);
await write('templates/_partials/bh-nav.tpl',`<ul class="bh-nav-level bh-level-{$depth}">{foreach $items as $item}<li class="bh-nav-item {if !empty($item.children)}bh-branch{/if}"><a href="{$item.url|escape:'htmlall':'UTF-8'}"{if $item.label=='Ofertas'} class="bh-sale"{/if}>{$item.label|escape:'htmlall':'UTF-8'}</a>{if !empty($item.children)}<button type="button" class="bh-nav-toggle" aria-expanded="false" aria-label="Desplegar {$item.label|escape:'htmlall':'UTF-8'}">{if $depth==0}⌄{else}›{/if}</button>{include file='_partials/bh-nav.tpl' items=$item.children depth=$depth+1}{/if}</li>{/foreach}</ul>`);
await write('modules/ps_shoppingcart/ps_shoppingcart.tpl',`<div id="_desktop_cart"><div class="blockcart cart-preview" data-refresh-url="{$refresh_url}"><div class="header"><a class="bh-icon" href="{$cart_url}" aria-label="Cesta, {$cart.products_count} artículos"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16l1 15H3ZM8 8V5a4 4 0 0 1 8 0v3"/></svg><span class="bh-count cart-products-count">{$cart.products_count}</span></a></div></div></div>`);
await write('templates/checkout/_partials/header.tpl',`{include file='_partials/header.tpl'}`);
const home=(await fs.readFile(path.join(demo,'studio.js'),'utf8')).match(/<section class="campaign"[\s\S]*?<section class="section new-drop">/)[0].replace(/<section class="section new-drop">$/,'').replaceAll('src="assets/','src="{$urls.theme_assets}img/babyhogar/').replace('href="#/catalogo"','href="{$bh_catalog_url|default:$urls.pages.new_products}"').replace('OTOÑO / INVIERNO — 26',"{$bh_season|default:'OTOÑO / INVIERNO — 26'|escape:'htmlall':'UTF-8'}");
await write('templates/index.tpl',`{extends file='page.tpl'}
{block name='page_content_container'}<div id="content" class="page-home bh-home">${home}
{widget name='ps_newproducts'}
<section class="section universes"><div class="section-head"><div><span class="eyebrow">CADA ETAPA TIENE LO SUYO</span><h2>SU MUNDO. SU ESTILO.</h2></div><span class="section-note">Encuentra su próxima aventura.</span></div><div class="collections">
{foreach [['Bebé','baby','Todo empieza aquí.'],['Niño','boy','Sin parar de descubrir.'],['Niña','girl','A su manera.']] as $collection}<a class="collection" href="{$bh_collection_urls[$collection[0]]|default:$urls.pages.new_products}"><div class="photo"><img src="{$urls.theme_assets}img/babyhogar/editorial-{$collection[1]}.jpg" alt="Colección {$collection[0]}" loading="lazy" width="1600" height="800"></div><div class="collection-title"><h3>{$collection[0]} <span>↗</span></h3><p>{$collection[2]}</p></div></a>{/foreach}</div></section>
<section class="statement"><div><span class="eyebrow">HECHOS PARA MOVERSE</span><h2>QUE EL FRÍO<br>NO LES PARE.</h2><p>Capas suaves. Planes sin fin.<br>Descubre la selección de abrigo.</p><a class="button" href="{$urls.pages.search}?s=abrigo">Vamos fuera ↗</a></div><img src="{$urls.theme_assets}img/babyhogar/editorial-boy.jpg" alt="Campaña de invierno de Baby Hogar Infantil" loading="lazy" width="1600" height="800"></section>
{if !empty($bh_brands)}<section class="brands"><span class="eyebrow">SUS MARCAS. TUS FAVORITAS.</span><div class="brand-list">{foreach $bh_brands as $brand}<a href="{$brand.url}">{$brand.name|escape:'htmlall':'UTF-8'}</a>{/foreach}</div></section>{/if}
</div>{/block}`);
await write('modules/ps_newproducts/views/templates/hook/ps_newproducts.tpl',`<section class="section new-drop"><div class="section-head"><div><span class="eyebrow">NUEVAS HISTORIAS, NUEVAS PRENDAS</span><h2>LO ÚLTIMO.</h2></div><a class="text-link" href="{$allNewProductsLink}">Ver novedades ↗</a></div><div class="products bh-products">{foreach $products as $product}{include file='catalog/_partials/miniatures/product.tpl' product=$product}{/foreach}</div></section>`);
await write('templates/_partials/footer.tpl',`<div class="bh-footer-grid"><div><a class="bh-footer-wordmark" href="{$urls.base_url}">BABY HOGAR<span>INFANTIL</span></a><p>Para sus primeros pasos.<br>Y todos los que vendrán.</p><a href="{$urls.pages.contact}">Hablemos ↗</a></div><div><h3>Te acompañamos</h3><a href="{$urls.pages.contact}">Contacto y consultas</a><a href="{$urls.pages.my_account}">Mi cuenta</a><a href="{$urls.pages.history}">Mis pedidos</a><a href="{$urls.pages.stores}">Nuestras tiendas</a></div><div><h3>Un mundo por descubrir</h3><a href="{$urls.pages.new_products}">Novedades</a><a href="{$urls.pages.prices_drop}">Ofertas</a><a href="{$urls.pages.manufacturer}">Marcas</a><a href="{$urls.pages.sitemap}">Todas las categorías</a></div><div><span class="eyebrow">MODA PARA CRECER</span><h3 class="bh-footer-statement">Cerca de ti.<br>En cada etapa.</h3><p>Descubre la tienda y recibe atención personalizada para elegir su próxima prenda.</p></div></div><div class="bh-footer-modules">{hook h='displayFooter'}</div><div class="bh-legal">© {$smarty.now|date_format:'%Y'} Baby Hogar Infantil</div>`);
// Keep native product blocks and hooks for prices, combinations and integrations.
let product=await fs.readFile(path.join(theme,'templates/catalog/_partials/miniatures/product.tpl'),'utf8');
product=product.replace('<picture>',`<picture>`);
product=product.replace('class="thumbnail product-thumbnail"','class="thumbnail product-thumbnail bh-photo-link"');
product=product.replace('src="{$product.cover.bySize.home_default.url}"',`src="{$product.cover.bySize.home_default.url}" data-bh-primary="{$product.cover.bySize.home_default.url}" {if isset($product.images[1])}data-bh-secondary="{$product.images[1].bySize.home_default.url}"{/if}`);
product=product.replace('{block name=\'quick_view\'}',"{block name='quick_view'}").replace('class="quick-view js-quick-view"','class="quick-view js-quick-view bh-quick-add"').replace('<i class="material-icons search">&#xE8B6;</i> {l s=\'Quick view\' d=\'Shop.Theme.Actions\'}',`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16l1 15H3ZM8 8V5a4 4 0 0 1 8 0v3"/></svg><span class="sr-only">Elegir talla y añadir a la cesta</span>`);
product=product.replace('{$product.name|truncate:30:\'...\'}','{$product.name|escape:\'htmlall\':\'UTF-8\'}');
product=product.replaceAll("{$product.name|truncate:30:'...'}",'{$product.name}');
product=product.replace('<div class="product-price-and-shipping">','<div class="product-price-and-shipping{if $product.has_discount} bh-price-sale{/if}">');
product=product.replace('<div class="product-description">',`<div class="product-description">{if !empty($product.manufacturer_name)}<div class="bh-brand">{$product.manufacturer_name|escape:'htmlall':'UTF-8'}</div>{/if}`);
// Use PrestaShop availability flags, never the numeric price, to mark sold-out cards.
product=product.replace("{block name='product_miniature_item'}", "{block name='product_miniature_item'}{assign var=bhSoldOut value=false}{foreach $product.flags as $bhFlag}{if $bhFlag.type == 'out_of_stock'}{assign var=bhSoldOut value=true}{/if}{/foreach}");
product=product.replace('class="product-miniature js-product-miniature"','class="product-miniature js-product-miniature{if $bhSoldOut} bh-sold-out{/if}"');
product=product.replace('{if $product.show_price}', '<!-- Availability replaces the price only for sold-out products. -->{if $bhSoldOut}<div class="product-price-and-shipping"><span class="bh-stock-label">FUERA DE STOCK</span>{if $product.show_price && $product.price_amount > 0}<span class="bh-sold-out-price">{$product.price}</span>{/if}</div>{elseif $product.show_price}');
await write('templates/catalog/_partials/miniatures/product.tpl',product);
// Use the native quick-view controller/form but present it as the demo's right drawer.
let quick=await fs.readFile(path.join(theme,'templates/catalog/_partials/quickview.tpl'),'utf8');
quick=quick.replace('<div class="modal-header">','<div class="modal-header"><h2>Añadir a la cesta</h2>').replace(' hidden-xs-down','');
await write('templates/catalog/_partials/quickview.tpl',quick);
let carousel=await fs.readFile(path.join(demo,'campaign-carousel.js'),'utf8');
carousel=carousel.replace('export function','function');
await write('assets/js/custom.js',carousel+'\n'+await fs.readFile(path.join(root,'theme-src/custom.js'),'utf8'));
// Reuse only editorial selectors from the demo; native PrestaShop forms keep their behavior.
let studio=await fs.readFile(path.join(demo,'studio.css'),'utf8');
const editorial=studio.split('\n').filter(line=>line.startsWith('@import')).join('\n');
await write('assets/css/custom.css',editorial+'\n'+await fs.readFile(path.join(root,'theme-src/custom.css'),'utf8'));
const source=JSON.parse(await fs.readFile(path.join(demo,'navigation.json'),'utf8'));
const index=id=>source.findIndex(x=>x.url.split('/').pop().startsWith(id+'-'));
const range=(a,b)=>source.slice(index(a)+1,index(b)).map(x=>({label:x.label.replace(/\s+(beb[eé]\s+(niñ[oa])|bautizo)$/i,'').replace(/primera puesta.*0.*3(?: meses)?/i,'Primera puesta 0 a 3 meses'),match:x.label,slug:x.url.split('/').pop().replace(/^\d+-/,'')}));
const branch=(label,children)=>({label,children});
const nav=[{label:'Novedades',page:'new-products'},branch('Bebé',[branch('Bebé niño',range(820,818)),branch('Bebé niña',range(818,824)),branch('Bautizo',range(814,788))]),branch('Niños',[branch('Niño',range(824,823)),branch('Niña',range(823,811))]),branch('Calzado',range(811,840)),branch('Uniformes escolares',range(812,814)),branch('Complemento',source.slice(index(788)+1,source.findIndex(x=>x.label==='Ofertas')).map(x=>({label:x.label}))),{label:'Ofertas',page:'prices-drop'}];
await fs.mkdir(path.join(root,'modules/babyhogarstudio'),{recursive:true});
await fs.writeFile(path.join(root,'modules/babyhogarstudio/navigation.json'),JSON.stringify(nav,null,2));
console.log('Tema BabyHogarInfantil generado.');



// Display all monetary reductions as a percentage on the product photo.
await write('templates/catalog/_partials/product-flags.tpl',`{block name='product_flags'}
<ul class="product-flags js-product-flags">
{foreach from=$product.flags item=flag}
  <li class="product-flag {$flag.type}">{if ($flag.type == 'discount' || $flag.type == 'discount-amount' || $flag.type == 'discount-percentage') && $product.has_discount && $product.regular_price_amount > 0}{assign var=bh_discount_percent value=(100 * ($product.regular_price_amount - $product.price_amount) / $product.regular_price_amount)}−{$bh_discount_percent|round:0} %{else}{$flag.label}{/if}</li>
{/foreach}
</ul>
{/block}`);

// Replace the thumbnail rotator with bounded native horizontal scrolling.
let galleryJs=await fs.readFile(path.join(theme,'assets/js/theme.js'),'utf8');
const rotator='.scrollbox({direction:"h",distance:113,autoPlay:!1})';
if(!galleryJs.includes(rotator))throw new Error('Native thumbnail initializer not found');
galleryJs=galleryJs.replace(rotator,`.each(function(){const mask=this,$mask=window.jQuery(this);mask.classList.add('bh-finite-thumbnails');const update=()=>{const arrows=document.querySelectorAll('.scroll-box-arrows');arrows.forEach(group=>{[['.left',mask.scrollLeft<=1],['.right',mask.scrollLeft+mask.clientWidth>=mask.scrollWidth-1]].forEach(([selector,disabled])=>{const arrow=group.querySelector(selector);if(arrow){arrow.classList.toggle('bh-disabled',disabled);arrow.setAttribute('aria-disabled',String(disabled));}});});};$mask.off('forward backward').on('forward',()=>mask.scrollBy({left:113,behavior:'smooth'})).on('backward',()=>mask.scrollBy({left:-113,behavior:'smooth'}));mask.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(mask);update();})`);
await write('assets/js/theme.js',galleryJs);

// Match the product-photo badge in the native price block, including fixed reductions.
let prices=await fs.readFile(path.join(theme,'templates/catalog/_partials/product-prices.tpl'),'utf8');
const discountBlock=/\{if \$product\.has_discount\}\s*\{if \$product\.discount_type === 'percentage'\}[\s\S]*?\{\/if\}\s*\{\/if\}/;
if(!discountBlock.test(prices))throw new Error('Native price discount block not found');
prices=prices.replace(discountBlock,`{if $product.has_discount && $product.regular_price_amount > 0}
  {assign var=bh_discount_percent value=(100 * ($product.regular_price_amount - $product.price_amount) / $product.regular_price_amount)}
  <span class="discount bh-discount-percent">−{$bh_discount_percent|round:0} %</span>
{/if}`);
await write('templates/catalog/_partials/product-prices.tpl',prices);

await write('templates/_partials/bh-newsletter.tpl',await fs.readFile(path.join(root,'theme-src/newsletter.tpl'),'utf8'));
const newsletterFooter=await fs.readFile(path.join(theme,'templates/_partials/footer.tpl'),'utf8');
await write('templates/_partials/footer.tpl',newsletterFooter+"{include file='_partials/bh-newsletter.tpl'}");
