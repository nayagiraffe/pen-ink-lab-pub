
/* Independent startup watchdog. It must run before the large application script. */
(function(){
 'use strict';
 var state={ready:false,failed:false,message:''};
 function diag(title,msg,bad){
  var e=document.getElementById('bootDiagnostic');if(!e)return;
  e.className=bad?'bad':'good';
  var heading=document.getElementById('bootHeading');if(heading)heading.textContent=title;
  var detail=document.getElementById('bootDetails');if(detail)detail.textContent=msg||'';
  if(bad){var copy=document.getElementById('bootCopy');if(copy)copy.hidden=false;}
 }
 function fail(message){
  state.failed=true;state.message=String(message||'초기화 중 알 수 없는 오류');
  diag('앱 실행 오류 · 버튼이 작동하지 않을 수 있습니다',
   state.message+'\n브라우저를 새로고침해 보세요. 계속되면 최신 Chrome·Safari에서 열어 주세요.',true);
 }
 window.__pilBoot={
  state:state,
  ready:function(){
   state.ready=true;
   if(!state.failed)diag('앱 준비 완료 · v__APP_VERSION__','메뉴와 입력 기능의 스크립트가 시작되었습니다.',false);
  },
  fail:fail
 };
 window.addEventListener('error',function(e){
  if(!state.ready)fail('자바스크립트 실행 실패: '+String(e.message||'알 수 없는 오류'));
  else fail('사용 중 실행 오류: '+String(e.message||'알 수 없는 오류'));
 });
 window.addEventListener('unhandledrejection',function(e){fail('처리되지 않은 작업 오류: '+String(e.reason?.message||e.reason||'알 수 없는 오류'));});
 document.addEventListener('click',function(e){
  var t=e.target.closest?.('.tabs button');
  if(t&&!state.ready){
   var id=t.getAttribute('data-tab');
   document.querySelectorAll('section').forEach(function(x){x.classList.toggle('on',x.id===id)});
   document.querySelectorAll('.tabs button').forEach(function(x){x.classList.toggle('on',x===t)});
   fail('메뉴만 임시 전환되었습니다. 데이터 처리 스크립트가 시작되지 않아 저장·추천은 작동하지 않습니다.');
  }
 },true);
 document.addEventListener('click',function(e){
  if(e.target.id!=='bootCopy')return;
  var msg='Pen & Ink Lab / '+String(state.message||'상태 미확인')+' / '+(location?.pathname||'');
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(msg).catch(function(){window.prompt('진단 정보를 복사하세요',msg)});
  else window.prompt('진단 정보를 복사하세요',msg);
 });
 setTimeout(function(){if(!state.ready&&!state.failed)fail('앱 실행이 완료되지 않았습니다. 파일 미리보기·구버전 배포·스크립트 차단을 확인하세요.');},5000);
})();
