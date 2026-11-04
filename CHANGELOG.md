# Changelog

## 10.0

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
