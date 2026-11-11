
/* v2.1 UI layer: page titles, drawer, sync indicator, collapsible help. Never touches app data. */
(function(){
 'use strict';
 var TITLES={match:'추천 매칭',current:'현재 잉입',inks:'잉크 컬렉션',pens:'만년필 컬렉션',research:'잉크 자료실',history:'잉입 기록',testing:'시필 노트',backup:'백업·복원'};
 var body=document.body,last='';
 function closeDrawer(){body.classList.remove('drawer-open')}
 function syncTitle(){
  var s=document.querySelector('section.on');if(!s)return;
  document.getElementById('uiTitle').textContent=TITLES[s.id]||'';
  document.title=(TITLES[s.id]||'')+' · Pen & Ink Lab';
  if(last&&last!==s.id)window.scrollTo({top:0,behavior:'auto'});
  last=s.id;closeDrawer();
 }
 var mo=new MutationObserver(syncTitle);
 document.querySelectorAll('section').forEach(function(s){mo.observe(s,{attributes:true,attributeFilter:['class']})});
 syncTitle();
 function syncState(){
  var el=document.getElementById('syncStatus'),chip=document.getElementById('uiSyncChip');if(!el)return;
  var t=el.textContent.trim(),st=/완료/.test(t)?'ok':/실패|오류|충돌/.test(t)?'bad':/로컬|필요|보호/.test(t)?'warn':'busy';
  el.setAttribute('data-sync',st);if(chip){chip.textContent=t;chip.setAttribute('data-sync',st)}
 }
 var sync=document.getElementById('syncStatus');
 if(sync)new MutationObserver(syncState).observe(sync,{childList:true,characterData:true,subtree:true});
 syncState();
 ['uiMenu','uiMore','uiSyncChip'].forEach(function(id){var b=document.getElementById(id);if(b)b.addEventListener('click',function(){
  if(id==='uiSyncChip'&&window.matchMedia('(min-width:1024px)').matches){document.getElementById('uiSyncPanel').scrollIntoView({behavior:'smooth'});return}
  body.classList.toggle('drawer-open');
 })});
 document.getElementById('uiScrim').addEventListener('click',closeDrawer);
 document.addEventListener('keydown',function(e){if(e.key==='Escape')closeDrawer()});
 // Long static explanations fold into a small "도움말" toggle at the bottom of each card.
 document.querySelectorAll('.card').forEach(function(card){
  var items=[].filter.call(card.children,function(el){return (el.matches('p.hint')||el.matches('div.notice'))&&!el.id&&!el.querySelector('[id]')});
  if(!items.length)return;
  var d=document.createElement('details');d.className='help';d.innerHTML='<summary>도움말</summary>';
  items.forEach(function(el){d.appendChild(el)});card.appendChild(d);
 });
 // Per-pen photo override, stored on the pen record so it syncs with the cloud state.
 document.getElementById('penRows').addEventListener('click',function(e){
  var b=e.target.closest('[data-penphoto]');if(!b)return;
  PIL.photoSheet('pen',b.dataset.penphoto);
 });
 // Opening the ink editor from a gallery card should reveal it even when far below.
 document.getElementById('inkRows').addEventListener('click',function(e){
  if(e.target.closest('[data-editinkdetail]'))setTimeout(function(){document.getElementById('inkDetailEditor').scrollIntoView({behavior:'smooth',block:'start'})},30);
 });
})();
