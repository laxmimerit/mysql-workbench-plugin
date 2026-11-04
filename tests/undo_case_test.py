"""Keyword capitals and undo, with real keystrokes in the test Workbench.

    py tests/undo_case_test.py

Expected: "select " becomes "SELECT ", one Ctrl+Z gives back "select ", typing goes on capitalising, and with the
switch off (Notebook Settings) nothing is changed. The setting is put back afterwards.
"""
import json
import time

from wbtest import CLEAR_LAST, LAST_CELL, Page

p = Page()
if not p.use_notebook():
    raise SystemExit("No notebook is open. Run: py tests/connect.py")


def typ(s):
    p.type(s)
    time.sleep(0.9)


def setting(on):
    p.js("(() => { const s = JSON.parse(localStorage.getItem('kgptalkieSettings') || '{}');"
         + ("delete s.upperKw;" if on else "s.upperKw = false;")
         + "localStorage.setItem('kgptalkieSettings', JSON.stringify(s)); return 1; })()")


out = {}
try:
    p.js(CLEAR_LAST)
    typ("select ")
    out["typed"] = p.js(LAST_CELL)
    p.key("z", "KeyZ", 90, None, 2)
    time.sleep(0.5)
    out["after ctrl+z"] = p.js(LAST_CELL)
    typ("1 from ")
    out["typing on"] = p.js(LAST_CELL)
    setting(False)
    p.js(CLEAR_LAST)
    typ("select 1 from dual where ")
    out["switch off"] = p.js(LAST_CELL)
finally:
    setting(True)
    p.js(CLEAR_LAST)
out["pluginError"] = p.js("window.kgptalkieErr || null")
ok = (out["typed"] == "SELECT " and out["after ctrl+z"] == "select " and out["typing on"].endswith("1 FROM ")
      and out["switch off"] == "select 1 from dual where ")
out["pass"] = ok
print(json.dumps(out, indent=1, ensure_ascii=False))
raise SystemExit(0 if ok else 1)
