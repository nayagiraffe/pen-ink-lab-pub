
/* 내보내기: 엑셀(.xlsx) 저장과 인쇄·PDF. 외부 라이브러리 없이 최소 ZIP(무압축)+SpreadsheetML 로 직접 만든다. */
(function(){
 'use strict';
 var PIL=window.PIL;
 var $$=function(id){return document.getElementById(id)};

 /* ───────── 데이터 → 표 ───────── */
 var PKG={unknown:'미확인',sample:'소분',bottle:'본병',cartridge:'카트리지'};
 var EVID={'hands-on':'직접 시필',photo:'사진만'};
 function nm(o,none){return o?((o.brand||'')+' '+(o.name||'')).trim():(none||'')}
 function num(v){if(v===null||v===undefined||v==='')return '';var n=Number(v);return isFinite(n)?n:String(v)}
 function fillLabel(p){var s=penFillState(p);return s==='filled'?'현재 잉입':s==='uncertain'?'현재 미확인':'미잉입'}
 function curInk(p){return p.inkName&&p.inkName!=='—'?{brand:p.inkBrand||'',name:p.inkName}:null}

 function sheets(){
  var pens=sortedCollection(db.pens||[]),inks=sortedCollection(db.inks||[]);
  var penById={},inkById={};(db.pens||[]).forEach(function(p){penById[p.id]=p});(db.inks||[]).forEach(function(i){inkById[i.id]=i});
  var map=null;try{map=inkPenMap()}catch(e){map=null}
  var hist=(db.history||[]).slice().reverse();
  var tests=(db.testReviews||[]).slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))});
  return [
   {name:'만년필',head:['브랜드','모델','닙','현재 상태','현재 잉크 브랜드','현재 잉크','확인 일자','메모'],
    rows:pens.map(function(p){var c=curInk(p);return [p.brand||'',p.name||'',p.nib||'',fillLabel(p),c?c.brand:'',c?c.name:'',p.fillDate||'',p.notes||'']})},
   {name:'잉크',head:['브랜드','잉크명','색 계열','색조','특성','흐름 메모','보유 형태','보유 용량(mL)','잔량(mL)','지금 든 만년필','메모'],
    rows:inks.map(function(i){
     var using=map&&map.get?((map.get(i.id)||[]).map(function(o){return nm(o.p)}).join(' / ')):'';
     return [i.brand||'',i.name||'',i.family||'',i.hue||'',i.effect||'',i.flow||'',PKG[i.packageType]||PKG.unknown,num(i.capacityMl),num(i.remainingMl),using,i.notes||'']})},
   {name:'잉입 기록',head:['날짜','유형','만년필','잉크','이전 잉크','평가','메모'],
    rows:hist.map(function(h){return [h.when||'',h.type||'',nm(penById[h.penId],'(삭제된 만년필)'),nm(inkById[h.inkId],h.inkId?'(삭제된 잉크)':''),h.previousInk||'',h.rating||'',h.note||'']})},
   {name:'시필 노트',head:['날짜','만년필','잉크','종이','흐름(1-5)','굵기(1-5)','부드러움(1-5)','번짐(0-3)','평점(1-5)','근거','메모'],
    rows:tests.map(function(t){return [t.date||'',nm(penById[t.penId],'(삭제된 만년필)'),nm(inkById[t.inkId],'(삭제된 잉크)'),t.paper||'',num(t.flow),num(t.width),num(t.smooth),num(t.feather),num(t.rating),EVID[t.evidence]||t.evidence||'',t.memo||'']})}
  ];
 }
 PIL.exportTables=sheets;

 /* ───────── XLSX 생성 ───────── */
 var CRC=(function(){var t=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t})();
 function crc32(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CRC[(c^b[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
 var enc=new TextEncoder();
 function xesc(s){return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
 function colName(i){var s='';i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
 function textWidth(s){var w=0;String(s).split('').forEach(function(ch){w+=/[ᄀ-ᇿ㄰-㆏가-힯一-鿿぀-ヿ]/.test(ch)?2:1});return w}

 function sheetXml(sh){
  var cols=sh.head.map(function(h,c){
   var w=textWidth(h);sh.rows.forEach(function(r){var v=String(r[c]===undefined?'':r[c]).split('\n')[0];w=Math.max(w,textWidth(v))});
   return '<col min="'+(c+1)+'" max="'+(c+1)+'" width="'+Math.min(48,Math.max(9,w+2))+'" customWidth="1"/>'}).join('');
  function cell(r,c,v,style){
   var ref=colName(c)+r;
   if(typeof v==='number')return '<c r="'+ref+'"'+(style?' s="'+style+'"':'')+'><v>'+v+'</v></c>';
   if(v===''||v===null||v===undefined)return '';
   return '<c r="'+ref+'"'+(style?' s="'+style+'"':'')+' t="inlineStr"><is><t xml:space="preserve">'+xesc(v)+'</t></is></c>';
  }
  var rows=['<row r="1">'+sh.head.map(function(h,c){return cell(1,c,h,1)}).join('')+'</row>'];
  sh.rows.forEach(function(r,i){rows.push('<row r="'+(i+2)+'">'+r.map(function(v,c){return cell(i+2,c,v,0)}).join('')+'</row>')});
  var last=colName(sh.head.length-1)+Math.max(1,sh.rows.length+1);
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
   '<dimension ref="A1:'+last+'"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+
   '<sheetFormatPr defaultRowHeight="15"/><cols>'+cols+'</cols><sheetData>'+rows.join('')+'</sheetData><autoFilter ref="A1:'+last+'"/></worksheet>';
 }
 var NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main',RNS='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 function parts(shs){
  var f=[];
  var ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
   shs.map(function(_,i){return '<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'}).join('')+'</Types>';
  f.push(['[Content_Types].xml',ct]);
  f.push(['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+RNS+'/officeDocument" Target="xl/workbook.xml"/></Relationships>']);
  f.push(['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="'+NS+'" xmlns:r="'+RNS+'"><bookViews><workbookView/></bookViews><sheets>'+
   shs.map(function(s,i){return '<sheet name="'+xesc(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>'}).join('')+'</sheets></workbook>']);
  f.push(['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
   shs.map(function(_,i){return '<Relationship Id="rId'+(i+1)+'" Type="'+RNS+'/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>'}).join('')+
   '<Relationship Id="rId'+(shs.length+1)+'" Type="'+RNS+'/styles" Target="styles.xml"/></Relationships>']);
  f.push(['xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="'+NS+'"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'+
   '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFEBE0"/><bgColor indexed="64"/></patternFill></fill></fills>'+
   '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FF999999"/></bottom><diagonal/></border></borders>'+
   '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
   '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs>'+
   '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']);
  shs.forEach(function(s,i){f.push(['xl/worksheets/sheet'+(i+1)+'.xml',sheetXml(s)])});
  return f;
 }
 /* 무압축(STORE) ZIP */
 function zip(files,mime){
  var d=new Date(),dosT=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),dosD=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  var chunks=[],central=[],offset=0;
  files.forEach(function(f){
   var name=enc.encode(f[0]),data=typeof f[1]==='string'?enc.encode(f[1]):f[1],crc=crc32(data);
   var lh=new DataView(new ArrayBuffer(30));
   lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,dosT,true);lh.setUint16(12,dosD,true);
   lh.setUint32(14,crc,true);lh.setUint32(18,data.length,true);lh.setUint32(22,data.length,true);lh.setUint16(26,name.length,true);lh.setUint16(28,0,true);
   chunks.push(new Uint8Array(lh.buffer),name,data);
   var ch=new DataView(new ArrayBuffer(46));
   ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,dosT,true);ch.setUint16(14,dosD,true);
   ch.setUint32(16,crc,true);ch.setUint32(20,data.length,true);ch.setUint32(24,data.length,true);ch.setUint16(28,name.length,true);ch.setUint16(30,0,true);ch.setUint16(32,0,true);
   ch.setUint16(34,0,true);ch.setUint16(36,0,true);ch.setUint32(38,0,true);ch.setUint32(42,offset,true);
   central.push(new Uint8Array(ch.buffer),name);
   offset+=30+name.length+data.length;
  });
  var cdSize=0;central.forEach(function(c){cdSize+=c.length});
  var end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);end.setUint16(4,0,true);end.setUint16(6,0,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);
  end.setUint32(12,cdSize,true);end.setUint32(16,offset,true);end.setUint16(20,0,true);
  return new Blob(chunks.concat(central,[new Uint8Array(end.buffer)]),{type:mime||'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 }
 PIL.zipFiles=zip;PIL.crc32=crc32;
 PIL.buildXlsx=function(){return zip(parts(sheets()))};

 PIL.saveBlob=function(b,f){saveBlob(b,f)};
 function saveBlob(blob,file){var a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=file;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000)}
 function msg(t,k){var m=$$('exportMsg');if(m){m.textContent=t;m.setAttribute('data-k',k||'')}}
 PIL.exportXlsx=function(){
  try{
   var shs=sheets(),blob=zip(parts(shs));
   saveBlob(blob,'pen_ink_lab_'+localDate()+'.xlsx');
   msg('엑셀 파일을 저장했어요 · 만년필 '+shs[0].rows.length+' · 잉크 '+shs[1].rows.length+' · 잉입 기록 '+shs[2].rows.length+' · 시필 노트 '+shs[3].rows.length+'. 엑셀은 보기·정리용이고, 앱으로 되돌리는 복원은 JSON 백업을 쓰세요.','ok');
  }catch(e){console.error(e);msg('엑셀 파일을 만들지 못했어요: '+e.message,'bad')}
 };

 /* ───────── 인쇄 · PDF ───────── */
 function table(title,head,rows,note){
  if(!rows.length)return '<div class="pp-sec"><h2>'+esc(title)+'</h2><p class="pp-none">기록이 없습니다.</p></div>';
  return '<div class="pp-sec"><h2>'+esc(title)+' <small>'+rows.length+(note||'')+'</small></h2><table><thead><tr>'+head.map(function(h){return '<th>'+esc(h)+'</th>'}).join('')+'</tr></thead><tbody>'+
   rows.map(function(r){return '<tr>'+r.map(function(v){return '<td>'+esc(v===undefined||v===null?'':v)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';
 }
 PIL.printHtml=function(want){
  var s=sheets(),out=[];
  var pick=function(i,cols){return {head:cols.map(function(c){return s[i].head[c]}),rows:s[i].rows.map(function(r){return cols.map(function(c){return r[c]})})}};
  if(want.pens){var p=pick(0,[0,1,2,3,4,5,6]);out.push(table('만년필',p.head,p.rows))}
  if(want.inks){var k=pick(1,[0,1,2,4,6,7,8,9]);out.push(table('잉크',k.head,k.rows))}
  if(want.history){var h=pick(2,[0,1,2,3,4,5,6]);out.push(table('잉입 기록',h.head,h.rows.slice(0,100),h.rows.length>100?' (최근 100건만)':''))}
  if(want.tests){var t=pick(3,[0,1,2,3,4,5,6,7,8,10]);out.push(table('시필 노트',t.head,t.rows.slice(0,100),t.rows.length>100?' (최근 100건만)':''))}
  return '<header class="pp-head"><h1>Pen &amp; Ink Lab</h1><p>'+esc(localDate())+' 기준 · 만년필 '+(db.pens||[]).length+'자루 · 잉크 '+(db.inks||[]).length+'종</p></header>'+(out.join('')||'<p class="pp-none">인쇄할 항목을 선택해 주세요.</p>');
 };
 PIL.print=function(){
  var want={};document.querySelectorAll('[data-print]').forEach(function(c){want[c.getAttribute('data-print')]=c.checked});
  var host=$$('pilPrint');if(!host){host=document.createElement('div');host.id='pilPrint';document.body.appendChild(host)}
  host.innerHTML=PIL.printHtml(want);
  document.body.classList.add('pil-printing');
  var done=function(){document.body.classList.remove('pil-printing');host.innerHTML='';window.removeEventListener('afterprint',done)};
  window.addEventListener('afterprint',done);
  try{window.print()}catch(e){done();msg('이 브라우저에서는 인쇄 창을 열 수 없어요.','bad')}
 };

 if($$('exportXlsx'))$$('exportXlsx').addEventListener('click',PIL.exportXlsx);
 if($$('printSheetBtn'))$$('printSheetBtn').addEventListener('click',PIL.print);
})();
