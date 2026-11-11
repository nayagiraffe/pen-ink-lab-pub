
/* AI assist (no server, no API key): photo -> the user's own AI app -> paste answer -> prefill the existing registration form.
   Nothing is saved until the user presses the original 등록 button. */
(function(){
 'use strict';
 var FAMILIES=[],EFFECTS=[];
 function opts(id){var s=document.getElementById(id);return s?[].map.call(s.options,function(o){return o.value||o.text}):[]}
 function esc2(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function uniq(a){var seen={};return a.filter(function(x){x=String(x||'').trim();if(!x||seen[x])return false;seen[x]=1;return true})}
 function copyText(text,fallbackTa){
  function fallback(){fallbackTa.hidden=false;fallbackTa.value=text;fallbackTa.focus();fallbackTa.select();return false}
  if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text).then(function(){return true},fallback);
  return Promise.resolve(fallback());
 }
 function instructions(){
  FAMILIES=opts('iFamily');EFFECTS=opts('iEffect');
  var penBrands=uniq(db.pens.map(function(p){return p.brand})).join(', ');
  var inkBrands=uniq(db.inks.map(function(i){return window.engBrand?engBrand(i.brand):i.brand})).join(', ');
  var hues=uniq(db.inks.map(function(i){return i.hue})).join(' / ');
  var flows=uniq(db.inks.map(function(i){return i.flow})).slice(0,12).join(' / ');
  return [
   '너는 만년필·잉크 제품 사진 판독 도우미야. 내가 보내는 사진 한 장에 찍힌 제품 하나를 식별해서, 아래 JSON 한 개만 ```json 코드블록으로 답해. 설명 문장은 코드블록 밖에 쓰지 마.',
   '',
   '규칙',
   '- 근거는 사진에 보이는 글자(라벨, 박스, 닙 각인)와 외관뿐이야. 보이지 않거나 확실하지 않은 값은 빈 문자열 ""로 두고(숫자는 null) 절대 추측으로 채우지 마.',
   '- brand는 영어(로마자) 표기로 써. 아래 "기존 브랜드" 목록에 같은 브랜드가 있으면 그 표기를 그대로 써.',
   '- name: 만년필은 모델명 + 색/에디션(닙 소재가 보이면 14k/18k 등도), 잉크는 병에 적힌 잉크 이름 그대로.',
   '- confidence는 high / medium / low 중 하나, note에는 근거와 불확실한 점을 한 문장으로 적어.',
   '- 사진에 제품이 여러 개면 가장 가운데 하나만 고르고 note에 그렇게 적어.',
   '',
   '만년필일 때',
   '{"type":"pen","brand":"","name":"","nib":"","confidence":"","note":""}',
   '- nib: '+opts('pNib').filter(function(x){return x!=='기타'}).join(', ')+' 중 하나. 안 보이면 "".',
   '',
   '잉크일 때',
   '{"type":"ink","brand":"","name":"","family":"","hue":"","value":"","saturation":"","effect":"","flow":"","package":"","capacityMl":null,"confidence":"","note":""}',
   '- family는 이 중 하나: '+FAMILIES.join(' | '),
   '- effect는 이 중 하나: '+EFFECTS.join(' | '),
   '- value(명도), saturation(채도): 낮음 | 중간 | 높음 | 미확인. 병 속 잉크 색으로 판단하되 모르면 미확인.',
   '- hue: 가능하면 이 목록에서 고르고, 없으면 짧은 한국어 색 이름: '+hues,
   '- flow: 라벨에 없으면 "미확인". 쓴다면 이 표기를 따라: '+flows,
   '- package: bottle(본병) | sample(소분) | cartridge(카트리지) | unknown. capacityMl는 병에 적힌 ml 숫자.',
   '',
   '기존 브랜드(만년필): '+penBrands,
   '기존 브랜드(잉크): '+inkBrands
  ].join('\n');
 }
 function parseAnswer(text){
  var m=String(text||'').match(/```(?:json)?\s*([\s\S]*?)```/i),raw=m?m[1]:text,a=raw.indexOf('{'),b=raw.lastIndexOf('}');
  if(a<0||b<a)throw Error('JSON을 찾지 못했어요. AI의 답변 전체를 붙여넣어 주세요.');
  var o;try{o=JSON.parse(raw.slice(a,b+1))}catch(e){throw Error('JSON 형식이 올바르지 않아요. AI에게 "JSON만 다시 보여줘"라고 해 보세요.')}
  if(o.type!=='pen'&&o.type!=='ink')throw Error('type이 pen 또는 ink가 아니에요.');
  if(!String(o.brand||'').trim()||!String(o.name||'').trim())throw Error('브랜드나 이름을 읽지 못했어요. 더 선명한 사진으로 다시 시도해 보세요.');
  return o;
 }
 function pickOption(selectId,v,loose){
  var s=document.getElementById(selectId);if(!s||!v)return false;
  var n=norm(v),hit=[].find.call(s.options,function(o){var t=norm(o.value||o.text);return t===n})||
   (loose&&[].find.call(s.options,function(o){var t=norm(o.value||o.text);return t&&(t.indexOf(n)>=0||n.indexOf(t)>=0)}));
  if(hit){s.value=hit.value||hit.text;return true}return false;
 }
 var pending=null;
 function openForm(sectionId,focusId){
  openTab(sectionId);
  var f=document.getElementById(focusId),d=f&&f.closest('details');if(d)d.open=true;
  if(f)setTimeout(function(){f.scrollIntoView({behavior:'smooth',block:'center'})},60);
 }
 function fill(o){
  var today=new Date().toISOString().slice(0,10),conf=o.confidence?'AI 판독 '+o.confidence:'AI 판독',memo='사진 등록 '+today+' · '+conf+(o.note?' · '+o.note:'');
  var dupe;
  if(o.type==='pen'){
   dupe=db.pens.some(function(x){return norm(x.brand)===norm(o.brand)&&norm(x.name)===norm(o.name)});
   $('pBrand').value=o.brand;$('pName').value=o.name;
   var nibNote='';
   if(!pickOption('pNib',String(o.nib||'').toUpperCase())){if(o.nib){$('pNib').value='기타';nibNote='닙: '+o.nib+' · '}}
   $('pNotes').value=nibNote+memo;
   pending=null;openForm('pens','addPen');
  }else{
   var br=window.engBrand?engBrand(o.brand):o.brand;
   dupe=db.inks.some(function(x){return norm(x.brand)===norm(br)&&norm(x.name)===norm(o.name)});
   $('iBrand').value=br;$('iName').value=o.name;
   pickOption('iFamily',o.family,true);pickOption('iEffect',o.effect);
   $('iFlow').value=o.flow&&o.flow!=='미확인'?o.flow:'';
   if(o.package==='bottle'||o.package==='sample'||o.package==='cartridge'||o.package==='unknown')$('iPackage').value=o.package;
   $('iCapacity').value=typeof o.capacityMl==='number'&&o.capacityMl>0?o.capacityMl:'';
   $('iRemaining').value='';
   pending={brand:br,name:o.name,hue:o.hue||'',value:o.value||'',saturation:o.saturation||'',memo:memo};
   openForm('inks','addInk');
  }
  return dupe;
 }
 // After the original 등록 click succeeds, attach the extra fields the form does not have.
 var addInk=document.getElementById('addInk');
 if(addInk&&addInk.onclick){
  var orig=addInk.onclick;
  addInk.onclick=function(ev){
   var before=db.inks.length,r=orig.call(this,ev),p=pending;
   if(p&&db.inks.length>before){
    var ink=db.inks[db.inks.length-1];
    if(norm(ink.brand)===norm(p.brand)&&norm(ink.name)===norm(p.name)){
     if(p.hue)ink.hue=p.hue;
     if(/^(낮음|중간|높음)$/.test(p.value))ink.value=p.value;
     if(/^(낮음|중간|높음)$/.test(p.saturation))ink.saturation=p.saturation;
     ink.notes=p.memo;save();refresh();
    }
    pending=null;
   }
   return r;
  };
 }
 function card(kind){
  var d=document.createElement('details');d.className='card ai-card';d.id='aiCard_'+kind;
  d.innerHTML='<summary><b>📷 사진으로 '+(kind==='pen'?'만년필':'잉크')+' 등록</b><span class="ai-sub">쓰는 AI 앱이 사진을 읽어 폼을 채워 줘요</span></summary>'+
   '<ol class="ai-steps"><li>아래 버튼으로 <b>지침을 복사</b>해요.<div><button type="button" class="btn secondary" data-ai="copy">지침 복사</button></div><small class="ai-tip">자주 쓰면 AI 앱의 "사용자 지정 지침·프로젝트"에 저장해 두세요. 그러면 다음부터는 사진만 보내면 돼요. 새 브랜드가 많이 늘면 다시 복사해 갱신하세요.</small></li>'+
   '<li>평소 쓰는 <b>AI 앱</b>(ChatGPT·Claude·Gemini 등)을 열고, 새 대화에 <b>제품 사진을 첨부</b>한 뒤 복사한 지침을 붙여 넣어 보내요.</li>'+
   '<li>AI의 답변을 복사해서 여기에 붙여 넣어요.<textarea class="input" data-ai="answer" rows="4" placeholder="AI의 답변을 붙여넣기"></textarea>'+
   '<div class="ai-row"><button type="button" class="btn" data-ai="fill">등록 폼 채우기</button><button type="button" class="btn secondary" data-ai="paste">클립보드에서 붙여넣기</button></div></li></ol>'+
   '<p class="ai-note">🔒 사진은 이 앱이 아니라 <b>내가 고른 AI 앱으로만</b> 전송돼요. 이 앱은 사진을 보거나 저장하지 않아요. AI는 틀릴 수 있으니, 폼에 채워진 내용을 확인한 뒤 "등록"을 눌러 주세요.</p>'+
   '<textarea class="input" data-ai="fallback" rows="6" readonly hidden></textarea><p class="ai-msg" data-ai="msg" role="status"></p>';
  return d;
 }
 function msg(root,t,kind){var m=root.querySelector('[data-ai=msg]');m.textContent=t;m.setAttribute('data-k',kind||'')}
 function run(root,text){
  try{
   var o=parseAnswer(text),dupe=fill(o);
   msg(root,(o.type==='pen'?'만년필':'잉크')+' 정보를 폼에 채웠어요. 내용을 확인하고 "등록"을 눌러 주세요.'+(dupe?' (이미 등록된 제품과 같은 이름이에요. 등록 시 중복 안내가 나올 수 있어요.)':'')+(o.confidence==='low'?' 확신이 낮다고 해요. 꼭 확인하세요.':''),dupe||o.confidence==='low'?'warn':'ok');
  }catch(e){msg(root,e.message,'bad')}
 }
 [['pens','pen'],['inks','ink']].forEach(function(p){
  var sec=document.getElementById(p[0]);if(!sec)return;
  var c=card(p[1]);sec.insertBefore(c,sec.firstChild);
  c.addEventListener('click',function(e){
   var b=e.target.closest('[data-ai]');if(!b||b.tagName!=='BUTTON')return;
   var act=b.getAttribute('data-ai'),ta=c.querySelector('[data-ai=answer]');
   if(act==='copy')copyText(instructions(),c.querySelector('[data-ai=fallback]')).then(function(ok){msg(c,ok?'지침을 복사했어요. 쓰는 AI 앱에 사진과 함께 붙여 넣으세요.':'자동 복사가 막혀서 아래 상자에 지침을 띄웠어요. 전체 선택 후 복사하세요.',ok?'ok':'warn')});
   else if(act==='fill')run(c,ta.value);
   else if(act==='paste'){
    if(!navigator.clipboard||!navigator.clipboard.readText){msg(c,'이 브라우저는 클립보드 읽기를 지원하지 않아요. 상자에 직접 붙여 넣어 주세요.','warn');return}
    navigator.clipboard.readText().then(function(t){ta.value=t;run(c,t)},function(){msg(c,'클립보드를 읽을 수 없어요. 상자를 길게 눌러 붙여 넣기 해 주세요.','warn')});
   }
  });
  c.querySelector('[data-ai=answer]').addEventListener('paste',function(){var ta=this;setTimeout(function(){if(ta.value.indexOf('{')>=0)run(c,ta.value)},0)});
 });

 /* Matching: build a question for an AI assistant from the current recommendation results. */
 var rec=document.getElementById('recommend');
 if(rec&&rec.parentNode){
  var wrap=document.createElement('div');wrap.className='ai-ask';
  wrap.innerHTML='<button type="button" class="btn secondary" id="aiAsk">🤖 AI에게 물어보기</button><span class="ai-sub">추천 결과로 질문을 만들어 복사해요. 쓰는 AI 앱(ChatGPT·Claude 등)에 붙여 넣으세요.</span><textarea class="input" id="aiAskFallback" rows="6" readonly hidden></textarea><p class="ai-msg" id="aiAskMsg" role="status"></p>';
  rec.parentNode.insertBefore(wrap,rec.nextSibling);
 }
})();

/* v2.1 brand spelling: Korean ink brands -> English. Display/registration only; ids, history and research data are untouched. */
(function(){
 'use strict';
 var MAP={'고베 잉크':'Kobe INK','그라폰':'Graf von Faber-Castell','그라폰 파버카스텔':'Graf von Faber-Castell','다이아민':'Diamine','레오나르도':'Leonardo','로버트오스터':'Robert Oster','몽블랑':'Montblanc','벙구박스':'BUNGUBOX','세일러':'Sailor','아우로라':'Aurora','에스터브룩':'Esterbrook','에스터브룩 & 벙구박스':'Esterbrook x BUNGUBOX','워터맨':'Waterman','이로시주쿠':'Pilot Iroshizuku','제이허빈':'J. Herbin','카베코':'Kaweco','테라니시':'Teranishi Chemical Industry','파커':'Parker','페리스휠':'Ferris Wheel Press','펠리칸':'Pelikan','펠리칸 에델슈타인':'Pelikan Edelstein','키노':'Keyno','교토의 소리':'Kyo no Oto','교토의 색채':'Kyo-iro','글입다':'Wearingeul','Geulipda':'Wearingeul'};
 var LOOK={};Object.keys(MAP).forEach(function(k){LOOK[norm(k)]=MAP[k]});
 window.engBrand=function(b){var t=String(b==null?'':b).trim();return LOOK[norm(t)]||t};
 var UNDO_KEY='pil_brand_undo_v1';
 function plan(){
  var rows={},inkN=0,penN=0,ids={inks:[],pens:[]};
  db.inks.forEach(function(i){var to=engBrand(i.brand);if(to!==i.brand){inkN++;ids.inks.push([i.id,i.brand]);var k=i.brand+'\u0000'+to;rows[k]=rows[k]||{from:i.brand,to:to,n:0};rows[k].n++}});
  db.pens.forEach(function(p){if(!p.inkBrand||p.inkBrand==='미잉입')return;var to=engBrand(p.inkBrand);if(to!==p.inkBrand){penN++;ids.pens.push([p.id,p.inkBrand]);var k='p:'+p.inkBrand+'\u0000'+to;rows[k]=rows[k]||{from:p.inkBrand,to:to,n:0,pen:true};rows[k].n++}});
  var seen={},dupes=[];
  db.inks.forEach(function(i){var key=norm(engBrand(i.brand))+'|'+norm(i.name);if(seen[key])dupes.push(i.brand+' · '+i.name);seen[key]=1});
  return {rows:Object.keys(rows).map(function(k){return rows[k]}).sort(function(a,b){return b.n-a.n}),inkN:inkN,penN:penN,ids:ids,dupes:dupes};
 }
 var sec=document.getElementById('backup');if(!sec)return;
 var d=document.createElement('details');d.className='card ai-card';d.id='brandCard';
 d.innerHTML='<summary><b>🔤 잉크 브랜드 영어로 통일</b><span class="ai-sub">한글로 적힌 브랜드를 영어 표기로 바꿔요</span></summary><div class="brand-body"></div>';
 sec.insertBefore(d,sec.firstChild);
 var body=d.querySelector('.brand-body');
 function hasUndo(){try{return !!localStorage.getItem(UNDO_KEY)}catch(e){return false}}
 function render(note){
  var p=plan();
  var h='';
  if(!p.rows.length)h+='<p class="ai-pad">바꿀 브랜드가 없어요. 이미 모두 영어 표기예요.</p>';
  else{
   h+='<p class="ai-pad">잉크 '+p.inkN+'개'+(p.penN?', 만년필 잉입 기록 '+p.penN+'건':'')+'의 브랜드 표기가 바뀝니다. 제품 번호·잉입 기록·잉크 자료실 원본은 그대로예요.</p>';
   h+='<div class="brand-table">'+p.rows.map(function(r){return '<div><span>'+esc(r.from)+(r.pen?' <small>(잉입 기록)</small>':'')+'</span><b>→ '+esc(r.to)+'</b><i>'+r.n+'</i></div>'}).join('')+'</div>';
   if(p.dupes.length)h+='<p class="ai-pad ai-warn">바꾸면 이름이 같은 잉크가 생겨요: '+esc(p.dupes.slice(0,5).join(', '))+'. 적용 전에 확인하세요.</p>';
   h+='<div class="ai-row ai-pad"><button type="button" class="btn" data-brand="apply">적용하기</button></div>';
  }
  if(hasUndo())h+='<div class="ai-row ai-pad"><button type="button" class="btn secondary" data-brand="undo">마지막 적용 되돌리기</button></div>';
  h+='<p class="ai-msg" data-k="'+(note&&note.k||'')+'" role="status">'+esc(note&&note.t||'')+'</p>';
  body.innerHTML=h;
 }
 function doApply(p){
  if(!confirm('잉크 '+p.inkN+'개의 브랜드 표기를 영어로 바꿉니다. 백업 파일이 먼저 내려받아집니다. 계속할까요?'))return false;
  try{var day=new Date().toISOString().slice(0,10).replace(/-/g,'');download(JSON.stringify(db,null,2),'pil_backup_before_brand_'+day+'.json','application/json')}catch(err){}
  try{localStorage.setItem(UNDO_KEY,JSON.stringify(p.ids))}catch(err){}
  db.inks.forEach(function(i){var to=engBrand(i.brand);if(to!==i.brand)i.brand=to});
  db.pens.forEach(function(x){if(x.inkBrand&&x.inkBrand!=='미잉입'){var to=engBrand(x.inkBrand);if(to!==x.inkBrand)x.inkBrand=to}});
  save();refresh();checkBanner();return true;
 }
 d.addEventListener('toggle',function(){if(d.open)render()});
 d.addEventListener('click',function(e){
  var b=e.target.closest('[data-brand]');if(!b)return;
  if(b.getAttribute('data-brand')==='apply'){
   var p=plan();if(!p.rows.length)return;
   if(!doApply(p))return;
   render({t:'바꿨어요. (잉크 '+p.inkN+'개)',k:'ok'});
  }else{
   var u;try{u=JSON.parse(localStorage.getItem(UNDO_KEY)||'null')}catch(err){u=null}
   if(!u){render({t:'되돌릴 기록이 이 기기에 없어요.',k:'warn'});return}
   if(!confirm('마지막으로 바꾼 브랜드 표기를 이전 한글 표기로 되돌립니다. 계속할까요?'))return;
   var im={},pm={};u.inks.forEach(function(x){im[x[0]]=x[1]});u.pens.forEach(function(x){pm[x[0]]=x[1]});
   db.inks.forEach(function(i){if(im[i.id]!==undefined)i.brand=im[i.id]});
   db.pens.forEach(function(x){if(pm[x.id]!==undefined)x.inkBrand=pm[x.id]});
   try{localStorage.removeItem(UNDO_KEY)}catch(err){}
   save();refresh();render({t:'이전 표기로 되돌렸어요.',k:'ok'});
  }
 });
 // New registrations: normalise the typed brand before the original handler reads it.
 var add=document.getElementById('addInk');
 if(add&&add.onclick){var inner=add.onclick;add.onclick=function(ev){var f=document.getElementById('iBrand');if(f)f.value=engBrand(f.value);return inner.call(this,ev)}}

 /* One-tap prompt at the top of every page while Korean ink brands remain (after the cloud data has loaded). */
 var banner=document.createElement('div');banner.id='brandBanner';banner.hidden=true;
 banner.innerHTML='<span></span><button type="button" class="btn" data-bb="go">영어로 통일</button><button type="button" class="btn secondary" data-bb="later">나중에</button>';
 var host=document.querySelector('.content');if(host)host.insertBefore(banner,host.firstChild);
 function later(){try{return sessionStorage.getItem('pil_brand_later')==='1'}catch(e){return false}}
 function checkBanner(){
  var st=(document.getElementById('syncStatus')||{}).textContent||'';
  var ready=true;
  var p=plan();
  banner.hidden=!(ready&&p.inkN>0&&!later());
  if(!banner.hidden)banner.firstChild.textContent='잉크 브랜드 '+p.inkN+'개를 영어 표기로 통일할까요? (예: 고베 잉크 → Kobe INK, Geulipda → Wearingeul)';
 }
 banner.addEventListener('click',function(e){
  var b=e.target.closest('[data-bb]');if(!b)return;
  if(b.getAttribute('data-bb')==='later'){try{sessionStorage.setItem('pil_brand_later','1')}catch(err){}banner.hidden=true;return}
  var p=plan();if(p.rows.length)doApply(p);
 });
 var syncEl=document.getElementById('syncStatus');
 if(syncEl)new MutationObserver(checkBanner).observe(syncEl,{childList:true,characterData:true,subtree:true});
 checkBanner();
})();

/* v2.1 pen detail sheet: click a pen card to see pen + inked-ink info and edit the pen record.
   Ink changes go through the existing editors (잉입 상태, 잉크 상세) so their rules stay intact. */
(function(){
 'use strict';
 var rows=document.getElementById('penRows');if(!rows)return;
 var cur=null;
 var wrap=document.createElement('div');wrap.id='penSheet';wrap.hidden=true;
 wrap.innerHTML='<div class="ps-back" data-ps="close"></div><div class="ps-panel" role="dialog" aria-modal="true" aria-labelledby="psTitle"><div class="ps-body"></div></div>';
 document.body.appendChild(wrap);
 var body=wrap.querySelector('.ps-body');
 var toast=document.createElement('div');toast.id='uiToast';toast.hidden=true;toast.setAttribute('role','status');document.body.appendChild(toast);

 function syncText(){var s=document.getElementById('syncStatus');return s?s.textContent.trim():''}
 function pen(){return db.pens.find(function(x){return x.id===cur})}
 function inkOf(p){return matchingInk(p)||fuzzyInkForPen(p)}
 function row(k,v){return v?'<div class="ps-row"><span>'+k+'</span><b>'+v+'</b></div>':''}
 function say(t,k){var m=body.querySelector('.ps-msg');if(m){m.textContent=t;m.setAttribute('data-k',k||'')}}
 function close(){wrap.hidden=true;document.body.classList.remove('ps-open');cur=null}
 function render(msg){
  var p=pen();if(!p){close();return}
  var st=penFillState(p),ph=penPhoto(p),ink=inkOf(p),hasInk=p.inkName&&p.inkName!=='—';
  var nibs=[].map.call(document.getElementById('pNib').options,function(o){return o.value||o.text});
  if(p.nib&&nibs.indexOf(p.nib)<0)nibs.unshift(p.nib);
  var photoVal=p.photo==='none'?'그림':(p.photo||'');
  var h='<button type="button" class="ps-x" data-ps="close" aria-label="닫기">×</button>';
  h+='<div class="ps-head"><div class="ps-pic'+(ph?' has':'')+'" style="--body:'+penBodyColor(p)+';--c-ink:'+penInkColor(p).hex+'">'+(ph?'<img src="'+esc(ph.u)+'" alt="" referrerpolicy="no-referrer" onerror="if(this.parentNode)this.parentNode.classList.remove(\'has\');this.remove()">':'')+PEN_ART+'</div>'+
   '<div><div class="ink-brand">'+esc(p.brand)+'</div><h3 id="psTitle">'+esc(p.name)+'</h3><span class="state-pill '+esc(st)+'">'+esc(st==='filled'?'현재 잉입':st==='uncertain'?'현재 미확인':'미잉입')+'</span> <span class="nib-chip">'+esc(p.nib||'닙 미확인')+'</span></div></div>';
  h+='<div class="ps-sec"><h4>잉입 잉크</h4>';
  if(hasInk){
   h+='<div class="ps-ink">'+penDotHtml(p)+'<b>'+esc(p.inkBrand+' · '+p.inkName)+'</b></div>';
   if(ink){
    h+=row('색 계열',esc([ink.family,ink.hue].filter(Boolean).join(' · ')))+row('효과·흐름',esc([ink.effect,ink.flow].filter(function(x){return x&&x!=='미확인'}).join(' · ')))+row('보유',esc(inventoryText(ink)));
   }else h+='<p class="ps-note">잉크 목록에서 이 잉크를 찾지 못했어요.</p>';
   h+=row('상태',esc(labelFill(p)))+row('잉입일',esc(p.fillDate||''));
  }else h+='<p class="ps-note">잉입된 잉크가 없어요.</p>';
  h+='<div class="ps-btns"><button type="button" class="btn secondary" data-ps="fill">잉입 상태 변경</button>'+
   (ink?'<button type="button" class="btn secondary" data-ps="inkedit">잉크 상세 수정</button>':hasInk?'<button type="button" class="btn secondary" data-ps="inkadd">이 잉크 등록</button>':'')+'</div></div>';
  h+='<div class="ps-sec"><h4>만년필 정보 수정</h4>'+
   '<label>브랜드</label><input class="input" id="psBrand" value="'+esc(p.brand)+'">'+
   '<label>모델명</label><input class="input" id="psName" value="'+esc(p.name)+'">'+
   '<label>닙</label><select class="input" id="psNib">'+nibs.map(function(n){return '<option'+(n===p.nib?' selected':'')+'>'+esc(n)+'</option>'}).join('')+'</select>'+
   '<label>메모</label><textarea class="input" id="psNotes" rows="3">'+esc(p.notes||'')+'</textarea>'+
   '<label>사진 주소 <small>비우면 자동 사진, "그림"은 펜 그림</small></label><input class="input" id="psPhoto" inputmode="url" placeholder="https:\/\/…" value="'+esc(photoVal)+'">'+
   '<div class="ps-btns"><button type="button" class="btn" data-ps="save">저장</button><button type="button" class="btn secondary" data-ps="close">닫기</button></div>'+
   '<p class="ps-msg" data-k="'+(msg&&msg.k||'')+'" role="status">'+esc(msg&&msg.t||'')+'</p><p class="ps-sync">저장 상태: <b class="ps-sync-live">'+esc(syncText())+'</b></p></div>';
  body.innerHTML=h;
 }
 window.__openPenSheet=function(id){open(id)};
 function open(id){cur=id;render();wrap.hidden=false;document.body.classList.add('ps-open');wrap.querySelector('.ps-panel').scrollTop=0}
 function saveSheet(){
  var p=pen();if(!p)return;
  var brand=document.getElementById('psBrand').value.trim(),name=document.getElementById('psName').value.trim();
  if(!brand||!name){say('브랜드와 모델명을 입력하세요.','bad');return}
  if(db.pens.some(function(x){return x.id!==p.id&&norm(x.brand)===norm(brand)&&norm(x.name)===norm(name)})){say('같은 브랜드·모델명의 만년필이 이미 있어요.','bad');return}
  var photo=document.getElementById('psPhoto').value.trim();
  if(photo&&photo!=='그림'&&(!/^(https:[/][/]|drive:)/i.test(photo)||photo.length>1000)){say('사진 주소는 https로 시작해야 해요. (1000자 이하)','bad');return}
  p.brand=brand;p.name=name;p.nib=document.getElementById('psNib').value;p.notes=document.getElementById('psNotes').value;
  if(photo==='그림')p.photo='none';else if(photo)p.photo=photo;else delete p.photo;
  save();refresh();render({t:'저장했어요.',k:'ok'});
 }
 function goFill(p){
  close();openTab('current');$('currentFilter').value='all';$('currentSearch').value=p.name;drawCurrent();$('cPen').value=p.id;
  setTimeout(function(){var c=document.getElementById('editFillCard');if(c)c.scrollIntoView({behavior:'smooth',block:'start'})},60);
 }
 wrap.addEventListener('click',function(e){
  var b=e.target.closest('[data-ps]');if(!b)return;
  var a=b.getAttribute('data-ps'),p=pen();
  if(a==='close')close();
  else if(a==='save')saveSheet();
  else if(a==='fill'&&p)goFill(p);
  else if(a==='inkedit'&&p){var i=inkOf(p);close();if(i)openInkDetailEditor(i.id)}
  else if(a==='inkadd'&&p){close();openTab('inks');$('iBrand').value=window.engBrand?window.engBrand(p.inkBrand):p.inkBrand;$('iName').value=p.inkName;var d=document.getElementById('addInk').closest('details');if(d)d.open=true;setTimeout(function(){document.getElementById('addInk').scrollIntoView({behavior:'smooth',block:'center'})},60)}
 });
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!wrap.hidden)close()});
 rows.addEventListener('click',function(e){
  if(e.target.closest('button,a,input,select,textarea,label'))return;
  var card=e.target.closest('.pen-card');if(!card)return;
  var b=card.querySelector('[data-penphoto]');if(b)open(b.getAttribute('data-penphoto'));
 });

 /* Save feedback anywhere in the app: mirror the sync state in the sheet and as a short toast. */
 var sync=document.getElementById('syncStatus'),prev='',tt=null;
 function showToast(t,k){toast.textContent=t;toast.setAttribute('data-k',k||'');toast.hidden=false;clearTimeout(tt);tt=setTimeout(function(){toast.hidden=true},k==='ok'?2400:6000)}
 if(sync)new MutationObserver(function(){
  var t=syncText();[].forEach.call(document.querySelectorAll('.ps-sync-live'),function(el){el.textContent=t});
  if(/저장 완료/.test(t)){showToast('✓ 이 기기에 저장됐어요','ok');prev=t;return}
  if(t===prev)return;
  if(/실패|오류/.test(t))showToast('⚠ '+t+' · 백업(JSON·엑셀)을 받아 두세요','bad');
  prev=t;
 }).observe(sync,{childList:true,characterData:true,subtree:true});
})();

/* v2.1 ink detail sheet: click an ink card to see which pens it is in and edit the ink record. */
(function(){
 'use strict';
 var rows=document.getElementById('inkRows');if(!rows)return;
 var cur=null;
 var wrap=document.createElement('div');wrap.id='inkSheet';wrap.hidden=true;
 wrap.innerHTML='<div class="ps-back" data-is="close"></div><div class="ps-panel" role="dialog" aria-modal="true" aria-labelledby="isTitle"><div class="ps-body"></div></div>';
 document.body.appendChild(wrap);
 var body=wrap.querySelector('.ps-body');
 function ink(){return db.inks.find(function(x){return x.id===cur})}
 function inkOfPen(p){return matchingInk(p)||fuzzyInkForPen(p)}
 function pensIn(i){return db.pens.filter(function(p){return p.inkName&&p.inkName!=='—'&&inkOfPen(p)&&inkOfPen(p).id===i.id})}
 function row(k,v){return v?'<div class="ps-row"><span>'+k+'</span><b>'+v+'</b></div>':''}
 function close(){wrap.hidden=true;document.body.classList.remove('ps-open');cur=null}
 function say(t,k){var m=body.querySelector('.ps-msg');if(m){m.textContent=t;m.setAttribute('data-k',k||'')}}
 function opts(id,val){
  var l=[].map.call(document.getElementById(id).options,function(o){return [o.value||o.text,o.text]});
  if(val&&!l.some(function(x){return x[0]===val}))l.unshift([val,val]);
  return l.map(function(x){return '<option value="'+esc(x[0])+'"'+(x[0]===val?' selected':'')+'>'+esc(x[1])+'</option>'}).join('');
 }
 function level(id,val){return ['낮음','중간','높음','미확인'].map(function(o){return '<option'+(o===val?' selected':'')+'>'+o+'</option>'}).join('')}
 function penItem(p){
  var st=penFillState(p);
  return '<button type="button" class="is-pen" data-is-pen="'+esc(p.id)+'"><span class="state-pill '+esc(st)+'">'+esc(st==='filled'?'현재 잉입':'현재 미확인')+'</span><span><b>'+esc(p.brand)+' · '+esc(p.name)+'</b> <small>'+esc(p.nib||'')+(p.fillDate?' · '+esc(p.fillDate):'')+'</small></span></button>';
 }
 function render(msg){
  var i=ink();if(!i){close();return}
  var ps=pensIn(i),now=ps.filter(function(p){return penFillState(p)==='filled'}),past=ps.filter(function(p){return penFillState(p)!=='filled'});
  var fx=i.effect&&i.effect!=='Standard'&&i.effect!=='미확인'?i.effect:'';
  var h='<button type="button" class="ps-x" data-is="close" aria-label="닫기">×</button>';
  h+='<div class="ps-head"><div class="ps-swatch" data-fx="'+esc(inkFx(i))+'" style="--c-ink:'+inkHex(i)+'"></div><div><div class="ink-brand">'+esc(i.brand)+'</div><h3 id="isTitle">'+esc(i.name)+'</h3>'+
   '<span class="nib-chip">'+esc(i.hue||i.family||'')+'</span>'+(fx?' <span class="nib-chip">'+esc(fx)+'</span>':'')+'</div></div>';
  h+='<div class="ps-sec"><h4>잉입된 만년필 '+ps.length+'자루</h4>';
  if(!ps.length)h+='<p class="ps-note">이 잉크가 기록된 만년필이 없어요.</p>';
  if(now.length)h+='<div class="is-group"><span>현재 잉입 확인</span>'+now.map(penItem).join('')+'</div>';
  if(past.length)h+='<div class="is-group"><span>과거 기록 (현재 미확인)</span>'+past.map(penItem).join('')+'</div>';
  h+=row('보유',esc(inventoryText(i)))+row('색 계열',esc([i.family,i.hue].filter(Boolean).join(' · ')))+row('효과·흐름',esc([i.effect,i.flow].filter(function(x){return x&&x!=='미확인'}).join(' · ')));
  h+='</div><div class="ps-sec"><h4>잉크 정보 수정</h4>'+
   '<label>브랜드</label><input class="input" id="isBrand" value="'+esc(i.brand)+'">'+
   '<label>잉크명</label><input class="input" id="isName" value="'+esc(i.name)+'">'+
   '<label>색 계열</label><select class="input" id="isFamily">'+opts('iFamily',i.family)+'</select>'+
   '<label>색 이름 <small>예: 로열 블루, 딥 그린 (색 점에 쓰여요)</small></label><input class="input" id="isHue" value="'+esc(i.hue||'')+'">'+
   '<div class="ps-two"><div><label>명도</label><select class="input" id="isValue">'+level('v',i.value)+'</select></div><div><label>채도</label><select class="input" id="isSat">'+level('s',i.saturation)+'</select></div></div>'+
   '<label>효과</label><select class="input" id="isEffect">'+opts('iEffect',i.effect)+'</select>'+
   '<label>흐름</label><input class="input" id="isFlow" value="'+esc(i.flow&&i.flow!=='미확인'?i.flow:'')+'" placeholder="예: 중 (표준)">'+
   '<label>보유 형태</label><select class="input" id="isPkg">'+opts('iPackage',i.packageType||'unknown')+'</select>'+
   '<div class="ps-two"><div><label>보유 용량 (mL)</label><input class="input" id="isCap" inputmode="decimal" value="'+esc(safeMl(i.capacityMl)===null?'':i.capacityMl)+'"></div><div><label>잔량 (mL)</label><input class="input" id="isRem" inputmode="decimal" value="'+esc(safeMl(i.remainingMl)===null?'':i.remainingMl)+'"></div></div>'+
   '<label>메모</label><textarea class="input" id="isNotes" rows="3">'+esc(i.notes||'')+'</textarea>'+
   '<div class="ps-btns"><button type="button" class="btn" data-is="save">저장</button><button type="button" class="btn secondary" data-is="detail">물성·리뷰 근거 편집</button><button type="button" class="btn secondary" data-is="close">닫기</button></div>'+
   '<p class="ps-msg" data-k="'+(msg&&msg.k||'')+'" role="status">'+esc(msg&&msg.t||'')+'</p><p class="ps-sync">저장 상태: <b class="ps-sync-live">'+esc((document.getElementById('syncStatus')||{}).textContent||'')+'</b></p></div>';
  body.innerHTML=h;
 }
 function open(id){cur=id;render();wrap.hidden=false;document.body.classList.add('ps-open');wrap.querySelector('.ps-panel').scrollTop=0}
 function saveSheet(){
  var i=ink();if(!i)return;
  var brand=(window.engBrand?window.engBrand(document.getElementById('isBrand').value):document.getElementById('isBrand').value).trim(),name=document.getElementById('isName').value.trim();
  if(!brand||!name){say('브랜드와 잉크명을 입력하세요.','bad');return}
  if(db.inks.some(function(x){return x.id!==i.id&&norm(x.brand)===norm(brand)&&norm(x.name)===norm(name)})){say('같은 브랜드·이름의 잉크가 이미 있어요.','bad');return}
  var capS=document.getElementById('isCap').value.trim(),remS=document.getElementById('isRem').value.trim(),cap=safeMl(capS),rem=safeMl(remS);
  if((capS&&cap===null)||(remS&&rem===null)){say('용량과 잔량은 0 이상의 숫자로 입력하세요.','bad');return}
  if(cap!==null&&rem!==null&&rem>cap){say('잔량이 보유 용량보다 클 수 없어요.','bad');return}
  var linked=pensIn(i),renamed=brand!==i.brand||name!==i.name,pkg=document.getElementById('isPkg').value;
  var volChanged=pkg!==(i.packageType||'unknown')||cap!==safeMl(i.capacityMl)||rem!==safeMl(i.remainingMl);
  i.brand=brand;i.name=name;i.family=document.getElementById('isFamily').value;i.hue=document.getElementById('isHue').value.trim();
  i.value=document.getElementById('isValue').value;i.saturation=document.getElementById('isSat').value;i.effect=document.getElementById('isEffect').value;
  i.flow=document.getElementById('isFlow').value.trim()||'미확인';i.notes=document.getElementById('isNotes').value;
  i.packageType=pkg;i.capacityMl=cap;i.remainingMl=rem;
  if(volChanged)i.volumeSource='사용자 입력 '+localDate();
  if(renamed)linked.forEach(function(p){p.inkBrand=brand;p.inkName=name});
  save();refresh();
  render({t:'저장했어요.'+(renamed&&linked.length?' 이 잉크가 기록된 만년필 '+linked.length+'자루의 잉크 이름도 함께 바꿨어요.':'')+'',k:'ok'});
 }
 wrap.addEventListener('click',function(e){
  var pb=e.target.closest('[data-is-pen]');
  if(pb){var id=pb.getAttribute('data-is-pen');close();if(window.__openPenSheet){openTab('pens');window.__openPenSheet(id)}return}
  var b=e.target.closest('[data-is]');if(!b)return;
  var a=b.getAttribute('data-is');
  if(a==='close')close();
  else if(a==='save')saveSheet();
  else if(a==='detail'){var id2=cur;close();openInkDetailEditor(id2)}
 });
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!wrap.hidden)close()});
 rows.addEventListener('click',function(e){
  if(e.target.closest('button,a,input,select,textarea,label'))return;
  var card=e.target.closest('.ink-card');if(!card)return;
  var b=card.querySelector('[data-editinkdetail]');if(b)open(b.getAttribute('data-editinkdetail'));
 });
})();

/* v2.1 ink name alignment: make each pen's inked-ink text identical to the owned-ink record it refers to.
   Preview first; nothing changes until 적용. Ink records, ids and research data are never touched. */
(function(){
 'use strict';
 var sec=document.getElementById('backup');if(!sec)return;
 var KEY='pil_name_undo_v1';
 var d=document.createElement('details');d.className='card ai-card';d.id='nameCard';
 d.innerHTML='<summary><b>🔗 잉입 잉크 이름 맞추기</b><span class="ai-sub">만년필에 적힌 잉크 이름을 보유 잉크 이름과 똑같이 맞춰요</span></summary><div class="ns-body"></div>';
 var anchor=document.getElementById('brandCard');
 if(anchor&&anchor.nextSibling)sec.insertBefore(d,anchor.nextSibling);else sec.insertBefore(d,sec.firstChild);
 var body=d.querySelector('.ns-body');
 function rec(p){return matchingInk(p)||fuzzyInkForPen(p)}
 function plan(){
  var same=0,upd=[],none=[];
  db.pens.forEach(function(p){
   if(!p.inkName||p.inkName==='—')return;
   var r=rec(p);
   if(!r){none.push(p);return}
   if(norm(r.brand)===norm(p.inkBrand)&&norm(r.name)===norm(p.inkName)){same++;return}
   upd.push({p:p,r:r});
  });
  return {same:same,upd:upd,none:none};
 }
 function hasUndo(){try{return !!localStorage.getItem(KEY)}catch(e){return false}}
 function render(note){
  var pl=plan(),h='';
  h+='<p class="ai-pad">잉입 기록이 있는 만년필 <b>'+(pl.same+pl.upd.length+pl.none.length)+'자루</b> 중 이미 같은 이름 <b>'+pl.same+'</b>, 맞출 것 <b>'+pl.upd.length+'</b>, 보유 잉크에 없는 것 <b>'+pl.none.length+'</b>이에요.</p>';
  if(pl.upd.length){
   h+='<p class="ai-pad">체크한 항목만 바꿔요. 만년필의 잉크 이름이 오른쪽 보유 잉크 이름으로 바뀌어요. 다른 잉크로 잘못 연결됐으면 체크를 풀어 주세요.</p><div class="ns-list">'+
    pl.upd.map(function(x,i){return '<label class="ns-row"><input type="checkbox" data-ns-i="'+i+'" checked><span><b>'+esc(x.p.brand+' '+x.p.name)+'</b><small>'+esc(x.p.inkBrand+' · '+x.p.inkName)+'</small></span><span class="ns-to">→ '+esc(x.r.brand+' · '+x.r.name)+'</span></label>'}).join('')+'</div>'+
    '<div class="ai-row ai-pad"><button type="button" class="btn" data-ns="apply">체크한 항목 적용</button></div>';
  }
  if(pl.none.length){
   var seen={},uniq=pl.none.filter(function(p){var k=norm(p.inkBrand+p.inkName);if(seen[k])return false;seen[k]=1;return true});
   h+='<p class="ai-pad">보유 잉크 목록에 없는 잉크 '+uniq.length+'종이에요. 보유 잉크로 등록하면 이름이 연결되고 색 점도 정확해져요. (카트리지처럼 따로 관리하지 않는 잉크는 그냥 두셔도 돼요.)</p><div class="ns-list">'+
    uniq.map(function(p){return '<div class="ns-row"><span><b>'+esc(p.inkBrand+' · '+p.inkName)+'</b></span><button type="button" class="chip-btn" data-ns-reg="'+esc(p.id)+'">잉크로 등록</button></div>'}).join('')+'</div>';
  }
  if(!pl.upd.length&&!pl.none.length)h+='<p class="ai-pad">모두 같은 이름으로 맞춰져 있어요.</p>';
  if(hasUndo())h+='<div class="ai-row ai-pad"><button type="button" class="btn secondary" data-ns="undo">마지막 적용 되돌리기</button></div>';
  h+='<p class="ai-msg" data-k="'+(note&&note.k||'')+'" role="status">'+esc(note&&note.t||'')+'</p>';
  body.innerHTML=h;
 }
 d.addEventListener('toggle',function(){if(d.open)render()});
 d.addEventListener('click',function(e){
  var reg=e.target.closest('[data-ns-reg]');
  if(reg){
   var p=db.pens.find(function(x){return x.id===reg.getAttribute('data-ns-reg')});if(!p)return;
   openTab('inks');$('iBrand').value=window.engBrand?window.engBrand(p.inkBrand):p.inkBrand;$('iName').value=p.inkName;
   var f=document.getElementById('addInk').closest('details');if(f)f.open=true;
   setTimeout(function(){document.getElementById('addInk').scrollIntoView({behavior:'smooth',block:'center'})},60);return;
  }
  var b=e.target.closest('[data-ns]');if(!b)return;
  if(b.getAttribute('data-ns')==='apply'){
   var pl=plan(),picked=[].map.call(body.querySelectorAll('[data-ns-i]:checked'),function(c){return pl.upd[+c.getAttribute('data-ns-i')]});
   if(!picked.length){render({t:'적용할 항목을 체크해 주세요.',k:'warn'});return}
   if(!confirm('만년필 '+picked.length+'자루의 잉크 이름을 보유 잉크 이름으로 맞춥니다. 백업 파일이 먼저 내려받아집니다. 계속할까요?'))return;
   try{var day=new Date().toISOString().slice(0,10).replace(/-/g,'');download(JSON.stringify(db,null,2),'pil_backup_before_inkname_'+day+'.json','application/json')}catch(err){}
   try{localStorage.setItem(KEY,JSON.stringify(picked.map(function(x){return [x.p.id,x.p.inkBrand,x.p.inkName]})))}catch(err){}
   picked.forEach(function(x){x.p.inkBrand=x.r.brand;x.p.inkName=x.r.name});
   save();refresh();render({t:'맞췄어요. (만년필 '+picked.length+'자루)',k:'ok'});
  }else{
   var u;try{u=JSON.parse(localStorage.getItem(KEY)||'null')}catch(err){u=null}
   if(!u){render({t:'되돌릴 기록이 이 기기에 없어요.',k:'warn'});return}
   if(!confirm('마지막으로 맞춘 잉크 이름을 이전 표기로 되돌립니다. 계속할까요?'))return;
   var m={};u.forEach(function(x){m[x[0]]=x});
   db.pens.forEach(function(p){if(m[p.id]){p.inkBrand=m[p.id][1];p.inkName=m[p.id][2]}});
   try{localStorage.removeItem(KEY)}catch(err){}
   save();refresh();render({t:'이전 표기로 되돌렸어요.',k:'ok'});
  }
 });
})();

/* v2.1 ink name format: English names stay English only; Japanese names become "漢字 (English, 한국어)".
   Proposals are listed with a confidence flag and applied only when checked. Pens that name the same ink follow along. */
(function(){
 'use strict';
 var sec=document.getElementById('backup');if(!sec)return;
 var KEY='pil_namefmt_undo_v1';
 /* [ink id, proposed name, group, sure] */
 var P=[
 ];
 var GROUP={jp:'일본어 이름 → 한자 (영어, 한국어)',en:'영어 이름 → 영어만'};
 var d=document.createElement('details');d.className='card ai-card';d.id='fmtCard';
 d.innerHTML='<summary><b>🔠 잉크 이름 형식 통일</b><span class="ai-sub">영어는 영어만, 일본어는 한자 (영어, 한국어)</span></summary><div class="ns-body"></div>';
 var anchor=document.getElementById('nameCard')||document.getElementById('brandCard');
 if(anchor&&anchor.nextSibling)sec.insertBefore(d,anchor.nextSibling);else sec.insertBefore(d,sec.firstChild);
 var body=d.querySelector('.ns-body');
 function rows(){
  var out=[];
  P.forEach(function(x){var i=db.inks.find(function(k){return k.id===x[0]});if(i&&i.name!==x[1])out.push({i:i,to:x[1],g:x[2],sure:x[3]})});
  return out;
 }
 function review(){
  var done={};P.forEach(function(x){done[x[0]]=1});
  return db.inks.filter(function(i){return !done[i.id]&&/[가-힣぀-ヿ一-鿿]/.test(i.name)});
 }
 function hasUndo(){try{return !!localStorage.getItem(KEY)}catch(e){return false}}
 function render(note){
  var rs=rows(),h='';
  if(!rs.length)h+='<p class="ai-pad">제안된 이름은 모두 반영되어 있어요.</p>';
  else{
   h+='<p class="ai-pad">체크한 이름만 바꿔요. <b>확실한 것</b>은 미리 체크했고, <b>확인 필요</b>로 표시된 것은 체크를 풀어 두었어요. 이 잉크가 기록된 만년필의 잉크 이름도 같이 바뀌어요.</p>';
   ['jp','en'].forEach(function(g){
    var l=rs.filter(function(r){return r.g===g});if(!l.length)return;
    h+='<p class="ai-pad"><b>'+GROUP[g]+'</b> ('+l.length+')</p><div class="ns-list">'+l.map(function(r){var k=rows().indexOf(r);return '<label class="ns-row"><input type="checkbox" data-nf="'+r.i.id+'"'+(r.sure?' checked':'')+'><span><b>'+esc(r.i.brand)+'</b><small>'+esc(r.i.name)+'</small></span><span class="ns-to">→ '+esc(r.to)+(r.sure?'':' <em>확인 필요</em>')+'</span></label>'}).join('')+'</div>';
   });
   h+='<div class="ai-row ai-pad"><button type="button" class="btn" data-nf-act="apply">체크한 이름 적용</button></div>';
  }
  var rv=review();
  if(rv.length)h+='<p class="ai-pad">제안이 없는 이름 '+rv.length+'개예요. 한글 고유 이름(원어가 한국어)은 그대로 두어도 되고, 그 밖의 이름은 공식 표기를 확인하지 못했어요. 잉크 카드를 눌러 직접 고치거나 표기를 알려 주세요.</p><div class="ns-list">'+rv.map(function(i){return '<div class="ns-row"><span><b>'+esc(i.brand)+'</b><small>'+esc(i.name)+'</small></span><button type="button" class="chip-btn" data-nf-edit="'+i.id+'">수정</button></div>'}).join('')+'</div>';
  if(hasUndo())h+='<div class="ai-row ai-pad"><button type="button" class="btn secondary" data-nf-act="undo">마지막 적용 되돌리기</button></div>';
  h+='<p class="ai-msg" data-k="'+(note&&note.k||'')+'" role="status">'+esc(note&&note.t||'')+'</p>';
  body.innerHTML=h;
 }
 d.addEventListener('toggle',function(){if(d.open)render()});
 d.addEventListener('click',function(e){
  var ed=e.target.closest('[data-nf-edit]');
  if(ed){openTab('inks');var card=[].find.call(document.querySelectorAll('#inkRows .ink-card'),function(c){var b=c.querySelector('[data-editinkdetail]');return b&&b.getAttribute('data-editinkdetail')===ed.getAttribute('data-nf-edit')});if(card){card.scrollIntoView({block:'center'});var n=card.querySelector('.ink-name');if(n)n.click()}return}
  var b=e.target.closest('[data-nf-act]');if(!b)return;
  if(b.getAttribute('data-nf-act')==='apply'){
   var map={};P.forEach(function(x){map[x[0]]=x[1]});
   var ids=[].map.call(body.querySelectorAll('[data-nf]:checked'),function(c){return c.getAttribute('data-nf')});
   if(!ids.length){render({t:'적용할 이름을 체크해 주세요.',k:'warn'});return}
   var clash=ids.filter(function(id){var i=db.inks.find(function(k){return k.id===id});return db.inks.some(function(o){return o.id!==id&&norm(o.brand)===norm(i.brand)&&norm(o.name)===norm(map[id])})});
   if(clash.length){render({t:'같은 이름의 잉크가 이미 있어서 적용할 수 없는 항목이 있어요. 체크를 풀고 다시 시도해 주세요.',k:'bad'});return}
   if(!confirm('잉크 '+ids.length+'개의 이름을 바꿉니다. 백업 파일이 먼저 내려받아집니다. 계속할까요?'))return;
   try{var day=new Date().toISOString().slice(0,10).replace(/-/g,'');download(JSON.stringify(db,null,2),'pil_backup_before_namefmt_'+day+'.json','application/json')}catch(err){}
   var undo={inks:[],pens:[]},penCount=0;
   ids.forEach(function(id){
    var i=db.inks.find(function(k){return k.id===id});
    var linked=db.pens.filter(function(p){return p.inkName&&p.inkName!=='—'&&(matchingInk(p)||fuzzyInkForPen(p))&&(matchingInk(p)||fuzzyInkForPen(p)).id===id});
    undo.inks.push([id,i.name]);
    linked.forEach(function(p){undo.pens.push([p.id,p.inkBrand,p.inkName]);p.inkBrand=i.brand;p.inkName=map[id];penCount++});
    i.name=map[id];
   });
   try{localStorage.setItem(KEY,JSON.stringify(undo))}catch(err){}
   save();refresh();render({t:'바꿨어요. 잉크 '+ids.length+'개, 만년필 기록 '+penCount+'건.',k:'ok'});
  }else{
   var u;try{u=JSON.parse(localStorage.getItem(KEY)||'null')}catch(err){u=null}
   if(!u){render({t:'되돌릴 기록이 이 기기에 없어요.',k:'warn'});return}
   if(!confirm('마지막으로 바꾼 잉크 이름을 이전 표기로 되돌립니다. 계속할까요?'))return;
   var im={},pm={};u.inks.forEach(function(x){im[x[0]]=x[1]});u.pens.forEach(function(x){pm[x[0]]=x});
   db.inks.forEach(function(i){if(im[i.id]!==undefined)i.name=im[i.id]});
   db.pens.forEach(function(p){if(pm[p.id]){p.inkBrand=pm[p.id][1];p.inkName=pm[p.id][2]}});
   try{localStorage.removeItem(KEY)}catch(err){}
   save();refresh();render({t:'이전 표기로 되돌렸어요.',k:'ok'});
  }
 });
})();
