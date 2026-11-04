"""README screenshots from the test Workbench, light theme, 1440 x 900 CSS px at scale 1.5, into docs/images/.

    py tests/run.py screenshot-setup       (empties the notebook, adds the sample notebook and runs it)
    py tests/screenshots.py

A hidden window only paints after a device-metrics override, which this script sets and clears again.
"""
import base64
import os

import websocket

from wbtest import REPO, Page

OUT = os.path.join(REPO, "docs", "images")
os.makedirs(OUT, exist_ok=True)
p = Page(timeout=25)
if not p.use_notebook():
    raise SystemExit("No notebook is open. Run: py tests/connect.py")
# Start line (or end line) of the first cell whose text contains a phrase.
CELL = """(() => {{ const ed = window.kgptalkieTestEd, m = ed.getModel(), x = m.executionContexts.content.find(x =>
  m.getValueInRange({{ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }}).includes({phrase!r}));
  return x ? x.{edge} : 1; }})()"""
TICK = "for(let n=0;n<6;n++){await new Promise(r=>setTimeout(r,250)); window.kgptalkieTick();}"
ED = "window.kgptalkieTestEd"


def js(src):
    return p.js(src)


def shot(name):
    for _ in range(4):
        js(f"(async()=>{{ document.body.style.outline = document.body.style.outline ? '' : '0px solid transparent'; {TICK} return 1 }})()")
        try:
            d = p.call("Page.captureScreenshot", format="png")["result"]["data"]
            with open(os.path.join(OUT, name), "wb") as f:
                f.write(base64.b64decode(d))
            print("saved", name)
            return
        except websocket.WebSocketTimeoutException:
            print("retry", name)
            p.reconnect()
    print("FAILED", name)


p.call("Emulation.clearDeviceMetricsOverride")
p.call("Emulation.setDeviceMetricsOverride", width=1440, height=900, deviceScaleFactor=1.5, mobile=False)
try:
    js(f"(async()=>{{ window.dispatchEvent(new Event('resize')); {TICK} {ED}.layout(); {TICK} return 1 }})()")
    # 1 results grid
    js(f"(async()=>{{ const ed={ED}, top=()=>ed.getTopForLineNumber({CELL.format(phrase="ORDER BY price DESC", edge="startLine")}) - 30; ed.setScrollTop(top()); {TICK} ed.setScrollTop(top()); {TICK} return 1 }})()")
    shot("1-notebook-results.png")
    # 2 chart
    js(f"(async()=>{{ const ed={ED}, top=()=>ed.getTopForLineNumber({CELL.format(phrase="FROM monthly_revenue", edge="startLine")}) - 30; ed.setScrollTop(top()); {TICK} ed.setScrollTop(top()); {TICK} return 1 }})()")
    shot("2-chart.png")
    # 3 autocomplete after an alias, in the last (empty) cell
    js(f"""(async()=>{{ const ed={ED}, m=ed.getModel(); const cs=m.executionContexts.content, x=cs[cs.length-1];
      ed.executeEdits('t',[{{range:{{startLineNumber:x.startLine,startColumn:1,endLineNumber:x.endLine,endColumn:m.getLineMaxColumn(x.endLine)}},text:'SELECT c.name, c.\\nFROM customers c'}}]);
      {TICK} const y=m.executionContexts.content[m.executionContexts.content.length-1]; ed.setScrollTop(ed.getTopForLineNumber(y.startLine) - 520); ed.setPosition({{lineNumber:y.startLine, column:18}}); ed.focus();
      {TICK} ed.trigger('kgptalkie','editor.action.triggerSuggest',{{}}); {TICK} return 1 }})()""")
    shot("3-autocomplete.png")
    js(f"(async()=>{{ {ED}.getContribution('editor.contrib.suggestController').model.cancel(); return 1 }})()")
    # 4 Notebook Settings, 5 Configure AI
    js(f"(async()=>{{ document.querySelector('.kgptalkieNbBar [data-a=settings]').dispatchEvent(new MouseEvent('mousedown',{{bubbles:true,cancelable:true}})); {TICK} return 1 }})()")
    shot("4-notebook-settings.png")
    js(f"(async()=>{{ document.querySelectorAll('.kgptalkieDlgBack').forEach(e=>e.remove()); document.querySelector('.kgptalkieNbBar [data-a=aicfg]').dispatchEvent(new MouseEvent('mousedown',{{bubbles:true,cancelable:true}})); {TICK} return 1 }})()")
    shot("5-configure-ai.png")
    js("(async()=>{ document.querySelectorAll('.kgptalkieDlgBack').forEach(e=>e.remove()); return 1 })()")
finally:
    p.call("Emulation.clearDeviceMetricsOverride")
