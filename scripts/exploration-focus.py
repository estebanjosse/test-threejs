import os,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CRYSTAL_CHROMIUM','/opt/hermes/.playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 c=b.new_context(viewport={'width':640,'height':360})
 for name,port in [('test-threejs',4321),('test-Babylonjs',4322)]:
  page=c.new_page();page.goto(f'http://127.0.0.1:{port}/?exploration=1');page.wait_for_function('typeof crystalObservation === "function"')
  page.locator('#startButton').click()
  page.evaluate("window.focusEvents=[];window.addEventListener('blur',e=>focusEvents.push({type:e.type,trusted:e.isTrusted,time:performance.now()}));window.addEventListener('focus',e=>focusEvents.push({type:e.type,trusted:e.isTrusted,time:performance.now()}))")
  page.keyboard.down('w');before=page.evaluate('crystalObservation()')
  blank=c.new_page();blank.goto('about:blank');blank.bring_to_front();time.sleep(2)
  unfocused=page.evaluate('({focus:document.hasFocus(),events:focusEvents,state:crystalObservation()})')
  page.bring_to_front();after=page.evaluate('({focus:document.hasFocus(),events:focusEvents,state:crystalObservation()})');page.keyboard.up('w')
  dest=ROOT.parent/name/'docs/evidence/followup/focus-real-local.json';dest.write_text(json.dumps({'before':before,'unfocused':unfocused,'after':after},indent=2))
  print(name,unfocused['focus'],unfocused['events'],unfocused['state']['keys'],flush=True)
  blank.close();page.close()
 b.close()
