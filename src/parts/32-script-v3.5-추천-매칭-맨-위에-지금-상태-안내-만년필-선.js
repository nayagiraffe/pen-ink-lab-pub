
/* 추천 매칭 맨 위에 "지금 상태" 안내: 만년필 선택 → 지금 든 잉크, 잉크 선택 → 이 잉크가 든 만년필 (+ 추천 순위·점수) */
(function(){
 'use strict';
 var $$=function(id){return document.getElementById(id)};
 function rankOf(rows,pred){var k=rows.findIndex(pred);return k<0?null:{rank:k+1,r:rows[k],total:rows.length}}
 function rankText(x){if(!x)return '';var w=(x.r.warnings||[]).filter(function(s){return !/미확인|실측값 없음|미측정/.test(s)})[0];return '추천 '+x.rank+'위 / '+x.total+' · 적합도 '+x.r.score+'점'+(w?' · '+w:'')}
 function dot(ink){var c='';try{c=inkHex(ink)}catch(_){}return '<span class="now-dot" style="--c-ink:'+esc(c||'#ccc')+'"></span>'}
 window.renderNowBox=function(){
  try{
   var box=$$('recResults'),isPen=$$('direction').value==='pen',id=$$('target').value,rows=Array.isArray(latestRecommendationRows)?latestRecommendationRows:[];
   if(!box||!id||!rows.length)return;
   var h='';
   if(isPen){
    var pen=(db.pens||[]).find(function(p){return p.id===id});if(!pen)return;
    var st='';try{st=penFillState(pen)}catch(_){}
    var ink=null;try{ink=penInk(pen)}catch(_){}
    h='<div class="now-box"><h4>🖋 지금 이 만년필에 든 잉크</h4>';
    if(st==='empty'||(!ink&&!(pen.inkName&&pen.inkName!=='—'))){h+='<div class="now-empty">비어 있어요. 아래 추천에서 골라 보세요.</div>'}
    else if(!ink){h+='<div class="now-row"><span class="now-dot" style="--c-ink:#ccc"></span><div><b>'+esc((pen.inkBrand||'')+' '+(pen.inkName||''))+'</b>'+(st==='filled'?'':'<span class="now-q">확인 필요</span>')+'<div class="sub">잉크 목록에서 찾지 못해 점수를 계산하지 못했어요'+(pen.fillDate?' · '+esc(pen.fillDate)+' 잉입':'')+'</div></div></div>'}
    else{var x=rankOf(rows,function(r){return r.ink&&r.ink.id===ink.id});
     h+='<div class="now-row">'+dot(ink)+'<div><b>'+esc(ink.brand+' '+ink.name)+'</b>'+(st==='filled'?'':'<span class="now-q">확인 필요</span>')+'<div class="sub">'+esc([pen.fillDate?pen.fillDate+' 잉입':'',rankText(x)].filter(Boolean).join(' · '))+'</div></div></div>'}
    h+='</div>';
   }else{
    var ink2=(db.inks||[]).find(function(i){return i.id===id});if(!ink2)return;
    var list=[];try{list=(inkPenMap().get(ink2.id)||[]).slice()}catch(_){}
    list.sort(function(a,b){return (a.st==='filled'?0:1)-(b.st==='filled'?0:1)});
    h='<div class="now-box"><h4>🖋 지금 이 잉크가 든 만년필 '+(list.length?list.length+'자루':'')+'</h4>';
    if(!list.length)h+='<div class="now-empty">지금 이 잉크가 든 만년필은 없어요. 아래 추천에서 골라 보세요.</div>';
    list.slice(0,6).forEach(function(o){var x=rankOf(rows,function(r){return r.pen&&r.pen.id===o.p.id});
     h+='<div class="now-row">'+dot(ink2)+'<div><b>'+esc(o.p.brand+' '+o.p.name)+'</b> <span class="sub">'+esc(o.p.nib||'')+'</span>'+(o.st==='filled'?'':'<span class="now-q">확인 필요</span>')+'<div class="sub">'+esc([o.p.fillDate?o.p.fillDate+' 잉입':'',rankText(x)].filter(Boolean).join(' · '))+'</div></div></div>'});
    if(list.length>6)h+='<div class="now-empty">외 '+(list.length-6)+'자루</div>';
    h+='</div>';
   }
   box.insertAdjacentHTML('afterbegin',h);
  }catch(e){console.warn('now box',e)}
 };
})();
