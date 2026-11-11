
/* 잉크 교체 3탭: 만년필 카드 → 잉크 교체 → 잉크 선택 → 완료 (세척 기록 자동, 되돌리기 가능) */
(function(){
 'use strict';
 var PIL=window.PIL;
 function inkedElsewhere(penId){
  var m={};db.pens.forEach(function(p){if(p.id===penId||penFillState(p)==='empty')return;var i=null;try{i=penInk(p)}catch(_){}if(i)m[i.id]=p})
  return m;
 }
 /* 실제 교체: 들어 있던 잉크가 확인된 경우에만 세척 기록을 자동으로 남긴다 */
 PIL.applySwap=function(pen,ink,o){
  var cur=null;try{cur=penInk(pen)}catch(_){}
  if(penFillState(pen)==='filled'&&cur&&cur.id===ink.id){PIL.toast((o&&o.silentSame)?'이미 이 잉크가 들어 있는 것으로 기록돼 있어요':'이미 들어 있는 잉크예요');return}
  var snap=JSON.parse(JSON.stringify(pen)),hLen=db.history.length,date=localDate();
  var washed=penFillState(pen)==='filled';
  if(washed)changeFill(pen,'세척',null,date,'잉크 교체 전 자동 세척');
  changeFill(pen,'잉입',ink,date,'잉크 교체');
  save();refresh();
  PIL.toast(pen.name+' → '+ink.brand+' '+ink.name+(washed?' (세척 기록 포함)':''),{undo:function(){
   Object.keys(pen).forEach(function(k){delete pen[k]});Object.assign(pen,snap);db.history.length=hLen;save();refresh();PIL.toast('교체를 되돌렸어요');
  }});
 };
 /* 잉크 선택 시트 (내 잉크 + 카탈로그 검색) */
 PIL.inkPicker=function(o){
  var s=PIL.sheet(o.title,(o.intro?'<p class="pil-intro">'+esc(o.intro)+'</p>':'')+
   '<input class="input" id="pilPickQ" placeholder="'+(o.own?'내 잉크 검색 · 없으면 새 잉크도 검색':'잉크 검색 (예: Diamine, 이로시주쿠)')+'" autocomplete="off"><div id="pilPickOwn" class="pil-pick"></div><div id="pilPickCat" class="pil-pick"></div>');
  var q=s.el.querySelector('#pilPickQ'),own=s.el.querySelector('#pilPickOwn'),cat=s.el.querySelector('#pilPickCat');
  var elsewhere=o.penId?inkedElsewhere(o.penId):{},ownList=[],catList=[];
  function draw(){
   var t=q.value.trim();
   ownList=o.own?sortedCollection(db.inks.filter(function(i){return !t||matchesWords(t,[i.brand,i.name,i.family,i.hue])})).slice(0,60):[];
   own.innerHTML=ownList.length?'<h4>내 잉크</h4>'+ownList.map(function(i,k){
    var tag=elsewhere[i.id]?'<em class="pil-tag warn">'+esc(elsewhere[i.id].name)+'에 잉입 중</em>':'';
    return '<button type="button" class="pil-row" data-own="'+k+'"><span class="pil-dot" style="--c:'+esc(inkHex(i))+'"></span><span class="pil-txt"><b>'+esc(i.brand)+'</b> '+esc(i.name)+'</span>'+tag+'</button>'}).join(''):(o.own?'<p class="hint">'+(db.inks.length?'일치하는 내 잉크가 없어요.':'아직 등록한 잉크가 없어요. 아래에서 검색해 추가하세요.')+'</p>':'');
   catList=t?PIL.searchCatalog(INK_CATALOG,t,6).filter(function(e){return !db.inks.some(function(x){return norm(x.brand)===norm(e.brand)&&norm(x.name)===norm(e.name)})}):[];
   cat.innerHTML=catList.length?'<h4>'+(o.own?'내 목록에 없는 잉크 (추가하고 바로 사용)':'검색 결과')+'</h4>'+catList.map(function(e,k){return '<button type="button" class="pil-row" data-cat="'+k+'">'+PIL.inkRowHtml(e)+'<em class="pil-tag add">+ 추가</em></button>'}).join(''):'';
  }
  s.el.addEventListener('click',function(e){
   var b=e.target.closest('[data-own],[data-cat]');if(!b)return;
   var ink,isNew=false;
   if(b.dataset.own!==undefined)ink=ownList[Number(b.dataset.own)];
   else{var r=PIL.ensureInk(catList[Number(b.dataset.cat)]);ink=r.ink;isNew=r.isNew}
   s.close();o.onPick(ink,isNew);
  });
  q.addEventListener('input',draw);draw();setTimeout(function(){q.focus()},50);
  return s;
 };
 PIL.openSwap=function(penId){
  var pen=db.pens.find(function(p){return p.id===penId});if(!pen)return;
  var cur=null;try{cur=penInk(pen)}catch(_){}
  var st=penFillState(pen);
  PIL.inkPicker({title:'잉크 교체 · '+pen.brand+' '+pen.name,penId:penId,own:true,
   intro:st==='filled'&&cur?'지금: '+cur.brand+' '+cur.name+' — 고르면 세척 기록을 남기고 바로 교체해요.':st==='uncertain'?'지금 든 잉크는 확인되지 않았어요. 고른 잉크로 잉입을 기록해요.':'지금은 비어 있어요. 잉크를 고르면 잉입으로 기록해요.',
   onPick:function(ink,isNew){if(isNew){save();refresh()}PIL.applySwap(pen,ink)}});
 };
 document.addEventListener('click',function(e){var b=e.target.closest('[data-swapink]');if(b){e.preventDefault();PIL.openSwap(b.dataset.swapink)}});
})();
