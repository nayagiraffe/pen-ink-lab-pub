
/* PWA: 서비스 워커를 등록해 앱을 기기에 보관한다 (인터넷 없이도 열림). http(s) 로 열었을 때만 동작하고, 파일로 직접 열면 건너뛴다. */
(function(){
 'use strict';
 if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
 var hadController=!!navigator.serviceWorker.controller;
 /* 이미 앱을 쓰던 중에 새 버전이 설치되면 알려 준다 (다시 열면 적용) */
 navigator.serviceWorker.addEventListener('controllerchange',function(){
  if(hadController&&window.PIL&&PIL.toast)PIL.toast('새 버전이 준비됐어요. 앱을 닫았다 다시 열면 적용돼요.',{ms:8000});
  hadController=true;
 });
 window.addEventListener('load',function(){
  navigator.serviceWorker.register('sw.js').catch(function(e){console.warn('서비스 워커 등록 실패',e)});
 });
})();
