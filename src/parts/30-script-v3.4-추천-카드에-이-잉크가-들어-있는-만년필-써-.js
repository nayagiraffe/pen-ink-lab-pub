
/* 추천 카드에 "이 잉크가 들어 있는 만년필 / 써 본 만년필" 표시 (잉크 → 만년필 방향에서는 그 펜에 지금 든 잉크) */
(function(){
 'use strict';
 function penLabel(p){return (p.brand||'')+' '+(p.name||'')+(p.nib?' ('+p.nib+')':'')}
 function short(s){s=String(s||'');return s.length>34?s.slice(0,33)+'…':s}
 function pensForInk(ink,targetPen){
  var cur=[];try{cur=(inkPenMap().get(ink.id)||[]).slice()}catch(_){}
  cur.sort(function(a,b){return (a.st==='filled'?0:1)-(b.st==='filled'?0:1)});
  var curIds={};cur.forEach(function(o){curIds[o.p.id]=1});
  var past={},order=[];
  (db.history||[]).slice().reverse().forEach(function(h){
   if(h.inkId!==ink.id||!h.penId||curIds[h.penId])return;
   if(h.type!=='잉입'&&!h.rating)return;
   var o=past[h.penId];if(!o){o=past[h.penId]={id:h.penId,when:h.when||'',rating:''};order.push(h.penId)}
   if(!o.rating&&(h.rating==='좋음'||h.rating==='별로'))o.rating=h.rating;
  });
  (db.testReviews||[]).forEach(function(t){
   if(t.inkId!==ink.id||!t.penId||curIds[t.penId])return;
   var o=past[t.penId];if(!o){o=past[t.penId]={id:t.penId,when:t.date||'',rating:''};order.push(t.penId)}
   if(t.rating!=null&&t.rating!==''&&!o.test)o.test='시필 '+t.rating+'/5';
  });
  return {cur:cur,past:order.map(function(id){return past[id]})};
 }
 function chip(p,extra,me){return '<span class="pchip'+(me?' me':'')+'">'+esc(short(penLabel(p)))+(extra?' <span class="q">'+esc(extra)+'</span>':'')+'</span>'}
 function block(r){
  var penDir=$('direction').value==='pen';
  if(penDir){
   var d=pensForInk(r.ink,r.pen),h='';
   var cur=d.cur.slice(0,3).map(function(o){return chip(o.p,o.st==='filled'?'':'확인 필요',o.p.id===r.pen.id)}).join('');
   h+='<div><span class="lbl">지금 잉입</span>'+(cur?cur+(d.cur.length>3?'<span class="q"> 외 '+(d.cur.length-3)+'자루</span>':''):'<span class="none">없음</span>')+'</div>';
   var past=d.past.map(function(o){var p=(db.pens||[]).find(function(x){return x.id===o.id});return p?chip(p,[o.rating,o.test].filter(Boolean).join(' · '),p.id===r.pen.id):''}).filter(Boolean);
   h+='<div><span class="lbl">써 본 만년필</span>'+(past.length?past.slice(0,3).join('')+(past.length>3?'<span class="q"> 외 '+(past.length-3)+'자루</span>':''):'<span class="none">기록 없음</span>')+'</div>';
   return '<div class="rec-pens">'+h+'</div>';
  }
  var ink=null;try{ink=penInk(r.pen)}catch(_){}
  var st='';try{st=penFillState(r.pen)}catch(_){}
  var txt=st==='empty'||!ink?'<span class="none">비어 있음</span>':'<span class="pchip">'+esc(short(ink.brand+' '+ink.name))+(st==='filled'?'':' <span class="q">확인 필요</span>')+'</span>';
  return '<div class="rec-pens"><div><span class="lbl">지금 든 잉크</span>'+txt+'</div></div>';
 }
 window.recPensBlock=block; /* recCandidateCard 템플릿이 직접 호출 */
})();
