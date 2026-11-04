"""Shared helpers for the tests: drive the hidden test Workbench over the Chrome DevTools Protocol.

The test Workbench runs with its own profile (test-profile/) and debug port 9230; tests/testenv.ps1 starts it.
Port 9229 is the everyday Workbench and is refused here on purpose.
Needs: py -m pip install requests websocket-client
"""
import json
import os
import sys
import time

import requests
import websocket

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS = os.path.join(REPO, "tests")
PORT = int(os.environ.get("KGPTALKIE_CDP_PORT", "9230"))
if PORT == 9229:
    raise SystemExit("Port 9229 is the everyday Workbench. Tests only drive the hidden test Workbench (port 9230).")

sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")

# The visible notebook editor (Monaco) of the active notebook tab.
FIND_NB = """(() => { const eds = []; const walk = (v, d) => { if (!v || d > 60) return; const c = v.__c;
  if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) eds.push(c.editor);
  for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0); return eds.find(e => e.getDomNode().offsetWidth) || eds[eds.length - 1] || null; })()"""

# Text of the last cell of window.kgptalkieTestEd.
LAST_CELL = """(() => { const ed = window.kgptalkieTestEd, m = ed.getModel(), cs = m.executionContexts.content, x = cs[cs.length-1];
  return m.getValueInRange({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }); })()"""

# Empty the last cell and put the caret in it.
CLEAR_LAST = """(() => { const ed = window.kgptalkieTestEd, m = ed.getModel(), cs = m.executionContexts.content, x = cs[cs.length-1];
  ed.executeEdits('t', [{ range: { startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }, text: '' }]);
  ed.setPosition({ lineNumber: x.startLine, column: 1 }); ed.focus(); ed.pushUndoStop(); return 1; })()"""


class Page:
    """One CDP session on the test Workbench's page."""

    def __init__(self, timeout=60):
        try:
            targets = requests.get(f"http://127.0.0.1:{PORT}/json", timeout=5).json()
        except requests.RequestException:
            raise SystemExit(f"No test Workbench on port {PORT}. Start it: powershell -File tests/testenv.ps1 start")
        pages = [t for t in targets if t["type"] == "page"]
        if not pages:
            raise SystemExit("The test Workbench has no page yet.")
        self.url = pages[0]["webSocketDebuggerUrl"]
        self.timeout = timeout
        self.ws = websocket.create_connection(self.url, suppress_origin=True, timeout=timeout)
        self.n = 0

    def reconnect(self):
        self.ws = websocket.create_connection(self.url, suppress_origin=True, timeout=self.timeout)

    def call(self, method, **params):
        self.n += 1
        my = self.n
        self.ws.send(json.dumps({"id": my, "method": method, "params": params}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("id") == my:
                return m

    def js(self, src):
        """Evaluate an expression (promises are awaited) and return its value. Raises on a page exception."""
        r = self.call("Runtime.evaluate", expression=src, returnByValue=True, awaitPromise=True)["result"]
        if "exceptionDetails" in r:
            raise RuntimeError("JS error: " + json.dumps(r["exceptionDetails"])[:800])
        return r["result"].get("value")

    def tick(self, n=4, ms=250):
        """The hidden window gets no animation frames, so the plugin's loop is stepped by hand."""
        self.js(f"(async()=>{{ for (let n=0;n<{n};n++){{ await new Promise(r=>setTimeout(r,{ms})); window.kgptalkieTick && window.kgptalkieTick(); }} return 1 }})()")

    def use_notebook(self):
        """window.kgptalkieTestEd = the visible notebook editor. False when no notebook is open."""
        return bool(self.js(f"(() => {{ const ed = {FIND_NB}; window.kgptalkieTestEd = ed; return !!ed; }})()"))

    def key(self, k, code="", vk=0, text=None, mods=0):
        d = dict(key=k, code=code, windowsVirtualKeyCode=vk, modifiers=mods)
        self.call("Input.dispatchKeyEvent", type="keyDown" if text else "rawKeyDown", **({**d, "text": text} if text else d))
        self.call("Input.dispatchKeyEvent", type="keyUp", **d)

    def type(self, s, delay=0.03):
        """Real key events, one per character, so the plugin's typing hooks see them."""
        for ch in s:
            if ch == "\n":
                self.js("window.kgptalkieTestEd.trigger('t', 'hideSuggestWidget', {})")
                self.key("Enter", "Enter", 13, "\r")
            else:
                self.key(ch, "", ord(ch.upper()) if ch.isalnum() else (32 if ch == " " else 0), ch)
            time.sleep(delay)

    def click(self, x, y):
        self.call("Input.dispatchMouseEvent", type="mouseMoved", x=x, y=y)
        self.call("Input.dispatchMouseEvent", type="mousePressed", x=x, y=y, button="left", clickCount=1)
        self.call("Input.dispatchMouseEvent", type="mouseReleased", x=x, y=y, button="left", clickCount=1)

    def center(self, js_element):
        """[x, y] of an element's centre, or None. js_element is an expression giving the element (or null)."""
        return self.js(f"(() => {{ const e = {js_element}; if (!e) return null; const b = e.getBoundingClientRect();"
                       " return b.width ? [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)] : null; })()")

    def wait_for(self, js_element, seconds=10):
        end = time.time() + seconds
        while time.time() < end:
            c = self.center(js_element)
            if c:
                return c
            time.sleep(0.5)
        return None
