function mountCarousel(root){
  if(!root)return ()=>{};
  const track=root.querySelector('.campaign-images'), dots=[...root.querySelectorAll('[data-slide]')], slides=[...track.children], controller=new AbortController(), signal=controller.signal;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=0,timer,paused=reduced.matches,startX=null;
  function schedule(){clearInterval(timer);if(!paused&&!document.hidden&&!root.matches(':hover')&&!root.contains(document.activeElement))timer=setInterval(()=>show(active+1,false),5000)}
  function show(index,manual=true){active=(index+slides.length)%slides.length;track.style.transform=`translateX(-${active*100}%)`;slides.forEach((slide,i)=>slide.setAttribute('aria-hidden',i!==active));dots.forEach((dot,i)=>dot.setAttribute('aria-current',i===active?'true':'false'));if(manual)schedule()}
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i),{signal}));
  root.querySelector('[data-prev]').addEventListener('click',()=>show(active-1),{signal});root.querySelector('[data-next]').addEventListener('click',()=>show(active+1),{signal});
  root.addEventListener('pointerenter',()=>clearInterval(timer),{signal});root.addEventListener('pointerleave',schedule,{signal});root.addEventListener('focusin',()=>clearInterval(timer),{signal});root.addEventListener('focusout',()=>queueMicrotask(schedule),{signal});document.addEventListener('visibilitychange',schedule,{signal});
  root.addEventListener('touchstart',e=>{startX=e.touches[0].clientX},{signal,passive:true});root.addEventListener('touchend',e=>{if(startX!==null&&Math.abs(e.changedTouches[0].clientX-startX)>45)show(active+(e.changedTouches[0].clientX<startX?1:-1));startX=null},{signal,passive:true});
  root.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(active+(e.key==='ArrowRight'?1:-1))}},{signal});
  reduced.addEventListener('change',()=>{paused=reduced.matches;schedule()},{signal});show(0,false);schedule();return ()=>{clearInterval(timer);controller.abort()};
}

(() => {
  'use strict';
  mountCarousel(document.querySelector('.campaign'));
  const searchButton=document.querySelector('[data-bh-search]'),search=document.querySelector('#bh-search');
  if(searchButton&&search&&window.HTMLDialogElement){
    const panel=document.createElement('dialog');panel.id='bh-search-panel';panel.className='bh-bag bh-search-panel';panel.setAttribute('aria-labelledby','bh-search-title');
    panel.innerHTML='<header class="bh-bag-header"><h2 id="bh-search-title">¿Qué estás buscando?</h2><button type="button" class="bh-bag-close" aria-label="Cerrar búsqueda">×</button></header>';
    const input=search.querySelector('input');const label=search.querySelector('label');
    label.classList.remove('sr-only');label.textContent='Busca una prenda, una marca o una ocasión';input.placeholder='Por ejemplo, conjunto Mayoral';
    search.querySelector('[type="submit"]').classList.add('bh-search-submit');
    search.hidden=false;panel.append(search);document.body.append(panel);searchButton.setAttribute('aria-controls',panel.id);
    let previousOverflow='';
    searchButton.addEventListener('click',()=>{if(panel.open)return;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';panel.showModal();searchButton.setAttribute('aria-expanded','true');input.focus({preventScroll:true});});
    panel.querySelector('.bh-bag-close').addEventListener('click',()=>panel.close());
    panel.addEventListener('click',event=>{if(event.target!==panel)return;const rect=panel.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)panel.close();});
    panel.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;searchButton.setAttribute('aria-expanded','false');searchButton.focus({preventScroll:true});});
  }
  const nav=document.querySelector('.bh-nav'), mobile=document.querySelector('.bh-menu-toggle');
  function setMobileMenu(expanded) {
    nav.classList.toggle('bh-open', expanded);
    mobile.setAttribute('aria-expanded', String(expanded));
    mobile.setAttribute('aria-label', expanded ? 'Cerrar menú' : 'Abrir menú');
    if (!expanded) nav.querySelectorAll('.is-open').forEach(close);
  }
  mobile?.addEventListener('click', () => setMobileMenu(!nav.classList.contains('bh-open')));
  const timers=new WeakMap();
  function close(item){clearTimeout(timers.get(item));item.classList.remove('is-open');item.querySelector(':scope > .bh-nav-toggle')?.setAttribute('aria-expanded','false');item.querySelectorAll('.is-open').forEach(close)}
  function open(item){clearTimeout(timers.get(item));[...item.parentElement.children].filter(x=>x!==item).forEach(close);item.classList.add('is-open');item.querySelector(':scope > .bh-nav-toggle')?.setAttribute('aria-expanded','true')}
  nav?.querySelectorAll('.bh-branch').forEach(item=>{const button=item.querySelector(':scope > .bh-nav-toggle');button.addEventListener('click',event=>{if(innerWidth>767)open(item);else item.classList.contains('is-open')?close(item):open(item)});item.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&innerWidth>767)open(item)});item.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')timers.set(item,setTimeout(()=>{if(!item.matches(':hover')&&!item.contains(document.activeElement))close(item)},300))});item.addEventListener('focusout',e=>{if(!item.contains(e.relatedTarget)&&!item.matches(':hover'))close(item)});button.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowRight'){e.preventDefault();open(item);item.querySelector(':scope > ul a')?.focus()}})});
  document.addEventListener('click',e=>{if(nav&&!nav.contains(e.target)&&!mobile?.contains(e.target)){if(nav.classList.contains('bh-open'))setMobileMenu(false);else nav.querySelectorAll('.is-open').forEach(close)}});
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav?.classList.contains('bh-open')) {
      setMobileMenu(false);
      mobile.focus();
    }
  });
  nav?.addEventListener('keydown',e=>{if(e.key==='Escape'){const item=e.target.closest('.bh-branch');if(item){close(item);item.querySelector(':scope > button')?.focus();e.stopPropagation()}}});
  function photos(){document.querySelectorAll('.bh-photo-link').forEach(link=>{if(link.dataset.bhBound)return;link.dataset.bhBound='1';const img=link.querySelector('img'),second=img?.dataset.bhSecondary;if(!second||second===img.dataset.bhPrimary)return;const preload=new Image();preload.src=second;const sources=[...link.querySelectorAll('source')].map(source=>[source,source.srcset]);const swap=active=>{if(active&&!preload.complete)return;for(const [source,srcset]of sources)source.srcset=active?second:srcset;img.src=active?second:img.dataset.bhPrimary};link.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')swap(true)});link.addEventListener('pointerleave',()=>swap(false));link.addEventListener('focus',()=>swap(true));link.addEventListener('blur',()=>swap(false))})}
  photos();
  if(window.prestashop){prestashop.on('updateProductList',photos);prestashop.on('updatedProduct',photos)}
  // The native wishlist module owns persistence and authentication. Read its live tagged IDs.
  function wishlistCount(){const target=document.querySelector('[data-bh-wishlist-count]');if(!target)return;const tagged=window.productsAlreadyTagged;if(Array.isArray(tagged)){const ids=new Set(tagged.map(p=>String(p.id_product??p.idProduct??p)));target.textContent=ids.size}}
  wishlistCount();
  async function refreshWishlist(){if(!window.babyHogarSummaryUrl)return;try{const response=await fetch(window.babyHogarSummaryUrl,{credentials:'same-origin',cache:'no-store'});if(!response.ok)return;const data=await response.json();const target=document.querySelector('[data-bh-wishlist-count]');if(target&&Number.isInteger(data.favorites))target.textContent=data.favorites}catch{/* Keep the last confirmed count when offline. */}}
  let wiredBus;
  function wireWishlist(){const bus=window.WishlistEventBus;if(!bus||bus===wiredBus)return;wiredBus=bus;bus.$on('showToast',event=>{if(event?.detail?.type==='success')refreshWishlist()});bus.$on('refetchList',refreshWishlist)}
  wireWishlist();window.prestashop?.on('wishlistEventBusInit',wireWishlist);
  window.addEventListener('pageshow',refreshWishlist);
})();

// The drawer presents the native cart; all mutations use PrestaShop's own tokenized URLs.
(() => {
  if (!window.babyHogarBagUrl || !window.HTMLDialogElement) return;
  const dialog=document.createElement('dialog');dialog.className='bh-bag';dialog.setAttribute('aria-labelledby','bh-bag-title');
  dialog.innerHTML='<header class="bh-bag-header"><h2 id="bh-bag-title">Tu bolsa</h2><button type="button" class="bh-bag-close" aria-label="Cerrar bolsa">×</button></header><p class="bh-bag-message" role="status" hidden></p><div class="bh-bag-content" aria-live="polite"></div>';
  document.body.append(dialog);
  const content=dialog.querySelector('.bh-bag-content'),message=dialog.querySelector('.bh-bag-message'),closeButton=dialog.querySelector('.bh-bag-close');
  let trigger,overflow='',request,mutating=false;
  const notify=text=>{message.textContent=text;message.hidden=!text};
  async function refresh(){
    request?.abort();const activeRequest=new AbortController();request=activeRequest;content.setAttribute('aria-busy','true');
    try {const response=await fetch(window.babyHogarBagUrl,{credentials:'same-origin',cache:'no-store',signal:activeRequest.signal});if(!response.ok)throw Error();const data=await response.json();if(!dialog.open)return;content.innerHTML=data.html;const count=document.querySelector('.blockcart .cart-products-count');if(count)count.textContent=data.count;}
    catch(error){if(error.name!=='AbortError'&&dialog.open){content.replaceChildren();const p=document.createElement('p');p.textContent='No se ha podido cargar la bolsa. Puedes abrirla aquí:';const a=document.createElement('a');a.href=trigger?.href||window.prestashop.urls.pages.cart;a.textContent='Ver bolsa';content.append(p,a);}}
    finally{if(request===activeRequest)content.removeAttribute('aria-busy');}
  }
  document.addEventListener('click',event=>{const link=event.target.closest('.blockcart a.bh-icon');if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();trigger=link;if(dialog.open)return;overflow=document.body.style.overflow;document.body.style.overflow='hidden';notify('');content.replaceChildren();dialog.showModal();closeButton.focus();refresh();});
  closeButton.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  dialog.addEventListener('close',()=>{request?.abort();document.body.style.overflow=overflow;(trigger?.isConnected?trigger:document.querySelector('.blockcart a.bh-icon'))?.focus({preventScroll:true});});
  dialog.addEventListener('click',async event=>{
    const button=event.target.closest('[data-bag-action]');if(!button||mutating)return;
    const url=new URL(button.dataset.bagAction,location.href);if(url.origin!==location.origin)return;
    mutating=true;notify('');const buttons=[...content.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
    try{const response=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'ajax=1&action=update'});if(!response.ok)throw Error();const data=await response.json();if(data.hasError||data.errors?.length){notify(Array.isArray(data.errors)?data.errors.join(' '):String(data.errors||'No se ha podido actualizar la cantidad.'));if(dialog.open)await refresh();}else if(window.prestashop){prestashop.emit('updateCart',{reason:{linkAction:'update-from-drawer'},resp:data});}else if(dialog.open){await refresh();}}
    catch{notify('No se ha podido actualizar la bolsa. Vuelve a intentarlo.');if(dialog.open)await refresh();}
    finally{mutating=false;}
  });
  window.prestashop?.on('updateCart',()=>{if(dialog.open)refresh();});
})();

// Accessible facet toggles, reapplied after native AJAX filtering.
(() => {
  const states=new Map();
  function prepare(){
    document.querySelectorAll('#search_filters .facet').forEach((facet,index)=>{
      if(facet.querySelector('.bh-facet-toggle'))return;
      const title=facet.querySelector('.facet-title');if(!title)return;
      const label=title.textContent.trim(),button=document.createElement('button');
      button.type='button';button.className='bh-facet-toggle';button.textContent=label;
      const bodies=[...facet.children].filter(el=>el.tagName==='UL');if(!bodies.length)return;
      bodies.forEach((body,i)=>{body.id=body.id||`bh-facet-${index}-${i}`;body.classList.add('bh-facet-body');});
      button.setAttribute('aria-controls',bodies.map(body=>body.id).join(' '));
      function setOpen(open){button.setAttribute('aria-expanded',String(open));bodies.forEach(body=>body.classList.toggle('bh-facet-closed',!open));states.set(label,open);}
      setOpen(states.get(label)!==false);
      button.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));
      facet.classList.add('bh-facet');facet.prepend(button);
    });
  }
  prepare();
  const column=document.querySelector('#left-column');if(column)new MutationObserver(prepare).observe(column,{childList:true,subtree:true});
  window.prestashop?.on('updateProductList',prepare);
})();

// Live suggestions use the same native search endpoint as the full results page.
(() => {
  const panel=document.querySelector('#bh-search-panel'),form=panel?.querySelector('form'),input=form?.querySelector('input');if(!input)return;
  input.autocomplete='off';
  const status=document.createElement('p');status.className='bh-search-status';status.setAttribute('role','status');
  const results=document.createElement('div');results.className='bh-search-results';results.id='bh-search-results';input.setAttribute('aria-controls',results.id);panel.append(status,results);
  let timer,request,version=0;
  function reset(){clearTimeout(timer);request?.abort();version++;results.replaceChildren();status.textContent='';results.removeAttribute('aria-busy');}
  function update(){
    reset();const term=input.value.trim();if(term.length<2){if(term)status.textContent='Escribe al menos 2 caracteres.';return;}
    const current=version;status.textContent='Buscando prendas…';results.setAttribute('aria-busy','true');
    timer=setTimeout(async()=>{
      request=new AbortController();
      try{
        const response=await fetch(form.action,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','X-Requested-With':'XMLHttpRequest','Accept':'application/json'},body:new URLSearchParams({s:term,resultsPerPage:'6',ajax:'1'}),signal:request.signal});if(!response.ok)throw Error();
        const data=await response.json();if(current!==version||!panel.open)return;
        const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
        const words=normalize(term).split(/\s+/).filter(word=>word.length>1&&!['de','del','la','el','para','con'].includes(word));
        const products=(data.products||[]).filter(product=>{const text=normalize([product.name,product.manufacturer_name,product.reference,product.category_name,product.description_short].join(' '));return words.every(word=>text.includes(word));});status.textContent=products.length?'Prendas que coinciden con tu búsqueda':'No encontramos prendas. Prueba con otro nombre o marca.';
        products.forEach(product=>{
          const link=document.createElement('a');link.className='bh-search-result';link.href=product.url;
          const src=product.cover?.bySize?.small_default?.url||product.cover?.small?.url;
          if(src){const image=document.createElement('img');image.src=src;image.alt='';image.width=70;image.height=86;link.append(image);}
          const copy=document.createElement('span');const name=document.createElement('span');name.className='bh-search-result-name';name.textContent=product.name;copy.append(name);
          const price=document.createElement('strong');price.textContent=product.price;copy.append(price);
          if(product.has_discount){price.className='bh-search-sale';const old=document.createElement('del');old.textContent=product.regular_price;copy.append(old);}
          link.append(copy);results.append(link);
        });
        if(products.length){const all=document.createElement('a');const url=new URL(form.action,location.href);url.searchParams.set('s',term);all.href=url.href;all.className='button bh-search-all';all.textContent='Ver todos los resultados ↗';results.append(all);}
      }catch(error){if(error.name!=='AbortError'&&current===version)status.textContent='No se pudieron cargar las sugerencias. Pulsa Enter para buscar.';}
      finally{if(current===version)results.removeAttribute('aria-busy');}
    },220);
  }
  input.addEventListener('input',()=>{if(!input.matches(':disabled'))update();});
  input.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){const first=results.querySelector('a');if(first){event.preventDefault();first.focus();}}});
  panel.addEventListener('close',reset);
  document.querySelector('[data-bh-search]')?.addEventListener('click',()=>{if(input.value.trim())update();});
})();

/* Newsletter invitation: native modal keeps focus within the dialog. */
(() => {
  const dialog=document.getElementById('bh-newsletter');if(!dialog)return;
  const form=dialog.querySelector('form'),status=dialog.querySelector('.bh-newsletter-status'),submit=form.querySelector('[type="submit"]'),hide=document.getElementById('bh-newsletter-hide');
  const permanent='bh-newsletter-hidden',session='bh-newsletter-seen';
  const read=(storage,key)=>{try{return storage.getItem(key)==='1';}catch{return false;}};
  const write=(storage,key,value)=>{try{value?storage.setItem(key,'1'):storage.removeItem(key);}catch{}};
  let previousFocus;
  function close(){dialog.close();}
  dialog.querySelector('.bh-newsletter-close').addEventListener('click',close);
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
  hide.addEventListener('change',()=>write(localStorage,permanent,hide.checked));
  dialog.addEventListener('close',()=>{document.documentElement.classList.remove('bh-newsletter-open');previousFocus?.focus({preventScroll:true});});
  function show(){
    if(read(localStorage,permanent)||read(sessionStorage,session))return;
    if(document.hidden||document.querySelector('dialog[open],.modal.show,.modal.in')){setTimeout(show,1000);return;}
    previousFocus=document.activeElement;dialog.showModal();document.documentElement.classList.add('bh-newsletter-open');write(sessionStorage,session,true);
  }
  setTimeout(show,3500);
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(!form.reportValidity()||submit.disabled)return;
    submit.disabled=true;submit.textContent='Suscribiendo…';status.textContent='';status.classList.remove('is-error');
    try{
      const body=new URLSearchParams(new FormData(form));body.set('ajax','1');
      const response=await fetch(form.action,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','Accept':'application/json'},body});
      if(!response.ok)throw Error();const data=await response.json();
      if(typeof data.nw_error!=='boolean'||!data.msg)throw Error();
      status.textContent=data.msg;status.classList.toggle('is-error',data.nw_error);
      if(!data.nw_error){write(localStorage,permanent,true);hide.checked=true;submit.textContent='Suscripción completada';return;}
    }catch{status.textContent='No hemos podido completar la suscripción. Inténtalo de nuevo.';status.classList.add('is-error');}
    submit.disabled=false;submit.textContent='Suscríbete';
  });
})();
