"""Open the throwaway "Test MySQL 3310" connection in the test Workbench and a new notebook on it.

    py tests/connect.py

The connection (127.0.0.1:3310, user root, empty password) is made once by hand in the test Workbench; see
tests/README.md. The empty password is confirmed with OK and never saved.
"""
import json
import time

from wbtest import Page

p = Page()
TILE = "[...document.querySelectorAll('.connectionTile')].find(t => t.textContent.includes('Test MySQL 3310'))"
if p.js("!!document.querySelector('.scriptingConsole')") and p.use_notebook():
    print("A notebook is already open; window.kgptalkieTestEd is set.")
    raise SystemExit(0)

tile = p.wait_for(TILE, 15)
if not tile:
    raise SystemExit('No "Test MySQL 3310" connection tile. Add it once by hand (tests/README.md).')
p.click(*tile)
ok = p.wait_for("document.getElementById('ok')", 10)            # password prompt: empty password, OK
if ok:
    p.click(*ok)
no = p.wait_for("[...document.querySelectorAll('div.msg.button, button')].find(e => e.textContent.trim() === 'No')", 6)
if no:                                                          # "Save password?" No
    p.click(*no)
time.sleep(4)

r = p.js("""(async () => {
  let sb = null;
  const walk = (v, d) => { if (!v || d > 40 || sb) return; const c = v.__c; if (c && typeof c.openNewNotebook === 'function') sb = c; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  if (!sb) return 'no sidebar';
  const awc = (sb.props && sb.props.activeWorkspaceConnection) || (sb.state && sb.state.activeWorkspaceConnection);
  if (!awc) return 'not connected';
  if (!document.querySelector('.scriptingConsole')) { sb.openNewNotebook({ connection: awc }); await new Promise(r => setTimeout(r, 2500)); }
  return JSON.stringify({ notebook: !!document.querySelector('.scriptingConsole'), tabs: [...document.querySelectorAll('.tabItem')].map(t => t.textContent.trim().slice(0, 40)) });
})()""")
print(r)
if not p.use_notebook():
    raise SystemExit("No notebook editor found.")
p.tick()
print("window.kgptalkieTestEd is set; plugin error:", json.dumps(p.js("window.kgptalkieErr || null")))
