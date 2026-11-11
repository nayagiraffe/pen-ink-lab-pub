
/* 직접 입력 등록 폼을 사진 등록 카드 바로 아래로 옮기고 "직접 입력" 버튼을 단다 (보유 형태 선택지는 본 HTML 에 반영됨) */
(function(){
 'use strict';
 [['inks','aiCard_ink','iBrand','새 잉크 직접 입력','사진 없이 브랜드·이름·색·보유 형태를 직접 적어요'],
  ['pens','aiCard_pen','pBrand','새 만년필 직접 입력','사진 없이 브랜드·모델·닙을 직접 적어요']].forEach(function(c){
  var sec=document.getElementById(c[0]),ai=document.getElementById(c[1]);if(!sec)return;
  var form=sec.querySelector('details.add-card');if(!form)return;
  form.classList.add('manual-card');
  var h=form.querySelector('summary h2');if(h)h.textContent=c[3];
  var sm=form.querySelector('summary');if(sm&&!sm.querySelector('.ai-sub')){var sub=document.createElement('span');sub.className='ai-sub';sub.textContent=c[4];sm.appendChild(sub)}
  if(ai&&ai.parentNode===sec)sec.insertBefore(form,ai.nextSibling);
  function openForm(){form.open=true;if(ai)ai.open=false;setTimeout(function(){form.scrollIntoView({behavior:'smooth',block:'start'});var b=document.getElementById(c[2]);if(b)try{b.focus({preventScroll:true})}catch(_){}},60)}
  var row=ai&&ai.querySelector('.ai-row');
  if(row&&!row.querySelector('.manual-btn')){var b=document.createElement('button');b.type='button';b.className='btn secondary ai-cam-btn manual-btn';b.textContent='✏️ 직접 입력';b.onclick=openForm;row.appendChild(b)}
 });
})();
