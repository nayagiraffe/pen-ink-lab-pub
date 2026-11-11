
/* 로컬 저장 보호: 서버가 없으므로 데이터가 사라지지 않게 백업 알림·영구 저장 요청·저장 용량 안내·홈 화면 설치 안내를 한다 */
(function(){
 'use strict';
 var PIL=window.PIL;
 var K_BACKUP='pil_last_backup',K_SNOOZE='pil_backup_snooze',K_IOS='pil_ios_hint_off',K_INSTALL='pil_install_off';
 var DAY=864e5,REMIND_DAYS=14,SNOOZE_DAYS=3,MIN_ITEMS=3;
 var QUOTA_CHARS=5*1024*1024,QUOTA_WARN=0.7; /* 브라우저 저장 한도(약 5MB)의 70%를 넘으면 안내 */
 var deferredPrompt=null,persisted=null,persistAsked=false;

 function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
 function set(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}
 function num(k){var n=Number(get(k));return isFinite(n)&&n>0?n:0}
 function items(){return (db.pens||[]).length+(db.inks||[]).length}
 function when(ts){
  if(!ts)return '아직 없음';
  var d=Math.floor((Date.now()-ts)/DAY);
  return (d<=0?'오늘':d+'일 전')+' ('+new Date(ts).toLocaleDateString('ko-KR')+')';
 }
 function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
 function isStandalone(){
  try{if(navigator.standalone===true)return true}catch(e){}
  try{return !!(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)}catch(e){return false}
 }
 function usedChars(){try{return JSON.stringify(db).length}catch(e){return 0}}

 PIL.markBackedUp=function(){set(K_BACKUP,Date.now());update()};
 PIL.backupState=function(){return {lastBackup:num(K_BACKUP),items:items(),persisted:persisted,chars:usedChars()}};

 /* ── 배너 ── */
 function host(){
  var h=document.getElementById('pilBanners');if(h)return h;
  var c=document.querySelector('.content');if(!c)return null;
  h=document.createElement('div');h.id='pilBanners';c.insertBefore(h,c.firstChild);return h;
 }
 function banner(id,cls,html){
  var h=host();if(!h)return;
  var el=document.getElementById(id);
  if(!html){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id=id;el.setAttribute('role','status');h.appendChild(el)}
  el.className='pil-banner '+cls;
  if(el.getAttribute('data-html')!==html){el.innerHTML=html;el.setAttribute('data-html',html)}
 }
 function backupBanner(){
  var last=num(K_BACKUP);
  var need=items()>=MIN_ITEMS&&num(K_SNOOZE)<=Date.now()&&(!last||Date.now()-last>=REMIND_DAYS*DAY);
  banner('pilBackupBanner','warn',need?
   '💾 <b>백업을 받아 두세요.</b> 데이터는 이 기기에만 저장돼서, 기기를 잃어버리거나 브라우저 데이터를 지우면 사라져요. 마지막 백업: <b>'+when(last)+'</b>'+
   '<div class="row"><button type="button" class="btn" data-pil="backup">지금 백업</button><button type="button" class="btn outline" data-pil="snooze">나중에 (3일)</button></div>':'');
 }
 function quotaBanner(){
  var n=usedChars();
  banner('pilQuotaBanner','warn',n>QUOTA_CHARS*QUOTA_WARN?
   '⚠ <b>저장 공간이 거의 찼어요</b> (약 '+Math.round(n/1024)+'KB 사용). 가득 차면 새 내용이 저장되지 않아요. 지금 백업을 받아 두고, 오래된 기록을 정리해 주세요.'+
   '<div class="row"><button type="button" class="btn" data-pil="backup">지금 백업</button></div>':'');
 }
 function iosBanner(){
  var show=isIOS()&&!isStandalone()&&!get(K_IOS);
  banner('pilIosBanner','',show?
   '📲 <b>홈 화면에 추가해서 사용하세요.</b> iPhone은 Safari 탭과 홈 화면 앱의 저장 공간이 <b>따로</b>예요. 먼저 홈 화면에 추가하고 <b>그 앱에서</b> 입력해야 데이터가 안전해요. (공유 버튼 ⬆ → <b>홈 화면에 추가</b>)'+
   (items()>0?'<br>이미 이 화면에 입력한 데이터가 있다면 먼저 <b>백업</b>을 받고, 홈 화면 앱에서 <b>복원</b>하세요.':'')+
   '<div class="row">'+(items()>0?'<button type="button" class="btn" data-pil="backup">지금 백업</button>':'')+'<button type="button" class="btn outline" data-pil="ios-off">확인했어요</button></div>':'');
 }
 function installBanner(){
  var show=!!deferredPrompt&&!isStandalone()&&!get(K_INSTALL);
  banner('pilInstallBanner','',show?
   '📲 <b>앱으로 설치하면 더 안전해요.</b> 홈 화면에서 바로 열 수 있고 인터넷 없이도 쓸 수 있어요.'+
   '<div class="row"><button type="button" class="btn" data-pil="install">앱으로 설치</button><button type="button" class="btn outline" data-pil="install-off">괜찮아요</button></div>':'');
 }
 window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;installBanner()});
 window.addEventListener('appinstalled',function(){deferredPrompt=null;installBanner()});

 document.addEventListener('click',function(e){
  var b=e.target.closest('[data-pil]');if(!b)return;
  var a=b.getAttribute('data-pil');
  if(a==='backup'){var d=document.getElementById('downloadJson');if(d)d.click()}
  else if(a==='snooze'){set(K_SNOOZE,Date.now()+SNOOZE_DAYS*DAY);update()}
  else if(a==='ios-off'){set(K_IOS,'1');update()}
  else if(a==='install-off'){set(K_INSTALL,'1');update()}
  else if(a==='install'&&deferredPrompt){deferredPrompt.prompt();try{deferredPrompt.userChoice.then(function(){deferredPrompt=null;installBanner()})}catch(_){}}
 });

 /* ── 영구 저장 요청 (브라우저가 공간 부족 때 데이터를 지우지 않도록) ── */
 function refreshPersisted(cb){
  try{
   if(navigator.storage&&navigator.storage.persisted){navigator.storage.persisted().then(function(v){persisted=v;cb&&cb()},function(){persisted=null;cb&&cb()});return}
  }catch(e){}
  persisted=null;cb&&cb();
 }
 function ensurePersist(){
  if(persistAsked||items()===0)return;
  persistAsked=true;
  try{
   if(navigator.storage&&navigator.storage.persist){navigator.storage.persist().then(function(){refreshPersisted(info)},function(){})}
  }catch(e){}
 }

 /* ── 백업 화면의 상태 줄 ── */
 function info(){
  var el=document.getElementById('backupInfo');if(!el)return;
  var n=usedChars();
  var p=persisted===true?'허용됨':persisted===false?'미허용 (브라우저가 공간이 부족하면 지울 수 있어요. 백업을 권장해요)':'확인할 수 없음';
  el.innerHTML='마지막 백업: <b>'+when(num(K_BACKUP))+'</b> · 저장 용량: 약 '+Math.round(n/1024)+'KB / '+Math.round(QUOTA_CHARS/1024)+'KB · 영구 저장: '+p+(PIL.photos&&PIL.photos.stats().count?' · 사진 '+PIL.photos.stats().count+'장 (약 '+(PIL.photos.stats().bytes/1048576).toFixed(1)+'MB, 기기 안 별도 저장)':'');
 }

 function update(){
  try{backupBanner();quotaBanner();iosBanner();installBanner();info();ensurePersist()}catch(e){console.warn('local care',e)}
 }
 PIL.onRefreshAdd(update);
 refreshPersisted(update);
})();
