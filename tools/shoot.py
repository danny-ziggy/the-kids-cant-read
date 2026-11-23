import sys, json, pathlib, asyncio
from playwright.async_api import async_playwright
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent.parent; D=ROOT; FS=ROOT/'tools'/'node_modules'
FONTS={'anton':FS/'@fontsource/anton/files/anton-latin-400-normal.woff2',
'news':FS/'@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2',
'newsi':FS/'@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2',
'mono':FS/'@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'}
CSS='''@font-face{font-family:'Anton';src:url(https://fonts.gstatic.com/l/anton.woff2) format('woff2');font-weight:400}
@font-face{font-family:'Newsreader';src:url(https://fonts.gstatic.com/l/news.woff2) format('woff2');font-weight:200 800;font-style:normal}
@font-face{font-family:'Newsreader';src:url(https://fonts.gstatic.com/l/newsi.woff2) format('woff2');font-weight:200 800;font-style:italic}
@font-face{font-family:'JetBrains Mono';src:url(https://fonts.gstatic.com/l/mono.woff2) format('woff2');font-weight:100 800}'''
async def handle(route):
    u=route.request.url
    if 'fonts.googleapis.com' in u: return await route.fulfill(status=200,content_type='text/css',body=CSS)
    if 'fonts.gstatic.com/l/' in u:
        k=u.rsplit('/',1)[1].split('.')[0]; return await route.fulfill(status=200,content_type='font/woff2',body=FONTS[k].read_bytes())
    if u.startswith('file:'): return await route.continue_()
    return await route.abort()
SHOTS=json.loads(pathlib.Path(sys.argv[1]).read_text()) if __name__=="__main__" else []
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        widths=[int(w) for w in (sys.argv[2] if len(sys.argv)>2 else '1280,390').split(',')]
        for vw in widths:
            vh={1280:800,960:900,720:820,390:844}.get(vw,860); tag=str(vw)
            ctx=await b.new_context(viewport={'width':vw,'height':vh},device_scale_factor=1)
            pg=await ctx.new_page(); errs=[]
            pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
            pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.route('**/*',handle)
            await pg.goto('file://'+str(ROOT/'index.html'))
            await pg.wait_for_timeout(600)
            files=[]
            for s in SHOTS:
                if s.get('only') and s['only']!=('m' if vw<=700 else 'd'): continue
                await pg.evaluate("h=>{if(location.hash!==h){location.hash=h}}",s.get('route','#'))
                await pg.wait_for_timeout(250)
                if s.get('js'): await pg.evaluate(s['js'])
                await pg.wait_for_timeout(s.get('wait',450))
                if s.get('js2'):
                    await pg.evaluate(s['js2']); await pg.wait_for_timeout(400)
                (D/'shots').mkdir(exist_ok=True); f=D/'shots'/f"{tag}-{s['n']}.png"; await pg.screenshot(path=str(f)); files.append(f)
            for h in ['#','#act-1','#act-2','#act-3']:
                await pg.evaluate("h=>{location.hash=h}",h); await pg.wait_for_timeout(400)
                ow=await pg.evaluate("()=>{const o=[];document.querySelectorAll('.view.on *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>innerWidth+1&&r.width>0&&!e.closest('.tl-track,.chap-art,svg,.wave'))o.push(e.tagName+'.'+e.className+' '+Math.round(r.right))});return [document.documentElement.scrollWidth,innerWidth,o.slice(0,6)]}")
                print(tag,h,'overflow:',ow)
            print(tag,'errors:',errs[:10])
            await ctx.close()
        await b.close()
if __name__=="__main__": asyncio.run(main())
