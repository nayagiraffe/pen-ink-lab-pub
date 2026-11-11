
/* v2.1 pen photos: hotlinked manufacturer/shop images found 2026-10-28; c=e exact, c=c similar model. */
const PEN_PHOTOS={};
function penPhoto(p){if(!p||p.photo==='none')return null;if(p.photo){const l=window.PIL&&PIL.photoSrc?PIL.photoSrc(p.photo):undefined;if(l!==undefined)return l?{u:l,c:'l'}:null;return {u:p.photo,c:'u'}}return PEN_PHOTOS[p.id]||null}

/* v2.1 Palette: display-only colour estimates from hue / family / value / saturation.
   Never stored, never used by the recommendation score. */
const INK_HUES=[
 [/스페셜 골드|골드펄|gold/i,43,62,50],[/블루실버|silver/i,212,22,58],[/블루퍼플|쉬머/i,248,42,46],[/라임\/특수펄/,82,52,48],
 [/블루블랙|blue ?black/i,222,34,21],[/스모키 네이비/,218,24,29],[/네이비/,223,44,23],
 [/딥 오션/,203,62,30],[/로얄\/딥|딥 블루/,226,62,31],[/다크 블루/,226,52,26],[/코발트/,219,74,43],[/로열 블루|로얄 블루/,226,68,42],
 [/미디엄 블루/,214,58,46],[/미사키/,204,60,46],[/캐널/,194,44,40],[/히스토리/,210,38,38],
 [/터콰이즈|시안/,186,68,41],[/세이지/,168,24,46],[/피콕/,178,58,33],[/민트/,156,44,60],
 [/에메랄드/,154,58,35],[/제이드/,160,38,45],[/실루엣/,140,20,31],[/히노키/,92,30,38],[/정글/,132,44,28],[/딥 그린/,150,44,25],
 [/올리브|카키/,70,32,34],[/라임|연두/,84,58,44],
 [/라벤더|퍼윙클/,252,40,64],[/딥 퍼플/,276,44,30],[/딥 바이올렛/,265,48,33],
 [/로즈 레드/,349,64,45],[/로즈 핑크/,344,54,60],[/핑크|로즈/,336,52,62],[/코랄/,9,70,63],
 [/흑적/,350,44,21],[/버건디|와인/,345,54,28],[/적갈/,12,48,30],[/다홍/,8,78,50],[/레드/,355,68,45],
 [/오렌지/,24,84,52],[/옐로/,47,84,55],
 [/허니/,35,58,40],[/황토/,40,54,42],[/세피아/,30,38,28],[/브라운/,25,44,31],
 [/그레이/,215,8,46],[/블랙/,220,8,13],[/블루/,220,62,44]
];
const INK_FAMILIES=[[/옐로|골드/,47,80,52],[/블루/,220,60,40],[/그린/,145,42,34],[/레드|오렌지|버건디/,355,60,42],[/보라|핑크/,300,38,48],[/브라운|카키/,28,42,33],[/블랙|그레이/,220,8,22],[/스페셜|펄/,45,50,52]];
function inkSeed(s){let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return h}
function inkHsl(ink){
 const hue=String(ink?.hue||''),fam=String(ink?.family||''),name=String(ink?.name||'');
 let base=INK_HUES.find(([re])=>re.test(hue))||INK_HUES.find(([re])=>re.test(name))||INK_FAMILIES.find(([re])=>re.test(fam))||[0,220,10,40];
 let [,h,s,l]=base;
 if(ink?.value==='낮음')l-=8;else if(ink?.value==='높음')l+=8;
 if(ink?.saturation==='낮음')s*=.62;else if(ink?.saturation==='높음')s=Math.min(92,s*1.15);
 const j=inkSeed((ink?.brand||'')+name);h+=(j%9)-4;l+=((j>>4)%5)-2;
 return [Math.round((h+360)%360),Math.round(Math.max(4,Math.min(95,s))),Math.round(Math.max(9,Math.min(80,l)))];
}
function inkHex(ink){if(!ink)return 'transparent';const [h,s,l]=inkHsl(ink);return `hsl(${h} ${s}% ${l}%)`}
function inkFx(ink){const t=norm((ink?.effect||'')+' '+(ink?.hue||'')+' '+(ink?.family||''));return /shimmer|쉬머|펄/.test(t)?'shimmer':/sheen/.test(t)?'sheen':/shading/.test(t)?'shade':''}
function penBodyColor(p){
 const t=norm((p?.name||'')+' '+(p?.brand||''));
 if(/gold|골드/.test(t))return '#b9954f';if(/silver|실버|steel|스틸|chrome|크롬|titanium|티타늄/.test(t))return '#a8aeb6';
 if(/white|화이트|pearl|펄|ivory/.test(t))return '#e8e4dc';if(/clear|demonstrator|투명|crystal|skeleton/.test(t))return '#cfd7dd';
 if(/orange|오렌지/.test(t))return '#d4692c';if(/yellow|옐로/.test(t))return '#e0b53c';
 return {blue:'#2b4c8c',green:'#2f6b4f',red:'#8c2635',brown:'#7a4e2d',purple:'#5b3e86',black:'#232327'}[getColor(t)]||'#232327';
}
const PEN_ART='<svg class="pen-art" viewBox="0 0 240 48" aria-hidden="true"><rect x="8" y="14" width="146" height="20" rx="10" style="fill:var(--body)"/><rect x="10" y="16" width="140" height="5" rx="2.5" fill="#fff" opacity=".22"/><rect x="22" y="9" width="66" height="5" rx="2.5" fill="#c6a15b"/><rect x="122" y="14" width="4" height="20" fill="#c6a15b"/><rect x="154" y="17" width="24" height="14" rx="3" fill="#1d1d20"/><path d="M178 16.5 224 24 178 31.5z" fill="#d2b06a"/><path d="M184 24h34" stroke="#8a6a2e" stroke-width="1"/><circle cx="228" cy="24" r="4.5" style="fill:var(--c-ink)"/></svg>';
function drawPalette(){
 const el=document.getElementById('uiPalette');if(!el)return;
 const list=db.inks.map(i=>({i,c:inkHsl(i)})).sort((a,b)=>{const g=x=>x.c[1]<15?400+x.c[2]:x.c[0]+(x.c[0]<12?360:0);return g(a)-g(b)||a.c[2]-b.c[2]});
 el.innerHTML=list.map(({i})=>`<i style="background:${inkHex(i)}" title="${esc(i.brand+' · '+i.name)}"></i>`).join('');
}

/* v2.1: colour for the ink named on a pen record. Exact record -> fuzzy record -> colour words in the name -> none. Display only. */
const WORD_COLORS=[
 [/blue ?black|블루 ?블랙/i,[222,34,21]],[/navy|네이비/i,[223,44,23]],[/turquoise|teal|터콰이즈|청록/i,[186,68,41]],
 [/emerald|emeraude|에메랄드/i,[154,58,35]],[/olive|올리브/i,[70,32,34]],[/green|vert|verde|그린|초록/i,[145,42,34]],
 [/burgundy|bordeaux|버건디|와인/i,[345,54,28]],[/orange|arancio|오렌지/i,[24,84,52]],[/yellow|giallo|옐로/i,[47,84,55]],
 [/red|rosso|rouge|레드|빨강/i,[355,68,45]],[/violet|viola|purple|lavender|라벤더|퍼플|보라/i,[270,44,38]],[/pink|rose|핑크|분홍/i,[336,52,62]],
 [/brown|tabacco|tobacco|sepia|브라운|갈색|세피아/i,[25,44,31]],[/grey|gray|그레이|회색/i,[215,8,46]],
 [/kosumosu|cosmos|코스모스/i,[336,52,62]],[/rikyu|리큐/i,[62,24,36]],[/coral|코랄/i,[9,70,63]],[/black|nero|noir|블랙|검정/i,[220,8,13]],[/blue|blu|bleu|블루|파랑/i,[220,62,44]]
];
function inkTokens(s){return String(s||'').normalize('NFKC').toLowerCase().split(/[^a-z0-9가-힣぀-ヿ一-鿿]+/).filter(t=>t.length>=2)}
function fuzzyInkForPen(p){
 const pt=new Set(inkTokens(p.inkName)),pb=norm(p.inkBrand);
 const sub=(a,b)=>a.length&&a.every(x=>b.has(x));
 let c=pt.size?db.inks.filter(i=>{const t=inkTokens(i.name);return sub(t,pt)||sub([...pt],new Set(t))}):[];
 if(c.length>1){const cb=c.filter(i=>{const b=norm(window.engBrand?engBrand(i.brand):i.brand),k=norm(i.brand);return b&&pb&&(b.includes(pb)||pb.includes(b)||k.includes(pb)||pb.includes(k))});if(cb.length)c=cb}
 if(c.length>1){const m=Math.max(...c.map(i=>inkTokens(i.name).length));c=c.filter(i=>inkTokens(i.name).length===m)}
 return c.length===1?c[0]:null;
}
function penInkColor(p){
 if(!p||!p.inkName||p.inkName==='—')return {hex:'transparent',how:''};
 const m=matchingInk(p);if(m)return {hex:inkHex(m),how:'exact'};
 const f=fuzzyInkForPen(p);if(f)return {hex:inkHex(f),how:'match'};
 const w=WORD_COLORS.find(([re])=>re.test(p.inkName)||re.test(p.inkBrand+' '+p.inkName));
 if(w)return {hex:`hsl(${w[1][0]} ${w[1][1]}% ${w[1][2]}%)`,how:'guess'};
 return {hex:'transparent',how:'none'};
}
function penDotHtml(p){
 const c=penInkColor(p);if(!c.how)return '';
 const cls=c.how==='guess'?' approx':c.how==='none'?' none':'',t=c.how==='guess'?' title="이름에서 추정한 색"':c.how==='none'?' title="색 정보 없음"':'';
 return `<i class="dot${cls}" style="--c-ink:${c.hex}"${t}></i>`;
}

const SEED={"inks":[],"pens":[]};
const MASTER_VOLUME={};
const RESEARCH_V16={}; // 공개판: 내장 조사 자료 없음 (카탈로그는 5단계, 출처 정리는 7단계)
// Personal inventory is authoritative; unknown inks are eligible for ranking, never fake-review graded.
let researchInitialized=false;
function researchFor(ink){
 if(!ink)return null;
 if(RESEARCH_V16[ink.id])return RESEARCH_V16[ink.id];
 const extraIndex=db.inks.filter(x=>!RESEARCH_V16[x.id]).findIndex(x=>x.id===ink.id);
 return {id:ink.id,no:1+Math.max(0,extraIndex),brand:ink.brand,brandOriginal:ink.brand,
  name:ink.name,family:ink.family||'미분류',hue:ink.hue||'미확인',effect:ink.effect||'미확인',
  legacyFlow:ink.flow||'미확인',flow:null,drySeconds:null,shading:null,sheen:null,
  copyPaper:null,water:null,lubrication:null,source:'',sourceType:'사용자 직접 등록',
  reviewConditions:'',reviewSummary:'새로 보유 목록에 등록한 잉크입니다. 개별 리뷰 검증은 아직 진행하지 않았습니다.',
  sourceVerification:'user-added',grade:'D',status:'신규 등록 · 물성 미확인',anomalies:''};
}
function getResearchRows(){
 return sortedCollection(db.inks.map(ink=>{const r=researchFor(ink);return r?{...r,brand:ink.brand||r.brand,name:ink.name||r.name}:null;}).filter(Boolean));
}
function refreshResearchViews(){
 if(!researchInitialized)return;
 RESEARCH_ROWS=getResearchRows();
 refreshResearchBrandSelect();refreshResearchStats();drawResearch();
 if(researchCurrentDetailId&&db.inks.some(i=>i.id===researchCurrentDetailId))showResearchDetail(researchCurrentDetailId);
 else if(researchCurrentDetailId){researchCurrentDetailId=null;$('researchDetail').textContent='잉크를 선택하면 리뷰 근거를 볼 수 있습니다.';}
}
function updateLiveCounts(){
 document.querySelectorAll('.liveInkCount').forEach(e=>e.textContent=db.inks.length);
}
function selectNewRegistration(kind,id){
 $('direction').value=kind==='pen'?'pen':'ink';refreshTarget();$('target').value=id;
 openTab('match');recommendations();
}
function showNewRegistration(kind,id){
 const el=$(kind==='pen'?'newPenNotice':'newInkNotice');
 el.hidden=false;
 const noun=kind==='pen'?'만년필':'잉크';
 el.innerHTML=`<strong>${noun} 등록 완료.</strong> 추천·잉입·시필 목록에 바로 반영했습니다. <button class="btn secondary" type="button" id="viewRegistered${kind}">등록한 ${noun}로 추천 보기</button>`;
 $('viewRegistered'+kind).addEventListener('click',()=>selectNewRegistration(kind,id),{once:true});
 if(kind==='ink'){el.insertAdjacentHTML('beforeend',' <button class="btn outline" id="editRegisteredInk" type="button">새 잉크 상세정보 입력</button>');$('editRegisteredInk').addEventListener('click',()=>openInkDetailEditor(id),{once:true});}
}

const KEY='pil_pen_ink_lab_v01'; // 동일한 저장 키로 이전 버전 기록을 이어받습니다.
const freshSeed=()=>JSON.parse(JSON.stringify(SEED));
let storageAvailable=true,db;
try { const test='__pil_storage_test__';localStorage.setItem(test,'1');localStorage.removeItem(test);db=JSON.parse(localStorage.getItem(KEY))||freshSeed(); }
catch(e){storageAvailable=false;db=freshSeed();}
if(!db||!Array.isArray(db.inks)||!Array.isArray(db.pens))db=freshSeed();
if(!Array.isArray(db.history))db.history=[];
if(!Array.isArray(db.testReviews))db.testReviews=[];
// v0.9 migration: augment existing saved inks by stable initial master id.
for (const i of db.inks){ const known=MASTER_VOLUME[i.id];
 if(i.packageType===undefined)i.packageType=known?.packageType||'unknown';
 if(i.capacityMl===undefined)i.capacityMl=known?.capacityMl??null;
 if(i.remainingMl===undefined)i.remainingMl=null;
 if(i.volumeSource===undefined)i.volumeSource=known?.volumeSource||'사용자 미입력';
}
// v0.3: migration does not silently turn historical entries into verified current fills.
for(const p of db.pens){if(!p.fillVerified){p.fillVerified=false;}if(!p.fillDate)p.fillDate='';}
const $=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=()=>{safeLocalWrite(JSON.stringify(db));updateCounts();markSaved()};
function showStorageWarning(){const el=document.getElementById('storageWarning');if(el)el.hidden=storageAvailable;}
// Browsers that block localStorage (for example embedded previews) must never prevent
// a stored state from loading or saving.
function safeLocalRead(){try{return localStorage.getItem(KEY)}catch(e){storageAvailable=false;showStorageWarning();return null}}
function safeLocalWrite(value){try{localStorage.setItem(KEY,value);storageAvailable=true;showStorageWarning();return true}catch(e){storageAvailable=false;showStorageWarning();return false}}
function showRuntimeError(message){const el=document.getElementById('runtimeError');if(el){el.hidden=false;el.textContent='실행 오류: '+message+' · Chrome 또는 Safari에서 파일을 직접 열어주세요.';}}
window.addEventListener('error',e=>showRuntimeError(e.message||'알 수 없는 오류'));
window.addEventListener('unhandledrejection',e=>showRuntimeError(String(e.reason||'알 수 없는 오류')));
const norm=s=>String(s||'').toLowerCase().replace(/[\s·\-_.]/g,'');
// v1.8.1: Korean/English natural ascending order. Sort *copies*, not source arrays:
// ID-based relationships, user history, and cloud revision data retain their original identities.
const collectionCollator=new Intl.Collator('ko-KR',{numeric:true,sensitivity:'base',ignorePunctuation:true});
const compareCollection=(a,b)=>
 collectionCollator.compare(String(a.brand||''),String(b.brand||''))||
 collectionCollator.compare(String(a.name||''),String(b.name||''))||
 collectionCollator.compare(String(a.nib||''),String(b.nib||''))||
 collectionCollator.compare(String(a.id||''),String(b.id||''));
const sortedCollection=items=>[...items].sort(compareCollection);

function addSelect(id,arr){const el=$(id),prev=el.value;el.innerHTML=sortedCollection(arr).map(x=>`<option value="${esc(x.id)}">${esc(x.brand+' · '+x.name+(x.nib?' ('+x.nib+')':''))}</option>`).join('');if(arr.some(x=>x.id===prev))el.value=prev}
function refresh(){const selected={hPen:$('hPen').value,hInk:$('hInk').value,cPen:$('cPen').value,cInk:$('cInk').value};updateCounts();addSelect('hPen',db.pens);addSelect('hInk',db.inks);addSelect('cPen',db.pens);addSelect('cInk',db.inks);addSelect('vInk',db.inks);refreshDetailInkSelectors();for(const [key,val] of Object.entries(selected)){if(val&&Array.from($(key).options).some(o=>o.value===val))$(key).value=val}refreshTarget();drawPens();drawInks();drawHistory();renderCurrentPenOptions();showCurrentPenDetails();drawCurrent();drawSelectionStates();syncInventoryFields();updateHistoryUI();updateTestSelects();drawTestReviews();updateLiveCounts();refreshResearchViews();refreshRecBrandOptions();for(const id of penInkSearchIds){if(quickSearchInputs[id])renderQuickPicker(id)}if(!$('inkMatchEditor').hidden){const old=$('imPen').value;addSelect('imPen',db.pens);addSelect('imOtherInk',db.inks);if(db.pens.some(p=>p.id===old))$('imPen').value=old;updateInkMatchEditPreview()}
 if(window.PIL&&PIL.onRefresh)PIL.onRefresh();}
// Confirmed fill counts are derived from the existing pen state, never stored redundantly.
// Preserve distinct registered ink ids, but keep historical/renamed ink text visible too.
function currentUsageStats(){
 const filled=db.pens.filter(p=>penFillState(p)==='filled');
 const uncertain=db.pens.filter(p=>penFillState(p)==='uncertain');
 function groupByInk(pens){
  const byInk=new Map();let needsInkName=0;
  for(const p of pens){
   const name=String(p.inkName||'').trim();
   if(!name||['—','-','미잉입','없음'].includes(name)){needsInkName++;continue;}
   const brand=String(p.inkBrand||'').trim();
   const keyName=norm(name),keyBrand=norm(brand);
   const exact=db.inks.find(i=>norm(i.brand)===keyBrand&&norm(i.name)===keyName);
   const nameMatches=exact?[]:db.inks.filter(i=>norm(i.name)===keyName);
   const ink=exact||(nameMatches.length===1?nameMatches[0]:null);
   const key=ink?'id:'+ink.id:'name:'+keyBrand+'|'+keyName;
   const label=ink?ink.brand+' · '+ink.name:(brand?brand+' · ':'')+name;
   const existing=byInk.get(key);
   if(existing)existing.count++;
   else byInk.set(key,{key,label,count:1,registered:!!ink});
  }
  return {needsInkName,breakdown:[...byInk.values()].sort((a,b)=>b.count-a.count||collectionCollator.compare(a.label,b.label))};
 }
 const confirmed=groupByInk(filled), historic=groupByInk(uncertain);
 return {filledPens:filled.length,distinctInks:confirmed.breakdown.length,uncertainPens:uncertain.length,
  historicDistinctInks:historic.breakdown.length,needsInkName:confirmed.needsInkName,
  historicUnlabeled:historic.needsInkName,breakdown:confirmed.breakdown,historicBreakdown:historic.breakdown};
}
function inkUsageTable(items,description){
 return items.length?'<table><thead><tr><th>'+esc(description)+'</th><th>만년필 수</th></tr></thead><tbody>'+items.map(x=>'<tr><td>'+esc(x.label)+(x.registered?'':' <span class="tag warn">보유 목록과 명칭 미연결</span>')+'</td><td>'+x.count+'자루</td></tr>').join('')+'</tbody></table>':'<div class="empty">표시할 기록이 없습니다.</div>';
}
function updateCounts(){
 const usage=currentUsageStats();
 $('penCount').textContent=db.pens.length;
 $('inkCount').textContent=db.inks.length;
 $('fillCount').textContent=usage.filledPens;
 $('activeInkCount').textContent=usage.distinctInks;
 $('legacyPenCount').textContent=usage.uncertainPens;
 $('legacyInkCount').textContent=usage.historicDistinctInks;
 $('currentFilledPens').textContent=usage.filledPens;
 $('currentDistinctInks').textContent=usage.distinctInks;
 $('currentUncertainPens').textContent=usage.uncertainPens;
 $('currentHistoricInks').textContent=usage.historicDistinctInks;
 const note='확인된 현재 잉입: 만년필 '+usage.filledPens+'자루 · 잉크 '+usage.distinctInks+'종. '+
  '과거 기록(현재 미확인): 만년필 '+usage.uncertainPens+'자루 · 잉크 '+usage.historicDistinctInks+'종. '+
  '같은 잉크는 한 종류로 세며, 과거 기록의 잉크명 표기 차이에 따라 중복될 수 있습니다.';
 $('currentUsageExplanation').textContent=note+(usage.needsInkName?' ※ 현재 잉입 확인 '+usage.needsInkName+'자루는 잉크명이 비어 있습니다.':'');
 $('currentInkBreakdown').innerHTML=inkUsageTable(usage.breakdown,'현재 사용 잉크');
 $('historicInkBreakdown').innerHTML=inkUsageTable(usage.historicBreakdown,'과거 기록 잉크 (현재 미확인)');
}

function refreshTarget(){let pen=$('direction').value==='pen';$('targetLabel').textContent=pen?'만년필 선택':'잉크 선택';addSelect('target',pen?db.pens:db.inks);refreshRecBrandOptions()}
function getColor(txt){txt=norm(txt);if(/blue|navy|azure|sapphire|aqua|블루|청|남색|파랑/.test(txt))return'blue';if(/green|olive|cypress|jade|forest|그린|녹|초록|올리브|비취/.test(txt))return'green';if(/red|burgundy|coral|rose|scarlet|레드|적|빨강|버건디|코랄/.test(txt))return'red';if(/brown|amber|gold|yellow|tortoise|cappuccino|브라운|갈색|황금|호박|옐로|노랑|골드/.test(txt))return'brown';if(/purple|violet|pink|lavender|보라|핑크|분홍/.test(txt))return'purple';if(/black|grey|gray|silver|블랙|검정|회색|실버/.test(txt))return'black';return''}
function inkColor(ink){return getColor(ink.family+' '+ink.hue+' '+ink.name)}
function risk(ink){let s=norm(ink.effect+' '+ink.flow);return /shimmer|glitter|펄|쉬머/.test(s)?'high':/sheen/.test(s)?'medium':'low'}
// v1.3: No measured viscosity or surface tension is inferred from shorthand labels.
const EAST_ASIAN_PENS=/^(pilot|platinum|sailor|nagasawa|namiki|세일러|파이롯트|플래티넘|나가사와|wancher|wancher)/i;
const WESTERN_PENS=/^(montblanc|pelikan|parker|lamy|visconti|aurora|leonardo|montegrappa|esterbrook|graf von faber|kaweco|waterman|sheaffer|sha[f]?fer)/i;
function nibClass(p){const n=norm(p.nib);if(/uef|sef|po|xf|(^|\W)ef/.test(n)||n==='ef')return 'ultrafine';if(/(^|\W)f$|^f$|^mf$|^fm$|keiryuf/.test(n))return 'fine';if(/stub|music|fa|flex/.test(n))return 'special';if(/^m$|中字|^b$|^bb$/.test(n))return 'medium';return 'unknown'}
function penProfile(p){
 const brand=String(p.brand||''),nib=nibClass(p);
 const region=EAST_ASIAN_PENS.test(brand)?'east':WESTERN_PENS.test(brand)?'west':'unknown';
 const userWet=Number(p.feedWetness); // optional, -2..2, only if explicitly set
 const wetness=Number.isFinite(userWet)&&p.feedWetness!==undefined&&userWet>=-2&&userWet<=2?userWet:null;
 return {region,nib,wetness,conf:wetness===null?0:1};
}

// v1.9.3: Personal observations are kept independent from immutable research data.
function validNumberOrNull(x,max=600){if(x===''||x===null||x===undefined)return null;const n=Number(x);return Number.isFinite(n)&&n>=0&&n<=max?n:null;}
function flowToSupply(flow){const f=String(flow||'');if(f==='매우 풍부'||f==='풍부')return 1;if(f==='보통~풍부')return .65;if(f==='보통')return 0;if(f==='약간 건조')return -.65;if(f==='건조')return -1;return null;}
function inkHandOnForPen(ink,pen){const d=ink?.userEvidence?.handsOn;return d?.confirmed===true&&pen&&d.penId===pen.id?d:null;}
function inkCheckedExternal(ink){const e=ink?.userEvidence?.external;return e?.checked===true&&typeof e.url==='string'&&/^https:[/][/]/i.test(e.url)?e:null;}
function inkComparisonFlow(ink,pen){const h=inkHandOnForPen(ink,pen);return h?.flow?`${h.flow} (직접 시필: 해당 펜)`:researchFor(ink)?.flow||inkCheckedExternal(ink)?.flow&&`${inkCheckedExternal(ink).flow} (사용자 확인 외부 리뷰)`||'미확인';}
function inkComparisonLubrication(ink,pen){const h=inkHandOnForPen(ink,pen);return h?.lubrication!==''&&h?.lubrication!==undefined?`${h.lubrication} (직접 시필)`:researchFor(ink)?.lubrication||'미측정';}
function inkComparisonDry(ink,pen){const h=inkHandOnForPen(ink,pen),v=researchFor(ink);return h?.drySeconds!==null&&h?.drySeconds!==undefined?`${h.drySeconds}초 (직접 시필)`:v?.drySeconds!=null?`${v.drySeconds}초 (외부 리뷰)`:inkCheckedExternal(ink)?.drySeconds!=null?`${inkCheckedExternal(ink).drySeconds}초 (사용자 확인 리뷰)`:'미확인';}
function renderInkUserEvidence(ink,pen){const d=ink?.userEvidence;if(!d)return '';
 const h=d.handsOn||{},e=d.external||{};
 const obs=(h.confirmed?'직접 시필 확인':h.notes||h.flow?'직접 시필 메모(미확인)':'기록 없음');
 const matched=!!(pen&&h.penId===pen.id&&h.confirmed);
 const penName=db.pens.find(p=>p.id===h.penId);
 const testPen=penName?penName.brand+' '+penName.name+' '+penName.nib:'펜 미지정';
 const extStatus=e.checked?'사용자 원문 확인(독립 검증 전)':'출처·참고 메모(미검증)';
 return `<div class="evidence-boundary" style="margin-top:9px"><b>개인 상세 정보 · 내 기록</b><div><strong>직접 시필:</strong> ${esc(obs)} · ${esc(testPen)}${matched?' · 현재 비교 만년필과 일치':''} · 흐름 ${esc(h.flow||'미입력')} · 윤활 ${esc(h.lubrication??'미입력')} · 건조 ${h.drySeconds==null?'미측정':esc(h.drySeconds)+'초'} · 종이 ${esc(h.paper||'미입력')}</div><div><strong>외부 리뷰:</strong> ${esc(extStatus)} · 흐름 ${esc(e.flow||'미확인')} · 건조 ${e.drySeconds==null?'미측정':esc(e.drySeconds)+'초'} · 출처 ${esc(e.author||'미입력')}</div>${/^https:[/][/]/i.test(e.url||'')?`<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">사용자 기록 외부 리뷰 열기</a>`:''}</div>`;
}

function inkProfile(i,pen=null){
 const ev=researchFor(i),eff=norm(i.effect);
 const verifiedHandOn=inkHandOnForPen(i,pen);
 const checkedExternal=inkCheckedExternal(i);
 let supply=null,quality='unknown';
 const f=String(ev?.flow||'').trim();
 if(f==='매우 풍부'||f==='풍부'||f==='보통~풍부'||f==='보통보다 풍부')supply=f==='보통~풍부'?.65:1;
 else if(f==='보통')supply=0;
 else if(f==='약간 건조')supply=-.65;
 else if(f==='건조')supply=-1;
 if(supply!==null)quality=ev?.sourceVerification==='rechecked'?'review_rechecked':'review_prior';
 if(supply===null&&checkedExternal){
  const userReviewFlow=flowToSupply(checkedExternal.flow);
  if(userReviewFlow!==null){supply=userReviewFlow;quality='user_checked_external';}
 }
 if(verifiedHandOn){
  const observedSupply=flowToSupply(verifiedHandOn.flow);
  if(observedSupply!==null){supply=observedSupply;quality='user_hands_on_matching_pen';}
 }
 const shimmer=/shimmer|glitter|펄|쉬머/.test(eff+' '+norm(i.flow));
 const sheen=/sheen|테\b|광택/.test(eff)||!!(ev?.sheen&&ev.sheen!=='없음')||!!(verifiedHandOn?.sheen&&verifiedHandOn.sheen!=='없음');
 const shading=/shading|농담/.test(eff)||!!(ev?.shading&&ev.shading!=='없음')||!!(verifiedHandOn?.shading&&verifiedHandOn.shading!=='없음');
 // Explicit numeric user experiments only. Unknown viscosity/lubrication never inferred from review flow.
 const feather=verifiedHandOn&&[0,1,2].includes(Number(verifiedHandOn.feather))&&verifiedHandOn.feather!==''?Number(verifiedHandOn.feather):typeof i.feathering==='number'&&i.feathering>=-2&&i.feathering<=2?i.feathering:null;
 const lubrication=verifiedHandOn&&verifiedHandOn.lubrication!==''&&Number.isFinite(Number(verifiedHandOn.lubrication))?Number(verifiedHandOn.lubrication):typeof i.lubrication==='number'&&i.lubrication>=-2&&i.lubrication<=2?i.lubrication:null;
 const viscosity=typeof i.viscosityCp==='number'&&i.viscosityCp>0?i.viscosityCp:null;
 const surfaceTension=typeof i.surfaceTensionMnM==='number'&&i.surfaceTensionMnM>0?i.surfaceTensionMnM:null;
 return {supply,quality,shimmer,sheen,shading,feather,lubrication,viscosity,surfaceTension,verifiedHandOn,checkedExternal};
}
const hasNum=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
function calcBase(pen,ink,priority){
 const pp=penProfile(pen),ip=inkProfile(ink,pen),why=[],warnings=[];
 const adjust={balance:[1,1,1,1],fine:[1.6,.4,1.1,.4],color:[.55,1.7,.75,.7],sheen:[.8,.65,.7,1.7],care:[1,.35,1.7,.4]}[priority]||[1,1,1,1];
 let s=58, evidence=0;
 // Actual pen feed measurements/ratings override a maker-country heuristic.
 let penWet=pp.wetness;
 if(penWet===null){if(pp.region==='east'&&(pp.nib==='ultrafine'||pp.nib==='fine'))penWet=-.55;
 else if(pp.region==='west'&&(pp.nib==='ultrafine'||pp.nib==='fine'))penWet=.35;
 else penWet=0;
 if(pp.region!=='unknown')why.push('제조사·닙 경향만 반영(개별 피드 미측정)');}
 else {evidence+=24;why.push('사용자 입력 피드 흐름 반영')}
 if(pp.nib!=='unknown')evidence+=12;else warnings.push('닙 유형 미확인');
 if(pp.region!=='unknown')evidence+=6;else warnings.push('제조사별 기본 닙 경향 자료 없음');
 if(ip.supply!==null){
   evidence+=16;
   const effective=penWet+ip.supply*.9;
   if(pp.nib==='ultrafine'||pp.nib==='fine'){
     if(effective>1.05){s-=Math.round((effective-1)*17*adjust[0]);warnings.push('가는 선 유지 주의: 잉크 공급이 풍부할 가능성');}
     else if(effective < -1.15){s-=Math.round((-1.15-effective)*16*adjust[0]);warnings.push('가는 닙에서 흐름 부족 가능성');}
     else {s+=Math.round((8-Math.abs(effective-.05)*6)*adjust[0]);why.push('가는 닙에 무난한 공급량 추정')}
     if(pp.region==='east'&&ip.supply===1&&pp.wetness===null)why.push('일본산 가는 닙: 풍부한 잉크도 후보');
     if(pp.region==='west'&&ip.supply===1&&pp.wetness===null)warnings.push('유럽산 가는 닙: 실제 선폭 시필 권장');
   } else {s+=Math.round((7-Math.abs(effective-.35)*5)*adjust[0]);why.push('닙과 흐름의 기본 적합성')}
   why.push(ip.quality==='user_hands_on_matching_pen'?'직접 시필 흐름(해당 만년필)':ip.quality==='user_checked_external'?'사용자가 원문 확인한 외부 리뷰(독립 재검증 전)':ip.quality==='review_rechecked'?'개별 리뷰 흐름(원문 재확인)':'개별 리뷰 흐름(이전 조사·재확인 대기)');
 }else{warnings.push('잉크 공급·흐름 데이터 미확인');}
 if(ip.feather!==null){evidence+=16;s-=Math.max(0,ip.feather)*9*adjust[0];if(ip.feather>0)warnings.push('종이에서 퍼짐/번짐 주의');else why.push('종이상 번짐 경험 반영')}
 else warnings.push('종이별 퍼짐 정보 미확인');
 if(ip.lubrication!==null){evidence+=10;s+=Math.round(ip.lubrication*4*adjust[0]);why.push('윤활감 평가 반영')}
 if(ip.shimmer){s-=19*adjust[2];warnings.push('펄/쉬머: 피드 막힘·세척 주의')}
 else {s+=3*adjust[2]}
 if(ip.sheen){s-=3*adjust[2];s+=4*adjust[3];why.push('광택(sheen) 표시')}
 if(ip.shading){s+=4*adjust[3];why.push('농담(shading) 표시')}
 // Color is secondary and *never* rewarded in ink-to-pen direction by default.
 const isPenDirection=$('direction').value==='pen';
 const explicitColor=$('colorHint').value;
 if(isPenDirection&&explicitColor!=='any'){
   const penColor=explicitColor||getColor(pen.brand+' '+pen.name),inkC=inkColor(ink);
   if(penColor&&inkC&&penColor===inkC){s+=5*adjust[1];why.push('색상 조화(보조 점수)')}
 }
 const matches=db.history.filter(h=>h.penId===pen.id&&h.inkId===ink.id);
 const rated=[...matches].reverse().find(h=>h.rating==='좋음'||h.rating==='별로');
 if(rated){evidence+=22;if(rated.rating==='좋음'){s+=12;why.push('실제 사용 평가: 좋음')}else{s-=16;warnings.push('실제 사용 평가: 별로')}}
 if(ip.viscosity!==null||ip.surfaceTension!==null){evidence+=7;why.push('물성 실측값 기록 있음(수치 모델 검증 전)')}
 else warnings.push('점도·표면장력 실측값 없음');
 // v1.4 personal actual-test feedback. Reviews are per pen-ink combination, not ink-wide generalizations.
 const observed=(db.testReviews||[]).filter(r=>r.penId===pen.id&&r.inkId===ink.id&&r.evidence==='hands-on'&&[r.rating,r.width,r.smooth,r.feather,r.flow].some(hasNum));
 if(observed.length){
   const recent=[...observed].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,5);
   let sum=0, count=0;
   const targetWidth=pp.nib==='ultrafine'?2:pp.nib==='fine'?2.6:3;
   for(const r of recent){
     let points=0,dimensions=0;
     if(Number.isFinite(Number(r.rating))&&r.rating!==null){points+=(Number(r.rating)-3)*3;dimensions++}
     if(hasNum(r.width)){points-=Math.abs(Number(r.width)-targetWidth)*1.7;dimensions++}
     if(hasNum(r.smooth)){points+=(Number(r.smooth)-3)*1.15;dimensions++}
     if(hasNum(r.feather)){points-=Number(r.feather)*3;dimensions++}
     if(hasNum(r.flow)){points-=Math.abs(Number(r.flow)-3.3)*.9;dimensions++}
     if(dimensions){sum+=points;count++}
   }
   if(count){const adjustment=Math.max(-12,Math.min(12,(sum/count)*(1+Math.min(.35,(count-1)*.12))));s+=adjustment;evidence+=Math.min(27,13+count*3);why.push(`직접 시필 ${count}건 반영 (${adjustment>=0?'+':''}${adjustment.toFixed(1)}점)`);if(adjustment<=-5)warnings.push('실제 시필에서 부적합 징후 관찰');}
 }
 let certainty=(researchFor(ink)?.sourceVerification==='rechecked'?55:researchFor(ink)?.sourceVerification==='previous'?38:14);
 if(ip.verifiedHandOn)certainty+=16;else if(ip.checkedExternal)certainty+=7;
 if(pp.wetness!==null)certainty+=8;
 if(observed.length)certainty+=Math.min(25,8+observed.length*4);
 certainty=Math.min(90,certainty);
 return {score:Math.min(95,Math.max(8,Math.round(s))),certainty,why,warnings};
}
 function diversityFamily(r,isPen){if(!isPen)return norm(r.pen.brand)||'unknown';return inkColor(r.ink)||norm(r.ink.family)||'미분류'}
 function chooseBalanced(ranked,isPen,limit=10){
  if(!ranked.length)return [];
  const picked=[],seen=new Set(),brandCount=new Map(),familyCount=new Map(),best=ranked[0].score;
  function attempt(maxDrop,brandCap,familyCap){
   for(const r of ranked){
    if(picked.length>=limit)break;
    if(seen.has(r.item.id)||best-r.score>maxDrop)continue;
    const brand=norm(r.item.brand)||'unknown',family=diversityFamily(r,isPen);
    if((brandCount.get(brand)||0)>=brandCap||(familyCount.get(family)||0)>=familyCap)continue;
    picked.push(r);seen.add(r.item.id);brandCount.set(brand,(brandCount.get(brand)||0)+1);familyCount.set(family,(familyCount.get(family)||0)+1)
   }
  }
  // Suitable candidates first; only relax the limits if the relevant collection is small.
  attempt(12,2,3);attempt(18,3,4);attempt(Infinity,2,3);attempt(Infinity,Infinity,Infinity);
  return picked;
 }
 function safeMl(x){if(x===null||x===undefined||x==='')return null;const n=Number(x);return Number.isFinite(n)&&n>=0?n:null}
function mlText(x){const n=safeMl(x);return n===null?'미확인':`${n} mL`}
function inventoryText(i){const type=i.packageType==='sample'?'소분':i.packageType==='bottle'?'본병':i.packageType==='cartridge'?'카트리지':'형태 미확인';return `${type} · 보유 ${mlText(i.capacityMl)} · 잔량 ${mlText(i.remainingMl)}`}
function purchaseHint(i){
 const remaining=safeMl(i.remainingMl),capacity=safeMl(i.capacityMl);
 if(remaining===0)return '잔량 0mL · 재구매 검토';
 if(remaining!==null&&remaining<=2)return `잔량 ${remaining}mL · 추가 구매 검토`;
 if(i.packageType==='sample')return '소분 잉크 · 시필 후 본병 구매 검토';
 if(i.packageType==='unknown')return '보유 형태·용량 확인 필요';
 if(capacity!==null&&remaining===null)return '잔량 미확인';
 return '';
}
function syncInventoryFields(){const el=$('vInk');if(!el)return;const i=db.inks.find(x=>x.id===el.value);if(!i)return;$('vPackage').value=i.packageType||'unknown';$('vCapacity').value=i.capacityMl??'';$('vRemaining').value=i.remainingMl??'';$('inventoryHint').textContent=purchaseHint(i)||'추가 구매 알림 없음'}
$('vInk').addEventListener('change',syncInventoryFields);
$('saveInventory').onclick=()=>{const i=db.inks.find(x=>x.id===$('vInk').value);if(!i)return;const c=safeMl($('vCapacity').value),r=safeMl($('vRemaining').value);if($('vCapacity').value!==''&&c===null||$('vRemaining').value!==''&&r===null)return alert('용량과 잔량은 0 이상의 수치로 입력하세요.');if(c!==null&&r!==null&&r>c)return alert('잔량이 보유 용량을 초과할 수 없습니다. 본병이 여러 개라면 합산 용량을 입력하세요.');i.packageType=$('vPackage').value;i.capacityMl=c;i.remainingMl=r;i.volumeSource='사용자 입력 '+localDate();save();refresh();alert('보유량을 저장했습니다. 추천 화면에도 반영됩니다.')};
$('inkRows').addEventListener('click',e=>{const b=e.target.closest('[data-editinventory]');if(!b)return;$('vInk').value=b.dataset.editinventory;syncInventoryFields();$('inkInventoryEdit').scrollIntoView({behavior:'smooth',block:'start'})});

// 동점 순서: 만년필(seed)마다 다른 고정 순서. FNV-1a 뒤에 murmur3 마무리(avalanche)를 더해 seed의 마지막 글자만 달라도 순서가 충분히 섞이게 함.
function tieOrder(id,seed){let x=2166136261;for(const c of String(id)+'/'+String(seed)){x=Math.imul(x^c.charCodeAt(0),16777619)}x^=x>>>16;x=Math.imul(x,2246822507);x^=x>>>13;x=Math.imul(x,3266489909);x^=x>>>16;return x>>>0}
// v1.9: separate estimated matching, evidence coverage, discovery diversity, and manual choice.
let latestRecommendationRows=[];
let candidateCompareKeys=new Set();
let candidateDisplayTarget='';

function comparableBrand(x,isPen=true){
 const ink=isPen?x:null,ev=ink?researchFor(ink):null;
 const raw=String(ev?.brand||x.brand||'').trim();
 if(/montblanc|몽블랑/i.test(raw))return 'Montblanc';
 if(/nagasawa|kobe|고베/i.test(raw))return 'Nagasawa Kobe INK';
 if(/graf von faber|그라폰/i.test(raw))return 'Graf von Faber-Castell';
 return raw||'미분류';
}
function refreshRecBrandOptions(){
 const el=$('recBrand');if(!el)return;
 const penDirection=$('direction').value==='pen';
 const prev=el.value;
 const collection=penDirection?db.inks:db.pens;
 const groups=[...new Set(collection.map(x=>comparableBrand(x,penDirection)))].sort((a,b)=>a.localeCompare(b,'ko',{numeric:true,sensitivity:'base'}));
 el.innerHTML='<option value="all">전체 브랜드 · 별도 탐색 안 함</option>'+groups.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join('');
 el.value=groups.includes(prev)?prev:'all';
 $('recBrandLabel').textContent=penDirection?'잉크 브랜드별 탐색 (선택)':'만년필 브랜드별 탐색 (선택)';
}
function candidateHasEvidence(r){
 const v=researchFor(r.ink);
 const hasReview=Boolean(v&&(v.flow||v.reviewSummary||v.source)&&v.sourceVerification!=='user-added'&&v.status!=='개별 자료 미확보');
 const hasHandsOn=!!inkHandOnForPen(r.ink,r.pen)||(db.testReviews||[]).some(t=>t.penId===r.pen.id&&t.inkId===r.ink.id&&t.evidence==='hands-on');
 const hasLog=db.history.some(h=>h.penId===r.pen.id&&h.inkId===r.ink.id&&(h.rating==='좋음'||h.rating==='별로'));
 return hasReview||hasHandsOn||hasLog||!!inkCheckedExternal(r.ink);
}
function candidateEvidenceLabel(r){
 const v=researchFor(r.ink);
 const hasHandsOn=!!inkHandOnForPen(r.ink,r.pen)||(db.testReviews||[]).some(t=>t.penId===r.pen.id&&t.inkId===r.ink.id&&t.evidence==='hands-on');
 if(hasHandsOn)return '직접 시필';
 if(inkCheckedExternal(r.ink))return '사용자 확인 리뷰';
 if(v?.sourceVerification==='rechecked')return '원문 재확인';
 if(v?.sourceVerification==='previous')return '이전 조사 기록';
 if(db.history.some(h=>h.penId===r.pen.id&&h.inkId===r.ink.id&&(h.rating==='좋음'||h.rating==='별로')))return '기존 사용 기록';
 if(v?.sourceType==='제품 정보')return '제품 정보만';
 return '물성 미확인';
}
function candidateRiskLabel(r){
 const i=inkProfile(r.ink,r.pen);
 return i.shimmer?'쉬머: 관리 주의':i.sheen?'테: 종이별 확인':'특별한 관리 위험 미확인';
}
function selectVariedCandidates(pool,limit,used,reference=[]){
 const available=pool.filter(r=>!used.has(r.item.id));
 const selected=[];
 const brandCount=new Map(),colorCount=new Map();
 const countOne=r=>{
  const b=comparableBrand(r.item,$('direction').value==='pen');
  const c=$('direction').value==='pen'?inkColor(r.ink)||'기타':nibClass(r.pen);
  brandCount.set(b,(brandCount.get(b)||0)+1);
  colorCount.set(c,(colorCount.get(c)||0)+1);
 };
 for(const r of reference)countOne(r);
 while(selected.length<limit&&available.length){
  let bestI=0,bestWeight=-Infinity;
  for(let i=0;i<available.length;i++){
   const r=available[i],b=comparableBrand(r.item,$('direction').value==='pen');
   const c=$('direction').value==='pen'?inkColor(r.ink)||'기타':nibClass(r.pen);
   // Diversification is editorial selection, NOT a scientific match-score bonus.
   const weight= -19*(brandCount.get(b)||0) -10*(colorCount.get(c)||0)
      +Math.min(9,Math.max(-9,(r.score-58)*.18))
      - (tieOrder(r.item.id,'v19diverse')%100)/10000;
   if(weight>bestWeight){bestWeight=weight;bestI=i;}
  }
  const pick=available.splice(bestI,1)[0];
  selected.push(pick);used.add(pick.item.id);countOne(pick);
 }
 return selected;
}
function recCandidateCard(r,group,index){
 const v=researchFor(r.ink),label=candidateEvidenceLabel(r),key=r.pen.id+'|'+r.ink.id;
 const reviewed=!!(v?.flow||v?.source),known=label!=='물성 미확인'&&label!=='제품 정보만';
 const status=v?.status||'신규 등록 · 물성 미확인';
 const detail=v?`<div class="rec-facts"><div><strong>자료 상태:</strong> ${esc(status)} · <strong>신뢰 표시:</strong> ${esc(v.grade||'D')}</div><div><strong>흐름:</strong> ${esc(v.flow||'미확인')} · <strong>윤활:</strong> ${esc(v.lubrication||'미측정')} · <strong>건조:</strong> ${v.drySeconds===null||v.drySeconds===undefined?'미확인':esc(v.drySeconds)+'초 (해당 리뷰 조건)'}</div><div><strong>색조:</strong> ${esc(v.hue||r.ink.hue||'미확인')} · <strong>농담:</strong> ${esc(v.shading||'미확인')} · <strong>테:</strong> ${esc(v.sheen||'미확인')}</div><div><strong>복사용지:</strong> ${esc(v.copyPaper||'자료 없음')} · <strong>내수성:</strong> ${esc(v.water||'자료 없음')}</div><div><strong>시험 조건:</strong> ${esc(v.reviewConditions||'미확인')}</div><div><strong>관찰/주의:</strong> ${esc(v.reviewSummary||v.caution||'개별 리뷰를 확보하지 못했습니다.')}</div>${/^https:[/][/]/i.test(v.source||'')?`<a href="${esc(v.source)}" target="_blank" rel="noopener noreferrer">제품별 원문 자료</a>`:''}${renderInkUserEvidence(r.ink,r.pen)}</div>`:'';
 return `<article class="rec rec-candidate" data-candidate="${esc(key)}" data-fx="${inkFx(r.ink)}" style="--c-ink:${inkHex(r.ink)}"><div class="rc-tile"></div><div class="recTop"><h4>${esc((index+1)+'. '+r.item.brand+' · '+r.item.name)}</h4><div class="score">${r.score}<small>예상점수 /100</small></div></div>
  <div class="rec-tagline">${esc($('direction').value==='pen'?r.ink.family+' · '+(r.ink.hue||'색조 미확인'):'닙 '+r.pen.nib)} · ${esc(inventoryText(r.ink))}</div>
  <div><span class="tag">${esc(label)}</span><span class="tag">${esc(comparableBrand(r.ink,true))}</span>${!known?'<span class="tag warn">정보 부족 · 시필 판단 필요</span>':''}</div>
  ${recPensBlock(r)}<div class="rec-tagline"><b>추천 이유:</b> ${esc(r.why.slice(0,2).join(' · ')||'조건을 비교한 탐색 후보')}</div>
  <div class="rec-tagline"><b>주의:</b> ${esc([candidateRiskLabel(r),...r.warnings.slice(0,2)].join(' · '))}</div>
  <details><summary>물성·리뷰 근거 자세히</summary>${detail||'<p class="hint">아직 수집된 개별 잉크 물성 자료가 없습니다.</p>'}</details>
  <div class="rec-choice"><label><input type="checkbox" data-compare="${esc(key)}" ${candidateCompareKeys.has(key)?'checked':''} aria-label="${esc(r.item.brand+' '+r.item.name)} 비교함에 넣기"> 비교함에 담기</label><button class="btn secondary" type="button" data-pair="${esc(key)}" style="font-size:12px;padding:7px 9px">이 조합 선택</button></div></article>`;
}
function recGroup(title,subtitle,items,kind){
 return `<div class="rec-group ${esc(kind)}" aria-label="${esc(title)}"><div class="rec-group-header"><div><h3>${esc(title)} <span class="tag">${items.length}개</span></h3><p>${esc(subtitle)}</p></div></div>${items.length?`<div class="rec-group-body">${items.map((r,i)=>recCandidateCard(r,kind,i)).join('')}</div>`:'<div class="rec-empty">해당하는 후보가 없습니다.</div>'}</div>`;
}
function renderRecComparison(){
 const el=$('recComparison');if(!el)return;
 const found=latestRecommendationRows.filter(r=>candidateCompareKeys.has(r.pen.id+'|'+r.ink.id));
 if(found.length<2){el.innerHTML=`<h3>나의 최종 선택 · 비교함</h3><p class="hint">후보 카드를 2~6개 선택하면 흐름·발색·근거·주의 사항을 나란히 비교할 수 있습니다. 현재 ${found.length}개 선택됨.</p>`;return;}
 const compare=found.slice(0,6);
 el.innerHTML=`<div class="recTop"><h3>나의 최종 선택 · 비교함 (${compare.length}/6)</h3><button type="button" class="btn secondary" id="clearCompare">선택 비우기</button></div><div class="tableWrap"><table><thead><tr><th>구분</th>${compare.map(r=>`<th>${esc(r.item.brand)}<br>${esc(r.item.name)}</th>`).join('')}</tr></thead><tbody>${[
 ['예상점수',r=>r.score+'점 (추정)'],['근거 상태',r=>candidateEvidenceLabel(r)],['흐름',r=>inkComparisonFlow(r.ink,r.pen)],['윤활성',r=>inkComparisonLubrication(r.ink,r.pen)],['건조',r=>inkComparisonDry(r.ink,r.pen)],['농담',r=>researchFor(r.ink)?.shading||'미확인'],['테',r=>researchFor(r.ink)?.sheen||'미확인'],['주의 사항',r=>candidateRiskLabel(r)],['조합 선택',r=>`<button type="button" class="btn secondary" data-pair="${esc(r.pen.id+'|'+r.ink.id)}">선택</button>`]
 ].map(([label,fn])=>`<tr><th>${esc(label)}</th>${compare.map(r=>`<td>${label==='조합 선택'?fn(r):esc(fn(r))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">‘선택’은 잉입을 확정하지 않고 사용 로그의 후보로 이동합니다. 실제 잉입·세척은 별도로 기록해야 합니다.</p>`;
 $('clearCompare')?.addEventListener('click',()=>{candidateCompareKeys.clear();document.querySelectorAll('[data-compare]').forEach(e=>e.checked=false);renderRecComparison();});
}
function recommendations(){
 const isPen=$('direction').value==='pen',id=$('target').value,p=$('priority').value,arr=isPen?db.inks:db.pens;
 const base=isPen?db.pens.find(x=>x.id===id):db.inks.find(x=>x.id===id);
 if(!base){$('recResults').textContent='기준 만년필 또는 잉크를 선택하세요.';return;}
 const context=(isPen?'pen:':'ink:')+id;
 if(candidateDisplayTarget!==context){candidateDisplayTarget=context;candidateCompareKeys.clear();}
 const ranked=arr.map(x=>{let ink=isPen?x:base,pen=isPen?base:x;return{...calc(pen,ink,p),item:x,pen,ink}})
 .sort((a,b)=>b.score-a.score||b.certainty-a.certainty||tieOrder(a.item.id,base.id)-tieOrder(b.item.id,base.id));
 if(isPen&&$('samplePolicy').value==='preferBottle')ranked.sort((a,b)=>((b.score+(b.ink.packageType==='bottle'?4:0))-(a.score+(a.ink.packageType==='bottle'?4:0)))||b.certainty-a.certainty);
 if(typeof recBrandCap==="function")recBrandCap(ranked,isPen);latestRecommendationRows=ranked;
 const limit=Math.max(5,Math.min(20,Number($('recLimit').value)||8));
 const mode=$('diversityMode').value;
 const used=new Set();let html='';
 const reviewedCount=ranked.filter(candidateHasEvidence).length;
 html+=`<div class="rec" style="background:var(--light)"><b>전체 ${ranked.length}개 조합 검토 · 사용자가 최종 선택</b><p class="sub">개별 잉크 리뷰 또는 직접 사용 근거 ${reviewedCount}개 조합 · 자료 미확보 ${ranked.length-reviewedCount}개 조합</p><p class="hint">적합도 점수는 실측·검증된 확률이 아닌 <b>비보정 알고리즘 점수</b>입니다. 자료 부족을 나쁜 품질로 판단하지 않습니다. 미검증 후보와 쉬머 등의 관리 주의 사항은 별도로 표시합니다.</p></div>`;
 if(mode==='portfolio'){
  const grounded=ranked.filter(candidateHasEvidence).slice(0,limit);grounded.forEach(r=>used.add(r.item.id));
  const diversified=selectVariedCandidates(ranked.filter(r=>!used.has(r.item.id)),limit,used,grounded);
  const unexplored=selectVariedCandidates(ranked.filter(r=>!used.has(r.item.id)&&!candidateHasEvidence(r)),limit,used,[...grounded,...diversified]);
  html+=recGroup('① 개별 근거가 있는 후보','원문을 재확인한 리뷰·이전 조사 기록·사용자의 직접 시필 기록에 근거한 후보입니다. 출처마다 검증 수준이 다릅니다.',grounded,'grounded');
  html+=recGroup('② 색상·브랜드 다양성 후보','점수의 절대순위가 아니라 다른 제조사·색상도 경험할 수 있도록 고르게 골랐습니다. 이 그룹의 순서는 품질 순위가 아닙니다.',diversified,'diverse');
  html+=recGroup('③ 정보 부족 · 추가 시필 후보','흐름 자료가 미확보된 잉크도 배제하지 않고 살펴볼 수 있도록 제시합니다. 실제 적합성 판단은 보류합니다.',unexplored,'taster');
 }else if(mode==='balanced'){
  const balanced=chooseBalanced(ranked,isPen,limit);
  html+=recGroup('브랜드·색상 다양화 후보','점수 차이가 크지 않은 범위에서 제조사와 색상을 분산했습니다. 실제 검증 수준은 카드별로 확인하세요.',balanced,'diverse');
 }else{
  html+=recGroup('예상 적합도 순 후보','계산 점수순입니다. 자료가 부족한 제품이 유리하거나 불리할 수 있으므로 절대적인 품질 순위로 읽지 마세요.',ranked.slice(0,limit),'grounded');
 }
 const brand=$('recBrand').value;
 if(brand!=='all'){
  const shelf=ranked.filter(r=>comparableBrand(r.item,isPen)===brand).slice(0,limit);
  html+=`<div class="rec-brand-note">선택한 브랜드 <b>${esc(brand)}</b>의 후보만 별도로 보여줍니다. 브랜드 보너스나 감점 없이 같은 알고리즘 점수를 사용합니다.</div>`;
  html+=recGroup('④ 선택한 브랜드 집중 비교',`${brand} 제품만 별도로 검토했습니다. 위 그룹에 이미 보인 제품도 비교할 수 있습니다.`,shelf,'brand');
 }
 html+='<div id="recComparison" class="rec-comparison" aria-live="polite"></div>';
 html+=`<details class="rec"><summary style="cursor:pointer;font-weight:700">전체 ${ranked.length}개 후보 · 브랜드별 찾기 및 선택</summary><p class="hint">전량 검토한 결과입니다. 검색으로 브랜드·제품명만 표시할 수도 있습니다. 점수는 참고용이며 근거가 부족하면 판단을 유보하세요.</p><input type="search" id="recAllSearch" class="input" placeholder="예: Montblanc, 몽블랑, Sailor, Toffee, Pelikan"><p class="hint" id="recAllCount"></p><div style="max-height:370px;overflow:auto" class="tableWrap"><table><thead><tr><th>순위</th><th>브랜드·제품</th><th>점수(추정)</th><th>근거</th><th>선택</th></tr></thead><tbody id="recAllRows"></tbody></table></div></details>`;
 $('recResults').innerHTML=html;
 renderRecComparison();
 const search=$('recAllSearch');
 if(search){
  const draw=()=>{
   const q=norm(search.value);
   const matched=ranked.filter(r=>norm(r.item.brand+' '+r.item.name+' '+comparableBrand(r.item,isPen)).includes(q));
   $('recAllCount').textContent=`${ranked.length}개 중 ${matched.length}개 표시`;
   $('recAllRows').innerHTML=matched.map(r=>`<tr><td>${ranked.indexOf(r)+1}</td><td>${esc(r.item.brand)} · ${esc(r.item.name)}</td><td>${r.score}</td><td>${esc(candidateEvidenceLabel(r))}</td><td><button class="btn secondary" type="button" data-pair="${esc(r.pen.id+'|'+r.ink.id)}" style="padding:6px;font-size:11px">선택</button></td></tr>`).join('');
  };
  search.addEventListener('input',draw);draw();
 }
 if(typeof renderCompanionBox==='function')renderCompanionBox();
 if(typeof renderNowBox==='function')renderNowBox();
}
$('recResults').addEventListener('change',e=>{
 const input=e.target.closest('[data-compare]');if(!input)return;
 const key=input.dataset.compare;
 if(input.checked){
  if(candidateCompareKeys.size>=6){input.checked=false;alert('비교함에는 최대 6개까지 선택할 수 있습니다.');return;}
  candidateCompareKeys.add(key);
 }else candidateCompareKeys.delete(key);
 document.querySelectorAll('[data-compare]').forEach(el=>{if(el.dataset.compare===key)el.checked=candidateCompareKeys.has(key)});
 renderRecComparison();
});
$('recResults').addEventListener('click',e=>{const btn=e.target.closest('[data-pair]');if(!btn)return;const [p,i]=btn.dataset.pair.split('|');$('hPen').value=p;$('hInk').value=i;openTab('history');drawSelectionStates();$('hNote').focus()});
function drawPens(){let q=norm($('penSearch').value),v=sortedCollection(db.pens.filter(x=>norm(x.brand+' '+x.name+' '+x.nib).includes(q)));const f=$('uiPenFound');if(f)f.textContent=`${v.length}자루${q?' 검색됨':''} · 전체 ${db.pens.length}자루`;const card=x=>{const st=penFillState(x),pc=penInkColor(x),ph=penPhoto(x),label=x.inkName&&x.inkName!=='—'?x.inkBrand+' · '+x.inkName:'';return `<article class="pen-card" data-state="${esc(st)}" style="--body:${penBodyColor(x)};--c-ink:${pc.hex}"><div class="pen-stage${ph?' has-photo':''}">${ph?`<img class="pen-photo${ph.c==='l'?' local':''}" src="${esc(ph.u)}" alt="${esc(x.brand+' '+x.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="if(this.parentNode)this.parentNode.classList.remove('has-photo');this.remove()">`:''}${PEN_ART}<span class="nib-badge">${esc(x.nib)}</span>${ph&&ph.c==='c'?'<span class="photo-badge">비슷한 모델 사진</span>':''}</div><div class="pen-body"><div class="ink-brand">${esc(x.brand)}</div><div class="pen-name">${esc(x.name)}</div><div class="pen-ink">${label?`${penDotHtml(x)}${esc(label)}`:'<span class="sub">잉크 없음</span>'}</div><div class="pen-foot"><span class="state-pill ${esc(st)}">${esc(st==='filled'?'현재 잉입':st==='uncertain'?'현재 미확인':'미잉입')}</span><span class="pen-btns"><button class="chip-btn" type="button" data-swapink="${esc(x.id)}">잉크 교체</button><button class="chip-btn" type="button" data-testpen="${esc(x.id)}">시필</button><button class="chip-btn" type="button" data-penphoto="${esc(x.id)}">사진</button><button class="chip-btn danger" type="button" data-deletepen="${esc(x.id)}">삭제</button></span></div></div></article>`};$('penRows').innerHTML=(typeof groupHtml==='function'?groupHtml(v,'pen',card):v.map(card).join(''))||'<div class="empty">검색 결과가 없습니다.</div>'}
function drawInks(){let q=norm($('inkSearch').value),v=sortedCollection(db.inks.filter(x=>norm(x.brand+' '+x.name+' '+x.family+' '+x.hue).includes(q)));const f=$('uiInkFound');if(f)f.textContent=`${v.length}종${q?' 검색됨':''} · 전체 ${db.inks.length}종`;const card=x=>{const hint=purchaseHint(x),lp=(window.PIL&&PIL.photoSrc&&PIL.photoSrc(x.photo))||'',fx=x.effect&&x.effect!=='Standard'&&x.effect!=='미확인'?x.effect:'';return `<article class="ink-card" data-fx="${inkFx(x)}" style="--c-ink:${inkHex(x)}"><div class="ink-tile${lp?' has-photo':''}">${lp?`<img class="ink-photo" src="${esc(lp)}" alt="" loading="lazy">`:''}<span class="ink-hue">${esc(x.hue||x.family)}</span>${fx?`<span class="ink-fx">${esc(fx)}</span>`:''}</div><div class="ink-body"><div class="ink-brand">${esc(x.brand)}</div><div class="ink-name">${esc(x.name)}</div><div class="ink-meta">${esc(inventoryText(x))}</div>${typeof inkPensHtml==='function'?inkPensHtml(x):''}${typeof inkTestsHtml==='function'?inkTestsHtml(x):''}${hint?`<span class="tag warn">${esc(hint)}</span>`:''}<div class="ink-actions"><button class="chip-btn" type="button" data-testink="${esc(x.id)}">시필</button><button class="chip-btn" type="button" data-editinkdetail="${esc(x.id)}">상세</button><button class="chip-btn" type="button" data-editinventory="${esc(x.id)}">용량</button><button class="chip-btn" type="button" data-inkphoto="${esc(x.id)}">사진</button><button class="chip-btn danger" type="button" data-deleteink="${esc(x.id)}">삭제</button></div></div></article>`};$('inkRows').innerHTML=(typeof groupHtml==='function'?groupHtml(v,'ink',card):v.map(card).join(''))||'<div class="empty">검색 결과가 없습니다.</div>';drawPalette()}
function drawHistory(){let arr=[...db.history].reverse();$('historyRows').innerHTML=arr.length?arr.map(h=>{let p=db.pens.find(x=>x.id===h.penId),i=db.inks.find(x=>x.id===h.inkId);return`<div class="rec"><div class="recTop"><h3>${esc(h.type)} · ${esc(h.when)}</h3><span class="tag">${esc(h.rating||'평가 없음')}</span></div><div class="sub">${esc(p?p.brand+' '+p.name:'삭제된 만년필')} ↔ ${esc(i?i.brand+' '+i.name:'삭제된 잉크')}</div><p>${h.previousInk?`<b>변경 전:</b> ${esc(h.previousInk)} → <b>변경 후:</b> ${esc(h.newInk||'미기록')}<br>`:''}</p><p>${esc(h.note||'메모 없음')}</p></div>`}).join(''):'<div class="empty">사용 기록이 없습니다. 첫 잉입이나 시필을 등록해 보세요.</div>'}
function openTab(id){document.querySelectorAll('section').forEach(x=>x.classList.toggle('on',x.id===id));document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x.dataset.tab===id));if(id==='match'&&$('target')?.value)recommendations()}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>openTab(b.dataset.tab));$('direction').onchange=()=>{refreshTarget();if($('target').value)recommendations()};$('target').onchange=()=>{if($('target').value)recommendations()};$('recommend').onclick=recommendations;$('diversityMode').onchange=()=>{if($('target').value)recommendations()};$('recBrand').onchange=()=>{if($('target').value)recommendations()};$('recLimit').onchange=()=>{if($('target').value)recommendations()};$('samplePolicy').onchange=()=>{if($('target').value)recommendations()};$('penSearch').oninput=drawPens;$('inkSearch').oninput=drawInks;
function makeNewId(prefix,collection){
 let id;do{id=prefix+Date.now().toString()+String(Math.floor(Math.random()*10000)).padStart(4,'0')}
 while(collection.some(x=>x.id===id));return id;
}
$('addPen').onclick=()=>{
 const brand=$('pBrand').value.trim(),name=$('pName').value.trim();
 if(!brand||!name)return alert('브랜드와 모델명을 입력하세요.');
 if(db.pens.some(x=>norm(x.brand)===norm(brand)&&norm(x.name)===norm(name)))return alert('이미 등록된 만년필입니다.');
 const id=makeNewId('p',db.pens);
 db.pens.push({id,brand,name,nib:$('pNib').value,inkBrand:'미잉입',inkName:'—',status:'미잉입',fillVerified:false,fillDate:'',notes:$('pNotes').value});
 $('pBrand').value=$('pName').value=$('pNotes').value='';
 save();refresh();showNewRegistration('pen',id);
};
$('addInk').onclick=()=>{
 const brand=$('iBrand').value.trim(),name=$('iName').value.trim();
 if(!brand||!name)return alert('브랜드와 잉크명을 입력하세요.');
 if(db.inks.some(x=>norm(x.brand)===norm(brand)&&norm(x.name)===norm(name)))return alert('이미 등록된 잉크입니다.');
 const capacity=safeMl($('iCapacity').value),remaining=safeMl($('iRemaining').value);
 if(($('iCapacity').value.trim()&&capacity===null)||($('iRemaining').value.trim()&&remaining===null))return alert('용량·잔량에는 0 이상의 수치를 입력하세요.');
 if(capacity!==null&&remaining!==null&&remaining>capacity)return alert('잔량이 보유 용량보다 클 수 없습니다.');
 const id=makeNewId('i',db.inks);
 db.inks.push({id,brand,name,family:$('iFamily').value,hue:(window.PIL&&PIL.pickedHue(brand,name))||'',value:'미확인',saturation:'미확인',
  effect:$('iEffect').value,flow:$('iFlow').value.trim()||'미확인',notes:'사용자 추가',
  packageType:$('iPackage').value,capacityMl:capacity,remainingMl:remaining,volumeSource:'사용자 신규등록'});
 $('iBrand').value=$('iName').value=$('iFlow').value=$('iCapacity').value=$('iRemaining').value='';
 save();refresh();showNewRegistration('ink',id);
};
$('penRows').onclick=e=>{let b=e.target.closest('[data-deletepen]');if(!b)return;if(confirm('이 만년필을 목록에서 삭제하시겠습니까? (기존 로그에는 삭제 표시)')){{const gone=db.pens.find(x=>x.id===b.dataset.deletepen);if(gone&&gone.photo&&window.PIL&&PIL.photos)PIL.photos.remove(gone.photo)}db.pens=db.pens.filter(x=>x.id!==b.dataset.deletepen);save();refresh()}};
$('inkRows').onclick=e=>{let edit=e.target.closest('[data-editinkdetail]');if(edit){openInkDetailEditor(edit.dataset.editinkdetail);return;}let b=e.target.closest('[data-deleteink]');if(!b)return;if(confirm('이 잉크를 목록에서 삭제하시겠습니까? (기존 로그에는 삭제 표시)')){{const gone=db.inks.find(x=>x.id===b.dataset.deleteink);if(gone&&gone.photo&&window.PIL&&PIL.photos)PIL.photos.remove(gone.photo)}db.inks=db.inks.filter(x=>x.id!==b.dataset.deleteink);save();refresh()}};
function inkTextFromPen(p){return p&&p.inkName&&p.inkName!=='—'?`${p.inkBrand} · ${p.inkName}`:'없음'}
function syncHistoryInkToPen(){
 const p=db.pens.find(x=>x.id===$('hPen').value);
 const ink=matchingInk(p);
 if(ink)$('hInk').value=ink.id;
 updateHistoryUI();
}
function updateHistoryUI(){
 const p=db.pens.find(x=>x.id===$('hPen').value);
 const ink=db.inks.find(x=>x.id===$('hInk').value);
 const kind=$('hType').value;
 if(!p){$('hCurrentInline').textContent='만년필을 선택하세요.';$('hChangePreview').textContent='';return}
 const status=labelFill(p);
 $('hCurrentInline').innerHTML=`<b>현재 등록 잉크: ${esc(inkTextFromPen(p))}</b><br><span class="tag ${penFillState(p)==='uncertain'?'warn':''}">${esc(status)}</span>${p.fillDate?`<div class="sub">마지막 변경일: ${esc(p.fillDate)}</div>`:''}`;
 const old=inkTextFromPen(p);
 const next=kind==='세척'?'미잉입 (세척 완료)':kind==='잉입'?(ink?`${ink.brand} · ${ink.name}`:'잉크 미선택'):'현재 잉입 상태 유지';
 $('hChangePreview').innerHTML=`<b>${esc(kind==='잉입'?'교체/잉입 미리보기':kind==='세척'?'세척 미리보기':'기록 미리보기')}</b><div class="sub">변경 전: ${esc(old)} (${esc(status)})</div><div>저장 후: <b>${esc(next)}</b></div>`;
 $('hInkHelp').textContent=kind==='세척'?'세척 기록에서는 잉크 선택이 필요하지 않습니다.':kind==='잉입'?'선택한 잉크가 저장 후 이 만년필의 현재 잉크가 됩니다.':'시필·평가는 현재 잉입 상태에 영향을 주지 않습니다.';
 $('hInk').disabled=kind==='세척';
 drawSelectionStates();
}
$('hPen').addEventListener('change',syncHistoryInkToPen);
$('hInk').addEventListener('change',updateHistoryUI);
$('hType').addEventListener('change',updateHistoryUI);
$('addHistory').onclick=()=>{
 const p=db.pens.find(x=>x.id===$('hPen').value), ink=db.inks.find(x=>x.id===$('hInk').value),type=$('hType').value;
 if(!p)return alert('만년필을 선택하세요.');
 if(type!=='세척'&&!ink)return alert('잉크를 선택하세요.');
 const prev=inkTextFromPen(p),prevStatus=labelFill(p);
 const target=type==='세척'?'미잉입 (세척 완료)':type==='잉입'?`${ink.brand} · ${ink.name}`:'현재 상태 유지';
 if(!confirm(`${p.brand} ${p.name}\n이전: ${prev} (${prevStatus})\n새로운 상태: ${target}\n\n저장하시겠습니까?`))return;
 const when=localDate(),note=$('hNote').value.trim();
 if(type==='잉입'||type==='세척'){
   changeFill(p,type,ink,when,note);
   const last=db.history[db.history.length-1];
   last.rating=$('hRating').value;
   last.source='v0.9 잉입 기록';
   last.previousInk=prev;last.newInk=type==='세척'?'미잉입':target;
   last.previousStatus=prevStatus;
 }else{
   db.history.push({id:'h'+Date.now()+'_'+Math.random().toString(36).slice(2,7),penId:p.id,inkId:ink.id,type,rating:$('hRating').value,note,when,source:'v0.9 평가/시필'});
 }
 $('hNote').value='';
 save();refresh();
 updateHistoryUI();
 alert(type==='잉입'?'현재 잉크를 갱신하고 이전 잉크를 이력에 저장했습니다.':type==='세척'?'세척 후 미잉입 상태와 이전 잉크를 저장했습니다.':'평가/시필만 저장했습니다. 현재 잉입 상태는 유지됩니다.');
};
function penFillState(p){
 if(p.fillVerified&&p.status==='현재 잉입')return 'filled';
 if(p.fillVerified&&p.status==='미잉입')return 'empty';
 if(p.status==='미잉입' && (p.inkName==='—'||!p.inkName))return 'empty';
 return 'uncertain';
}
function searchWords(s){return String(s||'').normalize('NFKC').toLowerCase().replace(/[·_.()\[\]{}\\/\-]/g,' ').split(/\s+/).filter(Boolean)}
function matchesWords(query,fields){const words=searchWords(query);if(!words.length)return true;const text=fields.filter(Boolean).join(' ').normalize('NFKC').toLowerCase();const compact=text.replace(/[\s·_.()\\/\-]/g,'');return words.every(w=>text.includes(w)||compact.includes(w.replace(/\s/g,'')))}
function matchingInk(p){if(!p||!p.inkName||p.inkName==='—')return null;const n=norm(p.inkName), b=norm(p.inkBrand);return db.inks.find(i=>norm(i.name)===n && norm(i.brand)===b)||db.inks.find(i=>norm(i.name)===n)||null}
function labelFill(p){const st=penFillState(p);return st==='filled'?'현재 잉입 확인':st==='uncertain'?'과거 기록 · 현재 미확인':(p.fillVerified?'미잉입 확인':'기록상 미잉입')}
// v1.5: single-source pen selection and cross-tab sync (UI only; no changes to DB schema).
function renderCurrentPenOptions(){
 const select=$('currentPenSelect'), search=$('currentPenSearch');if(!select||!search)return;
 const selected=select.value;
 const list=sortedCollection(db.pens.filter(p=>matchesWords(search.value,[p.brand,p.name,p.nib])));
 const options=[`<option value="">전체 만년필 보기</option>`,...list.map(p=>`<option value="${esc(p.id)}">${esc(p.brand+' · '+p.name+' ('+(p.nib||'닙 미확인')+')')}</option>`)];
 // Preserve an existing choice when its name does not match a newly typed filter.
 if(selected&&!list.some(p=>p.id===selected)){
  const p=db.pens.find(x=>x.id===selected);
  if(p)options.splice(1,0,`<option value="${esc(p.id)}">✓ ${esc(p.brand+' · '+p.name+' ('+(p.nib||'닙 미확인')+')')} — 선택됨</option>`);
 }
 select.innerHTML=options.join('');
 if(selected&&db.pens.some(p=>p.id===selected))select.value=selected;
 $('currentPenCount').textContent=`검색 일치 ${list.length}개 / 전체 ${db.pens.length}개`;
}
function showCurrentPenDetails(){
 const box=$('currentPenDetails'), p=db.pens.find(x=>x.id===$('currentPenSelect').value);
 if(!box)return;
 if(!p){box.hidden=true;box.innerHTML='';return}
 box.hidden=false;
 const ink=(p.inkName&&p.inkName!=='—')?p.inkBrand+' · '+p.inkName:'기록된 잉크 없음';
 box.innerHTML=`<b>${esc(p.brand+' '+p.name+' · '+(p.nib||''))}</b><p>현재 등록 잉크: <b>${esc(ink)}</b></p><p><span class="tag ${penFillState(p)==='uncertain'?'warn':''}">${esc(labelFill(p))}</span>${p.fillDate?`<span class="sub">마지막 상태 기록: ${esc(p.fillDate)}</span>`:''}</p><div class="btnrow">${penFillState(p)==='uncertain'&&p.inkName&&p.inkName!=='—'?'<button class="btn" type="button" id="currentPenConfirm">기존 잉입 그대로 확인</button>':''}<button class="btn" type="button" id="currentPenEdit">잉크 교체·세척</button><button class="btn secondary" type="button" id="currentPenHistory">잉입 기록으로 이동</button></div>`;
 const confirmButton=$('currentPenConfirm');if(confirmButton)confirmButton.onclick=()=>confirmHistoricFill(p.id);
 $('currentPenEdit').onclick=()=>editCurrentPen(p.id);
 $('currentPenHistory').onclick=()=>{
  $('hPen').value=p.id;
  if(quickSearchInputs.hPen){quickSearchInputs.hPen.value='';renderQuickPicker('hPen')}
  syncHistoryInkToPen();openTab('history');
 };
}
function selectCurrentPen(id){
 const selected=db.pens.some(p=>p.id===id)?id:'';
 $('currentPenSelect').value=selected;
 if(selected){$('currentFilter').value='all';$('currentSearch').value=''}
 // Link selection to editing controls but never commit without explicit Save.
 if(selected&&$('cPen'))$('cPen').value=selected;
 showCurrentPenDetails();drawCurrent();
}
function editCurrentPen(id){
 const p=db.pens.find(x=>x.id===id);if(!p)return;
 $('cPen').value=id;$('cAction').value='잉입';
 const ink=matchingInk(p);if(ink)$('cInk').value=ink.id;
 if(quickSearchInputs.cPen){quickSearchInputs.cPen.value='';renderQuickPicker('cPen')}
 if(quickSearchInputs.cInk){quickSearchInputs.cInk.value='';renderQuickPicker('cInk')}
 setFillAction();$('editFillCard').scrollIntoView({behavior:'smooth',block:'start'});
}
$('currentPenSearch').addEventListener('input',()=>{
  renderCurrentPenOptions();
  // Keep the selected pen visible while filtering, until selection is changed.
});
$('currentPenSelect').addEventListener('change',()=>selectCurrentPen($('currentPenSelect').value));
$('currentPenReset').onclick=()=>{
 $('currentPenSearch').value='';$('currentPenSelect').value='';
 $('currentSearch').value='';$('currentFilter').value='all';
 renderCurrentPenOptions();selectCurrentPen('');
};
function drawCurrent(){
 const el=$('currentRows');if(!el)return;
 const q=$('currentSearch').value,filter=$('currentFilter').value,selectedId=$('currentPenSelect').value;
 const counts={filled:0,uncertain:0,empty:0};db.pens.forEach(p=>counts[penFillState(p)]++);
 $('currentSummary').textContent=`확인된 잉입 ${counts.filled}자루 / ${currentUsageStats().distinctInks}종 · 과거 기록(미확인) ${counts.uncertain}자루 / ${currentUsageStats().historicDistinctInks}종 · 미잉입 ${counts.empty}자루`;
 const list=sortedCollection(db.pens.filter(p=>(!selectedId||p.id===selectedId)&&(filter==='all'||penFillState(p)===filter)&&matchesWords(q,[p.brand,p.name,p.nib,p.inkBrand,p.inkName,labelFill(p)])));
 $('currentFound').textContent=`검색 결과 ${list.length}개 / 전체 ${db.pens.length}개`;
 el.innerHTML=list.map(p=>{
 const ink=(p.inkName&&p.inkName!=='—')?`${p.inkBrand} · ${p.inkName}`:'없음 / 미확인';
 return `<tr><td><b>${esc(p.brand)}</b><br>${esc(p.name)}<br><span class="sub">${esc(p.nib)}</span></td><td>${penDotHtml(p)}${esc(ink)}${p.fillDate?`<br><span class="sub">${esc(p.fillDate)}</span>`:''}</td><td><span class="tag ${penFillState(p)==='uncertain'?'warn':''}">${esc(labelFill(p))}</span></td><td>${penFillState(p)==='uncertain'&&p.inkName&&p.inkName!=='—'?`<button class="btn" style="padding:7px;margin-bottom:4px" data-confirmhistoric="${esc(p.id)}">기존 잉입 그대로 확인</button><br>`:''}<button class="btn secondary" style="padding:7px" data-editfill="${esc(p.id)}">변경</button></td></tr>`;
 }).join('')||'<tr><td colspan="4" class="empty">검색 결과가 없습니다. 검색어 또는 상태 필터를 확인하세요.</td></tr>';
}
function drawSelectionStates(){
 const p=db.pens.find(x=>x.id===$('hPen').value),i=db.inks.find(x=>x.id===$('hInk').value);
 const pArea=$('historyPenState'), iArea=$('historyInkPens');
 if(p){const st=penFillState(p),label=labelFill(p),ink=(p.inkName&&p.inkName!=='—')?`${p.inkBrand} · ${p.inkName}`:'잉입된 잉크 없음';
 pArea.innerHTML=`<b>${esc(p.brand)} ${esc(p.name)}</b><p><span class="tag ${st==='uncertain'?'warn':''}">${esc(label)}</span></p><div>${esc(ink)}</div>${p.fillDate?`<div class="sub">최종 확인·변경일: ${esc(p.fillDate)}</div>`:''}<button class="btn secondary" style="margin-top:9px" id="viewSelectedPen">현재 현황에서 변경</button>`;
 $('viewSelectedPen').onclick=()=>{openTab('current');$('currentFilter').value='all';$('currentSearch').value=p.name;drawCurrent();$('cPen').value=p.id;$('editFillCard').scrollIntoView({behavior:'smooth',block:'start'})};
 }else pArea.textContent='만년필을 선택하세요.';
 if(i){
  const exact=db.pens.filter(p=>penFillState(p)==='filled'&&matchingInk(p)?.id===i.id);
  const uncertain=db.pens.filter(p=>penFillState(p)==='uncertain'&&matchingInk(p)?.id===i.id);
  // Same names with variant-brand spellings are not silently conflated without a unique name match.
  const unmatched=db.pens.filter(p=>penFillState(p)!=='empty'&&!matchingInk(p)&&norm(p.inkName)===norm(i.name));
  const item=p=>`<li>${esc(p.brand)} · ${esc(p.name)} <span class="sub">(${esc(p.nib)})</span> <button type="button" class="btn secondary" style="padding:4px 9px;margin-left:6px" data-ink-pen-edit="${esc(p.id)}">수정</button></li>`;
  iArea.innerHTML=`<b>${esc(i.brand)} · ${esc(i.name)}</b><p class="sub">${esc(inventoryText(i))}</p>${purchaseHint(i)?`<span class="tag warn">${esc(purchaseHint(i))}</span>`:''}<p><span class="tag">현재 확인 ${exact.length}자루</span> <span class="tag warn">기존 기록 ${uncertain.length}자루</span></p>`+
   `<b>현재 잉입 확인</b>${exact.length?`<ul>${exact.map(item).join('')}</ul>`:'<p class="sub">확인된 만년필 없음</p>'}`+
   `<b>과거 잉크 기록 (현재 미확인)</b>${uncertain.length?`<ul>${uncertain.map(item).join('')}</ul>`:'<p class="sub">해당 기록 없음</p>'}`+
   (unmatched.length?`<p class="sub">브랜드 표기가 달라 미매칭된 기록 ${unmatched.length}건: ${unmatched.map(p=>esc(p.name)).join(', ')}</p>`:'')+`<p><button class="btn secondary" type="button" id="newPenForInk">이 잉크를 다른 만년필에 잉입하기</button></p>`;
 }else iArea.textContent='잉크를 선택하세요.';
 if($('inkMatchEditor')&&!$('inkMatchEditor').hidden)updateInkMatchEditPreview();
}
// v0.9: edit any pen's live fill from the ink-centered matching list.
function updateInkMatchEditPreview(){
 const p=db.pens.find(x=>x.id===$('imPen').value),i=db.inks.find(x=>x.id===$('hInk').value),action=$('imAction').value;
 $('imOtherWrap').hidden=action!=='다른 잉크';
 if(!p){$('imPreview').textContent='수정할 만년필을 선택하세요.';return;}
 const other=db.inks.find(x=>x.id===$('imOtherInk').value);
 const next=action==='잉입'?(i?`${i.brand} · ${i.name}`:'잉크 미선택'):action==='다른 잉크'?(other?`${other.brand} · ${other.name}`:'다른 잉크 미선택'):action==='세척'?'미잉입 (세척 완료)':'현재 상태 미확인';
 $('imPreview').innerHTML=`<b>현재: ${esc(inkTextFromPen(p))}</b> <span class="tag">${esc(labelFill(p))}</span><br><b>저장 후: ${esc(next)}</b>`;
}
function openInkMatchEditor(penId){
 const p=db.pens.find(x=>x.id===penId)||db.pens[0];
 if(!p)return;
 $('inkMatchEditor').hidden=false;
 addSelect('imPen',db.pens);addSelect('imOtherInk',db.inks);
 $('imPen').value=p.id;
 $('imAction').value='잉입';
 $('imDate').value=localDate();
 $('imNote').value='';
 $('inkMatchEditInfo').textContent='수정할 만년필과 변경 유형을 선택한 후 저장하세요. 선택된 보유 잉크는 위 목록의 잉크입니다.';
 updateInkMatchEditPreview();
 $('inkMatchEditor').scrollIntoView({behavior:'smooth',block:'nearest'});
}
$('historyInkPens').addEventListener('click',e=>{
 const btn=e.target.closest('[data-ink-pen-edit]');
 if(btn){openInkMatchEditor(btn.dataset.inkPenEdit);return;}
 if(e.target.closest('#newPenForInk'))openInkMatchEditor(db.pens[0]?.id);
});
$('imPen').addEventListener('change',updateInkMatchEditPreview);
$('imAction').addEventListener('change',updateInkMatchEditPreview);
$('imOtherInk').addEventListener('change',updateInkMatchEditPreview);
$('imSave').addEventListener('click',()=>{
 const p=db.pens.find(x=>x.id===$('imPen').value),source=db.inks.find(x=>x.id===$('hInk').value);
 const action=$('imAction').value;
 const ink=action==='다른 잉크'?db.inks.find(x=>x.id===$('imOtherInk').value):source;
 if(!p||!source){alert('먼저 잉크와 만년필을 선택하세요.');return;}
 if((action==='잉입'||action==='다른 잉크')&&!ink){alert('교체할 잉크를 선택하세요.');return;}
 const actualAction=action==='다른 잉크'?'잉입':action;
 const previous=inkTextFromPen(p),beforeStatus=labelFill(p);
 const next=actualAction==='잉입'?`${ink.brand} · ${ink.name}`:actualAction==='세척'?'미잉입 (세척 완료)':'현재 미확인';
 if(!confirm(`${p.brand} ${p.name}\n기존: ${previous} (${beforeStatus})\n변경: ${next}\n\n저장하시겠습니까?`))return;
 changeFill(p,actualAction,ink,$('imDate').value||localDate(),$('imNote').value.trim());
 const ev=db.history[db.history.length-1];ev.source='v0.9 잉크별 매칭 수정';ev.previousStatus=beforeStatus;
 save();
 const stayInk=$('hInk').value,stayPen=$('hPen').value;
 refresh();
 if(db.inks.some(x=>x.id===stayInk))$('hInk').value=stayInk;
 if(db.pens.some(x=>x.id===stayPen))$('hPen').value=stayPen;
 drawSelectionStates();updateHistoryUI();
 $('imNote').value='';updateInkMatchEditPreview();
 alert('현재 잉입 현황과 변경 이력이 저장되었습니다.');
});
$('hInk').addEventListener('change',()=>{
 if(!$('inkMatchEditor').hidden){$('imAction').value='잉입';updateInkMatchEditPreview();}
});
$('clearCurrentSearch').onclick=()=>{$('currentSearch').value='';$('currentFilter').value='all';drawCurrent();$('currentSearch').focus()};
function setFillAction(){ $('cInkWrap').style.display=$('cAction').value==='잉입'?'':'none'; }
function localDate(){let d=new Date();let l=new Date(d.getTime()-d.getTimezoneOffset()*60000);return l.toISOString().slice(0,10)}
function changeFill(p,action,ink,date,note){
 let old=p.inkName&&p.inkName!=='—'?p.inkBrand+' '+p.inkName:'잉크 없음';
 let event={id:'h'+Date.now()+'_'+Math.random().toString(36).slice(2,7),penId:p.id,inkId:ink?.id||'',type:action==='미확인'?'상태 확인':action,rating:'',note:[`이전: ${old}`,note].filter(Boolean).join(' · '),when:date,source:'v0.9 상태 편집',previousInk:old,newInk:action==='세척'?'미잉입':ink?`${ink.brand} · ${ink.name}`:'상태 미확인'};
 if(action==='잉입'){
   if(!ink)throw Error('잉크를 선택해야 합니다.');
   p.inkBrand=ink.brand;p.inkName=ink.name;p.status='현재 잉입';p.fillVerified=true;p.fillDate=date;
 }else if(action==='세척'){
   p.status='미잉입';p.inkBrand='미잉입';p.inkName='—';p.fillVerified=true;p.fillDate=date;
 }else{p.status='확인 필요';p.fillVerified=false;p.fillDate=date;}
 db.history.push(event);
}
function confirmHistoricFill(id){
 const p=db.pens.find(x=>x.id===id);
 if(!p||penFillState(p)!=='uncertain')return;
 const inkName=String(p.inkName||'').trim();
 if(!inkName||['—','-','미잉입','없음'].includes(inkName))return alert('기존 잉크명이 없어 확인할 수 없습니다. 잉입 변경 화면에서 실제 잉크를 선택해 주세요.');
 const oldBrand=String(p.inkBrand||'').trim();
 if(!confirm(`${p.brand} ${p.name}\n기존 기록: ${oldBrand} ${inkName}\n\n지금도 이 잉크가 만년필에 들어 있는 것을 직접 확인하셨습니까?\n확인하는 경우에만 ‘확인’을 누르세요.`))return;
 const ink=matchingInk(p),date=localDate();
 p.status='현재 잉입';p.fillVerified=true;p.fillDate=date;
 db.history.push({id:'h'+Date.now()+'_verify_'+Math.random().toString(36).slice(2,7),penId:p.id,
  inkId:ink?.id||'',type:'잉입 상태 확인',when:date,rating:'',source:'기존 기록 사용자 확인',
  previousInk:(oldBrand+' · '+inkName).trim(),newInk:(oldBrand+' · '+inkName).trim(),
  note:'이전 잉입 기록이 현재도 유지 중임을 사용자 확인. 신규 잉입·세척 작업 아님.'});
 save();refresh();
 alert('기존 잉입의 현재 상태를 확인했습니다. 확인된 만년필·잉크 수에 반영했습니다.');
}
$('currentSearch').addEventListener('input',drawCurrent);
$('currentFilter').onchange=drawCurrent;
$('cAction').onchange=setFillAction;
$('currentRows').onclick=e=>{const confirm=e.target.closest('[data-confirmhistoric]');if(confirm){confirmHistoricFill(confirm.dataset.confirmhistoric);return;}const b=e.target.closest('[data-editfill]');if(!b)return;editCurrentPen(b.dataset.editfill)};
$('saveFill').onclick=()=>{let p=db.pens.find(x=>x.id===$('cPen').value),action=$('cAction').value,ink=db.inks.find(x=>x.id===$('cInk').value),date=$('cDate').value||localDate(),note=$('cNote').value.trim();if(!p)return alert('만년필을 선택하세요.');if(action==='잉입'&&!ink)return alert('잉크를 선택하세요.');const what=action==='잉입'?`${ink.brand} ${ink.name}으로 잉입/교체`:(action==='세척'?'세척 완료 및 미잉입':'현재 상태 미확인');if(!confirm(`${p.brand} ${p.name}
${what}
상태를 저장하시겠습니까?`))return;changeFill(p,action,ink,date,note);$('cNote').value='';save();refresh();alert('현재 상태와 변경 이력이 저장되었습니다.')};
$('exportCurrent').onclick=()=>{let rows=[['브랜드','만년필','닙','상태','잉크 브랜드','잉크명','확인 일자'],...sortedCollection(db.pens).map(p=>[p.brand,p.name,p.nib,penFillState(p)==='filled'?'현재 잉입 확인':penFillState(p)==='empty'?'미잉입':'현재 미확인',p.inkBrand,p.inkName,p.fillDate||''])];download('\ufeff'+rows.map(r=>r.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n'),'pil_current_fills.csv','text/csv;charset=utf-8')};
$('cDate').value=localDate();setFillAction();

function download(text,file,type){let a=document.createElement('a'),u=URL.createObjectURL(new Blob([text],{type}));a.href=u;a.download=file;a.click();setTimeout(()=>URL.revokeObjectURL(u),4000)}
$('downloadJson').onclick=()=>{PIL.backup()};$('downloadCsv').onclick=()=>{let rows=[['브랜드','잉크명','색상군','색조','특수특성','흐름','형태','보유용량(mL)','잔량(mL)'],...sortedCollection(db.inks).map(x=>[x.brand,x.name,x.family,x.hue,x.effect,x.flow,x.packageType,x.capacityMl??"",x.remainingMl??""])];download('\ufeff'+rows.map(r=>r.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n'),'pil_inks.csv','text/csv;charset=utf-8')};$('restore').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{await PIL.restore(f)}finally{e.target.value=''}};$('reset').onclick=()=>{if(confirm('모든 변경 내용과 사용 로그를 모두 삭제하고 빈 상태로 되돌릴까요?')){if(window.PIL&&PIL.photos)PIL.photos.clear();db=freshSeed();save();refresh()}};

// 저장: 데이터는 이 기기(브라우저)에만 저장된다. 서버·구글 계정·동기화 없음.
var lastSaveAt=0;
function setSaveState(title,info=''){
 const el=$('syncStatus');if(el)el.textContent=title;
 const txt=$('syncDetails');if(txt&&info)txt.textContent=info;
}
function markSaved(){
 lastSaveAt=Date.now();
 if(storageAvailable)setSaveState('저장 완료','이 기기(브라우저)에 저장됨 · '+new Date(lastSaveAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}));
 else setSaveState('저장 실패','이 브라우저에서는 저장할 수 없어요. 백업(JSON·엑셀)으로 꼭 내보내 두세요.');
}
function initSaveState(){
 if(storageAvailable)setSaveState('저장 완료','데이터는 이 기기(브라우저)에만 저장돼요.');
 else setSaveState('저장 실패','이 브라우저에서는 저장할 수 없어요. 백업(JSON·엑셀)으로 꼭 내보내 두세요.');
 const b=$('backupNow');if(b)b.onclick=()=>openTab('backup');
}



// v1.1 quick-select: filters long lists while preserving the current selection.
const penInkSearchIds=['hPen','hInk','cPen','cInk','vInk','imPen','imOtherInk'];
const quickSearchInputs={};
function initQuickPickers(){
  for(const id of penInkSearchIds){
    const el=$(id);if(!el||el.dataset.quickPicker==='1')continue;
    el.dataset.quickPicker='1';
    const search=document.createElement('input');search.type='search';search.className='input';
    search.setAttribute('aria-label',(id.toLowerCase().includes('ink')||id==='vInk'?'잉크':'만년필')+' 이름으로 빠르게 검색');
    search.placeholder=(id==='hInk'||id==='cInk'||id==='vInk'||id==='imOtherInk')?'잉크 브랜드·이름 입력 (전체 검색)':'만년필 브랜드·모델 입력';
    search.autocomplete='off';search.id=id+'QuickSearch';
    const count=document.createElement('span');count.className='search-count';count.id=id+'SearchCount';
    el.parentNode.insertBefore(search,el);
    el.parentNode.insertBefore(count,el.nextSibling);
    quickSearchInputs[id]=search;
    search.addEventListener('input',()=>renderQuickPicker(id));
    // The chosen product remains in the form; clearing the query restores the full list.
    el.addEventListener('change',()=>{search.value='';renderQuickPicker(id);});
    renderQuickPicker(id);
  }
}
function renderQuickPicker(id){
  const el=$(id),search=quickSearchInputs[id];if(!el||!search)return;
  const list=(id==='hPen'||id==='cPen'||id==='imPen')?db.pens:db.inks;
  if(!Array.isArray(list))return;
  const query=search.value.trim().normalize('NFKC').toLowerCase().split(/\s+/).filter(Boolean);
  const selected=el.value;
  const matches=list.filter(x=>{const txt=(x.brand+' '+x.name+' '+(x.nib||'')).normalize('NFKC').toLowerCase();return query.every(w=>txt.includes(w));});
  const visible=sortedCollection(query.length?list.filter(x=>x.id===selected||matches.includes(x)):list);
  el.innerHTML=visible.map(x=>`<option value="${esc(x.id)}">${esc(x.brand+' · '+x.name+(x.nib?' ('+x.nib+')':''))}</option>`).join('');
  if(visible.some(x=>x.id===selected))el.value=selected;
  const counter=$(id+'SearchCount');if(counter)counter.textContent=query.length?`검색 일치 ${matches.length}개 / 전체 ${list.length}개 · 검색어를 지우면 전체 보기`:`전체 ${list.length}개 중 선택`;
}


// v1.4: user-observed pen/ink writing tests, synchronized within the existing JSON state.
function updateTestSelects(){
 const ps=$('tPen'),is=$('tInk');if(!ps||!is)return;
 const pv=ps.value,iv=is.value;
 const pQ=norm($('tPenSearch').value),iQ=norm($('tInkSearch').value);
 const fp=sortedCollection(db.pens.filter(p=>!pQ||norm(p.brand+' '+p.name+' '+p.nib).includes(pQ)));
 const fi=sortedCollection(db.inks.filter(i=>!iQ||norm(i.brand+' '+i.name).includes(iQ)));
 ps.innerHTML=fp.map(p=>`<option value="${esc(p.id)}">${esc(p.brand+' · '+p.name+' ('+p.nib+')')}</option>`).join('');
 is.innerHTML=fi.map(i=>`<option value="${esc(i.id)}">${esc(i.brand+' · '+i.name)}</option>`).join('');
 if(fp.some(p=>p.id===pv))ps.value=pv;
 if(fi.some(i=>i.id===iv))is.value=iv;
}
function clearTestInputs(){for(const id of ['tFlow','tWidth','tSmooth','tFeather','tRating'])$(id).value='';$('tPaper').value='';$('tMemo').value='';$('tEvidence').value='hands-on';$('tDate').value=localDate();if(typeof testExtraClear==='function')testExtraClear();}
function testVal(id){const s=$(id).value;return s===''?null:Number(s)}
function drawTestReviews(){
 const root=$('tReviews');if(!root)return;
 const q=norm($('tReviewSearch').value),reviews=Array.isArray(db.testReviews)?db.testReviews:[];
 const list=reviews.map(r=>({r,p:db.pens.find(p=>p.id===r.penId),i:db.inks.find(i=>i.id===r.inkId)})).filter(x=>!q||norm((x.p?.brand||'')+' '+(x.p?.name||'')+' '+(x.i?.brand||'')+' '+(x.i?.name||'')).includes(q)).reverse();
 $('tCount').textContent=`시필 ${list.length}건 / 전체 ${reviews.length}건`;
 root.innerHTML=list.map(({r,p,i})=>`<div class="rec"><div class="recTop"><h3>${esc(p?p.brand+' '+p.name:'삭제된 만년필')}</h3><span class="tag">${esc(r.date||'날짜 미입력')}</span></div><div class="sub">${esc(i?i.brand+' · '+i.name:'삭제된 잉크')} · ${esc(r.paper||'종이 미확인')} · ${esc(r.evidence==='hands-on'?'직접 시필':r.evidence==='photo'?'사진 기록':'과거 자료')}</div><p>공급 ${r.flow??'—'} · 선폭 ${r.width??'—'} · 부드러움 ${r.smooth??'—'} · 퍼짐 ${r.feather??'—'} · 만족 ${r.rating??'—'} / 5</p><p>${esc(r.memo||'')}</p>${typeof testExtraHtml==='function'?testExtraHtml(r):''}<div class="btnrow"><button class="btn secondary" data-tedit="${esc(r.id)}">수정</button><button class="btn secondary" data-tdelete="${esc(r.id)}">삭제</button></div></div>`).join('')||'<div class="empty">아직 등록된 시필 평가가 없습니다.</div>';
}
let editingTestId=null;
$('tPenSearch').oninput=updateTestSelects;$('tInkSearch').oninput=updateTestSelects;$('tReviewSearch').oninput=drawTestReviews;
$('tClear').onclick=()=>{editingTestId=null;clearTestInputs();$('tSave').textContent='시필 평가 저장'};
function testSig(){return (db.testReviews||[]).map(t=>t.id+'|'+t.penId+'|'+t.inkId+'|'+t.date).join(',')}
$('tSave').onclick=()=>{
 const penId=$('tPen').value,inkId=$('tInk').value;if(!penId||!inkId)return alert('만년필과 잉크를 선택하세요.');
 const sigBefore=testSig();
 const r={id:editingTestId||'test_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),penId,inkId,date:$('tDate').value||localDate(),paper:$('tPaper').value.trim(),flow:testVal('tFlow'),width:testVal('tWidth'),smooth:testVal('tSmooth'),feather:testVal('tFeather'),rating:testVal('tRating'),evidence:$('tEvidence').value,memo:$('tMemo').value.trim(),...(typeof testExtra==='function'?testExtra():{})};
 if(r.evidence==='photo'&&[r.flow,r.width,r.smooth,r.feather,r.rating].some(x=>x!==null)&&!confirm('사진만으로 평가하기 어려운 수치가 입력되었습니다. 실제로 확인한 수치만 기록하셨나요?'))return;
 if(!Array.isArray(db.testReviews))db.testReviews=[];
 const index=db.testReviews.findIndex(x=>x.id===r.id);if(index>=0)db.testReviews[index]=r;else db.testReviews.push(r);
 save();drawTestReviews();editingTestId=null;clearTestInputs();$('tSave').textContent='시필 평가 저장';alert('시필 평가를 저장했습니다. 이후 매칭에 반영됩니다.');
 if(testSig()!==sigBefore&&typeof offerFillFromTest==='function')offerFillFromTest(r);
};
$('tReviews').addEventListener('click',e=>{
 const edit=e.target.closest('[data-tedit]'),del=e.target.closest('[data-tdelete]');if(!edit&&!del)return;
 const id=(edit||del).dataset[edit?'tedit':'tdelete'],r=db.testReviews.find(x=>x.id===id);if(!r)return;
 if(del){if(confirm('이 시필 평가를 삭제하시겠습니까?')){db.testReviews=db.testReviews.filter(x=>x.id!==id);save();drawTestReviews()}return;}
 editingTestId=id;$('tPenSearch').value='';$('tInkSearch').value='';updateTestSelects();$('tPen').value=r.penId;$('tInk').value=r.inkId;
 $('tDate').value=r.date||localDate();$('tPaper').value=r.paper||'';$('tEvidence').value=r.evidence||'legacy';$('tMemo').value=r.memo||'';if(typeof testExtraLoad==='function')testExtraLoad(r);
 for(const [field,key] of [['tFlow','flow'],['tWidth','width'],['tSmooth','smooth'],['tFeather','feather'],['tRating','rating']])$(field).value=r[key]??'';
 $('tSave').textContent='수정 내용 저장';document.querySelector('#testing').scrollIntoView({behavior:'smooth',block:'start'});
});
$('tExport').onclick=()=>{const rows=[['date','pen','ink','paper','flow','width','smoothness','feathering','rating','evidence','memo'],...(db.testReviews||[]).map(r=>{const p=db.pens.find(p=>p.id===r.penId),i=db.inks.find(i=>i.id===r.inkId);return[r.date,p?p.brand+' '+p.name:r.penId,i?i.brand+' '+i.name:r.inkId,r.paper,r.flow??'',r.width??'',r.smooth??'',r.feather??'',r.rating??'',r.evidence,r.memo]})];download('\ufeff'+rows.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n'),'pil_trial_reviews.csv','text/csv;charset=utf-8')};
clearTestInputs();

refresh();showStorageWarning();initSaveState();
initQuickPickers();

// v1.8: The research overlay includes new inventory items immediately, even offline.
// The research sheet stores new item metadata; pen/ink/fill state remains in existing loadState/saveState.
let RESEARCH_ROWS=getResearchRows();
const verifiedCount=RESEARCH_ROWS.filter(r=>r.sourceVerification==='rechecked').length;
const previousCount=RESEARCH_ROWS.filter(r=>r.sourceVerification==='previous'&&r.sourceType!=='제품 정보').length;
const productCount=RESEARCH_ROWS.filter(r=>r.sourceType==='제품 정보').length;
const noEvidenceCount=RESEARCH_ROWS.filter(r=>r.status==='개별 자료 미확보').length;
const cleanLink=u=>typeof u==='string'&&/^https:[/][/]/i.test(u)?u:'';
function showResearchDetail(id){
 const r=researchFor(db.inks.find(i=>i.id===id)),el=$('researchDetail');if(!r||!el)return;
 const found=db.inks.find(i=>i.id===id),name=found?.name||r.name,brand=found?.brand||r.brandOriginal;
 const attrs=[
  ['브랜드(정규화)',r.brand],['색상',r.family+' / '+r.hue],['특수효과(기존 분류)',r.effect||'미확인'],
  ['흐름 (개별 리뷰)',r.flow||'검증된 정보 없음'],['윤활성',r.lubrication||'자료 미확인'],
  ['건조시간',r.drySeconds!==null&&r.drySeconds!==undefined?r.drySeconds+'초 (리뷰 조건)':'미확인'],
  ['농담',r.shading||'미확인'],['테',r.sheen||'미확인'],['복사용지',r.copyPaper||'미확인'],
  ['내수성',r.water||'미확인'],['점도·표면장력',r.viscosity||r.surfaceTension?`점도 ${r.viscosity||'미확인'} mPa·s / 표면장력 ${r.surfaceTension||'미확인'} mN/m`:'실측값 미확보'],
  ['검증상태',r.status+' · '+r.grade],['시험 조건',r.reviewConditions||'미기록'],
  ['이전 기록 (미검증)',r.legacyFlow||'없음'] ];
 el.innerHTML=`<h3>${esc(r.no)}. ${esc(brand)} · ${esc(name)}</h3><div class="research-detail-grid">${attrs.map(([a,b])=>`<div class="research-attribute"><small>${esc(a)}</small><strong>${esc(b)}</strong></div>`).join('')}</div><p><b>리뷰 내용:</b> ${esc(r.reviewSummary||'개별 리뷰 근거는 아직 확보하지 못했습니다. 이는 잉크 품질의 평가가 아닙니다.')}</p>${r.caution?`<div class="warning">${esc(r.caution)}</div>`:''}${r.anomalies?`<div class="warning">원본 정정 검토: ${esc(r.anomalies)}</div>`:''}${renderInkUserEvidence(found,null)}${cleanLink(r.source)?`<p><a href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">원문 자료 열기</a> · ${esc(r.sourceVerification==='rechecked'?'이번 조사에서 원문 확인':'이전 조사 기록 — 원문 추가 확인 필요')}</p>`:''}<div class="btnrow"><button class="btn secondary" data-pickresearch="${esc(r.id)}">이 잉크를 기준으로 만년필 추천받기</button><button class="btn outline" data-editresearch="${esc(r.id)}">개인 상세정보 편집</button></div>`;
 el.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function drawResearch(){
 const q=($('researchQuery')?.value||'').trim().normalize('NFKC').toLowerCase(),st=$('researchStatus')?.value||'all',b=$('researchBrand')?.value||'all';
 const inSet=RESEARCH_ROWS.filter(r=>{
  if(st==='rechecked'&&r.sourceVerification!=='rechecked')return false;
  if(st==='previous'&&(r.sourceVerification!=='previous'||r.sourceType==='제품 정보'))return false;
  if(st==='product'&&r.sourceType!=='제품 정보')return false;
  if(st==='none'&&r.status!=='개별 자료 미확보'&&r.sourceVerification!=='user-added')return false;
  if(b!=='all'&&r.brand!==b)return false;
  const updated=db.inks.find(i=>i.id===r.id),hay=(r.no+' '+r.brand+' '+r.brandOriginal+' '+r.name+' '+(updated?.name||'')+' '+r.hue+' '+r.family).normalize('NFKC').toLowerCase();
  return q.split(/\s+/).every(w=>hay.includes(w));
 });
 $('researchFound').textContent=`보유 잉크 ${RESEARCH_ROWS.length}종 중 ${inSet.length}종 표시 · 제조사/잉크명 자동 정렬 · 원본 번호 보존 · 신규 등록 잉크는 물성 미확인`;
 $('researchRows').innerHTML=inSet.map(r=>{
  const x=db.inks.find(i=>i.id===r.id),flow=r.flow||'미확인',cl=r.sourceVerification==='rechecked'?'reviewed':r.sourceVerification==='previous'?'pending':'';
  return `<tr><td>${r.no}</td><td>${x?`<i class="dot" style="--c-ink:${inkHex(x)}"></i>`:''}<strong>${esc(x?.brand||r.brandOriginal)}</strong><br>${esc(x?.name||r.name)}</td><td>${esc(r.hue)}</td><td>${esc(flow)}</td><td>${r.drySeconds??'—'}</td><td><span class="evidence-badge ${cl}">${esc(r.grade)}</span></td><td><button class="btn secondary" style="padding:7px;font-size:12px" data-research="${esc(r.id)}">자세히</button></td></tr>`;
 }).join('');
}
function refreshResearchStats(){
 const rows=RESEARCH_ROWS;
 const rechecked=rows.filter(r=>r.sourceVerification==='rechecked').length;
 const previous=rows.filter(r=>r.sourceVerification==='previous'&&r.sourceType!=='제품 정보').length;
 const product=rows.filter(r=>r.sourceType==='제품 정보').length;
 const missing=rows.filter(r=>r.status==='개별 자료 미확보'||r.sourceVerification==='user-added').length;
 $('researchStats').innerHTML=[[String(rows.length),'마스터 전체'],[String(rechecked),'원문 재확인'],[String(previous),'이전 조사 기록'],[String(product+missing),'개별 물성 자료 부족']].map(([v,t])=>`<div class="research-stat"><b>${v}</b><span>${t}</span></div>`).join('');
}
function initResearch(){
 refreshResearchStats();
 const brands=[...new Set(RESEARCH_ROWS.map(r=>r.brand))].sort((a,b)=>a.localeCompare(b));
 $('researchBrand').innerHTML='<option value="all">전체 브랜드</option>'+brands.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join('');
 for(const id of ['researchQuery','researchBrand','researchStatus']) $(id).addEventListener(id==='researchQuery'?'input':'change',drawResearch);
 $('researchRows').addEventListener('click',e=>{const b=e.target.closest('[data-research]');if(b)showResearchDetail(b.dataset.research)});
 $('researchDetail').addEventListener('click',e=>{const b=e.target.closest('[data-pickresearch]');if(!b)return;const id=b.dataset.pickresearch;if(!db.inks.some(i=>i.id===id))return alert('개인 목록에서 이 잉크가 삭제돼 선택할 수 없습니다. JSON 백업을 확인하세요.');$('direction').value='ink';refreshTarget();$('target').value=id;openTab('match');recommendations()});
 $('researchExport').addEventListener('click',()=>{
  const keys=[['no','No'],['brand','제조사(정규화)'],['brandOriginal','원본 브랜드'],['name','잉크명'],['family','색상군'],['hue','색상'],['effect','특수효과'],['legacyFlow','기존 흐름 메모(미검증)'],['flow','개별 리뷰 흐름'],['drySeconds','건조시간(초)'],['shading','농담'],['sheen','테'],['copyPaper','복사용지'],['water','내수성'],['grade','근거 등급'],['status','자료 상태'],['reviewConditions','시험 조건'],['reviewSummary','리뷰 요약'],['caution','주의'],['source','출처 URL'],['anomalies','정정 검토']];
  const lines=[keys.map(x=>x[1]),...RESEARCH_ROWS.map(r=>keys.map(([k])=>r[k]??''))];
  const txt='\ufeff'+lines.map(line=>line.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');
  download(txt,'Ink_Research_'+RESEARCH_ROWS.length+'_v1.8.csv','text/csv;charset=utf-8');
 });
 drawResearch();researchInitialized=true;
}
initResearch();

let researchCurrentDetailId=null;
function refreshResearchBrandSelect(){
 const el=$('researchBrand');if(!el)return;
 const existing=el.value;
 const brands=[...new Set(RESEARCH_ROWS.map(r=>r.brand))].sort((a,b)=>a.localeCompare(b));
 el.innerHTML='<option value="all">전체 브랜드</option>'+brands.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join('');
 el.value=brands.includes(existing)?existing:'all';
}
// Track currently open product so changing the sheet refreshes its details too.
$('researchRows').addEventListener('click',e=>{const b=e.target.closest('[data-research]');if(b)researchCurrentDetailId=b.dataset.research});

// v1.9.3: existing-ink detail editor; all changes persist in the existing JSON state.
var detailEditingInkId='',detailFormDirty=false;
const detailInputIds=['diBrand','diName','diFamily','diHue','diValue','diSaturation','diEffect','diLegacyFlow','diNotes','diDirectConfirmed','diDirectPen','diDirectDate','diDirectPaper','diDirectFlow','diDirectLubrication','diDirectFeather','diDirectDry','diDirectShading','diDirectSheen','diDirectNotes','diReviewSource','diReviewAuthor','diReviewPen','diReviewPaper','diReviewFlow','diReviewDry','diReviewChecked','diReviewNotes'];
function diVal(id){return $(id).value.trim();}
function setDiVal(id,value){$(id).value=value===null||value===undefined?'':String(value);}
function detailStatus(msg){$('diStatus').textContent=msg;}
function refreshDetailInkSelectors(){
 const el=$('diInk');if(!el)return;
 const old=el.value||detailEditingInkId;
 const penSelect=$('diDirectPen');
 if(penSelect){const selectedPen=penSelect.value;penSelect.innerHTML='<option value=\"\">선택 안 함</option>'+sortedCollection(db.pens).map(p=>`<option value=\"${esc(p.id)}\">${esc(p.brand+' · '+p.name+' ('+p.nib+')')}</option>`).join('');if(db.pens.some(p=>p.id===selectedPen))penSelect.value=selectedPen;}
 const q=norm($('diSearch').value);
 const pool=sortedCollection(db.inks.filter(i=>!q||norm(i.brand+' '+i.name+' '+i.hue).includes(q)));
 el.innerHTML=pool.map(x=>`<option value="${esc(x.id)}">${esc(x.brand+' · '+x.name)}</option>`).join('');
 if(pool.some(x=>x.id===old))el.value=old;
 else if(!q&&db.inks.some(x=>x.id===detailEditingInkId))el.value=detailEditingInkId;
 if(!detailEditingInkId&&pool.length)loadInkDetail(pool[0].id,true);
}
function loadInkDetail(id,force=false){
 const ink=db.inks.find(x=>x.id===id);if(!ink)return;
 if(detailFormDirty&&!force&&!confirm('저장되지 않은 상세 입력 내용이 있습니다. 다른 잉크로 이동할까요?')){$('diInk').value=detailEditingInkId;return;}
 detailEditingInkId=id;
 $('diInk').value=id;
 setDiVal('diBrand',ink.brand);setDiVal('diName',ink.name);setDiVal('diFamily',ink.family||'블루 & 터콰이즈');
 setDiVal('diHue',ink.hue);setDiVal('diValue',ink.value||'미확인');setDiVal('diSaturation',ink.saturation||'미확인');
 setDiVal('diEffect',ink.effect||'미확인');setDiVal('diLegacyFlow',ink.flow||'');setDiVal('diNotes',ink.detailNotes||'');
 const h=ink.userEvidence?.handsOn||{},e=ink.userEvidence?.external||{};
 $('diDirectConfirmed').checked=!!h.confirmed;
 $('diDirectPen').innerHTML='<option value="">선택 안 함</option>'+sortedCollection(db.pens).map(p=>`<option value="${esc(p.id)}">${esc(p.brand+' · '+p.name+' ('+p.nib+')')}</option>`).join('');
 setDiVal('diDirectPen',h.penId||'');setDiVal('diDirectDate',h.date||'');setDiVal('diDirectPaper',h.paper||'');
 setDiVal('diDirectFlow',h.flow||'');setDiVal('diDirectLubrication',h.lubrication??'');setDiVal('diDirectFeather',h.feather??'');
 setDiVal('diDirectDry',h.drySeconds??'');setDiVal('diDirectShading',h.shading||'');setDiVal('diDirectSheen',h.sheen||'');setDiVal('diDirectNotes',h.notes||'');
 setDiVal('diReviewSource',e.url||'');setDiVal('diReviewAuthor',e.author||'');setDiVal('diReviewPen',e.pen||'');setDiVal('diReviewPaper',e.paper||'');
 setDiVal('diReviewFlow',e.flow||'');setDiVal('diReviewDry',e.drySeconds??'');$('diReviewChecked').checked=!!e.checked;setDiVal('diReviewNotes',e.notes||'');
 $('diSelectedInfo').innerHTML=`<b>${esc(ink.brand)} · ${esc(ink.name)}</b> · 자료 등급: ${esc(researchFor(ink)?.grade||'D')} · 개인 입력은 별도로 저장`;detailFormDirty=false;
 detailStatus('선택한 잉크의 기존 정보를 불러왔습니다. 저장하면 등록 정보·추천·클라우드 기록에 반영됩니다.');
}
function openInkDetailEditor(id){openTab('inks');$('diSearch').value='';refreshDetailInkSelectors();loadInkDetail(id);$('inkDetailEditor').scrollIntoView({behavior:'smooth',block:'start'});}
function collectInkDetail(){
 if(typeof fillDirectDate==='function')fillDirectDate();
 const ink=db.inks.find(i=>i.id===detailEditingInkId);
 if(!ink)throw Error('잉크를 먼저 선택해 주세요.');
 const brand=diVal('diBrand'),name=diVal('diName');if(!brand||!name)throw Error('브랜드와 잉크명은 반드시 입력해야 합니다.');
 if(db.inks.some(i=>i.id!==ink.id&&norm(i.brand)===norm(brand)&&norm(i.name)===norm(name)))throw Error('동일한 브랜드·잉크명이 이미 등록되어 있습니다.');
 const u=diVal('diReviewSource');if(u&&!/^https:\/\/[^\s]+$/i.test(u))throw Error('리뷰 링크는 https:\/\/ 로 시작하는 올바른 주소만 허용합니다.');
 const getDry=id=>{const txt=diVal(id);if(!txt)return null;const n=validNumberOrNull(txt);if(n===null)throw Error('건조 시간은 0~600초 숫자이거나 공란이어야 합니다.');return n;};
 const h={confirmed:$('diDirectConfirmed').checked,penId:diVal('diDirectPen'),date:diVal('diDirectDate'),paper:diVal('diDirectPaper'),flow:diVal('diDirectFlow'),lubrication:diVal('diDirectLubrication'),feather:diVal('diDirectFeather'),drySeconds:getDry('diDirectDry'),shading:diVal('diDirectShading'),sheen:diVal('diDirectSheen'),notes:diVal('diDirectNotes')};
 const observed=!!(h.flow||h.lubrication!==''||h.feather!==''||h.drySeconds!==null||h.shading||h.sheen);
 if(h.confirmed&&(!h.penId||!h.date||!observed))throw Error(typeof directRecordMessage==='function'?directRecordMessage(h):'직접 시필 확인을 체크했다면 시필 만년필, 날짜, 관찰값을 입력해야 합니다.');
 if(h.confirmed&&(h.feather!==''||h.drySeconds!==null)&&!h.paper)throw Error('번짐·건조 시간 측정에는 종이 종류를 기록해 주세요.');
 const e={url:u,author:diVal('diReviewAuthor'),pen:diVal('diReviewPen'),paper:diVal('diReviewPaper'),flow:diVal('diReviewFlow'),drySeconds:getDry('diReviewDry'),checked:$('diReviewChecked').checked,notes:diVal('diReviewNotes')};
 if(e.checked&&!e.url)throw Error('외부 리뷰를 원문 확인으로 표시하려면 https:\/\/ 원문 URL이 필요합니다.');
 return {ink,brand,name,detailNotes:diVal('diNotes'),h,e};
}
function saveInkDetail(){
 let p;try{p=collectInkDetail();}catch(e){detailStatus('저장되지 않았습니다: '+e.message);alert(e.message);return;}
 const {ink,brand,name,detailNotes,h,e}=p;
 const prevBrand=ink.brand,prevName=ink.name;
 ink.brand=brand;ink.name=name;ink.family=diVal('diFamily');ink.hue=diVal('diHue');ink.value=diVal('diValue');ink.saturation=diVal('diSaturation');
 ink.effect=diVal('diEffect');ink.flow=diVal('diLegacyFlow')||'미확인';ink.detailNotes=detailNotes;
 ink.userEvidence={schemaVersion:1,handsOn:h,external:e,updatedAt:new Date().toISOString()};
 // Keep confirmed/historical fill display consistent if a product is renamed.
 if(norm(prevBrand)!==norm(brand)||norm(prevName)!==norm(name)){
  for(const pen of db.pens){if(norm(pen.inkBrand)===norm(prevBrand)&&norm(pen.inkName)===norm(prevName)){pen.inkBrand=brand;pen.inkName=name;}}
 }
 detailFormDirty=false;save();refresh();loadInkDetail(ink.id,true);
 if($('match').classList.contains('on')&&$('target').value)recommendations();
 detailStatus('상세 정보 저장 완료 · '+brand+' '+name+' · 추천 엔진에 반영. ');
}
$('diInk').addEventListener('change',e=>loadInkDetail(e.target.value));
$('diSearch').addEventListener('input',()=>{const before=$('diInk').value;refreshDetailInkSelectors();if($('diInk').value&&$('diInk').value!==before)loadInkDetail($('diInk').value);});
for(const id of detailInputIds){$(id).addEventListener('input',()=>{detailFormDirty=true;});$(id).addEventListener('change',()=>{detailFormDirty=true;});}
$('diSave').addEventListener('click',saveInkDetail);
$('diReload').addEventListener('click',()=>loadInkDetail(detailEditingInkId,true));
$('diGoResearch').addEventListener('click',()=>{$('researchQuery').value=db.inks.find(x=>x.id===detailEditingInkId)?.name||'';$('researchStatus').value='all';$('researchBrand').value='all';openTab('research');drawResearch();showResearchDetail(detailEditingInkId);});
$('researchDetail').addEventListener('click',e=>{const b=e.target.closest('[data-editresearch]');if(b)openInkDetailEditor(b.dataset.editresearch);});
refreshDetailInkSelectors();
// Mark ready only after every navigation and editor listener is attached.
if(!document.querySelector('.tabs button[data-tab="inks"]')?.onclick ||
   !document.getElementById('diSave') ||
   !document.getElementById('recommend')?.onclick) {
 throw new Error('메뉴·추천·상세정보 편집 초기화가 완료되지 않았습니다.');
}
// Confirm full script completion; failures earlier remain visible through independent watchdog.
if(window.__pilBoot)window.__pilBoot.ready();
