
/* 기기 안 사진: 앨범·카메라 사진을 줄여서 브라우저(IndexedDB)에 저장하고 만년필·잉크 카드에 보여 준다.
   카드 데이터에는 'local:<id>' 참조만 들어가고, 사진이 있으면 전체 백업은 .zip(데이터+사진)으로 받아진다. 서버 없음. */
(function(){
 'use strict';
 var PIL=window.PIL;
 var DB_NAME='pil-photos',FULL_MAX=1280,THUMB_MAX=360,Q_FULL=0.82,Q_THUMB=0.78,MAX_FILE=40*1024*1024;
 var thumbURL=new Map(),sizes=new Map(),failed=false,dbp=null,lastPreview='';

 function idOf(ref){return typeof ref==='string'&&ref.indexOf('local:')===0?ref.slice(6):''}
 function req2p(r){return new Promise(function(res,rej){r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}})}
 function txDone(t){return new Promise(function(res,rej){t.oncomplete=function(){res()};t.onerror=function(){rej(t.error)};t.onabort=function(){rej(t.error||new Error('abort'))}})}

 /* ── IndexedDB (thumbs: 목록용 작은 사진 / full: 큰 사진) ── */
 function openDb(){
  if(dbp)return dbp;
  dbp=new Promise(function(res,rej){
   if(!window.indexedDB){rej(new Error('no-idb'));return}
   var r;try{r=indexedDB.open(DB_NAME,1)}catch(e){rej(e);return}
   r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('thumbs'))d.createObjectStore('thumbs');if(!d.objectStoreNames.contains('full'))d.createObjectStore('full')};
   r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error||new Error('idb'))};r.onblocked=function(){rej(new Error('blocked'))};
  });
  dbp.catch(function(){failed=true});
  return dbp;
 }
 function setThumb(id,blob,fullBytes){
  var old=thumbURL.get(id);if(old)URL.revokeObjectURL(old);
  thumbURL.set(id,URL.createObjectURL(blob));sizes.set(id,blob.size+(fullBytes||0));
 }
 function loadThumbs(){
  return openDb().then(function(d){
   var s=d.transaction('thumbs','readonly').objectStore('thumbs');
   return Promise.all([req2p(s.getAllKeys()),req2p(s.getAll())]);
  }).then(function(r){r[0].forEach(function(k,i){var v=r[1][i];if(v&&v.b)setThumb(String(k),v.b,v.full)})});
 }

 /* 카드가 쓰는 주소: local 참조면 썸네일 주소(없으면 ''), 아니면 undefined(다른 종류의 사진) */
 PIL.photoSrc=function(ref){var id=idOf(ref);return id?(thumbURL.get(id)||''):undefined};

 /* ── 사진 줄이기 ── */
 function viaImg(file){
  return new Promise(function(res,rej){
   var u=URL.createObjectURL(file),im=new Image();
   im.onload=function(){URL.revokeObjectURL(u);res(im)};
   im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('decode'))};
   im.src=u;
  });
 }
 function toBlob(src,w,h,max,q){
  var s=Math.min(1,max/Math.max(w,h)),cw=Math.max(1,Math.round(w*s)),ch=Math.max(1,Math.round(h*s));
  var c=document.createElement('canvas');c.width=cw;c.height=ch;
  var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cw,ch);g.imageSmoothingQuality='high';g.drawImage(src,0,0,cw,ch);
  return new Promise(function(res,rej){c.toBlob(function(b){b?res({blob:b,w:cw,h:ch}):rej(new Error('encode'))},'image/jpeg',q)});
 }

 var photos=PIL.photos={
  stats:function(){var b=0;sizes.forEach(function(v){b+=v});return {count:thumbURL.size,bytes:b}},
  available:function(){return !failed},
  has:function(ref){return thumbURL.has(idOf(ref))},
  add:function(file){
   if(!file)return Promise.reject(new Error('파일이 없어요.'));
   if(file.size>MAX_FILE)return Promise.reject(new Error('사진이 너무 커요. (40MB 이하)'));
   if(file.type&&!/^image\//.test(file.type))return Promise.reject(new Error('사진 파일이 아니에요.'));
   return openDb().catch(function(){throw new Error('이 브라우저에서는 사진을 저장할 수 없어요. (사생활 보호 모드이거나 저장이 막혀 있을 수 있어요)')}).then(function(d){
    return viaImg(file).catch(function(){throw new Error('사진을 읽을 수 없어요. 지원하지 않는 형식일 수 있어요.')}).then(function(im){
     var w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;
     return Promise.all([toBlob(im,w,h,FULL_MAX,Q_FULL),toBlob(im,w,h,THUMB_MAX,Q_THUMB)]);
    }).then(function(r){
     var id='ph'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
     var t=d.transaction(['thumbs','full'],'readwrite');
     t.objectStore('thumbs').put({b:r[1].blob,full:r[0].blob.size},id);t.objectStore('full').put(r[0].blob,id);
     return txDone(t).then(function(){setThumb(id,r[1].blob,r[0].blob.size);return 'local:'+id},function(e){
      throw new Error(e&&e.name==='QuotaExceededError'?'저장 공간이 부족해요. 백업을 받고 오래된 사진을 정리해 주세요.':'사진을 저장하지 못했어요.');
     });
    });
   });
  },
  remove:function(ref){
   var id=idOf(ref);if(!id)return Promise.resolve();
   var u=thumbURL.get(id);if(u)URL.revokeObjectURL(u);thumbURL.delete(id);sizes.delete(id);
   return openDb().then(function(d){var t=d.transaction(['thumbs','full'],'readwrite');t.objectStore('thumbs').delete(id);t.objectStore('full').delete(id);return txDone(t)}).catch(function(){});
  },
  clear:function(){
   thumbURL.forEach(function(u){URL.revokeObjectURL(u)});thumbURL.clear();sizes.clear();
   return openDb().then(function(d){var t=d.transaction(['thumbs','full'],'readwrite');t.objectStore('thumbs').clear();t.objectStore('full').clear();return txDone(t)}).catch(function(){});
  },
  fullBlob:function(ref){
   var id=idOf(ref);if(!id)return Promise.resolve(null);
   return openDb().then(function(d){return req2p(d.transaction('full','readonly').objectStore('full').get(id))}).catch(function(){return null});
  },
  /* 백업 파일의 사진 목록으로 저장된 사진 전체를 바꾼다. list: [{id, full:Uint8Array, thumb:Uint8Array|null}] */
  replaceAll:function(list){
   return openDb().then(function(d){
    var t=d.transaction(['thumbs','full'],'readwrite'),th=t.objectStore('thumbs'),fu=t.objectStore('full');
    th.clear();fu.clear();
    list.forEach(function(p){
     var full=new Blob([p.full],{type:'image/jpeg'}),thumb=new Blob([p.thumb||p.full],{type:'image/jpeg'});
     th.put({b:thumb,full:full.size},p.id);fu.put(full,p.id);
    });
    return txDone(t).then(function(){
     thumbURL.forEach(function(u){URL.revokeObjectURL(u)});thumbURL.clear();sizes.clear();
     list.forEach(function(p){var thumb=new Blob([p.thumb||p.full],{type:'image/jpeg'});setThumb(p.id,thumb,p.full.length)});
    });
   });
  }
 };

 function refIds(){
  var ids=[];(db.pens||[]).concat(db.inks||[]).forEach(function(x){var id=idOf(x&&x.photo);if(id&&ids.indexOf(id)<0)ids.push(id)});
  return ids;
 }

 /* ── 사진 시트 (앨범 · 카메라 · 주소 · 지우기) ── */
 function esc2(s){return esc(s)}
 PIL.photoSheet=function(kind,id){
  var list=kind==='pen'?db.pens:db.inks,item=list.find(function(x){return x.id===id});if(!item)return;
  var s=PIL.sheet((kind==='pen'?'만년필':'잉크')+' 사진 · '+item.brand+' '+item.name,
   '<div class="pil-photo-prev" id="pilPhPrev"><span class="pil-photo-none">아직 사진이 없어요</span></div>'+
   '<div class="pil-photo-btns"><label class="btn primary">📁 앨범에서 선택<input type="file" accept="image/*" hidden data-pick="album"></label>'+
   '<label class="btn">📷 카메라로 촬영<input type="file" accept="image/*" capture="environment" hidden data-pick="camera"></label>'+
   (kind==='pen'?'<button type="button" class="btn outline" data-ph="url">🔗 이미지 주소로 넣기</button>':'')+
   '<button type="button" class="btn outline" data-ph="remove">🗑 사진 지우기</button></div>'+
   '<p class="hint" id="pilPhMsg" role="status">사진은 이 기기에만 저장돼요. 보관할 때 크기를 줄여요. 전체 백업(.zip)에는 사진도 함께 들어가요.</p>');
  var el=s.el,msg=function(t,bad){var m=el.querySelector('#pilPhMsg');m.textContent=t;m.style.color=bad?'var(--bad,#a12626)':''};
  var prev=el.querySelector('#pilPhPrev');
  function showPreview(){
   var ref=item.photo,lid=idOf(ref);
   if(lid){
    photos.fullBlob(ref).then(function(b){
     if(!b||!el.isConnected)return;
     if(lastPreview)URL.revokeObjectURL(lastPreview);lastPreview=URL.createObjectURL(b);
     prev.innerHTML='<img alt="">';prev.firstChild.src=lastPreview;
    });
   }else if(typeof ref==='string'&&/^https:\/\//i.test(ref)){prev.innerHTML='<img alt="" referrerpolicy="no-referrer">';prev.firstChild.src=ref}
  }
  showPreview();
  function busy(on){el.querySelectorAll('button,input').forEach(function(b){b.disabled=on})}
  el.addEventListener('change',function(e){
   var inp=e.target.closest('input[type=file]');if(!inp)return;
   var f=inp.files&&inp.files[0];inp.value='';if(!f)return;
   busy(true);msg('사진을 줄이는 중…');
   photos.add(f).then(function(ref){
    var old=item.photo;item.photo=ref;if(idOf(old)&&old!==ref)photos.remove(old);
    save();refresh();s.close();
   },function(err){busy(false);msg(err.message,true)});
  });
  el.addEventListener('click',function(e){
   var b=e.target.closest('[data-ph]');if(!b)return;
   if(b.dataset.ph==='remove'){
    if(!item.photo||item.photo==='none'){msg('지울 사진이 없어요.',true);return}
    if(!confirm('이 사진을 지울까요?'))return;
    var old=item.photo;delete item.photo;if(idOf(old))photos.remove(old);save();refresh();s.close();
   }else if(b.dataset.ph==='url'){
    var v=window.prompt('사진 이미지 주소(https://…)를 붙여 넣으세요.\n· 비우고 확인: 사진 없이 기본 그림으로\n· 그림 입력: 사진 대신 펜 그림 사용',idOf(item.photo)||item.photo==='none'?'':(item.photo||''));
    if(v===null)return;v=v.trim();
    var old2=item.photo;
    if(v===''){delete item.photo}else if(v==='그림'){item.photo='none'}else if(/^https:\/\/\S+$/i.test(v)){item.photo=v.slice(0,1000)}else{msg('https:// 로 시작하는 이미지 주소를 넣어 주세요.',true);return}
    if(idOf(old2)&&old2!==item.photo)photos.remove(old2);
    save();refresh();s.close();
   }
  });
 };
 document.addEventListener('click',function(e){
  var b=e.target.closest('[data-inkphoto]');if(!b)return;
  e.preventDefault();e.stopPropagation();PIL.photoSheet('ink',b.getAttribute('data-inkphoto'));
 },true);

 /* ── ZIP 읽기 (복원용): 저장(STORE)과 압축(deflate) 모두 지원, 입력은 신뢰하지 않고 검증한다 ── */
 var NAME_OK=/^(data\.json|photos\/[A-Za-z0-9_-]{1,64}\.(t\.)?jpg)$/;
 function inflate(raw,limit){
  if(typeof DecompressionStream==='undefined')return Promise.reject(new Error('이 브라우저는 압축된 zip 을 읽지 못해요.'));
  var ds=new DecompressionStream('deflate-raw'),w=ds.writable.getWriter();
  w.write(raw).catch(function(){});w.close().catch(function(){});
  var r=ds.readable.getReader(),chunks=[],n=0;
  function pump(){return r.read().then(function(x){
   if(x.done){var out=new Uint8Array(n),o=0;chunks.forEach(function(c){out.set(c,o);o+=c.length});return out}
   n+=x.value.length;if(n>limit){r.cancel();throw new Error('zip 항목 크기가 맞지 않아요.')}
   chunks.push(x.value);return pump();
  })}
  return pump();
 }
 function unzip(u8){
  var dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength),e=-1;
  for(var i=u8.length-22;i>=Math.max(0,u8.length-22-65535);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
  if(e<0)return Promise.reject(new Error('zip 형식이 아니에요.'));
  var n=dv.getUint16(e+10,true),p=dv.getUint32(e+16,true);
  if(n>5000)return Promise.reject(new Error('zip 항목이 너무 많아요.'));
  var jobs=[],total=0,dec=new TextDecoder();
  for(var k=0;k<n;k++){
   if(p+46>u8.length||dv.getUint32(p,true)!==0x02014b50)return Promise.reject(new Error('zip 이 손상됐어요.'));
   var method=dv.getUint16(p+10,true),crc=dv.getUint32(p+16,true),csize=dv.getUint32(p+20,true),usize=dv.getUint32(p+24,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
   var name=dec.decode(u8.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
   if(!NAME_OK.test(name))continue;                                  /* 알 수 없는 이름은 무시 */
   if(usize>60*1024*1024)return Promise.reject(new Error('zip 항목이 너무 커요.'));
   total+=usize;if(total>400*1024*1024)return Promise.reject(new Error('zip 전체가 너무 커요.'));
   if(off+30>u8.length||dv.getUint32(off,true)!==0x04034b50)return Promise.reject(new Error('zip 이 손상됐어요.'));
   var ls=off+30+dv.getUint16(off+26,true)+dv.getUint16(off+28,true);
   if(ls+csize>u8.length)return Promise.reject(new Error('zip 이 손상됐어요.'));
   jobs.push({name:name,method:method,crc:crc,usize:usize,raw:u8.subarray(ls,ls+csize)});
  }
  var out={};
  return jobs.reduce(function(pr,j){return pr.then(function(){
   var get=j.method===0?Promise.resolve(j.raw.slice()):j.method===8?inflate(j.raw,j.usize):Promise.reject(new Error('지원하지 않는 zip 압축 방식이에요.'));
   return get.then(function(data){
    if(data.length!==j.usize||PIL.crc32(data)!==j.crc)throw new Error('zip 안의 파일이 손상됐어요.');
    out[j.name]=data;
   });
  })},Promise.resolve()).then(function(){return out});
 }
 PIL.unzip=unzip;

 /* ── 백업 ── */
 PIL.backup=function(){
  var date=localDate(),ids=refIds().filter(function(id){return thumbURL.has(id)});
  if(!ids.length){
   download(JSON.stringify(db,null,2),'pen_ink_lab_backup_'+date+'.json','application/json;charset=utf-8');
   PIL.markBackedUp();return Promise.resolve();
  }
  return openDb().then(function(d){
   var tf=d.transaction(['thumbs','full'],'readonly'),th=tf.objectStore('thumbs'),fu=tf.objectStore('full');
   return Promise.all(ids.map(function(id){return Promise.all([req2p(fu.get(id)),req2p(th.get(id))]).then(function(r){return {id:id,full:r[0],thumb:r[1]&&r[1].b}})}));
  }).then(function(rows){
   rows=rows.filter(function(r){return r.full});
   return Promise.all(rows.map(function(r){return Promise.all([r.full.arrayBuffer(),r.thumb?r.thumb.arrayBuffer():null]).then(function(b){return {id:r.id,full:new Uint8Array(b[0]),thumb:b[1]?new Uint8Array(b[1]):null}})}));
  }).then(function(rows){
   var files=[['data.json',JSON.stringify(db,null,2)]];
   rows.forEach(function(r){files.push(['photos/'+r.id+'.jpg',r.full]);if(r.thumb)files.push(['photos/'+r.id+'.t.jpg',r.thumb])});
   PIL.saveBlob(PIL.zipFiles(files,'application/zip'),'pen_ink_lab_backup_'+date+'.zip');
   PIL.markBackedUp();
   PIL.toast('사진 '+rows.length+'장을 포함해 백업했어요 (.zip)');
  }).catch(function(err){alert('백업 파일을 만들지 못했어요: '+(err&&err.message||err))});
 };

 /* ── 복원: .json 또는 .zip ── */
 function normalizeDb(d){
  var o=Object.assign({},d,{history:Array.isArray(d.history)?d.history:[],testReviews:Array.isArray(d.testReviews)?d.testReviews:[]});
  o.inks.forEach(function(ink){if(ink.packageType===undefined)ink.packageType='unknown';if(ink.capacityMl===undefined)ink.capacityMl=null;if(ink.remainingMl===undefined)ink.remainingMl=null});
  o.pens.forEach(function(p){if(!p.fillVerified)p.fillVerified=false;if(!p.fillDate)p.fillDate=''});
  return o;
 }
 function isJpeg(u8){return u8&&u8.length>3&&u8[0]===0xFF&&u8[1]===0xD8}
 PIL.restore=function(file){
  var bad='백업 파일을 읽을 수 없어요. 이 앱에서 받은 .json 또는 .zip 파일인지 확인해 주세요.';
  return file.arrayBuffer().then(function(buf){
   var u8=new Uint8Array(buf);
   if(u8[0]===0x50&&u8[1]===0x4b){
    return unzip(u8).then(function(z){
     if(!z['data.json'])throw new Error('data.json 이 없어요.');
     var data=JSON.parse(new TextDecoder().decode(z['data.json'])),list=[];
     Object.keys(z).forEach(function(n){
      var m=n.match(/^photos\/([A-Za-z0-9_-]{1,64})\.jpg$/);if(!m||!isJpeg(z[n]))return;
      var t=z['photos/'+m[1]+'.t.jpg'];list.push({id:m[1],full:z[n],thumb:isJpeg(t)?t:null});
     });
     return {data:data,photos:list};
    });
   }
   return {data:JSON.parse(new TextDecoder().decode(u8)),photos:null};
  }).then(function(r){
   var d=r.data;if(!d||!Array.isArray(d.inks)||!Array.isArray(d.pens))throw new Error('format');
   var np=r.photos?r.photos.length:0;
   if(!confirm('만년필 '+d.pens.length+'개, 잉크 '+d.inks.length+'종'+(np?', 사진 '+np+'장':'')+'으로 기존 데이터를 대체할까요?'))return;
   var step=r.photos?photos.replaceAll(r.photos).catch(function(e){alert('사진을 복원하지 못했어요: '+(e&&e.message||e))}):Promise.resolve();
   return step.then(function(){db=normalizeDb(d);save();refresh();alert('복원 완료'+(np?' (사진 '+np+'장 포함)':''))});
  }).catch(function(err){alert(err&&err.message&&!/^(format|Unexpected|JSON)/.test(err.message)&&!/in JSON/.test(err.message)?err.message:bad)});
 };

 /* 시작: 저장된 썸네일을 불러와 카드를 다시 그린다 */
 loadThumbs().then(function(){if(thumbURL.size)refresh()},function(){});
})();
