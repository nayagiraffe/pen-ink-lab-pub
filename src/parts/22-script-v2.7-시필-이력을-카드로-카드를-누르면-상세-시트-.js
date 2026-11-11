
/* v2.7 시필 이력을 카드로 + 카드를 누르면 상세 시트(보기·수정·사진 추가/삭제·삭제) */
(function(){
 'use strict';
 var $$=function(id){return document.getElementById(id)};
 var root=$$('tReviews');if(!root)return;
 var css=document.createElement('style');
 css.textContent='.tr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:10px}'+
 '.tr-card{border:0;padding:0;text-align:left;background:var(--surface);border-radius:16px;overflow:hidden;cursor:pointer;box-shadow:0 0 0 1px var(--line),0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column;font:inherit;color:inherit}'+
 '.tr-top{position:relative;aspect-ratio:4/3;background:var(--c-ink,var(--sunken));overflow:hidden}.tr-top img{width:100%;height:100%;object-fit:cover;display:block}'+
 '.tr-top .tr-n{position:absolute;right:6px;bottom:6px;background:rgba(0,0,0,.55);color:#fff;font-size:11px;border-radius:999px;padding:2px 8px}'+
 '.tr-top .tr-rate{position:absolute;left:6px;top:6px;background:rgba(255,255,255,.92);color:#222;font-size:11.5px;font-weight:700;border-radius:999px;padding:2px 8px}'+
 '.tr-body{padding:9px 11px 11px;display:flex;flex-direction:column;gap:2px}.tr-brand{font-size:11px;color:var(--muted)}.tr-ink{font-size:14px;font-weight:800;line-height:1.25}.tr-pen{font-size:12px;color:var(--ink-2)}.tr-meta{font-size:11.5px;color:var(--muted)}'+
 '.tr-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}.tr-chips span{font-size:10.5px;background:var(--sunken);border-radius:999px;padding:2px 7px;color:var(--ink-2)}'+
 '.tr-sheet{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.42);display:flex;align-items:flex-end;justify-content:center}.tr-sheet[hidden]{display:none}'+
 '.tr-panel{background:var(--bg,#fff);width:100%;max-width:640px;max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;padding:16px 16px 28px;box-shadow:0 -6px 30px rgba(0,0,0,.2)}'+
 '.tr-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.tr-head h3{margin:0;font-size:18px}.tr-x{border:0;background:var(--sunken);border-radius:999px;width:34px;height:34px;font-size:16px;cursor:pointer;flex:none}'+
 '.tr-photos{display:flex;gap:8px;overflow-x:auto;margin:12px 0;scroll-snap-type:x mandatory}.tr-photos .tr-ph{position:relative;flex:0 0 78%;max-width:420px;aspect-ratio:4/3;border-radius:14px;overflow:hidden;background:var(--sunken);scroll-snap-align:start}.tr-photos img{width:100%;height:100%;object-fit:cover;display:block;cursor:zoom-in}'+
 '.tr-photos .tr-del{position:absolute;top:6px;right:6px;border:0;border-radius:999px;background:rgba(0,0,0,.6);color:#fff;width:28px;height:28px;cursor:pointer}'+
 '.tr-kv{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:13.5px;margin:6px 0 10px}.tr-kv dt{color:var(--muted)}.tr-kv dd{margin:0;font-weight:600}'+
 '.tr-memo{white-space:pre-line;font-size:13.5px;background:var(--sunken);border-radius:12px;padding:10px 12px}.tr-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}'+
 '.tr-edit label{display:block;font-size:12px;color:var(--muted);margin:8px 0 3px}.tr-msg{font-size:12.5px;color:var(--muted);margin-top:6px}.tr-msg.bad{color:var(--bad)}';
 document.head.appendChild(css);
 var sheet=document.createElement('div');sheet.className='tr-sheet';sheet.hidden=true;sheet.innerHTML='<div class="tr-panel" role="dialog" aria-modal="true" id="trPanel"></div>';document.body.appendChild(sheet);
 var panel=$$('trPanel'),curId=null,editing=false,draftPhotos=null,fullCache={};
 function rec(id){return (db.testReviews||[]).find(function(r){return r.id===id})}
 function pen(id){return db.pens.find(function(p){return p.id===id})}
 function ink(id){return db.inks.find(function(i){return i.id===id})}
 function thumb(ref){return typeof testThumbOf==='function'?testThumbOf(ref):''}
 var LBL={flow:['','매우 부족','부족','적절','풍부','매우 풍부'],width:['','매우 가늘다','가늘다','보통','굵다','매우 굵다'],smooth:['','거침','약간 거침','보통','부드러움','매우 부드러움'],feather:['없음','약간','많음'],rating:['','매우 불만족','불만족','보통','만족','매우 만족']};
 function lab(k,v){if(v===null||v===undefined||v==='')return '';v=Number(v);return (LBL[k]&&LBL[k][v])?LBL[k][v]:String(v)}
 function evid(e){return e==='hands-on'?'직접 시필':e==='photo'?'사진만 확인':'과거 기록'}
 /* ---------- cards ---------- */
 function cardHtml(r){var p=pen(r.penId),i=ink(r.inkId),ps=r.photos||[],u=ps[0]?thumb(ps[0]):'',col='',fx='';try{col=i?inkHex(i):''}catch(_){}try{fx=i&&!u?inkFx(i):''}catch(_){}
  var chips=[];if(r.flow!=null&&r.flow!=='')chips.push('흐름 '+lab('flow',r.flow));if(r.sheen&&r.sheen!=='없음')chips.push('테 '+r.sheen);if(r.shading)chips.push('농담 '+r.shading);if(r.drySeconds!=null)chips.push('건조 '+r.drySeconds+'초');if(r.feather!=null&&r.feather!==''&&Number(r.feather)>0)chips.push('번짐 '+lab('feather',r.feather));
  var top=(r.rating!=null&&r.rating!=='')?'★ '+r.rating+' / 5':evid(r.evidence);
  return '<article class="ink-card tr-card'+(u?' has-photo':'')+'" data-trid="'+esc(r.id)+'" data-fx="'+esc(fx)+'" style="--c-ink:'+esc(col||'#b4b0a8')+'" role="button" tabindex="0"><div class="ink-tile">'+(u?'<img class="tr-img" loading="lazy" alt="" src="'+u+'">':'')+
   '<span class="ink-hue">'+esc(top)+'</span>'+(ps.length>1?'<span class="ink-fx">사진 '+ps.length+'</span>':'')+'</div>'+
   '<div class="ink-body"><div class="ink-brand">'+esc(i?i.brand:'')+'</div><div class="ink-name">'+esc(i?i.name:'삭제된 잉크')+'</div>'+
   '<div class="tr-pen"><span class="tr-dot" style="background:'+esc(col||'#b4b0a8')+'"></span>'+esc(p?p.brand+' '+p.name:'삭제된 만년필')+(r.nib||(p&&p.nib)?' · '+esc(r.nib||p.nib):'')+'</div>'+
   '<div class="ink-meta">'+esc((r.date||'날짜 미입력')+' · '+(r.paper||'종이 미확인'))+'</div>'+(chips.length?'<div class="tr-chips">'+chips.map(function(c){return '<span>'+esc(c)+'</span>'}).join('')+'</div>':'')+'</div></article>'}
 /* v2.9 정렬: 최신순 · 노트/종이 · 잉크 · 만년필 · 만족도 (종류별 묶음 제목) */
 var SORTS=[['date','최신순'],['paper','노트·종이'],['ink','잉크'],['pen','만년필'],['rating','만족도']];
 var sortKey='date';try{var sv=localStorage.getItem('trSort');if(SORTS.some(function(s){return s[0]===sv}))sortKey=sv}catch(_){}
 var css3=document.createElement('style');css3.textContent='.tr-sort{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px}.tr-sort>span{font-size:12px;color:var(--muted);font-weight:700;margin-right:2px}'+
  '.tr-sort button{border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:6px 12px;font-size:12.5px;font-weight:700;cursor:pointer;color:var(--ink-2);font-family:inherit}.tr-sort button.on{background:var(--ink);color:#fff;border-color:var(--ink)}'+
  '.tr-group{grid-column:1/-1;margin:10px 0 -4px;font-size:14px;font-weight:800;display:flex;align-items:baseline;gap:8px;border-bottom:1px solid var(--line);padding-bottom:6px}.tr-group:first-child{margin-top:0}.tr-group small{font-size:11.5px;color:var(--muted);font-weight:600}';
 document.head.appendChild(css3);
 var bar=document.createElement('div');bar.className='tr-sort';root.parentNode.insertBefore(bar,root);
 function drawBar(){bar.innerHTML='<span>정렬</span>'+SORTS.map(function(s){return '<button type="button" data-trsort="'+s[0]+'" class="'+(s[0]===sortKey?'on':'')+'" aria-pressed="'+(s[0]===sortKey)+'">'+s[1]+'</button>'}).join('')}
 bar.addEventListener('click',function(e){var b=e.target.closest('[data-trsort]');if(!b)return;sortKey=b.getAttribute('data-trsort');try{localStorage.setItem('trSort',sortKey)}catch(_){}renderCards()});
 function inkLabel(r){var i=ink(r.inkId);return i?i.brand+' · '+i.name:'삭제된 잉크'}
 function penLabel(r){var p=pen(r.penId);return p?p.brand+' · '+p.name:'삭제된 만년필'}
 var UNK={paper:'종이 미확인',rating:'만족도 미평가'};
 var CANON={};
 function paperKey(s){return String(s||'').trim().toLowerCase().replace(/\s+/g,' ')}
 function buildPapers(){var cnt={},best={};(db.testReviews||[]).forEach(function(r){var p=String(r.paper||'').trim();if(!p)return;var k=paperKey(p);cnt[k]=cnt[k]||{};cnt[k][p]=(cnt[k][p]||0)+1});
  CANON={};Object.keys(cnt).forEach(function(k){var o=cnt[k],top=Object.keys(o).sort(function(a,b){return o[b]-o[a]||a.localeCompare(b)})[0];CANON[k]={name:top,n:Object.keys(o).reduce(function(s,x){return s+o[x]},0)}});
  var dl=$$('trPaperList');if(!dl){dl=document.createElement('datalist');dl.id='trPaperList';document.body.appendChild(dl)}
  dl.innerHTML=Object.keys(CANON).map(function(k){return CANON[k]}).sort(function(a,b){return b.n-a.n||a.name.localeCompare(b.name,'ko')}).map(function(c){return '<option value="'+esc(c.name)+'">'}).join('');
  var tp=$$('tPaper');if(tp&&tp.getAttribute('list')!=='trPaperList'){tp.setAttribute('list','trPaperList');tp.setAttribute('autocomplete','off')}}
 function canonPaper(s){var k=paperKey(s);return k&&CANON[k]?CANON[k].name:String(s||'').trim()}
 function groupOf(r){if(sortKey==='paper')return canonPaper(r.paper)||UNK.paper;if(sortKey==='ink')return inkLabel(r);if(sortKey==='pen')return penLabel(r);if(sortKey==='rating')return (r.rating!=null&&r.rating!=='')?'★ '+r.rating+' / 5':UNK.rating;return ''}
 function byDate(a,b){return String(b.date||'').localeCompare(String(a.date||''))||String(b.id).localeCompare(String(a.id))}
 function cmp(a,b){if(sortKey==='date')return byDate(a,b);
  if(sortKey==='rating'){var ra=(a.rating==null||a.rating==='')?-1:Number(a.rating),rb=(b.rating==null||b.rating==='')?-1:Number(b.rating);return (rb-ra)||byDate(a,b)}
  var ga=groupOf(a),gb=groupOf(b),ua=ga===UNK.paper,ub=gb===UNK.paper;if(ua!==ub)return ua?1:-1;return ga.localeCompare(gb,'ko',{sensitivity:'base'})||byDate(a,b)}
 function renderCards(){drawBar();try{buildPapers()}catch(_){}var q=norm(($$('tReviewSearch')||{}).value||''),all=Array.isArray(db.testReviews)?db.testReviews:[];
  var list=all.filter(function(r){if(!q)return true;var p=pen(r.penId),i=ink(r.inkId);return norm((p?p.brand+' '+p.name:'')+' '+(i?i.brand+' '+i.name:'')+' '+(r.paper||'')+' '+(r.memo||'')).indexOf(q)>=0}).sort(cmp);
  if($$('tCount'))$$('tCount').textContent='시필 '+list.length+'건 / 전체 '+all.length+'건';
  if(!list.length){root.innerHTML='<div class="empty">'+(q?'검색 결과가 없습니다.':'아직 등록된 시필 평가가 없습니다.')+'</div>';return}
  var html='',cur=null,counts={};if(sortKey!=='date')list.forEach(function(r){var g=groupOf(r);counts[g]=(counts[g]||0)+1});
  list.forEach(function(r){if(sortKey!=='date'){var g=groupOf(r);if(g!==cur){cur=g;html+='<h3 class="tr-group">'+esc(g)+'<small>'+counts[g]+'건</small></h3>'}}html+=cardHtml(r)});
  root.innerHTML='<div class="tr-gallery">'+html+'</div>'}
 var base=drawTestReviews;drawTestReviews=function(){var r=base.apply(this,arguments);try{renderCards()}catch(e){console.warn('v2.7',e)}if(!sheet.hidden&&!editing)try{show(curId)}catch(_){}return r};window.drawTestReviews=drawTestReviews;
 try{$$('tReviewSearch').oninput=drawTestReviews}catch(_){}
 root.addEventListener('click',function(e){var c=e.target.closest('[data-trid]');if(c){e.preventDefault();openSheet(c.getAttribute('data-trid'),false)}});
 /* ---------- sheet ---------- */
 function openSheet(id,edit){if(!rec(id))return;curId=id;editing=!!edit;draftPhotos=null;sheet.hidden=false;document.body.style.overflow='hidden';edit?editView(id):show(id)}
 window.openTestSheet=openSheet;
 function closeSheet(){sheet.hidden=true;document.body.style.overflow='';curId=null;editing=false;draftPhotos=null}
 sheet.addEventListener('click',function(e){if(e.target===sheet)closeSheet()});
 document.addEventListener('keydown',function(e){if(!sheet.hidden&&e.key==='Escape')closeSheet()});
 function photosHtml(list,removable){return (list||[]).length?'<div class="tr-photos">'+list.map(function(p,n){var u=thumb(p.photo||p);return '<div class="tr-ph">'+(u?'<img alt="시필 사진" src="'+u+'" data-trfull="'+n+'">':'')+(removable?'<button type="button" class="tr-del" data-trphdel="'+n+'" aria-label="사진 빼기">×</button>':'')+'</div>'}).join('')+'</div>':''}
 function show(id){var r=rec(id);if(!r){closeSheet();return}editing=false;var p=pen(r.penId),i=ink(r.inkId);
  var rows=[['만년필',p?p.brand+' '+p.name+(p.nib?' ('+p.nib+')':''):'삭제된 만년필'],['사용한 닙',r.nib||''],['시필일',r.date||''],['종이',r.paper||''],['근거',evid(r.evidence)],
   ['잉크 공급량',lab('flow',r.flow)],['선 굵기',lab('width',r.width)],['부드러움',lab('smooth',r.smooth)],['번짐',lab('feather',r.feather)],['만족도',lab('rating',r.rating)],
   ['테(시인)',r.sheen||''],['농담',r.shading||''],['건조 시간',r.drySeconds!=null?r.drySeconds+'초':'']].filter(function(x){return x[1]!==''&&x[1]!=null});
  panel.innerHTML='<div class="tr-head"><div><div class="tr-brand">'+esc(i?i.brand:'')+'</div><h3>'+esc(i?i.name:'삭제된 잉크')+'</h3></div><button type="button" class="tr-x" data-trclose aria-label="닫기">✕</button></div>'+
   photosHtml(r.photos,false)+'<dl class="tr-kv">'+rows.map(function(x){return '<dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd>'}).join('')+'</dl>'+
   (r.memo?'<div class="tr-memo">'+esc(r.memo)+'</div>':'')+(r.ai&&r.ai.confidence?'<p class="tr-msg">AI 초안 신뢰도 '+esc(r.ai.confidence)+(r.ai.caution?' · '+esc(r.ai.caution):'')+'</p>':'')+
   '<div class="tr-actions"><button type="button" class="btn" data-tredit>✏️ 수정</button><button type="button" class="btn secondary" data-trsame>같은 조합으로 새 시필</button><button type="button" class="btn secondary danger" data-trdelete>삭제</button></div>'}
 function sel(id,key,val){var o=LBL[key],opts='<option value="">평가하지 않음</option>';if(key==='feather')opts+=[0,1,2].map(function(v){return '<option value="'+v+'"'+(String(val)===String(v)?' selected':'')+'>'+o[v]+'</option>'}).join('');else for(var v=1;v<=5;v++)opts+='<option value="'+v+'"'+(String(val)===String(v)?' selected':'')+'>'+v+' '+o[v]+'</option>';return '<select id="'+id+'">'+opts+'</select>'}
 function sel2(id,list,val){return '<select id="'+id+'"><option value="">평가하지 않음</option>'+list.map(function(v){return '<option'+(val===v?' selected':'')+'>'+v+'</option>'}).join('')+'</select>'}
 function editView(id){var r=rec(id);if(!r)return;editing=true;if(!draftPhotos)draftPhotos=(r.photos||[]).map(function(p,n){return {photo:p,fileId:(r.photoFiles||[])[n]||''}});
  var pens=sortedCollection(db.pens.slice()),inks=sortedCollection(db.inks.slice());
  panel.innerHTML='<div class="tr-head"><h3>시필 기록 수정</h3><button type="button" class="tr-x" data-trcancel aria-label="취소">✕</button></div><div class="tr-edit">'+
   '<label>만년필</label><select id="eP">'+pens.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===r.penId?' selected':'')+'>'+esc(p.brand+' · '+p.name+' ('+p.nib+')')+'</option>'}).join('')+'</select>'+
   '<label>잉크</label><select id="eI">'+inks.map(function(i){return '<option value="'+esc(i.id)+'"'+(i.id===r.inkId?' selected':'')+'>'+esc(i.brand+' · '+i.name)+'</option>'}).join('')+'</select>'+
   '<div class="twocol"><div><label>시필일</label><input class="input" type="date" id="eD" value="'+esc(r.date||'')+'"></div><div><label>종이·노트</label><input class="input" id="eQ" list="trPaperList" autocomplete="off" value="'+esc(r.paper||'')+'"></div></div>'+
   '<label>시필 사진</label>'+photosHtml(draftPhotos,true)+'<div class="btnrow"><label class="btn secondary tx-file">📷 촬영<input type="file" accept="image/*" capture="environment" hidden data-tradd></label><label class="btn secondary tx-file">🖼 앨범<input type="file" accept="image/*" hidden data-tradd></label></div><div class="tr-msg" id="eMsg"></div>'+
   '<div class="twocol"><div><label>테(시인)</label>'+sel2('eS',['없음','약간','뚜렷'],r.sheen||'')+'</div><div><label>농담</label>'+sel2('eH',['약함','중간','강함'],r.shading||'')+'</div>'+
   '<div><label>번짐</label>'+sel('eF','feather',r.feather)+'</div><div><label>선 굵기</label>'+sel('eW','width',r.width)+'</div>'+
   '<div><label>잉크 공급량</label>'+sel('eL','flow',r.flow)+'</div><div><label>부드러움</label>'+sel('eM','smooth',r.smooth)+'</div>'+
   '<div><label>만족도</label>'+sel('eR','rating',r.rating)+'</div><div><label>근거</label><select id="eE"><option value="hands-on"'+(r.evidence==='hands-on'?' selected':'')+'>직접 시필</option><option value="photo"'+(r.evidence==='photo'?' selected':'')+'>시필 사진만 확인</option><option value="legacy"'+(r.evidence==='legacy'?' selected':'')+'>기존 시필 기록</option></select></div>'+
   '<div><label>건조 시간(초)</label><input class="input" type="number" min="0" max="600" id="eY" value="'+(r.drySeconds!=null?esc(r.drySeconds):'')+'"></div><div><label>사용한 닙</label><input class="input" id="eN" value="'+esc(r.nib||'')+'"></div></div>'+
   '<label>메모</label><textarea id="eT">'+esc(r.memo||'')+'</textarea></div>'+
   '<div class="tr-actions"><button type="button" class="btn" data-trsave>저장</button><button type="button" class="btn secondary" data-trcancel>취소</button></div>'}
 function num(id){var v=$$(id).value;return v===''?null:Number(v)}
 function saveEdit(){var r=rec(curId);if(!r)return;
  if(draftPhotos.some(function(p){return !p.photo})){$$('eMsg').textContent='사진 업로드가 끝난 뒤 저장해 주세요.';$$('eMsg').className='tr-msg bad';return}
  var d=$$('eY').value;
  var upd={penId:$$('eP').value,inkId:$$('eI').value,date:$$('eD').value||r.date,paper:$$('eQ').value.trim(),flow:num('eL'),width:num('eW'),smooth:num('eM'),feather:num('eF'),rating:num('eR'),evidence:$$('eE').value,
   memo:$$('eT').value.trim(),nib:$$('eN').value.trim(),sheen:$$('eS').value||null,shading:$$('eH').value||null,drySeconds:d===''?null:Math.max(0,Math.min(600,Number(d))),
   photos:draftPhotos.map(function(p){return p.photo}),photoFiles:draftPhotos.map(function(p){return p.fileId||''})};
  if(upd.evidence==='photo'&&[upd.flow,upd.width,upd.smooth,upd.feather,upd.rating].some(function(x){return x!==null})&&!confirm('사진만으로 평가하기 어려운 수치가 입력되었습니다. 실제로 확인한 수치만 기록하셨나요?'))return;
  Object.assign(r,upd);r.updatedAt=new Date().toISOString();save();editing=false;draftPhotos=null;drawTestReviews();try{drawInks()}catch(_){}show(curId)}
 function loadImg(file){return new Promise(function(res,rej){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){res(im)};im.onerror=function(){URL.revokeObjectURL(u);rej(Error('사진을 읽지 못했어요.'))};im.src=u})}
 function toJpeg(im,max,q){var w=im.naturalWidth,h=im.naturalHeight,s=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(h*s);var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/jpeg',q).split(',')[1]}
 function keepInputs(fn){var ids=['eP','eI','eD','eQ','eS','eH','eF','eW','eL','eM','eR','eE','eY','eN','eT'],vals={};ids.forEach(function(id){if($$(id))vals[id]=$$(id).value});fn();ids.forEach(function(id){if($$(id)&&vals[id]!==undefined)$$(id).value=vals[id]})}
 panel.addEventListener('change',function(e){var inp=e.target.closest('[data-tradd]');if(!inp)return;var f=inp.files&&inp.files[0];inp.value='';if(!f)return;
  if(draftPhotos.length>=4){$$('eMsg').textContent='사진은 4장까지 넣을 수 있어요.';return}
  if(!(false)){$$('eMsg').textContent='이 버전에서는 사진 저장을 지원하지 않아요.';return}
  loadImg(f).then(function(im){var big=toJpeg(im,1568,.85),th=toJpeg(im,480,.8),item={photo:'',fileId:''};draftPhotos.push(item);keepInputs(function(){editView(curId)});$$('eMsg').textContent='사진을 저장하는 중…';
   PIL.noServer().withSuccessHandler(function(res){if(!res||!res.ok){draftPhotos.splice(draftPhotos.indexOf(item),1);keepInputs(function(){editView(curId)});$$('eMsg').textContent=(res&&res.error)||'사진 저장 실패';return}
     item.photo=res.photo;item.fileId=res.photoFileId||'';try{THUMBS[res.photo.slice(6)]='data:image/jpeg;base64,'+th;storeThumbs()}catch(_){}keepInputs(function(){editView(curId)});$$('eMsg').textContent='사진을 추가했어요. 저장을 눌러야 기록에 반영돼요.'})
    .withFailureHandler(function(err){draftPhotos.splice(draftPhotos.indexOf(item),1);keepInputs(function(){editView(curId)});$$('eMsg').textContent='사진 저장 실패: '+(err&&err.message||err)}).saveWritingPhoto(th,big)})
   .catch(function(err){$$('eMsg').textContent=err.message})});
 panel.addEventListener('click',function(e){var t=e.target;
  if(t.closest('[data-trclose]')){closeSheet();return}
  if(t.closest('[data-trcancel]')){draftPhotos=null;show(curId);return}
  if(t.closest('[data-tredit]')){draftPhotos=null;editView(curId);return}
  if(t.closest('[data-trsave]')){saveEdit();return}
  var dp=t.closest('[data-trphdel]');if(dp){draftPhotos.splice(Number(dp.getAttribute('data-trphdel')),1);keepInputs(function(){editView(curId)});return}
  if(t.closest('[data-trdelete]')){if(confirm('이 시필 기록을 삭제할까요?')){db.testReviews=db.testReviews.filter(function(x){return x.id!==curId});save();closeSheet();drawTestReviews();try{drawInks()}catch(_){}}return}
  if(t.closest('[data-trsame]')){var r=rec(curId);closeSheet();try{$$('tPenSearch').value='';$$('tInkSearch').value='';updateTestSelects();$$('tPen').value=r.penId;$$('tPen').dispatchEvent(new Event('change'));$$('tInk').value=r.inkId;$$('tPaper').value=r.paper||'';$$('tPen').scrollIntoView({behavior:'smooth',block:'center'})}catch(_){}return}
  var im=t.closest('[data-trfull]');if(im&&!editing){var r2=rec(curId),n=Number(im.getAttribute('data-trfull')),fid=(r2.photoFiles||[])[n];
   if(fid){if(fullCache[fid]){im.src=fullCache[fid];im.style.objectFit='contain'}else if(false)PIL.noServer().withSuccessHandler(function(res){if(res&&res.ok){fullCache[fid]=res.url;im.src=res.url;im.style.objectFit='contain'}}).getPhotoFull(fid)}}});
 /* 사진 모아 보기의 "이 기록 수정" → 이 시트의 수정 화면으로 */
 document.addEventListener('click',function(e){var b=e.target.closest('[data-galedit]');if(!b)return;e.preventDefault();e.stopPropagation();var lb=document.querySelector('.gal-lb');if(lb){lb.hidden=true;document.body.style.overflow=''}openSheet(b.getAttribute('data-galedit'),true)},true);

 /* v2.8 레이아웃: 입력 1/3 · 카드 2/3, 사진 모아 보기 숨김 */
 var css2=document.createElement('style');
 css2.textContent='#testing>.grid{align-items:start}@media(min-width:860px){#testing>.grid{grid-template-columns:minmax(300px,1fr) minmax(0,2fr)!important}}'+
 '.tr-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:12px}@media(max-width:859px){.tr-gallery{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}'+
 '.tr-card{cursor:pointer;outline:none}.tr-card:focus-visible{box-shadow:0 0 0 3px var(--accent)}.tr-card .ink-tile{overflow:hidden}.tr-card .tr-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}'+
 '.tr-card .tr-pen{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-2);font-weight:600;margin-top:4px;min-width:0}.tr-card .tr-pen{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}.tr-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:1px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}'+
 '.ink-tests[data-inkid]{border:1px solid var(--line);background:var(--surface-2,var(--sunken));border-radius:10px;padding:4px 10px 4px 4px;margin:7px 0 2px;min-height:36px;transition:background .15s,border-color .15s}'+
 '.ink-tests[data-inkid] span{color:var(--ink-2);font-weight:700}.ink-tests[data-inkid]::after{content:"보기 ›";margin-left:auto;font-size:11.5px;font-weight:800;color:var(--accent);white-space:nowrap;padding-left:6px}'+
 '.ink-tests[data-inkid]:hover{background:var(--ink);border-color:var(--ink)}.ink-tests[data-inkid]:hover span,.ink-tests[data-inkid]:hover::after{color:#fff}'+
 '.tr-card .tr-chips{margin-top:8px}@media(max-width:420px){.tr-card .ink-name{font-size:13.5px}.tr-card .ink-body{padding:9px 10px 10px}}';
 document.head.appendChild(css2);
 function hideGal(){var g=$('galGrid');var c=g&&g.closest('.card');if(c)c.style.display='none'}hideGal();
 root.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var c=e.target.closest('[data-trid]');if(c){e.preventDefault();openSheet(c.getAttribute('data-trid'),false)}});
 /* 잉크 카드의 "시필 N건" → 시필노트에서 이 잉크 카드만 보기 */
 window.addEventListener('click',function(e){var it=e.target.closest&&e.target.closest('.ink-tests[data-inkid]');if(!it)return;e.preventDefault();e.stopPropagation();
  var i=ink(it.getAttribute('data-inkid'));var nav=document.querySelector('[data-tab="testing"]');if(nav)nav.click();
  try{$('tReviewSearch').value=i?(i.brand+' '+i.name):'';drawTestReviews()}catch(_){}
  setTimeout(function(){var c=root.closest('.card');(c||root).scrollIntoView({behavior:'smooth',block:'start'})},80)},true);
 try{renderCards()}catch(e){console.warn('v2.7',e)}
})();
