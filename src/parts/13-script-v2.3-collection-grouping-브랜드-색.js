
/* v2.3 collection grouping: 브랜드/색상/특성/보유형태 (잉크), 브랜드/잉입 잉크 색/닙/잉입 상태 (만년필). View only; data untouched. */
var SORT_MODES={
 ink:[['brand','브랜드'],['color','색상'],['use','잉입 여부'],['effect','특성'],['stock','보유 형태']],
 pen:[['brand','브랜드'],['ink','잉입 잉크 색'],['nib','닙'],['state','잉입 상태']]
};
var sortMode={pen:'brand',ink:'brand'};
try{var _sm=JSON.parse(localStorage.getItem('penInkLab_sort_v1')||'{}');if(_sm.pen)sortMode.pen=_sm.pen;if(_sm.ink)sortMode.ink=_sm.ink}catch(_){}
function optOrder(id){var s=document.getElementById(id);return s?[].map.call(s.options,function(o){return o.value||o.text}):[]}
function hueKey(ink){if(!ink)return 999;var c=inkHsl(ink),h=c[0],s=c[1];return s<12?400+(100-c[2]):(h+20)%360}
function penInk(p){if(!p||!p.inkName||p.inkName==='—')return null;try{return matchingInk(p)||(typeof fuzzyInkForPen==='function'?fuzzyInkForPen(p):null)}catch(_){return null}}
var _ipm=null;
function inkPenMap(){if(_ipm)return _ipm;_ipm=new Map();(db.pens||[]).forEach(function(p){var st=penFillState(p);if(st==='empty')return;var ink=penInk(p);if(!ink)return;if(!_ipm.has(ink.id))_ipm.set(ink.id,[]);_ipm.get(ink.id).push({p:p,st:st})});setTimeout(function(){_ipm=null},0);return _ipm}
function inkPensHtml(ink){var list=(inkPenMap().get(ink.id)||[]).slice().sort(function(a,b){return (a.st==='filled'?0:1)-(b.st==='filled'?0:1)});if(!list.length)return '';var shown=list.slice(0,3).map(function(o){return '<li class="'+(o.st==='filled'?'':'unsure')+'"'+(o.st==='filled'?'':' title="과거 기록 · 현재 잉입 여부 미확인"')+'>'+esc(o.p.brand+' '+o.p.name)+(o.p.nib?' <span>'+esc(o.p.nib)+'</span>':'')+(o.st==='filled'?'':' <em>미확인</em>')+'</li>'}).join('');return '<ul class="ink-pens" aria-label="잉입된 만년필">'+shown+(list.length>3?'<li class="more">외 '+(list.length-3)+'자루</li>':'')+'</ul>'}
// Same family written in a different order (e.g. "그레이 & 블랙") joins the registration-form name ("블랙 & 그레이").
function famCanon(f){f=String(f||'').trim();if(!f)return '';var key=function(s){return String(s).split(/[&＆\/]/).map(norm).filter(Boolean).sort().join('|')},k=key(f),hit=optOrder('iFamily').find(function(o){return key(o)===k});return hit||f}
function groupHtml(list,kind,card){
 var mode=sortMode[kind]||'brand',groups={},order=[],key,label,rank={};
 function put(k,lab,r,dot,item){if(!groups[k]){groups[k]={label:lab,items:[],dot:dot};order.push(k);rank[k]=r}groups[k].items.push(item)}
 list.forEach(function(x){
  if(kind==='ink'){
   if(mode==='use'){var u=inkPenMap().get(x.id)||[],f=u.some(function(o){return o.st==='filled'});put(f?'u1':u.length?'u2':'u3',f?'지금 잉입 중':u.length?'잉입 기록 있음 · 현재 미확인':'잉입된 만년필 없음',f?0:u.length?1:2,'',x)}
   else if(mode==='color'){var fam=famCanon(x.family),fams=optOrder('iFamily'),fi=fams.indexOf(fam);put('f:'+(fam||'?'),fam||'색상 미분류',fi<0?99:fi,inkHex(x),x)}
   else if(mode==='effect'){var fx=x.effect||'미확인',ei=optOrder('iEffect').indexOf(fx);if(fx==='미확인')ei=98;put('e:'+fx,fx==='Standard'?'Standard (일반)':fx,ei<0?50:ei,'',x)}
   else if(mode==='stock'){var t=x.packageType==='bottle'?['b','본병',0]:x.packageType==='sample'?['s','소분',1]:x.packageType==='cartridge'?['c','카트리지',2]:['u','형태 미확인',3];put(t[0],t[1],t[2],'',x)}
   else put('b:'+norm(x.brand),x.brand||'브랜드 미상',String(x.brand||'').toLowerCase(),'',x);
  }else{
   if(mode==='ink'){
    var st=penFillState(x),ink=penInk(x);
    if(st==='empty')put('z:empty','미잉입',200,'',x);
    else if(!ink)put('z:noinfo',st==='uncertain'?'잉크 기록 있음 · 현재 미확인':'잉입 중 · 잉크 색 정보 없음',150,'',x);
    else{var fam2=famCanon(ink.family),fams2=optOrder('iFamily'),fj=fams2.indexOf(fam2);put('f:'+(fam2||'?'),fam2||'색상 미분류',fj<0?99:fj,inkHex(ink),x)}
   }else if(mode==='nib'){var nibs=optOrder('pNib'),ni=nibs.indexOf(x.nib);put('n:'+(x.nib||'?'),x.nib||'닙 미상',ni<0?90:ni,'',x)}
   else if(mode==='state'){var s2=penFillState(x);put('s:'+s2,s2==='filled'?'현재 잉입':s2==='uncertain'?'현재 미확인':'미잉입',s2==='filled'?0:s2==='uncertain'?1:2,'',x)}
   else put('b:'+norm(x.brand),x.brand||'브랜드 미상',String(x.brand||'').toLowerCase(),'',x);
  }
 });
 order.sort(function(a,b){var ra=rank[a],rb=rank[b];return ra<rb?-1:ra>rb?1:0});
 return order.map(function(k){
  var g=groups[k],items=g.items;
  if(kind==='ink'&&mode==='color')items=items.slice().sort(function(a,b){return hueKey(a)-hueKey(b)});
  if(kind==='pen'&&mode==='ink')items=items.slice().sort(function(a,b){return hueKey(penInk(a))-hueKey(penInk(b))});
  return '<div class="grp-h">'+(g.dot?'<i class="grp-dot" style="--c-ink:'+g.dot+'"></i>':'')+esc(g.label)+'<span class="grp-n">'+items.length+'</span></div>'+items.map(card).join('');
 }).join('');
}
(function(){
 'use strict';
 [['pen','penSearch','penRows'],['ink','inkSearch','inkRows']].forEach(function(c){
  var search=document.getElementById(c[1]);if(!search)return;
  var bar=document.createElement('div');bar.className='sort-bar';bar.setAttribute('role','group');bar.setAttribute('aria-label','보기 기준');
  bar.innerHTML='<span class="sort-lab">보기</span>'+SORT_MODES[c[0]].map(function(m){return '<button type="button" class="sort-chip" data-sort="'+m[0]+'">'+m[1]+'</button>'}).join('');
  search.parentNode.insertBefore(bar,search.nextSibling);
  function mark(){[].forEach.call(bar.querySelectorAll('.sort-chip'),function(b){var on=b.getAttribute('data-sort')===sortMode[c[0]];b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})}
  mark();
  bar.addEventListener('click',function(e){var b=e.target.closest('.sort-chip');if(!b)return;sortMode[c[0]]=b.getAttribute('data-sort');mark();try{localStorage.setItem('penInkLab_sort_v1',JSON.stringify(sortMode))}catch(_){}try{c[0]==='pen'?drawPens():drawInks()}catch(_){}});
  var hint=document.getElementById(c[2]);hint=hint&&hint.parentNode.querySelector('.hint');
  if(hint)hint.textContent=(c[0]==='pen'?'위의 "보기"에서 브랜드·잉입 잉크 색·닙·잉입 상태별로 묶어 볼 수 있어요. 닙 끝의 색 점은 현재 확인된 잉입 잉크입니다.':'위의 "보기"에서 브랜드·색상·특성·보유 형태별로 묶어 볼 수 있어요. 색 타일은 색조·명도·채도 정보로 추정한 참고용 색입니다.');
 });
 try{drawPens();drawInks()}catch(_){}
})();
