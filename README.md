# KGP Talkie MySQL Workbench plugin

A Jupyter-style notebook for **MySQL Workbench 26**, with AI, result charts, exports and a VS Code-style workspace.
It is built for MySQL only and runs on top of your installed Workbench without changing a single Workbench file.

![Notebook with results](docs/images/1-notebook-results.png)

## What it adds

**Notebook**
- One box per cell, line numbers, `[n]` run counts, a play button on hover, Markdown cells that render when you leave them.
- Notebook bar: + Code, + Markdown, + AI Cell, Run All (waits for every statement), Clear All Outputs, Restart, Variables, Export.
- Command mode like Jupyter: Esc, then A/B add, D D delete, M/Y change type, C/X/V copy/cut/paste, Z undo.
- The bar shows which server the notebook talks to, for example `Local · MySQL 9.4.0`, plus a Production or Read-only tag.

**Typing SQL**
- MySQL keywords turn into capitals as you type. Names, strings, comments, `quoted` names and `{{variables}}` stay as
  typed, and one Ctrl+Z puts a word back. The keyword lists come from the
  [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) MySQL dialect, not a hand-kept list.
- Autocomplete matches in any case and fuzzily (`slt` finds SELECT, `cstm` finds customers), lists the columns after
  an alias or table name (`c.`), and inserts keywords in UPPERCASE, lowercase or as typed.

![Autocomplete after an alias](docs/images/3-autocomplete.png)

**Results**
- Search, per-column filters (`>500`, `1..5`, `null`, `!text`), sort, copy as CSV, TSV, JSON, Markdown or INSERT,
  save as CSV or JSON, a value viewer on double-click.
- Charts: bar, line, area, scatter and pie, stacked or horizontal, saved per cell.

![Chart view](docs/images/2-chart.png)

**Running safely**
- `{{name}}` variables (asked once per session or saved with the notebook) and `{{env.NAME}}`.
- Asks before DROP, TRUNCATE, or DELETE / UPDATE without WHERE. Connections can be tagged Production or Read-only.
- Query timeout.

![Notebook Settings](docs/images/4-notebook-settings.png)

**AI**
- OpenAI, Anthropic, OpenRouter, Ollama, or any OpenAI-compatible API (LM Studio, vLLM, LiteLLM).
- Explain a cell, optimize it (with its EXPLAIN plan), Fix with AI on errors, explain a result, and AI cells that turn
  plain words into SQL in the cell below.
- Your API key is stored encrypted on your PC by the local plugin server (Windows DPAPI). It is never sent to the
  page and never written into notebooks.

![Configure AI](docs/images/5-configure-ai.png)

**Files and schema**
- Export the notebook as HTML (charts included), PDF, Markdown, `.sqlnb` or `.sql`. Import `.sql` or `.sqlnb`.
- Schema tree: Select Top 100 in Notebook and Describe in Notebook.
- An Explorer panel for a folder of `.sql` and notebook files, and a sample notebook (`sample_shop`) under Get Started.

## Install

Requirements: Windows 10 or 11 and MySQL Workbench 26 (the new Workbench, which replaces Workbench 8 and MySQL Shell
for VS Code).

1. Get `Workbench-KGP-Setup.exe` (from the releases page, or build it as shown under Development) and run it. It installs for your user only, in
   `%LOCALAPPDATA%\Programs\Workbench KGP`, with no admin rights.
2. Open **Workbench (KGP)** from the Desktop or the Start menu.

Plain MySQL Workbench stays exactly as it was and opens from its own shortcut as before. Uninstall from
Settings > Apps.

## How it works

Workbench 26 is an Electron app whose launcher accepts a `--renderer-url` option. The Workbench (KGP) shortcut
starts a small local server on `127.0.0.1:9241` and opens Workbench with that option. The server hands Workbench its
own installed frontend, read-only, with one extra `<script>`: `plugin/kgp-plugin.js`. Nothing in the Workbench
install folder is modified.

The server only listens on 127.0.0.1. Its file and AI endpoints answer Workbench's own page only (origin and host
checks plus a custom header), and it stops by itself a few minutes after the last Workbench window closes.

## Repository layout

| Path | What it is |
|---|---|
| `plugin/kgp-plugin.js` | The plugin: everything that runs inside Workbench |
| `package/kgp_workbench.py` | One program that is the installer, the launcher and the local server |
| `package/build.ps1` | Builds `package/dist/Workbench-KGP-Setup.exe` with PyInstaller |
| `launch.py` | Starts the server from this folder and opens Workbench with the plugin (development) |
| `tools/gen-keywords.mjs` | Regenerates the MySQL keyword lists inside the plugin from sql-formatter |
| `tools/cdp.py`, `tools/snap.js` | Test helpers: run JavaScript in a Workbench started with a debug port |
| `docs/` | Feature map, notes on Workbench internals, screenshots |

## Development

```bash
npm install
npm run keywords
py launch.py
```

`npm run keywords` rewrites the block between `KEYWORDS:BEGIN` and `KEYWORDS:END` in `plugin/kgp-plugin.js`. Run it
after updating sql-formatter.

To build the installer (needs Python 3 and PyInstaller):

```bash
powershell -File package/build.ps1
```

Risky changes are tested in a separate, hidden Workbench with its own profile and a throwaway MySQL server, never in
your everyday Workbench. `docs/scout/NOTEBOOK-PLAN.md` explains the Workbench internals the plugin relies on.

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). If you redistribute this plugin or a work based on
it, keep the NOTICE file with it. Third-party licenses are in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).

### Trademarks

The license covers the code, not the names. "KGP Talkie" and its logo are not licensed for use by forks; if you
publish a fork, give it your own name. MySQL and MySQL Workbench are trademarks of Oracle and/or its affiliates. This
plugin is not made, endorsed or supported by Oracle.
