# Changelog

## 10.1

- Version guard. MySQL Workbench updates itself, and an update can change the parts of Workbench the plugin builds
  on. The plugin now checks for them before it touches a notebook or a SQL workspace. When something is missing, or
  the plugin keeps failing, it turns itself off cleanly: everything it added is taken out, the editor settings go
  back to Workbench's own, and a short note says that Workbench works as normal and that a newer plugin is needed.
  It stays off for that Workbench and plugin version only, so the next update of either tries again.
- The plugin server tells the plugin which Workbench version is running.
- README: a guide to choosing an AI model, an FAQ, a logo and GIFs.

## 10.0

- New name: **Modern MySQL Workbench** (shortcut, installer `Modern-MySQL-Workbench-Setup.exe`, install folder and
  Apps entry). AI settings now live in `%APPDATA%\Modern MySQL Workbench`.
- Fixed: the launcher did not recognise its own plugin server, so it could report "port in use" or "server did not
  start" instead of opening Workbench.
- MySQL keywords turn into capitals as you type. Names, strings, comments, quoted names and `{{variables}}` are left
  alone, and one Ctrl+Z puts a word back. Keyword lists are generated from sql-formatter's MySQL dialect. On by
  default; Notebook Settings turns it off.
- Keywords picked from autocomplete come in UPPERCASE (default), lowercase, or as typed (Notebook Settings).
- The notebook bar shows the connection and the server, for example "Local · MySQL 9.4.0".
- Fixed: a one-row result in a cell with several result tabs showed its header but not its row.
- Licensed under Apache 2.0, with a NOTICE file and third-party notices.

## 9.0

- Every MySQL feature of SQL Notebook Studio: result search, filters, sort, copy and save; charts; variables; safety
  confirms; Production and Read-only tags; query timeout; HTML, PDF, Markdown, `.sqlnb` and `.sql` export and import;
  Select Top 100 and Describe in Notebook; a sample notebook; columns after an alias in autocomplete.

## 8.0

- AI: OpenAI, Anthropic, OpenRouter, Ollama or any OpenAI-compatible API. Explain, Optimize, Fix with AI, Explain
  result, and AI cells.

## 7.0 and earlier

- Jupyter-style notebook look, command mode and undo, VS Code-style activity bar and Explorer, the one-file installer.
