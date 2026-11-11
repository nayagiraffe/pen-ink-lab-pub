
/* 왼쪽 위 "Pen & Ink Lab" 로고 → 새로고침 후 첫 화면(추천 매칭) */
(function(){
 'use strict';
 var APP_URL=location.href.split("#")[0];
 var b=document.querySelector('#uiSidebar .brand');if(!b)return;
 b.setAttribute('role','link');b.setAttribute('tabindex','0');b.setAttribute('title','새로고침 · 첫 화면으로');b.style.cursor='pointer';
 var st=document.createElement('style');st.textContent='#uiSidebar .brand{border-radius:14px;transition:background .15s}#uiSidebar .brand:hover{background:var(--sunken)}#uiSidebar .brand:active{transform:scale(.98)}';document.head.appendChild(st);
 function soft(){try{document.querySelectorAll('.tr-sheet,.gal-lb').forEach(function(x){x.hidden=true});document.body.classList.remove('drawer-open');document.body.style.overflow='';var nav=document.querySelector('.tabs button[data-tab="match"]');if(nav)nav.click();else if(typeof openTab==='function')openTab('match');window.scrollTo(0,0)}catch(_){}}
 function go(e){if(e)e.preventDefault();soft();
  try{var w=window.open(APP_URL,'_top');if(w!==null&&w!==undefined)return}catch(_){}
  try{window.top.location.href=APP_URL}catch(_){}}
 b.addEventListener('click',go);
 b.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' ')go(e)});
})();
