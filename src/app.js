(()=>{
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS='http://www.w3.org/2000/svg';
const mkRnd=s=>()=>(s=s*16807%2147483647)/2147483647;
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const pop=el=>{if(RM||!el)return;el.classList.remove('popping');void el.offsetWidth;el.animate([{transform:'scale(1)'},{transform:'scale(1.14)'},{transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.3,1.5,.5,1)'});};

/* ---------- invented alphabet ---------- */
const G={T:['XX',' o','ba'],H:['cd','  ','ba'],E:['X ','Xo','X '],K:['ab','X ','dc'],I:['o ','XX',' o'],D:['Xb','  ','dX'],S:['d ','Xa',' c'],C:['Xo','b ','Xo'],A:['cd','o ','XX'],N:[' X','dc','X '],R:['bX',' o','Xa'],P:['bd','  ','X '],O:['XX','  ','ab'],Y:['ba',' X',' X']};
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
const cellHTML=ch=>`<span class="cell${ch==="'"?' ap':''}" data-ch="${ch}">${glyph(ch,'f')}<span class="b" aria-hidden="true">${ch==="'"?'’':ch}</span></span>`;
const buildWord=(el,words)=>{el.innerHTML=words.map(w=>`<span class="gword">${[...w].map(cellHTML).join('')}</span>`).join('');return $$('.cell',el);};

/* a reader: a book spine with a head */
const kid=(x,y,w,h)=>{const r=w*.36,rr=w/2,top=y-h+r*2.3;return`M${x-w/2} ${y}V${top+rr}A${rr} ${rr} 0 0 1 ${x+w/2} ${top+rr}V${y}Z M${x+r} ${y-h+r}A${r} ${r} 0 1 1 ${x-r} ${y-h+r}A${r} ${r} 0 1 1 ${x+r} ${y-h+r}Z`;};

/* ---------- layers: Short / Full, drawers ---------- */
const root=document.documentElement;
let ver=store.get('kcr5-ver')==='full'?'full':'short';
const drawers=$$('.drawer');
const setDrawer=(d,open)=>{const b=$('.more',d),body=$('.dbody',d);b.setAttribute('aria-expanded',String(open));b.textContent=open?'Show less':'Show more';body.hidden=!open;};
drawers.forEach((d,i)=>{const b=$('.more',d),body=$('.dbody',d);body.id=body.id||'dr-'+d.dataset.d;b.setAttribute('aria-controls',body.id);
  b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')!=='true';setDrawer(d,open);store.set('kcr5-d-'+d.dataset.d,open?'1':'0');});});
const applyVer=(v,reset)=>{ver=v;root.dataset.ver=v;store.set('kcr5-ver',v);
  $$('.ver button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ver===v)));
  drawers.forEach(d=>{const k='kcr5-d-'+d.dataset.d;if(reset)store.del(k);const s=store.get(k);setDrawer(d,s===null?v==='full':s==='1');});};
$$('.ver button').forEach(b=>b.addEventListener('click',()=>{applyVer(b.dataset.ver,true);requestAnimationFrame(tick);}));
applyVer(ver,false);

/* ---------- router ---------- */
const views=$$('.view');
const navLinks=$$('[data-nav]');
let cur='landing',curEl=views[0];
const topbarH=()=>$('.topbar').offsetHeight;
const route=()=>{
  const h=location.hash.slice(1);
  let v='landing',anchor=null;
  if(/^act-[1-4]$/.test(h))v=h;
  else if(h==='prologue')anchor='chap-prologue';
  else if(h&&h!=='top'&&document.getElementById(h)){const el=document.getElementById(h);const vw=el.closest('.view');if(vw){v=vw.dataset.view;anchor=h;}}
  cur=v;views.forEach(x=>x.classList.toggle('on',x.dataset.view===v));curEl=views.find(x=>x.dataset.view===v);
  const key=v==='landing'?(anchor==='chap-prologue'?'prologue':null):v;
  navLinks.forEach(a=>{if(a.dataset.nav===key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  document.title=curEl.dataset.title;
  requestAnimationFrame(()=>{
    if(anchor){const el=document.getElementById(anchor);window.scrollTo(0,el.getBoundingClientRect().top+scrollY-topbarH()+1);}
    else window.scrollTo(0,0);
    layout();tick();
  });
};
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(!a)return;
  const href=a.getAttribute('href');
  if(href===location.hash||(href==='#top'&&(!location.hash||location.hash==='#top'))){e.preventDefault();route();}
});
addEventListener('hashchange',route);

/* ---------- scroll engine ---------- */
const SC={};      // name -> fn(p, el)
const LAYOUT=[];  // fns run on resize / view change
const layout=()=>LAYOUT.forEach(f=>f());
let ticking=false;
function tick(){
  ticking=false;
  const vh=innerHeight,tb=topbarH();
  $$('.sc',curEl).forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.bottom<-vh||r.top>vh*2)return;
    const st=$('.stage',el);
    const p=RM?1:clamp((tb-r.top)/Math.max(1,r.height-st.offsetHeight));
    el.style.setProperty('--p',p.toFixed(4));
    const f=SC[el.dataset.sc];if(f)f(p,el);
  });
  $$('.pg,.cover,.next,.drawer-band',curEl).forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.bottom<0||r.top>vh*1.5)return;
    const e=RM?1:clamp(1-(r.top-tb)/(vh*.8));
    el.style.setProperty('--e',e.toFixed(3));
  });
  const max=document.documentElement.scrollHeight-vh;
  $('#ribbon').style.setProperty('--rp',max>0?clamp(scrollY/max).toFixed(4):0);
}
const onScroll=()=>{if(!ticking){ticking=true;requestAnimationFrame(tick);}};
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',()=>{layout();onScroll();});

/* ---------- opening: the title ---------- */
const tCells=buildWord($('#gTitle'),['THE','KIDS',"CAN'T",'READ']);
const tOrder=(()=>{const r=mkRnd(11),ix=tCells.map((_,i)=>i);for(let i=ix.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[ix[i],ix[j]]=[ix[j],ix[i]];}return ix;})();
const tTapped=new Set();
SC.open=p=>{const k=Math.floor(clamp(p*1.25)*(tCells.length+.99));tOrder.forEach((ix,n)=>tCells[ix].classList.toggle('on',n<k||tTapped.has(ix)));};
tCells.forEach((c,i)=>c.addEventListener('click',()=>{tTapped.add(i);c.classList.add('on');}));

/* ---------- thesis: a shelf of 100, 40 fall ---------- */
const shelf=$('#shelf100');
let spines=[];
LAYOUT.push(()=>{
  const narrow=shelf.clientWidth<520,per=narrow?25:50,rows=100/per,sw=10,gap=3,H=70,rowH=H+14;
  const W=per*(sw+gap);shelf.setAttribute('viewBox',`-30 -6 ${W+40} ${rows*rowH+6}`);
  const rnd=mkRnd(7);let out='';
  for(let i=0;i<100;i++){const r=Math.floor(i/per),c=i%per,h=H-rnd()*18,x=c*(sw+gap),y=r*rowH+H-h;
    out+=`<rect class="sp" x="${x}" y="${y}" width="${sw}" height="${h}" rx="1.5"/>`;}
  for(let r=0;r<rows;r++)out+=`<rect class="board" x="-4" y="${r*rowH+H}" width="${W+4}" height="6"/>`;
  shelf.innerHTML=out;spines=$$('.sp',shelf);
});
SC.cant=p=>{const k=Math.round(clamp((p-.08)*1.5)*40);spines.forEach((s,i)=>s.classList.toggle('down',i<k));};

/* ---------- thesis: a shrinking stack of books ---------- */
const FUN=[[1984,35],[2012,27],[2020,17],[2023,14],[2025,14]];
const stack=$('#stack');
(()=>{const rnd=mkRnd(3),cols=['#000','#E0201B','#2347D9','#000','#fff'];let out='';
  for(let i=0;i<35;i++){const w=230+rnd()*110,x=200-w/2+(rnd()-.5)*26,y=392-(i+1)*11.2;out+=`<rect class="bk" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="10" rx="2" fill="${cols[i%5]}"${i%5===4?' stroke="#000" stroke-width="2.5"':''}/>`;}
  stack.setAttribute('viewBox','0 0 400 400');stack.innerHTML=out;})();
const books=$$('.bk',stack);let funI=-1;
SC.fun=p=>{const i=Math.min(4,Math.floor(clamp((p-.06)*1.25)*5));if(i===funI)return;funI=i;const[y,v]=FUN[i];
  books.forEach((b,n)=>b.classList.toggle('gone',n>=v));$('#nFun').textContent=v+'%';$('#yFun').textContent=y;pop($('#nFun'));};

/* ---------- prologue: the alarm shelf ---------- */
const track=$('#shelfTrack');
SC.shelf=(p,el)=>{const st=$('.stage',el),pad=parseFloat(getComputedStyle(st).paddingLeft);const dist=Math.max(0,track.scrollWidth-(st.clientWidth-pad*2));track.style.setProperty('--tx',(-clamp((p-.05)*1.15)*dist).toFixed(1));};

/* ---------- prologue: age 13, 1971 to 2025 ---------- */
const LTT=[[1971,255],[1975,256],[1980,258],[1984,257],[1988,257],[1990,257],[1992,260],[1994,258],[1996,258],[1999,259],[2004,259],[2008,260],[2012,263],[2020,260],[2023,256],[2025,256]];
const KEY={1971:1,2012:1,2025:1};
const ltt=$('#ltt');let lttLen=0,lttPts=[];
LAYOUT.push(()=>{
  const W=Math.max(300,ltt.clientWidth),H=Math.max(220,ltt.clientHeight);ltt.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const pl=W<600?24:60,pr=W<600?30:70,pt=70,pb=56;
  const X=y=>pl+(y-1971)/(2025-1971)*(W-pl-pr),Y=v=>pt+(265-v)/(265-250)*(H-pt-pb);
  const d=LTT.map(([y,v],i)=>(i?'L':'M')+X(y).toFixed(1)+' '+Y(v).toFixed(1)).join('');
  let out=`<line class="ax" x1="${pl}" x2="${W-pr}" y1="${H-pb+14}" y2="${H-pb+14}"/><path class="ln" d="${d}"/>`;
  LTT.forEach(([y,v])=>{const k=KEY[y];out+=`<circle class="pt${k?' k':''}" data-y="${y}" cx="${X(y)}" cy="${Y(v)}" r="${k?13:7}"/>`;
    if(k){const an=y===1971?'start':y===2025?'end':'middle',nar=W<600,vy=nar&&y!==2012?Y(v)+52:Y(v)-26,yy=nar&&y===2012?Y(v)-64:H-pb+52;
      out+=`<g class="kl" data-y="${y}"><text class="v" x="${X(y)}" y="${vy}" text-anchor="${an}">${v}</text><text x="${X(y)}" y="${yy}" text-anchor="${an}">${y}</text></g>`;}});
  ltt.innerHTML=out;const ln=$('.ln',ltt);lttLen=ln.getTotalLength();ln.style.strokeDasharray=lttLen;lttPts=LTT.map(([y])=>y);
});
SC.ltt=p=>{const q=clamp((p-.05)*1.3);const ln=$('.ln',ltt);if(!ln)return;ln.style.strokeDashoffset=(lttLen*(1-q)).toFixed(1);
  const yr=1971+q*(2025-1971);$$('.pt',ltt).forEach(c=>c.style.opacity=+c.dataset.y<=yr+.01?1:0);$$('.kl',ltt).forEach(g=>g.style.opacity=+g.dataset.y<=yr+.01?1:0);};

/* ---------- decoding ---------- */
const WORD='SNACK';
const dCells=buildWord($('#dWord'),[WORD]);
$('#dKey').innerHTML=[...'THEKIDSCANR'].map(c=>`<div>${glyph(c)}<span>${c}</span></div>`).join('');
const dec=$('#dec'),slots=$('#dSlots');
slots.innerHTML=[...WORD].map((_,i)=>`<input maxlength="1" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Letter ${i+1} of ${WORD.length}">`).join('');
const ins=$$('input',slots);
const dDone=()=>{if(ins.every(x=>x.classList.contains('ok'))&&!dec.classList.contains('done')){dec.classList.add('done');pop($('#dWord'));}};
const dSet=(i,ok)=>{const x=ins[i];x.value=WORD[i];x.classList.add('ok');x.readOnly=true;dCells[i].classList.add('on');};
ins.forEach((x,i)=>{
  x.addEventListener('input',()=>{const v=x.value.toUpperCase().slice(-1);x.value=v;if(!v)return;
    if(v===WORD[i]){dSet(i);pop(x);const nx=ins.find((y,j)=>j>i&&!y.classList.contains('ok'))||ins.find(y=>!y.classList.contains('ok'));if(nx)nx.focus();dDone();}
    else{x.classList.remove('bad');dCells[i].classList.remove('bad');void x.offsetWidth;x.classList.add('bad');dCells[i].classList.add('bad');setTimeout(()=>{x.value='';x.classList.remove('bad');dCells[i].classList.remove('bad');},460);}});
  x.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!x.value&&i>0&&!ins[i-1].classList.contains('ok')){ins[i-1].focus();}
    if(e.key==='ArrowLeft'&&i>0)ins[i-1].focus();if(e.key==='ArrowRight'&&i<ins.length-1)ins[i+1].focus();});
});
$('#dShow').addEventListener('click',()=>{ins.forEach((x,i)=>setTimeout(()=>{dSet(i);if(i===ins.length-1)dDone();},RM?0:i*140));});

/* ---------- quizzes: visual answers only ---------- */
$$('.quiz').forEach(q=>$$('.opt',q).forEach(o=>o.addEventListener('click',()=>{
  if(q.classList.contains('solved'))return;
  if(o.hasAttribute('data-ok')){o.classList.add('ok');q.classList.add('solved');o.setAttribute('aria-pressed','true');}
  else{o.classList.remove('no');void o.offsetWidth;o.classList.add('no');o.setAttribute('aria-pressed','false');}
})));

/* ---------- the habit: a book closes into a phone ---------- */
const mo=$('#morph'),bl=$('.bk-l',mo),br=$('.bk-r',mo),gl=$('.glow',mo);
SC.romance=p=>{
  const a=clamp(p/.45),b=clamp((p-.5)/.4);
  const sx=1-2*a;bl.setAttribute('transform',`translate(200 0) scale(${sx.toFixed(3)} 1) translate(-200 0)`);
  const rx=(4+b*24).toFixed(1),col=b>0?`rgb(${Math.round(90*(1-b))},0,${Math.round(32*(1-b))})`:'#5A0020';
  [bl,br].forEach(r=>{r.setAttribute('rx',rx);r.style.fill=col;});
  gl.style.opacity=b.toFixed(2);
  mo.style.transform=`translateX(${(-a*18.75).toFixed(2)}%)`;
};

/* ---------- Act I cover: the line ---------- */
(()=>{const g=$('#cvKids');if(!g)return;const H=[84,98,90,104,88,96,92,100];let d='';
  H.forEach((h,i)=>{d+=kid(22+i*30,236,22,h)+' ';});d+=kid(313,236,26,118);g.innerHTML=`<path d="${d}"/>`;})();

/* ---------- Act I: class picture ---------- */
const LO={2019:34,2022:37,2024:40};
const risers=$('#risers');let kids=[],perm=[];
LAYOUT.push(()=>{
  const narrow=risers.clientWidth<640,per=narrow?10:25,rows=100/per,w=narrow?26:22,gap=8,H=narrow?50:44,rowH=H+10;
  const W=per*(w+gap)+w;let out='',k=0;
  for(let r=0;r<rows;r++){const y=r*rowH+H,off=(r%2)*(w+gap)/2;
    for(let c=0;c<per;c++){out+=`<path class="kid" data-i="${k++}" d="${kid(off+w/2+c*(w+gap)+4,y,w,H)}"/>`;}
    out+=`<rect class="bench" x="0" y="${y}" width="${W}" height="5"/>`;}
  risers.innerHTML=`<svg viewBox="-4 -4 ${W+8} ${rows*rowH+H*.35+10}" role="img" aria-label="A class picture of 100 fourth graders">${out}</svg>`;
  kids=$$('.kid',risers);
  if(!perm.length){const r=mkRnd(5);perm=kids.map((_,i)=>i);for(let i=perm.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]];}}
  paintYear(curYear,false);
});
let curYear=2024;
function paintYear(y,anim){const n=LO[y];const set=new Set(perm.slice(0,n));
  kids.forEach((k,i)=>{const was=k.classList.contains('lo'),now=set.has(i);k.classList.toggle('lo',now);if(anim&&was!==now&&!RM){k.classList.remove('flip');void k.getBBox();k.classList.add('flip');}});
  $('#rCount').textContent=n;if(anim)pop($('#rCount'));
  $('#risers').setAttribute('aria-label',`100 fourth graders, ${n} highlighted: below Basic in ${y}`);}
$$('.years button').forEach(b=>b.addEventListener('click',()=>{curYear=+b.dataset.y;$$('.years button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));paintYear(curYear,true);}));

/* ---------- Act I: Line Leader ---------- */
const PCT=[[10,-24],[25,-15],[50,-8],[75,-2],[90,0]];
const drop=p=>{if(p<=10)return -24;if(p>=90)return 0;for(let i=0;i<PCT.length-1;i++){const[a,da]=PCT[i],[b,db]=PCT[i+1];if(p<=b)return da+(db-da)*(p-a)/(b-a);}return 0;};
const queue=$('#queue');let qT=0,qPin=50,qPlayed=false;
function qDraw(){
  const W=Math.max(300,queue.clientWidth),H=Math.max(240,queue.clientHeight);queue.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const top=58,kh=H*.26,base=top+kh+H*.12,step=W/100,kw=Math.max(2.4,step*.8),s=(H-base-40)/24;
  const pin=Math.min(99,Math.round(qPin-.5));let d='',hi='';
  for(let i=0;i<100;i++){const y=base-drop(i+.5)*s*qT,p=kid(step*(i+.5),y,kw,kh)+' ';if(i===pin)hi=p;else d+=p;}
  const px=step*(pin+.5),py=base-drop(qPin)*s*qT,dv=Math.round(-drop(qPin)*qT);
  const lab=qT<1?`${qPin}th percentile`:(qPin===90?'90th: about the same':`${qPin}th: ${dv} points lower`);
  queue.innerHTML=`<rect class="tape" x="0" y="${base}" width="${W}" height="8" opacity=".4"/><text class="lab" x="${W-4}" y="${base+34}" text-anchor="end" opacity=".85">1992</text>
    <path class="kid" d="${d}"/><path class="kid hi" d="${hi}"/>
    <line class="lead" x1="${px}" x2="${px}" y1="${top+8}" y2="${py-kh-8}"/>
    <g transform="translate(${px} ${py+20})"><path class="x" d="M-13 -9L13 17M13 -9L-13 17"/></g>
    <text class="lab big" x="0" y="${top-8}">${lab}</text>`;
  const t=$('.lab.big',queue),tw=t.getComputedTextLength();t.setAttribute('x',clamp(px-tw/2,4,Math.max(4,W-tw-4)).toFixed(1));
}
LAYOUT.push(qDraw);
const qYr=$('#qYr');
const qPlay=()=>{qPlayed=true;if(RM){qT=1;qYr.textContent='2024';qDraw();return;}const t0=performance.now(),from=qT>=1?0:qT;qYr.textContent='1992';
  const f=t=>{qT=clamp(from+(t-t0)/1800*(1-from));qDraw();if(qT<1)requestAnimationFrame(f);else{qYr.textContent='2024';pop(qYr);}};requestAnimationFrame(f);};
$('#qPlay').addEventListener('click',()=>{qT=0;qPlay();});
$$('.pins button').forEach(b=>b.addEventListener('click',()=>{qPin=+b.dataset.p;$$('.pins button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));qDraw();}));
queue.addEventListener('click',e=>{const r=queue.getBoundingClientRect(),pc=(e.clientX-r.left)/r.width*100;const near=PCT.map(x=>x[0]).reduce((a,b)=>Math.abs(b-pc)<Math.abs(a-pc)?b:a);$(`.pins button[data-p="${near}"]`).click();});
new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&!qPlayed)qPlay();}),{threshold:.6}).observe(queue);

/* ---------- Act I: across a life ---------- */
const LIFE=[
  {age:'Age 9',big:'40%',txt:'of fourth graders scored below Basic in 2024.',s:.52},
  {age:'Age 13',big:'About 1 in 3',txt:'eighth graders scored below Basic in 2024, the largest share on record.',s:.7},
  {age:'Age 17',big:'4×',txt:'as likely not to graduate on time, for a child not reading proficiently by the end of third grade.',s:.88},
  {age:'Age 22',big:'25%',txt:'of Americans 16 to 24 scored at the lowest adult literacy levels in 2023. In 2017 it was 16%.',s:1},
  {age:'Age 30',big:'More hospital stays',txt:'and more emergency care went with low health literacy.',s:1},
  {age:'Everyone',big:'Up to $2.2T',txt:'a year, by one model’s estimate of what low literacy cost the U.S. economy.',s:1}];
const grow=$('#grow'),lst=$('.lstat');let lifeI=-1;
$('#lTicks').innerHTML=LIFE.map(()=>'<li></li>').join('');
$('#lSteps').innerHTML=LIFE.map(d=>`<li>${d.age}: ${d.big} ${d.txt}</li>`).join('');
const lifePaint=i=>{const d=LIFE[i];$('#lAge').textContent=d.age;const b=$('#lBig');b.textContent=d.big;b.classList.toggle('long',d.big.length>6);$('#lTxt').textContent=d.txt;
  $$('#lTicks li').forEach((li,n)=>li.classList.toggle('on',n<=i));
  let g=`<rect class="tape" x="0" y="306" width="200" height="10"/>`;
  if(i<5)g+=`<path class="kid${i<2?' hi':''}" d="${kid(100,306,70*d.s,290*d.s)}"/>`;
  else{for(let n=0;n<7;n++)g+=`<path class="kid${n===3?' hi':''}" d="${kid(16+n*28,306-(n%2)*8,22,104)}"/>`;}
  grow.innerHTML=g;};
SC.life=p=>{const i=Math.min(5,Math.floor(clamp(p*1.05)*6));if(i===lifeI)return;const first=lifeI<0;lifeI=i;
  if(first||RM){lifePaint(i);return;}lst.classList.add('swap');setTimeout(()=>{lifePaint(i);lst.classList.remove('swap');},180);};
lifePaint(0);

/* ---------- go ---------- */
route();
})();
