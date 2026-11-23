{
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPhone=()=>innerWidth<=700;
const mkRnd=s=>()=>(s=s*16807%2147483647)/2147483647;
const minus=v=>v<0?'−'+Math.abs(v):String(v);
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

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
const buildTitle=(el,words)=>{el.innerHTML=words.map(w=>`<span class="gword">${[...w].map(cellHTML).join('')}</span>`).join('');return $$('.cell',el);};

/* ---------- router ---------- */
const views=$$('.view');
const navLinks=$$('[data-nav]');
let curView='landing';
const route=()=>{
  const h=location.hash.slice(1);
  let v='landing',anchor=null;
  if(/^act-[123]$/.test(h))v=h;
  else if(h==='prologue')anchor='chap-prologue';
  else if(h==='credits'){v='act-3';anchor='credits';}
  curView=v;
  views.forEach(x=>x.classList.toggle('on',x.dataset.view===v));
  const navKey=v==='landing'?'prologue':v;
  navLinks.forEach(a=>{if(a.dataset.nav===navKey)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  const view=views.find(x=>x.dataset.view===v);
  document.title=view.dataset.title;
  requestAnimationFrame(()=>{
    if(anchor){const el=document.getElementById(anchor);if(el){window.scrollTo(0,el.getBoundingClientRect().top+scrollY-(isPhone()?0:parseInt(css('--navh'))||54));}}
    else window.scrollTo(0,0);
    tlLayout();onScroll();
    if(v==='act-3')endText();
  });
};
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(!a)return;
  if(a.getAttribute('href')===location.hash||(a.getAttribute('href')==='#top'&&!location.hash)){e.preventDefault();route();}
});
addEventListener('hashchange',route);

/* reading times */
const words=el=>(el.textContent||'').trim().split(/\s+/).filter(w=>/[A-Za-z0-9]/.test(w)).length;
views.forEach(v=>{
  const n=words(v);const m=Math.max(1,Math.round(n/230));
  $$(`[data-rt="${v.dataset.view}"]`).forEach(s=>s.textContent=`≈ ${m} min read`);
});

/* share */
$$('[data-share]').forEach(b=>b.addEventListener('click',async()=>{
  const url=location.href.split('#')[0]+'#'+b.dataset.share;
  const wrap=b.parentElement;
  $$('.copied,.copyfield',wrap).forEach(x=>x.remove());
  try{await navigator.clipboard.writeText(url);const s=document.createElement('span');s.className='copied';s.textContent='Link copied';b.after(s);setTimeout(()=>s.remove(),2400);}
  catch(err){const i=document.createElement('input');i.className='copyfield';i.readOnly=true;i.value=url;i.setAttribute('aria-label','Link to this episode');b.after(i);i.focus();i.select();}
}));

/* ---------- cold open ---------- */
const cold=$('#cold'),coldCells=buildTitle($('#gTitle'),['THE','KIDS',"CAN'T",'READ']);
const order=(()=>{const r=mkRnd(11),ix=coldCells.map((_,i)=>i);for(let i=ix.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[ix[i],ix[j]]=[ix[j],ix[i]];}return ix;})();
let coldMax=0;
const coldHint=$('#coldHint');
const coldUpdate=k=>{
  coldMax=Math.max(coldMax,k);
  order.slice(0,coldMax).forEach(i=>coldCells[i].classList.add('on'));
  if(coldCells.every(c=>c.classList.contains('on')))coldHint.textContent='There. Now you can read it.';
};
coldCells.forEach(c=>c.addEventListener('click',()=>{c.classList.add('on');coldUpdate(coldMax)}));
$('#skip').addEventListener('click',()=>{coldUpdate(coldCells.length);const h=$('#hostline');window.scrollTo({top:h.getBoundingClientRect().top+scrollY-(isPhone()?0:54),behavior:RM?'auto':'smooth'});});
const pad=n=>String(n).padStart(2,'0');
const coldScroll=()=>{
  if(curView!=='landing')return;
  const r=cold.getBoundingClientRect();
  const total=cold.offsetHeight-innerHeight;
  const p=clamp(-r.top/Math.max(1,total*.8));
  coldUpdate(Math.floor(p*(coldCells.length+1)));
  const f=Math.floor(p*8*25);$('#coldTc').textContent=`00:00:${pad(Math.floor(f/25))}:${pad(f%25)}`;
};

/* ---------- TikTok ---------- */
const TT='https://www.tiktok.com/@heymisscanigetapencil/video/7579812040152288567';
$('#ttPlay').addEventListener('click',()=>{
  const emb=$('#ttEmbed');
  $('#ttPoster').style.display='none';
  emb.classList.add('on');
  emb.innerHTML=`<iframe src="https://www.tiktok.com/player/v1/7579812040152288567?description=1&rel=0&autoplay=1" allow="autoplay; fullscreen" allowfullscreen title="Ms. L's TikTok video" style="display:block;width:100%;height:100%;border:0"></iframe>`;
  $('#ttNote').textContent='Not playing? Some previews, including Claude\u2019s, block outside video players. Use \u201cWatch on TikTok.\u201d';
});

/* ---------- prologue timeline ---------- */
const tl=$('#tl'),track=$('#tlTrack'),tlBar=$('#tlBar');
let tlDist=0;
const tlLayout=()=>{
  if(!tl)return;
  if(isPhone()||curView!=='landing'){tl.style.height='';track.style.transform='';return;}
  tlDist=Math.max(0,track.scrollWidth-innerWidth);
  tl.style.height=(innerHeight-54+tlDist)+'px';
};
const tlScroll=()=>{
  if(isPhone()||curView!=='landing'||!tlDist)return;
  const r=tl.getBoundingClientRect();
  const total=tl.offsetHeight-(innerHeight-54);
  const p=clamp((54-r.top)/Math.max(1,total));
  track.style.transform=`translateX(${-p*tlDist}px)`;
  tlBar.style.width=(p*100)+'%';
};

/* ---------- chart helpers ---------- */
const sized=(el,fn)=>{if(!el)return;const draw=()=>{const W=el.clientWidth,H=el.clientHeight;if(W&&H)fn(W,H)};const ro=new ResizeObserver(draw);ro.observe(el);return draw;};

/* LTT age 13 */
const LTT=[[1971,255],[1975,256],[1980,258],[1984,257],[1988,257],[1990,257],[1992,260],[1994,258],[1996,258],[1999,259],[2004,259],[2008,260],[2012,263],[2020,260],[2023,256],[2025,256]];
let lttS=3;
const lttFig=$('#lttFig');
const lttDraw=sized(lttFig,(W,H)=>{
  const ph=isPhone();
  const L=ph?18:30,R=ph?58:90,T=ph?70:90,B=ph?H*.44:56;
  const x=y=>L+(y-1971)/(2025-1971)*(W-L-R);
  const yv=v=>T+(266-v)/(266-249)*(H-T-B);
  const path=a=>a.map((d,i)=>`${i?'L':'M'}${x(d[0]).toFixed(1)} ${yv(d[1]).toFixed(1)}`).join('');
  const climb=LTT.filter(d=>d[0]<=2012),fall=LTT.filter(d=>d[0]>=2012);
  const s=lttS,big=ph?34:52;
  const lab=(d,txt,col,anchor,dy,sub)=>`<text x="${x(d[0])}" y="${yv(d[1])+dy}" text-anchor="${anchor}" font-family="Anton,Impact,sans-serif" font-size="${big}" fill="${col}">${txt}</text>`+(sub?`<text x="${x(d[0])}" y="${yv(d[1])+dy+(ph?20:24)}" text-anchor="${anchor}" font-family="JetBrains Mono,monospace" font-size="13" fill="#a09b8f">${sub}</text>`:'');
  let o=`<text x="${L}" y="${ph?24:30}" font-family="JetBrains Mono,monospace" font-size="13" fill="#a09b8f">Average reading score, age 13</text>`;
  [1971,1990,2012,2025].forEach(y=>{o+=`<text x="${x(y)}" y="${H-B+(ph?24:34)}" text-anchor="${y===1971?'start':y===2025?'end':'middle'}" font-family="JetBrains Mono,monospace" font-size="13" fill="#a09b8f">${y}</text>`});
  o+=`<line x1="${L}" x2="${W-R+10}" y1="${H-B+8}" y2="${H-B+8}" stroke="#34322c" stroke-width="2"/>`;
  if(s>=3)o+=`<line x1="${x(1971)}" x2="${x(2025)}" y1="${yv(255)}" y2="${yv(255)}" stroke="#6d695f" stroke-width="1.5" stroke-dasharray="4 6"/>`;
  o+=`<path d="${path(LTT)}" fill="none" stroke="#34322c" stroke-width="5" stroke-linejoin="round"/>`;
  if(s>=1)o+=`<path d="${path(climb)}" fill="none" stroke="${s===1?'#ffe600':'#ece6d8'}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`;
  if(s>=3)o+=`<path d="${path(fall)}" fill="none" stroke="#ff4a3a" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`;
  o+=`<circle cx="${x(1971)}" cy="${yv(255)}" r="7" fill="#ece6d8"/>`+lab([1971,255],'255','#ece6d8','start',ph?44:62,'1971');
  if(s>=2)o+=`<circle cx="${x(2012)}" cy="${yv(263)}" r="8" fill="#ffe600"/>`+lab([2012,263],'263','#ffe600','middle',-22,null)+`<text x="${x(2012)}" y="${yv(263)-(ph?60:80)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="13" fill="#ffe600">2012 PEAK</text>`;
  if(s>=3)o+=`<circle cx="${x(2025)}" cy="${yv(256)}" r="8" fill="#ff4a3a"/>`+lab([2025,256],'256','#ff4a3a','end',ph?44:62,'2025 − 7 from peak');
  lttFig.innerHTML=`<svg viewBox="0 0 ${W} ${H}">${o}</svg>`;
});

/* reading for fun */
const funFig=$('#funFig');
sized(funFig,(W,H)=>{
  const ph=W<560;
  const L=ph?12:20,R=ph?12:200,T=60,B=50;
  const x=y=>L+(y-1984)/(2025-1984)*(W-L-R);
  const yv=v=>T+(40-v)/40*(H-T-B);
  const daily=[[1984,35],[2012,27],[2020,17],[2023,14],[2025,14]],never=[[2012,22],[2023,31]];
  const p=a=>a.map((d,i)=>`${i?'L':'M'}${x(d[0]).toFixed(1)} ${yv(d[1]).toFixed(1)}`).join('');
  const F='font-family="Anton,Impact,sans-serif"',M='font-family="JetBrains Mono,monospace" font-size="13" fill="#a09b8f"';
  let o='';
  [0,20,40].forEach(v=>{o+=`<line x1="${L}" x2="${W-R}" y1="${yv(v)}" y2="${yv(v)}" stroke="#24231f" stroke-width="1"/><text x="${W-R+(ph?-2:8)}" y="${yv(v)-6}" text-anchor="${ph?'end':'start'}" ${M}>${v}%</text>`});
  [1984,2012,2025].forEach(y=>{o+=`<text x="${x(y)}" y="${H-B+28}" text-anchor="${y===1984?'start':y===2025?'end':'middle'}" ${M}>${y}</text>`});
  if(!ph)o+=`<text x="${x(2020)}" y="${H-B+28}" text-anchor="middle" ${M}>2020</text>`;
  o+=`<path d="${p(daily.slice(0,2))}" fill="none" stroke="#ff4a3a" stroke-width="6" stroke-dasharray="2 10" stroke-linecap="round"/>`;
  o+=`<path d="${p(daily.slice(1))}" fill="none" stroke="#ff4a3a" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`;
  o+=`<path d="${p(never)}" fill="none" stroke="#ece6d8" stroke-width="5" stroke-linecap="round"/>`;
  const fs=ph?30:44;
  const pts=ph?[[1984,35,'start'],[2012,27,'middle'],[2025,14,'end']]:[[1984,35,'start'],[2012,27,'middle'],[2020,17,'middle'],[2025,14,'end']];
  daily.forEach(d=>{o+=`<circle cx="${x(d[0])}" cy="${yv(d[1])}" r="7" fill="#ff4a3a"/>`});
  pts.forEach(([y,v,a])=>{o+=`<text x="${x(y)}" y="${yv(v)+(y===2025?(ph?44:56):-18)}" text-anchor="${a}" ${F} font-size="${fs}" fill="#ff4a3a">${v}%</text>`});
  never.forEach(d=>{o+=`<circle cx="${x(d[0])}" cy="${yv(d[1])}" r="6" fill="#ece6d8"/>`});
  o+=`<text x="${x(2012)+(ph?-10:-14)}" y="${yv(22)+8}" text-anchor="end" ${F} font-size="${ph?24:32}" fill="#ece6d8">22%</text>`;
  o+=`<text x="${x(2023)}" y="${yv(31)-16}" text-anchor="${ph?'end':'middle'}" ${F} font-size="${ph?24:32}" fill="#ece6d8">31%</text>`;
  if(ph){
    o+=`<text x="${L}" y="20" font-family="JetBrains Mono,monospace" font-size="13" fill="#ff4a3a">● almost every day</text><text x="${L}" y="40" font-family="JetBrains Mono,monospace" font-size="13" fill="#ece6d8">● never or hardly ever</text>`;
  }else{
    o+=`<text x="${x(2025)+14}" y="${yv(14)+5}" font-family="JetBrains Mono,monospace" font-size="14" fill="#ff4a3a">almost every day</text>`;
    o+=`<text x="${x(2023)+14}" y="${yv(31)+5}" font-family="JetBrains Mono,monospace" font-size="14" fill="#ece6d8">never or hardly ever</text>`;
    o+=`<text x="${(x(1984)+x(2012))/2}" y="${yv(31)+26}" text-anchor="middle" ${M}>(years between not shown)</text>`;
  }
  funFig.innerHTML=`<svg viewBox="0 0 ${W} ${H}">${o}</svg>`;
});

/* dumbbells */
$$('.trk[data-db]').forEach(t=>{
  const [a,b]=t.dataset.db.split(',').map(Number),[lo,hi]=(t.dataset.dom||'0,60').split(',').map(Number),u=t.dataset.u||'',[ya,yb]=(t.dataset.y||',').split(',');
  const f=v=>(v-lo)/(hi-lo)*100,pc=v=>f(v).toFixed(2)+'%';
  const tx=v=>f(v)>88?'transform:translateX(calc(-100% + 10px))':f(v)<12?'transform:translateX(-10px)':'';
  const l=Math.min(a,b),r=Math.max(a,b);
  t.innerHTML=`<span class="ln" style="left:${pc(l)};width:calc(${pc(r)} - ${pc(l)})"></span><span class="dot o" style="left:${pc(a)}"></span><span class="dot n" style="left:${pc(b)}"></span><span class="v" style="left:${pc(a)};${tx(a)}">${minus(a)}${u}<small>${ya}</small></span><span class="v n" style="left:${pc(b)};top:48px;${tx(b)}">${minus(b)}${u}<small>${yb}</small></span>`;
});

/* ---------- three can'ts ---------- */
const dWord=$('#dWord'),dCells=buildTitle(dWord,['SNACK']);
$('#dKey').innerHTML=[...'THEKIDSCANR'].map(c=>`<div>${glyph(c)}<span>${c}</span></div>`).join('');
let dStart=0;
const dIn=$('#dIn'),dFb=$('#dFb');
dIn.addEventListener('focus',()=>{if(!dStart)dStart=performance.now()});
const dReveal=()=>dCells.forEach((c,i)=>setTimeout(()=>c.classList.add('on'),RM?0:i*120));
$('#dForm').addEventListener('submit',e=>{
  e.preventDefault();
  const v=dIn.value.trim().toUpperCase();
  if(!v){dFb.textContent='Type what you think it says.';return;}
  const secs=dStart?Math.max(1,Math.round((performance.now()-dStart)/1000)):null;
  if(v==='SNACK'){dReveal();dFb.innerHTML=`<strong class="y-t">SNACK.</strong> ${secs?`That took you about ${secs} second${secs===1?'':'s'} for five letters. `:''}You just decoded.`;}
  else{const ok=[...v].filter((c,i)=>c==='SNACK'[i]).length;dFb.innerHTML=`Not quite. ${ok?`You have ${ok} of 5 letters in the right place. `:''}Match each shape to the key, left to right.`;}
});
$('#dGive').addEventListener('click',()=>{dReveal();dIn.value='SNACK';dFb.innerHTML='<strong class="y-t">SNACK.</strong> No shame. That’s what it feels like when the code was never taught.';});

/* quizzes */
$$('[data-quiz]').forEach(q=>{
  if(q.dataset.quiz==='hasty')return;
  const opts=$$('.opt',q),fb=$('[data-fb]',q),box=$('.opts',q);
  opts.forEach(o=>o.addEventListener('click',()=>{
    if(box.classList.contains('done'))return;
    box.classList.add('done');
    opts.forEach(x=>{if(x.hasAttribute('data-ok'))x.classList.add('ok')});
    if(!o.hasAttribute('data-ok')){o.classList.add('no');fb.insertAdjacentHTML('afterbegin','<p><strong>Not quite.</strong></p>');}
    fb.classList.add('on');
  }));
});

/* poll */
const POLL={week:'Show-off. (Affectionate.)',month:'Respectable. The book thanks you.',year:'Honest. This is a judgment-free poll, mostly.',mid:'Mid-book counts. Mid-book since spring also counts, emotionally.',dunno:'Then you’re going to enjoy Act Two. Or recognize it.'};
let pollA=store.get('kcr-lastbook');
const pollPaint=()=>{$$('#poll button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.a===pollA)));$('#pollFb').textContent=pollA?POLL[pollA]||'':'';};
$$('#poll button').forEach(b=>b.addEventListener('click',()=>{pollA=b.dataset.a;store.set('kcr-lastbook',pollA);pollPaint();endText();}));
pollPaint();

/* ---------- Act One: Get in Line ---------- */
const PCT=[[10,-24],[25,-15],[50,-8],[75,-2],[90,0]];
const drop=p=>{if(p<=10)return -24;if(p>=90)return 0;for(let i=0;i<PCT.length-1;i++){const[a,da]=PCT[i],[b,db]=PCT[i+1];if(p<=b)return da+(db-da)*(p-a)/(b-a);}return 0;};
let lineT=0,youP=50;
const lineFig=$('#lineFig'),lineIn=$('#lineT'),lineYr=$('#lineYr');
const person=(w,h,fill)=>{const hr=w*.42;return`<circle cx="0" cy="${-h+hr}" r="${hr}" fill="${fill}"/><path d="M${-w/2} 0V${-h+hr*2.3+w*.3}Q${-w/2} ${-h+hr*2.3} 0 ${-h+hr*2.3}Q${w/2} ${-h+hr*2.3} ${w/2} ${-h+hr*2.3+w*.3}V0Z" fill="${fill}"/>`;};
const mix=(t)=>{const a=[236,230,216],b=[255,74,58];return`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')})`;};
const lineDraw=()=>{
  const W=lineFig.clientWidth;if(!W)return;
  const vert=W<600,t=lineT/100,youI=Math.min(99,Math.max(0,Math.round(youP-.5)));
  const F='font-family="Anton,Impact,sans-serif"',M='font-family="JetBrains Mono,monospace" font-size="13"';
  let o='',H;
  if(!vert){
    H=Math.max(440,Math.min(520,W*.42));lineFig.style.height=H+'px';
    const L=10,R=10,T=74,y0=T+70,sc=(H-y0-92)/24,step=(W-L-R)/100,fw=Math.max(4,step*.74),fh=Math.min(44,Math.max(24,step*3.4));
    o+=`<text x="${L}" y="20" ${M} fill="#a09b8f">Each figure: one 12th grader. Height of the drop: points lost since 1992.</text>`;
    o+=`<line x1="${L}" x2="${W-R}" y1="${y0}" y2="${y0}" stroke="#6d695f" stroke-width="2" stroke-dasharray="5 6"/>`;
    o+=`<text x="${W-R}" y="${y0-8}" text-anchor="end" ${M} fill="#a09b8f">1992 level</text>`;
    for(let i=0;i<100;i++){
      const p=i+.5,d=drop(p),cx=L+step*(i+.5),cy=y0+(-d)*sc*t,you=i===youI;
      o+=`<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})">${person(fw,fh,you?'#ffe600':mix(clamp(-d/24*t)))}</g>`;
      if(you)o+=`<text x="${cx}" y="${cy-fh-10}" text-anchor="middle" ${M} fill="#ffe600" font-weight="700">YOU</text>`;
    }
    PCT.forEach(([p,d])=>{
      const cx=L+step*p,cy=y0+(-d)*sc*t;
      o+=`<text x="${cx}" y="${T-26}" text-anchor="middle" ${M} fill="#ece6d8">${p}th</text><line x1="${cx}" x2="${cx}" y1="${T-18}" y2="${y0-fh-16}" stroke="#34322c" stroke-width="2"/>`;
      if(t>0)o+=`<text x="${cx}" y="${cy+42}" text-anchor="middle" ${F} font-size="${W<900?30:40}" fill="${d===0?'#ece6d8':'#ff4a3a'}">${d===0?'±0':minus(Math.round(d*t))}</text>`;
    });
    o+=`<text x="${L}" y="${H-6}" ${M} fill="#a09b8f">← weakest reader</text><text x="${W-R}" y="${H-6}" text-anchor="end" ${M} fill="#a09b8f">strongest reader →</text>`;
  }else{
    const rowH=24,T=54;H=T+100*rowH+40;lineFig.style.height=H+'px';
    const x0=W-78,sc=(x0-96)/24,fw=10,fh=20;
    o+=`<text x="${W-6}" y="18" text-anchor="end" ${M} fill="#a09b8f">strongest ↑</text><text x="8" y="18" ${M} fill="#a09b8f">← points lost</text>`;
    o+=`<line x1="${x0}" x2="${x0}" y1="${T-10}" y2="${T+100*rowH}" stroke="#6d695f" stroke-width="2" stroke-dasharray="5 6"/><text x="${x0+8}" y="${T-16}" ${M} fill="#a09b8f">1992</text>`;
    PCT.forEach(([p])=>{const y=T+(100-p)*rowH;o+=`<line x1="4" x2="${W-4}" y1="${y}" y2="${y}" stroke="#24231f" stroke-width="1"/>`;});
    for(let i=99;i>=0;i--){
      const p=i+.5,d=drop(p),y=T+(99-i)*rowH+rowH-3,cx=x0+d*sc*t,you=i===youI;
      o+=`<g transform="translate(${cx.toFixed(1)} ${y})">${person(fw,fh,you?'#ffe600':mix(clamp(-d/24*t)))}</g>`;
      if(you)o+=`<text x="${cx-12}" y="${y-5}" text-anchor="end" ${M} fill="#ffe600" font-weight="700">YOU</text>`;
    }
    PCT.forEach(([p,d])=>{
      const y=T+(100-p)*rowH;
      o+=`<text x="8" y="${y-6}" ${M} fill="#ece6d8">${p}th percentile</text>`;
      o+=`<text x="${W-6}" y="${y+30}" text-anchor="end" ${F} font-size="30" fill="${d===0?'#ece6d8':'#ff4a3a'}">${t>0?(d===0?'±0':minus(Math.round(d*t))):''}</text>`;
    });
    o+=`<text x="8" y="${H-10}" ${M} fill="#a09b8f">weakest ↓</text>`;
  }
  lineFig.innerHTML=`<svg viewBox="0 0 ${W} ${H}">${o}</svg>`;
};
const lineRO=new ResizeObserver(()=>lineDraw());lineRO.observe(lineFig);
const setLine=v=>{lineT=v;lineIn.value=v;lineIn.style.setProperty('--p',v+'%');lineYr.innerHTML=v<=0?'1992':v>=100?'<span class="to">2024</span>':'1992<span class="to">→</span>';lineDraw();};
lineIn.addEventListener('input',()=>setLine(+lineIn.value));
let anim=null;
const playLine=to=>{
  cancelAnimationFrame(anim);
  if(RM){setLine(to);return;}
  const from=lineT,t0=performance.now(),dur=1600*Math.abs(to-from)/100;
  const f=now=>{const k=clamp((now-t0)/Math.max(1,dur)),e=k<.5?2*k*k:1-((-2*k+2)**2)/2;setLine(Math.round(from+(to-from)*e));if(k<1)anim=requestAnimationFrame(f);};
  anim=requestAnimationFrame(f);
};
$('#linePlay').addEventListener('click',()=>{playLine(lineT>=100?0:100);});
const ord=n=>{const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
const youPaint=()=>{
  $('#youPv').textContent=youP;
  $$('#youSeg button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.p===youP)));
  const d=Math.round(drop(youP)),rep=[10,25,50,75,90].includes(youP);
  let note='';
  if(youP<10)note=' NAEP reports down to the 10th percentile, which fell 24 points; the drawing holds there below it.';
  else if(youP>90)note=' NAEP reports up to the 90th percentile; above it, the drawing holds at no change.';
  else if(!rep)note=' (Interpolated between the percentiles NAEP reports.)';
  $('#youOut').innerHTML=d===0
    ?`<span class="big" style="color:var(--bone)">±0</span><p>At the ${ord(youP)} percentile, a senior in 2024 reads about as well as one in 1992. You’d have been fine. The people at the other end of your line would not.${note}</p>`
    :`<span class="big">${minus(d)} points</span><p>A 2024 senior standing at the ${ord(youP)} percentile scores about ${Math.abs(d)} points below the 1992 senior who stood in the same spot.${note}</p>`;
  lineDraw();
};
$$('#youSeg button').forEach(b=>b.addEventListener('click',()=>{youP=+b.dataset.p;$('#youP').value=youP;youPaint();if(lineT<100)playLine(100);}));
$('#youP').addEventListener('input',e=>{youP=+e.target.value;youPaint();});
$('#youP').addEventListener('change',()=>{if(lineT<100)playLine(100);});
youPaint();setLine(0);

/* class of 100 */
const LV={2019:[34,31,35],2022:[37,30,33],2024:[40,29,31]};
const NOTE={2019:'Before the pandemic.',2022:'After the first pandemic years.',2024:'The most since 2002, and not significantly different from 1992. We climbed out of this hole once and walked back in.'};
const kids=$('#kids');
kids.innerHTML=Array.from({length:100},()=>`<span class="kid"><svg viewBox="0 0 30 50" aria-hidden="true"><circle cx="15" cy="9" r="8"/><path d="M3 50V28Q3 20 15 20Q27 20 27 28V50Z"/></svg></span>`).join('');
const kidEls=$$('.kid svg',kids);
const setYear=y=>{
  const[bb,b]=LV[y];
  kidEls.forEach((k,i)=>k.setAttribute('class',i<bb?'lv-bb':i<bb+b?'lv-b':'lv-p'));
  $('#bbNum').textContent=bb;$('#bbNote').textContent=NOTE[y];
  $$('.yrs button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.y===String(y))));
  $('#kidLegend').innerHTML=`<div><span style="background:var(--red)"></span>${bb} below Basic</div><div><span style="background:var(--k4)"></span>${b} Basic</div><div><span style="background:var(--bone2)"></span>${100-bb-b} Proficient or above</div><div class="note">NAEP fourth-grade reading, ${y}.</div>`;
};
$$('.yrs button').forEach(b=>b.addEventListener('click',()=>setYear(+b.dataset.y)));
setYear(2024);

/* life course */
const LIFE=[
  {age:'9',big:'40%',lab:'of fourth graders read below Basic',src:'NAEP 2024',s:.5},
  {age:'13',big:'1 in 3',lab:'eighth graders below Basic, the largest share ever',src:'NAEP 2024',s:.68},
  {age:'17',big:'4×',lab:'as likely not to graduate on time, if not reading proficiently by the end of 3rd grade',src:'Annie E. Casey Foundation',s:.86},
  {age:'22',big:'25%',lab:'of 16–24-year-olds at the lowest literacy levels, up from 16%',src:'PIAAC 2023',s:1},
  {age:'30',big:'More ER visits',lab:'and hospital stays go with low health literacy',src:'AHRQ review, 2011',s:1},
  {age:'All',big:'$2.2T',lab:'a year, a model estimate of what low literacy costs the U.S.',src:'Gallup for the Barbara Bush Foundation',s:1}
];
let lifeS=0;
const lifeFig=$('#lifeFig');
const lifeDraw=()=>{
  const d=LIFE[lifeS],ph=isPhone();
  const fig=lifeS<5?`<svg class="life-p" viewBox="0 0 120 300" aria-hidden="true"><g transform="translate(60 300) scale(${d.s})"><circle cx="0" cy="-258" r="34" fill="#ece6d8"/><path d="M-48 0V-170Q-48 -214 0 -214Q48 -214 48 -170V0Z" fill="${lifeS<2?'#ff4a3a':'#ece6d8'}"/></g></svg>`
    :`<svg class="life-p" viewBox="0 0 300 300" aria-hidden="true">${[0,1,2,3,4,5,6].map(i=>`<g transform="translate(${30+i*40} ${300-(i%2)*14}) scale(.36)"><circle cx="0" cy="-258" r="34" fill="#ece6d8"/><path d="M-48 0V-170Q-48 -214 0 -214Q48 -214 48 -170V0Z" fill="${i===3?'#ffe600':'#ece6d8'}"/></g>`).join('')}</svg>`;
  lifeFig.innerHTML=`<div class="life${ph?' mob':''}">
    <div class="life-age"><span class="tc">${lifeS===5?'Everyone':'Jamie, age'}</span><b>${d.age==='All'?'Us':d.age}</b></div>
    <div class="life-fig">${fig}</div>
    <div class="life-stat"><b class="${lifeS===5?'y-t':'red-t'}${d.big.length>7?' long':''}">${d.big}</b><span>${d.lab}</span><span class="tc">${d.src}</span></div>
    <ol class="life-rule">${LIFE.map((x,i)=>`<li class="${i===lifeS?'on':i<lifeS?'past':''}"><i></i><span>${x.age}</span></li>`).join('')}</ol>
  </div>`;
};
lifeDraw();addEventListener('resize',lifeDraw);

/* scrolly engine */
const SC={ltt:s=>{lttS=s;lttDraw&&lttDraw();},life:s=>{lifeS=s;lifeDraw();}};
$$('[data-scrolly]').forEach(sc=>{
  const steps=$$('.step',sc),k=sc.dataset.scrolly;
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){steps.forEach(s=>s.classList.toggle('on',s===e.target));SC[k](+e.target.dataset.s);}}),{rootMargin:'-45% 0px -45% 0px'});
  steps.forEach(s=>io.observe(s));
});

/* ---------- Act Two: hasty reader ---------- */
const hasty=$('#hasty'),hText=$('#hastyText'),hFb=$('#hastyFb'),hOpts=$$('.opt',hasty),hBox=$('.opts',hasty);
const hWords=words(hText);let hStart=0;
const hIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&!hStart)hStart=performance.now();}),{threshold:.2});hIO.observe(hText);
const hReset=()=>{hBox.classList.remove('done');hOpts.forEach(o=>o.classList.remove('ok','no'));hFb.classList.remove('on');hFb.innerHTML='';hStart=performance.now();};
hOpts.forEach(o=>o.addEventListener('click',()=>{
  if(hBox.classList.contains('done'))return;
  hBox.classList.add('done');
  const ok=o.hasAttribute('data-ok');
  hOpts.forEach(x=>{if(x.hasAttribute('data-ok'))x.classList.add('ok')});if(!ok)o.classList.add('no');
  const secs=Math.max(1,Math.round((performance.now()-(hStart||performance.now()-60000))/1000));
  const wpm=Math.round(hWords/(secs/60)),fast=wpm>650,W=wpm.toLocaleString('en-US');
  let m;
  if(fast&&!ok)m=`<p><strong>Whoa.</strong> You “read” ${hWords} words in ${secs} second${secs===1?'':'s'}. That’s about ${W} words a minute, and the answer was in the very last sentence. No judgment; the page practically dared you. But congratulations: you just met PISA’s newest category of reader.</p>`;
  else if(fast)m=`<p><strong>Right, and fast.</strong> ${hWords} words in ${secs} second${secs===1?'':'s'} is about ${W} words a minute. Either you’re a phenomenal reader, or you jumped to the question and hunted for the answer. That’s a real skill. It’s also exactly the habit the test-makers are worried about.</p>`;
  else if(ok)m=`<p><strong>C, and you earned it.</strong> About ${W} words a minute. The answer was hiding in the last sentence, which is where long texts love to put things. Every other option is in the passage too, as somebody’s theory.</p>`;
  else m=`<p><strong>Not quite. It’s C.</strong> Your answer is in the passage, but as a bystander’s theory. The real reason waits in the very last sentence: the borrower wouldn’t return the book unfinished. Which is, if you think about it, this entire act.</p>`;
  hFb.innerHTML=m+'<button class="btn" type="button" id="hAgain" style="border-color:var(--ink);color:var(--ink)">Try again</button>';
  hFb.classList.add('on');
  $('#hAgain').addEventListener('click',hReset);
}));

/* suspects strips */
$$('.strip[data-arv]').forEach(s=>{
  const pc=y=>((y-2008)/18*100).toFixed(2)+'%';
  s.innerHTML=`<span class="dec" style="left:${pc(2012)};right:0"></span><span class="arv${s.hasAttribute('data-r')?' r':''}" style="left:${pc(+s.dataset.arv)}" data-l="${s.dataset.l}"></span>`;
});

/* ---------- Act Three: guess or sound it out ---------- */
const pony=$('#pony');
pony.innerHTML=`<rect x="0" y="168" width="320" height="32" fill="#24231f"/>
<g fill="#ece6d8">
 <rect x="104" y="122" width="16" height="50" rx="5"/><rect x="132" y="126" width="16" height="46" rx="5"/>
 <rect x="188" y="126" width="16" height="46" rx="5"/><rect x="214" y="122" width="16" height="50" rx="5"/>
 <ellipse cx="166" cy="114" rx="76" ry="34"/>
 <path d="M206 104L232 54Q240 40 256 44L280 56Q290 62 286 74L278 82Q272 88 262 84L250 80L234 114Z"/>
</g>
<path d="M232 52Q222 66 214 94L206 104L216 106Q226 82 238 60Z" fill="#ffe600"/>
<path d="M236 44Q246 30 258 40Q248 38 240 50Z" fill="#ffe600"/>
<path d="M90 104Q66 110 62 142Q76 132 92 122Z" fill="#ffe600"/>
<circle cx="266" cy="62" r="3.5" fill="#0c0c0b"/>
<path d="M244 47L247 35L255 45Z" fill="#ece6d8"/>
<rect x="104" y="168" width="16" height="5" fill="#0c0c0b"/><rect x="132" y="168" width="16" height="5" fill="#0c0c0b"/><rect x="188" y="168" width="16" height="5" fill="#0c0c0b"/><rect x="214" y="168" width="16" height="5" fill="#0c0c0b"/>`;
const gosCells=buildTitle($('#gosWord'),['PONY']);
const SND=['p','oh','n','ee'];
const snd=$('#gosSnd');snd.innerHTML=SND.map(s=>`<span>/${s}/</span>`).join('');
const sndEls=$$('span',snd);
$('#gosKey').innerHTML=[['P','p'],['O','oh'],['N','n'],['Y','ee'],['H','h'],['R','r'],['S','s'],['E','e']].map(([c,s])=>`<div>${glyph(c)}<span>/${s}/</span></div>`).join('');
const gosOut=$('#gosOut');
let gosTimers=[];
const gosClear=()=>{gosTimers.forEach(clearTimeout);gosTimers=[];gosCells.forEach(c=>c.classList.remove('on','hot'));sndEls.forEach(s=>s.classList.remove('on'));};
$('#gosGuess').addEventListener('click',()=>{
  gosClear();
  gosOut.innerHTML=`<span class="disp red-t">Horse?</span><p>Close. Sensible. Wrong. It fits the picture and it’s a real word, and nothing about guessing can tell you it’s wrong. Check the first shape against the key: it says /p/, not /h/.</p>`;
  gosCells[0].classList.add('hot');
});
$('#gosSound').addEventListener('click',()=>{
  gosClear();
  gosOut.innerHTML='<p class="note">Sounding it out…</p>';
  const dt=RM?250:650;
  gosCells.forEach((c,i)=>{gosTimers.push(setTimeout(()=>{gosCells.forEach(x=>x.classList.remove('hot'));c.classList.add('hot');sndEls[i].classList.add('on');},i*dt));});
  gosTimers.push(setTimeout(()=>{
    gosCells.forEach((c,i)=>gosTimers.push(setTimeout(()=>{c.classList.remove('hot');c.classList.add('on')},RM?0:i*110)));
    gosOut.innerHTML=`<span class="disp y-t">Pony.</span><p>/p/ /oh/ /n/ /ee/. Slower. Right. And it works on words that don’t come with a picture, which is nearly all of them.</p>`;
  },SND.length*dt+200));
});

/* evidence board */
const FX=[
  {t:'Phonics and early screening',w:['schools','states'],m:5,ml:'Strong',f:'Teach the code explicitly, in order, and screen young kids so strugglers are caught early. Mississippi went from second-worst to the top ten. Massachusetts now requires K–3 screening at least twice a year.',c:'Gains faded by 8th grade in Mississippi. Decoding is necessary, not sufficient.'},
  {t:'High-dosage tutoring',w:['schools','states'],m:5,ml:'Strong',f:'96 randomized trials, pooled effect of 0.37 standard deviations. Reading tutoring works best in the early grades.',c:'Nashville’s scale-up showed minimal gains. Quality is hard to mass-produce.'},
  {t:'Knowledge-rich curriculum',w:['schools','states'],m:3,ml:'Promising',f:'Teach history, science and art in depth so kids know enough to understand what they read. A lottery study of Core Knowledge schools found about +16 percentile points in reading, grades 3–6.',c:'The schools were charters, so the curriculum’s effect can’t be isolated.'},
  {t:'Phone bans',w:['schools','states','families'],m:2,ml:'Modest',f:'Florida’s classroom ban: test scores up about 1 percentile point in year two.',c:'Suspensions spiked in year one. Helpful, not a cure.'},
  {t:'Whole books, assigned again',w:['schools','everyone'],m:0,ml:'Untested',f:'Professors and teachers describe students who were never asked to finish a book. Asking again is cheap.',c:'No trial has tested whether it rebuilds the habit.',u:1},
  {t:'Adults reading where kids can see',w:['families','everyone'],m:0,ml:'Untested',f:'Adult reading for pleasure fell from 28% to 16% on a given day. Kids learn habits by watching them.',c:'Plausible, popular, and untested.',u:1},
  {t:'Adult education',w:['states','everyone'],m:1,ml:'Limited',f:'A quarter of 16–24-year-olds read at the lowest levels, many with diplomas. Adult literacy programs exist to catch them.',c:'Evidence on what works for adults is limited.'}
];
const fx=$('#fx');
fx.innerHTML=FX.map(d=>`<article class="fc${d.u?' untested':''}" data-w="${d.w.join(' ')}"><h3>${d.t}</h3><div class="who">${d.w.map(w=>`<span>${w}</span>`).join('')}</div><div class="meter"><i aria-hidden="true">${[1,2,3,4,5].map(n=>`<b class="${n<=d.m?'f':''}"></b>`).join('')}</i><span>Evidence: ${d.ml}</span></div><p>${d.f}</p><div class="cav">${d.c}</div></article>`).join('');
const fxCards=$$('.fc',fx);
const fxSet=f=>{
  let n=0;fxCards.forEach(c=>{const on=f==='all'||c.dataset.w.split(' ').includes(f);c.hidden=!on;if(on)n++;});
  $$('#fxF button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.f===f)));
  $('#fxCount').textContent=`Showing ${n} of ${FX.length}`;
};
$$('#fxF button').forEach(b=>b.addEventListener('click',()=>fxSet(b.dataset.f)));
fxSet('all');

/* ending */
const endCells=buildTitle($('#endTitle'),['THE','END']);
endCells.forEach(c=>c.addEventListener('click',()=>c.classList.toggle('on')));
const endIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)endCells.forEach((c,i)=>setTimeout(()=>c.classList.add('on'),RM?0:1400+i*220));}),{threshold:.6});
endIO.observe($('#endTitle'));
const END={week:'In the Prologue you said you’d finished a book this week. You’re the control group. Carry on.',month:'In the Prologue you said you’d finished a book this month. Respectable. Tell a kid what it was.',year:'In the Prologue you said you’d finished one this year. That counts. Tell someone what it was.',mid:'In the Prologue you said you were mid-book. Go finish it. I’ll wait.',dunno:'In the Prologue you couldn’t remember the last book you finished. Welcome to Act Two. The door’s still open.'};
function endText(){
  const total=views.reduce((s,v)=>s+words(v),0);
  const k=(Math.round(total/500)*500).toLocaleString('en-US');
  $('#endWords').textContent=`Counting everything, this piece runs about ${k} words. If you got here by reading rather than tapping the tabs, you just did the exact thing this act says nobody knows how to make people do. Statistically, that makes you a little strange. Thank you.`;
  $('#endPoll').textContent=pollA?END[pollA]:'You skipped the book question back in the Prologue. That’s fine. It’s still a good question.';
}

/* audio shells */
$$('.wave').forEach((w,j)=>{const r=mkRnd(31+j*7);w.innerHTML=Array.from({length:64},(_,i)=>`<i style="height:${Math.round(18+70*r()*Math.abs(Math.sin(i/5)))}%"></i>`).join('');});

/* ---------- chapter art ---------- */
const ART={
  prologue:(W,H)=>{const r=mkRnd(5);let o='';const n=Math.round(W*H/26000);for(let i=0;i<n;i++){const w=110+r()*150,h=70+r()*110,x=r()*W*1.05-40,y=r()*H*1.05-30,a=(r()-.5)*16;o+=`<g transform="translate(${x} ${y}) rotate(${a})" opacity="${.35+r()*.5}"><rect width="${w}" height="${h}" fill="#2c2a24"/><rect x="10" y="12" width="${w*.8}" height="12" fill="#4a463c"/>${[0,1,2,3,4].map(k=>`<rect x="10" y="${34+k*9}" width="${w*(.5+r()*.35)}" height="3" fill="#3a372f"/>`).join('')}</g>`;}o+=`<g transform="translate(${W*.72} ${H*.36}) rotate(-8)"><rect x="-90" y="-26" width="180" height="52" fill="none" stroke="#ff4a3a" stroke-width="5"/><text x="0" y="12" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="34" fill="#ff4a3a" style="stroke:none">PANIC</text></g>`;return o;},
  act1:(W,H)=>{const n=W>H?100:44,L=W>H?W*.36:W*.06,R=W*.04,y0=W>H?H*.2:H*.3,sc=(W>H?H*.26:H*.2)/24,step=(W-L-R)/n,fw=step*.6,fh=Math.min(70,step*3.6);let o=`<line x1="${L}" x2="${W-R}" y1="${y0}" y2="${y0}" stroke="#4a463c" stroke-width="2" stroke-dasharray="6 8"/>`;for(let i=0;i<n;i++){const p=(i+.5)*100/n,d=drop(p);o+=`<g transform="translate(${L+step*(i+.5)} ${y0-d*sc})">${person(fw,fh,mix(clamp(-d/24)*.85))}</g>`;}return o;},
  act2:(W,H)=>{const x0=W>H?W*.5:W*.1,x1=W*.96,top=W>H?H*.14:H*.2,bot=W>H?H*.86:H*.6;let o=`<rect x="${x0}" y="${top}" width="${x1-x0}" height="${bot-top}" fill="#24231f"/>`;const n=Math.round((bot-top)/5);for(let i=0;i<n;i++){const y=top+i*5+2;o+=`<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="#3d3a32" stroke-width="1.4"/>`;}const bx=x0+(x1-x0)*.3;o+=`<path d="M${bx} ${top-30}h28v${bot-top+80}l-14 -16l-14 16z" fill="#ffe600"/><text x="${bx+40}" y="${top-8}" font-family="JetBrains Mono,monospace" font-size="16" fill="#ffe600" style="stroke:none">p. 212</text>`;return o;},
  act3:(W,H)=>{const gw=W>H?Math.min(W*.09,H*.26):W*.16,gh=gw*1.5,cx=W>H?W*.68:W*.5,y=W>H?H*.24:H*.2,gap=gw*.35,tot=4*gw+3*gap;let o='';['P','O','N','Y'].forEach((c,i)=>{const x=cx-tot/2+i*(gw+gap);o+=`<g transform="translate(${x} ${y}) scale(${gw/60})" fill="#4a463c">${glyph(c).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g><text x="${x+gw/2}" y="${y+gh+gw*.6}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="${gw*.34}" fill="#ffe600" style="stroke:none">/${SND[i]}/</text>`;});return o;}
};
$$('.chap-art').forEach(s=>{const k=s.dataset.art;sized(s,(W,H)=>{s.setAttribute('viewBox',`0 0 ${W} ${H}`);s.innerHTML=ART[k](W,H);});});

/* ---------- scroll loop ---------- */
const progs=$$('.prog');
let ticking=false;
function onScroll(){
  if(ticking)return;ticking=true;
  requestAnimationFrame(()=>{
    ticking=false;
    coldScroll();tlScroll();
    const max=document.documentElement.scrollHeight-innerHeight;
    const p=max>0?clamp(scrollY/max):0;progs.forEach(b=>b.style.width=(p*100)+'%');
  });
}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',()=>{tlLayout();onScroll();});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{tlLayout();onScroll();});
route();
}
