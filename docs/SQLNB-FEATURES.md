# SQL Notebook Studio features to bring into Modern MySQL Workbench

Reference: `D:\Apps\sql-notebook` (the creator's finished VS Code extension). READ-ONLY: never change it.
Scope (creator, 2026-11-04): every feature that applies to MySQL, including all AI features. Ignore DuckDB, SQLite,
PostgreSQL, SQL Server. Workbench already does connections (SSL/SSH, saved passwords), autocomplete basics and
multi-statement result tabs; we add what it lacks.

## Plan (phases, in order) and status
v8 (2026-11-04): AI done and tested in the hidden copy with Ollama qwen3.5:4b (explain, optimize with EXPLAIN FORMAT=TREE, fix, explain result, AI cell). AI cell = markdown context whose first line is `<!-- ai -->` (hidden); generated SQL cell starts with `-- AI-written from the cell above` and is replaced on re-run. Server: `package/kgptalkie_workbench.py` is now the one source (installer, launcher, server); `server.py` is the old dev copy. Test AI config: env KGPTALKIE_AI_DIR.
v9 (2026-11-04): all phases done and tested in the hidden copy. Run All waits for every statement of a multi-statement cell (W.kgptalkieSqlRunning).
| # | Feature | Status |
|---|---|---|
| A1 | AI backend in the plugin server: OpenAI, Anthropic, OpenRouter, Ollama, Custom; keys DPAPI-encrypted in %APPDATA%\Modern MySQL Workbench\ai.json, never sent to the page; /kgptalkie/ai/config, /models, /stream | done v8 |
| A2 | Configure AI dialog (provider, base URL, key, model list, test "Say OK") | done v8 |
| A3 | Cell menu: Explain, Optimize (EXPLAIN plan for single SELECT/WITH), Fix with AI on errors, Explain result (asks before sending 50 rows unless local model or Always allow) | done v8 |
| A4 | AI cell: plain words -> SQL into the cell below (replaces a previous generated cell), optional auto-run | done v8 |
| A5 | AI card under the cell: purple 3px border, title per kind, streaming Markdown, model name, Dismiss, Apply to cell / Add as new cell (DDL) / Copy SQL / Run it / Configure AI | done v8 |
| B1 | Result toolbar: Table/Chart, search, column filters, sort (click, ctrl-click adds), Copy (TSV, CSV, JSON, Markdown, INSERT), Save as CSV/JSON, Explain result | done v9 |
| B2 | Chart: bar/line/area/scatter/pie, X, Y multi, stack, horizontal, saved per cell (keyed by the cell text) | done v9 |
| B3 | Value viewer on double-click (pretty JSON, Copy) | done v9 |
| C1 | {{name}} variables (session prompt, notebook-saved values win), {{env.NAME}} via /kgptalkie/fs/env, Variables dialog | done v9 |
| C2 | Safety: confirm DROP/TRUNCATE/DELETE-UPDATE without WHERE (production / always / never), Production and Read-only connection tags (chip in the bar) | done v9 |
| C3 | Query timeout (KILL QUERY). Max rows = Workbench's own Result Set Page Size (sql.limitRowCount) | done v9 |
| D1 | Export: HTML (charts inline), PDF (POST /kgptalkie/doc/pdf, headless Edge), Markdown; export rows 500 | done v9 |
| D2 | .sqlnb export/import, .sql import (DELIMITER-aware, old /*markdown*/ blocks); import appends to the open notebook as one undo step | done v9 |
| E1 | Schema tree (native menu): Select Top 100 in Notebook, Describe in Notebook; Copy Name is Workbench's own | done v9 |
| E2 | Sample notebook (sample_shop) + Get Started (? in the bar). Completion: columns after alias/table (`c.`), dupes removed; any-case + fuzzy matching is Workbench's own (slt->SELECT, cstm->customers, CIT->city) | done v9 |
| G | v10 (from the extension's PROMPT-LOG): MySQL keywords in capitals as you type (sql-formatter word lists, names protected, Ctrl+Z undoes, on by default); autocomplete keyword case upper / lower / as typed; "Connection · MySQL x.y.z" on the notebook bar | done v10 |
| F | Notebook Settings (gear): timeout, confirm mode, connection tag, export rows. AI options in Configure AI. saveResults: not ported (Workbench saves notebooks without outputs; .sqlnb export keeps them) | done v9 |

Ad-hoc SQL from the plugin (schema for AI prompts, EXPLAIN, Describe): `_ConnectionWorkspace` props
`connection.backend.execute(sql)` -> `{columns:[{name,type}], rows:[[...]], executionTime, totalRowCount}`; errors throw
"MySQL Error (1046): ...". Same session as the notebook (USE carries over). Proved in the hidden copy 2026-11-04.

## AI prompts (copy exactly from `src/ai/prompts.ts`)
system(MySQL), explain, optimize(plan<=6000 chars), fix(error + failing statement i of n), explainResult(first 50 rows
CSV, total), generate(request). extractSql = last ```sql block; stripThinking removes <think>...</think>.
Schema text: `Current database: <db>` then one line per table `[view ]name(col type[ pk], ...)`, tables named in the
query first, max 80 tables, ~12000 chars; no default db -> first 5 databases, names qualified.

## Reference behaviour spec (from a read-only review of the extension)
### Grid
Rows 24 px, header 30, filter row 30, overscan 8. Auto width: header 600 12px +42, first 200 values (80 chars) mono +22,
clamp 64-380; `#` col max(44, digits*8+22), sticky. Resize handle 7 px, min 48. Pin (codicon pin/pinned) on header hover:
pinned columns first, sticky. Sort: click replaces, Shift+click adds; asc -> desc -> off; numbers numeric, else
Intl.Collator numeric base; NULL last; stable; priority subscript when >1.
Search (170 px "Search"): case-insensitive substring. Filters (funnel; placeholder `>10, 1..5` numbers else `contains`):
`null` / `!null` / `not null`; range `^(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)$` inclusive; `^(>=|<=|!=|<>|>|<|=)\s*(.+)$`
numeric when rhs numeric and (column numeric or rhs `^-?[\d.]+$`), else collator; NULL passes only != / <>;
`!text` not-contains (NULL passes); else contains (NULL never).
Copy/export use visible rows (after search/filter/sort). TSV: tab/CR/LF -> space. CSV: quote if /[",\n\r]/, "" doubling,
NULL "". Markdown: `|` -> `\|`, newline -> space, `---:` for numbers, NULL as NULL. JSON: array of objects, indent 2.
Save CSV with BOM, binary 0x hex. File name from /\bfrom\s+[`"[]?([\w.$]+)/i else "result". Keys: Ctrl+C cell (row TSV
on #), Ctrl+A all visible as TSV with header, arrows/PgUp/PgDn/Ctrl+Home/End, Enter viewer, Esc clear.
Viewer: inline panel under grid, header `col` + `row N · type · X chars`, Copy, Close; pre max-height 320, JSON indent 2.
Display: NULL muted italic; strings >500 cut with …; binary 0x upper hex 48 bytes purple; JSON orange; bool blue;
numbers right tabular-nums. Meta `[X of ]N rows · time`; "limit reached". fmtMs: <1 ms, N ms, X.XX s (<10 s),
X.X s (<60 s), M m S s. Empty: "No rows." / "No rows match the filters.". Error box: red 3px border 7% tint,
"Error in statement i of n (line L) · code", buttons "Fix with AI", Copy. Toolbar buttons 26x24, menus min 190 px.
### Chart (Chart.js in the reference; plain canvas/SVG is fine here)
Types bar, line, area (line+fill), scatter, pie (doughnut cutout 55%). Auto: X = first date col, else first string,
else col 0; Y = up to 3 numeric cols != X; line when X is date else bar. Controls: type, X select, Y checkboxes,
Stack (bar/area), Horizontal (bar), Save PNG. Max 5000 points (pie 60) with "First 5,000 rows". Points hidden >60.
Bar max thickness 48, radius 3, tension 0.25, height clamp(220, 320|640, 420). Colours #3794ff #d18616 #89d185
#b180d7 #f14c4c #cca700. Saved per cell: {"view":"chart","chart":{"type","x","y":[...],"stacked","horizontal"}}.
### AI card
3px purple left border, 5% tint; sparkle, title (Explanation / Optimization / Suggested fix / About this result /
Generated SQL / Set up AI), spinner while streaming, model name muted, Dismiss x (not for generate). Markdown body,
shimmer skeleton while waiting; generate hides code fences when done. Buttons: fix/optimize "Apply to cell" or
"Add as new cell" when SQL starts with create|alter|drop|analyze (after comments), "Copy SQL"; generate note
"SQL is in the cell below." + "Run it"; errors "Configure AI".
### Running / safety / variables
Splitter: DELIMITER lines, -- # /* */ comments, quotes with escapes, BEGIN..END depth for CREATE
TRIGGER/PROCEDURE/FUNCTION/EVENT. Stop = KILL QUERY <thread> from a second connection, "Query stopped.";
timeout "Stopped after N s". Write regex `^(INSERT|UPDATE|DELETE|MERGE|UPSERT|REPLACE|CREATE|ALTER|DROP|TRUNCATE|RENAME|GRANT|REVOKE|COMMENT|VACUUM|REINDEX|CLUSTER|COPY|LOAD|IMPORT|ATTACH|DETACH|CALL|EXEC|EXECUTE|DO|SET\s+PASSWORD|LOCK|OPTIMIZE|REPAIR|INSTALL|UNINSTALL)\b`
(+ SELECT ... INTO x FROM). Risks: `^DROP\s+(TABLE|DATABASE|SCHEMA|VIEW|INDEX)\b`, `^TRUNCATE\b`,
`^(DELETE|UPDATE)\b` without WHERE. Modal "Run <risks>, on "<conn>"?" + "This connection is tagged Production." /
"This statement cannot be undone.", button Run; cancel -> "Not run.". Read-only: refuse writes
`"<name>" is read-only. This statement changes data:`. Variables `\{\{\s*([A-Za-z_][\w.]*)\s*\}\}`, plain text,
notebook values win, then session values, `{{env.NAME}}`; prompt "Value for {{name}}"; cancel "Cancelled: a variable
has no value."; picker lists used/saved names, Add validated `^[A-Za-z_][\w.]*$`, empty value removes.
### Export
HTML: h1 file name (upper, muted), main max 980, light + dark; md rendered, SQL pre with simple highlight, AI cells
".prompt" labelled AI; "Statement i"; "✓ N rows affected"; tables sticky header max 520 + "N rows (limit reached) ·
first M shown"; errors pre.err; AI outputs as Markdown; footer "Exported from ... · date"; charts inline (first result,
fixed colours #3794ff #d18616 #2da44e #8250df #cf222e #bf8700, no animation). PDF: headless Edge
`--headless=new --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw --virtual-time-budget=4000 --print-to-pdf=<file>`.
Markdown: md as is, ```sql fences, `> **AI:** prompt`, tables as Markdown copy, `_N rows, first M shown._`, errors ```text.
### .sqlnb
Line 1 `-- sqlnb v1 {json}` (connection, variables). Cells `-- %% sql|md|ai {json}`; md/ai lines prefixed `-- `
(empty -> `--`); blank line after each cell; saved results `-- @output {json}` (200 rows). Text before first marker =
SQL cell. Cell metadata: view/chart, connection, generated.
### Tree / completion
Select Top 100: "SELECT *\nFROM `db`.`t`\nLIMIT 100;" ; Describe: "DESCRIBE `db`.`t`;" ; Copy Name (quoted). Runs in
the last empty cell or a new cell. Completion aliases from FROM/JOIN/UPDATE/INTO; `x.` -> columns of alias/table or
tables of db; extras SHOW TABLES, SHOW DATABASES, DESCRIBE, USE, AUTO_INCREMENT, IFNULL, GROUP_CONCAT, DATE_FORMAT,
STR_TO_DATE.
### Sample
Shop database: products by price; monthly_revenue as line chart; 3 statements in one cell; {{country}} variable;
AI cell "Top 5 customers by total spend". Walkthrough: open sample, connect, run/sort/chart, turn on AI.
