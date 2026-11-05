"""README screenshots from the test Workbench, light theme, 1440 x 900 CSS px at scale 1.5, into docs/images/.

    py tests/run.py screenshot-setup       (empties the notebook, adds the sample notebook and runs it)
    py tests/screenshots.py

A hidden window only paints after a device-metrics override, which this script sets and clears again.
"""
import base64
import json
import os
import shutil
import tempfile

import websocket

from wbtest import REPO, Page

OUT = os.path.join(REPO, "docs", "images")
DEMO = {    # the folder shown in the Explorer and Search shots
    "README.md": "# Sales analytics\n\nMonthly revenue and product reports for the demo shop.\n",
    "data/sales.csv": "month,region,revenue,orders\n2026-01-01,North,1200,10\n2026-02-01,North,1500,12\n",
    "notebooks/q4-review.mysql-notebook": "",
    "queries/monthly_revenue.sql": "SELECT month, SUM(revenue) AS revenue\nFROM sales\nGROUP BY month\nORDER BY month;\n",
    "queries/revenue_by_region.sql": "SELECT region, SUM(revenue) AS revenue, SUM(orders) AS orders\nFROM sales\nGROUP BY region\nORDER BY revenue DESC;\n",
    "queries/top_products.sql": "SELECT name, category, price\nFROM products\nORDER BY price DESC\nLIMIT 10;\n",
    "schema/create_tables.sql": "CREATE TABLE sales (\n  month   DATE,\n  region  VARCHAR(20),\n  revenue DECIMAL(12, 2),\n  orders  INT\n);\n",
}
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
    # 6 Explorer: New File name box, 7 Search panel, on a small demo folder (put back as it was afterwards)
    demo = os.path.join(tempfile.mkdtemp(prefix="kgptalkie-shots-"), "sales-analytics")
    for rel, text in DEMO.items():
        os.makedirs(os.path.dirname(os.path.join(demo, rel)), exist_ok=True)
        with open(os.path.join(demo, rel), "w", encoding="utf-8") as f:
            f.write(text)
    old_folder, old_panel = js("localStorage.getItem('kgptalkieFolder')"), js("localStorage.getItem('kgptalkiePanel')")
    ACT = "document.querySelector('.kgptalkieAct button[data-p={0}]').dispatchEvent(new MouseEvent('mousedown',{{bubbles:true,button:0}}));"
    try:
        js(f"(async()=>{{ const ed={ED}, top=()=>ed.getTopForLineNumber({CELL.format(phrase="ORDER BY price DESC", edge="startLine")}) - 30; ed.setScrollTop(top()); {TICK} ed.setScrollTop(top()); {TICK} return 1 }})()")
        js(f"(async()=>{{ window.kgptalkieOnFolder({json.dumps(demo)}); {TICK} return 1 }})()")
        js(f"(async()=>{{ if (!document.body.classList.contains('kgptalkieP-explorer') || !document.querySelector('.kgptalkieExp').offsetWidth) {{ {ACT.format('explorer')} }} {TICK} return 1 }})()")
        js(f"""(async()=>{{ for (const n of ['queries']) {{ const r = [...document.querySelectorAll('.kgptalkieExp .kgptalkieDir')].find(e => e.textContent.trim() === n); if (r) r.click(); {TICK} }}
          document.querySelector('.kgptalkieExp button[data-a=newfile]').click(); {TICK}
          const i = document.querySelector('.kgptalkieNewIn'); i.value = 'customer_orders.sql'; i.dispatchEvent(new Event('input', {{ bubbles: true }})); {TICK} return 1 }})()""")
        shot("6-explorer-new-file.png")
        js("(async()=>{ const i = document.querySelector('.kgptalkieNewIn'); if (i) i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return 1 })()")
        js(f"""(async()=>{{ {ACT.format('search')} {TICK} const i = document.querySelector('.kgptalkieSrchIn'); i.value = 'revenue'; i.dispatchEvent(new Event('input', {{ bubbles: true }}));
          for (let n = 0; n < 40 && !document.querySelector('.kgptalkieSFile'); n++) await new Promise(r => setTimeout(r, 150)); {TICK} return 1 }})()""")
        shot("7-search.png")
    finally:
        js("(async()=>{ const i = document.querySelector('.kgptalkieSrchIn'); if (i) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); } return 1 })()")
        js(f"window.kgptalkieOnFolder({json.dumps(old_folder)}); 1" if old_folder else "localStorage.removeItem('kgptalkieFolder'); 1")
        js(f"(async()=>{{ {ACT.format(old_panel if old_panel and old_panel != 'search' else 'explorer')} {TICK} if (document.getElementById('pane0Host') && document.getElementById('pane0Host').getBoundingClientRect().width > 40) document.getElementById('desktopWorkspaceSidebarToggle').click(); {TICK} return 1 }})()")
        shutil.rmtree(os.path.dirname(demo), ignore_errors=True)
finally:
    p.call("Emulation.clearDeviceMetricsOverride")
