
/* 용어 풀이: 라벨 옆 ⓘ → 짧은 설명 + 예시 그림. 같은 내용을 "용어 풀이" 카드에도 모아 둔다. */
(function(){
 'use strict';
 var PIL=window.PIL;
 var BG='<rect width="160" height="46" rx="9" fill="#f5f2ea"/>';
 var SVG=function(inner){return '<svg viewBox="0 0 160 46" width="160" height="46" role="img" aria-hidden="true">'+BG+inner+'</svg>'};
 var T={
  sheen:{n:'테 (Sheen)',d:'잉크가 마르면서 종이 위에 금속처럼 번들거리는 다른 색의 광택이 비치는 현상이에요. 진하게 고인 부분, 굵은 닙, 매끈한 종이에서 잘 보여요.',e:'예: 남색 글씨 가장자리에 붉은 광택이 비침',
   s:SVG('<path d="M12 30 C50 8,100 40,148 14" stroke="#1f3d73" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M12 26 C50 4,100 36,148 10" stroke="#c4374d" stroke-width="2.4" fill="none" opacity=".85" stroke-linecap="round"/>')},
  shading:{n:'농담 (Shading)',d:'한 번에 쓴 선 안에서도 진한 곳과 연한 곳이 생기는 정도예요. 굵은 닙이나 촉촉한 펜에서 더 또렷하게 드러나요.',e:'예: 획의 꺾이는 부분은 진하고 가는 부분은 연함',
   s:SVG('<defs><linearGradient id="pilg1" x1="0" x2="1"><stop offset="0" stop-color="#1c4a78"/><stop offset=".45" stop-color="#7aa3c9"/><stop offset="1" stop-color="#1c4a78"/></linearGradient></defs><path d="M12 28 C50 10,100 38,148 16" stroke="url(#pilg1)" stroke-width="10" fill="none" stroke-linecap="round"/>')},
  shimmer:{n:'쉬머 (Shimmer)',d:'잉크 속에 금·은색 입자가 섞여 반짝이는 잉크예요. 입자가 피드를 막기 쉬워서 자주 흔들어 주고 자주 세척하는 편이 안전해요.',e:'예: 짙은 색 위에 금가루처럼 반짝임',
   s:SVG('<path d="M12 28 C50 10,100 38,148 16" stroke="#3b2a55" stroke-width="10" fill="none" stroke-linecap="round"/><g fill="#e6c25c"><circle cx="34" cy="22" r="1.8"/><circle cx="58" cy="18" r="1.4"/><circle cx="80" cy="27" r="1.9"/><circle cx="104" cy="26" r="1.4"/><circle cx="126" cy="19" r="1.8"/></g>')},
  effect:{n:'특성 (테·농담·쉬머)',d:'<b>Standard</b>는 평범한 단색, <b>Sheen</b>은 마를 때 비치는 광택, <b>Shading</b>은 진하고 연한 농담, <b>Shimmer</b>는 반짝이는 입자가 든 잉크예요. 잘 모르면 "미확인"으로 두어도 돼요.',e:'',
   s:SVG('<path d="M10 14 H64" stroke="#1f3d73" stroke-width="6" stroke-linecap="round"/><path d="M10 32 H64" stroke="#5b8bb4" stroke-width="6" stroke-linecap="round"/><path d="M84 14 H150" stroke="#3b2a55" stroke-width="6" stroke-linecap="round"/><g fill="#e6c25c"><circle cx="96" cy="13" r="1.4"/><circle cx="118" cy="15" r="1.4"/><circle cx="138" cy="13" r="1.4"/></g><path d="M84 32 H150" stroke="#1f3d73" stroke-width="6" stroke-linecap="round"/><path d="M84 30 H150" stroke="#c4374d" stroke-width="1.6" opacity=".8"/>')},
  flow:{n:'흐름 (Flow)',d:'잉크가 펜촉으로 나오는 양이에요. 풍부하면 선이 굵고 촉촉하게 나오고, 건조하면 가늘고 깔끔하지만 끊기기 쉬워요. 가는 닙에는 너무 풍부한 잉크가, 굵은 닙에는 건조한 잉크가 잘 맞는 편이에요.',e:'',
   s:SVG('<path d="M10 16 H150" stroke="#244d7d" stroke-width="9" stroke-linecap="round"/><path d="M10 34 H150" stroke="#244d7d" stroke-width="3" stroke-linecap="round" stroke-dasharray="26 6"/><text x="12" y="9" font-size="7" fill="#777">풍부</text><text x="12" y="45" font-size="7" fill="#777">건조</text>')},
  feather:{n:'번짐 (Feathering)',d:'잉크가 종이 섬유를 따라 선 가장자리로 퍼지는 현상이에요. 얇거나 거친 종이, 촉촉한 잉크에서 심해져요. 번짐이 적을수록 가는 선이 또렷해요.',e:'',
   s:SVG('<defs><filter id="pilf1"><feGaussianBlur stdDeviation="2.2"/></filter></defs><path d="M10 15 H70" stroke="#244d7d" stroke-width="5" stroke-linecap="round"/><path d="M92 15 H150" stroke="#244d7d" stroke-width="5" stroke-linecap="round" filter="url(#pilf1)"/><text x="12" y="38" font-size="7" fill="#777">또렷함</text><text x="94" y="38" font-size="7" fill="#777">번짐</text>')},
  nib:{n:'닙 굵기',d:'<b>EF·UEF</b> 극세, <b>F</b> 세, <b>M</b> 중간, <b>B</b> 굵음이에요. 같은 F라도 일본 펜이 서양 펜보다 가늘게 나오는 편이에요. <b>Stub</b>은 가로획이 굵은 납작한 닙이에요.',e:'',
   s:SVG('<g stroke="#244d7d" stroke-linecap="round"><path d="M12 12 H148" stroke-width="1.4"/><path d="M12 22 H148" stroke-width="2.6"/><path d="M12 32 H148" stroke-width="4.2"/><path d="M12 41 H148" stroke-width="6"/></g><g font-size="6.5" fill="#666"><text x="2" y="9">EF</text></g>')},
  package:{n:'보유 형태',d:'<b>본병</b>은 정식 용량 병, <b>소분</b>은 병에서 덜어 판매하는 작은 샘플(보통 3~5mL)이에요. 소분 잉크는 금방 떨어질 수 있어 본병 구매 검토 표시가 붙어요.',e:'',s:''},
  priority:{n:'중요하게 생각하는 기준',d:'<b>종합 균형</b>은 전반적인 궁합, <b>가늘고 부드러운 선</b>은 선 굵기·필기감, <b>색상 조화</b>는 펜 색과의 어울림, <b>테·농담·특수발색</b>은 잉크의 개성, <b>세척·관리 편의</b>는 번거롭지 않은 잉크를 중시해요.',e:'',s:''}
 };
 PIL.glossary=T;
 PIL.tipHtml=function(k){return '<button type="button" class="pil-tip" data-term="'+k+'" aria-label="'+esc(T[k].n)+' 설명">ⓘ</button>'};
 function open(k){
  var t=T[k];if(!t)return;
  PIL.sheet(t.n,(t.s?'<div class="pil-ex">'+t.s+'</div>':'')+'<p>'+t.d+'</p>'+(t.e?'<p class="hint">'+esc(t.e)+'</p>':''));
 }
 document.addEventListener('click',function(e){var b=e.target.closest('.pil-tip');if(b){e.preventDefault();e.stopPropagation();open(b.dataset.term)}},true);
 /* 라벨 옆에 ⓘ 붙이기 (이미 붙은 라벨은 건너뜀) */
 var RULES=[[/^특성$/,'effect'],[/^흐름/,'flow'],[/^닙$/,'nib'],[/^보유 형태$/,'package'],[/^중요하게 생각하는 기준$/,'priority'],[/농담/,'shading'],[/번짐/,'feather']];
 function inject(){
  document.querySelectorAll('label').forEach(function(l){
   if(l.querySelector('.pil-tip')||l.dataset.pilTip)return;
   var txt=l.textContent.trim();
   for(var i=0;i<RULES.length;i++)if(RULES[i][0].test(txt)){l.dataset.pilTip='1';l.insertAdjacentHTML('beforeend',' '+PIL.tipHtml(RULES[i][1]));break}
  });
 }
 /* 용어 풀이 카드 */
 var inks=$('inks');
 if(inks&&!$('pilGloss')){
  var d=document.createElement('details');d.className='card pil-gloss';d.id='pilGloss';
  d.innerHTML='<summary><h2>📖 용어 풀이</h2></summary>'+['sheen','shading','shimmer','flow','feather','nib','package'].map(function(k){var t=T[k];return '<div class="pil-g"><div class="pil-ex">'+(t.s||'')+'</div><div><h4>'+esc(t.n)+'</h4><p>'+t.d+'</p>'+(t.e?'<p class="hint">'+esc(t.e)+'</p>':'')+'</div></div>'}).join('');
  inks.appendChild(d);
 }
 PIL.onRefreshAdd(inject);inject();
})();
