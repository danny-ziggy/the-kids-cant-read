(()=>{
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mkRnd=s=>()=>(s=s*16807%2147483647)/2147483647;
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const pop=el=>{if(RM||!el)return;el.animate([{transform:'scale(1)'},{transform:'scale(1.14)'},{transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.3,1.5,.5,1)'});};
const restart=(el,c)=>{el.classList.remove(c);void el.getBoundingClientRect();el.classList.add(c);};

/* ---------- invented alphabet: each shape is a 2x3 grid of cut-paper pieces ---------- */
const G={T:['XX',' o','ba'],H:['cd','  ','ba'],E:['X ','Xo','X '],K:['ab','X ','dc'],I:['o ','XX',' o'],D:['Xb','  ','dX'],S:['d ','Xa',' c'],C:['Xo','b ','Xo'],A:['cd','o ','XX'],N:[' X','dc','X '],R:['bX',' o','Xa'],P:['bd','  ','X '],O:['XX','  ','ab'],Y:['ba',' X',' X'],
  B:['Xa','Xo','Xc'],OO:['ad','  ','ad'],SH:['Xd','b ',' X'],CH:['Xd','b ','X ']};
const cellPath=(t,c,r)=>{const x=c*30,y=r*30;switch(t){
  case'X':return`<rect x="${x+1}" y="${y+1}" width="28" height="28"/>`;
  case'o':return`<rect x="${x+10}" y="${y+10}" width="10" height="10"/>`;
  case'a':return`<path d="M${x} ${y}h30A30 30 0 0 1 ${x} ${y+30}Z"/>`;
  case'b':return`<path d="M${x+30} ${y}v30A30 30 0 0 1 ${x} ${y}Z"/>`;
  case'c':return`<path d="M${x+30} ${y+30}h-30A30 30 0 0 1 ${x+30} ${y}Z"/>`;
  case'd':return`<path d="M${x} ${y+30}v-30A30 30 0 0 1 ${x+30} ${y+30}Z"/>`;
  default:return'';}};
const glyph=(ch,cls='')=>{
  if(ch==="'")return`<svg class="${cls}" viewBox="0 0 20 90" aria-hidden="true"><path d="M18 0v16A16 16 0 0 1 2 0Z"/></svg>`;
  const g=G[ch];if(!g)return'';
  let p='';g.forEach((row,r)=>[...row].forEach((t,c)=>{p+=cellPath(t,c,r)}));
  return`<svg class="${cls}" viewBox="0 0 60 90" aria-hidden="true">${p}</svg>`;};
const cellHTML=(ch,back)=>{const b=back??(ch==="'"?'’':ch);return`<span class="cell${ch==="'"?' ap':''}" data-ch="${ch}">${glyph(ch,'f')}<span class="b${b.length>1?' two':''}" aria-hidden="true">${b}</span></span>`;};
const buildWord=(el,words)=>{el.innerHTML=words.map(w=>`<span class="gword">${[...w].map(c=>cellHTML(c)).join('')}</span>`).join('');return $$('.cell',el);};

/* a reader: a book spine with a head */
const kid=(x,y,w,h)=>{const r=w*.36,rr=w/2,top=y-h+r*2.3;return`M${x-w/2} ${y}V${top+rr}A${rr} ${rr} 0 0 1 ${x+w/2} ${top+rr}V${y}Z M${x+r} ${y-h+r}A${r} ${r} 0 1 1 ${x-r} ${y-h+r}A${r} ${r} 0 1 1 ${x+r} ${y-h+r}Z`;};

/* ---------- layers: Short / Full, drawers ---------- */
const root=document.documentElement;
let ver=store.get('kcr6-ver')==='full'?'full':'short';
const drawers=$$('.drawer');
const setDrawer=(d,open)=>{const b=$('.more',d),body=$('.dbody',d);b.setAttribute('aria-expanded',String(open));b.textContent=open?'Show less':'Show more';body.hidden=!open;};
drawers.forEach(d=>{const b=$('.more',d),body=$('.dbody',d);body.id=body.id||'dr-'+d.dataset.d;b.setAttribute('aria-controls',body.id);
  b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')!=='true';setDrawer(d,open);store.set('kcr6-d-'+d.dataset.d,open?'1':'0');requestAnimationFrame(tick);});});
const applyVer=(v,reset)=>{ver=v;root.dataset.ver=v;store.set('kcr6-ver',v);
  $$('.ver button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ver===v)));
  drawers.forEach(d=>{const k='kcr6-d-'+d.dataset.d;if(reset)store.del(k);const s=store.get(k);setDrawer(d,s===null?v==='full':s==='1');});};
$$('.ver button').forEach(b=>b.addEventListener('click',()=>{applyVer(b.dataset.ver,true);requestAnimationFrame(()=>{layout();tick();});}));
applyVer(ver,false);

/* ---------- scroll engine ---------- */
const SC={};      // name -> fn(p, el)
const LAYOUT=[];  // fns run on resize
const layout=()=>LAYOUT.forEach(f=>f());
const topbarH=()=>$('.topbar').offsetHeight;
const scenes=$$('.sc'),pages=$$('.pg,.cover,.next,.drawer-band'),parts=$$('.part'),navLinks=$$('[data-nav]');
let ticking=false,curPart='';
function tick(){
  ticking=false;
  const vh=innerHeight,tb=topbarH();
  scenes.forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.bottom<-vh||r.top>vh*2)return;
    const st=$('.stage',el);
    const p=RM?1:clamp((tb-r.top)/Math.max(1,r.height-st.offsetHeight));
    el.style.setProperty('--p',p.toFixed(4));
    const f=SC[el.dataset.sc];if(f)f(p,el);
  });
  pages.forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.bottom<0||r.top>vh*1.5)return;
    el.style.setProperty('--e',(RM?1:clamp(1-(r.top-tb)/(vh*.8))).toFixed(3));
  });
  let cur=parts[0].dataset.part;
  parts.forEach(pt=>{if(pt.getBoundingClientRect().top<=tb+vh*.35)cur=pt.dataset.part;});
  if(cur!==curPart){curPart=cur;navLinks.forEach(a=>{if(a.dataset.nav===cur)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});}
  const max=document.documentElement.scrollHeight-vh;
  $('#ribbon').style.setProperty('--rp',max>0?clamp(scrollY/max).toFixed(4):0);
}
const onScroll=()=>{if(!ticking){ticking=true;requestAnimationFrame(tick);}};
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',()=>{layout();onScroll();});
/* redraw charts whenever their boxes change size, so 1 SVG unit stays 1 CSS pixel */
let roQ=0;if('ResizeObserver'in window){const ro=new ResizeObserver(()=>{if(roQ)return;roQ=requestAnimationFrame(()=>{roQ=0;layout();tick();});});setTimeout(()=>['#yrbar','#c13','#queue','#gChart'].forEach(s=>{const e=$(s);if(e)ro.observe(e);}),0);}
/* a step index from scroll progress, for crossfading step text */
const setStep=(el,i)=>{$$('.steps>.st',el).forEach((s,n)=>s.classList.toggle('on',n===i));};

/* ---------- deep links: land on the key moment of a pinned scene ---------- */
const land=()=>{
  const id=decodeURIComponent(location.hash.slice(1));if(!id||id==='top')return;
  const el=document.getElementById(id);if(!el)return;
  const tb=topbarH(),y=el.getBoundingClientRect().top+scrollY-tb;
  const f=parseFloat(el.dataset.land||'0');
  window.scrollTo(0,Math.max(0,y+(f?f*(el.offsetHeight-(innerHeight-tb)):0)));
};
addEventListener('hashchange',()=>requestAnimationFrame(()=>{land();tick();}));

/* ---------- quiet share: the phone's share sheet where there is one, else copy ---------- */
$$('.share').forEach(b=>b.addEventListener('click',async()=>{
  const url=location.origin+location.pathname+'#'+b.dataset.share;
  const label=b.textContent;
  try{
    if(navigator.share&&matchMedia('(pointer:coarse)').matches){await navigator.share({title:document.title,url});return;}
    await navigator.clipboard.writeText(url);
  }catch(e){if(e&&e.name==='AbortError')return;try{const t=document.createElement('textarea');t.value=url;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}catch(_){}}
  b.textContent='Copied';b.classList.add('done');setTimeout(()=>{b.textContent=label;b.classList.remove('done');},1600);
}));

/* ---------- title ---------- */
const tCells=buildWord($('#gTitle'),['THE','KIDS',"CAN'T",'READ']);
const tOrder=(()=>{const r=mkRnd(11),ix=tCells.map((_,i)=>i);for(let i=ix.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[ix[i],ix[j]]=[ix[j],ix[i]];}return ix;})();
const tTapped=new Set();
SC.open=p=>{const k=Math.floor(clamp(p*1.25)*(tCells.length+.99));tOrder.forEach((ix,n)=>tCells[ix].classList.toggle('on',n<k||tTapped.has(ix)));};
tCells.forEach((c,i)=>c.addEventListener('click',()=>{tTapped.add(i);c.classList.add('on');}));

/* ---------- 5,000 years ---------- */
const Y0=-3200,Y1=2026;
const YSTOPS=[
  {p:0,y:-3200,lab:'3200 B.C.',t:'The first known writing',lit:0},
  {p:.2,y:-2000,lab:'2000 B.C.',t:'The first alphabets, about then',lit:0},
  {p:.42,y:1820,lab:'1820',t:'About 1 in 10 people could read',lit:1},
  {p:.55,y:1900,lab:'1900',t:'About 1 in 5',lit:2},
  {p:.66,y:1960,lab:'1960',t:'About 4 in 10',lit:4},
  {p:.77,y:1983,lab:'1983',t:'7 in 10',lit:7},
  {p:.88,y:2026,lab:'Today',t:'Almost 9 in 10 can read',lit:9}];
const yrbar=$('#yrbar'),readers=$('#readers10');
readers.innerHTML=Array.from({length:10},(_,i)=>`<path class="kid" d="${kid(26+i*52,116,30,100)}"/>`).join('');
const rk=$$('.kid',readers);let yrW=0,yrX=null,yrI=-1;
LAYOUT.push(()=>{
  const _r=yrbar.getBoundingClientRect(),W=_r.width||340,H=_r.height||100;yrbar.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const x0=6,x1=W-6,ry=H*.5;yrW=W;yrX=y=>x0+(y-Y0)/(Y1-Y0)*(x1-x0);
  const ev=(y,lab,above,anchor)=>`<rect class="ev" x="${yrX(y)-2}" y="${ry-16}" width="4" height="32"/><text class="yr" x="${yrX(y)+(anchor==='end'?-2:anchor==='start'?-2:0)}" y="${above?ry-26:ry+44}" text-anchor="${anchor||'middle'}">${lab}</text>`;
  yrbar.innerHTML=`<rect class="rail" x="${x0}" y="${ry-4}" width="${x1-x0}" height="8" rx="4"/>
    <rect class="lit" id="yrLit" x="${yrX(1820)}" y="${ry-9}" width="0" height="18" rx="3"/>
    ${ev(-3200,'Writing',true,'start')}${ev(-2000,'Alphabet',true,'start')}${ev(1820,'1820',true,'end')}
    <text class="yr" x="${x0}" y="${ry+44}">3200 B.C.</text><text class="yr" x="${x1}" y="${ry+44}" text-anchor="end">Today</text>
    <circle class="mk" id="yrMk" r="11" cx="0" cy="0"/>`;
  yrI=-1;
});
SC.yrs=p=>{
  if(!yrX)return;
  let i=0;YSTOPS.forEach((s,n)=>{if(p>=s.p)i=n;});
  const a=YSTOPS[i],b=YSTOPS[Math.min(i+1,YSTOPS.length-1)];
  const y=b===a?a.y:lerp(a.y,b.y,clamp((p-a.p)/(b.p-a.p)));
  const H=yrbar.viewBox.baseVal.height,ry=H*.5;
  $('#yrMk').setAttribute('transform',`translate(${yrX(y).toFixed(1)} ${ry})`);
  $('#yrLit').setAttribute('width',Math.max(0,yrX(Math.max(1820,y))-yrX(1820)).toFixed(1));
  if(i!==yrI){yrI=i;$('#yrNow').textContent=a.lab;$('#yrTxt').textContent=a.t;rk.forEach((k,n)=>k.classList.toggle('on',n<a.lit));if(i)pop($('#yrNow'));}
};

/* ---------- the brain borrows: objects turn into letters ---------- */
const MORPH=[
  {o:'<path d="M60 18L108 140H12Z"/><path class="cut" d="M60 100l-14 40h28Z" fill="#000"/>',l:'A'},
  {o:'<circle cx="60" cy="80" r="50"/><circle cx="44" cy="70" r="7" fill="#000"/><circle cx="76" cy="70" r="7" fill="#000"/><path d="M40 98q20 16 40 0" stroke="#000" stroke-width="7" fill="none"/>',l:'O'},
  {o:'<path d="M92 34q-30-26-56 0t20 46q40 18 14 50t-52 2" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round"/>',l:'S'},
  {o:'<rect x="14" y="26" width="92" height="34" rx="17"/><rect x="50" y="50" width="20" height="96"/>',l:'T'}];
$('#mrow').innerHTML=MORPH.map(m=>`<div class="mcell"><svg class="obj" viewBox="0 0 120 160">${m.o}</svg><svg class="let" viewBox="0 0 120 160"><text x="60" y="140" text-anchor="middle" style="font:900 170px/1 var(--fd);font-stretch:85%;fill:var(--pencil)">${m.l}</text></svg></div>`).join('');
const mcells=$$('.mcell');
SC.brain=(p,el)=>{setStep(el,p<.3?0:p<.64?1:2);mcells.forEach((c,i)=>c.classList.toggle('on',p>.32+i*.07));};

/* ---------- two centuries of alarms ---------- */
const slabs=$$('#stack5 .slab');
SC.pile=p=>{slabs.forEach((s,i)=>s.classList.toggle('on',p>.04+i*.13));$('#pileTurn').classList.toggle('on',p>.74);};

/* ---------- Can't cover ---------- */
(()=>{const g=$('#cvKids');if(!g)return;const H=[84,98,90,104,88,96,92,100];let d='';
  H.forEach((h,i)=>{d+=kid(92+i*30,236,22,h)+' ';});d+=kid(37,236,26,70);g.innerHTML=`<path d="${d}"/>`;})();

/* ---------- the split: age 13, 1971 to 2025 ---------- */
const AVG=[[1971,255],[1975,256],[1980,258],[1984,257],[1988,257],[1990,257],[1992,260],[1994,258],[1996,258],[1999,259],[2004,257],[2008,260],[2012,263],[2020,260],[2023,256],[2025,256]];
const P90=[[1971,299.6],[1975,300.5],[1980,302.3],[1984,301.7],[1988,301.6],[1990,302],[1992,309.2],[1994,307.4],[1996,306.5],[2020,308],[2023,305]];
const P10=[[1971,207.8],[1975,208.7],[1980,212.8],[1984,210.2],[1988,212.9],[1990,209.8],[1992,207.9],[1994,205.1],[1996,208.5],[2020,209],[2023,202]];
const avgAt=y=>{for(let i=0;i<AVG.length-1;i++){const[a,va]=AVG[i],[b,vb]=AVG[i+1];if(y>=a&&y<=b)return va+(vb-va)*(y-a)/(b-a);}return AVG[AVG.length-1][1];};
const BANDS=[[300,'Complicated material'],[250,'Connects ideas'],[200,'Short, simple passages']];
const c13=$('#c13');let c13p=0;
function drawC13(p){
  const _r=c13.getBoundingClientRect(),W=_r.width||340,H=_r.height||300;c13.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const nar=W<620,fs=parseFloat(getComputedStyle(c13).fontSize)||18;
  const pl=nar?46:62,pr=nar?12:24,pt=14,pb=40;
  const zt=clamp((p-.33)/.1),dom=[lerp(0,130,zt),lerp(500,350,zt)];
  const X=y=>pl+(y-1971)/(2025-1971)*(W-pl-pr),Yv=v=>pt+(dom[1]-v)/(dom[1]-dom[0])*(H-pt-pb);
  const drawn=clamp((p-.02)/.24),cut=1971+drawn*(2025-1971);
  const bandO=clamp((p-.4)/.08),split=clamp((p-.68)/.16),labO=clamp((p-.86)/.06);
  let o='';
  const step=dom[1]-dom[0]>300?100:50;
  for(let v=Math.ceil(dom[0]/step)*step;v<=dom[1]+.01;v+=step){const y=Yv(v);o+=`<line class="grid" x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}"/><text x="${pl-8}" y="${y+6}" text-anchor="end">${v}</text>`;}
  o+=`<line class="ax" x1="${pl}" x2="${W-pr}" y1="${H-pb+2}" y2="${H-pb+2}"/>`;
  (nar?[[1971,'start'],[2025,'end']]:[[1971,'start'],[2012,'middle'],[2025,'end']]).forEach(([y,a])=>{o+=`<text x="${X(y)}" y="${H-pb+30}" text-anchor="${a}">${y}</text>`;});
  if(bandO>0)BANDS.forEach(([v,t])=>{const y=Yv(v);if(y<pt-2||y>H-pb+2)return;o+=`<line class="bl" style="opacity:${bandO*.6}" x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}"/><text style="opacity:${bandO*(1-split)}" x="${pl+8}" y="${y+fs*1.2}">${v}: ${t}</text>`;});
  // average, drawn left to right
  const pts=[];for(let i=0;i<AVG.length;i++){const[y,v]=AVG[i];if(y<=cut){pts.push([X(y),Yv(v)]);continue;}if(i>0){const[py,pv]=AVG[i-1],t=(cut-py)/(y-py);pts.push([X(cut),Yv(pv+(v-pv)*t)]);}break;}
  if(pts.length>1)o+=`<path class="avg" style="opacity:${1-split*.7}" d="M${pts.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L')}"/>`;
  const aO=clamp(drawn*4-3)*(1-bandO);
  if(aO>0)o+=`<g style="opacity:${aO}"><text class="big" x="${X(1971)+4}" y="${Yv(255)-16}">255</text><text class="big" x="${X(2025)}" y="${Yv(256)-16}" text-anchor="end">256</text></g>`;
  // the split: the strongest and weakest tenths peel away from the average
  if(split>0){
    const line=(arr,cls)=>{const seg=(a)=>'M'+a.map(([y,v])=>X(y).toFixed(1)+' '+Yv(avgAt(y)+(v-avgAt(y))*split).toFixed(1)).join('L');
      const i96=arr.findIndex(a=>a[0]===1996);
      return `<path class="${cls}" d="${seg(arr.slice(0,i96+1))}"/><path class="${cls} gap" d="${seg(arr.slice(i96,i96+2))}"/><path class="${cls}" d="${seg(arr.slice(i96+1))}"/>`;};
    o+=line(P90,'hi')+line(P10,'lo');
    if(labO>0){
      const e=(arr)=>arr[arr.length-1];
      o+=`<g style="opacity:${labO}">
        <text class="mid lab-hi" x="${X(1971)+4}" y="${Yv(299.6)-14}">300</text>
        <text class="mid lab-hi end" x="${X(2023)}" y="${Yv(e(P90)[1])-14}" text-anchor="end">305</text>
        <text class="lab-hi nm" x="${X(2023)}" y="${Yv(e(P90)[1])-14}" text-anchor="end">Strongest tenth</text>
        <text class="mid lab-lo" x="${X(1971)+4}" y="${Yv(207.8)+fs*1.9}">208</text>
        <text class="mid lab-lo end" x="${X(2023)}" y="${Yv(e(P10)[1])+fs*1.9}" text-anchor="end">202</text>
        <text class="lab-lo nm" x="${X(2023)}" y="${Yv(e(P10)[1])+fs*1.9}" text-anchor="end">Weakest tenth</text></g>`;
    }
  }
  c13.innerHTML=o;
  // set each name label just left of its end value
  $$('.nm',c13).forEach(n=>{const v=n.previousElementSibling;try{n.setAttribute('x',(parseFloat(v.getAttribute('x'))-v.getComputedTextLength()-12).toFixed(1));}catch(e){}});
}
LAYOUT.push(()=>drawC13(c13p));
SC.split=(p,el)=>{c13p=p;setStep(el,p<.34?0:p<.68?1:2);drawC13(p);};

/* ---------- seniors: a line from weakest to strongest ---------- */
const PCT=[[10,-24],[25,-15],[50,-8],[75,-2],[90,0]];
const drop=q=>{if(q<=10)return -24;if(q>=90)return 0;for(let i=0;i<PCT.length-1;i++){const[a,da]=PCT[i],[b,db]=PCT[i+1];if(q<=b)return da+(db-da)*(q-a)/(b-a);}return 0;};
const queue=$('#queue');let qT=0;
function qDraw(){
  const _r=queue.getBoundingClientRect(),W=_r.width||340,H=_r.height||300;queue.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const fs=parseFloat(getComputedStyle(queue).fontSize)||18;
  const N=W<620?20:40,step=W/N,kw=step*.72,top=H*.2,kh=Math.min(H*.34,kw*4.2),base=top+kh,s=Math.max(2,(H-base-fs*4.4)/24);
  let d='',hi='',labs='';
  for(let i=0;i<N;i++){const q=(i+.5)/N*100,y=base-drop(q)*s*qT,pth=kid(step*(i+.5),y,kw,kh)+' ';
    const pin=PCT.some(([pp])=>Math.abs(q-pp)<50/N);if(pin)hi+=pth;else d+=pth;}
  if(qT>.96)PCT.forEach(([pp,dv])=>{if(pp===25||pp===75)return;const i=Math.min(N-1,Math.floor(pp/100*N)),x=step*(i+.5),y=base-dv*s+fs*1.7;
    const a=pp===10?'start':pp===90?'end':'middle';labs+=`<text class="dv" x="${a==='start'?x-kw/2:a==='end'?x+kw/2:x}" y="${y}" text-anchor="${a}">${dv===0?'0':'−'+Math.abs(dv)}</text>`;});
  queue.innerHTML=`<rect class="tape" x="0" y="${base}" width="${W}" height="6"/>
    <text class="yr" x="0" y="${top-14}">${qT<.5?'1992':'2024'}</text>
    <path class="kid" d="${d}"/><path class="kid pin" d="${hi}"/>${labs}
    <text x="0" y="${H-4}">Weakest</text><text x="${W}" y="${H-4}" text-anchor="end">Strongest</text>`;
}
LAYOUT.push(qDraw);
SC.seniors=p=>{const t=clamp((p-.12)/.66);if(Math.abs(t-qT)<.002&&t!==1&&t!==0)return;qT=t;qDraw();};

/* ---------- the decoder ---------- */
const SOUND={T:'t',H:'h',E:'e',K:'k',I:'i',D:'d',B:'b',OO:'oo',SH:'sh',N:'n',A:'a',CH:'ch'};
const SENT=[
  {cells:['T','H','E'],sight:1,first:1},{cells:['K','I','D'],guess:'Boy'},{cells:['H','I','D'],guess:'Ran'},
  {cells:['T','H','E'],sight:1},{cells:['B','OO','K'],guess:'Phone'},{cells:['I','N'],sight:1},
  {cells:['T','H','E'],sight:1},{cells:['SH','E','D'],guess:'House'}];
const PLAIN='The kid hid the book in the shed.';
const KEY=['SH','I','B','T','K','A','E','OO','D','CH','H','N'];
const dec=$('#dec'),dLine=$('#dLine'),dKey=$('#dKey'),dBub=$('#dBub'),dPlain=$('#dPlain');
dLine.innerHTML=SENT.map((w,wi)=>`<span class="dword" data-w="${wi}">${w.cells.map((c,ci)=>cellHTML(c,wi===0&&ci===0?'T':SOUND[c])).join('')}</span>`).join('');
dKey.innerHTML=KEY.map(k=>`<button type="button" data-k="${k}" aria-label="Shape for “${SOUND[k]}”">${glyph(k)}<span>${SOUND[k]}</span></button>`).join('');
const dWords=$$('.dword',dLine);
SENT.forEach((w,wi)=>{if(w.sight)$$('.cell',dWords[wi]).forEach(c=>c.classList.add('on'));});
let wi=-1,ci=0,dStart=0,dDone=false,fadeRAF=0,guessed=new Set();
const doneAt=new Array(SENT.length).fill(0);
const curCell=()=>wi>=0&&wi<SENT.length?$$('.cell',dWords[wi])[ci]:null;
const markCur=()=>{$$('.cell.cur',dLine).forEach(c=>c.classList.remove('cur'));const c=curCell();if(c)c.classList.add('cur');};
const showBub=()=>{const w=SENT[wi];if(w&&w.guess&&!guessed.has(wi)&&!dDone){dBub.textContent=w.guess+'?';dBub.classList.remove('no');dBub.classList.add('on');}else dBub.classList.remove('on','no');};
const advance=()=>{const now=performance.now();
  if(wi>=0)doneAt[wi]=now;
  wi++;ci=0;
  while(wi<SENT.length&&SENT[wi].sight){doneAt[wi]=now;wi++;}
  if(wi>=SENT.length){finish();return;}
  markCur();showBub();};
const fade=()=>{const now=performance.now();
  dWords.forEach((w,i)=>{const t=doneAt[i];if(!t){w.style.opacity='';w.style.filter='';return;}
    const k=clamp((now-t-2200)/6500);w.style.opacity=(1-k*.93).toFixed(3);w.style.filter=k>0?`blur(${(k*2.5).toFixed(2)}px)`:'';});
  if(!dDone)fadeRAF=requestAnimationFrame(fade);};
const begin=()=>{if(dStart)return;dStart=performance.now();for(let i=0;i<wi;i++)if(!doneAt[i])doneAt[i]=dStart;fadeRAF=requestAnimationFrame(fade);};
function finish(){
  dDone=true;doneAt[SENT.length-1]=doneAt[SENT.length-1]||performance.now();
  cancelAnimationFrame(fadeRAF);fade();
  dec.classList.add('done');markCur();dBub.classList.remove('on','no');
  setTimeout(()=>{dPlain.textContent=PLAIN;dPlain.classList.add('on');},RM?0:1200);
}
// start on the first decodable word, before any tap
wi=-1;advance();doneAt.fill(0);
dKey.addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b||dDone)return;begin();
  const c=curCell();if(!c)return;
  if(b.dataset.k===c.dataset.ch){c.classList.add('on');c.classList.remove('bad');restart(b,'hit');
    ci++;if(ci>=SENT[wi].cells.length){dBub.classList.remove('on');advance();}else markCur();}
  else{restart(c,'bad');restart(b,'miss');}
});
dBub.addEventListener('click',()=>{if(dDone||!SENT[wi]||!SENT[wi].guess)return;begin();
  const w=dWords[wi];guessed.add(wi);w.dataset.guess=SENT[wi].guess.toLowerCase();restart(w,'guess');restart(dBub,'no');
  $$('.cell',w).forEach(c=>restart(c,'bad'));
  setTimeout(()=>{w.classList.remove('guess');$$('.cell',w).forEach(c=>c.classList.remove('bad'));dBub.classList.remove('on','no');},1100);
});
$('#dShow').addEventListener('click',()=>{if(dDone)return;begin();
  const run=()=>{if(dDone)return;const c=curCell();if(!c)return;c.classList.add('on');ci++;
    if(ci>=SENT[wi].cells.length){dBub.classList.remove('on');advance();}else markCur();
    if(!dDone)setTimeout(run,RM?0:150);};run();});

/* ---------- grades and scores ---------- */
const GY=[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024];
const GPA=[3.23,3.24,3.23,3.27,3.31,3.34,3.39,3.43,3.42,3.43];
const ACT=[20.97,21.01,20.81,20.97,20.81,20.68,20.59,20.34,19.79,19.48];
const gC=$('#gChart');
LAYOUT.push(()=>{
  const _r=gC.getBoundingClientRect(),W=_r.width||340,H=_r.height||300;gC.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const nar=W<620,fs=parseFloat(getComputedStyle(gC).fontSize)||18,pl=nar?8:20,pr=nar?8:20,pt=fs*3.4,pb=fs*3.2;
  const X=i=>pl+i/(GY.length-1)*(W-pl-pr);
  const Yg=v=>pt+(3.48-v)/(3.48-3.18)*(H-pt-pb),Ya=v=>pt+(21.15-v)/(21.15-19.3)*(H-pt-pb);
  const path=(arr,f)=>'M'+arr.map((v,i)=>X(i).toFixed(1)+' '+f(v).toFixed(1)).join('L');
  const n=GY.length-1;
  gC.innerHTML=`<line class="ax" x1="${pl}" x2="${W-pr}" y1="${H-pb+fs*.9}" y2="${H-pb+fs*.9}"/>
    <path class="act draw" d="${path(ACT,Ya)}"/><path class="gpa draw" d="${path(GPA,Yg)}"/>
    <circle class="pt" r="8" cx="${X(0)}" cy="${Ya(ACT[0])}" fill="var(--fg)"/><circle class="pt" r="8" cx="${X(n)}" cy="${Ya(ACT[n])}" fill="var(--fg)"/>
    <circle class="pt" r="8" cx="${X(0)}" cy="${Yg(GPA[0])}" fill="var(--ac)"/><circle class="pt" r="8" cx="${X(n)}" cy="${Yg(GPA[n])}" fill="var(--ac)"/>
    <g class="lb">
      <text class="n gpa-t" x="${X(0)}" y="${Yg(GPA[0])+fs*2.2}">3.23</text>
      <text class="n gpa-t" x="${X(n)}" y="${Yg(GPA[n])-fs*.9}" text-anchor="end">3.43</text>
      <text class="gpa-t" x="${X(n)}" y="${Yg(GPA[n])-fs*.9-fs*2.1}" text-anchor="end">Average GPA</text>
      <text class="n" x="${X(0)}" y="${Ya(ACT[0])-fs*.9}">21.0</text>
      <text x="${X(0)}" y="${Ya(ACT[0])-fs*.9-fs*2.1}">Average ACT score</text>
      <text class="n" x="${X(n)-18}" y="${Ya(ACT[n])+fs*.55}" text-anchor="end">19.5</text>
    </g>
    <text x="${X(0)}" y="${H-pb+fs*2.6}">2015</text><text x="${X(n)}" y="${H-pb+fs*2.6}" text-anchor="end">2024</text>`;
  $$('.draw',gC).forEach(p=>p.style.setProperty('--len',Math.ceil(p.getTotalLength())));
});
if(RM||!('IntersectionObserver'in window))gC.classList.add('on');
else new IntersectionObserver((es,ob)=>es.forEach(e=>{if(e.isIntersecting){gC.classList.add('on');ob.disconnect();}}),{threshold:.45}).observe(gC);

/* ---------- adults: 100 figures ---------- */
(()=>{const g=$('#grid100');let o='';const w=26,h=58,cols=20;
  for(let i=0;i<100;i++){const c=i%cols,r=Math.floor(i/cols);o+=`<path class="kid${i<16?' a':i<25?' b':''}" d="${kid(16+c*36,70+r*72,w,h)}"/>`;}
  g.setAttribute('viewBox','0 0 724 368');g.innerHTML=o;})();

/* ---------- quizzes: visual answers only ---------- */
$$('.quiz').forEach(q=>$$('.opt',q).forEach(o=>o.addEventListener('click',()=>{
  if(q.classList.contains('solved'))return;
  if(o.hasAttribute('data-ok')){o.classList.add('ok');q.classList.add('solved');o.setAttribute('aria-pressed','true');}
  else{restart(o,'no');o.setAttribute('aria-pressed','false');}
})));

/* ---------- go ---------- */
layout();tick();
requestAnimationFrame(()=>{land();tick();});
addEventListener('load',()=>{layout();if(location.hash)land();tick();});
})();
