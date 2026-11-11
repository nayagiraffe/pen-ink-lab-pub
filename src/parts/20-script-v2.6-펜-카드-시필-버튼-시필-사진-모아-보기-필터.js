
/* v2.6 펜 카드 "시필" 버튼 + 시필 사진 모아 보기(필터·크게 보기·기록 수정 연결) */
(function(){
 'use strict';
 var $$=function(id){return document.getElementById(id)};
 var reviewsRoot=$$('tReviews');if(!reviewsRoot)return;
 var css=document.createElement('style');
 css.textContent='.gal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;margin-top:10px}.gal-tile{position:relative;border:0;padding:0;border-radius:12px;overflow:hidden;aspect-ratio:1;background:var(--sunken);cursor:pointer;box-shadow:inset 0 0 0 1px var(--line)}.gal-tile img{width:100%;height:100%;object-fit:cover;display:block}.gal-tile span{position:absolute;left:0;right:0;bottom:0;padding:14px 6px 5px;font-size:10.5px;line-height:1.25;color:#fff;text-align:left;background:linear-gradient(transparent,rgba(0,0,0,.62));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gal-filter{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px}.gal-chip{border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:5px 11px;font-size:12px;font-weight:600;cursor:pointer;color:var(--ink-2)}.gal-chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}.gal-lb{position:fixed;inset:0;z-index:9999;background:rgba(12,12,14,.92);display:flex;flex-direction:column;color:#fff}.gal-lb[hidden]{display:none}.gal-lb .gal-top{display:flex;justify-content:space-between;align-items:center;padding:12px 14px}.gal-lb button{background:rgba(255,255,255,.14);color:#fff;border:0;border-radius:999px;padding:8px 14px;font-size:14px;cursor:pointer}.gal-lb .gal-img{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;padding:0 8px;position:relative}.gal-lb .gal-img img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px}.gal-lb .gal-nav{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:40px;padding:0;font-size:20px}.gal-lb .gal-prev{left:8px}.gal-lb .gal-next{right:8px}.gal-lb .gal-info{padding:12px 16px 18px;font-size:13px;line-height:1.5;max-height:34vh;overflow:auto}.gal-lb .gal-info b{font-size:15px}.gal-lb .gal-info .sub{color:rgba(255,255,255,.7)}.ink-tests{cursor:pointer}';
 document.head.appendChild(css);
 /* ---- gallery card ---- */
 var histCard=reviewsRoot.closest('.card');
 var card=document.createElement('div');card.className='card';
 card.innerHTML='<h2>시필 사진 모아 보기</h2><p class="hint">사진이 있는 시필 기록만 모아 보여요. 사진을 누르면 크게 보고 기록을 수정할 수 있어요.</p>'+
  '<input class="input" id="galSearch" placeholder="만년필·잉크·종이로 검색"><div class="gal-filter" id="galFilter"></div><div class="gal-grid" id="galGrid"></div>';
 histCard.parentNode.insertBefore(card,histCard);
 var lb=document.createElement('div');lb.className='gal-lb';lb.hidden=true;
 lb.innerHTML='<div class="gal-top"><span id="galCount"></span><button type="button" id="galClose">닫기 ✕</button></div><div class="gal-img"><button type="button" class="gal-nav gal-prev" id="galPrev" aria-label="이전">‹</button><img id="galImg" alt="시필 사진"><button type="button" class="gal-nav gal-next" id="galNext" aria-label="다음">›</button></div><div class="gal-info" id="galInfo"></div>';
 document.body.appendChild(lb);
 var filter=null,items=[],idx=0,fullCache={};
 function label(t){var p=db.pens.find(function(x){return x.id===t.penId}),i=db.inks.find(function(x){return x.id===t.inkId});return {p:p,i:i,pen:p?p.brand+' '+p.name:'삭제된 만년필',ink:i?i.brand+' · '+i.name:'삭제된 잉크'}}
 function collect(){var q=norm($$('galSearch').value||''),out=[];
  (db.testReviews||[]).slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))}).forEach(function(t){
   if(filter&&((filter.kind==='ink'&&t.inkId!==filter.id)||(filter.kind==='pen'&&t.penId!==filter.id)))return;
   var L=label(t);if(q&&norm(L.pen+' '+L.ink+' '+(t.paper||'')).indexOf(q)<0)return;
   (t.photos||[]).forEach(function(ph,k){out.push({t:t,ph:ph,file:(t.photoFiles||[])[k]||'',L:L})})});
  return out}
 function drawGallery(){items=collect();
  var f=$$('galFilter');
  if(filter){var nm=filter.kind==='ink'?(db.inks.find(function(x){return x.id===filter.id})||{}).name:(db.pens.find(function(x){return x.id===filter.id})||{}).name;
   f.innerHTML='<button type="button" class="gal-chip on" data-galclear="1">'+esc((filter.kind==='ink'?'잉크: ':'만년필: ')+(nm||''))+' ✕</button>'}else f.innerHTML='';
  $$('galGrid').innerHTML=items.map(function(it,n){var u=(typeof testThumbOf==='function'?testThumbOf(it.ph):'');return '<button type="button" class="gal-tile" data-gal="'+n+'">'+(u?'<img loading="lazy" alt="" src="'+u+'">':'')+'<span>'+esc((it.L.i?it.L.i.name:it.L.ink)+' · '+(it.t.date||''))+'</span></button>'}).join('')||'<div class="empty">'+(filter?'이 조건의 시필 사진이 아직 없어요.':'아직 사진이 있는 시필 기록이 없어요. 시필 평가에서 📷 촬영으로 남겨 보세요.')+'</div>'}
 window.drawTestGallery=drawGallery;
 $$('galSearch').addEventListener('input',drawGallery);
 $$('galFilter').addEventListener('click',function(e){if(e.target.closest('[data-galclear]')){filter=null;drawGallery()}});
 $$('galGrid').addEventListener('click',function(e){var b=e.target.closest('[data-gal]');if(b)open(Number(b.getAttribute('data-gal')))});
 function stars(v){return v==null?'—':v}
 function open(n){if(!items.length)return;idx=(n+items.length)%items.length;var it=items[idx],t=it.t;lb.hidden=false;document.body.style.overflow='hidden';
  $$('galCount').textContent=(idx+1)+' / '+items.length;
  var img=$$('galImg');img.src=(typeof testThumbOf==='function'?testThumbOf(it.ph):'')||'';
  if(it.file){if(fullCache[it.file])img.src=fullCache[it.file];else if(false){var want=it.file;PIL.noServer().withSuccessHandler(function(r){if(r&&r.ok){fullCache[want]=r.url;if(items[idx]&&items[idx].file===want)img.src=r.url}}).getPhotoFull(want)}}
  var bits=[];if(t.nib)bits.push('닙 '+t.nib);if(t.sheen)bits.push('테 '+t.sheen);if(t.shading)bits.push('농담 '+t.shading);if(t.drySeconds!=null)bits.push('건조 '+t.drySeconds+'초');
  $$('galInfo').innerHTML='<b>'+esc(it.L.ink)+'</b><div class="sub">'+esc(it.L.pen)+' · '+esc(t.date||'날짜 미입력')+' · '+esc(t.paper||'종이 미확인')+'</div>'+
   '<div>공급 '+stars(t.flow)+' · 선폭 '+stars(t.width)+' · 부드러움 '+stars(t.smooth)+' · 퍼짐 '+stars(t.feather)+' · 만족 '+stars(t.rating)+' / 5</div>'+(bits.length?'<div>'+esc(bits.join(' · '))+'</div>':'')+(t.memo?'<p>'+esc(t.memo)+'</p>':'')+
   '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" data-galedit="'+esc(t.id)+'">이 기록 수정</button><button type="button" data-galink="'+esc(t.inkId)+'">이 잉크 사진만</button><button type="button" data-galpen="'+esc(t.penId)+'">이 만년필 사진만</button></div>'}
 function close(){lb.hidden=true;document.body.style.overflow='';$$('galImg').src=''}
 $$('galClose').onclick=close;$$('galPrev').onclick=function(){open(idx-1)};$$('galNext').onclick=function(){open(idx+1)};
 lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('gal-img'))close();
  var ed=e.target.closest('[data-galedit]'),gi=e.target.closest('[data-galink]'),gp=e.target.closest('[data-galpen]');
  if(gi||gp){filter={kind:gi?'ink':'pen',id:(gi||gp).getAttribute(gi?'data-galink':'data-galpen')};close();drawGallery();card.scrollIntoView({behavior:'smooth',block:'start'})}
  if(ed){var id=ed.getAttribute('data-galedit');close();try{$$('tReviewSearch').value='';drawTestReviews()}catch(_){}var b=document.querySelector('[data-tedit="'+id+'"]');if(b)b.click()}});
 document.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')open(idx-1);if(e.key==='ArrowRight')open(idx+1)});
 var sx=null;lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});lb.addEventListener('touchend',function(e){if(sx==null)return;var dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>50)open(idx+(dx<0?1:-1))});
 /* keep gallery in sync with saves/edits/deletes */
 var baseDraw=drawTestReviews;drawTestReviews=function(){var r=baseDraw.apply(this,arguments);try{drawGallery()}catch(_){}return r};window.drawTestReviews=drawTestReviews;
 /* ---- navigation helpers ---- */
 function goTesting(){var nav=document.querySelector('[data-tab="testing"]');if(nav)nav.click()}
 document.addEventListener('click',function(e){
  var tp=e.target.closest('[data-testpen]');
  if(tp){e.preventDefault();e.stopPropagation();var id=tp.getAttribute('data-testpen');goTesting();
   try{$$('tPenSearch').value='';$$('tInkSearch').value='';updateTestSelects();$$('tPen').value=id;$$('tPen').dispatchEvent(new Event('change'))}catch(_){}
   setTimeout(function(){var c=document.getElementById('testing');if(c)c.scrollIntoView({behavior:'smooth',block:'start'})},60);return}
  var it=e.target.closest('.ink-tests[data-inkid]');
  if(it){e.preventDefault();e.stopPropagation();filter={kind:'ink',id:it.getAttribute('data-inkid')};goTesting();drawGallery();setTimeout(function(){card.scrollIntoView({behavior:'smooth',block:'start'})},80)}
 },true);
 /* ink card "시필 N건" → 이 잉크 사진 모아 보기 */
 var baseTests=window.inkTestsHtml;
 if(typeof baseTests==='function')window.inkTestsHtml=function(ink){var h=baseTests(ink);return h?h.replace('<div class="ink-tests"','<div class="ink-tests" data-inkid="'+esc(ink.id)+'" role="button"'):h};
 drawGallery();try{drawInks()}catch(_){}
})();
