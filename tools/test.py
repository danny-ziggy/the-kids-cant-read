import asyncio,pathlib
from playwright.async_api import async_playwright
from shoot import handle, ROOT
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for vw in (1280,390):
            ctx=await b.new_context(viewport={'width':vw,'height':820},permissions=['clipboard-read','clipboard-write'])
            pg=await ctx.new_page();errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.route('**/*',handle)
            await pg.goto('file://'+str((ROOT/'index.html')))
            await pg.wait_for_timeout(400)
            await pg.click('#ttPlay'); await pg.wait_for_timeout(5400)
            note=await pg.text_content('#ttNote'); bq=await pg.evaluate("!!document.querySelector('#ttEmbed blockquote.tiktok-embed[data-video-id=\"7579812040152288567\"]')")
            await pg.click('[data-share=prologue]'); await pg.wait_for_timeout(200)
            clip=await pg.evaluate("navigator.clipboard.readText().catch(e=>'ERR')")
            await pg.click('#skip'); await pg.wait_for_timeout(300)
            for h in ['#act-1','#act-2','#act-3']:
                await pg.evaluate("h=>location.hash=h",h);await pg.wait_for_timeout(300)
                y=await pg.evaluate('scrollY')
                if h=='#act-1':
                    await pg.click('#linePlay');await pg.wait_for_timeout(1800)
                    t=await pg.evaluate("document.getElementById('lineT').value")
                    await pg.click('.yrs [data-y="2019"]'); n=await pg.text_content('#bbNum')
                if h=='#act-3':
                    await pg.click('#fxF [data-f=everyone]'); c=await pg.text_content('#fxCount')
                    await pg.click('#gosSound'); await pg.wait_for_timeout(3300); out=await pg.text_content('#gosOut')
                print(vw,h,'scrollY on open:',y)
            await pg.evaluate("location.hash='prologue'");await pg.wait_for_timeout(300)
            top=await pg.evaluate("Math.round(document.getElementById('chap-prologue').getBoundingClientRect().top)")
            print(vw,'tt blockquote:',bq,'| note:',note[:50],'| clip:',clip,'| line:',t,'| 2019:',n,'| fx:',c,'| gos:',out[:20],'| prologue top:',top,'| errors:',errs)
            await ctx.close()
        await b.close()
asyncio.run(main())
