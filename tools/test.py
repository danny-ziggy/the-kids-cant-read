"""Interaction, layout and type checks. Run: python3 tools/test.py
Phones are tested with touch emulation (hasTouch, isMobile) and real taps."""
import asyncio,re,sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from playwright.async_api import async_playwright
from shoot import new_page, go, ROOT

FAIL=[]
def check(name,ok,detail=''):
    print(('  ok   ' if ok else '  FAIL ')+name+(f'  [{detail}]' if detail and not ok else ''))
    if not ok: FAIL.append(name)

# smallest visible text anywhere, and smallest reading text
TYPE_JS='''(minBody)=>{
 const bad=[],body=[];
 const w=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT);
 const seen=new Set();
 while(w.nextNode()){const t=w.currentNode;if(!t.textContent.trim())continue;const el=t.parentElement;if(seen.has(el))continue;seen.add(el);
  const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;
  if(el.closest('[hidden],.full-only')&&getComputedStyle(el.closest('[hidden],.full-only')).display==='none')continue;
  let fs=parseFloat(cs.fontSize);
  if(el instanceof SVGElement){const m=el.getScreenCTM();if(m)fs*=Math.hypot(m.a,m.b);}
  if(fs<17.95)bad.push(el.tagName+'.'+(el.className.baseVal??el.className)+' '+fs.toFixed(1)+' "'+t.textContent.trim().slice(0,24)+'"');}
 document.querySelectorAll('.prose p,.lede,.dbody>p:not(.srcline),.tcard p:not(.big):not(.cap),.words dd').forEach(el=>{
  if(!el.offsetParent)return;const fs=parseFloat(getComputedStyle(el).fontSize);if(fs<minBody-.05)body.push(el.className+' '+fs+' "'+el.textContent.trim().slice(0,24)+'"');});
 return [bad.slice(0,8),body.slice(0,8)];}'''

async def run(b,vw,touch,rm=False):
    tag=f'{vw}{" touch" if touch else ""}{" reduced-motion" if rm else ""}'
    print(tag)
    ctx,pg,errs=await new_page(b,vw,touch=touch,rm=rm)
    J=pg.evaluate
    tap=(lambda loc: loc.tap()) if touch else (lambda loc: loc.click())

    # words and embeds
    txt=await J("()=>document.querySelector('main').textContent+' '+[...document.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label')).join(' ')")
    you=sorted(set(re.findall(r"\b(you|your|yours|you're|you've|you'll)\b",txt,re.I)))
    check('no second person',not you,str(you))
    check('no iframes or external scripts',await J("document.querySelectorAll('iframe,script[src],video,embed').length")==0)
    check('no tiktok links',await J("![...document.querySelectorAll('a')].some(a=>/tiktok\\.com/.test(a.href))"))

    # type sizes: everything >= 18px; reading text >= 21px on phones, 26px on desktop
    await J("document.querySelector('[data-ver=full]').click()");await pg.wait_for_timeout(200)
    minb=26 if vw>=960 else 21
    bad,body=await J(TYPE_JS,minb)
    check('no visible text under 18px',not bad,'; '.join(bad))
    check(f'reading text at least {minb}px',not body,'; '.join(body))
    await J("document.querySelector('[data-ver=short]').click()");await pg.wait_for_timeout(200)

    # horizontal overflow, checked at several scroll positions
    ov=[]
    for f in (0,.2,.4,.6,.8,1):
        await J(f"window.scrollTo(0,{f}*(document.documentElement.scrollHeight-innerHeight))");await pg.wait_for_timeout(120)
        sw=await J("document.documentElement.scrollWidth");ov.append(sw)
    check('no horizontal overflow',max(ov)<=vw,str(ov))

    # title: tap a letter
    await J("window.scrollTo(0,0)");await pg.wait_for_timeout(300)
    await tap(pg.locator('#gTitle .cell').nth(2));await pg.wait_for_timeout(300)
    check('title letter flips on tap',await J("document.querySelectorAll('#gTitle .cell')[2].classList.contains('on')"))

    # pinned scenes, scrolled through rather than jumped to the end
    if not rm:
        for p in (.1,.3,.5,.7,.95): await go(pg,'#history',p,wait=120)
        check('timeline lights 9 of 10 readers',await J("document.querySelectorAll('#readers10 .kid.on').length")==9)
        for p in (.1,.4,.7,.95): await go(pg,'.sc.pile',p,wait=120)
        await pg.wait_for_timeout(500)
        check('all five alarms land on the pile',await J("document.querySelectorAll('#stack5 .slab.on').length")==5)
        clipped=await J("()=>{const s=document.querySelector('.sc.pile .stage').getBoundingClientRect();return [...document.querySelectorAll('#stack5 .slab'),document.getElementById('pileTurn')].filter(e=>{const r=e.getBoundingClientRect();return r.bottom>s.bottom+1||r.right>innerWidth||r.left<0}).length}")
        check('pile fits its screen (nothing clipped)',clipped==0,str(clipped))
        steps=[]
        for p in (.1,.5,.95):
            await go(pg,'#split',p,wait=250)
            steps.append(await J("[...document.querySelectorAll('#split .st')].findIndex(s=>s.classList.contains('on'))"))
        check('split steps 0 → 1 → 2',steps==[0,1,2],str(steps))
        check('split draws strongest and weakest lines',await J("document.querySelectorAll('#c13 .hi').length>0&&document.querySelectorAll('#c13 .lo').length>0"))
        for p in (.1,.4,.7,.95): await go(pg,'#seniors',p,wait=120)
        check('seniors end in 2024 with three labels',await J("[document.querySelector('#queue .yr').textContent,document.querySelectorAll('#queue .dv').length].join()")=='2024,3')
        # every pinned stage's content fits inside the stage
        for sel in ('#history','.sc.brain','#split','#seniors'):
            await go(pg,sel,.95,wait=200)
            over=await J(f"()=>{{const s=document.querySelector('{sel} .stage');const r=s.getBoundingClientRect();return [...s.children].filter(c=>c.getBoundingClientRect().bottom>r.bottom+1).map(c=>c.className.baseVal??c.className)}}")
            check(f'{sel} fits its screen',not over,str(over))
    else:
        check('reduced motion: pinned scenes collapse',await J("[...document.querySelectorAll('.sc')].every(s=>s.offsetHeight<innerHeight*2.2)"))
        check('reduced motion: all step text visible',await J("[...document.querySelectorAll('.steps .st')].every(s=>getComputedStyle(s).opacity==='1')"))

    # the decoder, by tapping
    await go(pg,'#dec',dy=-10,wait=300)
    cur=lambda: J("(()=>{const c=document.querySelector('#dLine .cell.cur');return c?c.dataset.ch:null})()")
    ch=await cur()
    check('decoder starts on the first word to sound out',ch=='K',str(ch))
    wrong=await J("[...document.querySelectorAll('#dKey button')].find(b=>b.dataset.k!=='K').dataset.k")
    await tap(pg.locator(f'#dKey button[data-k="{wrong}"]'));await pg.wait_for_timeout(120)
    check('wrong key shakes, letter stays hidden',await J("(()=>{const c=document.querySelector('#dLine .cell.cur');return c.classList.contains('bad')&&!c.classList.contains('on')})()"))
    await tap(pg.locator('#dKey button[data-k="K"]'));await pg.wait_for_timeout(150)
    check('right key fills the slot',await J("document.querySelectorAll('#dLine .dword')[1].querySelector('.cell').classList.contains('on')"))
    check('helper is guessing',await J("document.getElementById('dBub').classList.contains('on')"))
    await pg.locator('#dBub').tap(force=True) if touch else await pg.locator('#dBub').click(force=True)
    await pg.wait_for_timeout(150)
    check('helper guess is struck out',await J("document.querySelectorAll('#dLine .dword')[1].classList.contains('guess')&&document.getElementById('dBub').classList.contains('no')"))
    await pg.wait_for_timeout(1200)
    n=0
    while n<20:
        ch=await cur()
        if not ch: break
        await tap(pg.locator(f'#dKey button[data-k="{ch}"]'));await pg.wait_for_timeout(90 if n!=4 else 4000);n+=1
    await pg.wait_for_timeout(1500)
    check('decoder finishes after every sound is tapped',await J("document.getElementById('dec').classList.contains('done')"),str(n))
    check('plain sentence appears',await J("document.getElementById('dPlain').classList.contains('on')&&document.getElementById('dPlain').textContent.startsWith('The kid')"))
    op=await J("[...document.querySelectorAll('#dLine .dword')].map(w=>+(w.style.opacity||1))")
    check('the start of the sentence has faded, the end has not',op[1]<.8 and op[-1]>.9,str([round(x,2) for x in op]))

    # health plans
    await go(pg,'#planQ',dy=-20,wait=200)
    await tap(pg.locator('#planQ .opt').nth(1));await pg.wait_for_timeout(100)
    check('plan: wrong answer shakes',await J("document.querySelectorAll('#planQ .opt')[1].classList.contains('no')"))
    await tap(pg.locator('#planQ [data-ok]'));await pg.wait_for_timeout(100)
    check('plan: right answer solves',await J("document.getElementById('planQ').classList.contains('solved')"))

    # layers
    await tap(pg.locator('[data-ver=full]'));await pg.wait_for_timeout(150)
    check('Full opens every drawer',await J("[...document.querySelectorAll('.dbody')].every(d=>!d.hidden)"))
    await tap(pg.locator('[data-ver=short]'));await pg.wait_for_timeout(150)
    check('Short shuts every drawer',await J("[...document.querySelectorAll('.dbody')].every(d=>d.hidden)"))
    await J("document.querySelector('[data-d=split] .more').click()")
    await pg.reload();await pg.wait_for_timeout(500)
    check('an opened drawer is remembered',await J("!document.querySelector('[data-d=split] .dbody').hidden"))
    await J("document.querySelector('[data-d=split] .more').click()")

    # tabs follow the reader
    await go(pg,'#cant',dy=10,wait=300)
    check('Can\'t tab is current in Can\'t',await J("document.querySelector('[data-nav=cant]').hasAttribute('aria-current')"))
    if vw<700:
        check('five tabs fit on one row',await J("(()=>{const a=[...document.querySelectorAll('.spines a')];return new Set(a.map(x=>Math.round(x.getBoundingClientRect().bottom))).size===1&&a.every(x=>x.scrollWidth<=x.clientWidth+1)})()"))

    # quiet share (desktop: copies)
    if not touch:
        await ctx.grant_permissions(['clipboard-read','clipboard-write'])
        await go(pg,'#grades',wait=200)
        await pg.locator('#grades .share').click();await pg.wait_for_timeout(200)
        check('Copy link confirms',await J("document.querySelector('#grades .share').textContent")=='Copied')

    check('no console errors',not errs,'; '.join(errs[:3]))
    await ctx.close()

async def deeplink(b):
    print('deep links')
    for h,sel,want in (('split','#split .st',2),('seniors',None,None),('decoder',None,None)):
        ctx,pg,errs=await new_page(b,390,touch=True)
        await pg.goto('file://'+str(ROOT/'index.html')+'#'+h);await pg.wait_for_timeout(900)
        top=await pg.evaluate(f"document.getElementById('{h}').getBoundingClientRect().top")
        ok=top<=60
        if sel: ok=ok and await pg.evaluate(f"[...document.querySelectorAll('{sel}')].findIndex(s=>s.classList.contains('on'))")==want
        check(f'#{h} lands on its key moment',ok,str(top))
        await ctx.close()

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        await run(b,390,True)
        await run(b,1280,False)
        await run(b,720,True)
        await run(b,390,True,rm=True)
        await deeplink(b)
        await b.close()
    print('\n'+('ALL PASSED' if not FAIL else f'{len(FAIL)} FAILED: '+', '.join(FAIL)))
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
