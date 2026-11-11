
/* 직접 시필 기록 도우미: 확인을 체크하면 시필일을 오늘로 채우고, 비어 있는 항목을 정확히 알려 준다 (collectInkDetail 이 부름) */
(function(){
 'use strict';
 function el(id){return document.getElementById(id)}
 function today(){try{return localDate()}catch(_){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}}
 window.fillDirectDate=function(){var c=el('diDirectConfirmed'),d=el('diDirectDate');if(c&&c.checked&&d&&!d.value)d.value=today()};
 window.directRecordMessage=function(h){
  var miss=[];
  if(!h.penId)miss.push('시필한 만년필');
  if(!h.date)miss.push('시필일');
  if(!miss.length)miss.push('흐름·윤활감·번짐·건조 시간·농담·테 중 하나 이상');
  return '직접 시필 기록에 '+miss.join(', ')+'이(가) 비어 있어요. 채운 뒤 다시 저장해 주세요.';
 };
 var c=el('diDirectConfirmed');if(c)c.addEventListener('change',window.fillDirectDate);
})();
