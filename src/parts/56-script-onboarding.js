
/* 30초 시작: 만년필 1자루 + 잉크 1병만 넣으면 바로 첫 추천 결과를 보여 준다 */
(function(){
 'use strict';
 var PIL=window.PIL,card=null,mode='',done=null,chosen={pen:null,ink:null};
 function needPen(){return db.pens.length===0}
 function needInk(){return db.inks.length===0}
 function want(){return done?'result':(needPen()||needInk())?'form':''}

 function section(kind,title){
  var pen=kind==='pen';
  return '<div class="pil-step" data-k="'+kind+'"><h3>'+title+'</h3>'+
   '<input class="input" id="pilS_'+kind+'" placeholder="'+(pen?'예: Lamy Safari, 파일럿 커스텀 74':'예: 이로시주쿠 콘페키, Diamine Marine')+'" autocomplete="off">'+
   '<ul class="pil-list" id="pilS_'+kind+'_list" role="listbox"></ul><div class="pil-chosen" id="pilS_'+kind+'_ok" hidden></div>'+
   '<details class="pil-manual"><summary>목록에 없나요? 직접 입력</summary><div class="twocol"><div><label>브랜드</label><input class="input" id="pilS_'+kind+'_b"></div><div><label>'+(pen?'모델명':'잉크명')+'</label><input class="input" id="pilS_'+kind+'_n"></div>'+
   (pen?'<div><label>닙</label><select id="pilS_pen_nib"><option>F</option><option>EF</option><option>M</option><option>B</option><option>FM</option><option>MF</option><option>UEF</option><option>XF</option><option>SF</option><option>Stub</option><option>기타</option></select></div>'
        :'<div><label>색상 계열</label><select id="pilS_ink_fam">'+Object.keys(INK_FAM_OPTS()).map(function(k){return '<option>'+k+'</option>'}).join('')+'</select></div>')+
   '</div></details></div>';
 }
 function INK_FAM_OPTS(){var o={};[].forEach.call($('iFamily').options,function(x){o[x.value]=1});return o}

 function renderForm(){
  card.innerHTML='<h2>30초 시작</h2><p class="lede">지금 손에 있는 <b>만년필 1자루</b>와 <b>잉크 1병</b>만 알려 주세요. 나머지는 나중에 천천히 채워도 돼요.</p>'+
   '<p class="hint">🔒 데이터는 이 기기에만 저장되고 외부로 나가지 않아요. 백업(JSON·엑셀)으로 언제든 내보내거나 지울 수 있어요.</p>'+
   (needPen()?section('pen','① 만년필'):'')+(needInk()?section('ink','② 잉크'):'')+
   '<div class="btnrow"><button type="button" class="btn" id="pilS_go">추천 보기</button></div><p class="hint" id="pilS_msg" role="status"></p>';
  chosen={pen:null,ink:null};
  if(needPen())wire('pen',PEN_CATALOG,PIL.penRowHtml,function(e){chosen.pen=e;var nib=e.nibs[0];$('pilS_pen_ok').innerHTML='<b></b> <span class="sub"></span>';$('pilS_pen_ok').firstChild.textContent=e.brand+' '+e.name;$('pilS_pen_ok').lastChild.textContent=' · 닙 '+e.nibs.join(' / ')+' 중 첫 번째('+nib+')로 시작해요';});
  if(needInk())wire('ink',INK_CATALOG,PIL.inkRowHtml,function(e){chosen.ink=e;$('pilS_ink_ok').innerHTML='<span class="pil-dot" style="--c:'+esc(inkHex({brand:e.brand,name:e.name,family:e.family,hue:e.hue}))+'"></span> <b></b>';$('pilS_ink_ok').lastChild.textContent=e.brand+' '+e.name;});
  $('pilS_go').onclick=go;
 }
 function wire(kind,list,row,onPick){
  PIL.bindSearch($('pilS_'+kind),$('pilS_'+kind+'_list'),function(q){return PIL.searchCatalog(list,q,6)},row,function(e){
   onPick(e);var ok=$('pilS_'+kind+'_ok');ok.hidden=false;$('pilS_'+kind).value='';
  });
 }
 function manual(kind){
  var b=($('pilS_'+kind+'_b')||{}).value,n=($('pilS_'+kind+'_n')||{}).value;b=(b||'').trim();n=(n||'').trim();
  if(!b&&!n)return null;if(!b||!n)return false;
  return kind==='pen'?{brand:b,name:n,nibs:[$('pilS_pen_nib').value]}:{brand:b,name:n,family:$('pilS_ink_fam').value,hue:'',effect:'미확인'};
 }
 function go(){
  var msg=$('pilS_msg');msg.textContent='';
  var penE=null,inkE=null;
  if(needPen()){penE=chosen.pen||manual('pen');if(penE===false)return msg.textContent='만년필은 브랜드와 모델명을 모두 입력해 주세요.';if(!penE)return msg.textContent='만년필을 검색해서 고르거나 직접 입력해 주세요.'}
  if(needInk()){inkE=chosen.ink||manual('ink');if(inkE===false)return msg.textContent='잉크는 브랜드와 잉크명을 모두 입력해 주세요.';if(!inkE)return msg.textContent='잉크를 검색해서 고르거나 직접 입력해 주세요.'}
  var pen=penE?PIL.ensurePen(penE,penE.nibs[0]).pen:db.pens[0];
  var ink=inkE?PIL.ensureInk(inkE).ink:db.inks[0];
  done={penId:pen.id,inkId:ink.id};
  save();refresh();
  try{$('direction').value='pen';refreshTarget();$('target').value=pen.id;recommendations()}catch(e){console.warn(e)}
  mode='';update();
 }
 function renderResult(){
  var pen=db.pens.find(function(p){return p.id===done.penId}),ink=db.inks.find(function(i){return i.id===done.inkId});
  if(!pen||!ink){done=null;return update()}
  $('direction').value='pen';
  var r=calc(pen,ink,'balance');
  var li=function(a,c){return (a||[]).slice(0,c).map(function(x){return '<li>'+esc(x)+'</li>'}).join('')};
  card.innerHTML='<h2>첫 추천 결과 🎉</h2><div class="pil-pair"><span><b>'+esc(pen.brand+' '+pen.name)+'</b> <em class="pil-tag">닙 '+esc(pen.nib)+'</em></span><span class="pil-x2">×</span><span><span class="pil-dot" style="--c:'+esc(inkHex(ink))+'"></span> <b>'+esc(ink.brand+' '+ink.name)+'</b></span></div>'+
   '<div class="pil-score"><b>'+r.score+'</b><span>점 / 100<br>이 조합의 예상 적합도</span></div>'+
   (r.why&&r.why.length?'<h4>좋은 점</h4><ul class="pil-why">'+li(r.why,3)+'</ul>':'')+
   (r.warnings&&r.warnings.length?'<h4>참고</h4><ul class="pil-warn">'+li(r.warnings,2)+'</ul>':'')+
   '<p class="hint">아직 리뷰·시필 기록이 없어서 제조사·닙 경향 중심의 추정이에요. <b>잉크를 더 추가하면 여러 후보를 비교해 드려요.</b></p>'+
   '<div class="btnrow"><button type="button" class="btn" id="pilS_more">잉크 더 추가</button><button type="button" class="btn secondary" id="pilS_inked">지금 넣었어요</button><button type="button" class="btn outline" id="pilS_close">닫기</button></div>';
  $('pilS_more').onclick=function(){PIL.openAddInk()};
  $('pilS_inked').onclick=function(){PIL.applySwap(pen,ink,{silentSame:true})};
  $('pilS_close').onclick=function(){done=null;mode='';update()};
 }
 function update(){
  var w=want();
  if(!w){if(card){card.remove();card=null;mode=''}return}
  var host=$('match'),hero=host&&host.querySelector('.hero');if(!host)return;
  if(!card){card=document.createElement('div');card.id='pilStart';card.className='card pil-start';(hero||host.firstChild).insertAdjacentElement(hero?'afterend':'beforebegin',card)}
  if(w!==mode){mode=w;w==='form'?renderForm():renderResult()}
 }
 PIL.onRefreshAdd(update);
 PIL.openAddInk=function(){
  PIL.inkPicker({title:'잉크 추가',intro:'검색해서 내 목록에 추가해요. 추가한 잉크는 바로 추천 후보에 들어가요.',own:false,onPick:function(ink,isNew){
   PIL.toast(ink.brand+' '+ink.name+(isNew?' 을(를) 추가했어요':' 은(는) 이미 있어요'));
   if(isNew){save();refresh();try{if($('target').value)recommendations()}catch(_){}}
  }});
 };
 update();
})();
