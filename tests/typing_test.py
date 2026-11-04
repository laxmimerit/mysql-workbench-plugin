"""Type real keystrokes into the last notebook cell of the test Workbench and print what the cell holds.

    py tests/typing_test.py "select name from customers where "
    py tests/typing_test.py "select 1\\nfrom dual"        (\\n = Enter, with the suggestion list closed first)

Checks the keywords-in-capitals-as-you-type feature with real key events (not text edits).
"""
import json
import sys
import time

from wbtest import CLEAR_LAST, LAST_CELL, Page

if len(sys.argv) < 2:
    raise SystemExit(__doc__)
p = Page()
if not p.use_notebook():
    raise SystemExit("No notebook is open. Run: py tests/connect.py")
p.js(CLEAR_LAST)
p.type(sys.argv[1].replace("\\n", "\n"))
time.sleep(1.2)
p.key("Escape", "Escape", 27)
print(json.dumps({"text": p.js(LAST_CELL), "pluginError": p.js("window.kgptalkieErr || null")}, ensure_ascii=False))
