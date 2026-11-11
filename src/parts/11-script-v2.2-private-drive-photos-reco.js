
/* v2.2 photo thumbnails cache (이 버전에서는 서버가 없어 외부 사진 저장은 비활성; 기기 안 사진 저장은 추후 PIL.noServer 자리에 구현). */
var THUMBS={};
try{THUMBS=JSON.parse(localStorage.getItem('penInkLab_thumbs_v1')||'{}')||{}}catch(_){THUMBS={}}
function storeThumbs(){try{localStorage.setItem('penInkLab_thumbs_v1',JSON.stringify(THUMBS))}catch(_){}}
(function(){
 'use strict';
 var asked={},timer=null;
 function want(id){if(THUMBS[id]||asked[id])return;asked[id]=1;clearTimeout(timer);timer=setTimeout(fetchThumbs,50)}
 function fetchThumbs(){
  var ids=Object.keys(asked).filter(function(id){return asked[id]===1&&!THUMBS[id]});
  if(!ids.length||!(false))return;
  ids.forEach(function(id){asked[id]=2});
  PIL.noServer().withSuccessHandler(function(r){
   if(!r||!r.ok)return;var n=0;
   Object.keys(r.thumbs||{}).forEach(function(id){THUMBS[id]=r.thumbs[id];n++});
   if(n){storeThumbs();try{drawPens()}catch(_){}}
  }).getPhotoThumbs(ids);
 }
 var base=penPhoto;
 penPhoto=function(p){
  if(p&&typeof p.photo==='string'&&p.photo.indexOf('drive:')===0){
   var id=p.photo.slice(6);
   if(THUMBS[id])return {u:THUMBS[id],c:'u'};
   want(id);return null;
  }
  return base(p);
 };
 try{drawPens()}catch(_){}
})();
