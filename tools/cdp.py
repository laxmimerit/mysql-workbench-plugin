"""Run JavaScript in MySQL Workbench 26's page through the Chrome DevTools Protocol and print the result.
Workbench must be started with --remote-debugging-port=9229 (127.0.0.1 only). No keystrokes, no DevTools window.

    py cdp.py "document.title"           (an expression)
    py cdp.py -f some.js                 (a file holding one expression)
    py cdp.py --shot out.png             (a screenshot of the page itself, at its real pixel size)
"""
import base64, json, sys
sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
import requests, websocket

import os
PORT = int(os.environ.get("CDP_PORT", "9229"))
pages = [t for t in requests.get(f"http://127.0.0.1:{PORT}/json").json() if t["type"] == "page"]
ws = websocket.create_connection(pages[0]["webSocketDebuggerUrl"], suppress_origin=True, timeout=60)
n = 0


def call(method, **params):
    global n
    n += 1
    ws.send(json.dumps({"id": n, "method": method, "params": params}))
    while True:
        m = json.loads(ws.recv())
        if m.get("id") == n:
            return m


a = sys.argv[1:]
if a[0] in ("--move", "--click", "--rclick"):          # page (CSS) px; events go to the page only, not the OS cursor
    x, y = float(a[1]), float(a[2])
    call("Input.dispatchMouseEvent", type="mouseMoved", x=x, y=y)
    if a[0] != "--move":
        b = "right" if a[0] == "--rclick" else "left"
        call("Input.dispatchMouseEvent", type="mousePressed", x=x, y=y, button=b, clickCount=1)
        call("Input.dispatchMouseEvent", type="mouseReleased", x=x, y=y, button=b, clickCount=1)
    print("ok", a[0], x, y)
    sys.exit()
if a[0] == "--key":                                      # --key Enter | --key ctrl+Enter
    parts = a[1].split("+"); k = parts[-1]
    mods = (2 if "ctrl" in parts else 0) | (8 if "shift" in parts else 0) | (1 if "alt" in parts else 0)
    codes = {"Enter": 13, "Escape": 27, "ArrowDown": 40, "ArrowUp": 38, "Tab": 9}
    for t in ("rawKeyDown", "keyUp"):
        call("Input.dispatchKeyEvent", type=t, key=k, code=("Key" + k.upper()) if len(k) == 1 and k.isalpha() else k,
             windowsVirtualKeyCode=codes.get(k, ord(k.upper()[0])),
             modifiers=mods)
    print("ok key", a[1])
    sys.exit()
if a[0] == "--type":
    call("Input.insertText", text=a[1])
    print("ok typed")
    sys.exit()
if a[0] == "--snap":                       # hidden window that never paints: DOM rendered to PNG inside the page
    js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "snap.js"), encoding="utf-8").read()
    r = call("Runtime.evaluate", expression=js, returnByValue=True, awaitPromise=True)["result"]
    if "exceptionDetails" in r:
        print("ERROR", json.dumps(r["exceptionDetails"])[:800]); sys.exit(1)
    open(a[1], "wb").write(base64.b64decode(r["result"]["value"].split(",", 1)[1]))
    print("saved", a[1])
    sys.exit()
if a[0] == "--shot":
    if os.environ.get("CDP_HIDDEN"):          # a hidden window only paints after a metrics override
        v = call("Runtime.evaluate", expression="[innerWidth, innerHeight]", returnByValue=True)["result"]["result"]["value"]
        call("Emulation.setDeviceMetricsOverride", width=v[0], height=v[1], deviceScaleFactor=2, mobile=False)
    r = call("Page.captureScreenshot", format="png")
    open(a[1], "wb").write(base64.b64decode(r["result"]["data"]))
    print("saved", a[1])
    sys.exit()
src = open(a[1], encoding="utf-8").read() if a[0] == "-f" else a[0]
r = call("Runtime.evaluate", expression=src, returnByValue=True, awaitPromise=True)
res = r.get("result", {})
if "exceptionDetails" in res:
    print("ERROR", json.dumps(res["exceptionDetails"], indent=1)[:2000])
else:
    v = res.get("result", {}).get("value")
    print(v if isinstance(v, str) else json.dumps(v, indent=1))
