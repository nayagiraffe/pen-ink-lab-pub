
/* "AI에게 물어보기": 지금 든 잉크(또는 이 잉크가 든 만년필)를 질문에 함께 넣어 추천 후보와 비교하게 함 */
(function(){
 'use strict';
 var btn=document.getElementById('aiAsk');if(!btn)return;
 function copyText(text,ta){
  function fb(){ta.hidden=false;ta.value=text;ta.focus();ta.select();return false}
  if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text).then(function(){return true},fb);
  return Promise.resolve(fb());
 }
 function sel(id){var s=document.getElementById(id);return s&&s.selectedOptions[0]?s.selectedOptions[0].text:''}
 function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
 function inkInfo(ink,pen){
  var v=null;try{v=researchFor(ink)}catch(_){}
  var bits=[ink.brand+' '+ink.name];
  var col=[ink.family,ink.hue].filter(Boolean).join(' / ');if(col)bits.push('색 '+col);
  var fx=ink.effect&&ink.effect!=='미확인'?ink.effect:'';if(fx)bits.push('효과 '+fx);
  var fl=(v&&v.flow)||ink.flow;if(fl&&fl!=='미확인')bits.push('흐름 '+fl);
  if(v&&v.sheen&&v.sheen!=='미확인')bits.push('테 '+v.sheen);
  if(v&&v.shading&&v.shading!=='미확인')bits.push('농담 '+v.shading);
  if(v&&v.drySeconds!=null)bits.push('건조 '+v.drySeconds+'초');
  return bits.join(' · ');
 }
 function rowInfo(rows,pred){
  var k=rows.findIndex(pred);if(k<0)return '';var r=rows[k];
  var w=(r.warnings||[]).filter(function(s){return !/미확인|실측값 없음|미측정/.test(s)}).slice(0,2);
  return '앱 점수 '+r.score+'점 (전체 '+(k+1)+'위 / '+rows.length+')'+(w.length?' · 주의: '+w.join(', '):'');
 }
 function brief(c){
  var top=c.querySelector('.recTop'),tags=[].map.call(c.querySelectorAll('.rec-tagline'),function(e){return clean(e.innerText)});
  [].forEach.call(c.querySelectorAll('.rec-pens > div'),function(d){var l=d.querySelector('.lbl'),lt=l?clean(l.innerText):'';var rest=clean(d.innerText).slice(lt.length).trim();var chips=[].map.call(d.querySelectorAll('.pchip'),function(x){return clean(x.innerText)});tags.push(lt+': '+(chips.length?chips.join(', '):rest))});
  return ('- '+(top?clean(top.innerText).replace('예상점수 /100',' (예상점수)'):'')+' | '+tags.join(' | ')).slice(0,460);
 }
 btn.addEventListener('click',function(){
  var m=document.getElementById('aiAskMsg'),ta=document.getElementById('aiAskFallback');
  var cards=[].slice.call(document.querySelectorAll('#recResults .rec-candidate')).slice(0,8);
  if(!cards.length){m.textContent='먼저 추천을 실행해 주세요.';m.setAttribute('data-k','warn');return}
  var isPen=document.getElementById('direction').value==='pen',id=document.getElementById('target').value;
  var rows=Array.isArray(latestRecommendationRows)?latestRecommendationRows:[];
  var head=['만년필과 잉크 매칭 조언을 부탁해. 아래는 내 앱이 규칙으로 계산한 정보야. 점수는 참고만 하고, 실제 사용 경험에 비추어 판단해 줘.','',
   '추천 방향: '+sel('direction'),'기준: '+sel('target'),'중요한 기준: '+sel('priority'),'기준 색상: '+sel('colorHint'),''];
  var now=[],asks=[];
  if(isPen){
   var pen=db.pens.find(function(p){return p.id===id});
   var st='',cur=null;try{st=penFillState(pen)}catch(_){}try{cur=penInk(pen)}catch(_){}
   now.push('[지금 이 만년필에 든 잉크]');
   if(!pen||st==='empty'||(!cur&&!(pen.inkName&&pen.inkName!=='—')))now.push('- 비어 있음');
   else if(!cur)now.push('- '+pen.inkBrand+' '+pen.inkName+(st==='filled'?'':' (확인 필요)')+(pen.fillDate?' · '+pen.fillDate+' 잉입':'')+' · 앱 잉크 목록에 없어 점수 없음');
   else now.push('- '+inkInfo(cur,pen)+(st==='filled'?'':' (확인 필요)')+(pen.fillDate?' · '+pen.fillDate+' 잉입':'')+' · '+rowInfo(rows,function(r){return r.ink&&r.ink.id===cur.id}));
   if(pen)now.push('- 만년필: '+pen.brand+' '+pen.name+' · 닙 '+(pen.nib||'미확인'));
   try{var comp=typeof penCompanionInks==='function'?penCompanionInks(pen):[];if(comp.length)now.push('- 이 만년필과 함께 나온 전용 잉크: '+comp.map(function(cid){var i=db.inks.find(function(x){return x.id===cid});return i?i.brand+' '+i.name+' · '+rowInfo(rows,function(r){return r.ink&&r.ink.id===cid}):''}).filter(Boolean).join(' / '))}catch(_){}
   asks=['1. 지금 든 잉크와 아래 후보 상위 3개를 비교해서, 지금 잉크를 계속 쓰는 게 나은지 바꾸는 게 나은지 먼저 한 줄로 결론을 알려 줘.',
    '2. 바꾼다면 어떤 후보로, 왜 그런지 두세 줄로 설명해 줘. 지금 잉크와 색·흐름이 어떻게 다른지도 짚어 줘.',
    '3. 후보끼리, 또는 지금 잉크와 색이 겹치는 후보가 있으면 알려 줘.',
    '4. 이 닙에서 주의할 점(번짐, 건조 시간, 펄·세척)이 있으면 한 줄로.',
    '5. 한국어로 짧게 답해 줘.'];
  }else{
   var ink=db.inks.find(function(i){return i.id===id});
   var list=[];try{list=(inkPenMap().get(id)||[]).slice()}catch(_){}
   now.push('[기준 잉크] '+(ink?inkInfo(ink):''));
   now.push('[지금 이 잉크가 든 만년필]');
   if(!list.length)now.push('- 없음');
   list.forEach(function(o){now.push('- '+o.p.brand+' '+o.p.name+' · 닙 '+(o.p.nib||'미확인')+(o.st==='filled'?'':' (확인 필요)')+(o.p.fillDate?' · '+o.p.fillDate+' 잉입':'')+' · '+rowInfo(rows,function(r){return r.pen&&r.pen.id===o.p.id}))});
   asks=['1. 지금 이 잉크가 든 만년필과 아래 후보 상위 3개를 비교해서, 이 잉크에 가장 잘 맞는 만년필을 한 줄로 먼저 알려 줘.',
    '2. 지금 넣어 둔 만년필이 잘 맞는지, 다른 만년필로 옮기는 게 나은지 두세 줄로 설명해 줘.',
    '3. 닙 굵기·흐름 때문에 주의할 조합이 있으면 한 줄로.',
    '4. 한국어로 짧게 답해 줘.'];
  }
  var others=db.pens.filter(function(p){return p.fillVerified&&p.inkName&&p.inkName!=='—'&&!(isPen&&p.id===id)}).map(function(p){return p.brand+' '+p.name+' ← '+p.inkBrand+' '+p.inkName}).slice(0,12);
  var q=head.concat(now,['','[추천 후보 (점수순)]'],cards.map(brief),['','[다른 만년필 잉입 현황 (겹침 참고)]',others.length?others.join(' / '):'없음','','[요청]'],asks).join('\n');
  copyText(q,ta).then(function(ok){m.textContent=ok?'질문을 복사했어요. 지금 든 잉크도 함께 넣었어요. 쓰는 AI 앱(ChatGPT·Claude 등)에 붙여 넣으세요.':'자동 복사가 막혀서 아래 상자에 질문을 띄웠어요. 전체 선택 후 복사하세요.';m.setAttribute('data-k',ok?'ok':'warn')});
 });
})();
