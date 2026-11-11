
/* 추천 엔진 보정 — 기본 점수(calcBase) 위에 ① 편중 완화(구 v3.2) ② 전용 잉크(구 v3.3)를 순서대로 적용한다. 감싸기(monkey patch) 없음. */
(function(){
 'use strict';
 var DAY=864e5;
 function parseDay(s){var t=Date.parse(String(s||'').trim().slice(0,10).replace(/\./g,'-'));return isFinite(t)?t:null}
 var memo=null,memoAt=0;
 function resetCache(){memo=null;memoAt=0}
 function stats(){
  var now=Date.now();if(memo&&now-memoAt<1500)return memo;
  var fills={},liked={},tried={};
  (db.history||[]).forEach(function(h){
   if(!h||!h.inkId)return;
   tried[h.penId+'|'+h.inkId]=1;
   if(h.type==='잉입'){var t=parseDay(h.when),w=t===null?.5:(now-t<180*DAY?1:now-t<365*DAY?.6:.25);fills[h.inkId]=(fills[h.inkId]||0)+w}
   if(h.rating==='좋음'){var i=(db.inks||[]).find(function(x){return x.id===h.inkId});var f=i?inkColor(i):'';if(f){liked[h.penId]=liked[h.penId]||{};liked[h.penId][f]=1}}
  });
  (db.testReviews||[]).forEach(function(t){if(t&&t.penId&&t.inkId)tried[t.penId+'|'+t.inkId]=1});
  var inked={};
  (db.pens||[]).forEach(function(p){var st=penFillState(p);if(st==='empty')return;var i=null;try{i=penInk(p)}catch(_){}if(i){(inked[i.id]=inked[i.id]||[]).push({id:p.id,w:st==='filled'?1:.5})}});
  memo={fills:fills,liked:liked,tried:tried,inked:inked};memoAt=now;return memo;
 }
 function penColorFamily(pen){try{return getColor([pen.color,pen.bodyColor,pen.name].filter(Boolean).join(' '))}catch(_){return ''}}
 /* ① 편중 완화: 다른 펜에 잉입 중·최근 자주 쓴 잉크 감점, 펜 고유 요소 반영 */
 function applyDiversity(r,pen,ink){
  if(!r||!pen||!ink)return r;
  var S=stats(),adj=0,why=r.why||(r.why=[]),warn=r.warnings||(r.warnings=[]);
  var penDir=true;try{penDir=$('direction').value==='pen'}catch(_){}
  /* ① 다른 만년필에 지금 들어 있는 잉크 */
  var others=(S.inked[ink.id]||[]).filter(function(o){return o.id!==pen.id});
  var el=others.reduce(function(a,o){return a+o.w},0);
  if(penDir&&el>0){var d=Math.min(9,Math.round(el*5));adj-=d;warn.push('다른 만년필 '+others.length+'자루에 잉입 중 (−'+d+')')}
  /* ① 최근 자주 잉입한 잉크 (이 만년필에 지금 들어 있는 잉크는 제외) */
  var here=(S.inked[ink.id]||[]).some(function(o){return o.id===pen.id});
  var c=S.fills[ink.id]||0;
  if(penDir&&c>=1&&!here){var d2=Math.min(6,Math.round(c*1.5));if(d2>0){adj-=d2;warn.push('최근 자주 쓴 잉크 (−'+d2+')')}}
  if(!S.tried[pen.id+'|'+ink.id]){adj+=2;why.push('이 만년필에 아직 안 써 본 조합 (+2)')}
  /* ② 만년필 고유 요소 */
  var nib=nibClass(pen),ip=null;try{ip=inkProfile(ink,pen)}catch(_){}
  if(ip){
   var ev={};try{ev=researchFor(ink)||{}}catch(_){}
   var weak=/낮음|없음|미확인|약함|약간/;
   var sheenOn=/sheen/i.test(ink.effect||'')||(!!ev.sheen&&!weak.test(String(ev.sheen)));
   var shadeOn=/shading/i.test(ink.effect||'')||(!!ev.shading&&!weak.test(String(ev.shading)));
   if((sheenOn||shadeOn)&&(nib==='medium'||nib==='special')){adj+=3;why.push('굵은·특수 닙: 테·농담이 잘 드러남 (+3)')}
   else if(sheenOn&&nib==='ultrafine'){adj-=2;warn.push('극세 닙에서는 테가 잘 안 보임 (−2)')}
  }
  var ic='';try{ic=inkColor(ink)}catch(_){}
  var pc=penColorFamily(pen);
  if(pc&&ic&&pc===ic&&why.indexOf('색상 조화(보조 점수)')<0){adj+=2;why.push('만년필 몸통 색과 같은 계열 (+2)')}
  var lk=S.liked[pen.id];
  if(ic&&lk&&lk[ic]&&why.indexOf('실제 사용 평가: 좋음')<0){adj+=2;why.push('이 만년필에서 좋았던 색 계열 (+2)')}
  r.score=Math.min(95,Math.max(8,Math.round(r.score+adj)));
  r.diversityAdj=adj;
  return r;
 }
 /* ③ 상위 12개 안에서 같은 잉크 브랜드는 2개까지, 넘치는 후보는 그 뒤로 */
 function brandCap(ranked,isPen){
  if(!isPen||!Array.isArray(ranked)||ranked.length<4)return ranked;
  /* 같은 점수끼리는 근거 확실성 대신 만년필마다 다른 고정 순서로 (같은 잉크가 모든 펜에서 1위가 되지 않게) */
  var bottle=false;try{bottle=$('samplePolicy').value==='preferBottle'}catch(_){}
  if(!bottle&&typeof tieOrder==='function')ranked.sort(function(a,b){return b.score-a.score||tieOrder(a.item.id,a.pen.id)-tieOrder(b.item.id,b.pen.id)});
  var TOP=12,CAP=2,cnt={},top=[],tail=[];
  ranked.forEach(function(r){
   if(top.length>=TOP){tail.push(r);return}
   var b='';try{b=comparableBrand(r.ink,true)}catch(_){b=String(r.ink&&r.ink.brand||'')}
   cnt[b]=(cnt[b]||0)+1;
   if(cnt[b]<=CAP)top.push(r);else{r.brandCapped=true;tail.push(r)}
  });
  tail.sort(function(a,b){return b.score-a.score||b.certainty-a.certainty});
  var out=top.concat(tail);ranked.length=0;out.forEach(function(x){ranked.push(x)});
  return ranked;
 }


 /* ② 전용·동반 출시 잉크: 닙을 고려한 가산점 */
 function companions(pen){
  if(!pen)return [];
  var list=Array.isArray(pen.companionInks)?pen.companionInks.slice():[];
  return list.filter(function(id){return (db.inks||[]).some(function(i){return i.id===id})});
 }
 function nibFit(pen,ink,r){
  var nib=nibClass(pen),ip=null;try{ip=inkProfile(ink,pen)}catch(_){}
  var fine=nib==='ultrafine'||nib==='fine',notes=[],bonus=14;
  if(ip&&ip.shimmer&&fine){bonus=6;notes.push('펄 잉크라 '+(pen.nib||'가는')+' 닙은 피드 막힘 주의 · 자주 세척')}
  else if(ip&&ip.shimmer){bonus=10;notes.push('펄 잉크 · 세척 주기 짧게')}
  var w=(r.warnings||[]).join(' ');
  if(/가는 선 유지 주의/.test(w)){bonus-=3;notes.push('잉크가 촉촉해 '+(pen.nib||'가는')+' 닙에서 선이 굵어질 수 있음')}
  if(/흐름 부족/.test(w)){bonus-=3;notes.push('이 닙에서는 흐름이 부족할 수 있음')}
  if(ip&&ip.sheen&&nib==='ultrafine')notes.push('극세 닙이라 테는 잘 안 보일 수 있음');
  var level=bonus>=14&&!notes.length?'good':bonus>=10?'ok':'caution';
  return {bonus:bonus,notes:notes,level:level};
 }
 function applyCompanion(r,pen,ink){
  if(!r||!pen||!ink)return r;
  if(companions(pen).indexOf(ink.id)<0)return r;
  var f=nibFit(pen,ink,r);
  r.score=Math.min(95,Math.max(8,Math.round(r.score+f.bonus)));
  r.companion=true;r.companionFit=f;
  (r.why=r.why||[]).unshift('이 만년필과 함께 나온 전용 잉크 (+'+f.bonus+')');
  f.notes.forEach(function(n){(r.warnings=r.warnings||[]).push('전용 잉크 · '+n)});
  return r;
 }
 /* 최종 점수 = 기본 점수 → 편중 완화 → 전용 잉크 */
 window.calc=function(pen,ink,priority){return applyCompanion(applyDiversity(calcBase(pen,ink,priority),pen,ink),pen,ink)};
 window.penCompanionInks=companions;
 window.resetEngineCache=resetCache;
 /* 상위 12개 브랜드 상한. 전용 잉크는 상한에 세지 않고 점수 위치에 끼워 넣는다 */
 window.recBrandCap=function(ranked,isPen){
  if(!Array.isArray(ranked))return brandCap(ranked,isPen);
  var comp=ranked.filter(function(r){return r.companion});
  if(!comp.length)return brandCap(ranked,isPen);
  var rest=ranked.filter(function(r){return !r.companion});
  brandCap(rest,isPen);
  var out=rest.slice();
  comp.forEach(function(c){var i=out.findIndex(function(r){return r.score<c.score});out.splice(i<0?out.length:i,0,c)});
  ranked.length=0;out.forEach(function(x){ranked.push(x)});return ranked;
 };
 /* 추천 결과 맨 위 "함께 나온 잉크" 안내 — recommendations() 끝에서 호출 */
 window.renderCompanionBox=function(){
  var $$=function(id){return document.getElementById(id)};
  try{
   var isPen=$$('direction').value==='pen',id=$$('target').value,box=$$('recResults');
   var pen=isPen?(db.pens||[]).find(function(p){return p.id===id}):null,list=pen?companions(pen):[];
   if(box&&list.length&&Array.isArray(latestRecommendationRows)){
    var rows=latestRecommendationRows,h='<div class="comp-box"><h4>✒ 이 만년필과 함께 나온 잉크</h4>';
    list.forEach(function(iid){
     var k=rows.findIndex(function(r){return r.ink&&r.ink.id===iid}),r=rows[k],ink=(db.inks||[]).find(function(i){return i.id===iid});if(!ink)return;
     var f=r&&r.companionFit||{level:'ok',notes:[]},lab={good:'닙과 잘 맞음',ok:'대체로 무난',caution:'닙 주의'}[f.level];
     var col='';try{col=inkHex(ink)}catch(_){}
     h+='<div class="comp-row"><span class="comp-dot" style="--c-ink:'+esc(col||'#ccc')+'"></span><div><b>'+esc(ink.brand+' '+ink.name)+'</b><span class="comp-tag '+f.level+'">'+lab+'</span>'+
      '<div class="sub">전체 '+(k+1)+'위 / '+rows.length+' · 적합도 '+(r?r.score:'-')+'점 · '+esc(pen.nib||'닙 미확인')+(f.notes.length?' · '+esc(f.notes.join(' · ')):'')+'</div></div></div>';
    });
    box.insertAdjacentHTML('afterbegin',h+'</div>');
   }
  }catch(e){console.warn('companion box',e)}
 };
})();
