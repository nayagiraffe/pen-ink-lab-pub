
/* 시필 저장 직후 호출: 직접 시필인데 그 만년필에 해당 잉크가 안 들어 있으면 "잉입으로 기록할까요?" 확인한다 (시필 저장 핸들러가 부름) */
(function(){
 'use strict';
 window.offerFillFromTest=function(r){
  try{
   var penId=r.penId,inkId=r.inkId,date=r.date,evidence=r.evidence;
   if(evidence!=='hands-on'||!penId||!inkId)return;
   var p=(db.pens||[]).find(function(x){return x.id===penId}),ink=(db.inks||[]).find(function(x){return x.id===inkId});if(!p||!ink)return;
   var st=penFillState(p),cur=null;try{cur=penInk(p)}catch(_){}
   if(st==='filled'&&cur&&cur.id===ink.id)return;
   var now=p.inkName&&p.inkName!=='—'?(p.inkBrand+' '+p.inkName+(st==='filled'?'':' (확인 필요)')):'비어 있음';
   if(!confirm(p.brand+' '+p.name+'\n지금 기록: '+now+'\n\n이 만년필에 '+ink.brand+' '+ink.name+'을(를) '+date+'에 잉입한 것으로 기록할까요?\n(취소하면 시필만 저장돼요)'))return;
   changeFill(p,'잉입',ink,date,'시필 노트에서 잉입 반영');
   var last=db.history[db.history.length-1];if(last)last.source='시필 노트';
   save();
   try{if(typeof refresh==='function')refresh()}catch(_){}
   try{if(typeof updateTestSelects==='function')updateTestSelects()}catch(_){}
  }catch(e){console.warn('offerFillFromTest',e)}
 };
})();
