import asyncio,re
from playwright.async_api import async_playwright
from shoot import handle, ROOT
URL='file://'+str(ROOT/'index.html')
async def check(b,vw,rm=False):
    ctx=await b.new_context(viewport={'width':vw,'height':820},reduced_motion='reduce' if rm else 'no-preference')
    pg=await ctx.new_page();errs=[];out={}
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.route('**/*',handle)
    await pg.goto(URL);await pg.wait_for_timeout(500)
    J=pg.evaluate
    # no second person, no embeds, anywhere
    txt=''
    for h in ['#','#act-1','#act-2','#act-3','#act-4']:
        await J("h=>location.hash=h",h);await pg.wait_for_timeout(250)
        txt+=await J("()=>[...document.querySelectorAll('.view')].map(v=>v.textContent).join(' ')+' '+[...document.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label')).join(' ')")
        if h!='#':out['top '+h]=await J('scrollY')
    out['you']=sorted(set(re.findall(r"\b(you|your|yours|you're|you've)\b",txt,re.I)))
    out['iframes']=await J("document.querySelectorAll('iframe,script[src]').length")
    await J("location.hash=''");await pg.wait_for_timeout(300)
    if rm:
        out['rm title all on']=await J("[...document.querySelectorAll('#gTitle .cell')].every(c=>c.classList.contains('on'))")
        out['rm sc height']=await J("document.querySelector('.sc.shelf').offsetHeight<innerHeight*1.6")
    # title tap
    await J("window.scrollTo(0,0)");await pg.wait_for_timeout(200)
    await pg.click('#gTitle .cell >> nth=2');out['tap flips']=await J("document.querySelectorAll('#gTitle .cell')[2].classList.contains('on')")
    # layers
    await pg.click('[data-ver=full]');out['full: drawers open']=await J("[...document.querySelectorAll('.dbody')].every(d=>!d.hidden)")
    await pg.click('[data-ver=short]');out['short: drawers shut']=await J("[...document.querySelectorAll('.dbody')].every(d=>d.hidden)")
    await J("document.querySelector('[data-d=thesis] .more').click()")
    await pg.reload();await pg.wait_for_timeout(400)
    out['drawer remembered']=await J("!document.querySelector('[data-d=thesis] .dbody').hidden")
    await J("document.querySelector('[data-d=thesis] .more').click()")
    # decoder
    await J("document.getElementById('decode').scrollIntoView()");await pg.wait_for_timeout(200)
    ins=pg.locator('#dSlots input')
    await ins.nth(0).fill('S');await ins.nth(1).fill('Q');await pg.wait_for_timeout(600)
    out['dec right/wrong']=await J("[...document.querySelectorAll('#dSlots input')].map(i=>i.classList.contains('ok')?1:0).join('')")
    await pg.click('#dShow');await pg.wait_for_timeout(900)
    out['dec done']=await J("document.getElementById('dec').classList.contains('done')")
    # comprehension
    await pg.click('#mara .opt >> nth=0');out['mara wrong']=await J("document.querySelectorAll('#mara .opt')[0].classList.contains('no')")
    await pg.click('#mara [data-ok]');out['mara solved']=await J("document.getElementById('mara').classList.contains('solved')")
    # prologue anchor
    await J("location.hash='prologue'");await pg.wait_for_timeout(400)
    out['prologue top']=await J("Math.round(document.getElementById('chap-prologue').getBoundingClientRect().top-document.querySelector('.topbar').offsetHeight)")
    # act I
    await J("location.hash='act-1'");await pg.wait_for_timeout(400)
    await pg.click('.years [data-y="2019"]')
    out['2019']=await J("[document.getElementById('rCount').textContent,document.querySelectorAll('#risers .kid.lo').length]")
    await J("document.getElementById('queue').scrollIntoView({block:'center'})");await pg.wait_for_timeout(2400)
    await pg.click('.pins [data-p="10"]')
    out['line']=await J("[document.getElementById('qYr').textContent,document.querySelector('#queue .lab.big').textContent]")
    await J("(()=>{const e=document.querySelector('.sc.life');window.scrollTo(0,e.offsetTop+0.62*(e.offsetHeight-innerHeight))})()");await pg.wait_for_timeout(600)
    out['life']=await J("document.getElementById('lAge').textContent")
    await J("document.getElementById('plan').scrollIntoView()")
    await pg.click('#planQ .opt >> nth=1');await pg.click('#planQ [data-ok]')
    out['plan']=await J("document.getElementById('planQ').classList.contains('solved')")
    out['errors']=errs
    print(vw,'RM' if rm else '',out)
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for vw in (1280,390):await check(b,vw)
        await check(b,390,True)
        await b.close()
asyncio.run(main())
