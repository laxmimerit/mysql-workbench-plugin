"""Start MySQL Workbench 26 with the KGP plugin.

    pyw launch.py            (no console window; the "Workbench (KGP)" shortcut runs this)

1. Makes sure our plugin server answers on 127.0.0.1:9241. If the port is free it starts package/kgp_workbench.py --serve in the background.
   If something else holds the port, it stops: a page served there would get Workbench's backend bridge.
2. Starts Workbench with its own --renderer-url switch pointing at that server. Nothing of Workbench is modified;
   started from its normal shortcut, Workbench is plain again.
Note: Workbench allows one window per profile. If plain Workbench is already open, close it first.
"""
import ctypes, os, subprocess, sys, time, urllib.request

PORT = 9241
URL = f"http://127.0.0.1:{PORT}/"
HERE = os.path.dirname(os.path.abspath(__file__))
WB = os.path.join(os.environ["LOCALAPPDATA"], r"Programs\MySQL\MySQL Workbench\MySQL Workbench.exe")
MARK = b"KGP Workbench plugin"
NO_WINDOW, DETACHED = 0x08000000, 0x00000008


def box(msg):
    ctypes.windll.user32.MessageBoxW(None, msg, "Workbench (KGP)", 0x10)


def ours():
    """True: our server answers. False: port free. None: something else holds the port."""
    try:
        body = urllib.request.urlopen(URL + "kgp/kgp-plugin.js", timeout=2).read(400)
        return True if MARK in body else None
    except urllib.error.HTTPError:
        return None
    except OSError:
        return False


state = ours()
if state is None:
    box(f"Port {PORT} is in use by another program, so the KGP plugin was not started.\n"
        "Close that program, or start Workbench from its normal shortcut.")
    sys.exit(1)
if state is False:
    py = sys.executable.replace("pythonw.exe", "python.exe")
    subprocess.Popen([py, os.path.join(HERE, "package", "kgp_workbench.py"), "--serve", "--port", str(PORT)], cwd=os.path.join(HERE, "package"),
                     creationflags=NO_WINDOW | DETACHED, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        time.sleep(0.2)
        if ours():
            break
    else:
        box("The KGP plugin server did not start. Workbench was not opened.")
        sys.exit(1)

subprocess.Popen([WB, f"--renderer-url={URL}"], creationflags=DETACHED)
