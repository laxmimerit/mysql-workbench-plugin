<div align="center">

<img src="docs/images/logo.png" alt="Modern MySQL Workbench logo" width="128" height="128">

# Modern MySQL Workbench

**A Jupyter-style notebook for MySQL Workbench 26, with AI, result charts, exports and a VS Code-style workspace.**

A free plugin by KGP Talkie. It runs on top of your installed Workbench and does not change a single Workbench file.

[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
![Platform: Windows 10 and 11](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6.svg)
![MySQL Workbench 26](https://img.shields.io/badge/MySQL%20Workbench-26.10-00758F.svg)
![Version 10.0](https://img.shields.io/badge/version-10.0-brightgreen.svg)

[Install](#install) · [Features](#features) · [How it works](#how-it-works) · [Development](#development) ·
[Changelog](CHANGELOG.md)

![Get Started, Run All, results and a chart](docs/images/demo-run-all.gif)

</div>

## Contents

- [Features](#features)
- [Choosing an AI model](#choosing-an-ai-model)
- [Requirements](#requirements)
- [Install](#install)
- [Update and uninstall](#update-and-uninstall)
- [How it works](#how-it-works)
- [Privacy and security](#privacy-and-security)
- [Troubleshooting](#troubleshooting)
- [Repository layout](#repository-layout)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

### Notebook

- One box per cell, line numbers, `[n]` run counts, a play button on hover, Markdown cells that render when you
  leave them.
- Notebook bar: + Code, + Markdown, + AI Cell, Run All (waits for every statement), Clear All Outputs, Restart,
  Variables, Export.
- Command mode like Jupyter: Esc, then A/B add, D D delete, M/Y change type, C/X/V copy/cut/paste, Z undo. Every cell
  action is one undo step, and a deleted cell comes back with its output.
- The bar shows which server the notebook talks to, for example `Local · MySQL 9.4.0`, plus a Production or
  Read-only tag.

![Notebook with results](docs/images/1-notebook-results.png)

### Typing SQL

- MySQL keywords turn into capitals as you type. Names, strings, comments, `quoted` names and `{{variables}}` stay as
  typed, and one Ctrl+Z puts a word back. The keyword lists come from the
  [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) MySQL dialect, not a hand-kept list.
- Autocomplete matches in any case and fuzzily (`slt` finds SELECT, `cstm` finds customers), lists the columns after
  an alias or table name (`c.`), and inserts keywords in UPPERCASE, lowercase or as typed.
- Shift+Alt+F turns a query into one clause per line and back.

![Keywords in capitals as you type, columns after an alias, Ctrl+Enter](docs/images/demo-typing.gif)

### Results

- Search, per-column filters (`>500`, `1..5`, `null`, `!text`), sort, copy as CSV, TSV, JSON, Markdown or INSERT,
  save as CSV or JSON, a value viewer on double-click.
- Charts: bar, line, area, scatter and pie, stacked or horizontal, saved per cell.

![Search the result, then switch to a chart](docs/images/demo-results.gif)

![Chart view](docs/images/2-chart.png)

### Running safely

- `{{name}}` variables (asked once per session or saved with the notebook) and `{{env.NAME}}`.
- Asks before DROP, TRUNCATE, or DELETE / UPDATE without WHERE. Connections can be tagged Production or Read-only.
- Query timeout.

![Notebook Settings](docs/images/4-notebook-settings.png)

### AI

- OpenAI, Anthropic, OpenRouter, Ollama, or any OpenAI-compatible API (LM Studio, vLLM, LiteLLM).
- Explain a cell, optimize it (with its EXPLAIN plan), Fix with AI on errors, explain a result, and AI cells that
  turn plain words into SQL in the cell below.
- Your API key stays on your PC, encrypted (see [Privacy and security](#privacy-and-security)).
- Pick a model that is big enough. See [Choosing an AI model](#choosing-an-ai-model).

![An AI cell writes the SQL, then it runs](docs/images/demo-ai-cell.gif)

![Configure AI](docs/images/5-configure-ai.png)

### Files and schema

- Export the notebook as HTML (charts included), PDF, Markdown, `.sqlnb` or `.sql`. Import `.sql` or `.sqlnb`.
- Schema tree: Select Top 100 in Notebook and Describe in Notebook.
- A VS Code-style activity bar with an Explorer panel for a folder of `.sql` and notebook files, and a sample
  notebook (`sample_shop`) under Get Started.

## Choosing an AI model

**The plugin does not write the SQL. The model does.** The plugin sends your request and your table and column names
to the model you pick, and shows what comes back. A weak model gives weak SQL, however good the plugin is.

### Local models (Ollama, LM Studio)

- **Use a model with at least 8 to 9 billion parameters** (names with 8b, 9b, 12b, 14b, 27b and so on).
  The AI cell GIF above uses `qwen3.8:27b` on Ollama.
- **Tiny models (0.5b to 4b) are not good enough for SQL.** They make up table and column names, join the wrong
  columns, forget `GROUP BY`, and explain SQL that is not the SQL they wrote.
- **If you use a tiny model and the SQL is wrong, the plugin is not broken. The model is too small.** Please do not
  report this as a bug. Switch to a bigger model, or to a cloud model, and try again.
- A bigger model needs more memory. As a rough guide, an 8b to 9b model needs about 6 to 8 GB of free GPU memory
  (or RAM, and then it is slow). If your PC cannot run one, use a cloud model instead.

### Cloud models

If your PC cannot run an 8b or bigger model, use a cloud model. Cloud models are bigger and give better SQL.

- **Paid:** OpenAI, Anthropic or OpenRouter. Pick the provider in Configure AI and paste your API key.
- **Free:** several services give a free API key with daily or monthly limits. For example:
  - **Google Gemini** (Google AI Studio): pick **Custom (OpenAI-compatible)**, Base URL
    `https://generativelanguage.googleapis.com/v1beta/openai/`, and your Gemini API key.
  - **OpenRouter**: pick **OpenRouter** and a model whose name ends in `:free`.
  - **NVIDIA NIM** (build.nvidia.com): pick **Custom (OpenAI-compatible)**, Base URL
    `https://integrate.api.nvidia.com/v1`, and your NVIDIA API key.

Free offers, their limits and their model names change often. When you install the plugin, search the web for
"free AI API" or "free LLM API" to see what is on offer at that time. Read each service's terms first: some free tiers
may keep your requests or use them for training, so do not send private data to them.

## Requirements

| | |
|---|---|
| Operating system | Windows 10 or 11 (64-bit) |
| MySQL Workbench | 26 (the new Workbench that replaces Workbench 8 and MySQL Shell for VS Code). Tested with 26.10.0. |
| Rights | A normal user account. No admin rights are needed. |
| Optional | Microsoft Edge for PDF export (it ships with Windows). An AI provider account or a local Ollama for AI. |

## Install

1. Download `Modern-MySQL-Workbench-Setup.exe` from the
   [Releases page](https://github.com/laxmimerit/mysql-workbench-plugin/releases) (or build it, see
   [Development](#development)).
2. Run it. It installs for your user only, in `%LOCALAPPDATA%\Programs\Modern MySQL Workbench`, and
   adds a **Modern MySQL Workbench** shortcut to the Desktop and the Start menu.
3. Open **Modern MySQL Workbench**.

Plain MySQL Workbench stays exactly as it was and still opens from its own shortcut. Workbench allows one window per
profile, so close plain Workbench before you open Modern MySQL Workbench.

## Update and uninstall

- **Update:** run the new `Modern-MySQL-Workbench-Setup.exe`. It replaces the installed copy and keeps your settings and AI
  configuration.
- **Uninstall:** Settings > Apps > Installed apps > Modern MySQL Workbench > Uninstall. This removes the program folder, the
  shortcuts and the Apps entry. MySQL Workbench is not touched. Your AI settings stay in
  `%APPDATA%\Modern MySQL Workbench`; delete that folder too if you want them gone.

## How it works

MySQL Workbench 26 is an Electron app whose launcher accepts a `--renderer-url` option. The Modern MySQL Workbench shortcut
starts a small local server on `127.0.0.1:9241` and opens Workbench with that option. The server hands Workbench its
own installed frontend, read-only, with one extra `<script>`: `plugin/kgptalkie-plugin.js`. Nothing in the Workbench
install folder is modified, and the server stops by itself a few minutes after the last Workbench window closes.

`docs/internals/NOTEBOOK-PLAN.md` explains the Workbench internals the plugin relies on, and
`docs/SQLNB-FEATURES.md` maps every feature to the SQL Notebook Studio feature it ports.

## Privacy and security

- The plugin server listens on `127.0.0.1` only. Its file, AI and PDF endpoints answer Workbench's own page only
  (origin and host checks plus a custom header, so other web pages are refused).
- The Explorer reads files only; it never writes or deletes.
- AI API keys are stored with Windows DPAPI in `%APPDATA%\Modern MySQL Workbench\ai.json`, readable only by your Windows
  account. They are never sent to the page and never written into notebooks.
- AI requests go from the local server straight to the provider you choose. Result rows are sent only after you
  agree (or when you pick a local model or "Always allow").
- No telemetry.

Found a security problem? See [SECURITY.md](SECURITY.md).

## Troubleshooting

| Problem | What to do |
|---|---|
| "Port 9241 is in use by another program" | Another program holds the port. Close it, or open plain Workbench from its own shortcut. |
| "MySQL Workbench is already open without the plugin" | Close Workbench (File > Exit), then open Modern MySQL Workbench again. |
| "MySQL Workbench 26 was not found" | Install MySQL Workbench 26 first. The plugin looks in `%LOCALAPPDATA%\Programs` and `Program Files`. |
| PDF export fails | PDF export uses Microsoft Edge. Check that Edge is installed. |
| AI writes wrong SQL, makes up tables or columns | The model is too small. Use a local model with at least 8 to 9 billion parameters, or a cloud model. This is not a plugin bug. See [Choosing an AI model](#choosing-an-ai-model). |
| AI is very slow | A local model that does not fit in GPU memory runs on the CPU. Use a smaller (but at least 8b) model, or a cloud model. |
| Something else went wrong | The launcher writes details to `%TEMP%\modern-mysql-workbench.log`. Please attach it to a [bug report](https://github.com/laxmimerit/mysql-workbench-plugin/issues/new/choose). |

## Repository layout

| Path | What it is |
|---|---|
| `plugin/kgptalkie-plugin.js` | The plugin: everything that runs inside Workbench |
| `package/kgptalkie_workbench.py` | One program that is the installer, the launcher and the local server |
| `package/build.ps1` | Builds `package/dist/Modern-MySQL-Workbench-Setup.exe` with PyInstaller |
| `launch.py` | Starts the server from this folder and opens Workbench with the plugin (development) |
| `tools/` | `gen-keywords.mjs` (MySQL keyword lists from sql-formatter), `cdp.py` and `snap.js` (drive a Workbench started with a debug port) |
| `tests/` | The hidden test environment and the tests (see [tests/README.md](tests/README.md)) |
| `docs/` | Feature map, notes on Workbench internals, screenshots |
| `.github/` | Issue and pull request templates, CI checks |

## Development

Requirements: Node.js 22 or later, Python 3.12 or later with `requests` and `websocket-client` (test tools), and
PyInstaller (installer build).

```bash
npm install
npm run keywords
py launch.py
```

`npm run keywords` rewrites the block between `KEYWORDS:BEGIN` and `KEYWORDS:END` in `plugin/kgptalkie-plugin.js`. Run it
after updating sql-formatter. `npm run check` checks the syntax of the plugin and the Python programs.

Build the installer:

```bash
powershell -File package/build.ps1
```

Every change is tested in a separate, hidden Workbench with its own profile and a throwaway MySQL server, never in
your everyday Workbench. See [tests/README.md](tests/README.md).

## Contributing

Bug reports and ideas are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md) first.

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). If you redistribute this plugin or a work based on
it, keep the NOTICE file with it. Third-party licenses are in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).

### Trademarks

The license covers the code, not the names. "KGP Talkie" and its logo are not licensed for use by forks; if you
publish a fork, give it your own name. MySQL and MySQL Workbench are trademarks of Oracle and/or its affiliates. This
plugin is not made, endorsed or supported by Oracle.
