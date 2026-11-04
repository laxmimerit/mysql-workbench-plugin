# Changelog

Versions read like 26.10.0.1: the first three numbers are the MySQL Workbench version the plugin is made
and tested for (26.10.0), the last number is our release for it (1, 2, 3...).

## 26.10.0.2

For MySQL Workbench 26.10.0. Installer and launcher fix; the plugin itself is unchanged.

- No more "Failed to remove temporary directory" warning. The launcher starts the plugin server from the same exe,
  and the server used to run from the launcher's own unpacked temp folder (`_MEI...`), so the launcher could not
  delete that folder when it closed. Each program the exe starts now gets its own folder.

## 26.10.0.1

First release, for MySQL Workbench 26.10.0.

- Version guard. MySQL Workbench updates itself, and an update can change the parts of Workbench the plugin builds
  on. The plugin now checks for them before it touches a notebook or a SQL workspace. When something is missing, or
  the plugin keeps failing, it turns itself off cleanly: everything it added is taken out, the editor settings go
  back to Workbench's own, and a short note says that Workbench works as normal and that a newer plugin is needed.
  It stays off for that Workbench and plugin version only, so the next update of either tries again.
- The plugin server tells the plugin which Workbench version is running.
- New shortcut icon: your own MySQL Workbench icon with a small notebook badge in the corner. The installer makes
  it on your PC from the Workbench you have installed; if it cannot, the shortcut uses the teal logo.
- The README logo is the same picture as the shortcut icon. The installer exe uses a teal logo (a database and a
  notebook card on a teal grid tile).
- README: a guide to choosing an AI model, an FAQ and GIFs.

### Internal build 10

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

### Internal build 9

- Every MySQL feature of SQL Notebook Studio: result search, filters, sort, copy and save; charts; variables; safety
  confirms; Production and Read-only tags; query timeout; HTML, PDF, Markdown, `.sqlnb` and `.sql` export and import;
  Select Top 100 and Describe in Notebook; a sample notebook; columns after an alias in autocomplete.

### Internal build 8

- AI: OpenAI, Anthropic, OpenRouter, Ollama or any OpenAI-compatible API. Explain, Optimize, Fix with AI, Explain
  result, and AI cells.

### Internal builds 7 and earlier

- Jupyter-style notebook look, command mode and undo, VS Code-style activity bar and Explorer, the one-file installer.
