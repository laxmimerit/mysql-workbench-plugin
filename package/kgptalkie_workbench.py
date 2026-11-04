"""Modern MySQL Workbench: one exe that installs, launches and serves the KGP Talkie notebook plugin for MySQL Workbench 26.

    Modern-MySQL-Workbench-Setup.exe     asks once, installs to %LOCALAPPDATA%\\Programs\\Modern MySQL Workbench,
                                         adds a "Modern MySQL Workbench" shortcut to the Desktop and Start menu and an
                                         entry in Settings > Apps (uninstall)
    Modern MySQL Workbench.exe (installed copy)   starts the plugin server if needed, then opens Workbench with its own
                                         --renderer-url switch. MySQL Workbench itself is never modified.
    --serve [--port N]                   the plugin server (the launcher starts it in the background; it stops by
                                         itself a few minutes after the last Workbench window closes)
    --install [--target DIR] [--no-shortcuts] [--quiet]
    --uninstall [--quiet]

The server binds 127.0.0.1 only. /kgptalkie/fs/list|read|home feed the Explorer panel: read-only, only for Workbench's own
pages (Origin http://127.0.0.1:<port> or app://renderer), only with the X-KGPTalkie header (any other web page needs a CORS
preflight, which is refused) and only for Host 127.0.0.1:<port> (no DNS rebinding).
"""
import argparse, base64, ctypes, http.server, json, os, pathlib, re, shutil, socketserver, struct, subprocess, sys, tempfile, threading, time, traceback
import urllib.error, urllib.request, winreg
from urllib.parse import parse_qs, urlsplit

APP = "Modern MySQL Workbench"
EXE_NAME = "Modern MySQL Workbench.exe"
VERSION = "26.10.0.1"            # MySQL Workbench version it is made for, then our release
PORT = 9241
LOCAL = os.environ["LOCALAPPDATA"]
DEFAULT_TARGET = os.path.join(LOCAL, "Programs", "Modern MySQL Workbench")
UNINST_KEY = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\ModernMySQLWorkbench"
MARK = b"Modern MySQL Workbench plugin"            # in the first line of plugin/kgptalkie-plugin.js
NO_WINDOW, DETACHED, NEW_GROUP = 0x08000000, 0x00000008, 0x00000200
FROZEN = getattr(sys, "frozen", False)
SELF = sys.executable if FROZEN else os.path.abspath(__file__)
HOME_DIR = os.path.dirname(SELF)
BUNDLE = getattr(sys, "_MEIPASS", HOME_DIR)
INFO = os.path.join(HOME_DIR, "install.json")
LOG = os.path.join(os.environ.get("TEMP", HOME_DIR), "modern-mysql-workbench.log")

QUIET = False


def box(msg, flags=0x40):
    """MessageBox; returns 6 for Yes. Silent (returns 6) with --quiet."""
    if QUIET:
        return 6
    return ctypes.windll.user32.MessageBoxW(None, msg, APP, flags | 0x10000)


def bundled_plugin():
    for d in (os.path.join(BUNDLE, "plugin"), os.path.join(HOME_DIR, "..", "plugin")):
        if os.path.isfile(os.path.join(d, "kgptalkie-plugin.js")):
            return os.path.abspath(d)
    raise FileNotFoundError("kgptalkie-plugin.js is missing from this package")


def plugin_dir():
    """The installed copy serves plugin\\ next to the exe (easy to update); otherwise the bundled file."""
    d = os.path.join(HOME_DIR, "plugin")
    return d if os.path.isfile(os.path.join(d, "kgptalkie-plugin.js")) else bundled_plugin()


def find_wb():
    roots = [os.path.join(LOCAL, r"Programs\MySQL\MySQL Workbench")]
    for v in ("ProgramFiles", "ProgramW6432", "ProgramFiles(x86)"):
        if os.environ.get(v):
            roots.append(os.path.join(os.environ[v], r"MySQL\MySQL Workbench"))
    for r in roots:
        exe = os.path.join(r, "MySQL Workbench.exe")
        front = os.path.join(r, r"resources\app\frontend\build")
        if os.path.isfile(exe) and os.path.isfile(os.path.join(front, "index.html")):
            return exe, front
    return None, None


def wb_version(front):
    """Workbench's version from resources/app/package.json, for the plugin's version guard. '' when unreadable."""
    try:
        with open(os.path.join(front, "..", "..", "package.json"), encoding="utf-8") as f:
            v = str(json.load(f).get("version", ""))
    except (OSError, ValueError, AttributeError):
        return ""
    return v if re.fullmatch(r"[0-9A-Za-z.+-]{1,40}", v) else ""


def find_edge():
    """Microsoft Edge (ships with Windows), used headless to print notebook exports to PDF."""
    for v in ("ProgramFiles(x86)", "ProgramFiles", "ProgramW6432"):
        if os.environ.get(v):
            p = os.path.join(os.environ[v], r"Microsoft\Edge\Application\msedge.exe")
            if os.path.isfile(p):
                return p
    p = os.path.join(LOCAL, r"Microsoft\Edge\Application\msedge.exe")
    return p if os.path.isfile(p) else None


# ------------------------------------------------------------------ AI (keys never reach the page)
AI_DIR = os.environ.get("KGPTALKIE_AI_DIR") or os.path.join(os.environ.get("APPDATA", HOME_DIR), "Modern MySQL Workbench")
AI_FILE = os.path.join(AI_DIR, "ai.json")
ai_lock = threading.Lock()
PROVIDERS = {
    "openai": {"label": "OpenAI", "key": True, "model": "gpt-6.1-sol"},
    "anthropic": {"label": "Anthropic", "key": True, "model": "claude-sonnet-5-5"},
    "openrouter": {"label": "OpenRouter", "key": True, "model": "openrouter/auto"},
    "ollama": {"label": "Ollama", "key": False, "model": "", "base": "http://localhost:11434"},
    "custom": {"label": "Custom (OpenAI-compatible)", "key": False, "model": "", "base": "http://localhost:1234/v1"},
}


class _Blob(ctypes.Structure):
    _fields_ = [("cbData", ctypes.c_uint32), ("pbData", ctypes.POINTER(ctypes.c_char))]


def _dpapi(data, protect):
    """Windows DPAPI (current user): the key file is useless on another account or PC."""
    buf = ctypes.create_string_buffer(data, len(data))
    src, out = _Blob(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_char))), _Blob()
    fn = ctypes.windll.crypt32.CryptProtectData if protect else ctypes.windll.crypt32.CryptUnprotectData
    if not fn(ctypes.byref(src), None, None, None, None, 0x1, ctypes.byref(out)):   # 0x1 = no UI
        raise OSError("DPAPI failed")
    try:
        return ctypes.string_at(out.pbData, out.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(out.pbData)


def ai_load():
    try:
        return json.load(open(AI_FILE, encoding="utf-8"))
    except (OSError, ValueError):
        return {"provider": "openai", "model": "", "baseUrl": "", "keys": {}, "allowResultData": False,
                "runGeneratedSql": False}


def ai_save(c):
    os.makedirs(AI_DIR, exist_ok=True)
    tmp = AI_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(c, f, indent=1)
    os.replace(tmp, AI_FILE)


def ai_key(c, provider):
    k = c.get("keys", {}).get(provider)
    if not k:
        return ""
    import base64
    return _dpapi(base64.b64decode(k), False).decode("utf-8")


def ai_public(c):
    """What the page may see: never the keys, only whether one is saved."""
    p = c.get("provider", "openai")
    return {"provider": p, "model": c.get("model") or PROVIDERS.get(p, {}).get("model", ""),
            "baseUrl": c.get("baseUrl") or PROVIDERS.get(p, {}).get("base", ""),
            "hasKey": {k: bool(c.get("keys", {}).get(k)) for k in PROVIDERS},
            "allowResultData": bool(c.get("allowResultData")), "runGeneratedSql": bool(c.get("runGeneratedSql")),
            "providers": [{"id": k, "label": v["label"], "needsKey": v["key"]} for k, v in PROVIDERS.items()],
            "ready": ai_ready(c)}


def ai_ready(c):
    p = c.get("provider", "openai")
    info = PROVIDERS.get(p)
    if not info:
        return False
    model = c.get("model") or info["model"]
    return bool(model) and (not info["key"] or bool(c.get("keys", {}).get(p)))


def ai_update(c, body):
    import base64
    p = body.get("provider", c.get("provider", "openai"))
    if p not in PROVIDERS:
        raise ValueError("unknown provider")
    c["provider"] = p
    for k in ("model", "baseUrl"):
        if k in body:
            c[k] = str(body[k] or "").strip()
    for k in ("allowResultData", "runGeneratedSql"):
        if k in body:
            c[k] = bool(body[k])
    key = str(body.get("apiKey") or "").strip()
    if key:
        c.setdefault("keys", {})[p] = base64.b64encode(_dpapi(key.encode("utf-8"), True)).decode("ascii")
    if body.get("forgetKey"):
        c.setdefault("keys", {}).pop(p, None)
    return c


def _http(url, body=None, headers=None, timeout=300):
    h = {"User-Agent": "ModernMySQLWorkbench/" + VERSION, **(headers or {})}
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        h["Content-Type"] = "application/json"
    return urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=timeout)


def _err(e):
    if isinstance(e, urllib.error.HTTPError):
        try:
            j = json.loads(e.read().decode("utf-8", "replace"))
            m = j.get("error", j)
            m = m.get("message", m) if isinstance(m, dict) else m
            return f"{e.code} {m}"
        except Exception:
            return f"{e.code} {e.reason}"
    return str(getattr(e, "reason", e))


def _cfg_for(c, body):
    """The config to use: saved values, overridden by the dialog's unsaved ones (for model lists and tests)."""
    p = body.get("provider") or c.get("provider", "openai")
    info = PROVIDERS[p]
    key = str(body.get("apiKey") or "").strip() or ai_key(c, p)
    base = str(body.get("baseUrl") or (c.get("baseUrl") if p == c.get("provider") else "") or info.get("base", "")).strip()
    model = str(body.get("model") or (c.get("model") if p == c.get("provider") else "") or info["model"]).strip()
    return p, key, base.rstrip("/"), model


def ai_models(c, body):
    p, key, base, _ = _cfg_for(c, body)
    if p == "openai":
        j = json.load(_http("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {key}"}, timeout=30))
        import re
        return sorted((m["id"] for m in j["data"] if re.match(r"^(gpt|o\d|chatgpt)", m["id"])), reverse=True)
    if p == "anthropic":
        j = json.load(_http("https://api.anthropic.com/v1/models?limit=100",
                            headers={"x-api-key": key, "anthropic-version": "2023-06-01"}, timeout=30))
        return [m["id"] for m in j["data"]]
    if p == "openrouter":
        j = json.load(_http("https://openrouter.ai/api/v1/models", timeout=30))
        return ["openrouter/auto"] + [m["id"] for m in j["data"]]
    if p == "ollama":
        root = base[:-3] if base.endswith("/v1") else base
        j = json.load(_http(root + "/api/tags", timeout=15))
        return [m["name"] for m in j.get("models", [])]
    j = json.load(_http(base + "/models", headers={"Authorization": f"Bearer {key}"} if key else {}, timeout=30))
    return [m.get("id") or m.get("name") for m in (j.get("data") or j.get("models") or [])]


def ai_stream(c, body):
    """Yields text chunks of the model's answer."""
    p, key, base, model = _cfg_for(c, body)
    if not model:
        raise ValueError("Choose a model first (Configure AI).")
    if PROVIDERS[p]["key"] and not key:
        raise ValueError(f"No {PROVIDERS[p]['label']} API key saved (Configure AI).")
    system, user = body.get("system", ""), body.get("user", "")
    msgs = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    if p == "anthropic":
        r = _http("https://api.anthropic.com/v1/messages",
                  {"model": model, "max_tokens": 4096, "system": system, "stream": True,
                   "messages": [{"role": "user", "content": user}]},
                  {"x-api-key": key, "anthropic-version": "2023-06-01"})
        for line in r:
            line = line.decode("utf-8", "replace").strip()
            if line.startswith("data:"):
                ev = json.loads(line[5:].strip() or "{}")
                if ev.get("type") == "content_block_delta" and ev["delta"].get("type") == "text_delta":
                    yield ev["delta"]["text"]
                elif ev.get("type") == "error":
                    raise RuntimeError(ev["error"].get("message", "error"))
        return
    if p == "ollama":
        root = base[:-3] if base.endswith("/v1") else base
        r = _http(root + "/api/chat", {"model": model, "messages": msgs, "stream": True, "think": False})
        for line in r:
            if line.strip():
                ev = json.loads(line)
                if ev.get("error"):
                    raise RuntimeError(ev["error"])
                t = (ev.get("message") or {}).get("content")
                if t:
                    yield t
        return
    url = {"openai": "https://api.openai.com/v1", "openrouter": "https://openrouter.ai/api/v1"}.get(p, base)
    hdr = {"Authorization": f"Bearer {key or 'not-needed'}"}
    if p == "openrouter":
        hdr.update({"HTTP-Referer": "https://kgptalkie.com", "X-Title": "Modern MySQL Workbench"})
    r = _http(url + "/chat/completions", {"model": model, "messages": msgs, "stream": True}, hdr)
    for line in r:
        line = line.decode("utf-8", "replace").strip()
        if line.startswith("data:"):
            d = line[5:].strip()
            if d == "[DONE]":
                return
            ev = json.loads(d)
            if ev.get("error"):
                raise RuntimeError(ev["error"].get("message", "error"))
            for ch in ev.get("choices", []):
                t = (ch.get("delta") or {}).get("content")
                if t:
                    yield t


# ------------------------------------------------------------------ server
def serve(port):
    _, front = find_wb()
    if not front:
        raise SystemExit("MySQL Workbench 26 not found")
    plug = plugin_dir()
    tag = b'<script src="/kgptalkie/kgptalkie-plugin.js"></script>\n</head>'
    hide = {".git", ".svn", ".hg", ".DS_Store", "Thumbs.db", "desktop.ini", "__pycache__"}
    can_open = {".sql", ".mysql", ".js", ".ts", ".mysql-notebook", ".sqlnb"}
    max_read = 20 * 1024 * 1024
    host = f"127.0.0.1:{port}"

    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=front, **kw)

        def end_headers(self):
            self.send_header("Cache-Control", "no-store")
            super().end_headers()

        def translate_path(self, path):
            p = path.split("?", 1)[0].split("#", 1)[0]
            if p.startswith("/kgptalkie/"):
                return os.path.join(plug, os.path.normpath(p[len("/kgptalkie/"):]).lstrip("\\/."))
            return super().translate_path(path)

        def _origin_ok(self):
            return (self.headers.get("Origin") in (None, f"http://{host}", "app://renderer")
                    and self.headers.get("Host") == host)

        def _send(self, code, body, ctype="application/json; charset=utf-8"):
            b = body if isinstance(body, bytes) else body.encode("utf-8")
            self.send_response(code)
            o = self.headers.get("Origin")
            if o:
                self.send_header("Access-Control-Allow-Origin", o)
                self.send_header("Vary", "Origin")
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(b)))
            self.end_headers()
            self.wfile.write(b)

        def do_OPTIONS(self):
            if (not self.path.startswith(("/kgptalkie/fs/", "/kgptalkie/ai/", "/kgptalkie/doc/")) or not self._origin_ok()
                    or not self.headers.get("Origin")):
                self.send_response(403); self.end_headers(); return
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", self.headers["Origin"])
            self.send_header("Access-Control-Allow-Headers", "X-KGPTalkie, Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, POST")
            self.send_header("Vary", "Origin")
            self.end_headers()

        def do_POST(self):
            if self.path.startswith("/kgptalkie/ai/"):
                return self.ai("POST")
            if self.path.split("?", 1)[0] == "/kgptalkie/doc/pdf":
                return self.pdf()
            return self._send(404, '{"error":"unknown request"}')

        def pdf(self):
            """Notebook export to PDF: the page sends the exported HTML, headless Edge prints it, base64 PDF comes back."""
            if not self._origin_ok() or self.headers.get("X-KGPTalkie") != "1":
                return self._send(403, '{"error":"forbidden"}')
            try:
                n = int(self.headers.get("Content-Length") or 0)
                if n > 60_000_000:
                    raise ValueError("the notebook is too large to print")
                html = json.loads(self.rfile.read(n) or b"{}").get("html") or ""
                edge = find_edge()
                if not edge:
                    raise ValueError("Microsoft Edge was not found, so PDF export is not available")
                with tempfile.TemporaryDirectory(prefix="kgptalkie-pdf-") as d:
                    src, out = os.path.join(d, "notebook.html"), os.path.join(d, "notebook.pdf")
                    with open(src, "w", encoding="utf-8") as f:
                        f.write(html)
                    subprocess.run([edge, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                                    "--run-all-compositor-stages-before-draw", "--virtual-time-budget=4000",
                                    "--no-first-run", "--disable-extensions", "--user-data-dir=" + os.path.join(d, "profile"),
                                    "--print-to-pdf=" + out, pathlib.Path(src).as_uri()],
                                   timeout=120, capture_output=True, creationflags=NO_WINDOW)
                    if not os.path.exists(out) or os.path.getsize(out) == 0:
                        raise ValueError("Edge did not produce a PDF")
                    with open(out, "rb") as f:
                        data = base64.b64encode(f.read()).decode("ascii")
                return self._send(200, json.dumps({"pdf": data}))
            except Exception as e:
                return self._send(400, json.dumps({"error": _err(e)}))

        def ai(self, method):
            if not self._origin_ok() or self.headers.get("X-KGPTalkie") != "1":
                return self._send(403, '{"error":"forbidden"}')
            op = urlsplit(self.path).path[len("/kgptalkie/ai/"):]
            try:
                body = {}
                if method == "POST":
                    n = int(self.headers.get("Content-Length") or 0)
                    if n > 4_000_000:
                        raise ValueError("request too large")
                    body = json.loads(self.rfile.read(n) or b"{}")
                if op == "config":
                    with ai_lock:
                        c = ai_load()
                        if method == "POST":
                            c = ai_update(c, body)
                            ai_save(c)
                    return self._send(200, json.dumps(ai_public(c)))
                if op == "models" and method == "POST":
                    return self._send(200, json.dumps({"models": ai_models(ai_load(), body)}))
                if op == "stream" and method == "POST":
                    gen = ai_stream(ai_load(), body)
                    first = next(gen, "")                       # errors before any text become a JSON 400
                    self.send_response(200)
                    o = self.headers.get("Origin")
                    if o:
                        self.send_header("Access-Control-Allow-Origin", o)
                        self.send_header("Vary", "Origin")
                    self.send_header("Content-Type", "text/plain; charset=utf-8")
                    self.end_headers()
                    try:
                        for t in ([first] if first else []):
                            self.wfile.write(t.encode("utf-8")); self.wfile.flush()
                        try:
                            for t in gen:
                                self.wfile.write(t.encode("utf-8")); self.wfile.flush()
                        except (ConnectionError, OSError):
                            raise
                        except Exception as e:                  # mid-stream provider error: marked for the page
                            self.wfile.write(("\u0000ERR:" + _err(e)).encode("utf-8")); self.wfile.flush()
                    except (ConnectionError, OSError):
                        pass                                    # the page stopped reading (Stop button)
                    finally:
                        gen.close()
                    return
            except Exception as e:
                return self._send(400, json.dumps({"error": _err(e)}))
            return self._send(404, '{"error":"unknown request"}')

        def fs(self):
            if not self._origin_ok() or self.headers.get("X-KGPTalkie") != "1":
                return self._send(403, '{"error":"forbidden"}')
            u = urlsplit(self.path); op = u.path[len("/kgptalkie/fs/"):]; q = parse_qs(u.query)
            path = os.path.normpath(q.get("path", [""])[0])
            if op == "home":
                return self._send(200, json.dumps({"path": os.path.expanduser("~")}))
            if op == "env":              # {{env.NAME}} in notebook SQL; only plain variable names
                name = q.get("name", [""])[0]
                if not name or not (name[0].isalpha() or name[0] == "_") or not all(c.isalnum() or c == "_" for c in name):
                    return self._send(400, '{"error":"bad name"}')
                return self._send(200, json.dumps({"name": name, "value": os.environ.get(name, ""), "set": name in os.environ}))
            if not os.path.isabs(path):
                return self._send(400, '{"error":"absolute path required"}')
            try:
                if op == "list":
                    items = []
                    with os.scandir(path) as it:
                        for e in it:
                            if e.name in hide:
                                continue
                            try:
                                d = e.is_dir()
                            except OSError:
                                continue
                            items.append({"n": e.name, "d": d})
                    items.sort(key=lambda x: (not x["d"], x["n"].lower()))
                    return self._send(200, json.dumps({"path": path, "items": items}))
                if op == "read":
                    if os.path.splitext(path)[1].lower() not in can_open:
                        return self._send(415, '{"error":"Workbench cannot open this file type"}')
                    if os.path.getsize(path) > max_read:
                        return self._send(413, '{"error":"file is larger than 20 MB"}')
                    with open(path, "rb") as f:
                        return self._send(200, f.read(), "text/plain; charset=utf-8")
            except FileNotFoundError:
                return self._send(404, '{"error":"not found"}')
            except PermissionError:
                return self._send(403, '{"error":"no permission"}')
            except OSError as e:
                return self._send(500, json.dumps({"error": str(e)}))
            return self._send(404, '{"error":"unknown request"}')

        def do_GET(self):
            p = self.path.split("?", 1)[0]
            if p.startswith("/kgptalkie/fs/"):
                return self.fs()
            if p.startswith("/kgptalkie/ai/"):
                return self.ai("GET")
            if p == "/kgptalkie/quit":      # used by install/uninstall to free the exe; never from a web page
                if self.headers.get("Host") == host and not self.headers.get("Origin") and self.headers.get("X-KGPTalkie") == "1":
                    self._send(200, '{"ok":true}')
                    threading.Thread(target=srv.shutdown, daemon=True).start()
                    return
                return self._send(403, '{"error":"forbidden"}')
            if p in ("/", "/index.html"):
                meta = f'<meta name="kgptalkie-wb-version" content="{wb_version(front)}">\n'.encode("ascii")
                html = open(os.path.join(front, "index.html"), "rb").read().replace(b"</head>", meta + tag, 1)
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(html)))
                self.end_headers()
                self.wfile.write(html)
                return
            return super().do_GET()

        def log_message(self, *a):
            pass

    H.extensions_map.update({".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
                             ".json": "application/json", ".wasm": "application/wasm", ".svg": "image/svg+xml",
                             ".ttf": "font/ttf", ".woff2": "font/woff2"})
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer.daemon_threads = True
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", port), H)
    threading.Thread(target=watchdog, args=(srv,), daemon=True).start()
    with srv:
        srv.serve_forever()


def wb_running():
    try:
        out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq MySQL Workbench.exe", "/NH", "/FO", "CSV"],
                             capture_output=True, text=True, creationflags=NO_WINDOW, timeout=20).stdout
        return "MySQL Workbench.exe" in out
    except Exception:
        return True


def watchdog(srv):
    """Stop the server about 90 s after the last Workbench process is gone (2 min grace at start)."""
    time.sleep(120)
    misses = 0
    while True:
        misses = 0 if wb_running() else misses + 1
        if misses >= 3:
            srv.shutdown()
            return
        time.sleep(30)


# ------------------------------------------------------------------ launcher
URL = f"http://127.0.0.1:{PORT}/"


def ours():
    """True: our server answers. False: port free. None: something else holds the port."""
    try:
        body = urllib.request.urlopen(URL + "kgptalkie/kgptalkie-plugin.js", timeout=2).read(400)
        return True if MARK in body else None
    except urllib.error.HTTPError:
        return None
    except OSError:
        return False


def quit_server():
    if ours() is not True:
        return
    try:
        urllib.request.urlopen(urllib.request.Request(URL + "kgptalkie/quit", headers={"X-KGPTalkie": "1"}), timeout=3).read()
    except OSError:
        return                       # an older server without /kgptalkie/quit: leave it
    for _ in range(25):
        if ours() is False:
            return
        time.sleep(0.2)


def wb_main_cmdlines():
    """Command lines of running Workbench main processes (Electron helpers carry --type=)."""
    ps = ("Get-CimInstance Win32_Process -Filter \"Name='MySQL Workbench.exe'\" | "
          "ForEach-Object { $_.CommandLine }")
    try:
        out = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps], capture_output=True,
                             text=True, creationflags=NO_WINDOW, timeout=30).stdout
    except Exception:
        return []
    return [l for l in out.splitlines() if l.strip() and "--type=" not in l]


def start_server():
    cmd = [SELF] if FROZEN else [sys.executable, SELF]
    subprocess.Popen(cmd + ["--serve", "--port", str(PORT)], cwd=HOME_DIR,
                     creationflags=NO_WINDOW | DETACHED | NEW_GROUP, close_fds=True,
                     stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def launch():
    exe, _ = find_wb()
    if not exe:
        box("MySQL Workbench 26 was not found on this PC.\nInstall MySQL Workbench first, then open Modern MySQL Workbench again.", 0x10)
        return 1
    state = ours()
    if state is None:
        box(f"Port {PORT} is in use by another program, so the Modern MySQL Workbench plugin was not started.\n"
            "Close that program, or open MySQL Workbench from its normal shortcut.", 0x10)
        return 1
    if state is False:
        start_server()
        for _ in range(100):
            time.sleep(0.2)
            if ours():
                break
        else:
            box("The plugin server did not start, so Workbench was not opened.", 0x10)
            return 1
    plain = [c for c in wb_main_cmdlines() if f"--renderer-url={URL}" not in c]
    if plain:
        box("MySQL Workbench is already open without the plugin.\n"
            "Close it (File > Exit), then open Modern MySQL Workbench again.", 0x30)
        return 1
    subprocess.Popen([exe, f"--renderer-url={URL}"], creationflags=DETACHED, close_fds=True)
    return 0


# ------------------------------------------------------------------ install / uninstall
def shell_folder(csidl):
    buf = ctypes.create_unicode_buffer(260)
    ctypes.windll.shell32.SHGetFolderPathW(None, csidl, None, 0, buf)
    return buf.value


BADGE_FRAC = 0.35                                  # badge width as a share of the icon width
PNG_SIG = b"\x89PNG\r\n\x1a\n"


def wb_icon_png(wb_root):
    """The largest PNG picture in MySQL Workbench's own app-icon.ico (or its app-icon.png), as bytes. None if missing."""
    img = os.path.join(wb_root, "resources", "app", "images")
    try:
        with open(os.path.join(img, "app-icon.ico"), "rb") as f:
            d = f.read()
        best = None
        for i in range(struct.unpack_from("<H", d, 4)[0]):
            w, size, off = d[6 + 16 * i] or 256, *struct.unpack_from("<II", d, 6 + 16 * i + 8)
            if d[off:off + 8] == PNG_SIG and (not best or w > best[0]):
                best = (w, d[off:off + size])
        if best:
            return best[1]
    except (OSError, struct.error, IndexError):
        pass
    try:
        with open(os.path.join(img, "app-icon.png"), "rb") as f:
            d = f.read()
        return d if d[:8] == PNG_SIG else None
    except OSError:
        return None


def make_shortcut_icon(target):
    """The shortcut icon: this PC's own MySQL Workbench icon with our badge in the corner, saved as shortcut.ico in the
    install folder.
    Built here from the user's installed Workbench, so no Workbench artwork ships with the plugin. None when it cannot
    be made (no Workbench, unknown icon format); the shortcut then uses the exe's own (teal) icon."""
    exe = find_wb()[0]
    badge = os.path.join(BUNDLE, "badge.png")
    src = wb_icon_png(os.path.dirname(exe)) if exe else None
    if not src or not os.path.isfile(badge):
        return None
    q = lambda s: s.replace("'", "''")
    sizes = (256, 48, 32, 24, 16)
    with tempfile.TemporaryDirectory() as tmp:
        with open(os.path.join(tmp, "wb.png"), "wb") as f:
            f.write(src)
        ps = ("$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Drawing;"
              f"$wb=[Drawing.Image]::FromFile('{q(os.path.join(tmp, 'wb.png'))}');$bd=[Drawing.Image]::FromFile('{q(badge)}');"
              "$at=New-Object Drawing.Imaging.ImageAttributes;$at.SetWrapMode([Drawing.Drawing2D.WrapMode]::TileFlipXY);"
              f"foreach($n in {','.join(map(str, sizes))}){{$bm=New-Object Drawing.Bitmap $n,$n;$g=[Drawing.Graphics]::FromImage($bm);"
              "$g.InterpolationMode='HighQualityBicubic';$g.PixelOffsetMode='HighQuality';$g.CompositingQuality='HighQuality';"
              "$g.DrawImage($wb,(New-Object Drawing.Rectangle 0,0,$n,$n),0,0,$wb.Width,$wb.Height,'Pixel',$at);"
              f"$w=[math]::Round($n*{BADGE_FRAC});$h=[math]::Round($w*$bd.Height/$bd.Width);"
              "$g.DrawImage($bd,(New-Object Drawing.Rectangle ($n-$w),($n-$h),$w,$h),0,0,$bd.Width,$bd.Height,'Pixel',$at);"
              f"$g.Dispose();$bm.Save((Join-Path '{q(tmp)}' ([string]$n+'.png')),[Drawing.Imaging.ImageFormat]::Png);$bm.Dispose()}}"
              "$wb.Dispose();$bd.Dispose()")
        try:
            subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps], creationflags=NO_WINDOW,
                           capture_output=True, timeout=60, check=True)
            pngs = [open(os.path.join(tmp, f"{n}.png"), "rb").read() for n in sizes]
        except (OSError, subprocess.SubprocessError):
            return None
    out = os.path.join(target, "shortcut.ico")
    head, off = struct.pack("<HHH", 0, 1, len(sizes)), 6 + 16 * len(sizes)
    for n, png in zip(sizes, pngs):
        head += struct.pack("<BBBBHHII", n % 256, n % 256, 0, 0, 1, 32, len(png), off)
        off += len(png)
    with open(out, "wb") as f:
        f.write(head + b"".join(pngs))
    return out


def make_lnk(lnk, target_exe, workdir, icon=None):
    q = lambda s: s.replace("'", "''")
    icon_loc = f"{icon},0" if icon else f"{target_exe},0"
    ps = (f"$s=(New-Object -ComObject WScript.Shell).CreateShortcut('{q(lnk)}');$s.TargetPath='{q(target_exe)}';"
          f"$s.WorkingDirectory='{q(workdir)}';$s.IconLocation='{q(icon_loc)}';"
          "$s.Description='MySQL Workbench with the KGP Talkie notebook plugin';$s.Save()")
    subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps], creationflags=NO_WINDOW,
                   capture_output=True, timeout=60, check=True)


def install(target, shortcuts):
    if box(f"Install {APP}?\n\nIt adds a \"{APP}\" shortcut to your Desktop and Start menu: MySQL Workbench "
           "with the notebook cells, the Explorer and the activity bar.\n\n"
           "MySQL Workbench itself is not changed. Its normal shortcut still opens plain Workbench.", 0x24) != 6:
        return 0
    if not find_wb()[0]:
        if box("MySQL Workbench 26 was not found on this PC. Install anyway?", 0x34) != 6:
            return 1
    target = os.path.abspath(target)
    os.makedirs(target, exist_ok=True)
    dst = os.path.join(target, EXE_NAME)
    if os.path.normcase(dst) != os.path.normcase(SELF):
        quit_server()                                    # an installed server holds the old exe open
        for i in range(20):
            try:
                shutil.copy2(SELF, dst)
                break
            except PermissionError:
                if i == 19:
                    raise
                time.sleep(0.5)
    os.makedirs(os.path.join(target, "plugin"), exist_ok=True)
    shutil.copy2(os.path.join(bundled_plugin(), "kgptalkie-plugin.js"), os.path.join(target, "plugin", "kgptalkie-plugin.js"))
    links = []
    if shortcuts:
        icon = make_shortcut_icon(target)
        for folder in (shell_folder(0x10), shell_folder(0x02)):        # Desktop, Start menu > Programs
            if folder:
                lnk = os.path.join(folder, f"{APP}.lnk")
                make_lnk(lnk, dst, target, icon)
                links.append(lnk)
        size_kb = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(target) for f in fs) // 1024
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, UNINST_KEY) as k:
            for name, val in (("DisplayName", APP), ("DisplayVersion", VERSION), ("Publisher", "KGP Talkie"),
                              ("DisplayIcon", icon or dst), ("InstallLocation", target),
                              ("UninstallString", f'"{dst}" --uninstall'),
                              ("QuietUninstallString", f'"{dst}" --uninstall --quiet')):
                winreg.SetValueEx(k, name, 0, winreg.REG_SZ, val)
            for name, val in (("NoModify", 1), ("NoRepair", 1), ("EstimatedSize", size_kb)):
                winreg.SetValueEx(k, name, 0, winreg.REG_DWORD, val)
    with open(os.path.join(target, "install.json"), "w", encoding="utf-8") as f:
        json.dump({"app": APP, "version": VERSION, "links": links, "registry": bool(shortcuts)}, f, indent=1)
    if box(f"{APP} is installed.\n\nOpen it now?", 0x24) == 6 and not QUIET:
        subprocess.Popen([dst], cwd=target, creationflags=DETACHED, close_fds=True)
    return 0


def uninstall():
    if not os.path.isfile(INFO):
        box(f"{APP} is not installed in this folder.", 0x10)
        return 1
    info = json.load(open(INFO, encoding="utf-8"))
    if box(f"Remove {APP}?\n\nMySQL Workbench itself stays installed.", 0x24) != 6:
        return 0
    quit_server()
    for lnk in info.get("links", []):
        if lnk.lower().endswith(".lnk") and os.path.isfile(lnk):
            os.remove(lnk)
    if info.get("registry"):
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, UNINST_KEY)
        except OSError:
            pass
    # Only our own files, after this process has exited (a running exe cannot delete itself). Output goes to nul: a
    # detached cmd has no console, and an error message (a file that is not there) would stop the rest of the line.
    d = HOME_DIR
    cmd = (f'ping -n 4 127.0.0.1 >nul 2>&1 & del /f /q "{os.path.join(d, EXE_NAME)}" >nul 2>&1'
           f' & rmdir /s /q "{os.path.join(d, "plugin")}" >nul 2>&1 & del /f /q "{os.path.join(d, "shortcut.ico")}" >nul 2>&1'
           f' & del /f /q "{INFO}" >nul 2>&1 & rmdir "{d}" >nul 2>&1')
    subprocess.Popen(f'cmd /s /c "{cmd}"', creationflags=NO_WINDOW | DETACHED, close_fds=True,
                     stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    box(f"{APP} was removed.")
    return 0


def main():
    global QUIET
    ap = argparse.ArgumentParser(prog=APP)
    ap.add_argument("--serve", action="store_true")
    ap.add_argument("--port", type=int, default=PORT)
    ap.add_argument("--install", action="store_true")
    ap.add_argument("--uninstall", action="store_true")
    ap.add_argument("--target", default=DEFAULT_TARGET)
    ap.add_argument("--no-shortcuts", action="store_true")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args()
    QUIET = a.quiet
    if a.serve:
        return serve(a.port)
    if a.uninstall:
        return uninstall()
    if a.install or not os.path.isfile(INFO):
        return install(a.target, not a.no_shortcuts)
    return launch()


if __name__ == "__main__":
    try:
        sys.exit(main() or 0)
    except SystemExit:
        raise
    except Exception:
        tb = traceback.format_exc()
        try:
            open(LOG, "a", encoding="utf-8").write(time.strftime("%Y-%m-%d %H:%M:%S ") + tb + "\n")
        except OSError:
            pass
        box(f"Something went wrong:\n\n{tb[-900:]}\n\nDetails: {LOG}", 0x10)
        sys.exit(1)
