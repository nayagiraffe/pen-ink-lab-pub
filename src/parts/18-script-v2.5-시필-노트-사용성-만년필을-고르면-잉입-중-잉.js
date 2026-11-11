
/* v2.5 시필 노트 사용성: ① 만년필을 고르면 잉입 중 잉크 → 이 펜으로 써 본 잉크 → 전체 순으로 정렬·자동 선택 ② 사진·AI 초안을 종이 바로 아래로, AI가 채우는 칸(테·농담·번짐·선 굵기)을 그 아래에 모음 */
(function(){
 'use strict';
 var $$=function(id){return document.getElementById(id)};
 var pen=$$('tPen'),ink=$$('tInk'),paper=$$('tPaper'),photos=$$('tPhotos');if(!pen||!ink||!paper||!photos)return;
 /* ---- layout ---- */
 try{
  var paperRow=paper.closest('.twocol')||paper.parentNode;
  var photoLabel=photos.previousElementSibling, btns=photos.nextElementSibling, msg=$$('tAiMsg'), hint=msg&&msg.nextElementSibling;
  var photoBox=document.createElement('div');photoBox.className='tx-photo-first';
  [photoLabel,photos,btns,msg,hint].forEach(function(n){if(n)photoBox.appendChild(n)});
  paperRow.parentNode.insertBefore(photoBox,paperRow.nextSibling);
  var wrap=function(id){var el=$$(id);return el?el.parentNode:null};
  var aiGrid=document.createElement('div');aiGrid.className='twocol';
  var aiHead=document.createElement('label');aiHead.textContent='사진으로 보이는 항목 (AI가 비어 있는 칸만 채워요)';aiHead.style.cssText='margin-top:10px;font-weight:700';
  ['tSheen','tShade','tFeather','tWidth'].forEach(function(id){var w=wrap(id);if(w)aiGrid.appendChild(w)});
  photoBox.parentNode.insertBefore(aiHead,photoBox.nextSibling);aiHead.parentNode.insertBefore(aiGrid,aiHead.nextSibling);
  var mHead=document.createElement('label');mHead.textContent='직접 써 본 느낌';mHead.style.cssText='margin-top:10px;font-weight:700';
  var coreGrid=($$('tFlow')||{}).closest?$$('tFlow').closest('.twocol'):null;
  if(coreGrid){coreGrid.parentNode.insertBefore(mHead,coreGrid);
   var rest=document.createElement('div');rest.className='twocol';['tDry','tNib'].forEach(function(id){var w=wrap(id);if(w)rest.appendChild(w)});
   coreGrid.parentNode.insertBefore(rest,coreGrid.nextSibling);}
  var oldBox=document.querySelector('.tx-box');if(oldBox&&!oldBox.querySelector('input,select,textarea,img'))oldBox.style.display='none';
 }catch(e){console.warn('v2.5 layout',e)}
 /* ---- ink ordering ---- */
 function toks(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[()\[\]·,\/&_\-]+/g,' ').split(/\s+/).filter(function(w){return w.length>=2&&!/^(ink|inks|iroshizuku|cartridge|카트리지|잉크|the|of|no|kobe|#?\d{1,3})$/.test(w)})}
 function looseInk(p){var bt=toks(p.inkBrand),nt=toks(p.inkName).filter(function(w){return !/^(blue|black|red|green|purple|brown|grey|gray|pink|orange|yellow|turquoise|teal|violet|royal|dark|deep|light|블루|블랙|레드|그린|퍼플|브라운|그레이)$/.test(w)});if(!nt.length)return null;var best=null,score=0;
  (db.inks||[]).forEach(function(i){var ib=toks(i.brand),it=toks(i.name+' '+i.brand);var brandOk=!bt.length||bt.some(function(w){return ib.indexOf(w)>=0||ib.some(function(x){return x.indexOf(w)>=0||w.indexOf(x)>=0})});if(!brandOk)return;
   var s=nt.filter(function(w){return it.indexOf(w)>=0}).length;if(s>score){score=s;best=i}});
  return score>=1&&score/nt.length>=0.5?best:null}
 function inkedFor(p){try{if(!p||penFillState(p)==='empty')return null;return penInk(p)||looseInk(p)}catch(_){return null}}
 function triedWith(p){var seen={},out=[];
  (db.testReviews||[]).slice().reverse().forEach(function(t){if(t.penId===p.id&&!seen[t.inkId]){seen[t.inkId]=1;out.push(t.inkId)}});
  (db.history||[]).slice().reverse().forEach(function(h){if(h.penId===p.id&&h.inkId&&!seen[h.inkId]){seen[h.inkId]=1;out.push(h.inkId)}});
  return out}
 var lastPen=null;
 function reorder(autoSelect){
  var p=db.pens.find(function(x){return x.id===pen.value});if(!p)return;
  if(pen.value!==lastPen)autoSelect=true;lastPen=pen.value;
  var cur=ink.value,opts=[].slice.call(ink.querySelectorAll('option'));if(!opts.length)return;
  var byId={};opts.forEach(function(o){byId[o.value]=o});
  var now=inkedFor(p),nowId=now&&byId[now.id]?now.id:null,used={};
  var g1=[],g2=[],g3=[];
  if(nowId){g1.push(nowId);used[nowId]=1}
  triedWith(p).forEach(function(id){if(byId[id]&&!used[id]&&g2.length<10){g2.push(id);used[id]=1}});
  opts.forEach(function(o){if(!used[o.value])g3.push(o.value)});
  ink.innerHTML='';
  function grp(label,ids){if(!ids.length)return;var g=document.createElement('optgroup');g.label=label;ids.forEach(function(id){var o=byId[id];o.textContent=o.textContent.replace(/^✒ /,'');if(id===nowId)o.textContent='✒ '+o.textContent;g.appendChild(o)});ink.appendChild(g)}
  if(g1.length||g2.length){grp('지금 잉입 중',g1);grp('이 펜으로 써 본 잉크',g2);grp('전체 잉크',g3)}else g3.forEach(function(id){ink.appendChild(byId[id])});
  if(autoSelect&&nowId)ink.value=nowId;else if(byId[cur])ink.value=cur;
 }
 var base=updateTestSelects;
 updateTestSelects=function(){base.apply(this,arguments);reorder(false)};
 window.updateTestSelects=updateTestSelects;
 try{$$('tPenSearch').oninput=updateTestSelects;$$('tInkSearch').oninput=updateTestSelects}catch(_){}
 pen.addEventListener('change',function(){reorder(true)});
 /* 잉크 카드의 시필 버튼으로 들어오면 그 잉크를 유지 (v2.4 핸들러 뒤에 정렬만 다시) */
 document.addEventListener('click',function(e){if(!e.target.closest('[data-testink]'))return;var id=e.target.closest('[data-testink]').getAttribute('data-testink');setTimeout(function(){reorder(false);ink.value=id},0)});
 try{reorder(false)}catch(_){}
})();
