
/* 등록 폼 검색 자동완성: 몇 글자 입력 → 브랜드·색 계열·특성(잉크) / 닙·지역 경향(만년필) 자동 채움 */
(function(){
 'use strict';
 var PIL=window.PIL;
 function box(secId,idPrefix,label,ph){
  var sec=$(secId),det=sec&&sec.querySelector('details.add-card');if(!det)return null;
  var d=document.createElement('div');d.className='pil-find';
  d.innerHTML='<label for="'+idPrefix+'Find">'+label+'</label><input class="input" id="'+idPrefix+'Find" placeholder="'+ph+'" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="'+idPrefix+'List">'+
   '<ul class="pil-list" id="'+idPrefix+'List" role="listbox"></ul><p class="hint" id="'+idPrefix+'Msg">몇 글자만 입력하면 아래 칸이 자동으로 채워져요. 목록에 없는 제품은 아래에 직접 입력하세요.</p>';
  det.insertBefore(d,det.querySelector('.twocol'));
  return d;
 }
 /* 잉크 */
 if(box('inks','pilInk','잉크 검색','예: 이로시주쿠, Diamine Marine, 몽블랑')){
  PIL.bindSearch($('pilInkFind'),$('pilInkList'),
   function(q){return PIL.searchCatalog(INK_CATALOG,q,8)},PIL.inkRowHtml,
   function(e){
    $('iBrand').value=e.brand;$('iName').value=e.name;$('iFamily').value=e.family;$('iEffect').value=e.effect;
    PIL.rememberPick(e);$('pilInkFind').value='';
    $('pilInkMsg').textContent=e.brand+' '+e.name+' — 색 계열과 특성을 자동으로 채웠어요. 참고용이니 다르면 고쳐 주세요. 이제 "잉크 등록"을 누르세요.';
    $('addInk').scrollIntoView({block:'center',behavior:'smooth'});
   });
 }
 /* 만년필 */
 if(box('pens','pilPen','모델 검색','예: Lamy Safari, 파일럿 커스텀 74, TWSBI Eco')){
  PIL.bindSearch($('pilPenFind'),$('pilPenList'),
   function(q){return PIL.searchCatalog(PEN_CATALOG,q,8)},PIL.penRowHtml,
   function(e){
    $('pBrand').value=e.brand;$('pName').value=e.name;$('pNib').value=e.nibs[0];$('pilPenFind').value='';
    var m=$('pilPenMsg');m.textContent='';
    var t=document.createElement('span');t.textContent=e.brand+' '+e.name+' — 닙을 골라 주세요: ';m.appendChild(t);
    e.nibs.forEach(function(n){var b=document.createElement('button');b.type='button';b.className='chip-btn'+(n===e.nibs[0]?' on':'');b.textContent=n;
     b.onclick=function(){$('pNib').value=n;m.querySelectorAll('.chip-btn').forEach(function(x){x.classList.toggle('on',x===b)})};m.appendChild(b)});
    var r=PIL.regionHint(e.brand);if(r){var p=document.createElement('div');p.textContent=r;m.appendChild(p)}
    $('addPen').scrollIntoView({block:'center',behavior:'smooth'});
   });
 }
})();
