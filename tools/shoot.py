import sys, json, pathlib, asyncio
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent; D=ROOT; FS=ROOT/'tools'/'node_modules'
FONTS={'arch':FS/'@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2',
'atk':FS/'@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2',
'atki':FS/'@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-italic.woff2',
'news':FS/'@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2',
'newsi':FS/'@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2'}
CSS='''@font-face{font-family:'Archivo';src:url(https://fonts.gstatic.com/l/arch.woff2) format('woff2');font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:'Atkinson Hyperlegible Next';src:url(https://fonts.gstatic.com/l/atk.woff2) format('woff2');font-weight:200 800;font-style:normal}
@font-face{font-family:'Atkinson Hyperlegible Next';src:url(https://fonts.gstatic.com/l/atki.woff2) format('woff2');font-weight:200 800;font-style:italic}
@font-face{font-family:'Newsreader';src:url(https://fonts.gstatic.com/l/news.woff2) format('woff2');font-weight:200 800;font-style:normal}
@font-face{font-family:'Newsreader';src:url(https://fonts.gstatic.com/l/newsi.woff2) format('woff2');font-weight:200 800;font-style:italic}'''
async def handle(route):
    u=route.request.url
    if 'fonts.googleapis.com' in u: return await route.fulfill(status=200,content_type='text/css',body=CSS)
    if 'fonts.gstatic.com/l/' in u:
        k=u.rsplit('/',1)[1].split('.')[0]; return await route.fulfill(status=200,content_type='font/woff2',body=FONTS[k].read_bytes())
    if u.startswith('file:'): return await route.continue_()
    return await route.abort()
# scroll so that a pinned scene sits at progress p (0..1), or an element's top sits under the top bar
GO='''([sel,p,dy])=>{const e=document.querySelector(sel);const tb=document.querySelector('.topbar').offsetHeight;
 const top=e.getBoundingClientRect().top+scrollY-tb;const st=e.querySelector(':scope>.stage');
 const y=st?top+p*(e.offsetHeight-st.offsetHeight):top+(dy||0);window.scrollTo(0,Math.max(0,y));}'''
VH={1280:800,960:900,720:820,390:844}
async def new_page(b,vw,touch=False,rm=False):
    vh=VH.get(vw,860)
    ctx=await b.new_context(viewport={'width':vw,'height':vh},device_scale_factor=1,has_touch=touch,is_mobile=touch and vw<700,reduced_motion='reduce' if rm else 'no-preference')
    pg=await ctx.new_page(); errs=[]
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.route('**/*',handle)
    await pg.goto('file://'+str(ROOT/'index.html'))
    await pg.wait_for_timeout(700)
    return ctx,pg,errs
async def go(pg,sel,p=0,dy=0,wait=500):
    await pg.evaluate(GO,[sel,p,dy]); await pg.wait_for_timeout(wait)
async def main():
    shots=json.loads(pathlib.Path(sys.argv[1]).read_text())
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        widths=[int(w) for w in (sys.argv[2] if len(sys.argv)>2 else '1280,390').split(',')]
        only=sys.argv[3].split(',') if len(sys.argv)>3 else None
        for vw in widths:
            ctx,pg,errs=await new_page(b,vw)
            for s in shots:
                if only and not any(s['n'].startswith(o) for o in only): continue
                if s.get('only') and s['only']!=('m' if vw<=700 else 'd'): continue
                if s.get('sel'): await go(pg,s['sel'],s.get('p',0),s.get('dy',0),s.get('wait',600))
                if s.get('js'): await pg.evaluate(s['js']); await pg.wait_for_timeout(s.get('wait2',500))
                (D/'shots').mkdir(exist_ok=True); await pg.screenshot(path=str(D/'shots'/f"{vw}-{s['n']}.png"))
            ow=await pg.evaluate("()=>{const o=[];document.querySelectorAll('main *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0&&r.right>innerWidth+1&&!e.closest('svg,.cell'))o.push(e.tagName+'.'+e.className+' '+Math.round(r.right))});return [document.documentElement.scrollWidth,innerWidth,o.slice(0,6)]}")
            print(vw,'overflow:',ow,'errors:',errs[:10])
            await ctx.close()
        await b.close()
if __name__=="__main__": asyncio.run(main())
