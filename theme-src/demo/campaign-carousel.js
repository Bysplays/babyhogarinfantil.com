export function mountCarousel(root){
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
