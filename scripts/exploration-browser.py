# Run through browser_exec in session crystal-followup after new_tab().
# No state setters: observation, DOM clicks, browser keyboard events only.
import json,time,shutil
from pathlib import Path

def evaluate(expression):
    result=cdp('Runtime.evaluate',expression=expression,returnByValue=True,_response_timeout=120)
    if 'exceptionDetails' in result: raise RuntimeError(result['exceptionDetails'])
    return result['result'].get('value')

def key(code,down):
    cdp('Input.dispatchKeyEvent',type='keyDown' if down else 'keyUp',code=code,key={'KeyW':'w','KeyS':'s','KeyA':'a','KeyD':'d'}[code],_response_timeout=120)

def save(name,data):
    (OUT/name).write_text(json.dumps(data,indent=2))

def screenshot(name):
    path=capture_screenshot();shutil.copy(path,OUT/(name+'.png'))


def measure(url, output):
    global OUT
    OUT=Path(output);OUT.mkdir(parents=True,exist_ok=True)
    data={'browser':cdp('Browser.getVersion'),'protocol':{'viewport':[640,360],'dpr':1,'repeats':3,'idle_sample_wall_seconds':20,'warmup_seconds':5,'cache':'disabled','server':'Vite production preview HTTP loopback; encoded/decoded sizes observed, not inferred from gzip files','scene':'intro idle'},'runs':[]}
    cdp('Network.enable');cdp('Network.setCacheDisabled',cacheDisabled=True)
    cdp('Emulation.setDeviceMetricsOverride',width=640,height=360,deviceScaleFactor=1,mobile=False)
    for i in range(3):
        goto_url(url);wait_for_load();time.sleep(5)
        evaluate('window.errors=[];window.addEventListener("error",e=>errors.push(String(e.message)));window.addEventListener("unhandledrejection",e=>errors.push(String(e.reason)));window.samples=[];window.previous=null;window.stopProbe=false;function probe(t){if(window.previous!==null) samples.push(t-previous);previous=t;if(!stopProbe)requestAnimationFrame(probe)}requestAnimationFrame(probe);')
        start=time.monotonic();time.sleep(20)
        row=evaluate('(()=>{stopProbe=true; const gl=document.querySelector("canvas").getContext("webgl2"),ext=gl.getExtension("WEBGL_debug_renderer_info");return {rafIntervals:samples,navigation:performance.getEntriesByType("navigation")[0].toJSON(),resources:performance.getEntriesByType("resource").map(e=>e.toJSON()),gpu:ext&&gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),errors,ready:typeof crystalObservation==="function",visibility:document.visibilityState,focus:document.hasFocus()}})()')
        row['sampleWallSeconds']=time.monotonic()-start;data['runs'].append(row);save('performance.json',data)
    screenshot('intro');return data

CONTROLLER = r"""(()=>{
 const route=ROUTE;window.playlog=[];window.runDone=false;window.runStop=false;
 let index=0,held=null,lastEnergy=3,frames=0;
 function release(){if(held)window.dispatchEvent(new KeyboardEvent('keyup',{code:held}));held=null;}
 function tick(){
  const s=crystalObservation();frames++;
  if(frames%10===0 || s.energy!==lastEnergy)playlog.push({wall:performance.now(),frame:frames,index,state:s});
  if(runStop || s.ended){release();runDone=true;playlog.push({final:true,state:s,result:document.querySelector('#resultTitle').textContent});return;}
  if(s.energy!==lastEnergy){lastEnergy=s.energy;index=0;}
  let target;
  if(MODE==='loss'){
    if(s.z>1.3)target=[0,1];else target=[s.sentinels[1].x,1];
  }else target=route[index];
  if(!target){release();runDone=true;playlog.push({routeComplete:true,state:s});return;}
  let code=null;
  if(Math.abs(target[0]-s.x)>0.13)code=target[0]>s.x?'KeyD':'KeyA';
  else if(Math.abs(target[1]-s.z)>0.13)code=target[1]>s.z?'KeyS':'KeyW';
  else {index++;release();requestAnimationFrame(tick);return;}
  if(code!==held){release();held=code;window.dispatchEvent(new KeyboardEvent('keydown',{code}));}
  requestAnimationFrame(tick);
 }
 requestAnimationFrame(tick);
})()"""
ROUTE=[[-8,9.5],[-8,7],[-10.5,7],[-10.5,-7],[-9,-7],[-10.5,-7],[-10.5,-10.5],[8,-10.5],[8,-8],[10.5,-8],[10.5,7],[8,7],[8,9.5],[0,9.5],[0,3],[-2.2,3],[-2.2,-5.5],[-10.5,-5.5],[-10.5,-10.3],[0,-10.3]]

def play(url,output,mode,budget=900):
    global OUT
    OUT=Path(output);goto_url(url);wait_for_load()
    evaluate("window.errors=[];window.addEventListener('error',e=>errors.push(String(e.message)));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));document.querySelector('#startButton').click();")
    initial=evaluate('crystalObservation()');save(mode+'-initial.json',initial)
    evaluate(CONTROLLER.replace('ROUTE',json.dumps(ROUTE)).replace('MODE',json.dumps(mode)))
    start=time.monotonic()
    while time.monotonic()-start<budget:
        time.sleep(15)
        result=evaluate('({done:runDone,log:playlog,state:crystalObservation(),errors})')
        result['wallSeconds']=time.monotonic()-start;save(mode+'-play.json',result)
        if result['done']: break
    evaluate('window.runStop=true');time.sleep(2)
    screenshot(mode+'-final')
    print(mode,{k:result['state'][k] for k in ['x','z','elapsed','collected','energy','ended']},result['wallSeconds'],result['done'])
    return result
