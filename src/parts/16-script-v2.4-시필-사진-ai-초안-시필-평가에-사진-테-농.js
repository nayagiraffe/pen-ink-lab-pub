
/* v2.4 시필 사진 + AI 초안: 시필 평가에 사진·테·농담·건조시간·닙을 더하고, 사진에서 보이는 항목만 AI가 빈칸에 초안으로 채운다. */
(function(){
 'use strict';
 var memo=document.getElementById('tMemo');if(!memo)return;
 var css=document.createElement('style');
 css.textContent='.tx-box{margin-top:8px}.tx-photos{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0}.tx-ph{position:relative;width:86px;height:86px;border-radius:10px;overflow:hidden;background:var(--sunken);box-shadow:inset 0 0 0 1px var(--line)}.tx-ph img{width:100%;height:100%;object-fit:cover;display:block}.tx-ph button{position:absolute;top:3px;right:3px;border:0;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;width:22px;height:22px;font-size:13px;line-height:22px;padding:0;cursor:pointer}.tx-ph .tx-wait{display:flex;align-items:center;justify-content:center;height:100%;font-size:11px;color:var(--muted)}.tx-file{cursor:pointer}.tx-msg{font-size:12.5px;margin:6px 0;color:var(--muted);white-space:pre-line}.tx-msg.bad{color:var(--bad)}.tx-msg.ok{color:var(--ok)}.tx-thumbs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.tx-thumbs img,.tx-thumbs span{width:64px;height:64px;object-fit:cover;border-radius:8px;background:var(--sunken);display:block}.tx-ai{font-size:12px;color:var(--muted)}.ink-tests{display:flex;gap:4px;align-items:center;margin:4px 0 2px;font-size:11.5px;color:var(--muted)}.ink-tests img,.ink-tests i{width:28px;height:28px;border-radius:6px;object-fit:cover;background:var(--sunken);display:block}';
 document.head.appendChild(css);
 var photos=[],lastAi=null,lastBig=null,busy=false;
 var box=document.createElement('div');box.className='tx-box';
 box.innerHTML='<div class="twocol"><div><label>테(시인)</label><select id="tSheen"><option value="">평가하지 않음</option><option>없음</option><option>약간</option><option>뚜렷</option></select></div>'+
  '<div><label>농담(음영)</label><select id="tShade"><option value="">평가하지 않음</option><option>약함</option><option>중간</option><option>강함</option></select></div>'+
  '<div><label>건조 시간(초)</label><input class="input" id="tDry" type="number" min="0" max="600" inputmode="numeric" placeholder="예: 20"></div>'+
  '<div><label>사용한 닙</label><input class="input" id="tNib" placeholder="비우면 만년필 정보 사용"></div></div>'+
  '<label>시필 사진</label><div class="tx-photos" id="tPhotos"></div>'+
  '<div class="btnrow"><label class="btn secondary tx-file">📷 촬영<input type="file" accept="image/*" capture="environment" hidden data-tx="1"></label>'+
  '<label class="btn secondary tx-file">🖼 앨범<input type="file" accept="image/*" hidden data-tx="1"></label>'+
  '<button type="button" class="btn secondary" id="tAiBtn" disabled>🤖 사진으로 초안 채우기</button></div>'+
  '<div class="tx-msg" id="tAiMsg"></div>'+
  '<p class="hint">AI는 사진에서 보이는 테·농담·번짐·선 굵기만 비어 있는 칸에 초안으로 채워요. 조명에 따라 틀릴 수 있으니 확인 후 저장하세요. 흐름·부드러움·건조 시간·만족도는 직접 써 본 느낌으로 입력하세요.</p>';
 memo.parentNode.insertBefore(box,memo.nextSibling);
 var $$=function(id){return document.getElementById(id)};
 function msg(t,cls){var m=$$('tAiMsg');m.textContent=t||'';m.className='tx-msg'+(cls?' '+cls:'')}
 function canRun(){return false}
 /* thumbnails for drive:<id> refs (shares THUMBS cache with pen photos) */
 var asked={},tm=null;
 function thumbOf(ref){if(!ref||ref.indexOf('drive:')!==0)return '';var id=ref.slice(6);if(typeof THUMBS!=='undefined'&&THUMBS[id])return THUMBS[id];if(!asked[id]){asked[id]=1;clearTimeout(tm);tm=setTimeout(fetchThumbs,60)}return ''}
 function fetchThumbs(){var ids=Object.keys(asked).filter(function(id){return asked[id]===1});if(!ids.length||!canRun())return;ids.forEach(function(id){asked[id]=2});
  PIL.noServer().withSuccessHandler(function(r){if(!r||!r.ok)return;var n=0;Object.keys(r.thumbs||{}).forEach(function(id){THUMBS[id]=r.thumbs[id];n++});if(n){try{storeThumbs()}catch(_){}redraw()}}).getPhotoThumbs(ids)}
 function redraw(){try{renderPhotos()}catch(_){}try{drawTestReviews()}catch(_){}try{drawInks()}catch(_){}}
 window.testThumbOf=thumbOf;
 function renderPhotos(){var root=$$('tPhotos');root.innerHTML=photos.map(function(p,i){var u=p.local||thumbOf(p.photo);return '<div class="tx-ph">'+(u?'<img alt="시필 사진" src="'+u+'">':'<div class="tx-wait">'+(p.photo?'불러오는 중':'업로드 중')+'</div>')+'<button type="button" data-txdel="'+i+'" aria-label="사진 빼기">×</button></div>'}).join('');$$('tAiBtn').disabled=!lastBig||busy}
 $$('tPhotos').addEventListener('click',function(e){var b=e.target.closest('[data-txdel]');if(!b)return;photos.splice(Number(b.getAttribute('data-txdel')),1);if(!photos.length)lastBig=null;renderPhotos()});
 function loadImg(file){return new Promise(function(res,rej){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){res(im)};im.onerror=function(){URL.revokeObjectURL(u);rej(Error('사진을 읽지 못했어요. 아이폰 설정 → 카메라 → 포맷 → "높은 호환성"으로 바꿔 보세요.'))};im.src=u})}
 function toJpeg(im,max,q){var w=im.naturalWidth,h=im.naturalHeight,s=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(h*s);var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/jpeg',q).split(',')[1]}
 [].forEach.call(box.querySelectorAll('[data-tx]'),function(inp){inp.addEventListener('change',function(){var f=inp.files&&inp.files[0];inp.value='';if(!f)return;
  if(!canRun()){msg('이 버전에서는 사진 저장을 지원하지 않아요.','bad');return}
  if(photos.length>=4){msg('사진은 한 기록에 4장까지 넣을 수 있어요.','bad');return}
  msg('사진 준비 중…');
  loadImg(f).then(function(im){var big=toJpeg(im,1568,0.85),thumb=toJpeg(im,480,0.8);var item={photo:'',fileId:'',local:'data:image/jpeg;base64,'+thumb};photos.push(item);lastBig=big;renderPhotos();msg('사진을 저장하는 중…');
   PIL.noServer().withSuccessHandler(function(r){if(!r||!r.ok){photos.splice(photos.indexOf(item),1);renderPhotos();msg((r&&r.error)||'사진 저장 실패','bad');return}
     item.photo=r.photo;item.fileId=r.photoFileId||'';try{THUMBS[r.photo.slice(6)]=item.local;storeThumbs()}catch(_){}
     renderPhotos();msg('사진 저장 완료. "🤖 사진으로 초안 채우기"를 누르면 AI가 테·농담·번짐을 읽어 줘요.','ok')})
    .withFailureHandler(function(e){photos.splice(photos.indexOf(item),1);renderPhotos();msg('사진 저장 실패: '+(e&&e.message||e),'bad')})
    .saveWritingPhoto(thumb,big)}).catch(function(e){msg(e.message,'bad')})})});
 var FEATHER={'없음':'0','약간':'1','많음':'2'},WIDTH={'매우 가늘다':'1','가늘다':'2','보통':'3','굵다':'4','매우 굵다':'5'};
 function setIfEmpty(id,val){var el=$$(id);if(!el||val===undefined||val===null||val==='')return false;if(el.value!=='')return false;if(el.tagName==='SELECT'&&![].some.call(el.options,function(o){return o.value===String(val)}))return false;el.value=String(val);return true}
 $$('tAiBtn').addEventListener('click',function(){
  if(!lastBig||busy)return;if(!canRun()){msg('이 버전에서는 AI 판독을 지원하지 않아요.','bad');return}
  var pen=db.pens.find(function(p){return p.id===$$('tPen').value}),ink=db.inks.find(function(i){return i.id===$$('tInk').value});
  var ctx={pen:pen?pen.brand+' '+pen.name:'',nib:$$('tNib').value||(pen&&pen.nib)||'',ink:ink?ink.brand+' '+ink.name:'',inkHue:ink?(ink.hue||ink.family||''):'',paper:$$('tPaper').value,noSave:true};
  busy=true;renderPhotos();msg('Claude가 시필 사진을 읽는 중… (5~20초)');
  PIL.noServer().withSuccessHandler(function(r){busy=false;renderPhotos();
    if(!r||!r.ok){msg((r&&r.error)||'AI 판독 실패','bad');return}
    var a=r.ai||{},filled=[];
    if(a.sheen&&a.sheen!=='판단불가'&&setIfEmpty('tSheen',a.sheen))filled.push('테 '+a.sheen+(a.sheenColor?'('+a.sheenColor+')':''));
    if(a.shading&&a.shading!=='판단불가'&&setIfEmpty('tShade',a.shading))filled.push('농담 '+a.shading);
    if(FEATHER[a.feather]!==undefined&&setIfEmpty('tFeather',FEATHER[a.feather]))filled.push('번짐 '+a.feather);
    if(WIDTH[a.width]&&setIfEmpty('tWidth',WIDTH[a.width]))filled.push('선 굵기 '+a.width);
    lastAi={color:a.color||'',observations:a.observations||'',confidence:a.confidence||'',sheenColor:a.sheenColor||'',shimmer:a.shimmer||'',bleed:a.bleed||'',caution:a.caution||'',model:r.model||'',at:new Date().toISOString()};
    var note='[AI 초안·신뢰도 '+(a.confidence||'?')+'] '+[a.color,a.observations].filter(Boolean).join(' · ');
    if(memo.value.indexOf('[AI 초안')<0)memo.value=(memo.value?memo.value+'\n':'')+note;
    msg((filled.length?'채운 칸: '+filled.join(', '):'비어 있는 칸 중 사진으로 판단할 수 있는 항목이 없었어요.')+(a.shimmer==='있음'?'\n펄이 보인다고 판독했어요. 잉크 정보와 맞는지 확인해 주세요.':'')+(a.bleed==='있음'?'\n뒷번짐이 보인다고 판독했어요.':'')+(a.caution?'\n주의: '+a.caution:'')+'\n흐름·부드러움·건조 시간·만족도는 직접 입력해 주세요.','ok')})
   .withFailureHandler(function(e){busy=false;renderPhotos();msg('AI 판독 실패: '+(e&&e.message||e),'bad')})
   .analyzeWritingSample(lastBig,'',ctx)});
 window.testExtra=function(){var d=$$('tDry').value;return {nib:$$('tNib').value.trim(),sheen:$$('tSheen').value||null,shading:$$('tShade').value||null,drySeconds:d===''?null:Math.max(0,Math.min(600,Number(d))),photos:photos.filter(function(p){return p.photo}).map(function(p){return p.photo}),photoFiles:photos.filter(function(p){return p.fileId}).map(function(p){return p.fileId}),ai:lastAi}};
 window.testExtraClear=function(){['tSheen','tShade','tDry','tNib'].forEach(function(id){if($$(id))$$(id).value=''});photos=[];lastAi=null;lastBig=null;msg('');renderPhotos()};
 window.testExtraLoad=function(r){$$('tSheen').value=r.sheen||'';$$('tShade').value=r.shading||'';$$('tDry').value=r.drySeconds==null?'':r.drySeconds;$$('tNib').value=r.nib||'';photos=(r.photos||[]).map(function(p,i){return {photo:p,fileId:(r.photoFiles||[])[i]||''}});lastAi=r.ai||null;lastBig=null;msg(photos.length?'저장된 사진 '+photos.length+'장 · AI 판독은 새로 찍거나 고른 사진으로만 할 수 있어요.':'');renderPhotos()};
 window.testExtraHtml=function(r){var bits=[];if(r.nib)bits.push('닙 '+r.nib);if(r.sheen)bits.push('테 '+r.sheen);if(r.shading)bits.push('농담 '+r.shading);if(r.drySeconds!=null)bits.push('건조 '+r.drySeconds+'초');
  var th=(r.photos||[]).map(function(p){var u=thumbOf(p);return u?'<img alt="시필 사진" loading="lazy" src="'+u+'">':'<span></span>'}).join('');
  return (bits.length?'<p>'+esc(bits.join(' · '))+'</p>':'')+(th?'<div class="tx-thumbs">'+th+'</div>':'')+(r.ai&&r.ai.confidence?'<p class="tx-ai">AI 초안 신뢰도 '+esc(r.ai.confidence)+(r.ai.caution?' · '+esc(r.ai.caution):'')+'</p>':'')};
 window.inkTestsHtml=function(ink){var list=(db.testReviews||[]).filter(function(t){return t.inkId===ink.id});if(!list.length)return '';
  var ph=[];list.slice().reverse().forEach(function(t){(t.photos||[]).forEach(function(p){if(ph.length<3)ph.push(p)})});
  var pens={};list.forEach(function(t){pens[t.penId]=1});
  return '<div class="ink-tests" title="시필 기록">'+ph.map(function(p){var u=thumbOf(p);return u?'<img alt="" loading="lazy" src="'+u+'">':'<i></i>'}).join('')+'<span>시필 '+list.length+'건 · 펜 '+Object.keys(pens).length+'자루</span></div>'};
 /* 잉크 카드의 "시필" 버튼 → 시필 노트 탭으로 이동, 잉크(와 현재 잉입된 펜) 미리 선택 */
 document.addEventListener('click',function(e){var b=e.target.closest('[data-testink]');if(!b)return;var id=b.getAttribute('data-testink');
  var nav=document.querySelector('[data-tab="testing"]');if(nav)nav.click();
  $$('tPenSearch').value='';$$('tInkSearch').value='';try{updateTestSelects()}catch(_){}
  $$('tInk').value=id;try{var m=inkPenMap().get(id);if(m&&m.length){var f=m.find(function(o){return o.st==='filled'})||m[0];$$('tPen').value=f.p.id}}catch(_){}
  setTimeout(function(){var c=document.getElementById('testing');if(c)c.scrollIntoView({behavior:'smooth',block:'start'})},60)});
 renderPhotos();try{drawTestReviews();drawInks()}catch(_){}
})();
