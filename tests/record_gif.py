"""README GIFs from the hidden test Workbench, light theme, into docs/images/.

    py tests/record_gif.py                 list the scenes
    py tests/record_gif.py run typing      record some (or "all")

Each scene starts on a new notebook on the throwaway connection, so start the test environment and connect first
(tests/README.md). A second CDP connection films the page frame by frame while the scene drives it with real mouse
and key events. A drawn pointer shows where each click lands. ffmpeg (on PATH, or set FFMPEG) builds the GIF.

The "ai" scene needs a model in Configure AI. It sets the test server to a local Ollama model (OLLAMA_MODEL,
default qwen3.8:27b) with no API key. Time spent waiting for the model is cut from the GIF.
"""
import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time

import websocket

from wbtest import FIND_NB, REPO, Page

OUT = os.path.join(REPO, "docs", "images")
W, H = 1180, 700              # CSS px of the filmed window
GIF_W = 980                   # width of the GIF
FPS = 12
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.8:27b")

ED = "window.kgptalkieTestEd"
BAR = f"{ED}.getDomNode().closest('.editorHost').parentElement.querySelector(':scope > .kgptalkieNbBar')"

# The drawn pointer: an arrow plus a ring that grows on a click. Moved from Python in small steps, because the
# hidden window runs no CSS transitions between captured frames.
CURSOR = """(() => { let c = document.getElementById('kgptalkieRecCursor'); if (c) return 1;
  c = document.createElement('div'); c.id = 'kgptalkieRecCursor';
  c.style.cssText = 'position:fixed;left:-50px;top:-50px;width:0;height:0;z-index:2147483647;pointer-events:none';
  c.innerHTML = '<div class="ring" style="position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;'
    + 'border:3px solid rgba(242,145,17,.9);background:rgba(242,145,17,.18);opacity:0"></div>'
    + '<svg width="22" height="30" viewBox="0 0 22 30" style="position:absolute;left:-2px;top:-1px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))">'
    + '<path d="M2 2 L2 24 L8 18.5 L12.2 27.5 L16 25.8 L11.9 17 L19.5 17 Z" fill="#111" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  document.body.appendChild(c); return 1; })()"""

# The caption bar at the top of the GIF ("Run All waits for every statement").
CAPTION = """((t) => { let c = document.getElementById('kgptalkieRecCap');
  if (!t) { if (c) c.remove(); return 1; }
  if (!c) { c = document.createElement('div'); c.id = 'kgptalkieRecCap'; document.body.appendChild(c); }
  c.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483646;pointer-events:none;'
    + 'background:rgba(17,24,39,.92);color:#fff;font:600 15px/1.2 "Segoe UI",sans-serif;padding:9px 16px;border-radius:8px;'
    + 'box-shadow:0 4px 14px rgba(0,0,0,.25);white-space:nowrap';
  c.textContent = t; return 1; })"""


# A hidden window paints only when something changes, and its timers are throttled, so the film itself nudges a
# 2 px dot (and steps the plugin's loop) right before each capture.
PULSE = """(() => { let d = document.getElementById('kgptalkieRecPulse');
  if (!d) { d = document.createElement('div'); d.id = 'kgptalkieRecPulse';
    d.style.cssText = 'position:fixed;right:0;bottom:0;width:2px;height:2px;z-index:2147483647;pointer-events:none;background:#000;opacity:.01';
    document.body.appendChild(d); }
  d.style.opacity = d.style.opacity === '0.01' ? '0.02' : '0.01'; window.kgptalkieTick && window.kgptalkieTick(); return 1; })()"""


class Film:
    """Captures frames on its own CDP connection until stopped. Paused time is left out of the GIF."""

    def __init__(self):
        self.p = Page(timeout=30)
        self.frames = []          # (seconds into the film, png bytes)
        self.on = threading.Event()
        self.stop = threading.Event()
        self.t = 0.0              # film clock (only runs while recording)
        self.thread = threading.Thread(target=self.loop, daemon=True)

    def loop(self):
        """Page.startScreencast sends a frame each time the page paints; the pulse makes it paint ~20 times a second."""
        ws = self.p.ws
        ws.settimeout(0.05)
        n, last, cast = 10 ** 6, None, False
        while not self.stop.is_set():
            if self.on.is_set() and not cast:
                ws.send(json.dumps({"id": n, "method": "Page.startScreencast", "params": {"format": "png", "everyNthFrame": 1}}))
                n, cast, last = n + 1, True, None
            elif not self.on.is_set() and cast:
                ws.send(json.dumps({"id": n, "method": "Page.stopScreencast"}))
                n, cast = n + 1, False
            if cast:
                ws.send(json.dumps({"id": n, "method": "Runtime.evaluate", "params": {"expression": PULSE}}))
                n += 1
            end = time.time() + 0.05
            while time.time() < end:
                try:
                    m = json.loads(ws.recv())
                except (websocket.WebSocketTimeoutException, TimeoutError):
                    break
                if m.get("method") != "Page.screencastFrame":
                    continue
                prm = m["params"]
                ws.send(json.dumps({"id": n, "method": "Page.screencastFrameAck", "params": {"sessionId": prm["sessionId"]}}))
                n += 1
                if not self.on.is_set():
                    continue
                now = time.time()
                if last is not None:
                    self.t += now - last
                last = now
                self.frames.append((self.t, base64.b64decode(prm["data"])))
        if cast:
            ws.send(json.dumps({"id": n, "method": "Page.stopScreencast"}))

    def start(self):
        self.thread.start()
        self.on.set()

    def pause(self):
        self.on.clear()
        time.sleep(0.1)

    def resume(self):
        self.on.set()

    def end(self):
        time.sleep(0.2)
        self.stop.set()
        self.thread.join(5)

    def gif(self, name, hold=2.5):
        if not FFMPEG:
            raise SystemExit("ffmpeg not found. Put it on PATH or set FFMPEG.")
        if len(self.frames) < 2:
            raise SystemExit("No frames were captured.")
        tmp = tempfile.mkdtemp(prefix="kgptalkie-gif-")
        try:
            lines = []
            for i, (t, data) in enumerate(self.frames):
                f = f"f{i:05d}.png"
                with open(os.path.join(tmp, f), "wb") as fh:
                    fh.write(data)
                dur = (self.frames[i + 1][0] - t) if i + 1 < len(self.frames) else hold
                lines += [f"file '{f}'", f"duration {max(dur, 0.01):.3f}"]
            lines.append(f"file 'f{len(self.frames) - 1:05d}.png'")
            with open(os.path.join(tmp, "list.txt"), "w") as fh:
                fh.write("\n".join(lines) + "\n")
            out = os.path.join(OUT, name)
            vf = (f"fps={FPS},scale={GIF_W}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];"
                  "[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle")
            subprocess.run([FFMPEG, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-vf", vf,
                            "-loop", "0", out], cwd=tmp, check=True)
            kb = os.path.getsize(out) / 1024
            print(f"saved {name}: {self.t + hold:.1f} s, {len(self.frames)} frames, "
                  + (f"{kb / 1024:.1f} MB" if kb >= 1024 else f"{kb:.0f} KB"))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


class Scene:
    """Drives the page with real input events and a drawn pointer."""

    def __init__(self, p):
        self.p = p
        self.x, self.y = W * 0.6, H * 0.55

    def js(self, src):
        return self.p.js(src)

    def wait(self, s):
        end = time.time() + s
        while time.time() < end:
            self.js("window.kgptalkieTick && window.kgptalkieTick(), 1")
            time.sleep(0.08)

    def caption(self, text):
        self.js(f"{CAPTION}({json.dumps(text)})")

    def pointer(self, x, y):
        self.js(f"(() => {{ const c = document.getElementById('kgptalkieRecCursor'); c.style.left = '{x:.1f}px'; c.style.top = '{y:.1f}px'; return 1 }})()")

    def move(self, x, y, secs=0.6):
        n = max(2, int(secs / 0.04))
        x0, y0 = self.x, self.y
        for i in range(1, n + 1):
            t = i / n
            e = t * t * (3 - 2 * t)                      # ease in and out
            self.x, self.y = x0 + (x - x0) * e, y0 + (y - y0) * e
            self.pointer(self.x, self.y)
            self.p.call("Input.dispatchMouseEvent", type="mouseMoved", x=self.x, y=self.y)
            time.sleep(0.03)

    def ring(self):
        for s, o in ((0.7, 1), (1.0, 0.9), (1.3, 0.7), (1.6, 0.45), (1.9, 0.2), (2.1, 0)):
            self.js(f"(() => {{ const r = document.querySelector('#kgptalkieRecCursor .ring'); r.style.transform = 'scale({s})'; r.style.opacity = '{o}'; return 1 }})()")
            time.sleep(0.035)

    def click(self, el, secs=0.6, dx=0, dy=0, mousedown_only=False):
        """Move to an element (a JS expression) and click it. Returns False when it is not on the page."""
        c = self.p.wait_for(el, 8)
        if not c:
            print("  not found:", el[:100])
            return False
        self.move(c[0] + dx, c[1] + dy, secs)
        time.sleep(0.12)
        x, y = self.x, self.y
        self.p.call("Input.dispatchMouseEvent", type="mousePressed", x=x, y=y, button="left", clickCount=1)
        self.ring()
        if not mousedown_only:
            self.p.call("Input.dispatchMouseEvent", type="mouseReleased", x=x, y=y, button="left", clickCount=1)
        self.wait(0.25)
        return True

    def type(self, text, cps=11):
        for ch in text:
            if ch == "\n":
                self.js(f"{ED}.trigger('t', 'hideSuggestWidget', {{}})")
                self.p.key("Enter", "Enter", 13, "\r")
            else:
                self.p.key(ch, "", ord(ch.upper()) if ch.isalnum() else (32 if ch == " " else 0), ch)
            self.js("window.kgptalkieTick && window.kgptalkieTick(), 1")
            time.sleep(1 / cps)

    def scroll_to(self, top_js, secs=1.2):
        """Smooth scroll of the notebook to a pixel offset (a JS expression using ed)."""
        # The target is worked out again on every step: result zones above it can change height while it scrolls.
        self.js(f"(() => {{ window.kgptalkieRecFrom = {ED}.getScrollTop(); return 1 }})()")
        n = max(2, int(secs / 0.05))
        for i in range(1, n + 1):
            t = i / n
            e = t * t * (3 - 2 * t)
            self.js(f"(() => {{ const ed = {ED}, to = {top_js}; ed.setScrollTop(kgptalkieRecFrom + (to - kgptalkieRecFrom) * {e:.4f}); window.kgptalkieTick(); return 1 }})()")
            time.sleep(0.04)
        for _ in range(3):
            time.sleep(0.15)
            self.js(f"(() => {{ const ed = {ED}, to = {top_js}; if (Math.abs(ed.getScrollTop() - to) > 2) ed.setScrollTop(to); window.kgptalkieTick(); return 1 }})()")


def new_notebook(p):
    """Close the open notebooks and open a fresh one on the throwaway connection, sidebar folded."""
    r = p.js("""(async () => {
      let sb = null;
      const walk = (v, d) => { if (!v || d > 40 || sb) return; const c = v.__c; if (c && typeof c.openNewNotebook === 'function') sb = c; for (const k of v.__k || []) walk(k, d + 1); };
      walk(document.getElementById('root').__k, 0);
      if (!sb) return 'no sidebar';
      const awc = (sb.props && sb.props.activeWorkspaceConnection) || (sb.state && sb.state.activeWorkspaceConnection);
      if (!awc) return 'not connected';
      sb.openNewNotebook({ connection: awc }); await new Promise(r => setTimeout(r, 2500));
      const h = document.getElementById('pane0Host'); if (h && h.getBoundingClientRect().width > 40) document.getElementById('desktopWorkspaceSidebarToggle').click();
      return 'ok'; })()""")
    p.js("(async () => { const ed = " + FIND_NB + "; const ce = ed.kgptalkieCE; if (ce) await ce.removeAllResults(); const m = ed.getModel();"
         " ed.executeEdits('t', [{ range: m.getFullModelRange(), text: '' }]); await window.kgptalkieActions.setType(ed, 0, 'mysql'); ed.setScrollTop(0); return 1 })()")
    if r != "ok":
        raise SystemExit("Could not open a notebook: " + str(r) + " (run py tests/connect.py)")
    if not p.use_notebook():
        raise SystemExit("No notebook editor found.")
    p.tick(6, 200)


def bar_btn(a):
    return f"{BAR}.querySelector('[data-a={a}]')"


def cell_with(text):
    """Start line of the first cell whose text contains text."""
    return f"""(() => {{ const ed = {ED}, m = ed.getModel(), x = m.executionContexts.content.find(x =>
      m.getValueInRange({{ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }}).includes({json.dumps(text)}));
      return x ? x.startLine : 1; }})()"""


def caret_in_last_cell():
    """[x, y] of the start of the last cell's first line."""
    return f"""(() => {{ const ed = {ED}, cs = ed.getModel().executionContexts.content, x = cs[cs.length - 1];
      const p = ed.getScrolledVisiblePosition({{ lineNumber: x.startLine, column: 1 }}), b = ed.getDomNode().getBoundingClientRect();
      return {{ getBoundingClientRect: () => ({{ x: b.x + p.left, y: b.y + p.top, width: 2, height: p.height }}) }}; }})()"""


# ---- scenes -------------------------------------------------------------------------------------------------------

def scene_run(p, s, film):
    """Get Started > sample notebook > Run All, then scroll through the results and the chart."""
    s.caption("Get Started adds a sample notebook")
    s.click(bar_btn("start"), mousedown_only=True)
    s.wait(0.6)
    s.click("document.querySelector('.kgptalkieDlgBack [data-f=sample]')", mousedown_only=True)
    s.wait(1.2)
    s.caption("Run All runs every cell, in order")
    s.click(bar_btn("runall"), mousedown_only=True)
    p.js(f"window.kgptalkieRecDone = false; (async () => {{ while (window.kgptalkieBusy) await new Promise(r => setTimeout(r, 100)); window.kgptalkieRecDone = true; }})(), 1")
    end = time.time() + 60
    while time.time() < end and not p.js("window.kgptalkieRecDone"):
        s.wait(0.3)
    s.wait(0.8)
    s.caption("Results sit under each cell")
    s.scroll_to(f"ed.getTopForLineNumber({cell_with('ORDER BY price DESC')}) - 24", 2.0)
    s.wait(2.0)
    s.caption("Charts are one click away, and saved with the cell")
    s.scroll_to(f"ed.getTopForLineNumber({cell_with('FROM monthly_revenue')}) - 24", 2.0)
    s.wait(2.5)
    s.caption("")


def scene_typing(p, s, film):
    """Keywords turn into capitals as you type; columns after an alias; run with Ctrl+Enter."""
    s.caption("Keywords turn into capitals as you type")
    s.click(caret_in_last_cell(), dx=30, dy=8)
    p.js(f"""(() => {{ const ed = {ED}, cs = ed.getModel().executionContexts.content, x = cs[cs.length - 1];
      ed.setPosition({{ lineNumber: x.startLine, column: 1 }}); ed.focus(); return 1 }})()""")
    s.type("select c.name, c.city, count(*) as orders\nfrom sample_shop.customers c\njoin sample_shop.orders o on o.customer_id = c.id\ngroup by c.id\norder by orders desc\nlimit 5")
    s.wait(0.8)
    s.caption("Columns after an alias, in any case")
    p.js(f"""(() => {{ const ed = {ED}, m = ed.getModel(), cs = m.executionContexts.content, x = cs[cs.length - 1];
      ed.setPosition({{ lineNumber: x.startLine, column: 1 + 'select c.name, c.city'.length }}); ed.focus(); return 1 }})()""")
    s.type(", c.")
    s.wait(0.6)
    p.js(f"{ED}.trigger('t', 'editor.action.triggerSuggest', {{}}), 1")
    s.wait(1.0)
    s.type("em", cps=5)
    s.wait(1.2)
    p.js(f"{ED}.trigger('t', 'acceptSelectedSuggestion', {{}}), 1")
    s.wait(0.8)
    s.caption("Ctrl+Enter runs the cell")
    p.key("Enter", "Enter", 13, mods=2)
    s.wait(3.0)
    s.caption("")


def scene_results(p, s, film):
    """Search, a column filter, then the chart view of a result."""
    p.js(f"""(async () => {{ const ed = {ED}, m = ed.getModel(), cs = m.executionContexts.content, x = cs[cs.length - 1];
      ed.executeEdits('t', [{{ range: {{ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }},
        text: 'SELECT name, category, price, stock\\nFROM sample_shop.products\\nORDER BY price DESC\\nLIMIT 12' }}]);
      ed.setPosition({{ lineNumber: x.startLine, column: 1 }}); ed.focus(); return 1 }})()""")
    s.wait(0.5)
    s.caption("Run a query, then shape the result")
    p.key("Enter", "Enter", 13, mods=2)
    s.wait(2.5)
    s.caption("Search all columns")
    s.click("[...document.querySelectorAll('.kgptalkieSearch')].pop()")
    s.wait(0.4)
    s.type("phones", cps=6)
    s.wait(1.8)
    p.key("Escape", "Escape", 27)
    s.wait(0.6)
    s.caption("Switch to a chart")
    s.click("[...document.querySelectorAll('[data-r=chart]')].pop()")
    s.wait(0.8)
    s.scroll_to(f"ed.getTopForLineNumber({cell_with('ORDER BY price DESC')}) - 16", 0.8)
    s.wait(2.5)
    s.caption("")


def scene_ai(p, s, film):
    """An AI prompt turns plain words into SQL in the cell below (agent mode), then it runs."""
    s.caption("An AI prompt: describe what you want in plain words")
    s.click(bar_btn("ai"), mousedown_only=True)
    s.wait(0.6)
    s.type("top 5 customers by total order amount, from sample_shop", cps=14)
    s.wait(0.6)
    s.caption("The SQL appears in the cell below")
    p.key("Enter", "Enter", 13, mods=2)
    film.pause()                                             # waiting for the model is cut
    end = time.time() + 400
    s.wait(1.0)
    while time.time() < end and p.js("!!document.querySelector('.kgptalkieAi-streaming')"):
        s.wait(0.5)
    s.wait(1.0)
    film.resume()
    s.wait(1.5)
    s.caption("Run it like any other cell")
    s.click("[...document.querySelectorAll('.kgptalkieAi [data-ai=runnext]')].pop()")
    s.wait(1.5)
    s.scroll_to(f"ed.getTopForLineNumber({cell_with('AI-written')}) - 150", 1.2)
    s.wait(3.0)
    s.caption("")


SCENES = {
    "run": ("demo-run-all.gif", scene_run, False),
    "typing": ("demo-typing.gif", scene_typing, True),
    "results": ("demo-results.gif", scene_results, True),
    "ai": ("demo-ai-cell.gif", scene_ai, True),
}


def record(name):
    gif, fn, needs_sample = SCENES[name]
    p = Page(timeout=300)
    if name == "ai":                                         # the test server's AI settings (tests/.ai), no key
        cfg = {"provider": "ollama", "model": OLLAMA_MODEL, "runGeneratedSql": False}
        r = p.js(f"""fetch('http://127.0.0.1:9241/kgptalkie/ai/config', {{ method: 'POST',
          headers: {{ 'X-KGPTalkie': '1', 'Content-Type': 'application/json' }}, body: JSON.stringify({json.dumps(cfg)}) }}).then(r => r.text())""")
        print("AI settings:", r)
    new_notebook(p)
    if needs_sample:                                         # sample_shop must exist on the server
        p.js(f"""(async () => {{ const bar = {BAR};
          bar.querySelector('[data-a=start]').dispatchEvent(new MouseEvent('mousedown', {{ bubbles: true, cancelable: true }}));
          await new Promise(r => setTimeout(r, 300)); document.querySelector('.kgptalkieDlgBack [data-f=sample]').dispatchEvent(new MouseEvent('mousedown', {{ bubbles: true, cancelable: true }}));
          await new Promise(r => setTimeout(r, 1500)); await window.kgptalkieActions.runAll({ED}); return 1 }})()""")
        p.js(f"(async () => {{ await window.kgptalkieActions.clearAll({ED}); const ed = {ED}, m = ed.getModel();"
             " ed.executeEdits('t', [{ range: m.getFullModelRange(), text: '' }]); await window.kgptalkieActions.setType(ed, 0, 'mysql');"
             " ed.setScrollTop(0); return 1 })()")
        p.tick(6, 200)
    p.js(f"(async () => {{ window.dispatchEvent(new Event('resize')); await new Promise(r => setTimeout(r, 300)); {ED}.layout(); return 1 }})()")
    p.tick(4, 200)
    p.js(CURSOR)
    film = Film()
    s = Scene(p)
    s.pointer(s.x, s.y)
    try:
        film.start()
        s.wait(0.8)
        fn(p, s, film)
        film.end()
    finally:
        p.js("['kgptalkieRecCursor', 'kgptalkieRecCap', 'kgptalkieRecPulse'].forEach(i => document.getElementById(i)?.remove()), 1")
    print(name, "plugin error:", json.dumps(p.js("window.kgptalkieErr || null")))
    film.gif(gif)


def main():
    want = sys.argv[1:]
    if not want:
        print("Scenes:", ", ".join(SCENES))
        print('Run: py tests/record_gif.py <scene> ... or "all"')
        return
    if want == ["all"]:
        want = list(SCENES)
    bad = [w for w in want if w not in SCENES]
    if bad:
        raise SystemExit("Unknown scene: " + ", ".join(bad))
    os.makedirs(OUT, exist_ok=True)
    p = Page(timeout=30)
    p.call("Emulation.setDeviceMetricsOverride", width=W, height=H, deviceScaleFactor=1, mobile=False)
    p.js("window.dispatchEvent(new Event('resize')), 1")
    try:
        for name in want:
            record(name)
    finally:
        p.call("Emulation.clearDeviceMetricsOverride")


if __name__ == "__main__":
    main()
