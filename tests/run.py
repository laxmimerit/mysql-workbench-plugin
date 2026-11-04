"""Run in-page tests from tests/js/ in the test Workbench and print what each returns.

    py tests/run.py                      list the tests
    py tests/run.py results-filters      run one (or several, or "all")

Each test is one JavaScript expression that drives the notebook through the plugin's own APIs and returns a JSON
report. Reports are also written to tests/results/<name>.json (not committed). Most tests need an open notebook on
the throwaway server (py tests/connect.py); the AI tests also need an AI provider set up in Configure AI.
"""
import glob
import json
import os
import sys
import time

from wbtest import TESTS, Page

JS = os.path.join(TESTS, "js")
OUT = os.path.join(TESTS, "results")
# "all" runs these, in this order. ai*.js need a configured model; screenshot-setup.js is for tests/screenshots.py.
ALL = ["keyword-capitals-unit", "completion", "completion-at-caret", "autocomplete-keyword-case", "results-filters",
       "results-copy", "results-chart", "run-safety", "export-import", "export-html-chart", "import", "schema-tree"]

names = sorted(os.path.splitext(os.path.basename(f))[0] for f in glob.glob(os.path.join(JS, "*.js")))
want = sys.argv[1:]
if not want:
    print("Tests:", ", ".join(names))
    print('Run: py tests/run.py <name> ... or "all"')
    raise SystemExit(0)
if want == ["all"]:
    want = ALL
bad = [w for w in want if w not in names]
if bad:
    raise SystemExit("Unknown test: " + ", ".join(bad))

p = Page(timeout=300)
if not p.use_notebook():
    raise SystemExit("No notebook is open in the test Workbench. Run: py tests/connect.py")
os.makedirs(OUT, exist_ok=True)
failed = 0
for name in want:
    src = open(os.path.join(JS, name + ".js"), encoding="utf-8").read()
    t0 = time.time()
    try:
        v = p.js(src)
    except Exception as e:                       # noqa: BLE001 (report and go on with the next test)
        v, failed = {"error": str(e)}, failed + 1
    try:
        v = json.loads(v) if isinstance(v, str) else v
    except ValueError:
        pass
    err = p.js("window.kgptalkieErr || null")
    report = {"test": name, "seconds": round(time.time() - t0, 1), "pluginError": err, "result": v}
    with open(os.path.join(OUT, name + ".json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=1, ensure_ascii=False)
    print(f"== {name} ({report['seconds']} s){'  PLUGIN ERROR' if err else ''}")
    print(json.dumps(v, indent=1, ensure_ascii=False)[:4000])
raise SystemExit(1 if failed else 0)
