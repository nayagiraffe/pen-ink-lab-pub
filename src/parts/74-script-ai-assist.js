
/* 시필 사진 읽기 (AI 앱 사용): 지침 복사 → 내가 쓰는 AI 앱에서 사진과 함께 전송 → 답변 붙여넣기 → 비어 있는 칸에 초안 채우기.
   서버·API 키 없음. 사진은 이 앱을 거치지 않고, 이미 입력한 칸은 바꾸지 않는다. */
(function(){
 'use strict';
 var $$=function(id){return document.getElementById(id)};
 var memo=$$('tMemo'),box=document.querySelector('#testing .tx-box');
 if(!memo||!box)return;

 var FEATHER={'없음':'0','약간':'1','많음':'2'},WIDTH={'매우 가늘다':'1','가늘다':'2','보통':'3','굵다':'4','매우 굵다':'5'};
 var KEYS=['sheen','shading','feather','width','color','observations'];

 function sel(id){var s=$$(id);return s&&s.selectedOptions[0]&&s.value?s.selectedOptions[0].text:''}
 function ctx(){
  var pen=db.pens.find(function(p){return p.id===$$('tPen').value}),ink=db.inks.find(function(i){return i.id===$$('tInk').value});
  return {pen:pen?pen.brand+' '+pen.name:'',nib:($$('tNib')&&$$('tNib').value.trim())||(pen&&pen.nib)||'',ink:ink?ink.brand+' '+ink.name:'',hue:ink?(ink.hue||ink.family||''):'',paper:($$('tPaper')&&$$('tPaper').value.trim())||''};
 }
 function instructions(){
  var c=ctx();
  return [
   '너는 만년필 잉크 시필 사진을 보고, 사진에서 실제로 보이는 것만 기록하는 조수야.',
   '첨부한 사진 한 장을 보고 아래 JSON 한 개만 ```json 코드블록으로 답해. 설명 문장은 붙이지 마.',
   '',
   '규칙',
   '- 조명·화이트밸런스 때문에 색과 테는 틀릴 수 있으니 확신이 없으면 "판단불가"로 답해.',
   '- 잉크 흐름, 필기 부드러움, 건조 시간은 사진으로 알 수 없으므로 절대 추정하지 마.',
   '- 보이지 않는 값은 지어내지 말고 "판단불가"(문장 항목은 빈 문자열)로 둬.',
   '',
   '{"sheen":"없음|약간|뚜렷|판단불가","sheenColor":"예: 붉은빛, 그린 / 없으면 빈 문자열",',
   ' "shading":"약함|중간|강함|판단불가","feather":"없음|약간|많음|판단불가",',
   ' "bleed":"없음|있음|판단불가","width":"매우 가늘다|가늘다|보통|굵다|매우 굵다|판단불가",',
   ' "shimmer":"없음|있음|판단불가","color":"보이는 색 한 줄(한국어)",',
   ' "observations":"사진에서 본 것 2~3문장(한국어)","confidence":"낮음|중간|높음",',
   ' "caution":"판독을 어렵게 한 점(조명, 흐림 등) 한 줄 / 없으면 빈 문자열"}',
   '',
   '시필 정보 — 만년필: '+(c.pen||'미입력')+' / 닙: '+(c.nib||'미입력')+' / 잉크: '+(c.ink||'미입력')+' / 앱에 기록된 색조: '+(c.hue||'미입력')+' / 종이: '+(c.paper||'미입력')
  ].join('\n');
 }
 PIL.testInstructions=instructions;

 function parse(text){
  var m=String(text||'').match(/```(?:json)?\s*([\s\S]*?)```/i),raw=m?m[1]:String(text||''),a=raw.indexOf('{'),b=raw.lastIndexOf('}');
  if(a<0||b<a)throw Error('JSON을 찾지 못했어요. AI의 답변 전체를 붙여넣어 주세요.');
  var o;try{o=JSON.parse(raw.slice(a,b+1))}catch(e){throw Error('JSON 형식이 올바르지 않아요. AI에게 "JSON만 다시 보여줘"라고 해 보세요.')}
  if(!o||typeof o!=='object'||!KEYS.some(function(k){return o[k]!==undefined}))throw Error('시필 판독 답변 형식이 아니에요. 복사한 지침과 사진을 함께 보냈는지 확인해 주세요.');
  return o;
 }
 PIL.parseTestAnswer=parse;

 /* 비어 있는 칸에만 넣는다. 선택 칸은 선택지에 있는 값일 때만. */
 function setIfEmpty(id,val){
  var el=$$(id);if(!el||val===undefined||val===null||val==='')return false;
  if(el.value!=='')return false;
  if(el.tagName==='SELECT'&&![].some.call(el.options,function(o){return o.value===String(val)}))return false;
  el.value=String(val);el.dispatchEvent(new Event('change',{bubbles:true}));return true;
 }
 function apply(a){
  var filled=[],ok=function(v){return v&&v!=='판단불가'};
  if(ok(a.sheen)&&setIfEmpty('tSheen',a.sheen))filled.push('테 '+a.sheen+(a.sheenColor?'('+a.sheenColor+')':''));
  if(ok(a.shading)&&setIfEmpty('tShade',a.shading))filled.push('농담 '+a.shading);
  if(FEATHER[a.feather]!==undefined&&setIfEmpty('tFeather',FEATHER[a.feather]))filled.push('번짐 '+a.feather);
  if(WIDTH[a.width]&&setIfEmpty('tWidth',WIDTH[a.width]))filled.push('선 굵기 '+a.width);
  var note='[AI 초안·신뢰도 '+(a.confidence||'?')+'] '+[a.color,a.observations].filter(Boolean).join(' · ');
  var hasNote=!!(a.color||a.observations);
  if(hasNote&&memo.value.indexOf('[AI 초안')<0)memo.value=(memo.value?memo.value+'\n':'')+note;
  return {filled:filled,shimmer:a.shimmer==='있음',caution:a.caution||''};
 }
 PIL.applyTestAnswer=function(text){return apply(parse(text))};

 /* ── 카드 ── */
 var card=document.createElement('details');card.className='card ai-card';card.id='aiCard_test';
 card.innerHTML='<summary><b>📷 시필 사진으로 초안 채우기</b><span class="ai-sub">쓰는 AI 앱이 사진에서 테·농담·번짐·선 굵기를 읽어 줘요</span></summary>'+
  '<ol class="ai-steps"><li>위에서 <b>만년필·잉크·종이</b>를 먼저 고른 뒤, <b>지침을 복사</b>해요. (고른 정보가 지침에 들어가요)<div><button type="button" class="btn secondary" data-ai="copy">지침 복사</button></div></li>'+
  '<li>평소 쓰는 <b>AI 앱</b>(ChatGPT·Claude·Gemini 등)을 열고, 새 대화에 <b>시필 사진을 첨부</b>한 뒤 복사한 지침을 붙여 넣어 보내요.</li>'+
  '<li>AI의 답변을 복사해서 여기에 붙여 넣어요.<textarea class="input" data-ai="answer" rows="4" placeholder="AI의 답변을 붙여넣기"></textarea>'+
  '<div class="ai-row"><button type="button" class="btn" data-ai="fill">초안 채우기</button><button type="button" class="btn secondary" data-ai="paste">클립보드에서 붙여넣기</button></div></li></ol>'+
  '<p class="ai-note">🔒 사진은 이 앱이 아니라 <b>내가 고른 AI 앱으로만</b> 전송돼요. 이 앱은 사진을 보거나 저장하지 않아요. <b>이미 입력한 칸은 바꾸지 않고</b>, 비어 있는 칸에 초안만 채워요. 조명에 따라 틀릴 수 있으니 확인한 뒤 저장하세요. 흐름·부드러움·건조 시간은 사진으로 알 수 없어서 직접 입력해 주세요.</p>'+
  '<textarea class="input" data-ai="fallback" rows="6" readonly hidden></textarea><p class="ai-msg" data-ai="msg" role="status"></p>';
 box.parentNode.insertBefore(card,box.nextSibling);

 function msg(t,k){var m=card.querySelector('[data-ai=msg]');m.textContent=t;m.setAttribute('data-k',k||'')}
 function copyText(text,ta){
  function fb(){ta.hidden=false;ta.value=text;ta.focus();ta.select();return false}
  if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text).then(function(){return true},fb);
  return Promise.resolve(fb());
 }
 function run(text){
  try{
   var r=apply(parse(text));
   msg((r.filled.length?'채운 칸: '+r.filled.join(', '):'비어 있는 칸 중 사진으로 판단할 수 있는 항목이 없었어요.')+
    (r.shimmer?'\n펄이 보인다고 판독했어요. 잉크 정보와 맞는지 확인해 주세요.':'')+(r.caution?'\n참고: '+r.caution:'')+'\n초안이니 직접 확인한 뒤 "시필 평가 저장"을 눌러 주세요.','ok');
  }catch(e){msg(e.message,'bad')}
 }
 var ta=card.querySelector('[data-ai=answer]');
 card.addEventListener('click',function(e){
  var b=e.target.closest('[data-ai]');if(!b||b.tagName!=='BUTTON')return;
  var act=b.getAttribute('data-ai');
  if(act==='copy')copyText(instructions(),card.querySelector('[data-ai=fallback]')).then(function(ok){msg(ok?'지침을 복사했어요. 쓰는 AI 앱에 시필 사진과 함께 붙여 넣으세요.':'자동 복사가 막혀서 아래 상자에 지침을 띄웠어요. 전체 선택 후 복사하세요.',ok?'ok':'warn')});
  else if(act==='fill')run(ta.value);
  else if(act==='paste'){
   if(!navigator.clipboard||!navigator.clipboard.readText){msg('이 브라우저는 클립보드 읽기를 지원하지 않아요. 상자에 직접 붙여 넣어 주세요.','warn');return}
   navigator.clipboard.readText().then(function(t){ta.value=t;run(t)},function(){msg('클립보드를 읽을 수 없어요. 상자를 길게 눌러 붙여 넣기 해 주세요.','warn')});
  }
 });
 ta.addEventListener('paste',function(){setTimeout(function(){if(ta.value.indexOf('{')>=0)run(ta.value)},0)});
})();
