"""Render og.png (1200x630), the link-preview image, from the built page."""
import asyncio,pathlib,sys
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from shoot import handle, ROOT
from playwright.async_api import async_playwright
JS='''()=>{document.querySelectorAll('main section,main .drawer-band,main nav').forEach(e=>{if(e.id!=='top')e.style.display='none'});document.querySelector('.topbar').style.display='none';document.querySelector('.ribbon').style.display='none';
 document.querySelector('main').style.paddingTop='0';
 const st=document.querySelector('.open .stage');st.style.cssText='position:fixed;z-index:30;inset:0;height:630px;top:0;display:grid;place-items:center;padding:0 0 150px;background:#fff';
 const t=document.getElementById('gTitle');t.style.setProperty('--cw','62px');t.style.maxWidth='none';
 const cells=[...t.querySelectorAll('.cell')];cells.forEach((c,i)=>{if([0,1,2,5,6,9,10,13,14].includes(i))c.click()});
 document.querySelector('.open .tail').style.display='none';
 const b=document.createElement('div');b.style.cssText="position:fixed;z-index:40;left:0;right:0;bottom:0;height:150px;background:#FFD000;display:flex;align-items:center;padding:0 64px;font:900 96px/1 'Archivo';font-stretch:112%;letter-spacing:-.02em;color:#000";b.textContent="Kids aren't reading.";document.body.appendChild(b);}'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1200,'height':630})
        pg=await ctx.new_page();await pg.route('**/*',handle)
        await pg.goto('file://'+str(ROOT/'index.html'));await pg.wait_for_timeout(1500)
        await pg.evaluate(JS);await pg.wait_for_timeout(1200)
        await pg.screenshot(path=str(ROOT/'og.png'))
        await b.close()
asyncio.run(main())
