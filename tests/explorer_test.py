"""Explorer New File / New Folder and the Search panel, in the hidden test Workbench.

    py tests/explorer_test.py

Needs an open notebook (py tests/connect.py) and the plugin server from this repo (tests/testenv.ps1 start). Works in
a new temporary folder, puts the Explorer back on the folder it had and deletes the temporary folder at the end.
Exit code 0 when every check passes.
"""
import json
import os
import shutil
import tempfile
import time

from wbtest import Page

p = Page(timeout=60)
bad = []
CTRL, SHIFT = 2, 8


def check(name, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + name + (f"  ({detail})" if detail and not ok else ""))
    if not ok:
        bad.append(name)


def until(js, seconds=8):
    end = time.time() + seconds
    while time.time() < end:
        p.tick(1, 150)
        v = p.js(js)
        if v:
            return v
    return p.js(js)


def enter():
    p.key("Enter", "Enter", 13, "\r")


def escape():
    p.key("Escape", "Escape", 27)


TO_NOTEBOOK = """(async () => { let dm = null, ws = null; for (const r of [...document.querySelectorAll('*')].filter(e => e.__k)) { const w = v => { if (!v) return; const c = v.__c;
  if (c && typeof c.handleSelectDocument === 'function' && typeof c.openSupportedFile === 'function') dm = dm || c;
  if (c && c.props && c.props.savedState && Array.isArray(c.props.savedState.documentStates)) ws = ws || c; (v.__k || []).forEach(w); }; w(r.__k); }
  const s = ws && ws.props.savedState.documentStates.find(x => x.document && x.document.type === 4);
  if (dm && s) await dm.handleSelectDocument({ documentId: s.document.id, pageId: ws.props.id }); return !!s; })()"""
TABS = """(p => { for (const r of [...document.querySelectorAll('*')].filter(e => e.__k)) { let n = -1; const w = v => { if (!v || n >= 0) return; const c = v.__c;
  if (c && c.props && c.props.savedState && Array.isArray(c.props.savedState.documentStates)) { n = c.props.savedState.documentStates.filter(x => (x.fileName || '').toLowerCase() === p.toLowerCase()).length; return; } (v.__k || []).forEach(w); }; w(r.__k); if (n >= 0) return n; } return -1; })"""

# close (without asking) every tab whose file is under a folder: the files are deleted after the test
CLOSE_UNDER = """(async dir => { dir = dir.toLowerCase(); let dm = null, ws = null; for (const r of [...document.querySelectorAll('*')].filter(e => e.__k)) { const w = v => { if (!v) return; const c = v.__c;
  if (c && typeof c.closeConnectionDocument === 'function' && typeof c.findConnectionDocumentLocation === 'function') dm = dm || c;
  if (c && c.props && c.props.savedState && Array.isArray(c.props.savedState.documentStates)) ws = ws || c; (v.__k || []).forEach(w); }; w(r.__k); }
  if (!dm || !ws) return 0; const ids = ws.props.savedState.documentStates.filter(x => (x.fileName || '').toLowerCase().startsWith(dir)).map(x => x.document.id);
  for (const id of ids) { const at = dm.findConnectionDocumentLocation(id); if (at) await dm.closeConnectionDocument(at, false); } return ids.length; })"""


def click(sel):
    c = p.wait_for(sel, 6)
    if c:
        p.click(*c)
    return bool(c)


p.js(TO_NOTEBOOK)
time.sleep(0.5)
if not p.use_notebook():
    raise SystemExit("No notebook is open. Run: py tests/connect.py")

# load this repo's plugin file again (as Workbench does on start), then show the Explorer on a new temporary folder
p.js("""new Promise(r => { const s = document.createElement('script'); s.src = '/kgptalkie/kgptalkie-plugin.js?' + Date.now();
  s.onload = s.onerror = () => r(1); document.head.appendChild(s); })""")
p.tick(6, 200)
p.use_notebook()
old = p.js("localStorage.getItem('kgptalkieFolder')")
old_panel = p.js("localStorage.getItem('kgptalkiePanel')")
tmp = tempfile.mkdtemp(prefix="kgptalkie-explorer-")
os.makedirs(os.path.join(tmp, "old"))
try:
    p.js(f"window.kgptalkieOnFolder({json.dumps(tmp)}); 1")
    if not p.js("document.body.classList.contains('kgptalkieP-explorer')"):
        p.js("(() => { const b = document.querySelector('.kgptalkieAct button[data-p=explorer]'); b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); return 1 })()")
    until("document.querySelector('.kgptalkieExp .kgptalkieDir')")

    # 1. New File with a subfolder in the name: both are made, the folder opens, the file is selected
    check("1. New File and New Folder buttons in the Explorer bar",
          p.js("!!document.querySelector('.kgptalkieExp button[data-a=newfile] .codicon-new-file') && !!document.querySelector('.kgptalkieExp button[data-a=newfolder] .codicon-new-folder')"))
    click("document.querySelector('.kgptalkieExp button[data-a=newfile]')")
    check("1. a name box opens and has the focus", bool(until("document.activeElement && document.activeElement.classList.contains('kgptalkieNewIn')")))
    p.type("queries/report.sql")
    check("1. the file icon follows the name", p.js("!!document.querySelector('.kgptalkieNew .codicon-database')"))
    enter()
    f1 = os.path.join(tmp, "queries", "report.sql")
    end = time.time() + 6
    while time.time() < end and not os.path.isfile(f1):
        time.sleep(0.2)
    check("1. queries\\report.sql made on disk", os.path.isfile(f1))
    check("1. the tree shows it, selected", bool(until("(() => { const s = document.querySelector('.kgptalkieExp .kgptalkieSel'); return !!s && /report\\.sql/.test(s.textContent) && !document.querySelector('.kgptalkieNewIn'); })()")))
    check("1. Workbench opened it", bool(until("[...document.querySelectorAll('*')].some(e => e.children.length === 0 && /^report\\.sql$/.test((e.textContent || '').trim()) && !e.closest('.kgptalkieExp,.kgptalkieSrch'))", 10)))

    # 2. New Folder goes into the selected file's folder
    click("document.querySelector('.kgptalkieExp button[data-a=newfolder]')")
    until("document.activeElement && document.activeElement.classList.contains('kgptalkieNewIn')")
    p.type("data")
    enter()
    d2 = os.path.join(tmp, "queries", "data")
    end = time.time() + 6
    while time.time() < end and not os.path.isdir(d2):
        time.sleep(0.2)
    check("2. New Folder made queries\\data (next to the selected file)", os.path.isdir(d2))

    # 3. a name that exists or is not allowed: a message under the box, nothing made; Escape cancels
    p.js("(() => { const r = [...document.querySelectorAll('.kgptalkieExp .kgptalkieRoot')][0]; r.click(); return 1 })()")
    p.js("(() => { const r = [...document.querySelectorAll('.kgptalkieExp .kgptalkieRoot')][0]; r.click(); return 1 })()")   # close and open again: root selected
    click("document.querySelector('.kgptalkieExp button[data-a=newfile]')")
    until("document.activeElement && document.activeElement.classList.contains('kgptalkieNewIn')")
    p.type("old")
    msg = until("(() => { const e = document.querySelector('.kgptalkieNewErr.on'); return e ? e.textContent : ''; })()", 3)
    check("3. existing name: message shown as you type", "already exists" in (msg or ""), msg)
    enter()
    time.sleep(0.5)
    check("3. Enter does not make it", os.path.isdir(os.path.join(tmp, "old")) and not os.path.isfile(os.path.join(tmp, "old")) and p.js("!!document.querySelector('.kgptalkieNewIn')"))
    for _ in range(3):
        p.key("Backspace", "Backspace", 8)
    p.type("a?b.sql")
    msg = p.js("(() => { const e = document.querySelector('.kgptalkieNewErr.on'); return e ? e.textContent : ''; })()")
    check("3. bad character: message shown", "not valid" in (msg or ""), msg)
    escape()
    time.sleep(0.3)
    check("3. Escape closes the box", p.js("!document.querySelector('.kgptalkieNewIn')"))
    check("3. the tree did not change", sorted(os.listdir(tmp)) == ["old", "queries"], json.dumps(os.listdir(tmp)))

    # 4. Search: Ctrl+Shift+F, results grouped by file, a line opens the file there
    f2 = os.path.join(tmp, "queries", "q2.sql")       # not open in Workbench yet
    with open(f2, "w", encoding="utf-8") as f:
        f.write("-- report\nSELECT name\nFROM customers\nWHERE id = 42;\n")
    with open(os.path.join(tmp, "old", "notes.md"), "w", encoding="utf-8") as f:
        f.write("Customers list\nnothing else\n")
    with open(os.path.join(tmp, "customers.csv"), "w", encoding="utf-8") as f:
        f.write("id,name\n")
    p.js("document.querySelector('.kgptalkieExp .kgptalkieRoot').click(); 1")
    p.key("F", "KeyF", 70, None, CTRL | SHIFT)
    check("4. Ctrl+Shift+F opens Search", bool(until("document.body.classList.contains('kgptalkieP-search') && document.activeElement && document.activeElement.classList.contains('kgptalkieSrchIn')")))
    p.type("customers")
    msg = until("(() => { const m = document.querySelector('.kgptalkieSrchMsg').textContent; return /result/.test(m) ? m : ''; })()", 8)
    check("4. 3 results in 3 files (two lines and one file name)", msg == "3 results in 3 files", msg)
    files = p.js("[...document.querySelectorAll('.kgptalkieSFile .kgptalkieNm')].map(e => e.textContent)")
    check("4. grouped by file", files == ["customers.csv", "notes.md", "q2.sql"], json.dumps(files))
    check("4. matches highlighted", p.js("document.querySelectorAll('.kgptalkieSrch .kgptalkieHit').length") == 3)
    SEL = "(() => { for (const r of [...document.querySelectorAll('*')].filter(e => e.__k)) { let f = null; const w = v => { if (!v || f) return; const c = v.__c; if (c && c.editor && c.editor.getSelection && c.editor.hasTextFocus && c.editor.hasTextFocus()) { f = c.editor; return; } (v.__k || []).forEach(w); }; w(r.__k); if (f) { const s = f.getSelection(); return s.startLineNumber + ':' + s.startColumn + '-' + s.endColumn; } } return ''; })()"
    click("[...document.querySelectorAll('.kgptalkieSLine')].find(e => /FROM/.test(e.textContent))")
    time.sleep(1.5)
    sel = until(f"(() => {{ const s = {SEL}; return s === '3:6-15' ? s : ''; }})()", 8) or p.js(SEL)
    check("4. clicking a line opens the file at it, match selected", sel == "3:6-15", sel)
    p.js(TO_NOTEBOOK)
    time.sleep(0.8)
    click("[...document.querySelectorAll('.kgptalkieSLine')].find(e => /FROM/.test(e.textContent))")
    time.sleep(1.5)
    sel = until(f"(() => {{ const s = {SEL}; return s === '3:6-15' ? s : ''; }})()", 8) or p.js(SEL)
    check("4. clicking it again goes back to the same tab, at the line", sel == "3:6-15", sel)
    n = p.js(TABS + "(" + json.dumps(f2) + ")")
    check("4. the file is open in one tab only", n == 1, n)

    # 5. Match Case and Whole Word
    p.js("document.querySelector('.kgptalkieSrch button[data-a=case]').click(); 1")
    msg = until("(() => { const m = document.querySelector('.kgptalkieSrchMsg').textContent; return /result/.test(m) && !/Searching/.test(m) ? m : ''; })()", 8)
    check("5. Match Case: 2 results in 2 files", msg == "2 results in 2 files", msg)
    p.js("document.querySelector('.kgptalkieSrch button[data-a=case]').click(); document.querySelector('.kgptalkieSrch button[data-a=word]').click(); 1")
    p.js("(() => { const i = document.querySelector('.kgptalkieSrchIn'); i.value = 'custom'; i.dispatchEvent(new Event('input', { bubbles: true })); return 1 })()")
    msg = until("(() => { const m = document.querySelector('.kgptalkieSrchMsg').textContent; return /No results/.test(m) ? m : ''; })()", 8)
    check("5. Whole Word: 'custom' finds nothing", bool(msg), p.js("document.querySelector('.kgptalkieSrchMsg').textContent"))
    p.js("document.querySelector('.kgptalkieSrch button[data-a=word]').click(); document.querySelector('.kgptalkieSrch button[data-a=clear]').click(); 1")
    check("5. Clear empties the results", bool(until("!document.querySelector('.kgptalkieSFile')", 4)))
finally:
    # back as it was
    p.js("(() => { document.querySelectorAll('.kgptalkieSrch button.on').forEach(b => b.click()); return 1 })()")
    if old:
        p.js(f"window.kgptalkieOnFolder({json.dumps(old)}); 1")
    else:
        p.js("localStorage.removeItem('kgptalkieFolder'); 1")
    if old_panel and old_panel != "search":
        p.js(f"(() => {{ const b = document.querySelector('.kgptalkieAct button[data-p={old_panel}]'); if (b) b.dispatchEvent(new MouseEvent('mousedown', {{ bubbles: true, button: 0 }})); return 1 }})()")
    p.js(CLOSE_UNDER + "(" + json.dumps(tmp) + ")")
    shutil.rmtree(tmp, ignore_errors=True)
    p.js(TO_NOTEBOOK)

print("plugin error:", json.dumps(p.js("window.kgptalkieErr || null")))
print("PASS" if not bad else f"{len(bad)} FAILED: " + ", ".join(bad))
raise SystemExit(1 if bad else 0)
