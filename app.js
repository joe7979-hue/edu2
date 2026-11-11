'use strict';
const DATA=window.BUDGET_DATA;
const $=id=>document.getElementById(id);
const COLORS=['#225a7d','#32877c','#b28e54','#698caa','#a4717b','#727997','#61969e','#a78468','#768f70','#9d906b'];
const sectorColors={'전력운영':COLORS[0],'방위력개선':COLORS[1],'병무행정':COLORS[2]};
const fmt=v=>Math.round(v).toLocaleString('ko-KR');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sum=(rows,key)=>rows.reduce((a,r)=>a+r[key],0);
const delta=r=>r.y2027-r.y2026;
const rate=r=>r.y2026===0?null:delta(r)/r.y2026*100;
const pct=v=>v===null?'—':`${v>0?'+':''}${v.toFixed(1)}%`;
const short=v=>Math.abs(v)>=10000?`${(v/10000).toFixed(1)}조`:fmt(v);
const money=v=>`${v<0?'−':''}${Math.floor(Math.abs(v)/10000)?`${fmt(Math.floor(Math.abs(v)/10000))}조 `:''}${fmt(Math.abs(v)%10000)}억`;
const tip=(name,value,extra='')=>esc(`${name}\n${value}${extra?'\n'+extra:''}`);
function svg(w,h,body){return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="데이터 차트">${body}</svg>`;}
function text(x,y,s,opts=''){return `<text x="${x}" y="${y}" fill="#637e91" font-size="11" ${opts}>${esc(s)}</text>`;}
function line(x1,y1,x2,y2,color='#e6edf2'){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}"/>`;}
function aggregate(rows,key){const map=new Map();rows.forEach(r=>{if(!map.has(r[key]))map.set(r[key],{name:r[key],y2026:0,y2027:0});const g=map.get(r[key]);g.y2026+=r.y2026;g.y2027+=r.y2027;});return [...map.values()];}
function empty(id){$(id).innerHTML='<div class="empty">표시할 데이터가 없습니다</div>';}
function donut(id,items,label){
 const total=items.reduce((a,r)=>a+r.value,0);if(total<=0){empty(id);return;}
 const R=63,C=2*Math.PI*R;let offset=0;
 let body=`<circle cx="150" cy="98" r="${R}" fill="none" stroke="#edf2f5" stroke-width="24"/>`;
 items.forEach((r,i)=>{const len=r.value/total*C;body+=`<circle cx="150" cy="98" r="${R}" fill="none" stroke="${r.color||COLORS[i%COLORS.length]}" stroke-width="24" stroke-dasharray="${Math.max(0,len-2)} ${C}" stroke-dashoffset="${-offset}" transform="rotate(-90 150 98)" data-tip="${tip(r.name,`${fmt(r.value)}${label==='프로그램'?'개':'억 원'}`,`${(r.value/total*100).toFixed(1)}%`)}"/>`;offset+=len;});
 body+=text(150,94,label,'text-anchor="middle"');body+=`<text x="150" y="118" text-anchor="middle" fill="#213e53" font-weight="700" font-size="21">${esc(label==='프로그램'?fmt(total)+'개':short(total))}</text>`;
 $(id).innerHTML=svg(300,190,body)+`<div class="donut-legend">${items.map((r,i)=>`<span><i class="swatch" style="background:${r.color||COLORS[i%COLORS.length]}"></i>${esc(r.name)} <b>${(r.value/total*100).toFixed(1)}%</b></span>`).join('')}</div>`;
}
function bars(id,items,{signed=false,percent=false}={}){
 if(!items.length){empty(id);return;}
 const w=560,row=31,h=Math.max(230,items.length*row+28),left=185,right=percent?75:92,span=w-left-right;
 const max=Math.max(...items.map(r=>Math.abs(r.value)),1),hasNegative=signed&&items.some(r=>r.value<0);
 const center=hasNegative?left+span*.46:left;
 let body=line(center,5,center,h-22,'#cddae3');
 items.forEach((r,i)=>{
  const y=12+i*row;const width=Math.abs(r.value)/max*(hasNegative?span*.52:span);
  const x=r.value<0?center-width:center;
  const color=r.color||(signed?(r.value<0?'#b96b5c':'#32877c'):COLORS[i%COLORS.length]);
  body+=`<text x="${left-12}" y="${y+14}" text-anchor="end" font-size="11" fill="#5e788a">${esc(r.name.length>19?r.name.slice(0,18)+'…':r.name)}</text>`;
  body+=`<rect x="${x}" y="${y}" width="${Math.max(width,1)}" height="20" rx="4" fill="${color}" data-tip="${tip(r.name,percent?pct(r.value):fmt(r.value)+'억 원')}"/>`;
  body+=`<text x="${w-2}" y="${y+14}" text-anchor="end" fill="${signed?color:'#5e788a'}" font-size="11" font-weight="600">${esc(percent?pct(r.value):fmt(r.value))}</text>`;
 });$(id).innerHTML=svg(w,h,body);
}
function compare(rows){
 const items=aggregate(rows,'sector');if(!items.length){empty('sectorCompare');return;}
 const w=560,h=290,left=95,right=25,top=25,bottom=35;
 const lo=Math.min(0,...items.flatMap(r=>[r.y2026,r.y2027])),hi=Math.max(1,...items.flatMap(r=>[r.y2026,r.y2027]));
 const y=v=>top+(hi-v)/(hi-lo)*(h-top-bottom);let body='';
 for(let i=0;i<=4;i++){let v=lo+(hi-lo)*i/4;body+=line(left,y(v),w-right,y(v))+text(left-10,y(v)+3,short(v),'text-anchor="end"');}
 const cell=(w-left-right)/items.length;
 items.forEach((r,i)=>{const x=left+cell*(i+.5);[r.y2026,r.y2027].forEach((v,j)=>{
 const bx=x+(j===0?-28:3),by=Math.min(y(v),y(0));body+=`<rect x="${bx}" y="${by}" width="25" height="${Math.max(1,Math.abs(y(v)-y(0)))}" rx="4" fill="${j===0?'#bccbd8':'#225a7d'}" data-tip="${tip(r.name,`${j===0?'2026':'2027'}년 ${fmt(v)}억 원`)}"/>`;
 });body+=text(x,h-12,r.name,'text-anchor="middle"');});
 $('sectorCompare').innerHTML=svg(w,h,body);
}
function tree(rows){
 const items=rows.filter(r=>r.y2027>0).sort((a,b)=>b.y2027-a.y2027),total=sum(items,'y2027');
 if(!items.length){empty('treemap');return;}
 // Balanced columns keep the large programs readable and retain every smaller record.
 const groups=Array.from({length:Math.min(5,items.length)},()=>({rows:[],value:0}));
 items.forEach(r=>{const g=groups.reduce((a,b)=>a.value<b.value?a:b);g.rows.push(r);g.value+=r.y2027;});
 $('treemap').innerHTML=groups.map(g=>`<div class="tree-column" style="flex:${g.value/total}">${g.rows.map(r=>{const i=DATA.indexOf(r),share=r.y2027/g.value;return `<div class="tree-cell" style="flex:${r.y2027};background:${COLORS[i%COLORS.length]};padding:${share<.08?'0':'10px'}" data-tip="${tip(r.program,fmt(r.y2027)+'억 원',r.sector)}">${share>=.13?`<span>${esc(r.program)}</span>${share>.23?`<strong>${short(r.y2027)}</strong>`:''}`:''}</div>`;}).join('')}</div>`).join('');
}
function scatter(rows){
 const items=rows.filter(r=>r.y2027>0&&rate(r)!==null);if(!items.length){empty('scatterChart');return;}
 const w=560,h=290,l=65,r=25,t=20,b=40,xmax=Math.max(1,...items.map(r=>r.y2027))*1.08;
 const ymin=Math.min(0,...items.map(rate))-8,ymax=Math.max(10,...items.map(rate))+8;
 const x=v=>l+v/xmax*(w-l-r),y=v=>t+(ymax-v)/(ymax-ymin)*(h-t-b);let body='';
 for(let i=0;i<=4;i++){const xv=xmax*i/4,yv=ymin+(ymax-ymin)*i/4;body+=line(x(xv),t,x(xv),h-b)+text(x(xv),h-16,short(xv),'text-anchor="middle"');body+=line(l,y(yv),w-r,y(yv))+text(l-9,y(yv)+3,yv.toFixed(0)+'%','text-anchor="end"');}
 body+=line(l,y(0),w-r,y(0),'#bdccd7');
 items.forEach(r=>body+=`<circle cx="${x(r.y2027)}" cy="${y(rate(r))}" r="${5+Math.sqrt(r.y2027/xmax)*12}" fill="${sectorColors[r.sector]}" fill-opacity=".75" stroke="white" stroke-width="2" data-tip="${tip(r.program,fmt(r.y2027)+'억 원',pct(rate(r)))}"/>`);
 $('scatterChart').innerHTML=svg(w,h,body);
}
function selected(){return DATA.filter(r=>(!$('sector').value||r.sector===$('sector').value)&&(!$('account').value||r.account===$('account').value));}
function tableRows(rows){const q=$('search').value.trim().toLowerCase();return rows.filter(r=>r.program.toLowerCase().includes(q));}
function renderTable(rows){
 const items=tableRows(rows),a=sum(items,'y2026'),b=sum(items,'y2027');
 $('tableBody').innerHTML=items.length?items.map(r=>`<tr><td>${esc(r.sector)}</td><td><span class="badge">${esc(r.account)}</span></td><td>${esc(r.group)}</td><td>${esc(r.program)}</td><td class="num">${fmt(r.y2026)}</td><td class="num">${fmt(r.y2027)}</td><td class="num ${delta(r)<0?'down':'up'}">${delta(r)>0?'+':''}${fmt(delta(r))}</td><td class="num ${rate(r)<0?'down':'up'}">${pct(rate(r))}</td></tr>`).join(''):'<tr><td colspan="8" class="empty">검색 결과가 없습니다</td></tr>';
 $('tableFoot').innerHTML=`<tr><td colspan="4">표시된 ${items.length}개 항목 합계</td><td class="num">${fmt(a)}</td><td class="num">${fmt(b)}</td><td class="num">${fmt(b-a)}</td><td class="num">${pct(a===0?null:(b-a)/a*100)}</td></tr>`;
 $('tableNote').textContent='금액 단위: 억 원. 프로그램명 검색은 상세 표와 CSV 내보내기에 적용됩니다. 합계 증감률은 합계 금액 기준으로 계산합니다.';
}
function render(){
 const rows=selected(),a=sum(rows,'y2026'),b=sum(rows,'y2027'),d=b-a;
 $('recordCount').textContent=`${rows.length}개`;
 $('filterSummary').textContent=[$('sector').value||'전체 부문',$('account').value||'전체 회계'].join(' · ');
 $('k27').textContent=money(b);$('k26').textContent=money(a);$('kDiff').textContent=(d>0?'+':'')+money(d);
 $('kRate').textContent=`전년 대비 ${pct(a===0?null:d/a*100)}`;
 $('kCount').textContent=`${rows.length}개`;$('kUp').textContent=`증가 ${rows.filter(r=>delta(r)>0).length}개 · 감소 ${rows.filter(r=>delta(r)<0).length}개`;
 const positive=rows.filter(r=>r.y2027>0);
 donut('sectorDonut',aggregate(positive,'sector').map(r=>({name:r.name,value:r.y2027,color:sectorColors[r.name]})),'양수 재원');
 donut('accountDonut',aggregate(positive,'account').map((r,i)=>({name:r.name,value:r.y2027,color:COLORS[i]})),'양수 재원');
 donut('directionChart',[{name:'증가',value:rows.filter(r=>delta(r)>0).length,color:'#32877c'},{name:'감소',value:rows.filter(r=>delta(r)<0).length,color:'#b96b5c'},{name:'동일',value:rows.filter(r=>delta(r)===0).length,color:'#a8b5c0'}].filter(r=>r.value),'프로그램');
 compare(rows);
 bars('topPrograms',[...rows].sort((a,b)=>b.y2027-a.y2027).slice(0,10).map(r=>({name:r.program,value:r.y2027,color:sectorColors[r.sector]})),{signed:true});
 tree(rows);
 bars('varianceChart',[...rows].sort((a,b)=>Math.abs(delta(b))-Math.abs(delta(a))).slice(0,12).map(r=>({name:r.program,value:delta(r)})),{signed:true});
 bars('growthChart',rows.filter(r=>rate(r)!==null).sort((a,b)=>Math.abs(rate(b))-Math.abs(rate(a))).slice(0,12).map(r=>({name:r.program,value:rate(r)})),{signed:true,percent:true});
 scatter(rows);
 bars('accountChange',aggregate(rows,'account').map(r=>({name:r.name,value:delta(r)})).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value)),{signed:true});
 renderTable(rows);
}
function options(select,values,label){select.innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');}
function updateAccounts(){const prev=$('account').value;options($('account'),[...new Set(DATA.filter(r=>!$('sector').value||r.sector===$('sector').value).map(r=>r.account))],'전체 회계');if([...$('account').options].some(o=>o.value===prev))$('account').value=prev;}
options($('sector'),[...new Set(DATA.map(r=>r.sector))],'전체 부문');updateAccounts();
$('sector').addEventListener('change',()=>{updateAccounts();render();});
$('account').addEventListener('change',render);
$('reset').addEventListener('click',()=>{$('sector').value='';updateAccounts();$('account').value='';$('search').value='';render();});
$('search').addEventListener('input',()=>renderTable(selected()));
$('export').addEventListener('click',()=>{
 const header=['부문','회계구분','구분','프로그램명','2026년(억원)','2027년(억원)','증감(억원)','증감률(%)'];
 const rows=tableRows(selected()).map(r=>[r.sector,r.account,r.group,r.program,r.y2026,r.y2027,delta(r),rate(r)===null?'':rate(r).toFixed(4)]);
 const content='\uFEFF'+[header,...rows].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='국방예산_필터결과.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
document.addEventListener('pointermove',e=>{const el=e.target.closest('[data-tip]'),box=$('tooltip');if(!el){box.style.display='none';return;}box.textContent=el.dataset.tip;box.style.whiteSpace='pre-line';box.style.display='block';box.style.left=Math.min(e.clientX+15,window.innerWidth-box.offsetWidth-12)+'px';box.style.top=Math.max(8,Math.min(e.clientY+15,window.innerHeight-box.offsetHeight-12))+'px';});
document.addEventListener('pointerout',e=>{if(!e.relatedTarget||!e.relatedTarget.closest?.('[data-tip]'))$('tooltip').style.display='none';});
document.querySelectorAll('.nav').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('.nav').forEach(n=>n.classList.remove('active'));a.classList.add('active');}));
render();
