"""The version guard: when Workbench internals the plugin needs are missing, it must turn itself off cleanly.

    py tests/guard_test.py

Needs an open notebook (py tests/connect.py). Breaks one internal at a time in the hidden test Workbench, checks
that the plugin is gone without a trace and Workbench still runs SQL, then puts everything back and turns the
plugin on again. Exit code 0 when every check passes.
"""
import json
import time

from wbtest import Page

p = Page(timeout=60)
if not p.use_notebook():
    raise SystemExit("No notebook is open. Run: py tests/connect.py")
ED = "window.kgptalkieTestEd"
bad = []


def check(name, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + name + (f"  ({detail})" if detail and not ok else ""))
    if not ok:
        bad.append(name)


def reload_plugin():
    """Load the plugin file again, as Workbench does on start (the new copy tears the old one down first)."""
    p.js("""new Promise(r => { const s = document.createElement('script'); s.src = '/kgptalkie/kgptalkie-plugin.js?' + Date.now();
      s.onload = s.onerror = () => r(1); document.head.appendChild(s); })""")
    p.tick(6, 200)
    p.use_notebook()


def wait_off(seconds=12):
    end = time.time() + seconds
    while time.time() < end:
        p.tick(2, 250)
        if p.js("!!(window.kgptalkieGuard && window.kgptalkieGuard.off())"):
            return True
    return False


# What a clean page looks like after turning off. The note (#kgptalkieOffNote) is the only thing left.
CLEAN = f"""(() => {{ const ed = {ED}, o = ed.getRawOptions(), o0 = ed.kgptalkieOpt0 || {{}};
  const leftover = [...document.querySelectorAll('[class*="kgptalkie"], [id^="kgptalkie"]')].filter(e => e.id !== 'kgptalkieOffNote' && !e.closest('#kgptalkieOffNote')).map(e => e.id || e.className).slice(0, 8);
  const ws = []; const walk = (v, d) => {{ if (!v || d > 90) return; const c = v.__c; if (c && c.sqlQueryExecutor) ws.push(c.sqlQueryExecutor); for (const k of v.__k || []) walk(k, d + 1); }};
  walk(document.getElementById('root').__k, 0);
  const note = document.getElementById('kgptalkieOffNote');
  let flag = null; try {{ flag = JSON.parse(localStorage.getItem('kgptalkieOff')); }} catch (e) {{ }}
  return JSON.stringify({{ leftover, styles: !!(document.getElementById('kgptalkieHideBar') || document.getElementById('kgptalkieDyn')),
    lineNumbers: o.lineNumbers === o0.lineNumbers, lineHeight: o.lineHeight === o0.lineHeight, decoWidth: o.lineDecorationsWidth === o0.lineDecorationsWidth,
    hooked: ws.some(q => q.kgptalkieRun0 || q.kgptalkieHook), loop: !!(window.kgptalkieLook || window.kgptalkieRaf),
    note: note ? note.textContent : '', flag }}); }})()"""


def check_clean(label, reason_has):
    r = json.loads(p.js(CLEAN))
    check(f"{label}: nothing of the plugin left on the page", not r["leftover"] and not r["styles"], json.dumps(r["leftover"]))
    check(f"{label}: editor options back to Workbench's own", r["lineNumbers"] and r["lineHeight"] and r["decoWidth"])
    check(f"{label}: SQL runner unhooked, loop stopped", not r["hooked"] and not r["loop"])
    check(f"{label}: note shown, no em dash", "is turned off" in r["note"] and chr(0x2014) not in r["note"], r["note"][:120])
    check(f"{label}: off flag stored with the reason", bool(r["flag"]) and reason_has in r["flag"].get("reason", ""), json.dumps(r["flag"]))
    return r


def runs_plain_sql():
    """Workbench's own Run on its own: put SELECT 6*7 in the notebook and run it the way Workbench's button does."""
    p.js(f"""(async () => {{ const ed = {ED}, m = ed.getModel(), ce = ed.kgptalkieCE; await ce.removeAllResults();
      ed.executeEdits('t', [{{ range: m.getFullModelRange(), text: 'SELECT 6*7 AS answer' }}]); ed.setPosition({{ lineNumber: 1, column: 1 }});
      await ce.executeSelectedOrAll({{ advance: false }}); return 1 }})()""")
    end = time.time() + 15
    while time.time() < end:
        txt = p.js(f"(() => {{ const x = {ED}.getModel().executionContexts.content[0]; const rt = x.presentation && x.presentation.renderTarget; return rt ? rt.textContent : ''; }})()")
        if "42" in (txt or ""):
            return True
        time.sleep(0.5)
    return False


# 0. start on
p.js("window.kgptalkieGuard && window.kgptalkieGuard.reset(); 1")
reload_plugin()
# one SQL cell, whatever an earlier test left (a Markdown first cell would never run SELECT 6*7)
p.js(f"""(async () => {{ const ed = {ED}, A = window.kgptalkieActions, c = () => ed.getModel().executionContexts.content;
  for (let k = 0; k < 60 && c().length > 1; k++) {{ await A.remove(ed, c().length - 1); await new Promise(r => setTimeout(r, 100)); }}
  if (c()[0].language !== 'mysql') await A.setType(ed, 0, 'mysql'); return 1 }})()""")
g = json.loads(p.js("JSON.stringify({ ...window.kgptalkieGuard, off: window.kgptalkieGuard.off() })"))
check("server tells the plugin the Workbench version", bool(g.get("wb")), json.dumps(g))
check(f"Workbench {g.get('wb')} is a tested version", bool(g.get("tested")))
check("plugin is on", not g["off"] and bool(p.js("!!document.querySelector('.kgptalkieNbBar')")))
p.js(f"(async () => {{ await window.kgptalkieActions.clearAll({ED}); const ed = {ED}, m = ed.getModel(); ed.executeEdits('t', [{{ range: m.getFullModelRange(), text: 'SELECT 1' }}]); return 1 }})()")
p.tick(4, 200)

# 1. a notebook editor method is gone (as if a Workbench update renamed it)
p.js(f"window.kgptalkieSaved = {ED}.kgptalkieCE.updateExecutionContexts; {ED}.kgptalkieCE.updateExecutionContexts = undefined; 1")
check("1. turns off when the notebook editor changed", wait_off())
check_clean("1", "updateExecutionContexts")
p.js(f"delete {ED}.kgptalkieCE.updateExecutionContexts; if ({ED}.kgptalkieCE.updateExecutionContexts !== window.kgptalkieSaved) {ED}.kgptalkieCE.updateExecutionContexts = window.kgptalkieSaved; 1")
check("1. Workbench still runs SQL by itself", runs_plain_sql())

# 2. it stays off on the next start for the same Workbench and plugin, and OK hides the note for good
reload_plugin()
check("2. stays off after a restart", p.js("window.kgptalkieGuard.off() && !document.querySelector('.kgptalkieNbBar')"))
ok = p.center("document.querySelector('#kgptalkieOffNote button')")
if ok:
    p.click(*ok)
time.sleep(0.3)
check("2. OK closes the note", not p.js("!!document.getElementById('kgptalkieOffNote')"))
reload_plugin()
check("2. the note does not come back after OK", not p.js("!!document.getElementById('kgptalkieOffNote')"))

# 3. a different plugin version (or Workbench version) tries again
p.js("(() => { const f = JSON.parse(localStorage.getItem('kgptalkieOff')); f.plugin = '0.0'; localStorage.setItem('kgptalkieOff', JSON.stringify(f)); return 1 })()")
reload_plugin()
check("3. another version turns the plugin on again", p.js("!window.kgptalkieGuard.off() && !!document.querySelector('.kgptalkieNbBar')"))

# 4. the SQL runner changed (executeQuery gone)
p.js("""(() => { const walk = (v, d) => { if (!v || d > 90) return; const c = v.__c; if (c && c.sqlQueryExecutor) { const q = c.sqlQueryExecutor;
  (window.kgptalkieQs = window.kgptalkieQs || []).push([q, q.kgptalkieExec0 || q.executeQuery]); } for (const k of v.__k || []) walk(k, d + 1); };
  window.kgptalkieQs = []; walk(document.getElementById('root').__k, 0); window.kgptalkieTeardown();
  window.kgptalkieQs.forEach(([q]) => { q.executeQuery = undefined; }); return window.kgptalkieQs.length; })()""")
reload_plugin()
check("4. turns off when the SQL runner changed", wait_off())
check_clean("4", "executeQuery")
p.js("window.kgptalkieQs.forEach(([q, f]) => { q.executeQuery = f; }); delete window.kgptalkieQs; 1")
check("4. Workbench still runs SQL by itself", runs_plain_sql())

# 5. back on, as it was
p.js("window.kgptalkieGuard.reset(); delete window.kgptalkieSaved; 1")
reload_plugin()
check("5. on again after reset", p.js("!window.kgptalkieGuard.off() && !!document.querySelector('.kgptalkieNbBar') && !document.getElementById('kgptalkieOffNote')"))
p.js(f"(async () => {{ const ed = {ED}, ce = ed.kgptalkieCE; await ce.removeAllResults(); const m = ed.getModel(); ed.executeEdits('t', [{{ range: m.getFullModelRange(), text: '' }}]); return 1 }})()")
print("plugin error:", json.dumps(p.js("window.kgptalkieErr || null")))
print("PASS" if not bad else f"{len(bad)} FAILED: " + ", ".join(bad))
raise SystemExit(1 if bad else 0)
