"""Fallback real Chromium runner; one isolated context, no shared tabs.
Usage: /path/to/venv/bin/python scripts/exploration-local.py [performance|play]
Requires playwright and Chromium executable (env CRYSTAL_CHROMIUM).
"""
import os,sys,time,json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
exec((ROOT/'scripts/exploration-browser.py').read_text())
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CRYSTAL_CHROMIUM','/opt/hermes/.playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
    context=browser.new_context(viewport={'width':640,'height':360},device_scale_factor=1)
    page=context.new_page();session=context.new_cdp_session(page);browser_session=browser.new_browser_cdp_session()
    console_messages=[];request_failures=[]
    page.on('console',lambda m:console_messages.append({'type':m.type,'text':m.text}))
    page.on('requestfailed',lambda req:request_failures.append({'url':req.url,'failure':req.failure}))
    def cdp(method,**kwargs):
        kwargs.pop('_response_timeout',None)
        return (browser_session if method.startswith('Browser.') else session).send(method,kwargs)
    def goto_url(url):page.goto(url,wait_until='load',timeout=120000)
    def wait_for_load():page.wait_for_function('typeof crystalObservation === "function"',timeout=120000)
    def capture_screenshot():
        path=str(OUT/'capture.png');page.screenshot(path=path,timeout=120000);return path
    for name,port in [('test-threejs',4321),('test-Babylonjs',4322)]:
        output=str(ROOT.parent/name/'docs/evidence/followup');url=f'http://127.0.0.1:{port}/?exploration=1'
        if sys.argv[1]=='performance':
            d=measure(url,output);print(name,'performance',[(len(x['rafIntervals']),x['navigation']['loadEventEnd']) for x in d['runs']],flush=True)
        else:
            OUT=Path(output)
            goto_url(url);wait_for_load();page.locator('#startButton').click();initial=evaluate('crystalObservation()')
            key('KeyS',True);time.sleep(12);key('KeyS',False)
            a=evaluate('crystalObservation()');time.sleep(4);key('KeyS',True);time.sleep(5);key('KeyS',False);b=evaluate('crystalObservation()')
            checks={'initial':initial,'boundaryBefore':a,'boundaryAfter':b,'boundaryStable':abs(a['z']-b['z'])<0.001,'timer':page.locator('#timer').text_content()};screenshot('boundary')
            key('KeyW',True);evaluate("window.dispatchEvent(new Event('blur'))")
            checks['syntheticBlur']=evaluate('crystalObservation()');key('KeyW',False)
            evaluate("document.querySelector('.brand').click()")
            checks['brandReset']=evaluate('crystalObservation()');save('basic-play.json',checks)
            play(url,output,'victory',900)
            evaluate("document.querySelector('#restartButton').click()")
            save('restart-after-victory.json',evaluate('crystalObservation()'))
            play(url,output,'loss',300)
            evaluate("document.querySelector('#restartButton').click()")
            save('restart-after-loss.json',evaluate('crystalObservation()'));screenshot('restart')
    for name in ('test-threejs','test-Babylonjs'):
        dest=ROOT.parent/name/'docs/evidence/followup'
        (dest/(sys.argv[1]+'-console.json')).write_text(json.dumps({'console':console_messages,'requestFailures':request_failures},indent=2))
    browser.close()
