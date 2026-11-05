# Tests

The plugin is tested inside a real MySQL Workbench 26, driven over the Chrome DevTools Protocol. Everything runs in
a separate, hidden test environment, so the Workbench and the databases you use every day are never touched.

| Part | Where | Notes |
|---|---|---|
| MySQL | `127.0.0.1:3310`, data in `test-mysql/` | Throwaway server, root with an empty password, localhost only. `kgptalkie_test` comes from `fixtures/kgptalkie_test.sql`. |
| Plugin server | `127.0.0.1:9241` | `package/kgptalkie_workbench.py --serve` from this repo. AI settings in `tests/.ai/`. |
| Workbench | debug port `9230`, profile `test-profile/` | Hidden unless started with `-Visible`. Port 9229 (an everyday Workbench) is refused by the helpers. |

## Setup

```bash
py -m pip install requests websocket-client
powershell -File tests/testenv.ps1 start
```

The first time only, open the test Workbench with `-Visible`, add a connection named **Test MySQL 3310** to
`127.0.0.1:3310`, user `root`, and do not save a password. After that the tests open it by themselves.

```bash
powershell -File tests/testenv.ps1 start -Visible
```

`status` shows what is running, `stop` stops the three parts again, and `start -Reseed` reloads `kgptalkie_test`.

## Running

```bash
py tests/connect.py
py tests/run.py all
py tests/undo_case_test.py
py tests/guard_test.py
py tests/explorer_test.py
py tests/typing_test.py "select name from kgptalkie_test.students where city is not null"
```

`connect.py` opens the test connection and a notebook. `run.py` runs the in-page tests in `js/` and writes each
report to `tests/results/` (not committed). Reports are JSON; read them after a change, and compare with the last
good run.

| Test | What it covers |
|---|---|
| `keyword-capitals-unit` | Which typed words become capitals (34 cases, reports `bad: 0` when all pass) |
| `typing_test.py`, `undo_case_test.py` | Capitals with real keystrokes, one Ctrl+Z undo, the switch in Notebook Settings |
| `completion`, `completion-at-caret` | Any-case and fuzzy matching, columns after an alias or table name |
| `autocomplete-keyword-case` | Keywords in UPPERCASE, lowercase or as typed |
| `results-filters`, `results-copy`, `results-chart` | Result bar, search, filters, sort, copy formats, value viewer, charts |
| `run-safety` | Risky statement detection, confirms, `{{variables}}`, Production and Read-only tags, query timeout |
| `export-import`, `export-html-chart`, `import` | HTML, Markdown, `.sqlnb` and `.sql` export and import, charts in HTML |
| `schema-tree` | Select Top 100 and Describe in Notebook on the schema tree |
| `guard_test.py` | The version guard: breaks a notebook editor method and the SQL runner on purpose, checks that the plugin turns itself off without a trace, that Workbench still runs SQL, that it stays off until the version changes, and that it comes back |
| `explorer_test.py` | Explorer New File and New Folder (subfolders in the name, existing and bad names, Escape) and the Search panel (Ctrl+Shift+F, results by file, a line opens the file there, no second tab, Match Case, Whole Word, Clear), in a temporary folder that is deleted afterwards |
| `sample-notebook`, `sample-results` | The sample notebook from Get Started, run from top to bottom |
| `ai`, `ai-cards` | Explain, Optimize, Fix with AI, AI cells. Need a model in Configure AI (a local Ollama model works) |

## Screenshots and GIFs

The README images come from this environment, in the light theme:

```bash
py tests/run.py screenshot-setup
py tests/screenshots.py
py tests/record_gif.py all
```

`screenshot-setup` empties the open notebook, adds the sample notebook and runs it; `screenshots.py` then saves the
five PNGs. `record_gif.py` films the hidden Workbench (scenes `run`, `typing`, `results`, `ai`) and needs ffmpeg on
PATH (or `FFMPEG` set). The `ai` scene sets the test server to Ollama with `qwen3.8:27b` (change it with
`OLLAMA_MODEL`); time spent waiting for the model is cut from the GIF.

When a feature is added or changed, make new screenshots and GIFs for it in the same change.
