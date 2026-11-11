
/* 공개판 공통 모듈: 토스트·바텀시트·검색 목록·카탈로그 등록·기능 플래그 (window.PIL) */
(function(){
 'use strict';
 var PIL=window.PIL=window.PIL||{};

 /* ── 서버 없음 자리표시 ──
    이전 버전의 사진 저장·판독 코드가 서버 함수를 부르던 자리. 이 버전에는 서버가 없으므로 호출되면 실패 처리기(withFailureHandler)에 오류를 알려 주고 끝난다.
    기기 안 사진 저장(IndexedDB)을 만들 때 이 자리에 연결한다. */
 PIL.noServer=function(){
  var fail=null;
  var api=new Proxy({},{get:function(t,k){
   if(k==='withSuccessHandler'||k==='withUserObject')return function(){return api};
   if(k==='withFailureHandler')return function(f){fail=f;return api};
   return function(){var err=new Error('이 버전에서는 사진 저장·판독을 지원하지 않아요.');if(typeof fail==='function')setTimeout(function(){fail(err)},0)};
  }});
  return api;
 };
 /* ── 토스트 (되돌리기 지원) ── */
 PIL.toast=function(msg,opt){
  var t=$('pilToast');
  if(!t){t=document.createElement('div');t.id='pilToast';t.setAttribute('role','status');document.body.appendChild(t)}
  t.textContent='';var s=document.createElement('span');s.textContent=msg;t.appendChild(s);
  if(opt&&opt.undo){var b=document.createElement('button');b.type='button';b.textContent='되돌리기';b.onclick=function(){t.classList.remove('on');opt.undo()};t.appendChild(b)}
  t.classList.add('on');clearTimeout(PIL._tt);PIL._tt=setTimeout(function(){t.classList.remove('on')},(opt&&opt.ms)||6000);
 };

 /* ── 바텀시트 ── */
 PIL.sheet=function(title,bodyHtml){
  var bg=document.createElement('div');bg.className='pil-sheet-bg';
  bg.innerHTML='<div class="pil-sheet" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="pil-sheet-head"><b>'+esc(title)+'</b><button type="button" class="pil-x" aria-label="닫기">×</button></div><div class="pil-sheet-body">'+bodyHtml+'</div></div>';
  document.body.appendChild(bg);
  var prev=document.activeElement;
  function key(e){if(e.key==='Escape'){e.stopPropagation();close()}}
  function close(){document.removeEventListener('keydown',key,true);bg.remove();try{if(prev&&prev.focus)prev.focus()}catch(_){}}
  bg.addEventListener('click',function(e){if(e.target===bg||e.target.closest('.pil-x'))close()});
  document.addEventListener('keydown',key,true);
  return {el:bg.querySelector('.pil-sheet-body'),root:bg,close:close};
 };

 /* ── 카탈로그 검색 ── */
 PIL.searchCatalog=function(list,q,limit){
  q=String(q||'').trim();if(!q)return [];
  var nq=norm(q);
  var hit=list.filter(function(x){return matchesWords(q,[x.brand,x.name,x.ko])});
  hit.sort(function(a,b){
   var sa=norm(a.brand+' '+a.name).indexOf(nq)===0?0:1,sb=norm(b.brand+' '+b.name).indexOf(nq)===0?0:1;
   return sa-sb; /* 같은 순위는 카탈로그에 적은 순서(인기순) 유지 */
  });
  return hit.slice(0,limit||8);
 };
 /* 입력칸 + 결과 목록 연결. rows(q) → 배열, row(item) → HTML, pick(item) */
 PIL.bindSearch=function(input,listEl,rows,row,pick){
  var cur=[],act=-1;
  function draw(){
   var q=input.value;cur=q.trim()?rows(q):[];act=-1;
   listEl.innerHTML=cur.map(function(it,i){return '<li role="option" data-i="'+i+'">'+row(it)+'</li>'}).join('')||(q.trim()?'<li class="pil-none">검색 결과가 없어요. 아래에 직접 입력해 주세요.</li>':'');
   listEl.hidden=!listEl.innerHTML;
  }
  function choose(i){var it=cur[i];if(!it)return;listEl.innerHTML='';listEl.hidden=true;pick(it)}
  input.addEventListener('input',draw);
  input.addEventListener('keydown',function(e){
   var lis=listEl.querySelectorAll('li[data-i]');
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(!lis.length)return;e.preventDefault();act=(act+(e.key==='ArrowDown'?1:-1)+lis.length)%lis.length;lis.forEach(function(l,i){l.classList.toggle('on',i===act)})}
   else if(e.key==='Enter'&&lis.length){e.preventDefault();choose(act<0?0:act)}
   else if(e.key==='Escape'){listEl.innerHTML='';listEl.hidden=true}
  });
  listEl.addEventListener('click',function(e){var li=e.target.closest('li[data-i]');if(li)choose(Number(li.dataset.i))});
  listEl.hidden=true;
  return {redraw:draw};
 };
 PIL.inkRowHtml=function(it){
  var col='';try{col=inkHex({brand:it.brand,name:it.name,family:it.family,hue:it.hue})}catch(_){col='#ccc'}
  var fx=it.effect&&it.effect!=='Standard'?'<em class="pil-tag">'+esc(it.effect)+'</em>':'';
  return '<span class="pil-dot" style="--c:'+esc(col)+'"></span><span class="pil-txt"><b>'+esc(it.brand)+'</b> '+esc(it.name)+'</span>'+fx;
 };
 PIL.penRowHtml=function(it){return '<span class="pil-txt"><b>'+esc(it.brand)+'</b> '+esc(it.name)+'</span><em class="pil-tag">닙 '+esc(it.nibs.join(' · '))+'</em>'};

 /* ── 카탈로그 항목을 내 컬렉션에 추가 (이미 있으면 기존 것 반환) ── */
 PIL.ensureInk=function(e){
  var f=db.inks.find(function(x){return norm(x.brand)===norm(e.brand)&&norm(x.name)===norm(e.name)});
  if(f)return {ink:f,isNew:false};
  var ink={id:makeNewId('i',db.inks),brand:e.brand,name:e.name,family:e.family,hue:e.hue||'',value:'미확인',saturation:'미확인',effect:e.effect||'미확인',flow:'미확인',notes:'검색으로 추가',packageType:'unknown',capacityMl:null,remainingMl:null,volumeSource:'사용자 신규등록'};
  db.inks.push(ink);return {ink:ink,isNew:true};
 };
 PIL.ensurePen=function(e,nib){
  var f=db.pens.find(function(x){return norm(x.brand)===norm(e.brand)&&norm(x.name)===norm(e.name)});
  if(f)return {pen:f,isNew:false};
  var pen={id:makeNewId('p',db.pens),brand:e.brand,name:e.name,nib:nib||(e.nibs&&e.nibs[0])||'F',inkBrand:'미잉입',inkName:'—',status:'미잉입',fillVerified:false,fillDate:'',notes:e.notes||''};
  db.pens.push(pen);return {pen:pen,isNew:true};
 };
 /* 검색으로 고른 잉크의 색조를 addInk 가 그대로 쓰도록 기억 */
 var picked=null;
 PIL.rememberPick=function(e){picked=e};
 PIL.pickedHue=function(brand,name){return picked&&norm(picked.brand)===norm(brand)&&norm(picked.name)===norm(name)?picked.hue:''};
 PIL.regionHint=function(brand){
  if(EAST_ASIAN_PENS.test(brand))return '일본 제조사 · 같은 표기라도 서양 펜보다 선이 가는 경향이 있어요.';
  if(WESTERN_PENS.test(brand))return '유럽·미국 제조사 · 일본 펜보다 선이 굵고 촉촉한 경향이 있어요.';
  return '';
 };

 /* ── 갱신 훅: refresh() 끝에서 호출 ── */
 var hooks=[];
 PIL.onRefreshAdd=function(fn){hooks.push(fn)};
 PIL.onRefresh=function(){hooks.forEach(function(fn){try{fn()}catch(e){console.warn('PIL hook',e)}})};
})();
