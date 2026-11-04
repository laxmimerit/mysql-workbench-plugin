# Workbench 26 notebook makeover (2026-11-04)

## BUILT: plugin v4 (2026-11-04), see the repository root
- `plugin/kgp-plugin.js` v4: everything below (steps 1-4) works, tested in the hidden test instance against the
  throwaway server: per-cell line numbers, hover/focus play button, notebook bar (+ Cell, Run All, Clear All
  Outputs), cell bar (up, down, add below, delete). Run All skips empty and `\` cells and stops at the first error.
  Moving cells clears the two moved cells' outputs. Counts keep rising after Clear All (like Jupyter).
- Loads by itself from `server.py` after a page reload (no CDP injection). Screens in `screens/`.
- `launch.py` + `Workbench (KGP).lnk`: starts the server if port 9241 is free (refuses if another program holds
  it), then Workbench with `--renderer-url`. Workbench is one window per profile: close plain Workbench first.
- Step 5's `index.html` edit is NOT used; the plugin route replaces it.

## v5 (2026-11-04, live in the creator's Workbench by his request; v4 kept as `plugin/kgp-plugin.v4.js`)
- VS Code cell bar: Run Above, Run Cell and Below, Split Cell, More (...), Delete. More: run, add code/markdown
  above/below, move up/down, split, join with next, format, change to markdown/code, clear output, delete.
- "+ Code / + Markdown" between cells on hover and always below the last cell; notebook bar + Code, + Markdown,
  Run All, Clear All Outputs, Suggestions (autocomplete pop-up on/off, kept in localStorage; Ctrl+Space always works).
- Markdown cells are real cells (language "markdown", saved by the app). Rendered = Monaco `setHiddenAreas` on its
  lines plus an HTML view zone; every zone, including the app's result zones, gets `showInHiddenAreas` or it vanishes
  when the next line is hidden. Double-click / Edit to change; Ctrl+Enter renders, Shift+Enter renders and moves on.
- Shift+Alt+F in a code cell: one clause per line (SELECT / FROM / WHERE with AND/OR indented / GROUP BY / ORDER BY /
  joins / LIMIT; subqueries stay inline) <-> one line. Round-trips exactly. Overrides the app's own formatter there.
- Top bar folded into a chip on the right of the tab strip (connection, user@host, Connected, AUTO-COMMIT); click
  opens/closes the real bar. Status line "OK, N records retrieved in X ms" unchanged (creator: "current style is good").
- Testing: a hidden window that was never shown does not paint, so `Page.captureScreenshot` hangs. `cdp.py --snap`
  renders the DOM into a PNG inside the page instead (`tools/snap.js`); icon fonts may come out as boxes.

## v6 (2026-11-04, live in the creator's Workbench; v5 kept as `plugin/kgp-plugin.v5.js`)
- Removed: Split Cell, Join With Next Cell, the Suggestions toolbar button.
- Settings > Code Editor > "Notebook Autocomplete" checkbox (the Settings page is its own Preact root, the
  `#settingsDialog` portal; the row is pushed into the `editor` category of `state.settingsTree`).
- Undo: each cell action (insert, delete, move, format, change type, paste) is ONE custom element on Monaco's
  undo stack (`m._undoRedoService.pushElement`); the action's own text edits are taken back off `_editStacks`
  `_past`/`_future`. Undo/redo restore a snapshot (text, type, output via `ctx.setResult(resultData)`, count).
  Ctrl+Z walks typing and cell actions in true order. Tested: delete -> undo -> redo -> undo, typing + move.
- Esc = command mode (focus on a hidden `.kgpSink` in the notebook bar, caret hidden): Enter, Up/Down, J/K,
  A, B, D D, Z, Shift+Z, Ctrl+Z/Y, M, Y, C, X, V, Shift+V, Shift+Enter, Ctrl+Enter, Home, End.
- Bottom right of every cell: SQL / Markdown toggle. Moving cells now keeps their outputs.
- Restart: clear all outputs and count from [1] again (the MySQL session itself is not reset).
- Export: notebook as .sql (markdown as `--` comments) through the app's own `saveFile` host message
  (`window.electronHost.postMessage`, frozen object: cannot be stubbed in tests; use `kgpActions.exportText`).
- Fixed: plugin crashed on a normal launch (body not there yet in <head>); selection highlight hid the text
  (`.view-overlays{isolation:isolate}`); type switch acted on the caret's cell, not the clicked one.

## v7 (2026-11-04): VS Code-style activity bar + Explorer (v6 kept as `plugin/kgp-plugin.v6.js`)
- Dark 48 px activity bar left of the app (`#root` turned into a row): Explorer, Database, Administration, Oracle
  Cloud, and Settings at the bottom. Clicking the active icon folds the sidebar (it presses Workbench's own
  `#desktopWorkspaceSidebarToggle`, so the app keeps its state); `#desktopSidebarHeader` is hidden.
- Database / Administration / Oracle Cloud show Workbench's own accordion sections one at a time at full height
  (classes `kgpHideSec` / `kgpFullSec` on the `[id$=SectionHost]` elements). Without a connection the sidebar has
  Connections + OCI, so Database shows Connections and the Administration icon is hidden; once connected
  Database shows Schemas.
- Explorer: folder tree (dirs first, chevrons, VS Code-like icons, remembered folder and open dirs in localStorage).
  Open Folder uses the host's own `showOpenDialog` (id `kgpOpenFolder`); the reply is taken by wrapping
  `electronHost.setMessageHandler` and everything else is passed to `window.onNativeMessage`.
  Clicking a .sql/.mysql/.js/.ts/.mysql-notebook file calls DocumentModule `openSupportedFile` (the File > Open path).
- Disk access: server.py `/kgp/fs/list|read|home`, read-only; Origin must be http://127.0.0.1:9241 or app://renderer,
  header X-KGP: 1 (forces a refused CORS preflight for any other site), Host checked, reads only Workbench file types,
  20 MB cap. So the Explorer needs server.py running (the launcher starts it).
- Tested in the hidden copy: panels with and without a connection, fold/unfold, real Open Folder dialog (path typed
  into the native dialog), opening queries.sql into a tab. A file opened while only a Server Status page exists
  makes Workbench open a new connection page (asks the password when it is not saved), same as File > Open.

## Done
- Jupyter-style notebook (VS Code look) in `docs/internals/wb-theme.js`: one rounded box per statement, count `[n]` / `[*]` / `[ ]` at the left, results on white, green tick before the kept status line "OK, N records retrieved in X ms", wrapped errors on a soft red panel, blue outline and side bar on the focused cell. Also everything from the approved `wb-look.js` (top bar hidden, result toolbar hidden, 9 px status, fitted results, wheel scroll). Tested: single-line and multi-line cells, tables, errors, the running state. Screens: `notebook-before-after.png`, `notebook-after-errors-multiline.png`.
- Test driver: Workbench started with `--remote-debugging-port=9229 --remote-allow-origins=http://127.0.0.1:9229` (127.0.0.1 only), then `tools/cdp.py` runs JS (`-f file`), screenshots the page (`--shot`) and sends page-only mouse, keys and text (`--click/--move/--rclick/--key/--type`). No keystrokes reach other windows.

## To do, in order (the creator asked for all of these)
1. **Line numbers inside each cell** (per cell, starting at 1), inside the grey box left of the code, like VS Code. Plan: widen the gutter (`MW` 100, box edge `BX` 66), a `linesDecorationsClassName` per line `kgpLn kgpLn<k>` with dynamic `::before{content:'<k>'}` rules.
2. **Play button** in the left gutter on the first line, shown when the cell is hovered or focused, count beside it. Glyph: codicon play `\eb2c`. Click: capture-phase mousedown on the editor DOM, restrict `.kgpP` div to the icon (CSS width/left !important), set the cursor in the cell, then `codeEditor.executeSelectedOrAll({advance:false})` (stays in the cell, like Jupyter). Hover cell from `ed.onMouseMove` (`target.position`, or `target.detail.afterLineNumber` for zones; my top zones carry `data-kcell`).
3. **Notebook toolbar** above the editor: `+ Cell` (codicon add `\ea60`), `Run All` (run-all `\eb9e`), `Clear All Outputs` (clear-all `\eabf`). Insert a strip before `.editorHost` in its flex-column parent; re-add it in `find()` if Preact drops it.
   - Clear All: `codeEditor.removeAllResults()`; counts then show `[ ]` (show a number only while `resultData` exists; forget it in `R.seen` when cleared).
   - Run All: for each context, skip empty and `\` commands, cursor into it, `doExecuteContext({advance:false})`, wait for `presentation.loadingState` to go busy then `idle`.
   - + Cell: below the focused cell. Last cell: `prepareNextExecutionBlock(-1)`. Otherwise insert "\n" at the end of its last line with `codeEditor.updateExecutionContexts` replaced by a no-op during the edit, `movePosition(+1)` every later context, then `p = props.createResultPresentation(codeEditor, language); p.startLine = p.endLine = L; executionContexts.insertContext(i+1, p)`.
4. **Cell toolbar** at the top-right of the cell, sitting on its top border inside the top cap zone (zone is `suppressMouseDown`, so clicks reach it), on hover/focus: move up (`\eaa1`), move down (`\ea9a`), delete (`\ea81`).
   - Delete: `executionContexts.removeContexts([i])`, then delete its lines with `updateExecutionContexts` suppressed (not last: range (s,1)-(e+1,1); last: (prevEnd,maxCol)-(e,maxCol)), then `movePosition(-n)` the later contexts. A plain text delete is wrong: an edit spanning two cells makes the app merge them and drop the first one's result.
   - Move: swap the code of two neighbouring cells with `setExecutionBlockLanguageAndText` (the app's own in-cell edit path, which moves later cells itself). Their results are cleared (they show `[ ]`); keeping outputs through a move would mean moving the app's result zones, not attempted.
   - Ctrl+Z after these actions can desync cells from text: note it, do not use on camera.
5. Test all of it with `cdp.py`, show screenshots, then make the theme permanent: one `<script src="kgp-theme.js">` line in `resources/app/frontend/build/index.html` (CSP allows 'self' scripts), backup first, plus a re-apply script for Workbench updates.

## The source repo (checked 2026-11-04)
- https://github.com/mysql/mysql-shell-plugins, shallow clone in `ext/mysql-shell-plugins` (commit 7332e92,
  VERSION 26.10.0 = our installed Workbench). It is the full Workbench source: Preact frontend `gui/frontend`,
  Electron host `gui/electron`, Python backend `gui/backend/gui_plugin`, developer guide `gui/WORKBENCH_DEV.md`.
- "Plugins" there are MySQL Shell Python plugins (`%AppData%\MySQL\mysqlsh\plugins`): backend functions only. They
  cannot change the notebook screen. The frontend has no UI add-on, user-script or custom-CSS hook; it talks to the
  backend only through Electron's preload bridge (`window.electronDesktopBackend`), so it does not run in a plain browser.
- Where our look lives in source: `src/modules/db-editor/Notebook.tsx` (767 lines; it already renders a
  `DocumentToolbar` with execute, format, find), `src/components/ui/CodeEditor/CodeEditor.tsx` (2379) and `.css`
  (the `sql>` prompts, `decorationSet-*` setting `editor.theming.decorationSet`), `src/script-execution/` (execution
  contexts, `PresentationInterface.tsx` with `maxAutoHeight.resultSets = 352`).
- Build: Node 22.12+ (this PC: v26.13.0, npm 11.20.0); `npm --prefix gui/frontend install` (13 deps, 49 dev deps),
  `npm run build-win`; unit tests with vitest (`src/tests/unit-tests`, e.g. `components/ui/CodeEditor/CodeEditor.spec.tsx`).
  A dev runtime can use the installed Workbench's bundled shell tree (`resources/app/shell` has bin, lib, share) via
  `package_desktop.sh --dev --mysqlsh-tree=...`, copied, not modified.
- Routes: (1) Python Shell plugin: no UI, ruled out. (2) Our own patch branch on the 26.10.0 frontend source, built
  and dropped into `resources/app/frontend/build` (backup first); tested headless with vitest, type-check and lint,
  plus screenshots from a hidden dev window driven over CDP, never the creator's Workbench. Rebuild after each
  Workbench update. (3) Keep the injected script as a separate file loaded by one line in `index.html`.

## Route 4: a frontend plugin, no source or install change (proved 2026-11-04)
- Workbench's own launcher (`resources/app/src/main.cjs`) takes `--renderer-url=<url>` (load the screen from that
  address and trust only its origin; nothing else changes), `--electron-user-data-dir=<dir>` (separate profile, own
  single-instance lock) and `--electron-e2e-background=true` (hidden window). These are its developer and test switches.
- `server.py` serves Workbench's own frontend build read-only from the install folder and
  adds one `<script src="/kgp/kgp-plugin.js">` to `index.html` on the fly; plugin files live in `plugin/`. Binds
  127.0.0.1 only. Workbench started with `--renderer-url=http://127.0.0.1:9241/` gets the plugin; started normally,
  it is plain Workbench. Nothing of Oracle's is modified.
- Proof: hidden test instance with its own profile (`test-profile/`), debug port 9230. Plugin script, style and
  loop all present. A screenshot of the hidden window works after `Emulation.setDeviceMetricsOverride`
  (the plain capture times out). Test instance and server stopped afterwards; the creator's Workbench untouched.
- For notebook tests without the creator's server or password: a throwaway MySQL server, as the repo's e2e tests do
  (`gui/electron/tests/e2e`, sandbox mysqld). Could be started from the installed 9.7 binaries with a temp data
  dir, `--initialize-insecure`, port 3310, localhost only, deleted after. Needs the creator's OK.
- Day-to-day use: a "Workbench (KGP)" shortcut that starts the server and Workbench with the switch.
  Small local risk: a page served on that port gets Workbench's backend bridge, so the server must own the port
  (fixed port, launcher checks it is ours).

## App internals used (Workbench 26.10.0)
- Notebook editor component: the Preact component `_CodeEditor` whose `editor` DOM has `scriptingConsole`. Methods: `executeSelectedOrAll`, `doExecuteContext`, `prepareNextExecutionBlock`, `addExecutionBlock`, `setExecutionBlockLanguageAndText`, `removeAllResults`, `updateExecutionContexts`, `currentBlockIndex`.
- `model.executionContexts`: `content[]`, `contextAt`, `addContext`, `insertContext`, `removeContexts`, `contextFromPosition`, `removeAllResults`. A context: `startLine`/`endLine` (setters), `movePosition(n)`, `removeResult()`, `presentation` (`loadingState`, `resultData`, `renderTarget`, `zoneInfo.zoneId`).
- Backspace at a cell start does nothing; the app has no delete-cell command.
- Result zone margin `.zoneMargin` gets `monaco-view-zone="<zoneId>"`; the theme reuses its `::before` as the blue focus bar.
- Monaco orders zones after one line by `ordinal ?? afterColumn ?? 1e4`; bottom caps use 0, top caps 1e9.
- Completion (v9): one provider for msg/mysql/sql in `suggestController.model._languageFeaturesService.completionProvider._entries` (prototype `provideCompletionItems(model, pos)` -> `pa.instance.getCodeCompletionItems(ctx, pos)`). Monaco already filters any case and fuzzy. After an alias (`c.`) it returns "No Suggestions"; the plugin wraps it on the instance (teardown deletes the own property) and adds `information_schema.COLUMNS` rows via `connection.backend.execute`.
- Run All: `runSQLCode` posts the first statement's result long before the last statement finishes; the plugin counts running `runSQLCode` calls (`W.kgpSqlRunning`) and waits for 0.
