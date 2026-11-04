/* Modern MySQL Workbench plugin v10 (2026-11-05) by KGP Talkie, for MySQL Workbench 26.10.0.
   Copyright 2026 KGP Talkie (Laxmi Kant). Licensed under the Apache License 2.0; see LICENSE and NOTICE.
   v10: MySQL keywords in capitals as you type (word lists generated from sql-formatter, see tools/gen-keywords.mjs),
   keyword case for autocomplete (UPPERCASE / lowercase / as typed), "Connection · MySQL x.y.z" on the notebook bar. Loaded by package/kgptalkie_workbench.py through Workbench's own
   --renderer-url option; no Workbench file is changed.
   - Activity bar (VS Code): Explorer (a folder you open; .sql/.mysql/.js/.ts/.mysql-notebook open in Workbench),
     Schemas, Administration, Oracle Cloud as full-height panels, Settings. Files come from server.py's read-only /kgptalkie/fs/.
   - Recording look: top bar folded into a connection chip (click it to open the full bar), result toolbar hidden,
     9 px status line with a green tick, fitted results, wheel scrolling over results.
   - Jupyter-style notebook (VS Code look): one box per cell, line numbers, [n] / [*] / [ ] counts, play on hover.
   - Notebook bar: + Code, + Markdown, Run All, Clear All Outputs, Restart (clear and count from [1] again),
     Export (the notebook as a .sql file through the app's own Save dialog).
   - Settings > Code Editor > Notebook Autocomplete: the suggestion pop-up on or off (Ctrl+Space always works).
   - Cell bar (VS Code): Run Above, Run Cell and Below, More (...), Delete. More holds add above/below
     (code or markdown), move, format, change type, clear output. Bottom right of every cell: SQL / Markdown toggle.
   - "+ Code / + Markdown" between cells on hover and below the last cell.
   - Markdown cells: rendered when you leave them; double-click (or Edit) to change; Ctrl/Shift+Enter renders.
   - Shift+Alt+F in a code cell: one clause per line <-> one line.
   - Esc = command mode (no caret): Enter edit, Up/Down or J/K select, A/B add, D D delete, M/Y type, C/X/V copy/cut/paste,
     Z or Ctrl+Z undo, Shift+Z or Ctrl+Y redo, Shift+Enter run and select next, Ctrl+Enter run.
   - Every cell action is one undo step on the editor's own stack; a deleted cell comes back with its output.
   SQL Notebook Studio features (MySQL only), v9:
   - AI (keys stay in the server, encrypted): Configure AI, Explain, Optimize, Fix with AI, Explain Result, AI cells.
   - Results: per-column filters, sort, copy as CSV/TSV/JSON/Markdown/INSERT, value viewer, pinned results,
     charts (bar, line, area, pie, scatter; stacked, horizontal) saved per cell.
   - Running: {{variables}} (notebook, prompt, env.NAME), confirm before risky writes, read-only / production
     connection tags, query timeout. Run All waits for every statement of a cell.
   - Export .sql / .sqlnb / .html / .pdf / .md, import .sql / .sqlnb, a sample notebook (sample_shop), Get Started.
   - Schema tree: Select Top 100 / Describe in Notebook. Completion: columns after an alias or table name
     (Workbench's own completion already matches in any case and fuzzy).
   Safe to load again: it tears its previous copy down first. */
(() => {
 const W = window;
 if (W.kgptalkieLook) clearInterval(W.kgptalkieLook); if (W.kgptalkieRaf) cancelAnimationFrame(W.kgptalkieRaf);
 if (W.kgptalkieTeardown) { try { W.kgptalkieTeardown(); } catch (e) { } }
 const AC = new AbortController(); const DISP = [];
 const NB = 24, SC = 24, CAP = 10, CAPB = 24, GAP = 22, GAP0 = 14, OUTPAD = 6, RIGHT = 18, TRAIL = 46;
 const MW = 104, BX = 70;           // gutter: focus bar 3-6, play 10-30, count 30-64 | box from 70, line numbers to 96, code from 104
 const C = { bg: '#F7F7F7', bd: '#E3E3E3', focus: '#3B82C4', count: '#8A8A8A', ln: '#A8A8A8', lnF: '#6B6B6B' };
 const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
 const P = W.kgptalkiePrefs = { suggest: store.get('kgptalkieSuggest', '1') === '1', bar: store.get('kgptalkieTitleOpen', '0') === '1' };
 const barCls = () => { if (document.body) document.body.classList.toggle('kgptalkieTitleOpen', P.bar); }; barCls();   // body may not exist yet when loaded from <head>
 const css = `
body:not(.kgptalkieTitleOpen) #desktopWorkspaceTitlebar{display:none !important}
.resultStatus > .toolbar{display:none !important}
.resultStatus > .label{max-width:none !important;overflow:visible !important;color:#A3A3A3 !important;font-size:9px !important}
.resultStatus{background-color:#FDFDFD !important}
.scriptingConsole .editorPromptFirst::before,.scriptingConsole .editorPromptFirst::after,.scriptingConsole .statementStart::after{display:none !important}
.scriptingConsole .margin-view-overlays .statementError::after{display:none !important}
.scriptingConsole .view-overlays .kgptalkieL{background:${C.bg};border-right:1px solid ${C.bd};box-sizing:border-box;width:calc(100% - ${RIGHT}px) !important}
.scriptingConsole .view-overlays .kgptalkieL.kgptalkieF{border-right-color:${C.focus}}
.scriptingConsole .view-overlays{isolation:isolate}
.scriptingConsole .view-overlays > div > div:not(.kgptalkieL){z-index:1}
.scriptingConsole .kgptalkieM::after{content:'';position:absolute;left:${BX}px;right:0;top:0;bottom:0;background:${C.bg};border-left:1px solid ${C.bd}}
.scriptingConsole .kgptalkieM.kgptalkieF::after{border-left-color:${C.focus}}
.scriptingConsole .kgptalkieM.kgptalkieF::before{content:'';position:absolute;left:3px;width:3px;top:0;bottom:0;background:${C.focus};border-radius:2px}
.scriptingConsole .kgptalkieN::before{position:absolute;left:30px;width:34px;text-align:right;font-family:var(--msg-monospace-font-family),Consolas,monospace;font-size:11px;color:${C.count};line-height:${NB}px}
.scriptingConsole .kgptalkieN0::before{content:'[ ]'}
.scriptingConsole .kgptalkieNR::before{content:'[*]';color:${C.focus}}
.scriptingConsole .kgptalkieNM::before{content:'M\\2193';font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:10px;color:#9A9A9A}
.scriptingConsole .kgptalkieLn{z-index:1}
.scriptingConsole .kgptalkieLn::before{position:absolute;left:${BX + 2}px;width:${MW - BX - 10}px;text-align:right;font-family:var(--msg-monospace-font-family),Consolas,monospace;font-size:11px;color:${C.ln};line-height:${NB}px}
.scriptingConsole .kgptalkieLn.kgptalkieF::before{color:${C.lnF}}
.scriptingConsole .kgptalkieP{left:10px !important;width:20px !important;cursor:pointer;z-index:2}
.scriptingConsole .kgptalkieP::before{content:'\\eb2c';font-family:codicon;font-size:16px;line-height:${NB}px;display:none;width:20px;text-align:center;color:#4A4A4A}
.scriptingConsole .kgptalkieP.kgptalkiePV::before{display:block}
.scriptingConsole .kgptalkieP:hover::before{color:${C.focus}}
.kgptalkieCap{position:absolute;height:${CAP}px;background:${C.bg};border:0 solid ${C.bd};box-sizing:border-box}
.kgptalkieCap.t{bottom:0;border-top-width:1px}
.kgptalkieCap.b{top:0;border-bottom-width:1px}
.kgptalkieCap.c{left:0;right:${RIGHT}px;border-right-width:1px}
.kgptalkieCap.m{left:${BX}px;right:0;border-left-width:1px}
.kgptalkieCap.c.t{border-top-right-radius:6px}.kgptalkieCap.m.t{border-top-left-radius:6px}
.kgptalkieCap.c.b{border-bottom-right-radius:6px}.kgptalkieCap.m.b{border-bottom-left-radius:6px}
.kgptalkieCap.kgptalkieF{border-color:${C.focus}}
.kgptalkieBar{position:absolute;left:3px;width:3px;background:${C.focus};border-radius:2px;display:none}
.kgptalkieBar.kgptalkieF{display:block}
.kgptalkieBar.t{bottom:0;height:${CAP}px}.kgptalkieBar.b{top:0;height:${CAPB}px}
.kgptalkieCap.b{height:${CAPB}px}
.kgptalkieGap{position:absolute;left:0;right:${RIGHT}px;top:0}
.kgptalkieIns{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);display:none;justify-content:center;gap:8px;z-index:2}
.kgptalkieGap:hover .kgptalkieIns,.kgptalkieTrail .kgptalkieIns{display:flex}
.kgptalkieTrail .kgptalkieIns{opacity:.8}.kgptalkieTrail .kgptalkieIns:hover{opacity:1}
.kgptalkieIns button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 9px;border:1px solid #D9D9D9;border-radius:4px;background:#fff;color:#444;cursor:pointer;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:11.5px}
.kgptalkieIns button:hover{border-color:${C.focus};color:${C.focus}}
.kgptalkieIns .codicon{font-size:12px}
.kgptalkieCellBar{position:absolute;right:${RIGHT + 14}px;height:22px;display:none;align-items:center;padding:0 2px;background:#fff;border:1px solid #DDDDDD;border-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,.08);z-index:3}
.kgptalkieCellBar.kgptalkieShow,.kgptalkieCellBar.kgptalkieMenuOpen{display:flex}
.kgptalkieCellBar button,.kgptalkieNbBar button,.kgptalkieChip{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#4A4A4A;border-radius:4px}
.kgptalkieCellBar button{width:24px;height:18px}
.kgptalkieCellBar button:hover,.kgptalkieNbBar button:hover{background:#EBEEF2;color:#111}
.kgptalkieCellBar .codicon{font-size:14px}
.kgptalkieNbBar{flex:0 0 auto;display:flex;align-items:center;gap:2px;height:34px;padding:0 12px 0 ${BX - 8}px;background:#fff;border-bottom:1px solid #EDEDED;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:12px}
.kgptalkieNbBar button{gap:6px;padding:4px 9px;height:24px;white-space:nowrap;flex:0 0 auto}
.kgptalkieNbBar .codicon{font-size:14px}
.kgptalkieSink{position:absolute;left:0;top:0;width:1px;height:1px;opacity:0;overflow:hidden;outline:none}
.kgptalkieNbBar{position:relative}
.kgptalkieNbBar .kgptalkieSep{width:1px;height:16px;background:#E0E0E0;margin:0 6px}
.kgptalkieNbBar button.kgptalkieBusy{color:${C.focus}}
.kgptalkieNbBar button.kgptalkieOff{color:#9A9A9A}
.kgptalkieMenu{position:fixed;z-index:10000;min-width:230px;padding:4px 0;background:#fff;border:1px solid #D9D9D9;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.14);font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:12.5px;color:#222}
.kgptalkieMenu .it{display:flex;align-items:center;gap:18px;justify-content:space-between;padding:4px 14px;cursor:pointer;white-space:nowrap}
.kgptalkieMenu .it:hover{background:#E8F0FA}
.kgptalkieMenu .it.dis{color:#B0B0B0;pointer-events:none}
.kgptalkieMenu .it .k{color:#8A8A8A;font-size:11px}
.kgptalkieMenu .sep{height:1px;background:#EAEAEA;margin:4px 0}
.kgptalkieLang{all:unset;position:absolute;right:${RIGHT + 8}px;bottom:4px;height:16px;line-height:16px;padding:0 6px;border-radius:3px;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:11px;color:#8A8A8A;cursor:pointer;z-index:2;user-select:none}
.kgptalkieMdWrap .kgptalkieLang{right:8px}
.kgptalkieLang.kgptalkieLangAi{color:#7C3AED}
.kgptalkieNbBar .kgptalkieSp{flex:1}
.scriptingConsole .kgptalkieL.kgptalkieLA{background:#FBF9FF !important}
.kgptalkieAiHint{color:#A3A3A3 !important;font-style:italic}
.kgptalkieAiZone{box-sizing:border-box;padding:6px ${RIGHT}px 10px 0;cursor:auto}
.kgptalkieAi{border:1px solid #E7E0F5;border-left:3px solid #8B5CF6;background:#FBF9FF;border-radius:0 6px 6px 0;padding:8px 12px 10px;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:12.5px;color:#2B2B2B;user-select:text}
.kgptalkieAi.kgptalkieAi-error,.kgptalkieAi.kgptalkieAi-setup{border-left-color:#B42318;background:#FFFBFA}
.kgptalkieAiH{display:flex;align-items:center;gap:6px;height:22px;color:#5B3FA8;font-size:12px}
.kgptalkieAiH .codicon{font-size:14px}.kgptalkieAiH b{font-weight:600}
.kgptalkieAiM{color:#8A8A8A;margin-left:4px;font-size:11.5px}
.kgptalkieAiH .kgptalkieSp{flex:1}
.kgptalkieAiH button,.kgptalkieAiActs button,.kgptalkieFixBtn,.kgptalkieResAi{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:5px;cursor:pointer;border-radius:4px;color:#4A4A4A;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:12px}
.kgptalkieAiH button{width:22px;height:22px;justify-content:center}
.kgptalkieAiH button:hover,.kgptalkieAiActs button:hover,.kgptalkieFixBtn:hover,.kgptalkieResAi:hover{background:#EDE7FA;color:#3B2A80}
.kgptalkieAiB{margin-top:4px;font-size:12.5px;line-height:1.5}
.kgptalkieAiB p{margin:4px 0}.kgptalkieAiB ul,.kgptalkieAiB ol{margin:4px 0;padding-left:20px}
.kgptalkieAiB pre{background:#fff;border:1px solid #ECE7F6;border-radius:4px;padding:6px 8px;overflow:auto;font-size:12px}
.kgptalkieAiActs{display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-top:8px}
.kgptalkieAiActs button{height:24px;padding:0 9px;border:1px solid #DDD3F2;background:#fff}
.kgptalkieAiNote{display:inline-flex;align-items:center;gap:4px;color:#5B3FA8;margin-right:6px}
.kgptalkieAiSk i{display:block;height:9px;margin:7px 0;border-radius:4px;background:#ECE6F7;animation:kgptalkiePulse 1.2s ease-in-out infinite}
.kgptalkieAiSk i:nth-child(1){width:92%}.kgptalkieAiSk i:nth-child(2){width:74%}.kgptalkieAiSk i:nth-child(3){width:52%}
@keyframes kgptalkiePulse{50%{opacity:.45}}
.kgptalkieSpin{animation:kgptalkieSpin 1s linear infinite}@keyframes kgptalkieSpin{to{transform:rotate(360deg)}}
.kgptalkieFixBtn{margin:6px 0 2px 2px;height:24px;padding:0 9px;border:1px solid #DDD3F2;background:#fff;color:#5B3FA8}
.kgptalkieResAi{position:absolute;top:2px;right:6px;width:24px;height:22px;justify-content:center;z-index:5;color:#7C3AED;background:#fff}
.scriptingConsole .renderTarget:has(> .kgptalkieResBar){display:flex !important;flex-direction:column}
.scriptingConsole .renderTarget:has(> .kgptalkieResBar) > .resultHost{flex:1 1 auto;min-height:0}
.scriptingConsole .renderTarget.kgptalkieChartView > .resultHost{display:none !important}
.kgptalkieResBar{flex:0 0 auto;display:flex;align-items:center;gap:2px;height:30px;padding:0 4px 0 2px;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:12px;color:#555}
.kgptalkieResBar button,.kgptalkieChartCtl button,.kgptalkieViewerH button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:5px;min-width:26px;height:24px;padding:0 5px;border-radius:4px;cursor:pointer;color:#555}
.kgptalkieResBar button:hover,.kgptalkieChartCtl button:hover,.kgptalkieViewerH button:hover{background:#EBEEF2;color:#111}
.kgptalkieResBar button.on,.kgptalkieChartCtl button.on{color:#005FB8;background:#E8F0FA}
.kgptalkieResBar [data-r=ai]{color:#7C3AED}
.kgptalkieSeg{display:inline-flex;border:1px solid #DCDCDC;border-radius:5px;padding:1px;margin-right:6px}
.kgptalkieSeg button{height:22px;padding:0 8px}
.kgptalkieSearch{box-sizing:border-box;width:170px;height:24px;padding:0 8px;border:1px solid #DCDCDC;border-radius:4px;font:inherit;font-size:12px;color:#222;background:#fff;outline:none;margin-right:2px}
.kgptalkieSearch:focus{border-color:#3B82C4}
.kgptalkieResBar .kgptalkieSp,.kgptalkieChartCtl .kgptalkieSp,.kgptalkieViewerH .kgptalkieSp{flex:1}
.kgptalkieMeta{color:#8A8A8A;font-size:11.5px;margin-right:6px;white-space:nowrap}
.kgptalkieFRow{display:flex;gap:6px;padding:3px 3px;background:#FAFAFA;border-bottom:1px solid #E6E6E6;white-space:nowrap}
.kgptalkieFRow input{flex:0 0 auto;box-sizing:border-box;height:22px;padding:0 6px;border:1px solid #DCDCDC;border-radius:3px;font:inherit;font-size:11.5px;background:#fff;outline:none}
.kgptalkieFRow input:focus{border-color:#3B82C4}
.kgptalkiePin{font-size:12px !important;margin-left:4px;color:#9A9A9A;opacity:0;cursor:pointer;vertical-align:middle}
.tabulator-col:hover .kgptalkiePin,.kgptalkiePin.on{opacity:1}.kgptalkiePin.on{color:#005FB8}
.kgptalkieChartBox{flex:0 0 auto;padding:2px 2px 6px}
.kgptalkieChartCtl{display:flex;align-items:center;gap:2px;height:30px;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:12px;color:#555}
.kgptalkieChartCtl label{display:inline-flex;align-items:center;gap:4px;margin:0 4px 0 2px}
.kgptalkieChartCtl select{height:24px;border:1px solid #DCDCDC;border-radius:4px;font:inherit;font-size:12px;background:#fff;max-width:180px}
.kgptalkieChartCtl .kgptalkieYBtn{border:1px solid #DCDCDC;max-width:260px;overflow:hidden;white-space:nowrap}
.kgptalkieSepV{width:1px;height:16px;background:#E0E0E0;margin:0 4px}
.kgptalkieChartCut{color:#8A8A8A;font-size:11.5px;margin-right:6px}
.kgptalkieChartSvg{padding-top:4px}.kgptalkieChartSvg svg{display:block}
.kgptalkieChartMsg{padding:16px 8px;color:#8A8A8A;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:12.5px}
.kgptalkieViewer{flex:0 0 auto;margin:6px 2px 4px;border:1px solid #DCDCDC;border-radius:5px;background:#fff;outline:none;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:12px}
.kgptalkieViewerH{display:flex;align-items:center;gap:8px;height:30px;padding:0 4px 0 10px;border-bottom:1px solid #EEE;color:#8A8A8A}.kgptalkieViewerH b{color:#222;font-weight:600}
.kgptalkieViewer pre{margin:0;padding:8px 10px;max-height:320px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-family:var(--msg-monospace-font-family,Consolas),monospace;font-size:12px;color:#222;user-select:text}
.kgptalkieNbToast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:10002;padding:7px 14px;border-radius:6px;background:#fff;border:1px solid #D9D9D9;box-shadow:0 3px 12px rgba(0,0,0,.14);font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:12.5px;color:#222;display:none}
.kgptalkieNbToast.on{display:block}
.kgptalkieDlgBack{position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center}
.kgptalkieDlg{width:460px;max-width:calc(100vw - 32px);background:#fff;border:1px solid #D9D9D9;border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.18);padding:16px 18px;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:13px;color:#222}
.kgptalkieDlgT{font-size:15px;font-weight:600;margin-bottom:10px}
.kgptalkieDlg p{margin:0 0 12px;line-height:1.45}
.kgptalkieDlg label{display:block;margin:10px 0 0;font-size:12px;color:#555}
.kgptalkieDlg label.chk{display:flex;gap:8px;align-items:flex-start;color:#333;font-size:12.5px}
.kgptalkieDlg select,.kgptalkieDlg input:not([type=checkbox]){display:block;box-sizing:border-box;width:100%;margin-top:4px;height:28px;padding:0 8px;border:1px solid #CFCFCF;border-radius:4px;font:inherit;font-size:13px;color:#222;background:#fff}
.kgptalkieDlgRow{display:flex;gap:6px;align-items:center}.kgptalkieDlgRow input{flex:1}
.kgptalkieDlgHint{font-size:11.5px;color:#777;margin-top:4px;line-height:1.4}
.kgptalkieDlgHint code,.kgptalkieVarRow code{font-family:var(--msg-monospace-font-family,Consolas),monospace;font-size:11.5px;background:#F3F3F3;border-radius:3px;padding:0 3px}
.kgptalkieDlgSub{margin:16px 0 0;padding-top:10px;border-top:1px solid #EAEAEA;font-size:12px;font-weight:600;color:#333}
.kgptalkieVarList{margin-top:10px;max-height:300px;overflow:auto}
.kgptalkieVarRow{display:grid;grid-template-columns:minmax(90px,auto) 1fr 92px;gap:8px;align-items:center;margin-top:6px}
.kgptalkieVarRow input{margin-top:0 !important}.kgptalkieVarSrc{font-size:11px;color:#8A8A8A}
.kgptalkieVarAdd{margin-top:10px}.kgptalkieVarAdd input{margin-top:0 !important}
.kgptalkieTag{font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px;background:#EEF2F7;color:#40566E;margin-right:8px}
.kgptalkieTag.prod{background:#FDECEC;color:#B42318}.kgptalkieTag.none{display:none}
.kgptalkieDb{font-size:11.5px;color:#6B6B6B;margin-right:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto;min-width:0}.kgptalkieDb:empty{display:none}
.kgptalkieSteps{margin:4px 0 8px;padding-left:20px;line-height:1.5}.kgptalkieSteps li{margin:6px 0}
.kgptalkieSteps code{font-family:var(--msg-monospace-font-family,Consolas),monospace;font-size:11.5px;background:#F3F3F3;border-radius:3px;padding:0 3px}
.kgptalkieDlgStatus{min-height:18px;margin-top:12px;font-size:12px;color:#555}.kgptalkieDlgStatus.ok{color:#1A7F37}.kgptalkieDlgStatus.bad{color:#B42318}
.kgptalkieDlgB{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.kgptalkieDlg button{all:unset;box-sizing:border-box;height:28px;padding:0 14px;border-radius:4px;border:1px solid #CFCFCF;cursor:pointer;font-size:13px;color:#222;background:#fff;white-space:nowrap}
.kgptalkieDlg button.pri{background:#005FB8;border-color:#005FB8;color:#fff}
.kgptalkieDlg button:hover{filter:brightness(.96)}
.kgptalkieLang:hover{background:#E6E8EB;color:#222}
.kgptalkieMdWrap{padding-bottom:20px;position:absolute;left:0;right:${RIGHT}px;border:1px solid transparent;border-left:none;border-radius:0 6px 6px 0;box-sizing:border-box;cursor:default}
.kgptalkieMdM{position:absolute;left:${BX}px;right:0;border:1px solid transparent;border-right:none;border-radius:6px 0 0 6px;box-sizing:border-box}
.kgptalkieMdWrap.kgptalkieH,.kgptalkieMdM.kgptalkieH{border-color:${C.bd}}
.kgptalkieMdWrap.kgptalkieF,.kgptalkieMdM.kgptalkieF{border-color:${C.focus}}
.kgptalkieMdBody{font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:14px;line-height:1.55;color:#1F2328;padding:6px 12px 6px 0;user-select:text;white-space:normal}
.kgptalkieMdBody>:first-child{margin-top:0}.kgptalkieMdBody>:last-child{margin-bottom:0}
.kgptalkieMdBody h1{font-size:22px;font-weight:600;margin:.2em 0 .35em}.kgptalkieMdBody h2{font-size:18px;font-weight:600;margin:.2em 0 .35em}
.kgptalkieMdBody h3{font-size:15.5px;font-weight:600;margin:.2em 0 .3em}.kgptalkieMdBody h4,.kgptalkieMdBody h5,.kgptalkieMdBody h6{font-size:14px;font-weight:600;margin:.2em 0 .3em}
.kgptalkieMdBody p{margin:.35em 0}.kgptalkieMdBody ul,.kgptalkieMdBody ol{margin:.35em 0;padding-left:24px}.kgptalkieMdBody li{margin:.1em 0}
.kgptalkieMdBody code{font-family:var(--msg-monospace-font-family),Consolas,monospace;font-size:12.5px;background:#EFF1F3;border-radius:4px;padding:1px 5px}
.kgptalkieMdBody pre{background:#F6F8FA;border-radius:6px;padding:8px 12px;margin:.45em 0;overflow:hidden}.kgptalkieMdBody pre code{background:none;padding:0;white-space:pre}
.kgptalkieMdBody blockquote{margin:.4em 0;padding:0 0 0 12px;border-left:3px solid #D0D7DE;color:#57606A}
.kgptalkieMdBody table{border-collapse:collapse;margin:.45em 0;font-size:13px}.kgptalkieMdBody th,.kgptalkieMdBody td{border:1px solid #DDDDDD;padding:4px 10px;text-align:left}.kgptalkieMdBody th{background:#F6F8FA;font-weight:600}
.kgptalkieMdBody hr{border:none;border-top:1px solid #E3E3E3;margin:.6em 0}.kgptalkieMdBody a{color:#0B63C5;text-decoration:none}
.kgptalkieMdBody .kgptalkieMdEmpty{color:#9AA0A6;font-style:italic}
.kgptalkieChip{position:absolute;right:10px;top:50%;transform:translateY(-50%);gap:7px;height:22px;padding:0 9px;border:1px solid #E1E1E1;background:#F7F7F7;border-radius:11px;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:11.5px;color:#555;z-index:5;white-space:nowrap}
.kgptalkieChip:hover{border-color:#C9C9C9;background:#F0F0F0}
.kgptalkieChip b{font-weight:600;color:#333}.kgptalkieChip .d{width:7px;height:7px;border-radius:50%;background:#3A9A4F}.kgptalkieChip .d.off{background:#B5B5B5}
.kgptalkieChip .ac{font-size:9.5px;letter-spacing:.04em;color:#3A7A4A;font-weight:600}.kgptalkieChip .codicon{font-size:13px}
.scriptingConsole .zoneHost .renderTarget{background:transparent !important}
.scriptingConsole .margin-view-zones .zoneMargin{background:transparent !important}
.scriptingConsole .margin-view-zones .zoneMargin::before{display:none !important}
.scriptingConsole .margin-view-zones .zoneMargin.kgptalkieF::before{display:block !important;left:3px !important;right:auto !important;width:3px !important;mask-image:none !important;background-color:${C.focus} !important;border-radius:2px}
.scriptingConsole .renderTarget > .divider.horizontal{display:none !important}
.scriptingConsole .tabContent,.scriptingConsole .outputHost{background:#fff !important}
.scriptingConsole .resultStatus{background:#fff !important}
.scriptingConsole .resultStatus > .label::before{content:'\\2713\\00a0\\00a0';color:#3A9A4F}
.scriptingConsole .actionOutput,.scriptingConsole .outputHost{overflow-x:hidden !important}
.scriptingConsole .actionRow{width:auto !important;min-width:0 !important;max-width:calc(100% - ${RIGHT}px)}
.scriptingConsole .resultText,.scriptingConsole .resultText span{white-space:pre-wrap !important;word-break:break-word;min-width:0}
.scriptingConsole .resultText.error{color:#B42318 !important;background:#FEF3F2 !important;display:block;padding:4px 10px;border-radius:4px}
.scriptingConsole .tabulator{border:none !important;background:#fff !important}
.scriptingConsole .tabulator .tabulator-header{background:#fff !important;border-bottom:none !important}
.scriptingConsole .tabulator .tabulator-header .tabulator-col{background:#fff !important;border-right:none !important;border-bottom:1px solid #CFCFCF !important;color:#333 !important;font-weight:600}
.scriptingConsole .tabulator .tabulator-row{background:#fff !important;border-bottom:1px solid #EFEFEF !important}
.scriptingConsole .tabulator .tabulator-row.tabulator-row-even{background:#FAFAFA !important}
.scriptingConsole .tabulator .tabulator-row .tabulator-cell{border-right:none !important}
body.kgptalkieActOn #root{flex-direction:row !important}
body.kgptalkieActOn #root > .applicationHost{flex:1 1 auto !important;min-width:0 !important;width:auto !important}
.kgptalkieAct{flex:0 0 48px;width:48px;display:flex;flex-direction:column;align-items:center;background:#2C2C2C;padding-top:4px;z-index:6}
.kgptalkieAct button{all:unset;box-sizing:border-box;position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#9D9D9D}
.kgptalkieAct button:hover{color:#E8E8E8}
.kgptalkieAct button.on{color:#FFFFFF}
.kgptalkieAct button.on::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:#FFFFFF}
.kgptalkieAct .codicon{font-size:24px}
.kgptalkieAct .kgptalkieSp{flex:1}
body.kgptalkieActOn #documentSideBar > .actions{display:none !important}
body.kgptalkieActOn #desktopSidebarHeader{display:none !important}
body.kgptalkieP-explorer #documentSideBar{display:none !important}
body.kgptalkieActOn:not(.kgptalkieP-explorer) .kgptalkieExp{display:none !important}
body.kgptalkieActOn:not(.kgptalkieP-explorer) #documentSideBar .kgptalkieHideSec{display:none !important}
body.kgptalkieActOn:not(.kgptalkieP-explorer) #documentSideBar .kgptalkieFullSec{top:0 !important;height:100% !important}
.kgptalkieAct button.kgptalkieNA{display:none}
body.kgptalkieActOn #documentSideBar .accordionContent > .sashContainer{display:none !important}
.kgptalkieExp{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;background:#F8F8F8;font-family:var(--msg-standard-font-family,'Segoe UI'),sans-serif;font-size:13px;color:#3B3B3B;position:relative;user-select:none}
.kgptalkieExpHead{flex:0 0 35px;display:flex;align-items:center;justify-content:space-between;padding:0 8px 0 20px;font-size:11px;letter-spacing:.04em;color:#616161}
.kgptalkieExpHead .kgptalkieActs{display:flex;gap:2px}
.kgptalkieExpHead button{all:unset;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:4px;cursor:pointer;color:#616161}
.kgptalkieExpHead button:hover{background:#E4E4E4;color:#222}
.kgptalkieExpHead .codicon{font-size:16px}
.kgptalkieExpBody{flex:1 1 auto;overflow:auto;min-height:0;padding-bottom:12px}
.kgptalkieRow{display:flex;align-items:center;height:22px;line-height:22px;padding-right:8px;white-space:nowrap;cursor:pointer;box-sizing:border-box;border:1px solid transparent}
.kgptalkieRow:hover{background:#E8E8E8}
.kgptalkieRow.kgptalkieSel{background:#E4E6F1;border-color:#C9D3F0}
.kgptalkieRow.kgptalkieRoot{font-weight:700;font-size:11.5px;letter-spacing:.02em;text-transform:uppercase;color:#3B3B3B}
.kgptalkieRow.kgptalkieNo .kgptalkieNm{color:#8A8A8A}
.kgptalkieRow.kgptalkieNote{color:#8A8A8A;font-style:italic;cursor:default}.kgptalkieRow.kgptalkieNote:hover{background:none}
.kgptalkieRow.kgptalkieErr{color:#B42318}
.kgptalkieTw{flex:0 0 16px;width:16px;font-size:14px;color:#616161;text-align:center}
.kgptalkieIc{flex:0 0 16px;font-size:14px;margin:0 6px 0 0}
.kgptalkieDir .kgptalkieNm{margin-left:2px}
.kgptalkieNm{overflow:hidden;text-overflow:ellipsis}
.kgptalkieEmpty{padding:6px 20px;color:#616161;font-size:13px;line-height:1.45}
.kgptalkieEmpty p{margin:8px 0}.kgptalkieEmpty .kgptalkieHint{font-size:12px;color:#8A8A8A}
.kgptalkieBtn{all:unset;box-sizing:border-box;display:block;width:100%;text-align:center;padding:6px 10px;border-radius:3px;background:#005FB8;color:#fff;cursor:pointer;font-size:13px}
.kgptalkieBtn:hover{background:#0258A8}
.kgptalkieToast{position:absolute;left:10px;right:10px;bottom:10px;padding:8px 10px;border-radius:5px;background:#fff;border:1px solid #D9D9D9;box-shadow:0 2px 8px rgba(0,0,0,.12);font-size:12px;color:#333;display:none}
.kgptalkieToast.on{display:block}
`;
 let st = document.getElementById('kgptalkieHideBar'); if (!st) { st = document.createElement('style'); st.id = 'kgptalkieHideBar'; document.head.appendChild(st); }
 st.textContent = css;
 let dyn = document.getElementById('kgptalkieDyn'); if (!dyn) { dyn = document.createElement('style'); dyn.id = 'kgptalkieDyn'; document.head.appendChild(dyn); }
 const rules = new Set();
 const rule = (cls, text) => { if (!rules.has(cls)) { rules.add(cls); dyn.sheet.insertRule(`.scriptingConsole .${cls}::before{content:'${text}'}`, dyn.sheet.cssRules.length); } return cls; };
 const R = W.kgptalkieRun || (W.kgptalkieRun = { n: 0, seen: new WeakMap(), num: new WeakMap() });
 const MDE = W.kgptalkieMdEdit || (W.kgptalkieMdEdit = new WeakSet());          // markdown cells being edited (others are rendered)
 const AIC = W.kgptalkieAiCells || (W.kgptalkieAiCells = new WeakSet());        // AI cells: markdown contexts whose first line is AI_MARK
 const AIO = W.kgptalkieAiOut || (W.kgptalkieAiOut = new WeakMap());            // context -> AI card state
 const AI_MARK = '<!-- ai -->';
 const sleep = ms => new Promise(r => setTimeout(r, ms));
 let list = [];
 const isNB = ed => { const d = ed.getDomNode(); return d && d.classList.contains('scriptingConsole'); };
 const ctxs = ed => { const m = ed.getModel(); return (m && m.executionContexts && m.executionContexts.content) || []; };
 const textOf = (m, x) => m.getValueInRange({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) });
 const cellAt = (ed, ln) => ctxs(ed).findIndex(x => ln >= x.startLine && ln <= x.endLine);
 const isMd = x => !!x && x.language === 'markdown';
 const isCmd = (m, x) => textOf(m, x).trim().startsWith('\\');
 const rendered = x => isMd(x) && !MDE.has(x) && !AIC.has(x);
 const isAi = x => isMd(x) && AIC.has(x);
 const isMdOnly = x => isMd(x) && !AIC.has(x);
 const syncAi = ed => { const m = ed.getModel(); for (const x of ctxs(ed)) { if (isMd(x) && m.getLineContent(x.startLine).trim() === AI_MARK) AIC.add(x); else AIC.delete(x); } };
 const quiet = (ce, fn) => { ce.updateExecutionContexts = () => { }; try { fn(); } finally { delete ce.updateExecutionContexts; } };
 const focusCell = (ed, i, atEnd) => { const m = ed.getModel(), x = ctxs(ed)[i]; if (!x) return; const S = ed.kgptalkieNB; if (rendered(x)) { if (S) { S.sel = i; S.dsig = ''; } return; } const ln = atEnd ? x.endLine : (isAi(x) && x.endLine > x.startLine ? x.startLine + 1 : x.startLine); ed.setPosition({ lineNumber: ln, column: atEnd ? m.getLineMaxColumn(ln) : 1 }); ed.revealLineInCenterIfOutsideViewport(ln); if (!ed.kgptalkieCmd) ed.focus(); if (S) S.sel = i; };
 const selIndex = ed => { const S = ed.kgptalkieNB; if (S && S.sel >= 0 && S.sel < ctxs(ed).length) return S.sel; const p = ed.getPosition(); return p ? cellAt(ed, p.lineNumber) : -1; };
 const dirty = ed => { if (ed.kgptalkieNB) ed.kgptalkieNB.sig = ''; };

 /* ---------- markdown to HTML (escaped first; links only http/https/mailto) ---------- */
 const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
 const inline = s => {
  const codes = []; s = s.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  s = esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>')
   .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>').replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>')
   .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => /^(https?:|mailto:)/i.test(u) ? `<a href="${u}" title="${u}">${t}</a>` : t);
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => '<code>' + esc(codes[+i]) + '</code>');
 };
 const BLOCK = /^(#{1,6}\s|\s*```|\s*>|\s*[-*+]\s+|\s*\d+[.)]\s+|\s*\|.*\|\s*$)/;
 const mdToHtml = src => {
  const L = src.replace(/\r/g, '').split('\n'); let h = '', i = 0; const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  while (i < L.length) {
   const l = L[i]; let m;
   if (/^\s*```/.test(l)) { const b = []; i++; while (i < L.length && !/^\s*```/.test(L[i])) b.push(L[i++]); i++; h += '<pre><code>' + esc(b.join('\n')) + '</code></pre>'; continue; }
   if ((m = /^(#{1,6})\s+(.*)$/.exec(l))) { h += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; i++; continue; }
   if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { h += '<hr>'; i++; continue; }
   if (/^\s*>/.test(l)) { const b = []; while (i < L.length && /^\s*>/.test(L[i])) b.push(L[i++].replace(/^\s*>\s?/, '')); h += '<blockquote>' + mdToHtml(b.join('\n')) + '</blockquote>'; continue; }
   if (/^\s*[-*+]\s+/.test(l)) { h += '<ul>'; while (i < L.length && /^\s*[-*+]\s+/.test(L[i])) h += '<li>' + inline(L[i++].replace(/^\s*[-*+]\s+/, '')) + '</li>'; h += '</ul>'; continue; }
   if (/^\s*\d+[.)]\s+/.test(l)) { h += `<ol start="${parseInt(l, 10)}">`; while (i < L.length && /^\s*\d+[.)]\s+/.test(L[i])) h += '<li>' + inline(L[i++].replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; h += '</ol>'; continue; }
   if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < L.length && /^\s*\|?\s*:?-{2,}/.test(L[i + 1])) {
    let t = '<table><thead><tr>' + cells(l).map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>'; i += 2;
    while (i < L.length && /^\s*\|.*\|\s*$/.test(L[i])) t += '<tr>' + cells(L[i++]).map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>';
    h += t + '</tbody></table>'; continue;
   }
   if (!l.trim()) { i++; continue; }
   const b = [L[i++]]; while (i < L.length && L[i].trim() && !BLOCK.test(L[i])) b.push(L[i++]);
   h += '<p>' + b.map(inline).join(' ') + '</p>';
  }
  return h || '<p class="kgptalkieMdEmpty">Empty markdown cell. Use the pencil to edit.</p>';
 };

 /* ---------- SQL: one clause per line <-> one line ---------- */
 const TOK = /(\s+)|(--[^\n]*|#[^\n]*)|(\/\*[\s\S]*?\*\/)|('(?:[^'\\]|\\.|'')*'?|"(?:[^"\\]|\\.|"")*"?|`(?:[^`]|``)*`?)|([A-Za-z_][A-Za-z0-9_$]*)|(\d+(?:\.\d+)?)|([\s\S])/g;
 const lex = s => { const out = []; let m; TOK.lastIndex = 0; while ((m = TOK.exec(s))) { out.push({ t: m[0], k: m[1] ? 'ws' : m[2] ? 'lc' : m[3] ? 'bc' : m[4] ? 'str' : m[5] ? 'w' : m[6] ? 'num' : 'sym' }); } return out; };
 const oneLine = s => lex(s).map(x => x.k === 'ws' ? (/\n/.test(x.t) ? ' ' : x.t) : x.k === 'lc' ? '/* ' + x.t.replace(/^(--|#)\s?/, '').trim() + ' */' : x.t).join('').replace(/ {2,}/g, ' ').trim();
 const JOINW = new Set(['LEFT', 'RIGHT', 'INNER', 'CROSS', 'FULL', 'NATURAL', 'OUTER', 'STRAIGHT_JOIN', 'JOIN']);
 const multiLine = s => {
  const T = lex(oneLine(s)); let o = '', depth = 0, first = '', inCond = false, between = false, startStmt = true, skipWs = false;
  const nextTok = j => { for (let k = j + 1; k < T.length; k++) { if (T[k].k !== 'ws') return T[k]; } return null; };
  const brk = ind => { o = o.replace(/[ \t]+$/, ''); if (o && !o.endsWith('\n')) o += '\n'; o += ind || ''; };
  for (let j = 0; j < T.length; j++) {
   const x = T[j];
   if (x.k === 'ws') { if (!skipWs) o += x.t; continue; }
   skipWs = false;
   if (x.k === 'sym') { if (x.t === '(') depth++; else if (x.t === ')') depth = Math.max(0, depth - 1); o += x.t; if (x.t === ';' && depth === 0) { startStmt = true; first = ''; inCond = false; between = false; brk(); skipWs = true; } continue; }
   if (x.k !== 'w' || depth > 0) { o += x.t; continue; }
   const U = x.t.toUpperCase(), nx = nextTok(j), NX = nx ? nx.t.toUpperCase() : '';
   if (startStmt) { first = U; startStmt = false; o += x.t; continue; }
   let b = false;
   if (['SELECT', 'FROM', 'WHERE', 'HAVING', 'LIMIT', 'VALUES', 'UNION', 'WINDOW'].includes(U)) b = true;
   else if ((U === 'GROUP' || U === 'ORDER') && NX === 'BY') b = true;
   else if (U === 'SET' && first === 'UPDATE') b = true;
   else if (JOINW.has(U) && U !== 'OUTER' && (U === 'JOIN' || U === 'STRAIGHT_JOIN' || JOINW.has(NX))) { const pv = o.trimEnd().split(/\s+/).pop().toUpperCase(); if (!JOINW.has(pv)) b = true; }
   if (b) { brk(); inCond = U === 'WHERE' || U === 'HAVING'; between = false; o += x.t; continue; }
   if (U === 'BETWEEN') between = true;
   if ((U === 'AND' || U === 'OR') && inCond) { if (U === 'AND' && between) { between = false; o += x.t; continue; } brk('  '); o += x.t; continue; }
   o += x.t;
  }
  return o.replace(/[ \t]+$/gm, '').replace(/\n+$/, '');
 };
 W.kgptalkieFormat = { oneLine, multiLine, mdToHtml };

 /* ---------- undo: each cell action is ONE entry on the editor's own undo stack ----------
    Its text edits are taken off Monaco's stack and replaced by one entry whose undo/redo rebuilds the cells
    (text, type, output, count), so Ctrl+Z / Ctrl+Y walk typing and cell actions in true order. */
 const stackOf = m => { try { const us = m._undoRedoService; return us._editStacks.get(us.getUriComparisonKey(m.uri)) || null; } catch (e) { return null; } };
 const keepStack = async (m, fn) => { const st = stackOf(m), past = st && st._past.slice(), fut = st && st._future.slice(); try { return await fn(); } finally { if (st) { st._past = past; st._future = fut; } } };
 const resOf = x => (x && x.presentation && x.presentation.resultData) || null;
 const snap = ed => { const m = ed.getModel(); return { text: m.getValue(), sel: selIndex(ed), cells: ctxs(ed).map(x => ({ x, text: textOf(m, x), lang: x.language, edit: MDE.has(x), res: resOf(x), num: R.num.get(x) })) }; };
 const sameCells = (a, b) => a.text === b.text && a.cells.length === b.cells.length && a.cells.every((c, k) => c.lang === b.cells[k].lang && c.text === b.cells[k].text && c.res === b.cells[k].res);
 const act = async (ed, label, fn) => {
  const m = ed.getModel(); if (!m || W.kgptalkieActing) return false; W.kgptalkieActing = true;
  try {
   m.pushStackElement(); const before = snap(ed);
   await keepStack(m, fn);
   const after = snap(ed); if (sameCells(before, after)) return false;
   m._undoRedoService.pushElement({ type: 0, resource: m.uri, label, code: 'kgptalkie.cells', confirmBeforeUndo: false, undo: () => restore(ed, before), redo: () => restore(ed, after) });
   return true;
  } catch (e) { W.kgptalkieErr = String(e && e.stack || e); return false; } finally { W.kgptalkieActing = false; dirty(ed); }
 };
 /* switch a cell's type: the app switches the cell under the caret and swaps the context object a moment later */
 const setLang = async (ed, i, lang) => {
  const ce = ed.kgptalkieCE, m = ed.getModel(), x = ctxs(ed)[i];
  if (resOf(x)) await x.removeResult();
  ed.setPosition({ lineNumber: x.startLine, column: 1 });
  ce.setExecutionBlockLanguageAndText(x, textOf(m, x), lang, true);
  for (let t = 0; t < 150; t++) { const y = ctxs(ed)[i]; if (y && y !== x && y.language === lang) return y; await sleep(20); }
  return ctxs(ed)[i];
 };
 /* make cell i hold c = { text, lang, res, num } (res = output to show, null = none) */
 const setCell = async (ed, i, c) => {
  const ce = ed.kgptalkieCE, m = ed.getModel(); let x = ctxs(ed)[i]; if (!x) return null;
  if (x.language !== c.lang) x = await setLang(ed, i, c.lang);
  if (textOf(m, x) !== c.text) { if (resOf(x)) await x.removeResult(); ce.setExecutionBlockLanguageAndText(x, c.text, undefined, true); x = ctxs(ed)[i]; }
  const have = resOf(x);
  if (c.res && have !== c.res && c.res.type !== 'resultIds') { if (have) await x.removeResult(); x.setResult(c.res, {}); R.seen.set(x, c.res); if (c.num) R.num.set(x, c.num); }
  else if (!c.res && have) await x.removeResult();
  return x;
 };
 /* new empty cell at index `at` (0..length) */
 const insCore = (ed, at, lang) => {
  const ce = ed.kgptalkieCE, m = ed.getModel(), ec = m.executionContexts, all = ctxs(ed);
  at = Math.max(0, Math.min(at, all.length)); let L;
  if (at === all.length) { const e = all[all.length - 1].endLine, col = m.getLineMaxColumn(e); quiet(ce, () => ed.executeEdits('kgptalkie', [{ range: { startLineNumber: e, startColumn: col, endLineNumber: e, endColumn: col }, text: '\n' }])); L = e + 1; }
  else { L = all[at].startLine; quiet(ce, () => ed.executeEdits('kgptalkie', [{ range: { startLineNumber: L, startColumn: 1, endLineNumber: L, endColumn: 1 }, text: '\n' }])); for (let j = at; j < all.length; j++) all[j].movePosition(1); }
  const p = ce.props.createResultPresentation(ce, lang); p.startLine = L; p.endLine = L; ec.insertContext(at, p);
  return at;
 };
 const remCore = (ed, i) => {
  const ce = ed.kgptalkieCE, m = ed.getModel(), ec = m.executionContexts, all = ctxs(ed), x = all[i];
  const s = x.startLine, e = x.endLine, n = e - s + 1, last = i === all.length - 1, pe = last ? all[i - 1].endLine : 0;
  ec.removeContexts([i]);
  const range = last ? { startLineNumber: pe, startColumn: m.getLineMaxColumn(pe), endLineNumber: e, endColumn: m.getLineMaxColumn(e) } : { startLineNumber: s, startColumn: 1, endLineNumber: e + 1, endColumn: 1 };
  quiet(ce, () => ed.executeEdits('kgptalkie', [{ range, text: '', forceMoveMarkers: true }]));
  const rest = ctxs(ed); for (let j = i; j < rest.length; j++) rest[j].movePosition(-n);
 };
 /* bring the cells back to a snapshot: keep the equal cells at both ends, rebuild the middle */
 const restore = async (ed, T) => {
  const m = ed.getModel(), tc = T.cells;
  await keepStack(m, async () => {
   const cur = ctxs(ed).slice(); const eq = (x, c) => x === c.x && x.language === c.lang && textOf(m, x) === c.text && resOf(x) === c.res;
   let p = 0; while (p < cur.length && p < tc.length && eq(cur[p], tc[p])) p++;
   let s = 0; while (s < cur.length - p && s < tc.length - p && eq(cur[cur.length - 1 - s], tc[tc.length - 1 - s])) s++;
   const nCur = cur.length - p - s, nT = tc.length - p - s;
   for (let k = 0; k < Math.min(nCur, nT); k++) await setCell(ed, p + k, tc[p + k]);
   for (let k = nCur - 1; k >= nT; k--) remCore(ed, p + k);
   for (let k = nCur; k < nT; k++) { insCore(ed, p + k, tc[p + k].lang); await setCell(ed, p + k, tc[p + k]); }
  });
  ctxs(ed).forEach((x, k) => { if (tc[k] && tc[k].edit) MDE.add(x); else MDE.delete(x); });
  if (m.getValue() !== T.text) W.kgptalkieErr = 'undo: text differs after restore';
  dirty(ed); selectCell(ed, Math.min(T.sel, ctxs(ed).length - 1));
 };
 /* select a cell: edit mode puts the caret in it, command mode only marks it */
 const selectCell = (ed, i) => {
  const all = ctxs(ed); if (!all.length) return; i = Math.max(0, Math.min(i, all.length - 1)); const x = all[i], S = ed.kgptalkieNB;
  if (ed.kgptalkieCmd || rendered(x)) { if (!rendered(x)) ed.setPosition({ lineNumber: x.startLine, column: 1 }); if (S) { S.sel = i; S.dsig = ''; } ed.revealLineInCenterIfOutsideViewport(x.startLine); }
  else focusCell(ed, i, false);
 };

 /* ---------- actions ---------- */
 const A = {
  run(ed, i) {
   const ce = ed.kgptalkieCE, x = ctxs(ed)[i]; if (!ce || !x) return null;
   if (isAi(x)) { A.aiCell(ed, i); return null; }
   if (isMd(x)) { A.render(ed, i, false); return null; }
   focusCell(ed, i, true); const before = resOf(x); ce.executeSelectedOrAll({ advance: false }); return { x, before };
  },
  async done(job, maxMs = 120000) { const t0 = Date.now(); while (Date.now() - t0 < maxMs) { const p = job.x.presentation; if (job.x.disposed) return; if (p && p.loadingState === 'idle' && p.resultData && p.resultData !== job.before && !W.kgptalkieSqlRunning) return; await sleep(100); } },
  async runRange(ed, from, to, btn) {
   if (W.kgptalkieBusy) return; W.kgptalkieBusy = true; if (btn) btn.classList.add('kgptalkieBusy');
   try {
    const m = ed.getModel();
    for (let i = from; i <= to && i < ctxs(ed).length; i++) {
     const x = ctxs(ed)[i];
     if (isAi(x)) { const st = await A.aiCell(ed, i, true); if (!st || st.status !== 'done') break; continue; }
     if (isMd(x)) continue; const code = textOf(m, x).trim(); if (!code || code.startsWith('\\')) continue;
     const job = A.run(ed, i); if (!job) continue; await A.done(job);
     const rt = job.x.presentation && job.x.presentation.renderTarget; if (rt && rt.querySelector('.resultText.error')) break;
    }
   } finally { W.kgptalkieBusy = false; if (btn) btn.classList.remove('kgptalkieBusy'); }
  },
  runAll(ed, btn) { return A.runRange(ed, 0, ctxs(ed).length - 1, btn); },
  runAbove(ed, i) { if (i > 0) return A.runRange(ed, 0, i - 1); },
  runBelow(ed, i) { return A.runRange(ed, i, ctxs(ed).length - 1); },
  clearAll(ed) { const ce = ed.kgptalkieCE; if (ce) return ce.removeAllResults(); },
  clearOne(ed, i) { const x = ctxs(ed)[i]; if (x) x.removeResult(); },
  /* like Jupyter's restart: every output gone, the next run is [1] again */
  async restart(ed) { if (W.kgptalkieBusy) return; await A.clearAll(ed); R.n = 0; R.seen = new WeakMap(); R.num = new WeakMap(); dirty(ed); if (ed.kgptalkieNB) ed.kgptalkieNB.dsig = ''; },
  /* new empty cell at index `at` (0..length), code ('mysql') or 'markdown' */
  async insertAt(ed, at, lang) {
   const m = ed.getModel(), ec = m && m.executionContexts; if (!ed.kgptalkieCE || !ctxs(ed).length) return;
   lang = lang || ec.language || 'mysql'; at = Math.max(0, Math.min(at, ctxs(ed).length));
   await act(ed, 'Insert Cell', () => { insCore(ed, at, lang); });
   const nx = ctxs(ed)[at]; if (isMd(nx)) MDE.add(nx);
   dirty(ed); selectCell(ed, at);
  },
  addBelow(ed, i, lang) { return A.insertAt(ed, i < 0 ? ctxs(ed).length : i + 1, lang); },
  addAbove(ed, i, lang) { return A.insertAt(ed, Math.max(0, i), lang); },
  async remove(ed, i) {
   const all = ctxs(ed), x = all[i]; if (!ed.kgptalkieCE || !x) return;
   if (all.length === 1) await act(ed, 'Delete Cell', () => setCell(ed, 0, { text: '', lang: x.language, res: null }));
   else await act(ed, 'Delete Cell', () => remCore(ed, i));
   dirty(ed); selectCell(ed, Math.min(i, ctxs(ed).length - 1));
  },
  /* swap with the neighbour; text, type and output all move */
  async move(ed, i, dir) {
   const m = ed.getModel(), all = ctxs(ed); const j = i + dir; if (!ed.kgptalkieCE || j < 0 || j >= all.length) return;
   const a = Math.min(i, j), b = Math.max(i, j), X = all[a], Y = all[b]; if (isCmd(m, X) || isCmd(m, Y)) return;
   const cx = { text: textOf(m, X), lang: X.language, res: resOf(X), num: R.num.get(X), edit: MDE.has(X) };
   const cy = { text: textOf(m, Y), lang: Y.language, res: resOf(Y), num: R.num.get(Y), edit: MDE.has(Y) };
   await act(ed, 'Move Cell', async () => { await setCell(ed, a, cy); await setCell(ed, b, cx); });
   const n = ctxs(ed); if (n[a]) { if (cy.edit) MDE.add(n[a]); else MDE.delete(n[a]); } if (n[b]) { if (cx.edit) MDE.add(n[b]); else MDE.delete(n[b]); }
   dirty(ed); selectCell(ed, j);
  },
  async format(ed, i) {
   const m = ed.getModel(), x = ctxs(ed)[i]; if (!ed.kgptalkieCE || !x || isMd(x) || isCmd(m, x)) return;
   const t = textOf(m, x); if (!t.trim()) return;
   const nt = t.trim().includes('\n') ? oneLine(t) : multiLine(t); if (nt === t) return;
   await act(ed, 'Format Cell', () => setCell(ed, i, { text: nt, lang: x.language, res: resOf(x), num: R.num.get(x) }));
   dirty(ed); if (!ed.kgptalkieCmd) focusCell(ed, i, true);
  },
  /* lang: 'mysql' | 'markdown' | 'ai' (an AI cell is a markdown context whose first line is AI_MARK) */
  async setType(ed, i, lang) {
   const m = ed.getModel(), x = ctxs(ed)[i]; if (!ed.kgptalkieCE || !x || isCmd(m, x)) return;
   const cur = isAi(x) ? 'ai' : isMd(x) ? 'markdown' : 'mysql'; if (cur === lang) return;
   let text = textOf(m, x); if (cur === 'ai') text = text.split('\n').slice(1).join('\n');
   if (lang === 'ai') text = AI_MARK + '\n' + text;
   const label = lang === 'markdown' ? 'Change to Markdown' : lang === 'ai' ? 'Change to AI Cell' : 'Change to SQL';
   await act(ed, label, () => setCell(ed, i, { text, lang: lang === 'ai' ? 'markdown' : lang, res: null }));
   const y = ctxs(ed)[i]; MDE.delete(y); AIO.delete(y); syncAi(ed); dirty(ed);
   if (!rendered(y) && !ed.kgptalkieCmd) focusCell(ed, i, true); else if (ed.kgptalkieNB) { ed.kgptalkieNB.sel = i; ed.kgptalkieNB.dsig = ''; }
  },
  toggleType(ed, i) { const x = ctxs(ed)[i]; if (x) return A.setType(ed, i, isMd(x) ? 'mysql' : 'markdown'); },
  async addAi(ed, i) { await A.insertAt(ed, i < 0 ? ctxs(ed).length : i + 1, 'markdown'); const k = selIndex(ed); await A.setType(ed, k, 'ai'); },
  copy(ed, i) { const m = ed.getModel(), x = ctxs(ed)[i]; if (x) W.kgptalkieClip = { text: textOf(m, x), lang: x.language }; },
  async cut(ed, i) { A.copy(ed, i); await A.remove(ed, i); },
  async paste(ed, i, above) {
   const c = W.kgptalkieClip; if (!c || !ed.kgptalkieCE || !ctxs(ed).length) return; const at = above ? Math.max(0, i) : i + 1;
   await act(ed, 'Paste Cell', async () => { const k = insCore(ed, at, c.lang); await setCell(ed, k, { text: c.text, lang: c.lang, res: null }); });
   dirty(ed); selectCell(ed, at);
  },
  /* the whole notebook as one .sql file: SQL cells as statements, markdown as -- comments; native Save dialog */
  exportText(ed) {
   const m = ed.getModel(); if (!m) return null;
   const tab = document.querySelector('.dbModuleTabview .tabArea .tabItem.selected');
   const name = ((tab && tab.textContent) || '').trim().replace(/\.(mysql-notebook|sql)$/i, '') || 'notebook';
   const out = ['-- ' + name, '-- Exported from a MySQL Workbench notebook', ''];
   for (const x of ctxs(ed)) {
    const t = textOf(m, x).replace(/\s+$/, ''); if (!t.trim()) continue;
    if (isAi(x)) out.push(t.split('\n').slice(1).map(l => l.trim() ? '-- AI: ' + l : '--').join('\n'));
    else if (isMd(x)) out.push(t.split('\n').map(l => l.trim() ? '-- ' + l : '--').join('\n'));
    else if (t.trim().startsWith('\\')) out.push('-- ' + t.trim());
    else out.push(/;\s*$/.test(t) || /;\s*(--[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)\s*$/.test(t) ? t : t + ';');
    out.push('');
   }
   return { file: name.replace(/[\\/:*?"<>|]+/g, '_') + '.sql', content: out.join('\n') };
  },
  exportSql(ed) {
   const t = A.exportText(ed); if (!t) return; const file = t.file;
   const data = { title: 'Export Notebook as SQL', saveLabel: 'Export', default: file, filters: { 'SQL script': ['sql'] }, content: t.content, encoding: 'utf8' };
   if (W.electronHost && W.electronHost.postMessage) { W.electronHost.postMessage({ source: 'app', command: 'saveFile', data }); return; }
   const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data.content], { type: 'text/plain' })); a.download = file; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },
  undo(ed) { const m = ed.getModel(); if (m) m.undo(); },
  redo(ed) { const m = ed.getModel(); if (m) m.redo(); },
  edit(ed, i) { const x = ctxs(ed)[i]; if (!isMd(x)) return; exitCmd(ed); MDE.add(x); dirty(ed); ed.kgptalkiePendingFocus = { x, atEnd: true }; },
  /* render a markdown cell; advance = move on like Jupyter's Shift+Enter */
  render(ed, i, advance = true) {
   const all = ctxs(ed), x = all[i]; if (!isMd(x)) return; MDE.delete(x); dirty(ed); if (ed.kgptalkieNB) ed.kgptalkieNB.sel = i;
   if (advance) { if (i + 1 < all.length) selectCell(ed, i + 1); else A.insertAt(ed, all.length, 'mysql'); }
  },
 };

 /* bottom-right SQL / Markdown toggle on every cell */
 const langBtn = (ed, i, x) => {
  const b = document.createElement('button'); b.className = 'kgptalkieLang' + (isAi(x) ? ' kgptalkieLangAi' : ''); b.textContent = isAi(x) ? 'AI' : isMd(x) ? 'Markdown' : 'SQL';
  b.title = 'Cell type. Click to change it: SQL (Y), Markdown (M) or AI';
  b.addEventListener('mousedown', e => {
   if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); closeMenu();
   const cur = isAi(x) ? 'ai' : isMd(x) ? 'markdown' : 'mysql', tick = t => (t === cur ? '✓ ' : '  ');
   openMenu(b, [{ t: tick('mysql') + 'SQL', k: 'Y', f: () => A.setType(ed, i, 'mysql') }, { t: tick('markdown') + 'Markdown', k: 'M', f: () => A.setType(ed, i, 'markdown') },
    { t: tick('ai') + 'AI (plain words to SQL)', f: () => A.setType(ed, i, 'ai') }]);
  }, { signal: AC.signal });
  b.addEventListener('mouseup', e => e.stopPropagation(), { signal: AC.signal });
  return b;
 };

 /* ---------- command mode (Esc, like Jupyter): no caret anywhere, keys act on the selected cell ---------- */
 const sinkOf = ed => { const host = ed.getDomNode().closest('.editorHost'); const bar = host && host.parentElement && host.parentElement.querySelector(':scope > .kgptalkieNbBar'); return bar ? bar.querySelector('.kgptalkieSink') : null; };
 const enterCmd = (ed, i) => {
  const S = ed.kgptalkieNB, p = ed.getPosition();
  if (p) { ed.kgptalkieCmdPos = p; ed.setSelection({ startLineNumber: p.lineNumber, startColumn: p.column, endLineNumber: p.lineNumber, endColumn: p.column }); }
  if (S) { S.sel = (i === undefined || i < 0) ? (p ? cellAt(ed, p.lineNumber) : S.sel) : i; S.dsig = ''; }
  ed.kgptalkieCmd = true; ed.getDomNode().classList.add('kgptalkieCmd');
  const k = sinkOf(ed); if (k) k.focus({ preventScroll: true });
 };
 const exitCmd = ed => { ed.kgptalkieCmd = false; const d = ed.getDomNode(); if (d) d.classList.remove('kgptalkieCmd'); };
 const enterEdit = (ed, i) => {
  const x = ctxs(ed)[i]; if (!x) return;
  if (rendered(x)) { A.edit(ed, i); return; }
  exitCmd(ed); const p = ed.kgptalkieCmdPos;
  if (p && cellAt(ed, p.lineNumber) === i) { ed.setPosition(p); ed.revealLineInCenterIfOutsideViewport(p.lineNumber); ed.focus(); if (ed.kgptalkieNB) ed.kgptalkieNB.sel = i; }
  else focusCell(ed, i, false);
 };
 const hasTextSel = () => { const s = getSelection(); return !!s && !s.isCollapsed && String(s).length > 0; };
 const cmdKey = (ed, e) => {
  const all = ctxs(ed); if (!all.length) return; const i = Math.max(0, Math.min(selIndex(ed), all.length - 1));
  const c = e.code || '', ctrl = e.ctrlKey || e.metaKey, sh = e.shiftKey, alt = e.altKey, plain = !ctrl && !alt;
  const L = ch => c === 'Key' + ch || (e.key || '').toUpperCase() === ch;
  let h = true;
  if (e.key === 'Enter' && plain && !sh) enterEdit(ed, i);
  else if (e.key === 'Enter' && sh && !ctrl) { A.run(ed, i); if (i + 1 < all.length) selectCell(ed, i + 1); else A.insertAt(ed, all.length, 'mysql'); }
  else if (e.key === 'Enter' && ctrl) A.run(ed, i);
  else if (e.key === 'ArrowUp' || (L('K') && plain && !sh)) selectCell(ed, i - 1);
  else if (e.key === 'ArrowDown' || (L('J') && plain && !sh)) selectCell(ed, i + 1);
  else if (e.key === 'Home' && plain) selectCell(ed, 0);
  else if (e.key === 'End' && plain) selectCell(ed, all.length - 1);
  else if (L('A') && plain && !sh) A.addAbove(ed, i, 'mysql');
  else if (L('B') && plain && !sh) A.addBelow(ed, i, 'mysql');
  else if (L('D') && plain && !sh) { const now = Date.now(); if (ed.kgptalkieLastD && now - ed.kgptalkieLastD < 700) { ed.kgptalkieLastD = 0; A.remove(ed, i); } else ed.kgptalkieLastD = now; }
  else if (L('Z') && ((plain && !sh) || (ctrl && !sh && !alt))) A.undo(ed);
  else if ((L('Z') && plain && sh) || (L('Y') && ctrl && !alt) || (L('Z') && ctrl && sh && !alt)) A.redo(ed);
  else if (L('M') && plain && !sh) A.setType(ed, i, 'markdown');
  else if (L('Y') && plain && !sh) A.setType(ed, i, 'mysql');
  else if (L('C') && !alt && !sh && (!ctrl || !hasTextSel())) A.copy(ed, i);
  else if (L('X') && !alt && !sh && (!ctrl || !hasTextSel())) A.cut(ed, i);
  else if (L('V') && !alt) A.paste(ed, i, sh);
  else if (L('A') && ctrl && !sh && !alt) { }                              // no page-wide select-all in command mode
  else h = false;
  if (h) { e.preventDefault(); e.stopPropagation(); }
 };
 W.kgptalkieActions = A;

 /* ---------- AI (from SQL Notebook Studio): Explain, Optimize, Fix, Explain Result, AI cells ----------
    The plugin server calls the provider; API keys stay there, encrypted, and never reach this page.
    Ad-hoc SQL (schema for prompts, EXPLAIN) goes through the notebook's own connection backend. */
 const AIURL = 'http://127.0.0.1:9241/kgptalkie/ai/';
 const aiReq = async (op, body, signal) => {
  const r = await fetch(AIURL + op, { method: body ? 'POST' : 'GET', headers: body ? { 'X-KGPTalkie': '1', 'Content-Type': 'application/json' } : { 'X-KGPTalkie': '1' }, body: body ? JSON.stringify(body) : undefined, signal });
  if (!r.ok) { let e = 'HTTP ' + r.status; try { e = (await r.json()).error || e; } catch (_) { } throw new Error(e); }
  return r;
 };
 const aiCfg = async () => (await aiReq('config')).json();
 const backendOf = ed => {
  const dom = ed.getDomNode(); let hit = null, any = null;
  const walk = v => { if (!v || hit) return; const c = v.__c; const be = c && c.props && c.props.connection && c.props.connection.backend;
   if (be && be.moduleSessionId && typeof be.execute === 'function') { any = any || be; if (c.base && c.base.contains && c.base.contains(dom)) hit = be; }
   (v.__k || []).forEach(walk); };
  const root = document.getElementById('root'); if (root) walk(root.__k); return hit || any;
 };
 const sqlRun = async (ed, sql) => { const be = backendOf(ed); if (!be) throw new Error('no open connection'); const r = await be.execute(sql); return { cols: (r && r.columns || []).map(c => c.name || c.title), rows: (r && r.rows) || [] }; };
 const schemaText = async (ed, focus) => {
  try {
   const db = (await sqlRun(ed, 'SELECT DATABASE()')).rows[0][0];
   const where = db ? 'c.TABLE_SCHEMA = DATABASE()' : "c.TABLE_SCHEMA NOT IN ('mysql','sys','performance_schema','information_schema')";
   const r = await sqlRun(ed, 'SELECT c.TABLE_SCHEMA, c.TABLE_NAME, t.TABLE_TYPE, c.COLUMN_NAME, c.COLUMN_TYPE, c.COLUMN_KEY FROM information_schema.COLUMNS c JOIN information_schema.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME WHERE ' + where + ' ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION LIMIT 20000');
   const T = new Map();
   for (const [s, n, ty, cn, ct, ck] of r.rows) { const k = s + '.' + n; if (!T.has(k)) T.set(k, { s, n, view: /VIEW/i.test(ty || ''), cols: [] }); T.get(k).cols.push(cn + ' ' + ct + (ck === 'PRI' ? ' pk' : '')); }
   let tabs = [...T.values()];
   if (!db) { const ss = [...new Set(tabs.map(t => t.s))].slice(0, 5); tabs = tabs.filter(t => ss.includes(t.s)); }
   const lo = String(focus || '').toLowerCase(); tabs.sort((a, b) => Number(lo.includes(b.n.toLowerCase())) - Number(lo.includes(a.n.toLowerCase())));
   const parts = []; let used = 0;
   for (const t of tabs.slice(0, 80)) { if (used > 12000) break; const line = (t.view ? 'view ' : '') + (db ? t.n : t.s + '.' + t.n) + '(' + t.cols.join(', ') + ')'; parts.push(line); used += line.length; }
   if (!parts.length) return '(no tables found)';
   return (db ? 'Current database: ' + db + '\n' : '') + parts.join('\n');
  } catch (e) { return '(schema unavailable: ' + (e && e.message || e) + ')'; }
 };
 /* prompts: the same words as SQL Notebook Studio (src/ai/prompts.ts), MySQL dialect */
 const fence = s => '```sql\n' + String(s).trim() + '\n```';
 const PR = {
  system: () => ['You are a senior MySQL engineer helping a developer inside a SQL notebook.', 'Write plain, direct Markdown. No greeting, no preamble, no closing summary.',
   'Use only tables and columns that exist in the schema you are given. Never invent them.', 'Any SQL you write must be valid MySQL, inside one ```sql code block.'].join('\n'),
  explain: (sql, schema) => `Explain this query.\n\nAnswer in exactly this shape:\n**In short:** one sentence on what the query returns.\n\n**Step by step**\n- 3 to 7 bullets in the order the database runs it (FROM/JOIN, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT). Name the real tables and columns.\n\n**Watch out**\n- 0 to 3 bullets on real pitfalls or performance issues. Leave this section out if there are none.\n\nSchema:\n${schema}\n\nQuery:\n${fence(sql)}`,
  optimize: (sql, schema, plan) => `Review this query for performance.\n\nAnswer in exactly this shape:\n**Verdict:** one sentence.\n\n**What the plan shows**\n- 2 to 4 bullets.${plan ? '' : ' (No plan was available; reason from the query and schema.)'}\n\n**Improvements**\n- Concrete changes. Write any index as a CREATE INDEX statement.\n\nIf the query can be rewritten better, end with the improved query in one sql code block. If it is already good, say so and add no code block.\n\nSchema:\n${schema}\n\nQuery:\n${fence(sql)}\n${plan ? '\nPlan:\n```\n' + plan.slice(0, 6000) + '\n```' : ''}`,
  fix: (sql, error, schema) => `This query failed.\n\nError:\n\`\`\`\n${error}\n\`\`\`\n\nAnswer in exactly this shape:\n**Cause:** one sentence.\n\nThen the corrected query in one sql code block. Keep the original intent, formatting and comments.\n\nSchema:\n${schema}\n\nQuery:\n${fence(sql)}`,
  result: (sql, csv, total) => `Describe what this result shows.\n\nAnswer with:\n- 2 to 5 bullets with concrete numbers from the data.\n- One last bullet on anything odd (nulls, outliers, duplicates), only if there is something.\n\nQuery:\n${fence(sql)}\n\nFirst rows of ${total.toLocaleString('en-US')} (CSV):\n\`\`\`\n${csv}\n\`\`\``,
  generate: (request, schema) => `Write one query for this request:\n"${request.trim()}"\n\nAnswer with one short sentence on how the query works (mention any assumption), then the query in one sql code block.\n\nSchema:\n${schema}`,
 };
 const extractSql = md => { const b = [...md.matchAll(/```(?:sql|mysql)?\s*\n([\s\S]*?)```/gi)]; const l = b.length ? b[b.length - 1][1].trim() : ''; return l || undefined; };
 const stripThinking = t => t.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').replace(/^\s+/, '');
 const toCsv = (head, rows) => { const e = v => { if (v === null || v === undefined) return ''; const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }; return [head.map(e).join(','), ...rows.map(r => r.map(e).join(','))].join('\n'); };
 const errText = x => { const rt = x && x.presentation && x.presentation.renderTarget; if (!rt) return ''; return [...rt.querySelectorAll('.resultText.error')].map(e => e.textContent.trim()).filter(Boolean).join('\n'); };
 /* the result set on screen for a cell (the selected result tab), or null */
 const resultSet = x => {
  const p = x && x.presentation, rd = p && p.resultData; if (!rd || rd.type !== 'resultSets' || !rd.sets || !rd.sets.length) return null;
  let k = 0; const rt = p.renderTarget; if (rt) { const tabs = [...rt.querySelectorAll('.resultTabview .tabArea .tabItem')]; const s = tabs.findIndex(t => t.classList.contains('selected')); if (s >= 0 && s < rd.sets.length) k = s; }
  const set = rd.sets[k]; if (!set || !set.columns || !set.columns.length) return null;
  const rows = (set.data && set.data.rows) || [];
  return { sql: set.sql || '', cols: set.columns.map(c => c.title), rows: rows.map(r => set.columns.map(c => r[c.field])), set };
 };

 /* streams one answer into the cell's AI card */
 const aiStream = async (ed, x, kind, build) => {
  const prev = AIO.get(x); if (prev && prev.ctl) prev.ctl.abort();
  const st = { kind, status: 'streaming', md: '', model: '', ver: 1, ctl: new AbortController() }; AIO.set(x, st);
  const bump = () => { st.ver++; };
  let cfg;
  try { cfg = await aiCfg(); } catch (e) { st.status = 'error'; st.md = '**AI error:** the plugin server did not answer. Open Workbench with the "Modern MySQL Workbench" shortcut.'; st.ctl = null; bump(); return st; }
  if (!cfg.ready) { st.status = 'setup'; st.md = 'AI is not set up yet. Choose a provider: OpenAI, Anthropic, OpenRouter, Ollama or your own API.'; st.ctl = null; bump(); return st; }
  st.model = cfg.provider + ' · ' + cfg.model; bump();
  try {
   const { system, user } = await build();
   const r = await aiReq('stream', { system, user }, st.ctl.signal);
   const rd = r.body.getReader(), dec = new TextDecoder(); let acc = '';
   for (;;) { const { done, value } = await rd.read(); if (done) break; acc += dec.decode(value, { stream: true }); const k = acc.indexOf('\u0000ERR:'); if (k >= 0) throw new Error(acc.slice(k + 5)); st.md = stripThinking(acc); bump(); }
   st.status = 'done'; if (kind !== 'explain' && kind !== 'result') st.sql = extractSql(st.md);
  } catch (e) { st.status = 'error'; st.md = st.ctl && st.ctl.signal.aborted ? 'Stopped.' : '**AI error:** ' + (e && e.message || e); }
  st.ctl = null; bump(); return st;
 };
 const cellSql = (ed, i) => { const m = ed.getModel(), x = ctxs(ed)[i]; if (!x || isMd(x) || isCmd(m, x)) return null; const sql = textOf(m, x); return sql.trim() ? { x, sql } : null; };
 A.aiExplain = (ed, i) => { const c = cellSql(ed, i); if (!c) return; return aiStream(ed, c.x, 'explain', async () => ({ system: PR.system(), user: PR.explain(c.sql, await schemaText(ed, c.sql)) })); };
 A.aiOptimize = (ed, i) => {
  const c = cellSql(ed, i); if (!c) return; const sql = c.sql.trim().replace(/;\s*$/, '');
  return aiStream(ed, c.x, 'optimize', async () => {
   let plan;
   if (/^\s*(select|with)\b/i.test(sql) && !sql.includes(';')) {
    try { plan = (await sqlRun(ed, 'EXPLAIN FORMAT=TREE ' + sql)).rows.map(r => r[0]).join('\n'); }
    catch (e) { try { const r = await sqlRun(ed, 'EXPLAIN ' + sql); plan = [r.cols.join('\t'), ...r.rows.map(x => x.join('\t'))].join('\n'); } catch (_) { } }
   }
   return { system: PR.system(), user: PR.optimize(sql, await schemaText(ed, sql), plan) };
  });
 };
 A.aiFix = (ed, i) => { const c = cellSql(ed, i); if (!c) return; const err = errText(c.x); if (!err) return; return aiStream(ed, c.x, 'fix', async () => ({ system: PR.system(), user: PR.fix(c.sql, err, await schemaText(ed, c.sql)) })); };
 A.aiResult = async (ed, i) => {
  const x = ctxs(ed)[i], rs = resultSet(x); if (!rs || !rs.rows.length) return;
  let cfg = null; try { cfg = await aiCfg(); } catch (e) { }
  const local = cfg && (cfg.provider === 'ollama' || cfg.provider === 'custom') && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(cfg.baseUrl || '');
  if (cfg && cfg.ready && !local && !cfg.allowResultData) {
   const ok = await askDlg('Send rows to AI?', 'Explain Result sends the first 50 rows of this result to your AI provider (' + cfg.provider + ').', ['Send once', 'Always allow', 'Cancel']);
   if (!ok || ok === 'Cancel') return;
   if (ok === 'Always allow') await aiReq('config', { allowResultData: true });
  }
  const csv = toCsv(rs.cols, rs.rows.slice(0, 50));
  return aiStream(ed, x, 'result', async () => ({ system: PR.system(), user: PR.result(rs.sql, csv, rs.rows.length) }));
 };
 /* AI cell: plain words -> SQL in the cell below (a cell this cell wrote earlier is replaced) */
 const GEN = '-- AI-written from the cell above';
 A.aiCell = async (ed, i, inRunAll) => {
  const m = ed.getModel(), x = ctxs(ed)[i]; if (!isAi(x)) return null;
  const request = textOf(m, x).split('\n').slice(1).join('\n').trim();
  if (!request) { AIO.delete(x); return { status: 'done' }; }
  const st = await aiStream(ed, x, 'generate', async () => ({ system: PR.system(), user: PR.generate(request, await schemaText(ed, request)) }));
  if (st.status !== 'done' || !st.sql) { if (st.status === 'done' && !st.sql) { st.status = 'error'; st.md += '\n\n**No SQL in the answer.** Try rewording the request.'; st.ver++; } return st; }
  const j = ctxs(ed).indexOf(x); if (j < 0) return st;
  const nx = ctxs(ed)[j + 1], text = GEN + '\n' + st.sql;
  if (nx && !isMd(nx) && m.getLineContent(nx.startLine).trim() === GEN) await act(ed, 'AI: Write SQL', () => setCell(ed, j + 1, { text, lang: nx.language, res: null }));
  else await act(ed, 'AI: Write SQL', async () => { const k = insCore(ed, j + 1, 'mysql'); await setCell(ed, k, { text, lang: 'mysql', res: null }); });
  R.num.set(x, ++R.n); st.note = 'SQL is in the cell below.'; st.ver++; dirty(ed);
  let auto = false; try { auto = !inRunAll && (await aiCfg()).runGeneratedSql; } catch (e) { }
  if (auto) A.run(ed, j + 1);
  return st;
 };

 /* the card under a cell */
 const AI_TITLE = { explain: 'Explanation', optimize: 'Optimization', fix: 'Suggested fix', result: 'About this result', generate: 'Generated SQL' };
 const DDL = /^\s*(?:(?:--[^\n]*\n|\/\*[\s\S]*?\*\/)\s*)*(create|alter|drop|analyze)\b/i;
 const aiBtn = (a, icon, t) => `<button data-ai="${a}"><span class="codicon codicon-${icon}"></span>${t}</button>`;
 const aiHtml = st => {
  const title = st.status === 'setup' ? 'Set up AI' : AI_TITLE[st.kind] || 'AI';
  let body = st.md || '';
  if (st.kind === 'generate' && st.status === 'done') body = body.replace(/```[\s\S]*?```/g, '').trim();
  const bodyHtml = st.status === 'streaming' && !st.md ? '<div class="kgptalkieAiSk"><i></i><i></i><i></i></div>' : (body ? mdToHtml(body) : '');
  let acts = '';
  if (st.status === 'setup' || st.status === 'error') acts += aiBtn('configure', 'settings-gear', 'Configure AI');
  if (st.status === 'done' && st.sql && (st.kind === 'fix' || st.kind === 'optimize')) acts += (DDL.test(st.sql) ? aiBtn('addcell', 'add', 'Add as new cell') : aiBtn('apply', 'check', 'Apply to cell')) + aiBtn('copysql', 'copy', 'Copy SQL');
  if (st.status === 'done' && st.kind === 'generate' && st.note) acts += '<span class="kgptalkieAiNote"><span class="codicon codicon-arrow-down"></span>' + esc(st.note) + '</span>' + aiBtn('runnext', 'play', 'Run it');
  if (st.status === 'streaming') acts += aiBtn('stop', 'debug-stop', 'Stop');
  return `<div class="kgptalkieAi kgptalkieAi-${st.status}"><div class="kgptalkieAiH"><span class="codicon codicon-sparkle"></span><b>${esc(title)}</b>${st.status === 'streaming' ? '<span class="codicon codicon-loading kgptalkieSpin"></span>' : ''}<span class="kgptalkieAiM">${esc(st.model || '')}</span><span class="kgptalkieSp"></span>${st.kind !== 'generate' || st.status !== 'streaming' ? '<button data-ai="dismiss" title="Dismiss"><span class="codicon codicon-close"></span></button>' : ''}</div><div class="kgptalkieMdBody kgptalkieAiB">${bodyHtml}</div>${acts ? '<div class="kgptalkieAiActs">' + acts + '</div>' : ''}</div>`;
 };
 const aiClick = async (ed, x, e) => {
  const b = e.target.closest('button[data-ai]'); if (!b) { e.stopPropagation(); return; }
  e.preventDefault(); e.stopPropagation(); const st = AIO.get(x); const a = b.dataset.ai; const i = ctxs(ed).indexOf(x); if (!st) return;
  if (a === 'dismiss') { if (st.ctl) st.ctl.abort(); AIO.delete(x); }
  else if (a === 'stop') { if (st.ctl) st.ctl.abort(); }
  else if (a === 'configure') aiDialog();
  else if (a === 'copysql') { try { await navigator.clipboard.writeText(st.sql); b.lastChild.textContent = 'Copied'; } catch (_) { } }
  else if (a === 'apply' && i >= 0) { await act(ed, 'AI: Apply to Cell', () => setCell(ed, i, { text: st.sql, lang: x.language, res: null })); AIO.delete(ctxs(ed)[i]); AIO.delete(x); dirty(ed); }
  else if (a === 'addcell' && i >= 0) { await act(ed, 'AI: Add Cell', async () => { const k = insCore(ed, i + 1, 'mysql'); await setCell(ed, k, { text: st.sql, lang: 'mysql', res: null }); }); AIO.delete(x); dirty(ed); selectCell(ed, i + 1); }
  else if (a === 'runnext' && i >= 0) A.run(ed, i + 1);
 };
 const paintAi = ed => {
  const S = ed.kgptalkieNB; if (!S) return; S.ai = S.ai || new Map(); const arr = ctxs(ed), now = performance.now();
  for (const [x, z] of [...S.ai]) if (!arr.includes(x) || !AIO.get(x) || z.line !== x.endLine) { ed.changeViewZones(a => a.removeZone(z.id)); S.ai.delete(x); }
  arr.forEach((x, i) => {
   const st = AIO.get(x); if (!st || rendered(x)) return; let z = S.ai.get(x);
   if (!z) {
    const node = document.createElement('div'); node.className = 'kgptalkieAiZone';
    const zone = { afterLineNumber: x.endLine, ordinal: 5e8, heightInPx: 64, domNode: node, suppressMouseDown: true, showInHiddenAreas: true };
    let id; ed.changeViewZones(a => { id = a.addZone(zone); });
    z = { id, zone, node, line: x.endLine, ver: -1, t: 0, h: 64 }; S.ai.set(x, z);
    node.addEventListener('mousedown', e => aiClick(ed, x, e), { signal: AC.signal });
   }
   z.node.dataset.kcell = i;
   if (z.ver !== st.ver && (st.status !== 'streaming' || now - z.t > 90)) { z.ver = st.ver; z.t = now; z.node.innerHTML = aiHtml(st); }
   const card = z.node.firstElementChild; const h = card ? card.offsetHeight + 16 : 0;
   if (h && Math.abs(h - z.h) > 1) { z.h = h; z.zone.heightInPx = h; ed.changeViewZones(a => a.layoutZone(z.id)); }
  });
 };
 /* "Fix with AI" on errors, "Explain result" on result sets */
 const resultButtons = ed => {
  ctxs(ed).forEach((x, i) => {
   const rt = x.presentation && x.presentation.renderTarget; if (!rt) return;
   const er = rt.querySelector('.resultText.error');
   // our own run notes (timeout, Not run, no variable value, read-only) leave nothing for AI to fix
   if (er && !rt.querySelector('.kgptalkieFixBtn') && !/Stopped after \d+ s \(query timeout|Not run\.|Cancelled: a variable has no value|is read-only\. This statement changes data/.test(rt.textContent)) { const b = document.createElement('button'); b.className = 'kgptalkieFixBtn'; b.innerHTML = '<span class="codicon codicon-sparkle"></span>Fix with AI'; b.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); A.aiFix(ed, ctxs(ed).indexOf(x)); }, { signal: AC.signal }); er.insertAdjacentElement('afterend', b); }
   try { resultBar(ed, x, rt); pinButtons(rt); } catch (e) { W.kgptalkieErr = String(e && e.stack || e); }
  });
 };

 /* small modal dialogs */
 const dlg = (title, inner) => { document.querySelectorAll('.kgptalkieDlgBack').forEach(d => d.remove()); const bk = document.createElement('div'); bk.className = 'kgptalkieDlgBack'; bk.innerHTML = `<div class="kgptalkieDlg" role="dialog"><div class="kgptalkieDlgT">${esc(title)}</div>${inner}</div>`; document.body.appendChild(bk); bk.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); bk.remove(); } }); return bk; };
 const askDlg = (title, text, buttons) => new Promise(res => {
  const bk = dlg(title, `<p>${esc(text)}</p><div class="kgptalkieDlgB">${buttons.map((b, k) => `<button class="${k === 0 ? 'pri' : ''}" data-b="${esc(b)}">${esc(b)}</button>`).join('')}</div>`);
  bk.addEventListener('mousedown', e => { const b = e.target.closest('button[data-b]'); if (b) { e.preventDefault(); bk.remove(); res(b.dataset.b); } else if (e.target === bk) { bk.remove(); res(null); } });
  const f = bk.querySelector('button'); if (f) f.focus();
 });
 const aiDialog = async () => {
  let cfg; try { cfg = await aiCfg(); } catch (e) { await askDlg('Configure AI', 'The plugin server did not answer. Open Workbench with the "Modern MySQL Workbench" shortcut.', ['OK']); return; }
  const opts = cfg.providers.map(p => `<option value="${p.id}"${p.id === cfg.provider ? ' selected' : ''}>${esc(p.label)}</option>`).join('');
  const bk = dlg('Configure AI', `
   <label>Provider<select data-f="provider">${opts}</select></label>
   <div class="kgptalkieDlgHint" data-f="detail"></div>
   <label data-row="base">Base URL<input data-f="baseUrl" spellcheck="false"></label>
   <label data-row="key">API key<input data-f="apiKey" type="password" autocomplete="off" spellcheck="false"></label>
   <div class="kgptalkieDlgHint" data-row="key2">Stored encrypted on this PC by the plugin (Windows DPAPI). Never written to notebooks or settings. <a href="#" data-f="forget">Forget the saved key</a></div>
   <label>Model<span class="kgptalkieDlgRow"><input data-f="model" list="kgptalkieAiModels" spellcheck="false"><button data-f="load">Load models</button></span></label><datalist id="kgptalkieAiModels"></datalist>
   <label class="chk"><input type="checkbox" data-f="allowResultData"> Send result rows to AI without asking (Explain Result). A local model never asks.</label>
   <label class="chk"><input type="checkbox" data-f="runGeneratedSql"> Run SQL from an AI cell right after it is written</label>
   <div class="kgptalkieDlgStatus" data-f="status"></div>
   <div class="kgptalkieDlgB"><button class="pri" data-f="save">Save and test</button><button data-f="close">Close</button></div>`);
  const q = f => bk.querySelector(`[data-f="${f}"]`), row = r => bk.querySelector(`[data-row="${r}"]`);
  const DETAIL = { openai: 'GPT models. Needs an API key.', anthropic: 'Claude models. Needs an API key.', openrouter: 'Hundreds of models with one key.', ollama: 'Local models on this computer. No key, nothing leaves your machine.', custom: 'LM Studio, vLLM, LiteLLM and other OpenAI-compatible APIs.' };
  const BASE = { ollama: 'http://localhost:11434', custom: 'http://localhost:1234/v1' };
  q('allowResultData').checked = cfg.allowResultData; q('runGeneratedSql').checked = cfg.runGeneratedSql;
  const sync = keepModel => {
   const p = q('provider').value, info = cfg.providers.find(x => x.id === p);
   q('detail').textContent = DETAIL[p] || '';
   row('base').style.display = (p === 'ollama' || p === 'custom') ? '' : 'none';
   row('key').style.display = row('key2').style.display = (info.needsKey || p === 'custom') ? '' : 'none';
   q('forget').style.display = cfg.hasKey[p] ? '' : 'none';
   q('apiKey').value = ''; q('apiKey').placeholder = cfg.hasKey[p] ? 'A key is saved. Leave empty to keep it.' : (p === 'custom' ? 'Optional' : 'Paste your API key');
   if (!keepModel) { q('baseUrl').value = p === cfg.provider ? (cfg.baseUrl || BASE[p] || '') : (BASE[p] || ''); q('model').value = p === cfg.provider ? cfg.model : ({ openai: 'gpt-6.1-sol', anthropic: 'claude-sonnet-5-5', openrouter: 'openrouter/auto' }[p] || ''); bk.querySelector('#kgptalkieAiModels').innerHTML = ''; }
  };
  sync(false); q('baseUrl').value = cfg.baseUrl || BASE[cfg.provider] || ''; q('model').value = cfg.model || '';
  const status = (t, cls) => { const s = q('status'); s.textContent = t; s.className = 'kgptalkieDlgStatus ' + (cls || ''); };
  const vals = () => ({ provider: q('provider').value, baseUrl: q('baseUrl').value.trim(), apiKey: q('apiKey').value.trim(), model: q('model').value.trim() });
  q('provider').addEventListener('change', () => { sync(false); status(''); });
  bk.addEventListener('mousedown', async e => {
   if (e.target === bk) { bk.remove(); return; }
   const t = e.target.closest('[data-f]'); if (!t) return; const f = t.dataset.f;
   if (f === 'close') { e.preventDefault(); bk.remove(); }
   else if (f === 'forget') { e.preventDefault(); cfg = await (await aiReq('config', { provider: q('provider').value, forgetKey: true })).json(); sync(true); status('The saved key was removed.', 'ok'); }
   else if (f === 'load') {
    e.preventDefault(); status('Loading models...');
    try { const j = await (await aiReq('models', vals())).json(); bk.querySelector('#kgptalkieAiModels').innerHTML = j.models.map(m => `<option value="${esc(m)}">`).join(''); status(j.models.length + ' models. Type to filter in the Model box.', 'ok'); if (!q('model').value && j.models[0]) q('model').value = j.models[0]; }
    catch (err) { status('Could not list models: ' + err.message + '. You can type a model ID.', 'bad'); }
   } else if (f === 'save') {
    e.preventDefault(); const v = vals();
    if (!v.model) { status('Choose a model first.', 'bad'); return; }
    const info = cfg.providers.find(x => x.id === v.provider);
    if (info.needsKey && !v.apiKey && !cfg.hasKey[v.provider]) { status('Paste your API key first.', 'bad'); return; }
    try { cfg = await (await aiReq('config', { ...v, allowResultData: q('allowResultData').checked, runGeneratedSql: q('runGeneratedSql').checked })).json(); }
    catch (err) { status('Could not save: ' + err.message, 'bad'); return; }
    sync(true); status('Testing ' + info.label + ' · ' + cfg.model + '...');
    try { const r = await aiReq('stream', { system: 'Reply with the single word OK.', user: 'Say OK' }); const txt = await r.text(); if (txt.includes('\u0000ERR:')) throw new Error(txt.split('\u0000ERR:')[1]); status('AI is ready: ' + info.label + ' · ' + cfg.model, 'ok'); }
    catch (err) { status('Saved, but the test failed: ' + err.message, 'bad'); }
   }
  });
  q('provider').focus();
 };
 W.kgptalkieAi = { dialog: () => aiDialog(), schemaText, sqlRun, resultSet };

 /* ---------- results (from SQL Notebook Studio): toolbar, search, column filters, copy / save, chart, value viewer ----------
    Works on Workbench's own Tabulator grid (found through the result's render root), so its sort and resize stay. */
 const RS = W.kgptalkieRes || (W.kgptalkieRes = new WeakMap());                 // context -> result view state
 const rsState = x => { let s = RS.get(x); if (!s) { s = { view: 'table', q: '', filt: false, cf: {}, expand: false, chart: null }; RS.set(x, s); } return s; };
 const tabOf = rt => {
  if (rt.kgptalkieTab && rt.kgptalkieTab.element && rt.kgptalkieTab.element.isConnected && rt.kgptalkieTab.element.offsetWidth) return rt.kgptalkieTab;
  let hit = null; const walk = v => { if (!v || hit) return; const c = v.__c; if (c && c.tabulator && typeof c.tabulator.getData === 'function' && c.tabulator.element && c.tabulator.element.offsetWidth) hit = c.tabulator; (v.__k || []).forEach(walk); };
  walk(rt.__k); rt.kgptalkieTab = hit; return hit;
 };
 const coll = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
 const isNil = v => v === null || v === undefined;
 const toNum = v => typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' && !isNaN(+v) ? +v : NaN);
 const sval = v => isNil(v) ? null : typeof v === 'object' ? JSON.stringify(v) : String(v);
 const filterFn = (expr, numeric) => {
  const s = String(expr || '').trim(); if (!s) return null; let m;
  if (/^null$/i.test(s)) return v => isNil(v);
  if (/^(!null|not null)$/i.test(s)) return v => !isNil(v);
  if ((m = /^(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)$/.exec(s))) { const a = +m[1], b = +m[2]; return v => { const n = toNum(v); return !isNaN(n) && n >= a && n <= b; }; }
  if ((m = /^(>=|<=|!=|<>|>|<|=)\s*(.+)$/.exec(s))) {
   const op = m[1], rhs = m[2].trim(), rn = +rhs, num = rhs !== '' && !isNaN(rn) && (numeric || /^-?[\d.]+$/.test(rhs));
   const cmp = (a, b) => op === '>' ? a > b : op === '<' ? a < b : op === '>=' ? a >= b : op === '<=' ? a <= b : op === '=' ? a === b : a !== b;
   return v => { if (isNil(v)) return op === '!=' || op === '<>'; if (num) { const n = toNum(v); return !isNaN(n) && cmp(n, rn); } return cmp(coll.compare(sval(v), rhs), 0); };
  }
  if (s.startsWith('!')) { const t = s.slice(1).toLowerCase(); return v => !(sval(v) || '').toLowerCase().includes(t); }
  const t = s.toLowerCase(); return v => !isNil(v) && sval(v).toLowerCase().includes(t);
 };
 const colInfo = t => t.getColumns().filter(c => c.getField() !== undefined && c.isVisible()).map(c => ({ c, f: c.getField(), title: c.getDefinition().title }));
 const numericCol = (rows, f) => { let seen = 0; for (const r of rows) { const v = r[f]; if (isNil(v)) continue; if (isNaN(toNum(v))) return false; if (++seen >= 20) break; } return seen > 0; };
 const applyFilters = (t, st) => {
  const cols = colInfo(t), all = t.getData(), fns = [];
  for (const k of cols) { const fn = filterFn(st.cf[k.f], numericCol(all, k.f)); if (fn) fns.push([k.f, fn]); }
  const q = st.q.trim().toLowerCase();
  if (!fns.length && !q) { t.clearFilter(); return; }
  t.setFilter(r => (!q || cols.some(k => !isNil(r[k.f]) && sval(r[k.f]).toLowerCase().includes(q))) && fns.every(([f, fn]) => fn(r[f])));
 };
 const visible = t => { const cols = colInfo(t); const rows = t.getData('active'); return { head: cols.map(k => k.title), fields: cols.map(k => k.f), rows: rows.map(r => cols.map(k => r[k.f])) }; };
 const FMT = {
  tsv: d => [d.head, ...d.rows].map(r => r.map(v => isNil(v) ? '' : sval(v).replace(/[\t\r\n]/g, ' ')).join('\t')).join('\n'),
  csv: d => toCsv(d.head, d.rows),
  json: d => JSON.stringify(d.rows.map(r => Object.fromEntries(d.head.map((h, k) => [h, isNil(r[k]) ? null : r[k]]))), null, 2),
  md: d => { const num = d.head.map((h, k) => d.rows.length > 0 && d.rows.every(r => isNil(r[k]) || !isNaN(toNum(r[k])))); const cell = v => isNil(v) ? 'NULL' : sval(v).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
   return ['| ' + d.head.map(cell).join(' | ') + ' |', '| ' + num.map(n => n ? '---:' : '---').join(' | ') + ' |', ...d.rows.map(r => '| ' + r.map(cell).join(' | ') + ' |')].join('\n'); },
 };
 const copyText = async text => { try { await navigator.clipboard.writeText(text); return true; } catch (e) { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } };
 const saveAs = (file, content, filters, encoding) => {
  const data = { title: 'Save', saveLabel: 'Save', default: file, filters, content, encoding: encoding || 'utf8' };
  if (W.electronHost && W.electronHost.postMessage) { W.electronHost.postMessage({ source: 'app', command: 'saveFile', data }); return; }
  const a = document.createElement('a'); a.href = encoding === 'base64' ? 'data:application/octet-stream;base64,' + content : URL.createObjectURL(new Blob([content])); a.download = file; a.click();
 };
 const fileBase = sql => { const m = /\bfrom\s+[`"[]?([\w.$]+)/i.exec(sql || ''); return (m ? m[1] : 'result').replace(/[^\w.-]/g, '_'); };
 let nbToastT = 0;
 const nbToast = msg => { let b = document.querySelector('.kgptalkieNbToast'); if (!b) { b = document.createElement('div'); b.className = 'kgptalkieNbToast'; document.body.appendChild(b); } b.textContent = msg; b.classList.add('on'); clearTimeout(nbToastT); nbToastT = setTimeout(() => b.classList.remove('on'), 1600); };
 const flash = (el, text) => { const o = el.dataset.t || el.lastChild.textContent; el.dataset.t = o; el.lastChild.textContent = text; setTimeout(() => { el.lastChild.textContent = o; }, 1500); };

 /* charts: plain SVG (no library), the same choices as SQL Notebook Studio */
 const PAL = ['#3794ff', '#d18616', '#2da44e', '#8250df', '#cf222e', '#bf8700'];
 const isDateStr = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);
 const autoChart = d => {
  const kind = d.head.map((h, k) => { const vals = d.rows.slice(0, 20).map(r => r[k]).filter(v => !isNil(v)); if (!vals.length) return 'empty'; if (vals.every(isDateStr)) return 'date'; if (vals.every(v => !isNaN(toNum(v)))) return 'number'; return 'string'; });
  let x = kind.indexOf('date'); if (x < 0) x = kind.indexOf('string'); if (x < 0) x = 0;
  const y = kind.map((k, i) => k === 'number' && i !== x ? i : -1).filter(i => i >= 0).slice(0, 3);
  return y.length ? { type: kind[x] === 'date' ? 'line' : 'bar', x: d.head[x], y: y.map(i => d.head[i]), stacked: false, horizontal: false } : null;
 };
 const niceTicks = (lo, hi, n = 5) => {
  if (lo === hi) { hi = lo + 1; lo = lo - (lo ? 0 : 0); } const span = hi - lo, step0 = Math.pow(10, Math.floor(Math.log10(span / n))), err = span / n / step0;
  const step = step0 * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1); const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step; const t = []; for (let v = a; v <= b + step / 2; v += step) t.push(+v.toFixed(10)); return t;
 };
 const fmtN = v => Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(Math.abs(v) >= 1e7 ? 0 : 1) + 'M' : Math.abs(v) >= 1e4 ? (v / 1e3).toFixed(Math.abs(v) >= 1e5 ? 0 : 1) + 'k' : String(+v.toFixed(2));
 const chartSvg = (cfg, d, W0, H0) => {
  const xi = d.head.indexOf(cfg.x), ys = cfg.y.map(n => d.head.indexOf(n)).filter(i => i >= 0); if (xi < 0 || !ys.length) return '<div class="kgptalkieChartMsg">Choose a column for X and at least one number column for Y.</div>';
  const pie = cfg.type === 'pie', max = pie ? 60 : 5000, rows = d.rows.slice(0, max), cut = d.rows.length > max;
  const e = s => esc(String(s)); let s = '';
  const legend = (pie ? rows.map(r => sval(r[xi]) ?? 'NULL') : ys.map(i => d.head[i])).slice(0, 12);
  const LG = 22; let lx = 56; const lg = legend.map((l, k) => { const w = Math.min(160, 18 + String(l).length * 6.6); const g = `<g transform="translate(${lx},6)"><rect width="10" height="10" rx="2" fill="${PAL[k % PAL.length]}"/><text x="14" y="9.5">${e(String(l).slice(0, 22))}</text></g>`; lx += w + 10; return lx < W0 ? g : ''; }).join('');
  if (pie) {
   const vals = rows.map(r => Math.max(0, toNum(r[ys[0]]) || 0)), tot = vals.reduce((a, b) => a + b, 0) || 1, cx = W0 / 2, cy = LG + (H0 - LG) / 2, R = Math.min(W0, H0 - LG) / 2 - 10, r0 = R * 0.55;
   let a0 = -Math.PI / 2; const arcs = vals.map((v, k) => { const a1 = a0 + v / tot * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0, p = (a, rr) => (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
    const path = v >= tot ? `M ${p(0, R)} A ${R} ${R} 0 1 1 ${p(Math.PI, R)} A ${R} ${R} 0 1 1 ${p(0, R)} M ${p(0, r0)} A ${r0} ${r0} 0 1 0 ${p(Math.PI, r0)} A ${r0} ${r0} 0 1 0 ${p(0, r0)} Z` : `M ${p(a0, R)} A ${R} ${R} 0 ${big} 1 ${p(a1, R)} L ${p(a1, r0)} A ${r0} ${r0} 0 ${big} 0 ${p(a0, r0)} Z`;
    a0 = a1; return `<path d="${path}" fill="${PAL[k % PAL.length]}" stroke="#fff" stroke-width="1"><title>${e(legend[k] ?? '')}: ${e(v)}</title></path>`; }).join('');
   return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W0}" height="${H0}" font-family="Segoe UI, sans-serif" font-size="11" fill="#555">${lg}${arcs}</svg>`, cut, max };
  }
  const L = 60, Rr = 16, T = LG + 10, B = 46, pw = W0 - L - Rr, ph = H0 - T - B;
  const numX = cfg.type === 'scatter' && rows.every(r => isNil(r[xi]) || !isNaN(toNum(r[xi])));
  const yv = rows.map(r => ys.map(i => toNum(r[i]) || 0));
  let lo = 0, hi = 0;
  if (cfg.stacked && (cfg.type === 'bar' || cfg.type === 'area')) yv.forEach(v => { hi = Math.max(hi, v.reduce((a, b) => a + Math.max(0, b), 0)); lo = Math.min(lo, v.reduce((a, b) => a + Math.min(0, b), 0)); });
  else yv.forEach(v => v.forEach(n => { hi = Math.max(hi, n); lo = Math.min(lo, n); }));
  if (cfg.type === 'scatter' || cfg.type === 'line') { const all = yv.flat(); if (all.length) { lo = Math.min(...all); hi = Math.max(...all); if (lo > 0 && lo < hi * 0.5) lo = 0; } }
  const tk = niceTicks(lo, hi), ylo = tk[0], yhi = tk[tk.length - 1];
  const horiz = cfg.type === 'bar' && cfg.horizontal;
  const vpos = v => horiz ? L + (v - ylo) / (yhi - ylo) * pw : T + ph - (v - ylo) / (yhi - ylo) * ph;
  const n = rows.length, band = (horiz ? ph : pw) / Math.max(1, n);
  const cpos = k => (horiz ? T : L) + band * (k + 0.5);
  let xlo = 0, xhi = 1, xt = []; if (numX) { const xs = rows.map(r => toNum(r[xi])).filter(v => !isNaN(v)); xt = niceTicks(Math.min(...xs), Math.max(...xs)); xlo = xt[0]; xhi = xt[xt.length - 1]; }
  const xpos = v => L + (v - xlo) / (xhi - xlo) * pw;
  // grid + value axis
  s = tk.map(v => horiz ? `<line x1="${vpos(v)}" x2="${vpos(v)}" y1="${T}" y2="${T + ph}" stroke="#EEE"/><text x="${vpos(v)}" y="${T + ph + 14}" text-anchor="middle">${fmtN(v)}</text>`
   : `<line x1="${L}" x2="${L + pw}" y1="${vpos(v)}" y2="${vpos(v)}" stroke="#EEE"/><text x="${L - 6}" y="${vpos(v) + 3.5}" text-anchor="end">${fmtN(v)}</text>`).join('');
  // category axis labels (thinned)
  if (numX) s += xt.map(v => `<text x="${xpos(v)}" y="${T + ph + 14}" text-anchor="middle">${fmtN(v)}</text>`).join('');
  else { const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor((horiz ? ph / 16 : pw / 70))))); rows.forEach((r, k) => { if (k % every) return; const lab = e(String(sval(r[xi]) ?? 'NULL').slice(0, horiz ? 14 : 12)); s += horiz ? `<text x="${L - 6}" y="${cpos(k) + 3.5}" text-anchor="end">${lab}</text>` : `<text x="${cpos(k)}" y="${T + ph + 14}" text-anchor="middle">${lab}</text>`; }); }
  s += `<text x="${horiz ? 12 : L + pw / 2}" y="${horiz ? T - 8 : H0 - 8}" text-anchor="${horiz ? 'start' : 'middle'}" fill="#777">${e(cfg.x)}</text>`;
  const tip = (k, j) => `<title>${e(sval(rows[k][xi]) ?? 'NULL')} · ${e(d.head[ys[j]])}: ${e(yv[k][j])}</title>`;
  if (cfg.type === 'bar') {
   const m = ys.length, gw = Math.min(48 * (cfg.stacked ? 1 : m), band * 0.8), bw = cfg.stacked ? gw : gw / m;
   rows.forEach((r, k) => { let pos = 0, neg = 0; ys.forEach((yi, j) => { const v = yv[k][j]; let a, b; if (cfg.stacked) { if (v >= 0) { a = pos; b = pos + v; pos = b; } else { a = neg; b = neg + v; neg = b; } } else { a = 0; b = v; }
    const p1 = vpos(Math.max(ylo, Math.min(a, b))), p2 = vpos(Math.min(yhi, Math.max(a, b))), off = cpos(k) - gw / 2 + (cfg.stacked ? 0 : j * bw);
    s += horiz ? `<rect x="${p1.toFixed(1)}" y="${off.toFixed(1)}" width="${Math.max(0.5, p2 - p1).toFixed(1)}" height="${Math.max(1, bw - 1).toFixed(1)}" rx="2" fill="${PAL[j % PAL.length]}">${tip(k, j)}</rect>`
     : `<rect x="${off.toFixed(1)}" y="${p2.toFixed(1)}" width="${Math.max(1, bw - 1).toFixed(1)}" height="${Math.max(0.5, p1 - p2).toFixed(1)}" rx="2" fill="${PAL[j % PAL.length]}">${tip(k, j)}</rect>`; }); });
  } else {
   const xAt = k => numX ? xpos(toNum(rows[k][xi])) : cpos(k);
   const base = new Array(n).fill(0);
   ys.forEach((yi, j) => {
    const top = rows.map((r, k) => cfg.stacked && cfg.type === 'area' ? base[k] + yv[k][j] : yv[k][j]);
    const pts = rows.map((r, k) => [xAt(k), vpos(top[k])]);
    if (cfg.type === 'scatter') s += pts.map((p, k) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="${PAL[j % PAL.length]}" fill-opacity=".8">${tip(k, j)}</circle>`).join('');
    else {
     const line = pts.map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
     if (cfg.type === 'area') { const bottom = rows.map((r, k) => [xAt(k), vpos(cfg.stacked ? base[k] : Math.max(ylo, 0))]).reverse(); s += `<path d="${line} ${bottom.map(p => 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')} Z" fill="${PAL[j % PAL.length]}" fill-opacity=".22"/>`; }
     s += `<path d="${line}" fill="none" stroke="${PAL[j % PAL.length]}" stroke-width="2" stroke-linejoin="round"/>`;
     if (n <= 60) s += pts.map((p, k) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${PAL[j % PAL.length]}">${tip(k, j)}</circle>`).join('');
    }
    if (cfg.stacked && cfg.type === 'area') top.forEach((v, k) => { base[k] = v; });
   });
  }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W0}" height="${H0}" font-family="Segoe UI, sans-serif" font-size="11" fill="#555">${lg}<line x1="${L}" x2="${horiz ? L : L + pw}" y1="${T + ph}" y2="${horiz ? T : T + ph}" stroke="#CCC"/>${s}</svg>`, cut, max };
 };
 const chartKey = sql => 'kgptalkieChart:' + hashStr(String(sql || '').trim());
 // a chart is remembered by the cell's own text (so {{variables}} do not change the key), else by the statement that ran
 const cellCode = x => (x && typeof x.code === 'string' && x.code.trim()) || '';
 const chartCfg = (x, rs, d) => { const st = rsState(x); if (!st.chart) { let saved = null; for (const k of [cellCode(x), rs.sql]) { if (!k || saved) continue; try { saved = JSON.parse(store.get(chartKey(k), 'null')); } catch (e) { } } st.chart = saved && saved.cfg && d.head.includes(saved.cfg.x) ? saved.cfg : autoChart(d); if (saved && saved.view === 'chart' && st.chart) st.view = 'chart'; } return st.chart; };
 const saveChart = (x, rs) => { const st = rsState(x); store.set(chartKey(cellCode(x) || rs.sql), JSON.stringify({ view: st.view, cfg: st.chart })); };
 const TYPES = [['bar', 'graph', 'Bar'], ['line', 'graph-line', 'Line'], ['area', 'pulse', 'Area'], ['scatter', 'graph-scatter', 'Scatter'], ['pie', 'pie-chart', 'Pie']];
 const renderChart = (ed, x, rt, t) => {
  const rs = resultSet(x); if (!rs) return; const d = { head: rs.cols, rows: rs.rows }; const st = rsState(x);
  if (t) { const v = visible(t); d.head = v.head; d.rows = v.rows; }
  const cfg = chartCfg(x, rs, d); let box = rt.querySelector(':scope > .kgptalkieChartBox');
  if (!box) { box = document.createElement('div'); box.className = 'kgptalkieChartBox'; rt.appendChild(box); box.addEventListener('mousedown', e => chartClick(ed, x, rt, e), { signal: AC.signal }); box.addEventListener('change', e => chartChange(ed, x, rt, e), { signal: AC.signal }); }
  const sig = JSON.stringify([cfg, d.rows.length, hashStr(JSON.stringify(d.rows.slice(0, 50))), st.expand, rt.clientWidth]); if (box.dataset.sig === sig) return; box.dataset.sig = sig;
  if (!cfg) { box.innerHTML = '<div class="kgptalkieChartMsg">No number columns to chart.</div>'; return; }
  const W0 = Math.max(320, rt.clientWidth - 40), H0 = Math.max(220, Math.min(st.expand ? 640 : 320, 420 + (st.expand ? 220 : 0)));
  const r = chartSvg(cfg, d, W0, H0);
  const numCols = d.head.filter((h, k) => d.rows.slice(0, 20).some(rr => !isNil(rr[k]) && !isNaN(toNum(rr[k]))));
  box.innerHTML = `<div class="kgptalkieChartCtl">${TYPES.map(([id, ic, lab]) => `<button data-c="type" data-v="${id}" class="${cfg.type === id ? 'on' : ''}" title="${lab}"><span class="codicon codicon-${ic}"></span></button>`).join('')}
   <span class="kgptalkieSepV"></span><label>X <select data-c="x">${d.head.map(h => `<option${h === cfg.x ? ' selected' : ''}>${esc(h)}</option>`).join('')}</select></label>
   <button data-c="ymenu" class="kgptalkieYBtn">Y: ${esc(cfg.y.join(', ') || 'none')} <span class="codicon codicon-chevron-down"></span></button>
   ${cfg.type === 'bar' || cfg.type === 'area' ? `<button data-c="stack" class="${cfg.stacked ? 'on' : ''}" title="Stack series"><span class="codicon codicon-layers"></span></button>` : ''}
   ${cfg.type === 'bar' ? `<button data-c="horiz" class="${cfg.horizontal ? 'on' : ''}" title="Horizontal bars"><span class="codicon codicon-list-flat"></span></button>` : ''}
   <span class="kgptalkieSp"></span>${r.cut ? `<span class="kgptalkieChartCut">First ${r.max.toLocaleString('en-US')} rows</span>` : ''}<button data-c="png" title="Save as PNG"><span class="codicon codicon-device-camera"></span></button></div>
   <div class="kgptalkieChartSvg">${typeof r === 'string' ? r : r.svg}</div>`;
  box.dataset.ycols = JSON.stringify(numCols);
 };
 const chartClick = (ed, x, rt, e) => {
  const b = e.target.closest('button[data-c]'); if (!b) return; e.preventDefault(); e.stopPropagation(); const st = rsState(x), cfg = st.chart, rs = resultSet(x); if (!cfg || !rs) return; const c = b.dataset.c;
  if (c === 'type') cfg.type = b.dataset.v; else if (c === 'stack') cfg.stacked = !cfg.stacked; else if (c === 'horiz') cfg.horizontal = !cfg.horizontal;
  else if (c === 'ymenu') { const cols = JSON.parse(b.closest('.kgptalkieChartBox').dataset.ycols || '[]'); if (!cols.length) return; openMenu(b, cols.map(h => ({ t: (cfg.y.includes(h) ? '✓ ' : '\u2003 ') + h, f: () => { cfg.y = cfg.y.includes(h) ? cfg.y.filter(y => y !== h) : [...cfg.y, h]; saveChart(x, rs); const bx = rt.querySelector('.kgptalkieChartBox'); if (bx) bx.dataset.sig = ''; } }))); return; }
  else if (c === 'png') { const svg = rt.querySelector('.kgptalkieChartSvg svg'); if (!svg) return; const img = new Image(), w = +svg.getAttribute('width'), h = +svg.getAttribute('height');
   img.onload = () => { const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.scale(2, 2); g.drawImage(img, 0, 0); saveAs(fileBase(rs.sql) + '-chart.png', cv.toDataURL('image/png').split(',')[1], { 'PNG image': ['png'] }, 'base64'); };
   img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg)); return; }
  saveChart(x, rs); b.closest('.kgptalkieChartBox').dataset.sig = '';
 };
 const chartChange = (ed, x, rt, e) => { const s = e.target.closest('select[data-c="x"]'); if (!s) return; const st = rsState(x), rs = resultSet(x); if (!st.chart || !rs) return; st.chart.x = s.value; st.chart.y = st.chart.y.filter(y => y !== s.value); saveChart(x, rs); rt.querySelector('.kgptalkieChartBox').dataset.sig = ''; };

 /* value viewer (double-click a cell) */
 const showViewer = (rt, cell) => {
  rt.querySelectorAll(':scope > .kgptalkieViewer').forEach(v => v.remove());
  const v = cell.getValue(), col = cell.getColumn().getDefinition().title, row = cell.getRow().getPosition(true);
  const type = isNil(v) ? 'NULL' : typeof v === 'object' ? 'JSON' : typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'text';
  let body = isNil(v) ? null : typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);
  if (typeof v === 'string' && /^\s*[[{]/.test(v)) { try { body = JSON.stringify(JSON.parse(v), null, 2); } catch (e) { } }
  const p = document.createElement('div'); p.className = 'kgptalkieViewer'; p.tabIndex = -1;
  p.innerHTML = `<div class="kgptalkieViewerH"><b>${esc(col)}</b><span>row ${row} · ${type}${typeof v === 'string' ? ' · ' + v.length.toLocaleString('en-US') + ' chars' : ''}</span><span class="kgptalkieSp"></span><button data-v="copy"><span class="codicon codicon-copy"></span>Copy</button><button data-v="close" title="Close (Esc)"><span class="codicon codicon-close"></span></button></div><pre>${body === null ? '<i>NULL</i>' : esc(body)}</pre>`;
  p.addEventListener('mousedown', async e => { const b = e.target.closest('button[data-v]'); if (!b) return; e.preventDefault(); e.stopPropagation(); if (b.dataset.v === 'close') p.remove(); else { await copyText(body === null ? '' : body); flash(b, 'Copied'); } }, { signal: AC.signal });
  p.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); p.remove(); } });
  rt.appendChild(p); p.focus({ preventScroll: true });
 };

 /* the toolbar above each result set */
 const rbBtn = (a, icon, title, label) => `<button data-r="${a}" title="${title}"><span class="codicon codicon-${icon}"></span>${label ? '<span>' + label + '</span>' : ''}</button>`;
 const resultBar = (ed, x, rt) => {
  const rd = x.presentation && x.presentation.resultData; let bar = rt.querySelector(':scope > .kgptalkieResBar');
  if (!rd || rd.type !== 'resultSets') { if (bar) bar.remove(); rt.querySelectorAll(':scope > .kgptalkieChartBox, :scope > .kgptalkieViewer').forEach(n => n.remove()); rt.classList.remove('kgptalkieChartView'); return; }
  const st = rsState(x), t = tabOf(rt);
  if (!bar) {
   bar = document.createElement('div'); bar.className = 'kgptalkieResBar';
   bar.innerHTML = `<span class="kgptalkieSeg">${rbBtn('table', 'table', 'Table', 'Table')}${rbBtn('chart', 'graph', 'Chart', 'Chart')}</span><input class="kgptalkieSearch" placeholder="Search" spellcheck="false">`
    + rbBtn('filter', 'filter', 'Filter columns: >10, 1..5, !text, null') + rbBtn('clearf', 'clear-all', 'Clear search and filters') + '<span class="kgptalkieSp"></span><span class="kgptalkieMeta"></span>'
    + rbBtn('copy', 'copy', 'Copy rows') + rbBtn('save', 'desktop-download', 'Save rows to a file') + rbBtn('ai', 'sparkle', 'Explain this result with AI') + rbBtn('expand', 'unfold', 'Expand');
   rt.insertBefore(bar, rt.firstChild);
   const inp = bar.querySelector('.kgptalkieSearch'); inp.value = st.q;
   inp.addEventListener('input', () => { st.q = inp.value; const tt = tabOf(rt); if (tt) applyFilters(tt, st); }, { signal: AC.signal });
   inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { inp.value = ''; st.q = ''; const tt = tabOf(rt); if (tt) applyFilters(tt, st); } }, { signal: AC.signal });
   inp.addEventListener('mousedown', e => e.stopPropagation(), { signal: AC.signal });
   bar.addEventListener('mousedown', e => resultBarClick(ed, x, rt, e), { signal: AC.signal });
   if (!st.chart) { const rs = resultSet(x); if (rs) chartCfg(x, rs, { head: rs.cols, rows: rs.rows }); }   // a chart saved for this cell opens as a chart
  }
  // Workbench's cell stops dblclick from bubbling, so catch it on the way down; wait a tick so that if
  // Workbench starts its own cell editor (editable result), the editor wins and no viewer opens
  if (t && t.element.kgptalkieDbl !== AC) { t.element.kgptalkieDbl = AC; t.element.addEventListener('dblclick', e => {
   const ce = e.target.closest('.tabulator-cell[tabulator-field]'), re = ce && ce.closest('.tabulator-row'); if (!re) return;
   setTimeout(() => { try { if (ce.classList.contains('tabulator-editing') || ce.querySelector('input, textarea')) return;
    const row = t.getRows().find(r => r.getElement() === re), cell = row && row.getCell(ce.getAttribute('tabulator-field')); if (cell) showViewer(rt, cell); } catch (er) { W.kgptalkieErr = String(er && er.stack || er); } }, 0);
  }, { capture: true, signal: AC.signal }); }
  if (t && st.filt) filterRow(rt, t, st);
  // state on the bar
  const active = !!(st.q.trim() || Object.values(st.cf).some(v => String(v).trim()));
  bar.querySelector('[data-r="table"]').classList.toggle('on', st.view === 'table'); bar.querySelector('[data-r="chart"]').classList.toggle('on', st.view === 'chart');
  bar.querySelector('[data-r="filter"]').classList.toggle('on', st.filt || Object.values(st.cf).some(v => String(v).trim()));
  bar.querySelector('[data-r="clearf"]').style.display = active ? '' : 'none';
  bar.querySelector('[data-r="expand"]').classList.toggle('on', st.expand); bar.querySelector('[data-r="expand"] .codicon').className = 'codicon codicon-' + (st.expand ? 'fold-up' : 'unfold');
  if (t) { const n = t.getDataCount(), a = t.getDataCount('active'); const meta = (a !== n ? a.toLocaleString('en-US') + ' of ' : '') + n.toLocaleString('en-US') + (n === 1 ? ' row' : ' rows'); const me = bar.querySelector('.kgptalkieMeta'); if (me.textContent !== meta) me.textContent = meta; }
  if (!rt.querySelector('.kgptalkieNoRows') && t && t.getDataCount() && !t.getDataCount('active')) { }
  rt.classList.toggle('kgptalkieChartView', st.view === 'chart');
  if (st.view === 'chart') renderChart(ed, x, rt, t); else { const cb = rt.querySelector(':scope > .kgptalkieChartBox'); if (cb) cb.remove(); }
 };
 /* the per-column filter row: one input under each header, aligned with the columns */
 const filterRow = (rt, t, st) => {
  const hdr = t.element.querySelector('.tabulator-header'); if (!hdr) return;
  let row = rt.querySelector(':scope .kgptalkieFRow');
  const cols = colInfo(t); const sig = cols.map(k => k.f + ':' + k.c.getWidth()).join(',') + '|' + t.element.querySelector('.tabulator-tableholder').scrollLeft;
  if (!row) { row = document.createElement('div'); row.className = 'kgptalkieFRow'; hdr.insertAdjacentElement('afterend', row);
   row.addEventListener('input', e => { const i = e.target.closest('input[data-f]'); if (!i) return; st.cf[i.dataset.f] = i.value; applyFilters(t, st); }, { signal: AC.signal });
   row.addEventListener('mousedown', e => e.stopPropagation(), { signal: AC.signal }); row.addEventListener('keydown', e => e.stopPropagation(), { signal: AC.signal }); }
  if (row.dataset.sig === sig) return; row.dataset.sig = sig;
  const all = t.getData(); const sl = t.element.querySelector('.tabulator-tableholder').scrollLeft;
  const keep = document.activeElement && document.activeElement.closest && document.activeElement.closest('.kgptalkieFRow') ? document.activeElement.dataset.f : null;
  row.innerHTML = cols.map(k => `<input data-f="${esc(k.f)}" style="width:${k.c.getWidth() - 6}px" placeholder="${numericCol(all, k.f) ? '>10' : 'contains'}" title="${numericCol(all, k.f) ? '>10  <=5  !=0  1..5  null  not null' : 'text  !text  =exact  null  not null'}" value="${esc(st.cf[k.f] || '')}" spellcheck="false">`).join('');
  row.style.transform = `translateX(${-sl}px)`;
  if (keep !== null) { const i = row.querySelector(`input[data-f="${CSS.escape(keep)}"]`); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
 };
 const resultBarClick = async (ed, x, rt, e) => {
  const b = e.target.closest('button[data-r]'); if (!b) return; e.preventDefault(); e.stopPropagation(); closeMenu();
  const st = rsState(x), t = tabOf(rt), rs = resultSet(x), a = b.dataset.r;
  if (a === 'table' || a === 'chart') { st.view = a; if (rs) { chartCfg(x, rs, { head: rs.cols, rows: rs.rows }); saveChart(x, rs); } }
  else if (a === 'filter') { st.filt = !st.filt; if (!st.filt) { st.cf = {}; rt.querySelectorAll('.kgptalkieFRow').forEach(r => r.remove()); if (t) applyFilters(t, st); } }
  else if (a === 'clearf') { st.q = ''; st.cf = {}; const i = rt.querySelector('.kgptalkieSearch'); if (i) i.value = ''; rt.querySelectorAll('.kgptalkieFRow input').forEach(i2 => { i2.value = ''; }); if (t) { applyFilters(t, st); t.clearSort && t.clearSort(); } }
  else if (a === 'expand') st.expand = !st.expand;
  else if (a === 'ai') A.aiResult(ed, ctxs(ed).indexOf(x));
  else if (a === 'copy' && t) openMenu(b, [['tsv', 'Copy for Excel / Sheets'], ['csv', 'Copy as CSV'], ['json', 'Copy as JSON'], ['md', 'Copy as Markdown table']].map(([k, l]) => ({ t: l, f: async () => { const v = visible(t); const ok = await copyText(FMT[k](v)); nbToast(ok ? '✓ Copied ' + v.rows.length.toLocaleString('en-US') + (v.rows.length === 1 ? ' row' : ' rows') : 'Could not copy'); } })));
  else if (a === 'save' && t) openMenu(b, [{ t: 'Save as CSV...', f: () => saveAs(fileBase(rs && rs.sql) + '.csv', '\ufeff' + FMT.csv(visible(t)), { 'CSV file': ['csv'] }) }, { t: 'Save as JSON...', f: () => saveAs(fileBase(rs && rs.sql) + '.json', FMT.json(visible(t)), { 'JSON file': ['json'] }) }]);
 };
 W.kgptalkieResApi = { FMT, visible, filterFn, tabOf, autoChart, chartSvg };

 /* ---------- running (from SQL Notebook Studio): {{variables}}, safety confirms, read-only connections, query timeout ----------
    Hooked into the connection workspace's own SQL executor, so it applies however a cell is run (our buttons, keys,
    Workbench's own toolbar). runSQLCode = once per run (prompts, checks, timer); executeQuery = per statement (text swap). */
 const SET_DEF = { timeout: 0, confirm: 'production', exportMax: 500, upperKw: true, kwCase: 'upper' };
 const settings = () => { try { return { ...SET_DEF, ...JSON.parse(store.get('kgptalkieSettings', '{}')) }; } catch (e) { return { ...SET_DEF }; } };
 const saveSettings = s => store.set('kgptalkieSettings', JSON.stringify(s));
 const connName = ws => { const c = ws && ws.props && ws.props.connection; return (c && c.details && c.details.caption) || 'this connection'; };
 const connTag = ws => { try { return { env: 'none', readOnly: false, ...JSON.parse(store.get('kgptalkieConn:' + connName(ws), '{}')) }; } catch (e) { return { env: 'none', readOnly: false }; } };
 const setConnTag = (ws, t) => store.set('kgptalkieConn:' + connName(ws), JSON.stringify(t));
 const nbKey = ws => { const ae = ws.findActiveEditor && ws.findActiveEditor(); return connName(ws) + '|' + ((ae && ae.document && ae.document.caption) || ''); };
 const VARRE = /\{\{\s*([A-Za-z_][\w.]*)\s*\}\}/g;
 const findVars = s => [...new Set([...String(s).matchAll(VARRE)].map(m => m[1]))];
 const substVars = (s, v) => String(s).replace(VARRE, (w, n) => (n in v ? v[n] : w));
 const SESSION = W.kgptalkieVarSession || (W.kgptalkieVarSession = {});          // per notebook, kept across plugin reloads, gone when Workbench closes
 const savedVars = k => { try { return JSON.parse(store.get('kgptalkieVars:' + k, '{}')); } catch (e) { return {}; } };
 const envVar = async n => { try { const r = await fetch(FSURL + 'env?name=' + encodeURIComponent(n), { headers: { 'X-KGPTalkie': '1' }, cache: 'no-store' }); return r.ok ? ((await r.json()).value || '') : ''; } catch (e) { return ''; } };
 const inputDlg = (title, hint) => new Promise(res => {
  const bk = dlg(title, `<label><input data-f="v" spellcheck="false"></label><div class="kgptalkieDlgHint">${esc(hint)}</div><div class="kgptalkieDlgB"><button class="pri" data-b="ok">OK</button><button data-b="cancel">Cancel</button></div>`);
  const inp = bk.querySelector('input'), done = v => { bk.remove(); res(v); };
  bk.addEventListener('mousedown', e => { const b = e.target.closest('button[data-b]'); if (b) { e.preventDefault(); done(b.dataset.b === 'ok' ? inp.value : null); } else if (e.target === bk) done(null); });
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); done(inp.value); } else if (e.key === 'Escape') done(null); });
  setTimeout(() => inp.focus(), 0);
 });
 const varsFor = async (ws, names) => {
  const k = nbKey(ws), ses = SESSION[k] || (SESSION[k] = {}), vals = { ...ses, ...savedVars(k) };
  for (const n of names) {
   if (n in vals) continue;
   if (n.startsWith('env.')) { vals[n] = await envVar(n.slice(4)); continue; }
   const v = await inputDlg(`Value for {{${n}}}`, 'Kept for this session. Use Variables in the notebook toolbar to keep it with this notebook.');
   if (v === null) return null; vals[n] = ses[n] = v;
  }
  return vals;
 };
 /* comments out, quotes kept (so "-- WHERE" in a comment never counts as a WHERE) */
 const stripSqlComments = s => {
  let o = '', i = 0; const n = s.length;
  while (i < n) {
   const c = s[i], d = s[i + 1];
   if (c === "'" || c === '"' || c === '`') { let j = i + 1; while (j < n && s[j] !== c) j += s[j] === '\\' ? 2 : 1; o += s.slice(i, j + 1); i = j + 1; }
   else if (c === '/' && d === '*') { const j = s.indexOf('*/', i + 2); o += ' '; i = j < 0 ? n : j + 2; }
   else if ((c === '-' && d === '-' && /[\s]|^$/.test(s[i + 2] || '')) || c === '#') { const j = s.indexOf('\n', i); i = j < 0 ? n : j; }
   else { o += c; i++; }
  }
  return o;
 };
 const WRITE_RE = /^(INSERT|UPDATE|DELETE|MERGE|UPSERT|REPLACE|CREATE|ALTER|DROP|TRUNCATE|RENAME|GRANT|REVOKE|COMMENT|LOAD|IMPORT|CALL|EXEC|EXECUTE|DO|SET\s+PASSWORD|LOCK|OPTIMIZE|REPAIR|INSTALL|UNINSTALL)\b/i;
 const classify = sql => {
  const h = stripSqlComments(sql).trim().replace(/\s+/g, ' ');
  const write = WRITE_RE.test(h) || (/^SELECT\b/i.test(h) && /\bINTO\s+\S+\s+FROM\b/i.test(h));
  let risk;
  if (/^DROP\s+(TABLE|DATABASE|SCHEMA|VIEW|INDEX)\b/i.test(h)) risk = h.split(' ').slice(0, 3).join(' ');
  else if (/^TRUNCATE\b/i.test(h)) risk = 'TRUNCATE';
  else if (/^(DELETE|UPDATE)\b/i.test(h) && !/\bWHERE\b/i.test(h)) risk = h.split(' ')[0].toUpperCase() + ' without WHERE';
  return { write, risk };
 };
 const runNote = async (e, msg, keep) => {
  try { if (!keep) await e.clearResult(); await e.addResultData({ type: 'text', text: [{ type: 0, index: 0, content: (keep ? '\n' : '') + msg, language: 'ansi' }], executionInfo: { text: '' } }, { resultId: '' }); } catch (er) { W.kgptalkieErr = String(er && er.stack || er); }
 };
 const stmtTexts = async (e, t) => {
  if (t.sourceText) return [t.sourceText];
  if (t.source) { const s = await e.getStatementAtPosition(t.source); return [s ? s.text : '']; }
  return (await e.getExecutableStatements()).map(s => s.text);
 };
 const workspaces = () => { const out = []; const walk = (v, d) => { if (!v || d > 90) return; const c = v.__c; if (c && typeof c.runSQLCode === 'function' && c.sqlQueryExecutor) out.push(c); for (const k of v.__k || []) walk(k, d + 1); }; const r = document.getElementById('root'); if (r) walk(r.__k, 0); return out; };
 const hookWs = ws => {
  const q = ws.sqlQueryExecutor; if (!q || q.kgptalkieHook === AC) return;
  const run0 = q.kgptalkieRun0 || q.runSQLCode, exec0 = q.kgptalkieExec0 || q.executeQuery;
  q.kgptalkieRun0 = run0; q.kgptalkieExec0 = exec0; q.kgptalkieHook = AC;
  q.executeQuery = (e, idx, page, limit, opts, text, ...rest) => exec0(e, idx, page, limit, opts, e && e.kgptalkieVals ? substVars(text, e.kgptalkieVals) : text, ...rest);
  /* W.kgptalkieSqlRunning counts runs still going, so Run All waits for a multi-statement cell to finish all of it
     (its first result shows up long before the last statement is done) */
  q.runSQLCode = async (...args) => { W.kgptalkieSqlRunning = (W.kgptalkieSqlRunning || 0) + 1; try { return await runOne(...args); } finally { W.kgptalkieSqlRunning = Math.max(0, W.kgptalkieSqlRunning - 1); } };
  const runOne = async (e, t, ...rest) => {
   try {
    let texts = await stmtTexts(e, t || {}); const names = findVars(texts.join('\n'));
    delete e.kgptalkieVals;
    if (names.length) {
     const vals = await varsFor(ws, names); if (!vals) { await runNote(e, 'Cancelled: a variable has no value.'); return; }
     e.kgptalkieVals = vals; texts = texts.map(s => substVars(s, vals));
    }
    const tag = connTag(ws), mode = settings().confirm, risks = [];
    for (const s of texts) {
     if (!s.trim()) continue; const c = classify(s);
     if (tag.readOnly && c.write) { await runNote(e, `"${connName(ws)}" is read-only. This statement changes data:\n${s.trim().slice(0, 200)}`); return; }
     if (c.risk) risks.push(c.risk);
    }
    if (risks.length && (mode === 'always' || (mode === 'production' && tag.env === 'production'))) {
     const go = await askDlg(`Run ${[...new Set(risks)].join(', ')} on "${connName(ws)}"?`, tag.env === 'production' ? 'This connection is tagged Production.' : 'This statement cannot be undone.', ['Run', 'Cancel']);
     if (go !== 'Run') { await runNote(e, 'Not run.'); return; }
    }
   } catch (er) { W.kgptalkieErr = String(er && er.stack || er); }
   const sec = +settings().timeout || 0; let timer = 0, timedOut = false;
   if (sec > 0) timer = setTimeout(() => { timedOut = true; try { ws.props.connection.backend.killQuery(); } catch (er) { } }, sec * 1000);
   try { return await run0(e, t, ...rest); }
   finally { clearTimeout(timer); if (timedOut) await runNote(e, `Stopped after ${sec} s (query timeout, Notebook Settings).`, true); }
  };
 };
 const unhookWs = () => workspaces().forEach(ws => { const q = ws.sqlQueryExecutor; if (q && q.kgptalkieRun0) { q.runSQLCode = q.kgptalkieRun0; q.executeQuery = q.kgptalkieExec0; delete q.kgptalkieRun0; delete q.kgptalkieExec0; delete q.kgptalkieHook; } });
 let hookAt = 0;
 const hookAll = () => { const now = Date.now(); if (now - hookAt < 1000) return; hookAt = now; workspaces().forEach(ws => { hookWs(ws); }); tagChips(); treeMenus().forEach(hookTreeMenu); hookCompletion(); };
 const wsOfEd = ed => { const all = workspaces(), dom = ed.getDomNode(); return all.find(w => w.base && w.base.contains && w.base.contains(dom)) || all[0] || null; };
 /* the connection tag on the notebook toolbar (Production in red, Read-only) */
 const tagChips = () => {
  document.querySelectorAll('.kgptalkieNbBar').forEach(bar => {
   const host = bar.parentElement && bar.parentElement.querySelector(':scope > .editorHost'), edDom = host && host.querySelector('.monaco-editor');
   const ws = edDom ? (workspaces().find(w => w.base && w.base.contains && w.base.contains(edDom)) || null) : null; const chip = bar.querySelector('.kgptalkieTag'); if (!chip) return;
   const t = ws ? connTag(ws) : { env: 'none', readOnly: false }, parts = [];
   if (t.env && t.env !== 'none') parts.push(t.env[0].toUpperCase() + t.env.slice(1)); if (t.readOnly) parts.push('Read-only');
   const txt = parts.join(' · '); if (chip.textContent !== txt) { chip.textContent = txt; chip.className = 'kgptalkieTag' + (t.env === 'production' ? ' prod' : '') + (txt ? '' : ' none'); }
   /* "Connection · MySQL 9.5.0": which server this notebook talks to */
   const db = bar.querySelector('.kgptalkieDb'); if (!db) return;
   const ed = edDom && list.find(x => x.getDomNode() === edDom), ver = ws && ed ? serverVer(ws, ed) : '';
   const dtxt = ws ? connName(ws) + (ver ? ' · ' + ver : '') : ''; if (db.textContent !== dtxt) { db.textContent = dtxt; db.title = dtxt; }
  });
 };
 /* the server's version, asked once per connection (SELECT VERSION()); '' until it answers, retried after 15 s */
 const serverVer = (ws, ed) => {
  const v = ws.kgptalkieVer; if (v && (v.text || Date.now() - v.at < 15000)) return v.text || '';
  const st = ws.kgptalkieVer = { at: Date.now(), text: '' };
  sqlRun(ed, 'SELECT VERSION()').then(r => { const s = String((r.rows[0] || [])[0] || ''); if (!s) return;
   st.text = (/mariadb/i.test(s) ? 'MariaDB ' : 'MySQL ') + s.split('-')[0]; hookAt = 0; }).catch(() => { });
  return '';
 };
 /* Variables: names used in this notebook + saved + session; empty value removes; saved values win over session */
 const varsDialog = ed => {
  const ws = wsOfEd(ed); if (!ws) return; const k = nbKey(ws), m = ed.getModel();
  const used = findVars(ctxs(ed).filter(x => !isMd(x)).map(x => textOf(m, x)).join('\n')).filter(n => !n.startsWith('env.'));
  const saved = savedVars(k), ses = SESSION[k] || (SESSION[k] = {});
  const names = [...new Set([...used, ...Object.keys(saved), ...Object.keys(ses)])].sort();
  const row = n => `<div class="kgptalkieVarRow" data-n="${esc(n)}"><code>{{${esc(n)}}}</code><input data-v value="${esc(n in saved ? saved[n] : (ses[n] || ''))}" spellcheck="false" placeholder="${n in ses || n in saved ? '' : 'not set'}"><span class="kgptalkieVarSrc">${n in saved ? 'saved' : n in ses ? 'this session' : used.includes(n) ? 'used, no value' : ''}</span></div>`;
  const bk = dlg('Variables', `<div class="kgptalkieDlgHint">Write <code>{{name}}</code> in SQL and it is swapped for the value before the query runs (plain text, so quote strings yourself: <code>'{{country}}'</code>). <code>{{env.NAME}}</code> reads an environment variable. Values saved here stay with this notebook on this PC; an empty value removes it.</div>
   <div class="kgptalkieVarList">${names.map(row).join('') || '<div class="kgptalkieDlgHint">No variables yet.</div>'}</div>
   <div class="kgptalkieDlgRow kgptalkieVarAdd"><input data-f="nn" placeholder="new name" spellcheck="false"><button data-f="add">Add</button></div>
   <div class="kgptalkieDlgStatus" data-f="status"></div>
   <div class="kgptalkieDlgB"><button class="pri" data-f="save">Save</button><button data-f="close">Close</button></div>`);
  const st = (t, c) => { const s = bk.querySelector('[data-f="status"]'); s.textContent = t; s.className = 'kgptalkieDlgStatus ' + (c || ''); };
  bk.addEventListener('keydown', e => e.stopPropagation());
  bk.addEventListener('mousedown', e => {
   if (e.target === bk) { bk.remove(); return; }
   const t = e.target.closest('[data-f]'); if (!t || t.tagName === 'INPUT') return; e.preventDefault(); const f = t.dataset.f;
   if (f === 'close') bk.remove();
   else if (f === 'add') { const ni = bk.querySelector('[data-f="nn"]'), n = ni.value.trim();
    if (!/^[A-Za-z_][\w.]*$/.test(n)) { st('Names start with a letter or _ and use letters, digits, _ and dots.', 'bad'); return; }
    if (bk.querySelector(`.kgptalkieVarRow[data-n="${CSS.escape(n)}"]`)) { st('{{' + n + '}} is already in the list.', 'bad'); return; }
    const list = bk.querySelector('.kgptalkieVarList'); const h = list.querySelector(':scope > .kgptalkieDlgHint'); if (h) h.remove();
    list.insertAdjacentHTML('beforeend', row(n)); ni.value = ''; list.lastElementChild.querySelector('input').focus(); st(''); }
   else if (f === 'save') { const out = {};
    bk.querySelectorAll('.kgptalkieVarRow').forEach(r => { const n = r.dataset.n, v = r.querySelector('input').value; if (v !== '') out[n] = v; else delete ses[n]; });
    store.set('kgptalkieVars:' + k, JSON.stringify(out)); bk.remove(); nbToast('✓ Saved ' + Object.keys(out).length + (Object.keys(out).length === 1 ? ' variable' : ' variables')); }
  });
 };
 /* Notebook settings: timeout, destructive confirms, this connection's tag, export rows */
 const settingsDialog = ed => {
  const ws = wsOfEd(ed), s = settings(), tag = ws ? connTag(ws) : { env: 'none', readOnly: false };
  const opt = (v, l, cur) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`;
  const bk = dlg('Notebook Settings', `
   <label>Stop a query after (seconds, 0 = no limit)<input data-f="timeout" type="number" min="0" step="1" value="${+s.timeout || 0}"></label>
   <label>Ask before DROP, TRUNCATE, or DELETE / UPDATE without WHERE<select data-f="confirm">${opt('production', 'On connections tagged Production', s.confirm)}${opt('always', 'On every connection', s.confirm)}${opt('never', 'Never ask', s.confirm)}</select></label>
   <div class="kgptalkieDlgSub">This connection: ${esc(connName(ws))}</div>
   <label>Tag<select data-f="env">${opt('none', 'None', tag.env)}${opt('development', 'Development', tag.env)}${opt('staging', 'Staging', tag.env)}${opt('production', 'Production', tag.env)}</select></label>
   <label class="chk"><input type="checkbox" data-f="readOnly"${tag.readOnly ? ' checked' : ''}> Read-only: refuse statements that change data</label>
   <label>Rows per result in exported notebooks<input data-f="exportMax" type="number" min="1" step="1" value="${+s.exportMax || 500}"></label>
   <div class="kgptalkieDlgSub">Typing SQL</div>
   <label class="chk"><input type="checkbox" data-f="upperKw"${s.upperKw !== false ? ' checked' : ''}> Turn MySQL keywords into capitals as you type (names, strings and comments stay as typed; Ctrl+Z puts a word back)</label>
   <label>Keywords picked from autocomplete<select data-f="kwCase">${opt('upper', 'UPPERCASE', s.kwCase)}${opt('lower', 'lowercase', s.kwCase)}${opt('auto', 'As typed (lowercase when you type lowercase)', s.kwCase)}</select></label>
   <div class="kgptalkieDlgHint">Rows per result page is Workbench's own setting: Preferences, SQL Editor, Result Set Page Size.</div>
   <div class="kgptalkieDlgB"><button class="pri" data-f="save">Save</button><button data-f="close">Close</button></div>`);
  const q = f => bk.querySelector(`[data-f="${f}"]`);
  bk.addEventListener('keydown', e => e.stopPropagation());
  bk.addEventListener('mousedown', e => {
   if (e.target === bk) { bk.remove(); return; }
   const t = e.target.closest('button[data-f]'); if (!t) return; e.preventDefault();
   if (t.dataset.f === 'close') { bk.remove(); return; }
   saveSettings({ timeout: Math.max(0, Math.floor(+q('timeout').value || 0)), confirm: q('confirm').value, exportMax: Math.max(1, Math.floor(+q('exportMax').value || 500)), upperKw: q('upperKw').checked, kwCase: q('kwCase').value });
   if (ws) setConnTag(ws, { env: q('env').value, readOnly: q('readOnly').checked });
   hookAt = 0; bk.remove(); nbToast('✓ Settings saved');
  });
 };
 W.kgptalkieRunApi = { classify, stripSqlComments, findVars, substVars, settings, workspaces, varsDialog, settingsDialog };

 /* ---------- notebook export / import (from SQL Notebook Studio): HTML, PDF, Markdown, .sqlnb, plain .sql ---------- */
 const nbName = ed => { const tab = document.querySelector('.dbModuleTabview .tabArea .tabItem.selected'); return ((tab && tab.textContent) || '').trim().replace(/\.(mysql-notebook|sql|sqlnb)$/i, '') || 'notebook'; };
 const savedChart = sql => { try { const s = JSON.parse(store.get(chartKey(sql), 'null')); return s && s.view === 'chart' && s.cfg ? s.cfg : null; } catch (e) { return null; } };
 /* the notebook as plain data: md / ai / sql cells, each SQL cell with its outputs (tables, messages, errors, chart, AI card) */
 const nbDoc = (ed, maxRows) => {
  const m = ed.getModel(), cells = [];
  for (const x of ctxs(ed)) {
   const t = textOf(m, x).replace(/\s+$/, ''); if (!t.trim()) continue;
   if (isAi(x)) { const p = t.split('\n').slice(1).join('\n').trim(); if (p) cells.push({ kind: 'ai', text: p }); continue; }
   if (isMd(x)) { cells.push({ kind: 'md', text: t }); continue; }
   if (isCmd(m, x)) continue;                                   // \about and other Workbench commands
   const c = { kind: 'sql', text: t, outs: [] }, res = x.presentation && x.presentation.resultData, st = RS.get(x);
   if (res && res.type === 'resultSets') (res.sets || []).forEach((s, k) => {
    const info = (s.data && s.data.executionInfo && s.data.executionInfo.text) || '';
    if (!s.columns || !s.columns.length) { if (info) c.outs.push({ kind: 'info', text: info }); return; }
    const all = ((s.data && s.data.rows) || []).map(r => s.columns.map(col => r[col.field])), head = s.columns.map(col => col.title);
    const o = { kind: 'table', head, rows: all.slice(0, maxRows), total: all.length, more: !!(s.data && s.data.hasMoreRows), info, stmt: (res.sets.length > 1 ? k + 1 : 0) };
    const cfg = k === 0 ? (st && st.view === 'chart' && st.chart) || (!st && (savedChart(cellCode(x)) || savedChart(s.sql))) : null;
    if (cfg) { const r = chartSvg(cfg, { head, rows: all }, 760, 300); if (typeof r !== 'string') { o.chart = r.svg.replace(/^<svg ([^>]*?)width="(\d+)" height="(\d+)"/, '<svg $1viewBox="0 0 $2 $3" width="100%" style="max-width:$2px;height:auto"'); o.chartCfg = cfg; } }   // scales to the page
    c.outs.push(o);
   });
   else if (res && res.type === 'text') {
    (res.text || []).forEach(it => { const s = it && String(it.content || '').trim(); if (s) c.outs.push({ kind: it.type === 0 ? 'error' : 'info', text: s }); });
    const ei = res.executionInfo && res.executionInfo.text; if (ei && !c.outs.some(o => o.text === ei)) c.outs.push({ kind: 'info', text: ei });
   }
   const ai = AIO.get(x); if (ai && ai.status === 'done' && ai.md) c.ai = { title: AI_TITLE[ai.kind] || 'AI', md: stripThinking(ai.md).trim(), model: ai.model || '' };
   cells.push(c);
  }
  return { name: nbName(ed), cells };
 };
 const SQLKW = new Set(('select from where and or not in is null as join left right inner outer full cross natural on using group by order having limit offset insert into values update set delete create table view index '
  + 'drop alter add column primary key foreign references unique default distinct union all case when then else end exists between like regexp asc desc with recursive database schema use show describe explain '
  + 'truncate replace if begin commit rollback start transaction procedure function trigger event returns return declare call over partition window rows range interval true false').split(' '));
 const hlSql = s => {
  let o = '', mm; const re = /('(?:[^'\\]|\\.)*'?|"(?:[^"\\]|\\.)*"?|`[^`]*`?)|(--\s[^\n]*|--$|#[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w$]*)|([\s\S])/gm;
  while ((mm = re.exec(s))) {
   if (mm[1]) o += '<span class="s">' + esc(mm[1]) + '</span>'; else if (mm[2]) o += '<span class="c">' + esc(mm[2]) + '</span>';
   else if (mm[3]) o += '<span class="n">' + mm[3] + '</span>'; else if (mm[4]) o += SQLKW.has(mm[4].toLowerCase()) ? '<span class="k">' + mm[4] + '</span>' : esc(mm[4]); else o += esc(mm[5]);
  }
  return o;
 };
 const rowsNote = o => { const n = o.total; let s = n.toLocaleString('en-US') + (n === 1 ? ' row' : ' rows'); if (o.more) s += ' (limit reached)'; if (o.rows.length < n) s += ' · first ' + o.rows.length.toLocaleString('en-US') + ' shown'; return s; };
 const EXPORT_CSS = `:root{--bg:#fff;--fg:#1f2328;--mut:#6e7781;--line:#d0d7de;--soft:#f6f8fa;--k:#0550ae;--s:#0a3069;--n:#953800;--c:#6e7781;--err:#cf222e;--errbg:#ffebe9;--ai:#8250df;--aibg:#fbf7ff}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--mut:#8d96a0;--line:#30363d;--soft:#161b22;--k:#79c0ff;--s:#a5d6ff;--n:#ffa657;--c:#8d96a0;--err:#ff7b72;--errbg:#2d1214;--ai:#d2a8ff;--aibg:#1c1530}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 "Segoe UI",system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:40px 24px 56px}h1.nb{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut);font-weight:600;margin:0 0 28px}
.md h1,.md h2,.md h3{line-height:1.3;margin:1.2em 0 .4em}.md h1{font-size:26px}.md h2{font-size:21px}.md h3{font-size:17px}.md p{margin:.5em 0}
.md code,.ai code{font:13px Consolas,monospace;background:var(--soft);padding:1px 4px;border-radius:4px}.md pre,.ai pre{background:var(--soft);padding:10px 12px;border-radius:6px;overflow:auto}
.md table{border-collapse:collapse}.md th,.md td{border:1px solid var(--line);padding:4px 10px}.md blockquote{margin:.5em 0;padding-left:12px;border-left:3px solid var(--line);color:var(--mut)}
section{margin:18px 0}pre.sql{margin:0;background:var(--soft);border:1px solid var(--line);border-radius:6px;padding:10px 14px;font:13px/1.5 Consolas,"Cascadia Mono",monospace;white-space:pre-wrap;word-break:break-word}
.k{color:var(--k);font-weight:600}.s{color:var(--s)}.n{color:var(--n)}.c{color:var(--c);font-style:italic}
.prompt{border-left:3px solid var(--ai);background:var(--aibg);padding:8px 14px;border-radius:0 6px 6px 0}.prompt b{color:var(--ai);font-size:12px;letter-spacing:.06em;margin-right:8px}
.st{font-size:12px;color:var(--mut);margin:12px 0 4px}.tw{display:inline-block;vertical-align:top;max-width:100%;margin-top:8px;max-height:520px;overflow:auto;border:1px solid var(--line);border-radius:6px}
table.r{border-collapse:collapse;font-size:13px}table.r th{position:sticky;top:0;background:var(--soft);text-align:left;font-weight:600}
table.r th,table.r td{padding:5px 12px;border-bottom:1px solid var(--line);white-space:pre-wrap;vertical-align:top;max-width:420px}td.num{text-align:right;font-variant-numeric:tabular-nums}td.nul{color:var(--mut);font-style:italic}
.foot{font-size:12px;color:var(--mut);margin-top:4px}.ok{font-size:13px;color:#1a7f37;margin-top:8px}pre.err{margin:8px 0 0;background:var(--errbg);color:var(--err);padding:8px 12px;border-radius:6px;white-space:pre-wrap;font:13px Consolas,monospace}
.chart{margin-top:8px;background:#fff;border:1px solid var(--line);border-radius:6px;padding:8px}.chart svg{display:block}.ai{margin-top:10px;border-left:3px solid var(--ai);background:var(--aibg);padding:8px 14px;border-radius:0 6px 6px 0}
.ai .h{font-size:12px;font-weight:600;color:var(--ai)}.ai .h span{color:var(--mut);font-weight:400;margin-left:8px}
footer{margin-top:40px;font-size:12px;color:var(--mut);border-top:1px solid var(--line);padding-top:12px}
@media print{.tw{max-height:none;overflow:visible}section{break-inside:auto}pre.sql,.chart{break-inside:avoid}}`;
 const toHtml = doc => {
  const out = doc.cells.map(c => {
   if (c.kind === 'md') return `<section class="md">${mdToHtml(c.text)}</section>`;
   if (c.kind === 'ai') return `<section class="prompt"><b>AI</b>${esc(c.text)}</section>`;
   let h = `<section><pre class="sql">${hlSql(c.text)}</pre>`;
   for (const o of c.outs) {
    if (o.kind === 'table') {
     if (o.stmt) h += `<div class="st">Statement ${o.stmt}</div>`;
     if (o.chart) h += `<div class="chart">${o.chart}</div>`;
     h += `<div class="tw"><table class="r"><thead><tr>${o.head.map(x => '<th>' + esc(x) + '</th>').join('')}</tr></thead><tbody>`
      + o.rows.map(r => '<tr>' + r.map(v => isNil(v) ? '<td class="nul">NULL</td>' : `<td${typeof v === 'number' ? ' class="num"' : ''}>${esc(sval(v))}</td>`).join('') + '</tr>').join('')
      + `</tbody></table></div><div class="foot">${esc(rowsNote(o))}</div>`;
    } else if (o.kind === 'error') h += `<pre class="err">${esc(o.text)}</pre>`;
    else h += `<div class="ok">✓ ${esc(o.text.replace(/^OK,\s*/, ''))}</div>`;
   }
   if (c.ai) h += `<div class="ai"><div class="h">${esc(c.ai.title)}<span>${esc(c.ai.model)}</span></div>${mdToHtml(c.ai.md)}</div>`;
   return h + '</section>';
  }).join('\n');
  const when = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(doc.name)}</title><style>${EXPORT_CSS}</style></head>\n<body><main><h1 class="nb">${esc(doc.name)}</h1>\n${out}\n<footer>Exported from Modern MySQL Workbench · ${esc(when)}</footer></main></body></html>\n`;
 };
 const toMarkdown = doc => {
  const out = ['# ' + doc.name, ''];
  for (const c of doc.cells) {
   if (c.kind === 'md') { out.push(c.text, ''); continue; }
   if (c.kind === 'ai') { out.push(c.text.split('\n').map((l, k) => (k ? '> ' : '> **AI:** ') + l).join('\n'), ''); continue; }
   out.push('```sql', c.text, '```', '');
   for (const o of c.outs) {
    if (o.kind === 'table') { if (o.stmt) out.push(`_Statement ${o.stmt}_`, ''); out.push(FMT.md({ head: o.head, rows: o.rows }), ''); if (o.rows.length < o.total || o.more) out.push(`_${rowsNote(o)}._`, ''); }
    else if (o.kind === 'error') out.push('```text', o.text, '```', '');
    else out.push('_' + o.text + '_', '');
   }
   if (c.ai) out.push(`**${c.ai.title}**${c.ai.model ? ' (' + c.ai.model + ')' : ''}`, '', c.ai.md, '');
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
 };
 /* .sqlnb, the extension's file: plain SQL with -- %% cell markers, Git friendly */
 const toSqlnb = ed => {
  const ws = wsOfEd(ed), doc = nbDoc(ed, 0), compact = o => { const c = {}; for (const [k, v] of Object.entries(o || {})) { if (v === undefined || v === null || v === '' || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) continue; c[k] = v; } return Object.keys(c).length ? ' ' + JSON.stringify(c) : ''; };
  const out = ['-- sqlnb v1' + compact({ connection: ws ? connName(ws) : '', variables: ws ? savedVars(nbKey(ws)) : {} })];
  for (const c of doc.cells) {
   const t = c.outs && c.outs.find(o => o.chartCfg), meta = t ? { view: 'chart', chart: t.chartCfg } : {};
   out.push('-- %% ' + c.kind + compact(meta));
   for (const l of c.text.replace(/\r\n?/g, '\n').replace(/\s+$/, '').split('\n')) out.push(c.kind === 'sql' ? l : l ? '-- ' + l : '--');
   out.push('');
  }
  return out.join('\n');
 };
 const parseSqlnb = text => {
  const L = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n'), nb = { meta: {}, cells: [] }, HEAD = /^-- sqlnb v(\d+)(?:\s+(\{.*\}))?\s*$/, MARK = /^-- %% (sql|md|ai)(?:\s+(\{.*\}))?\s*$/, OUT = /^-- @output (\{.*\})\s*$/;
  const js = s => { try { const v = JSON.parse(s); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };
  const trimB = a => { let s = 0, e = a.length; while (s < e && !a[s].trim()) s++; while (e > s && !a[e - 1].trim()) e--; return a.slice(s, e); };
  let i = 0; const h = L.length ? HEAD.exec(L[0]) : null; if (h) { nb.meta = h[2] ? js(h[2]) : {}; i = 1; }
  let cur = null, buf = [];
  const flush = () => { if (!cur) { const pre = buf.join('\n').trim(); if (pre) nb.cells.push({ kind: 'sql', text: pre, meta: {} }); } else { const b = cur.kind === 'sql' ? buf : buf.map(l => l.startsWith('-- ') ? l.slice(3) : l.startsWith('--') ? l.slice(2) : l); cur.text = trimB(b).join('\n'); nb.cells.push(cur); } buf = []; };
  for (; i < L.length; i++) { const mk = MARK.exec(L[i]); if (mk) { flush(); cur = { kind: mk[1], text: '', meta: mk[2] ? js(mk[2]) : {} }; continue; } if (cur && OUT.test(L[i])) continue; buf.push(L[i]); }
  flush(); return nb;
 };
 /* a plain .sql file: one cell per statement (DELIMITER aware; comments stay with the statement after them);
    a file from the older SQL Notebook extension (markdown in block comments) keeps its cells */
 const splitSql = src => {
  const out = []; let delim = ';', cur = '', i = 0; const n = src.length;
  // a statement ends at the delimiter; comment-only text waits and joins the statement after it;
  // a statement under a custom delimiter (procedures, triggers) keeps its DELIMITER lines so Workbench splits it the same way
  const push = () => {
   const bare = stripSqlComments(cur).replace(/;\s*$/, '').trim();
   if (bare) { out.push(delim === ';' ? cur.trim() : `DELIMITER ${delim}\n${cur.trim()}${delim}\nDELIMITER ;`); cur = ''; }
   else if (stripSqlComments(cur).trim()) cur = '';                    // a lone delimiter
  };
  while (i < n) {
   if ((i === 0 || src[i - 1] === '\n') && /^[ \t]*DELIMITER[ \t]+\S+/i.test(src.slice(i, i + 40))) { const e = src.indexOf('\n', i), line = src.slice(i, e < 0 ? n : e); push(); delim = line.trim().split(/\s+/)[1]; i = e < 0 ? n : e + 1; continue; }
   const c = src[i], d = src[i + 1];
   if (c === "'" || c === '"' || c === '`') { let j = i + 1; while (j < n && src[j] !== c) j += src[j] === '\\' ? 2 : 1; cur += src.slice(i, j + 1); i = j + 1; continue; }
   if (c === '/' && d === '*') { const j = src.indexOf('*/', i + 2); const e = j < 0 ? n : j + 2; cur += src.slice(i, e); i = e; continue; }
   if ((c === '-' && d === '-' && /\s/.test(src[i + 2] || '\n')) || c === '#') { const j = src.indexOf('\n', i); const e = j < 0 ? n : j; cur += src.slice(i, e); i = e; continue; }
   if (src.startsWith(delim, i)) {
    cur += delim === ';' ? ';' : ''; i += delim.length; const k0 = out.length; push();
    const tail = /^[ \t]*(--\s[^\n]*|#[^\n]*)/.exec(src.slice(i));                    // a comment on the same line stays with its statement
    if (tail && out.length > k0) { out[out.length - 1] = out[out.length - 1].replace(/\nDELIMITER ;$/, '') + ' ' + tail[1].trim() + (delim === ';' ? '' : '\nDELIMITER ;'); i += tail[0].length; }
    continue;
   }
   cur += c; i++;
  }
  if (stripSqlComments(cur).trim()) out.push(delim === ';' ? cur.trim() : `DELIMITER ${delim}\n${cur.trim()}${delim}\nDELIMITER ;`);
  else if (cur.trim() && out.length) out[out.length - 1] += '\n' + cur.trim();   // trailing comments stay with the last statement
  return out;
 };
 const cellsFromSql = text => {
  const src = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  if (/^-- sqlnb v\d/.test(src) || /^-- %% (sql|md|ai)\b/m.test(src)) return parseSqlnb(src);
  if (!/^\/\*markdown\b/m.test(src)) return { meta: {}, cells: splitSql(src).map(s => ({ kind: 'sql', text: s, meta: {} })) };
  const cells = [], code = ch => ch.split(/\n[ \t]*\n/).forEach(b => { if (b.trim()) cells.push({ kind: 'sql', text: b.trim(), meta: {} }); });
  let last = 0; for (const mm of src.matchAll(/^\/\*markdown[ \t]*\n([\s\S]*?)\n?\*\/[ \t]*$/gm)) { code(src.slice(last, mm.index)); cells.push({ kind: 'md', text: mm[1].trim(), meta: {} }); last = mm.index + mm[0].length; }
  code(src.slice(last)); return { meta: {}, cells };
 };
 /* put imported cells at the end of this notebook (an empty last cell is reused); one undo step */
 const importCells = async (ed, nb) => {
  const m = ed.getModel(); if (!nb.cells.length) { nbToast('Nothing to import'); return; }
  const ws = wsOfEd(ed);
  if (ws && nb.meta && nb.meta.variables && typeof nb.meta.variables === 'object') { const k = nbKey(ws); store.set('kgptalkieVars:' + k, JSON.stringify({ ...nb.meta.variables, ...savedVars(k) })); }
  for (const c of nb.cells) if (c.kind === 'sql' && c.meta && c.meta.view === 'chart' && c.meta.chart) { const v = JSON.stringify({ view: 'chart', cfg: c.meta.chart }); const s = c.text.trim(); [s, s.replace(/;\s*$/, '')].forEach(q => store.set(chartKey(q), v)); }
  await act(ed, 'Import Cells', async () => {
   let all = ctxs(ed), at = all.length; const last = all[all.length - 1];
   if (last && !textOf(m, last).trim()) at = all.length - 1;
   for (let k = 0; k < nb.cells.length; k++) {
    const c = nb.cells[k], lang = c.kind === 'sql' ? 'mysql' : 'markdown';
    if (at + k >= ctxs(ed).length) insCore(ed, at + k, lang);
    await setCell(ed, at + k, { text: c.kind === 'ai' ? AI_MARK + '\n' + c.text : c.text, lang, res: null });
   }
  });
  dirty(ed); nbToast('✓ Imported ' + nb.cells.length + (nb.cells.length === 1 ? ' cell' : ' cells'));
 };
 const pickImport = ed => {
  hookHost(); W.kgptalkiePick = W.kgptalkiePick || {};
  W.kgptalkiePick.kgptalkieImport = f => { try { const text = typeof f.content === 'string' ? f.content : new TextDecoder().decode(f.content); importCells(ed, cellsFromSql(text)); } catch (e) { W.kgptalkieErr = String(e && e.stack || e); nbToast('Could not read that file'); } };
  if (W.electronHost && W.kgptalkieHostHooked === 2) W.electronHost.postMessage({ source: 'app', command: 'showOpenDialogWithRead', data: { id: 'kgptalkieImport', title: 'Import into Notebook', openLabel: 'Import', canSelectFiles: true, canSelectMany: false, filters: { 'SQL or SQL Notebook': ['sql', 'sqlnb'] } } });
  else nbToast('The file dialog needs the Workbench window.');
 };
 const exportAs = async (ed, kind) => {
  const s = settings(), name = nbName(ed), safe = name.replace(/[\\/:*?"<>|]+/g, '_');
  if (kind === 'sql') return A.exportSql(ed);
  if (kind === 'sqlnb') return saveAs(safe + '.sqlnb', toSqlnb(ed), { 'SQL Notebook': ['sqlnb'] });
  const doc = nbDoc(ed, +s.exportMax || 500);
  if (kind === 'md') return saveAs(safe + '.md', toMarkdown(doc), { Markdown: ['md'] });
  if (kind === 'html') return saveAs(safe + '.html', toHtml(doc), { 'HTML page': ['html'] });
  if (kind === 'pdf') {
   nbToast('Making the PDF...');
   try {
    const r = await fetch('http://127.0.0.1:9241/kgptalkie/doc/pdf', { method: 'POST', headers: { 'X-KGPTalkie': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ html: toHtml(doc) }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
    saveAs(safe + '.pdf', j.pdf, { PDF: ['pdf'] }, 'base64');
   } catch (e) { nbToast('PDF export failed: ' + e.message); }
  }
 };
 const exportMenu = (ed, b) => openMenu(b, [
  { t: 'SQL script (.sql)', f: () => exportAs(ed, 'sql') }, { t: 'SQL Notebook (.sqlnb)', f: () => exportAs(ed, 'sqlnb') }, '-',
  { t: 'HTML page with results (.html)', f: () => exportAs(ed, 'html') }, { t: 'PDF with results (.pdf)', f: () => exportAs(ed, 'pdf') }, { t: 'Markdown with results (.md)', f: () => exportAs(ed, 'md') }, '-',
  { t: 'Import .sql or .sqlnb into this notebook...', f: () => pickImport(ed) }, { t: 'Add the sample notebook (sample_shop)', f: () => addSample(ed) }]);
 /* ---------- schema tree: Select Top 100 and Describe Table in the notebook (Workbench's own menu already has Select Rows,
    Copy to Clipboard > Name and Send to SQL Editor). Workbench shows these menus as native Electron menus, so our two items
    are added where the menu serializes its items and picked up where the native selection comes back. ---------- */
 const qid = s => '`' + String(s).replace(/`/g, '``') + '`';
 const TREE_ITEMS = [{ title: 'Select Top 100 in Notebook', command: 'kgptalkie.top100' }, { title: 'Describe in Notebook', command: 'kgptalkie.describe' }];
 const activeNb = () => list.filter(ed => isNB(ed)).find(ed => ed.getDomNode().offsetWidth) || list.find(ed => isNB(ed)) || null;
 /* the last cell when it is an empty SQL cell, else a new cell at the end; then run it */
 const runInNotebook = async text => {
  const ed = activeNb(); if (!ed) { nbToast('Open a notebook first'); return false; }
  const m = ed.getModel(); let all = ctxs(ed), i = all.length - 1; const last = all[i];
  if (!last || isMd(last) || textOf(m, last).trim()) { await A.insertAt(ed, all.length, 'mysql'); all = ctxs(ed); i = all.length - 1; }
  const x = all[i]; ed.executeEdits('kgptalkie', [{ range: { startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }, text }]);
  A.run(ed, i); return true;
 };
 const treeAction = (cmd, payload) => {
  const de = payload && (payload.dataModelEntry || payload); if (!de || !de.caption) return;
  let s = de.parent; while (s && s.type !== 2) s = s.parent;                       // table -> "Tables" group -> schema
  const id = (s && s.caption ? qid(s.caption) + '.' : '') + qid(de.caption);
  runInNotebook(cmd === 'kgptalkie.describe' ? `DESCRIBE ${id};` : `SELECT *\nFROM ${id}\nLIMIT 100;`);
 };
 const hookTreeMenu = menu => {
  if (!menu || menu.kgptalkieMenuHook === AC || typeof menu.serializeNativeMenuItems !== 'function') return;
  const MI = ([].concat(menu.props.children).flat(9).find(k => k && k.type && k.props && k.props.command) || {}).type; if (!MI) return;
  const ser0 = menu.kgptalkieSer0 || menu.serializeNativeMenuItems, sel0 = menu.kgptalkieSel0 || menu.handleNativeMenuSelection;
  menu.kgptalkieSer0 = ser0; menu.kgptalkieSel0 = sel0; menu.kgptalkieMenuHook = AC;
  menu.serializeNativeMenuItems = (kids, payload, map, path = 'root') => path !== 'root' ? ser0(kids, payload, map, path)
   : ser0([...TREE_ITEMS.map(c => ({ type: MI, props: { command: c }, key: c.command })), { type: MI, props: { command: { title: '-', command: '' }, disabled: true }, key: 'kgptalkieSep' }, ...[].concat(kids)], payload, map, path);
  menu.handleNativeMenuSelection = (props, payload) => (props && props.command && /^kgptalkie\./.test(props.command.command || '')) ? treeAction(props.command.command, payload) : sel0(props, payload);
 };
 const treeMenus = () => { let sb = null; const walk = (v, d) => { if (!v || d > 90 || sb) return; const c = v.__c; if (c && c.cdmTypeToMenuRefMap) sb = c; for (const k of v.__k || []) walk(k, d + 1); }; const r = document.getElementById('root'); if (r) walk(r.__k, 0);
  return sb ? [...sb.cdmTypeToMenuRefMap.values()].map(r2 => r2 && r2.current).filter(mn => mn && mn.props && /^(table|view)ContextMenu$/.test(mn.props.id)) : []; };
 const unhookTreeMenus = () => treeMenus().forEach(mn => { if (mn.kgptalkieSer0) { mn.serializeNativeMenuItems = mn.kgptalkieSer0; mn.handleNativeMenuSelection = mn.kgptalkieSel0; delete mn.kgptalkieSer0; delete mn.kgptalkieSel0; delete mn.kgptalkieMenuHook; } });
 W.kgptalkieTreeApi = { treeMenus, treeAction, runInNotebook };

 /* ---------- completion: columns after an alias or table name (`FROM customers c` ... `c.`).
    Workbench's own completion already matches in any case and fuzzy (slt -> SELECT, cstm -> customers, CIT -> city),
    but answers "No Suggestions" after an alias. We wrap its one provider and add the columns there. ---------- */
 const ID = '(?:`[^`]+`|[A-Za-z_$][\\w$]*)';
 const unq = s => s && s[0] === '`' ? s.slice(1, -1).replace(/``/g, '`') : s;
 const NOT_ALIAS = new Set('WHERE ON USING JOIN INNER LEFT RIGHT CROSS NATURAL STRAIGHT_JOIN FULL OUTER GROUP ORDER HAVING LIMIT SET VALUES VALUE SELECT UNION WINDOW FOR LOCK PARTITION AS USE IGNORE FORCE INTO FROM AND OR NOT'.split(' '));
 const REF_RE = new RegExp(`\\b(?:FROM|JOIN|UPDATE|INTO)\\s+(${ID})(?:\\s*\\.\\s*(${ID}))?(?:\\s+(?:AS\\s+)?(${ID}))?|,\\s*(${ID})(?:\\s*\\.\\s*(${ID}))?(?:\\s+(?:AS\\s+)?(${ID}))?`, 'gi');
 /* the statement around the caret: its cell, cut at ; */
 const stmtAt = (model, pos) => {
  const ec = model.executionContexts, x = ec && ec.contextFromPosition && ec.contextFromPosition(pos);
  const r0 = x && x.startLine ? { startLineNumber: x.startLine, startColumn: 1 } : { startLineNumber: 1, startColumn: 1 };
  const endL = x && x.endLine ? x.endLine : model.getLineCount();
  const before = model.getValueInRange({ ...r0, endLineNumber: pos.lineNumber, endColumn: pos.column });
  const after = model.getValueInRange({ startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: endL, endColumn: model.getLineMaxColumn(endL) });
  const b = before.slice(before.lastIndexOf(';') + 1), a = after.split(';')[0];
  return { before: b, text: b + a };
 };
 /* what the caret is after: `q.` or `schema.q.`, and which table q stands for */
 const qualAt = (model, pos) => {
  const line = model.getLineContent(pos.lineNumber).slice(0, pos.column - 1);
  const m = line.match(new RegExp(`(?:(${ID})\\.)?(${ID})\\.([\\w$]*)$`)); if (!m) return null;
  const q = unq(m[2]), qs = m[1] && unq(m[1]);
  if (qs) return { schema: qs, table: q };
  const st = stmtAt(model, pos), text = stripSqlComments(st.text); let hit = null, k;
  REF_RE.lastIndex = 0;
  while ((k = REF_RE.exec(text))) {
   const p1 = k[1] || k[4], p2 = k[2] || k[5], al = k[3] || k[6];
   const schema = p2 ? unq(p1) : null, table = unq(p2 || p1), alias = al && !NOT_ALIAS.has(al.toUpperCase()) ? unq(al) : null;
   if (alias && alias.toLowerCase() === q.toLowerCase()) { hit = { schema, table }; break; }
   if (!alias && table.toLowerCase() === q.toLowerCase() && !hit) hit = { schema, table };
  }
  return hit || { schema: null, table: q, guess: true };
 };
 const COLS = new Map();
 const lit = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
 const colsFor = async (ed, ref) => {
  const key = (ref.schema || '') + '\u0001' + ref.table.toLowerCase(), c = COLS.get(key);
  if (c && Date.now() - c.at < 30000) return c.cols;
  const sql = `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ${ref.schema ? lit(ref.schema) : 'DATABASE()'} AND TABLE_NAME = ${lit(ref.table)} ORDER BY ORDINAL_POSITION`;
  const r = await Promise.race([sqlRun(ed, sql), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 2500))]);
  const cols = r.rows.map(([t, n, ty, key]) => ({ t, n, ty, pk: key === 'PRI' }));
  COLS.set(key, { at: Date.now(), cols }); return cols;
 };
 const labelOf = s => typeof s.label === 'string' ? s.label : (s.label && s.label.label) || '';
 const compProvider = () => {
  for (const ed of list) {
   const sc = ed.getContribution && ed.getContribution('editor.contrib.suggestController');
   const cp = sc && sc.model && sc.model._languageFeaturesService && sc.model._languageFeaturesService.completionProvider;
   const e = cp && cp._entries && cp._entries.find(x => [].concat(x.selector).includes('mysql') && x.provider && x.provider.provideCompletionItems);
   if (e) return e.provider;
  }
  return null;
 };
 const hookCompletion = () => {
  const p = compProvider(); if (!p || p.kgptalkieComp === AC) return;
  const base = Object.getPrototypeOf(p).provideCompletionItems; p.kgptalkieComp = AC;
  p.provideCompletionItems = (model, pos, ...rest) => {
   const r0 = base.call(p, model, pos, ...rest);
   let ref = null; try { ref = qualAt(model, pos); } catch (er) { }
   const ed = ref && list.find(x => x.getModel() === model);
   if (!ed) return Promise.resolve(r0).then(r => r && r.suggestions ? { ...r, suggestions: kwCase(r.suggestions, model, pos) } : r);
   return Promise.resolve(r0).then(async r => {
    let cols = []; try { cols = await colsFor(ed, ref); } catch (er) { } if (!cols.length) return r && r.suggestions ? { ...r, suggestions: kwCase(r.suggestions, model, pos) } : r;
    const w = model.getWordUntilPosition(pos), range = { startLineNumber: pos.lineNumber, startColumn: w.startColumn, endLineNumber: pos.lineNumber, endColumn: w.endColumn };
    const have = new Set();
    /* Workbench can list a column twice (UPDATE t SET t.); keep one */
    const sug = ((r && r.suggestions) || []).filter(s => { const l = labelOf(s); if (/^No Suggestions$/i.test(l)) return false; const k = l.toLowerCase() + '\u0001' + s.kind; if (have.has(k)) return false; have.add(k); have.add(l.toLowerCase()); return true; });
    cols.forEach((c, i) => { if (have.has(c.n.toLowerCase())) return;
     sug.push({ label: { label: c.n, description: c.ty + (c.pk ? ' · key' : '') }, kind: 4, detail: c.t + ' column', insertText: /^[A-Za-z_][\w$]*$/.test(c.n) ? c.n : qid(c.n), filterText: c.n, sortText: '!' + String(i).padStart(4, '0'), range }); });
    return { ...(r || {}), suggestions: kwCase(sug, model, pos), incomplete: false };
   });
  };
 };
 /* keywords from autocomplete in the case Notebook Settings asks for: UPPERCASE (default), lowercase, or as typed
    (lowercase when what you typed has only lowercase letters). Workbench's own dbEditor.upperCaseKeywords only knows
    upper or lower. Monaco's kind 17 = keyword. */
 const kwCase = (sug, model, pos) => {
  const s = settings().kwCase || 'upper', typed = (model.getWordUntilPosition(pos) || {}).word || '';
  const c = s === 'auto' ? (/[a-z]/.test(typed) && !/[A-Z]/.test(typed) ? 'lower' : 'upper') : s === 'lower' ? 'lower' : 'upper';
  const to = w => (c === 'lower' ? w.toLowerCase() : w.toUpperCase());
  return sug.map(x => {
   if (x.kind !== 17) return x; const l = labelOf(x); if (!l || /^No Suggestions$/i.test(l)) return x;
   const nl = to(l), it = typeof x.insertText === 'string' && x.insertText.toLowerCase() === l.toLowerCase() ? to(x.insertText) : x.insertText;
   if (nl === l && it === x.insertText) return x;
   return { ...x, label: typeof x.label === 'string' ? nl : { ...x.label, label: nl }, insertText: it };
  });
 };
 const unhookCompletion = () => { const p = compProvider(); if (p && p.kgptalkieComp) { delete p.provideCompletionItems; delete p.kgptalkieComp; } };
 W.kgptalkieCompApi = { qualAt, colsFor, hookCompletion, kwCase };

 /* ---------- MySQL keywords in capitals as you type (from SQL Notebook Studio) ----------
    When a word is finished in a SQL cell (space, tab, comma, ;, a bracket or Enter) and it is a MySQL keyword, it
    becomes capitals as its own undo step, so one Ctrl+Z puts it back. Names stay as typed: tables, columns and
    schemas of the live database, aliases, words after FROM / JOIN / INTO / AS and the like, column lists of
    CREATE TABLE and INSERT, strings, comments, `quoted` names and {{variables}}. Functions and data types are
    capitalised only where they are clearly used as such: count( , ::int, CAST(x AS char), CREATE TABLE t (id int.
    On by default; Notebook Settings turns it off. The word lists are generated, not kept by hand. */
 /* KEYWORDS:BEGIN generated by tools/gen-keywords.mjs from sql-formatter 15.9.0 (MIT), MySQL dialect. Do not edit by hand. */
 const MYSQL_WORDS = { k: 'ACCESSIBLE ADD ALL ALTER ANALYZE AND AS ASC ASENSITIVE BACKUP BEFORE BETWEEN BINARY BINLOG BOTH BY CACHE CALL CASCADE CASE CHANGE CHARACTER CHECK CHECKSUM CLONE CODE COLLATE COLLATION COLUMN COLUMNS COMMIT COMPONENT CONDITION CONSTRAINT CONTINUE CONVERT CREATE CROSS CUBE CUME_DIST CURRENT_DATE CURRENT_TIME CURRENT_TIMESTAMP CURRENT_USER CURSOR DATA DATABASE DATABASES DAY_HOUR DAY_MICROSECOND DAY_MINUTE DAY_SECOND DEALLOCATE DECLARE DEFAULT DEFINER DELAYED DELETE DENSE_RANK DESC DESCRIBE DETERMINISTIC DISTINCT DISTINCTROW DIV DROP DUAL DUPLICATE EACH ELSE ELSEIF EMPTY ENCLOSED END ENGINE ENGINES ERRORS ESCAPED EVENT EVENTS EXCEPT EXECUTE EXISTS EXIT EXPLAIN FALSE FETCH FILTER FIRST_VALUE FLUSH FOR FORCE FOREIGN FROM FULLTEXT FUNCTION GENERATED GET GRANT GRANTS GROUP GROUPING GROUPS GROUP_REPLICATION HANDLER HAVING HELP HIGH_PRIORITY HOSTS HOUR_MICROSECOND HOUR_MINUTE HOUR_SECOND IDENTIFIED IF IGNORE IMPORT IN INDEX INFILE INNER INOUT INSENSITIVE INSERT INSTALL INSTANCE INTERSECT INTERVAL INTO INVOKER IO_AFTER_GTIDS IO_BEFORE_GTIDS IS ITERATE JOIN JSON_TABLE KEY KEYS KILL LAG LAST_VALUE LATERAL LEAD LEADING LEAVE LEFT LIKE LIMIT LINEAR LINES LOAD LOCALTIME LOCALTIMESTAMP LOCK LOGFILE LOGS LONG LOOP LOW_PRIORITY MASTER MASTER_BIND MASTER_POS_WAIT MASTER_SSL_VERIFY_SERVER_CERT MATCH MAXVALUE MINUTE_MICROSECOND MINUTE_SECOND MOD MODIFIES MODIFY NAMES NATURAL NOT NO_WRITE_TO_BINLOG NTH_VALUE NTILE NULL OF OFFSET ON OPEN OPTIMIZE OPTIMIZER_COSTS OPTION OPTIONALLY OR ORDER OUT OUTER OUTFILE OVER PARTITION PASSWORD PERCENT_RANK PERSIST PLUGIN PLUGINS PREPARE PRIMARY PRIVILEGES PROCEDURE PROCESSLIST PROFILE PROFILES PURGE QUICK RANGE RANK READ READS READ_WRITE RECURSIVE REFERENCE REFERENCES REGEXP RELAYLOG RELEASE RENAME REPAIR REPEAT REPLACE REPLICA REPLICAS REPLICATION REQUIRE RESET RESIGNAL RESOURCE RESTART RESTRICT RETURN REVOKE RIGHT RLIKE ROLE ROLLBACK ROW ROWS ROW_NUMBER SAVEPOINT SCHEMA SCHEMAS SECOND_MICROSECOND SECURITY SELECT SENSITIVE SEPARATOR SERVER SET SHOW SHUTDOWN SIGNAL SLAVE SOURCE SOURCE_POS_WAIT SPATIAL SPECIFIC SQL SQLEXCEPTION SQLSTATE SQLWARNING SQL_BIG_RESULT SQL_CALC_FOUND_ROWS SQL_SMALL_RESULT SSL START STARTING STATUS STOP STORED STRAIGHT_JOIN SYSTEM TABLE TABLES TABLESPACE TEMPORARY TERMINATED THEN TO TRAILING TRANSACTION TRIGGER TRIGGERS TRUE TRUNCATE UNDO UNINSTALL UNION UNIQUE UNLOCK UNSIGNED UPDATE USAGE USE USER USING UTC_DATE UTC_TIME UTC_TIMESTAMP VALUES VARIABLES VIEW VIRTUAL WARNINGS WHEN WHERE WHILE WINDOW WITH WRITE XA XML XOR YEAR_MONTH ZEROFILL', f: 'ABS ACOS ADDDATE ADDTIME AES_DECRYPT AES_ENCRYPT ANY_VALUE ASCII ASIN ATAN ATAN2 AVG BENCHMARK BIN BINARY BIN_TO_UUID BIT_AND BIT_COUNT BIT_LENGTH BIT_OR BIT_XOR CAN_ACCESS_COLUMN CAN_ACCESS_DATABASE CAN_ACCESS_TABLE CAN_ACCESS_USER CAN_ACCESS_VIEW CAST CEIL CEILING CHAR CHARACTER_LENGTH CHARSET CHAR_LENGTH COALESCE COERCIBILITY COLLATION COMPRESS CONCAT CONCAT_WS CONNECTION_ID CONV CONVERT CONVERT_TZ COS COT COUNT CRC32 CUME_DIST CURDATE CURRENT_DATE CURRENT_ROLE CURRENT_TIME CURRENT_TIMESTAMP CURRENT_USER CURTIME DATABASE DATE DATEDIFF DATE_ADD DATE_FORMAT DATE_SUB DAY DAYNAME DAYOFMONTH DAYOFWEEK DAYOFYEAR DEFAULT DEGREES DENSE_RANK DIV ELT EXP EXPORT_SET EXTRACT EXTRACTVALUE FIELD FIND_IN_SET FIRST_VALUE FLOOR FORMAT FORMAT_BYTES FORMAT_PICO_TIME FOUND_ROWS FROM_BASE64 FROM_DAYS FROM_UNIXTIME GEOMCOLLECTION GEOMETRYCOLLECTION GET_DD_COLUMN_PRIVILEGES GET_DD_CREATE_OPTIONS GET_DD_INDEX_SUB_PART_LENGTH GET_FORMAT GET_LOCK GREATEST GROUPING GROUP_CONCAT GTID_SUBSET GTID_SUBTRACT HEX HOUR ICU_VERSION IF IFNULL INET6_ATON INET6_NTOA INET_ATON INET_NTOA INSERT INSTR INTERNAL_AUTO_INCREMENT INTERNAL_AVG_ROW_LENGTH INTERNAL_CHECKSUM INTERNAL_CHECK_TIME INTERNAL_DATA_FREE INTERNAL_DATA_LENGTH INTERNAL_DD_CHAR_LENGTH INTERNAL_GET_COMMENT_OR_ERROR INTERNAL_GET_ENABLED_ROLE_JSON INTERNAL_GET_HOSTNAME INTERNAL_GET_USERNAME INTERNAL_GET_VIEW_WARNING_OR_ERROR INTERNAL_INDEX_COLUMN_CARDINALITY INTERNAL_INDEX_LENGTH INTERNAL_IS_ENABLED_ROLE INTERNAL_IS_MANDATORY_ROLE INTERNAL_KEYS_DISABLED INTERNAL_MAX_DATA_LENGTH INTERNAL_TABLE_ROWS INTERNAL_UPDATE_TIME INTERVAL IS IS NOT IS NOT NULL IS NULL ISNULL IS_FREE_LOCK IS_IPV4 IS_IPV4_COMPAT IS_IPV4_MAPPED IS_IPV6 IS_USED_LOCK IS_UUID JSON_ARRAY JSON_ARRAYAGG JSON_ARRAY_APPEND JSON_ARRAY_INSERT JSON_CONTAINS JSON_CONTAINS_PATH JSON_DEPTH JSON_EXTRACT JSON_INSERT JSON_KEYS JSON_LENGTH JSON_MERGE JSON_MERGE_PATCH JSON_MERGE_PRESERVE JSON_OBJECT JSON_OBJECTAGG JSON_OVERLAPS JSON_PRETTY JSON_QUOTE JSON_REMOVE JSON_REPLACE JSON_SCHEMA_VALID JSON_SCHEMA_VALIDATION_REPORT JSON_SEARCH JSON_SET JSON_STORAGE_FREE JSON_STORAGE_SIZE JSON_TABLE JSON_TYPE JSON_UNQUOTE JSON_VALID JSON_VALUE LAG LAST_DAY LAST_INSERT_ID LAST_VALUE LCASE LEAD LEAST LEFT LENGTH LIKE LINESTRING LN LOAD_FILE LOCALTIME LOCALTIMESTAMP LOCATE LOG LOG10 LOG2 LOWER LPAD LTRIM MAKEDATE MAKETIME MAKE_SET MASTER_POS_WAIT MATCH MAX MBRCONTAINS MBRCOVEREDBY MBRCOVERS MBRDISJOINT MBREQUALS MBRINTERSECTS MBROVERLAPS MBRTOUCHES MBRWITHIN MD5 MICROSECOND MID MIN MINUTE MOD MONTH MONTHNAME MULTILINESTRING MULTIPOINT MULTIPOLYGON NAME_CONST NOW NTH_VALUE NTILE NULLIF OCT OCTET_LENGTH ORD PERCENT_RANK PERIOD_ADD PERIOD_DIFF PI POINT POLYGON POSITION POW POWER PS_CURRENT_THREAD_ID PS_THREAD_ID QUARTER QUOTE RADIANS RAND RANDOM_BYTES RANK REGEXP REGEXP_INSTR REGEXP_LIKE REGEXP_REPLACE REGEXP_SUBSTR RELEASE_ALL_LOCKS RELEASE_LOCK REPEAT REPLACE REVERSE RIGHT RLIKE ROLES_GRAPHML ROUND ROW_COUNT ROW_NUMBER RPAD RTRIM SCHEMA SECOND SEC_TO_TIME SESSION_USER SHA1 SHA2 SIGN SIN SLEEP SOUNDEX SOUNDS LIKE SOURCE_POS_WAIT SPACE SQRT STATEMENT_DIGEST STATEMENT_DIGEST_TEXT STD STDDEV STDDEV_POP STDDEV_SAMP STRCMP STR_TO_DATE ST_AREA ST_ASBINARY ST_ASGEOJSON ST_ASTEXT ST_BUFFER ST_BUFFER_STRATEGY ST_CENTROID ST_COLLECT ST_CONTAINS ST_CONVEXHULL ST_CROSSES ST_DIFFERENCE ST_DIMENSION ST_DISJOINT ST_DISTANCE ST_DISTANCE_SPHERE ST_ENDPOINT ST_ENVELOPE ST_EQUALS ST_EXTERIORRING ST_FRECHETDISTANCE ST_GEOHASH ST_GEOMCOLLFROMTEXT ST_GEOMCOLLFROMWKB ST_GEOMETRYN ST_GEOMETRYTYPE ST_GEOMFROMGEOJSON ST_GEOMFROMTEXT ST_GEOMFROMWKB ST_HAUSDORFFDISTANCE ST_INTERIORRINGN ST_INTERSECTION ST_INTERSECTS ST_ISCLOSED ST_ISEMPTY ST_ISSIMPLE ST_ISVALID ST_LATFROMGEOHASH ST_LATITUDE ST_LENGTH ST_LINEFROMTEXT ST_LINEFROMWKB ST_LINEINTERPOLATEPOINT ST_LINEINTERPOLATEPOINTS ST_LONGFROMGEOHASH ST_LONGITUDE ST_MAKEENVELOPE ST_MLINEFROMTEXT ST_MLINEFROMWKB ST_MPOINTFROMTEXT ST_MPOINTFROMWKB ST_MPOLYFROMTEXT ST_MPOLYFROMWKB ST_NUMGEOMETRIES ST_NUMINTERIORRING ST_NUMPOINTS ST_OVERLAPS ST_POINTATDISTANCE ST_POINTFROMGEOHASH ST_POINTFROMTEXT ST_POINTFROMWKB ST_POINTN ST_POLYFROMTEXT ST_POLYFROMWKB ST_SIMPLIFY ST_SRID ST_STARTPOINT ST_SWAPXY ST_SYMDIFFERENCE ST_TOUCHES ST_TRANSFORM ST_UNION ST_VALIDATE ST_WITHIN ST_X ST_Y SUBDATE SUBSTR SUBSTRING SUBSTRING_INDEX SUBTIME SUM SYSDATE SYSTEM_USER TAN TIME TIMEDIFF TIMESTAMP TIMESTAMPADD TIMESTAMPDIFF TIME_FORMAT TIME_TO_SEC TO_BASE64 TO_DAYS TO_SECONDS TRIM TRUNCATE UCASE UNCOMPRESS UNCOMPRESSED_LENGTH UNHEX UNIX_TIMESTAMP UPDATEXML UPPER UTC_DATE UTC_TIME UTC_TIMESTAMP UUID UUID_SHORT UUID_TO_BIN VALIDATE_PASSWORD_STRENGTH VALUES VARIANCE VAR_POP VAR_SAMP VERSION WAIT_FOR_EXECUTED_GTID_SET WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS WEEK WEEKDAY WEEKOFYEAR WEIGHT_STRING YEAR YEARWEEK', d: 'BIGINT BINARY BIT BLOB BOOL BOOLEAN CHAR CHARACTER DATE DATETIME DEC DECIMAL DOUBLE DOUBLE PRECISION ENUM FIXED FLOAT FLOAT4 FLOAT8 INT INT1 INT2 INT3 INT4 INT8 INTEGER LONGBLOB LONGTEXT MEDIUMBLOB MEDIUMINT MEDIUMTEXT MIDDLEINT NATIONAL CHAR NATIONAL VARCHAR NUMERIC PRECISION REAL SMALLINT TEXT TIME TIMESTAMP TINYBLOB TINYINT TINYTEXT VARBINARY VARCHAR VARCHARACTER VARYING YEAR' };
 /* KEYWORDS:END */
 const WORDS = (() => { const s = x => new Set(x.split(' ').filter(Boolean)); return { k: s(MYSQL_WORDS.k), f: s(MYSQL_WORDS.f), d: s(MYSQL_WORDS.d) }; })();
 const NAME_AFTER = new Set('FROM JOIN INTO UPDATE TABLE VIEW INDEX AS DATABASE SCHEMA USE EXISTS TRIGGER FUNCTION PROCEDURE'.split(' '));
 const TABLE_ITEM = new Set('PRIMARY FOREIGN CONSTRAINT UNIQUE CHECK INDEX KEY FULLTEXT SPATIAL LIKE'.split(' '));
 const ENDS_WORD = /^(?:[ \t,;)]|\(\)?|\r?\n[ \t]*)$/;
 /* where the word starting at `at` sits: in code or not, the statement's first word, the word before it, and
    whether it starts an item of a column-name list (CREATE TABLE t ( ... ) or INSERT INTO t ( ... )) */
 const caseCtx = (text, at) => {
  let head = '', last = '', lastTok = '', sawTable = false, sawInto = false, i = 0; const parens = [];
  const out = () => ({ code: false, head, prev: '', nameItem: false });
  while (i < at) {
   const ch = text[i], two = text.substr(i, 2);
   if (two === '--' || ch === '#') { const nl = text.indexOf('\n', i); if (nl === -1 || nl >= at) return out(); i = nl + 1; continue; }
   if (two === '/*') { const e = text.indexOf('*/', i + 2); if (e === -1 || e + 2 > at) return out(); i = e + 2; continue; }
   if (two === '{{') { const e = text.indexOf('}}', i + 2); if (e === -1 || e + 2 > at) return out(); i = e + 2; lastTok = 'x'; continue; }
   if (ch === "'" || ch === '"' || ch === '`') {
    let j = i + 1;
    for (;;) { if (j >= text.length) return out(); if (ch !== '`' && text[j] === '\\') { j += 2; continue; } if (text[j] === ch) { if (text[j + 1] === ch) { j += 2; continue; } break; } j++; }
    if (j + 1 > at) return out(); i = j + 1; lastTok = 'x'; continue;
   }
   if (/[A-Za-z_]/.test(ch) && !/[\w$]/.test(text[i - 1] || '')) {
    const w = /^[A-Za-z_][\w$]*/.exec(text.slice(i, i + 256))[0], U = w.toUpperCase();
    if (!head) head = U; if (U === 'TABLE') sawTable = true; if (U === 'INTO') sawInto = true;
    last = lastTok = U; i += w.length; continue;
   }
   if (ch === ';') { head = last = lastTok = ''; parens.length = 0; sawTable = sawInto = false; }
   else if (ch === '(') { parens.push(parens.length === 0 && /^[A-Z_]/.test(lastTok) && lastTok !== 'VALUES' && lastTok !== 'SELECT' && ((head === 'CREATE' && sawTable) || ((head === 'INSERT' || head === 'REPLACE') && sawInto))); lastTok = '('; }
   else if (ch === ')') { parens.pop(); lastTok = ')'; }
   else if (!/\s/.test(ch)) lastTok = ch;
   i++;
  }
  const inList = parens.length > 0 && parens[parens.length - 1];
  return { code: true, head, prev: /^[A-Z_]/.test(lastTok) ? last : '', nameItem: inList && (lastTok === '(' || lastTok === ',') };
 };
 /* the word ending at `offset` (where `typed` was just typed) when it should become capitals; names = lowercase
    table, column, schema and alias names to leave alone */
 const wordToCap = (text, offset, typed, names) => {
  const m = /[A-Za-z_][\w$]*$/.exec(text.slice(Math.max(0, offset - 128), offset)); if (!m) return null;
  const word = m[0], start = offset - word.length, before = text[start - 1] || '', U = word.toUpperCase();
  if (/[\w$]/.test(before) || word === U || (names && names.has(word.toLowerCase()))) return null;
  if ('.@'.includes(before) && before) return null;
  const ctx = caseCtx(text, start); if (!ctx.code) return null;
  const hit = { start, end: offset, word, upper: U }, opens = typed.startsWith('(');
  if (ctx.nameItem) return ctx.head === 'CREATE' && TABLE_ITEM.has(U) ? hit : null;
  if (NAME_AFTER.has(ctx.prev)) {
   if (ctx.prev === 'AS' && WORDS.d.has(U) && (typed.startsWith(')') || opens)) return hit;   // CAST(x AS char)
   if (ctx.prev === 'TABLE' && U === 'IF') return hit;                                          // CREATE TABLE IF NOT EXISTS
   if ((ctx.prev === 'EXISTS' || ctx.prev === 'AS') && (U === 'SELECT' || U === 'WITH')) return hit;
   return null;
  }
  if (WORDS.k.has(U)) return hit;
  if (opens && (WORDS.f.has(U) || WORDS.d.has(U))) return hit;
  if (WORDS.d.has(U) && /^(CREATE|ALTER|DECLARE)$/.test(ctx.head)) return hit;
  return null;
 };
 /* names to leave alone: schemas, and the tables and columns of the current database (one query, kept 30 s),
    plus the cell's own aliases and table names */
 const NAMES = new WeakMap();
 const liveNames = async ed => {
  const c = NAMES.get(ed); if (c && Date.now() - c.at < 30000) return c.p;
  const p = sqlRun(ed, "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA UNION SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() UNION SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() LIMIT 50000")
   .then(r => new Set(r.rows.map(x => String(x[0]).toLowerCase()))).catch(() => new Set());
  NAMES.set(ed, { at: Date.now(), p }); return p;
 };
 /* a comma counts only inside a FROM list (FROM a x, b y), never in a column list (SELECT name, count( ...) */
 const CLAUSE_RE = /\b(FROM|SELECT|WHERE|SET|VALUES|BY|ON|USING|JOIN|HAVING|LIMIT|TABLE|INTO)\b|[()]/gi;
 const inFromList = (text, at) => { let last = '', c; CLAUSE_RE.lastIndex = 0; while ((c = CLAUSE_RE.exec(text)) && c.index < at) last = c[0].toUpperCase(); return last === 'FROM'; };
 const cellNames = text => {
  const out = new Set(); let k; REF_RE.lastIndex = 0;
  while ((k = REF_RE.exec(text))) { if (k[4] && !inFromList(text, k.index)) continue; const p1 = k[1] || k[4], p2 = k[2] || k[5], al = k[3] || k[6];
   [p1, p2].forEach(x => x && out.add(unq(x).toLowerCase())); if (al && !NOT_ALIAS.has(al.toUpperCase())) out.add(unq(al).toLowerCase()); }
  return out;
 };
 const autoCase = async (ed, e) => {
  if (settings().upperKw === false || e.isUndoing || e.isRedoing || e.isFlush || e.changes.length !== 1) return;
  /* only what the user types: a key went down just now (AI streaming and cell actions also edit the text) */
  const ch = e.changes[0]; if (ch.rangeLength !== 0 || !ENDS_WORD.test(ch.text) || performance.now() - (ed.kgptalkieKeyAt || 0) > 200 || ed.getSelections().length !== 1) return;
  const m = ed.getModel(), ln = ch.range.startLineNumber, i = cellAt(ed, ln), x = ctxs(ed)[i];
  if (!x || !/^(mysql|sql)$/.test(x.language || '')) return;
  const text = textOf(m, x), base = m.getOffsetAt({ lineNumber: x.startLine, column: 1 }), offset = m.getOffsetAt({ lineNumber: ln, column: ch.range.startColumn }) - base;
  if (!wordToCap(text, offset, ch.text, null)) return;                       // most keystrokes stop here, no lookup
  const names = cellNames(stripSqlComments(text)); let live = new Set();
  try { live = await Promise.race([liveNames(ed), new Promise(r => setTimeout(() => r(null), 600))]) || new Set(); } catch (er) { }
  live.forEach(n => names.add(n));
  const hit = wordToCap(text, offset, ch.text, names); if (!hit) return;
  const p0 = m.getPositionAt(base + hit.start), p1 = m.getPositionAt(base + hit.end);
  const range = { startLineNumber: p0.lineNumber, startColumn: p0.column, endLineNumber: p1.lineNumber, endColumn: p1.column };
  if (m.getValueInRange(range) !== hit.word) return;                          // the user kept typing over it
  ed.pushUndoStop(); ed.executeEdits('kgptalkie-case', [{ range, text: hit.upper }]); ed.pushUndoStop();
 };
 const hookCase = ed => { if (ed.kgptalkieCaseAC === AC) return; ed.kgptalkieCaseAC = AC;
  ed.getDomNode().addEventListener('keydown', ev => { if (!ev.ctrlKey && !ev.altKey && !ev.metaKey) ed.kgptalkieKeyAt = performance.now(); }, { capture: true, signal: AC.signal });
  DISP.push(ed.onDidChangeModelContent(e => { autoCase(ed, e).catch(er => { W.kgptalkieErr = String(er && er.stack || er); }); })); };
 W.kgptalkieCaseApi = { wordToCap, caseCtx, cellNames, WORDS };

 /* ---------- sample notebook + Get Started (the extension's Sample Shop, rebuilt for MySQL) ----------
    The first SQL cell creates sample_shop on the current connection with fixed generated data (same every run, safe to run again). */
 const SAMPLE_SETUP = `-- Creates the sample_shop database on this connection. Safe to run again.
CREATE DATABASE IF NOT EXISTS sample_shop;
USE sample_shop;
CREATE TABLE IF NOT EXISTS customers (id INT PRIMARY KEY, name VARCHAR(60) NOT NULL, email VARCHAR(120) NOT NULL UNIQUE, country VARCHAR(40) NOT NULL, city VARCHAR(40) NOT NULL, signup_date DATE NOT NULL);
CREATE TABLE IF NOT EXISTS products (id INT PRIMARY KEY, name VARCHAR(60) NOT NULL, category VARCHAR(30) NOT NULL, price DECIMAL(10,2) NOT NULL, stock INT NOT NULL);
CREATE TABLE IF NOT EXISTS orders (id INT PRIMARY KEY, customer_id INT NOT NULL, order_date DATE NOT NULL, status VARCHAR(12) NOT NULL, INDEX idx_orders_customer (customer_id), INDEX idx_orders_date (order_date));
CREATE TABLE IF NOT EXISTS order_items (order_id INT NOT NULL, product_id INT NOT NULL, quantity INT NOT NULL, unit_price DECIMAL(10,2) NOT NULL, PRIMARY KEY (order_id, product_id));
INSERT IGNORE INTO products VALUES
 (1,'Air 13','Laptops',999,120),(2,'Pro 14','Laptops',1599,64),(3,'Studio 16','Laptops',2299,18),(4,'Book 15','Laptops',749,210),
 (5,'Nova 8','Phones',699,300),(6,'Nova 8 Max','Phones',899,142),(7,'Lite 5','Phones',299,388),(8,'Fold X','Phones',1499,9),
 (9,'Pods Mini','Audio',89,256),(10,'Pods Pro','Audio',199,171),(11,'Studio Headphones','Audio',299,47),(12,'Soundbar 2','Audio',349,33),(13,'Speaker Go','Audio',59,315),
 (14,'USB-C Cable','Accessories',12,400),(15,'65W Charger','Accessories',39,352),(16,'Laptop Sleeve','Accessories',29,129),(17,'Wireless Mouse','Accessories',25,0),(18,'Mechanical Keyboard','Accessories',119,76),(19,'4K Webcam','Accessories',129,58),
 (20,'View 24','Monitors',189,93),(21,'View 27 QHD','Monitors',329,41),(22,'View 32 4K','Monitors',549,12),
 (23,'Band 3','Wearables',49,233),(24,'Watch S','Wearables',249,87),(25,'Watch Ultra','Wearables',499,5);
SET SESSION cte_max_recursion_depth = 5000;
INSERT IGNORE INTO customers
WITH RECURSIVE n (i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 240),
p AS (SELECT i,
  ELT(1 + MOD(i * 7, 24), 'Aarav','Ananya','Rohan','Priya','Liam','Emma','Noah','Olivia','Mateo','Sofia','Yuki','Hana','Lukas','Mia','Omar','Layla','Chen','Mei','Ivan','Elena','Kofi','Ama','Diego','Lucia') AS f,
  ELT(1 + MOD(i * 11, 18), 'Sharma','Patel','Iyer','Smith','Johnson','Garcia','Silva','Tanaka','Muller','Rossi','Khan','Wang','Ivanova','Mensah','Lopez','Brown','Kim','Nguyen') AS l,
  IF(MOD(i * 13, 100) < 35, 'India', ELT(1 + MOD(i * 5, 6), 'United States','United Kingdom','Germany','Japan','Brazil','Canada')) AS country
  FROM n)
SELECT i, CONCAT(f, ' ', l), LOWER(CONCAT(f, '.', l, i, '@example.com')), country,
  CASE country WHEN 'India' THEN ELT(1 + MOD(i * 3, 5), 'Mumbai','Bengaluru','Delhi','Pune','Kolkata')
   WHEN 'United States' THEN ELT(1 + MOD(i, 4), 'New York','Austin','Seattle','Chicago') WHEN 'United Kingdom' THEN ELT(1 + MOD(i, 3), 'London','Manchester','Leeds')
   WHEN 'Germany' THEN ELT(1 + MOD(i, 3), 'Berlin','Munich','Hamburg') WHEN 'Japan' THEN ELT(1 + MOD(i, 2), 'Tokyo','Osaka')
   WHEN 'Brazil' THEN ELT(1 + MOD(i, 2), 'Sao Paulo','Rio de Janeiro') ELSE ELT(1 + MOD(i, 2), 'Toronto','Vancouver') END,
  DATE_ADD('2024-11-27', INTERVAL MOD(i * 37, 400) DAY)
FROM p;
INSERT IGNORE INTO orders
WITH RECURSIVE n (i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 1800),
d AS (SELECT i, IF(MOD(i * 31, 100) < 12, 320 + MOD(i * 17, 41), FLOOR(365 * POW(MOD(i * 7919, 1000) / 1000, 0.8))) AS d FROM n)
SELECT i, 1 + MOD(i * 97, 240), DATE_ADD('2025-01-01', INTERVAL d DAY),
  IF(d > 355, 'placed', IF(d > 345, ELT(1 + MOD(i, 2), 'placed', 'shipped'), IF(MOD(i * 53, 100) < 6, 'cancelled', 'delivered')))
FROM d;
INSERT IGNORE INTO order_items
SELECT o.id, p.id, IF(p.price < 60, 1 + MOD(o.id + k.k, 3), 1), ROUND(p.price * IF(MOD(o.id * k.k * 61, 100) < 15, 0.9, 1), 2)
FROM orders o
JOIN (SELECT 1 AS k UNION ALL SELECT 2 UNION ALL SELECT 3) k ON k.k <= 1 + (MOD(o.id * 29, 10) >= 6) + (MOD(o.id * 43, 10) >= 8)
JOIN products p ON p.id = 1 + MOD(o.id * 13 + k.k * 7, 25);
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS month, COUNT(DISTINCT o.id) AS orders, ROUND(SUM(i.quantity * i.unit_price), 2) AS revenue
FROM orders o JOIN order_items i ON i.order_id = o.id
WHERE o.status <> 'cancelled'
GROUP BY 1
ORDER BY 1;
SELECT (SELECT COUNT(*) FROM customers) AS customers, (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM orders) AS orders, (SELECT COUNT(*) FROM order_items) AS order_items;`;
 const SAMPLE = {
  meta: { variables: { country: 'India' } },
  cells: [
   { kind: 'md', text: '# Welcome to the notebook\n\nThis sample uses **sample_shop**, a small electronics store. The SQL cell below creates it on this connection (safe to run again).\nPress **Ctrl+Enter** in a cell to run it, or **Run All** at the top.' },
   { kind: 'sql', text: SAMPLE_SETUP },
   { kind: 'sql', text: 'SELECT name, category, price, stock\nFROM products\nORDER BY price DESC;' },
   { kind: 'md', text: '## Sort, filter, chart\n\nClick a column header to sort. Use the funnel to filter (try `>500` on price). Switch to **Chart** to plot a result.' },
   { kind: 'sql', text: 'SELECT month, orders, revenue\nFROM monthly_revenue;', meta: { view: 'chart', chart: { type: 'line', x: 'month', y: ['revenue'], stacked: false, horizontal: false } } },
   { kind: 'md', text: '## Several statements, one cell\n\nEach statement gets its own result tab.' },
   { kind: 'sql', text: 'SELECT COUNT(*) AS customers FROM customers;\nSELECT status, COUNT(*) AS orders FROM orders GROUP BY status ORDER BY 2 DESC;\nSELECT category, ROUND(SUM(i.quantity * i.unit_price), 2) AS revenue\nFROM order_items i JOIN products p ON p.id = i.product_id\nGROUP BY category\nORDER BY revenue DESC;' },
   { kind: 'md', text: "## Variables\n\n`{{country}}` is filled in from the notebook's variables. Click **Variables** in the toolbar to change it." },
   { kind: 'sql', text: "SELECT c.city, COUNT(DISTINCT o.id) AS orders, ROUND(SUM(i.quantity * i.unit_price), 2) AS revenue\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nJOIN order_items i ON i.order_id = o.id\nWHERE c.country = '{{country}}'\nGROUP BY c.city\nORDER BY revenue DESC;" },
   { kind: 'md', text: '## AI\n\nClick **Configure AI** in the toolbar to use OpenAI, Anthropic, OpenRouter, Ollama or your own API.\nThen use the sparkle on any cell to explain it, run an AI cell to write SQL, or click **Fix with AI** on an error.' },
   { kind: 'ai', text: 'Top 5 customers by total spend, with their country and number of orders' },
  ].map(c => ({ meta: {}, ...c })),
 };
 const addSample = ed => importCells(ed, SAMPLE);
 const startDialog = ed => {
  const bk = dlg('Get Started', `<ol class="kgptalkieSteps">
    <li><b>Add the sample notebook.</b> It builds <code>sample_shop</code> (customers, products, orders) on this connection. Start a new notebook first if this one is in use.</li>
    <li><b>Run a cell</b> with Ctrl+Enter, or Run All. Shift+Enter runs and moves on.</li>
    <li><b>Sort, filter, chart.</b> Click a header to sort, the funnel filters each column (<code>&gt;500</code>, <code>1..5</code>, <code>!text</code>, <code>null</code>), Chart plots the result.</li>
    <li><b>Turn on AI</b> with Configure AI: explain, optimize and fix queries, or write SQL from plain words in an AI cell.</li>
   </ol>
   <div class="kgptalkieDlgHint">Right-click a table in Schemas for Select Top 100 and Describe in the notebook. Variables, Notebook Settings and Export are in this toolbar.</div>
   <div class="kgptalkieDlgB"><button class="pri" data-f="sample">Add the sample notebook</button><button data-f="ai">Configure AI</button><button data-f="close">Close</button></div>`);
  bk.addEventListener('mousedown', e => {
   if (e.target === bk) { bk.remove(); return; }
   const t = e.target.closest('button[data-f]'); if (!t) return; e.preventDefault(); bk.remove();
   if (t.dataset.f === 'sample') addSample(ed); else if (t.dataset.f === 'ai') aiDialog();
  });
 };
 W.kgptalkieDocApi = { nbDoc, toHtml, toMarkdown, toSqlnb, parseSqlnb, splitSql, cellsFromSql, importCells, exportAs, hlSql };
 /* pin buttons on result headers (frozen columns, like the extension's pin) */
 const pinButtons = rt => {
  const t = tabOf(rt); if (!t) return;
  t.element.querySelectorAll('.tabulator-col[tabulator-field]').forEach(h => {
   if (h.querySelector('.kgptalkiePin')) return; const f = h.getAttribute('tabulator-field'); const col = t.getColumn(f); if (!col) return;
   const p = document.createElement('span'); const on = !!col.getDefinition().frozen; p.className = 'kgptalkiePin codicon codicon-' + (on ? 'pinned' : 'pin') + (on ? ' on' : ''); p.title = on ? 'Unpin column' : 'Pin column';
   p.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); const c2 = t.getColumn(f); if (c2) c2.updateDefinition({ frozen: !c2.getDefinition().frozen }); }, { signal: AC.signal });
   p.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, { signal: AC.signal });
   const holder = h.querySelector('.tabulator-col-title-holder') || h; holder.appendChild(p);
  });
 };

 /* ---------- menu ---------- */
 const closeMenu = () => { document.querySelectorAll('.kgptalkieMenu').forEach(x => x.remove()); document.querySelectorAll('.kgptalkieMenuOpen').forEach(x => x.classList.remove('kgptalkieMenuOpen')); };
 const openMenu = (anchor, items) => {
  closeMenu(); const mn = document.createElement('div'); mn.className = 'kgptalkieMenu';
  items.forEach(it => { if (it === '-') { const s = document.createElement('div'); s.className = 'sep'; mn.appendChild(s); return; } const d = document.createElement('div'); d.className = 'it' + (it.dis ? ' dis' : ''); d.innerHTML = `<span>${it.t}</span><span class="k">${it.k || ''}</span>`; d.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); closeMenu(); it.f(); }); mn.appendChild(d); });
  document.body.appendChild(mn); const r = anchor.getBoundingClientRect(); const w = mn.offsetWidth, h = mn.offsetHeight;
  mn.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px'; mn.style.top = (r.bottom + h + 6 < innerHeight ? r.bottom + 4 : Math.max(8, r.top - h - 4)) + 'px';
  const bar = anchor.closest('.kgptalkieCellBar'); if (bar) bar.classList.add('kgptalkieMenuOpen');
 };
 document.addEventListener('mousedown', e => { if (!e.target.closest('.kgptalkieMenu')) closeMenu(); }, { capture: true, signal: AC.signal });
 document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); }, { capture: true, signal: AC.signal });
 const cellMenu = (ed, i) => {
  const m = ed.getModel(), all = ctxs(ed), x = all[i]; if (!x) return [];
  const md = isMdOnly(x), ai = isAi(x), last = i === all.length - 1, cmd = isCmd(m, x);
  const it = [];
  if (ai) it.push({ t: 'Write the SQL', k: 'Ctrl+Enter', f: () => A.aiCell(ed, i) });
  else if (md) it.push(rendered(x) ? { t: 'Edit Markdown', f: () => A.edit(ed, i) } : { t: 'Render Markdown', k: 'Ctrl+Enter', f: () => A.render(ed, i, false) });
  else it.push({ t: 'Run Cell', k: 'Ctrl+Enter', f: () => A.run(ed, i) }, { t: 'Run Above', f: () => A.runAbove(ed, i), dis: i === 0 }, { t: 'Run Cell and Below', f: () => A.runBelow(ed, i) });
  if (!md && !ai) {
   const err = !!errText(x), rows = !!resultSet(x);
   it.push('-', { t: 'Explain with AI', f: () => A.aiExplain(ed, i), dis: cmd }, { t: 'Optimize with AI', f: () => A.aiOptimize(ed, i), dis: cmd },
    { t: 'Fix with AI', f: () => A.aiFix(ed, i), dis: !err }, { t: 'Explain Result with AI', f: () => A.aiResult(ed, i), dis: !rows });
  }
  it.push('-', { t: 'Add Code Cell Above', f: () => A.addAbove(ed, i, 'mysql') }, { t: 'Add Code Cell Below', f: () => A.addBelow(ed, i, 'mysql') },
   { t: 'Add Markdown Cell Above', f: () => A.addAbove(ed, i, 'markdown') }, { t: 'Add Markdown Cell Below', f: () => A.addBelow(ed, i, 'markdown') },
   { t: 'Add AI Cell Below', f: () => A.addAi(ed, i) },
   '-', { t: 'Move Cell Up', f: () => A.move(ed, i, -1), dis: i === 0 || cmd }, { t: 'Move Cell Down', f: () => A.move(ed, i, 1), dis: last || cmd });
  it.push('-');
  if (!md && !ai) it.push({ t: 'Format: Lines / One Line', k: 'Shift+Alt+F', f: () => A.format(ed, i), dis: cmd }, { t: 'Change to Markdown', k: 'M', f: () => A.setType(ed, i, 'markdown'), dis: cmd }, { t: 'Change to AI Cell', f: () => A.setType(ed, i, 'ai'), dis: cmd }, { t: 'Clear Output', f: () => A.clearOne(ed, i) });
  else if (ai) it.push({ t: 'Change to SQL', k: 'Y', f: () => A.setType(ed, i, 'mysql') }, { t: 'Change to Markdown', k: 'M', f: () => A.setType(ed, i, 'markdown') }, { t: 'Clear Output', f: () => AIO.delete(x), dis: !AIO.get(x) });
  else it.push({ t: 'Change to SQL', k: 'Y', f: () => A.setType(ed, i, 'mysql') }, { t: 'Change to AI Cell', f: () => A.setType(ed, i, 'ai') });
  it.push('-', { t: 'Delete Cell', f: () => A.remove(ed, i) });
  return it;
 };

 /* ---------- notebook toolbar ---------- */
 const nbBtn = (a, icon, label, title) => `<button data-a="${a}" title="${title}"><span class="codicon codicon-${icon}"></span>${label}</button>`;
 const ensureNbBar = ed => {
  const host = ed.getDomNode().closest('.editorHost'); if (!host || !host.parentElement) return;
  const par = host.parentElement; let bar = par.querySelector(':scope > .kgptalkieNbBar');
  if (bar && bar.dataset.v === '12') return;
  if (bar) bar.remove();
  bar = document.createElement('div'); bar.className = 'kgptalkieNbBar'; bar.dataset.v = '12';
  bar.innerHTML = nbBtn('code', 'add', 'Code', 'Add a code cell below the current one') + nbBtn('md', 'add', 'Markdown', 'Add a markdown cell below the current one')
   + nbBtn('ai', 'sparkle', 'AI Cell', 'Add an AI cell: describe what you want in plain words, the SQL appears in the cell below') + '<span class="kgptalkieSep"></span>'
   + nbBtn('runall', 'run-all', 'Run All', 'Run every cell from the top') + nbBtn('clear', 'clear-all', 'Clear All Outputs', 'Remove every result') + nbBtn('restart', 'debug-restart', 'Restart', 'Clear every output and count from [1] again') + '<span class="kgptalkieSep"></span>'
   + nbBtn('vars', 'symbol-variable', 'Variables', 'Values for {{name}} placeholders in your SQL') + nbBtn('export', 'export', 'Export', 'Export the notebook (.sql, .sqlnb, HTML, PDF, Markdown) or import a .sql / .sqlnb file')
   + '<span class="kgptalkieSp"></span><span class="kgptalkieDb"></span><span class="kgptalkieTag none" title="Set in Notebook Settings"></span>' + nbBtn('aicfg', 'sparkle', 'Configure AI', 'Choose the AI provider, key and model') + nbBtn('settings', 'settings-gear', '', 'Notebook Settings: query timeout, safety checks, connection tag, keyword case') + nbBtn('start', 'question', '', 'Get Started: the sample notebook and a short tour');
  bar.addEventListener('mousedown', e => {
   const b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); const ci = selIndex(ed);
   const a = b.dataset.a;
   if (a === 'code') A.addBelow(ed, ci, 'mysql'); else if (a === 'md') A.addBelow(ed, ci, 'markdown'); else if (a === 'ai') A.addAi(ed, ci); else if (a === 'aicfg') aiDialog(); else if (a === 'vars') varsDialog(ed); else if (a === 'settings') settingsDialog(ed); else if (a === 'start') startDialog(ed);
   else if (a === 'runall') A.runAll(ed, b); else if (a === 'clear') A.clearAll(ed); else if (a === 'restart') A.restart(ed); else if (a === 'export') exportMenu(ed, b);
  }, { signal: AC.signal });
  const sink = document.createElement('div'); sink.className = 'kgptalkieSink'; sink.tabIndex = -1; bar.appendChild(sink);
  sink.addEventListener('keydown', e => { if (ed.kgptalkieCmd) cmdKey(ed, e); }, { signal: AC.signal });
  par.insertBefore(bar, host);
 };

 /* ---------- connection chip in the tab strip ---------- */
 const ensureChip = () => {
  const tb = document.getElementById('desktopWorkspaceTitlebar');
  document.querySelectorAll('.tabview.top.dbModuleTabview > .tabAreaContainer').forEach(area => {
   let chip = area.querySelector(':scope > .kgptalkieChip');
   if (!tb) { if (chip) chip.remove(); return; }
   if (!chip) {
    chip = document.createElement('button'); chip.className = 'kgptalkieChip'; chip.title = 'Show or hide the connection bar';
    chip.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); P.bar = !P.bar; store.set('kgptalkieTitleOpen', P.bar ? '1' : '0'); document.body.classList.toggle('kgptalkieTitleOpen', P.bar); chip.dataset.sig = ''; ensureChip(); }, { signal: AC.signal });
    area.appendChild(chip);
   }
   const q = s => { const e = tb.querySelector(s); return e ? e.textContent.trim() : ''; };
   const name = q('#workspaceSelector label'), who = q('.desktopStatusPrimary'), stat = q('.desktopStatusText'), ac = q('#desktopStatusTransactionIndicator');
   const sig = [name, who, stat, ac, P.bar].join('|'); if (chip.dataset.sig === sig) return; chip.dataset.sig = sig;
   const on = /connected/i.test(stat) && !/not|dis/i.test(stat);
   chip.innerHTML = `<span class="codicon codicon-database"></span><b>${esc(name)}</b>${who ? '<span>' + esc(who) + '</span>' : ''}<span class="d${on ? '' : ' off'}"></span><span>${esc(stat || '')}</span>${ac ? '<span class="ac">' + esc(ac) + '</span>' : ''}<span class="codicon codicon-chevron-${P.bar ? 'up' : 'down'}"></span>`;
  });
 };

 /* ---------- VS Code-style activity bar + side panels ----------
    Explorer = our own folder tree (files through server.py's read-only /kgptalkie/fs/); Schemas, Administration and
    Oracle Cloud = Workbench's own sidebar sections, one at a time and full height. */
 const FSURL = 'http://127.0.0.1:9241/kgptalkie/fs/';
 const fsGet = async (op, path) => {
  const r = await fetch(FSURL + op + (path ? '?path=' + encodeURIComponent(path) : ''), { headers: { 'X-KGPTalkie': '1' }, cache: 'no-store' });
  if (!r.ok) { let m = r.statusText; try { m = (await r.json()).error || m; } catch (e) { } throw new Error(m); }
  return op === 'read' ? r.text() : r.json();
 };
 const PANELS = [
  { id: 'explorer', icon: 'files', t: 'Explorer' },
  { id: 'schemas', icon: 'database', t: 'Database (Connections, Schemas)', secs: ['schemas', 'connection'] },
  { id: 'admin', icon: 'dashboard', t: 'Administration', secs: ['administration'] },
  { id: 'oci', icon: 'cloud', t: 'Oracle Cloud Infrastructure', secs: ['oci'] },
 ];
 P.panel = store.get('kgptalkiePanel', 'explorer'); if (!PANELS.some(p => p.id === P.panel)) P.panel = 'explorer';
 const X = W.kgptalkieExp || (W.kgptalkieExp = { cache: new Map(), loading: new Set(), sel: '', err: '' });
 X.folder = store.get('kgptalkieFolder', ''); try { X.open = new Set(JSON.parse(store.get('kgptalkieOpenDirs', '[]'))); } catch (e) { X.open = new Set(); }
 const saveOpen = () => store.set('kgptalkieOpenDirs', JSON.stringify([...X.open].slice(-300)));
 const allRoots = () => [...document.querySelectorAll('*')].filter(e => e.__k);
 const findComp = pred => { let f = null; const walk = v => { if (!v || f) return; const c = v.__c; if (c && pred(c)) { f = c; return; } (v.__k || []).forEach(walk); }; for (const r of allRoots()) { walk(r.__k); if (f) break; } return f; };
 const sideShown = () => { const h = document.getElementById('pane0Host'); return !!h && h.getBoundingClientRect().width > 40; };
 const toggleSide = () => { const b = document.getElementById('desktopWorkspaceSidebarToggle'); if (b) b.click(); };
 const joinPath = (d, n) => d.replace(/[\\/]+$/, '') + (d.includes('/') && !d.includes('\\') ? '/' : '\\') + n;
 const baseName = p => p.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || p;
 const extOf = n => { const m = /(\.mysql-notebook|\.[^.]+)$/i.exec(n); return m ? m[1].toLowerCase() : ''; };
 const CAN_OPEN = new Set(['.sql', '.mysql', '.js', '.ts', '.mysql-notebook']);
 const ICON = { '.mysql-notebook': ['notebook', '#3B82C4'], '.sql': ['database', '#D9822B'], '.mysql': ['database', '#D9822B'], '.js': ['file-code', '#C9A800'], '.ts': ['file-code', '#3178C6'],
  '.py': ['file-code', '#3572A5'], '.ipynb': ['notebook', '#E37933'], '.md': ['markdown', '#519ABA'], '.csv': ['table', '#3A9A4F'], '.tsv': ['table', '#3A9A4F'], '.json': ['json', '#C9A800'],
  '.toml': ['settings-gear', '#7A7A7A'], '.ini': ['settings-gear', '#7A7A7A'], '.cnf': ['settings-gear', '#7A7A7A'], '.cfg': ['settings-gear', '#7A7A7A'], '.yml': ['settings-gear', '#7A7A7A'], '.yaml': ['settings-gear', '#7A7A7A'],
  '.png': ['file-media', '#A074C4'], '.jpg': ['file-media', '#A074C4'], '.jpeg': ['file-media', '#A074C4'], '.gif': ['file-media', '#A074C4'], '.svg': ['file-media', '#A074C4'], '.mp4': ['file-media', '#A074C4'],
  '.pdf': ['file-pdf', '#C0392B'], '.zip': ['file-zip', '#7A7A7A'], '.txt': ['file', '#7A7A7A'], '.log': ['output', '#7A7A7A'] };
 let toastT = 0;
 const toast = msg => { const b = document.querySelector('.kgptalkieExp .kgptalkieToast'); if (!b) return; b.textContent = msg; b.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => b.classList.remove('on'), 3500); };
 const loadDir = async (d, force) => {
  if (!force && X.cache.has(d)) return; if (X.loading.has(d)) return; X.loading.add(d);
  try { const r = await fsGet('list', d); X.cache.set(d, r.items); X.err = ''; } catch (e) { X.cache.set(d, { error: String(e.message || e) }); if (d === X.folder) X.err = String(e.message || e); }
  finally { X.loading.delete(d); renderTree(); }
 };
 const setFolder = path => { if (!path) return; X.folder = path; store.set('kgptalkieFolder', path); X.cache.clear(); X.sel = ''; X.err = ''; X.open.add(path); saveOpen(); renderTree(); loadDir(path, true); };
 W.kgptalkieOnFolder = setFolder;
 /* the host's folder dialog answers with a "selectFile" message: take ours, pass everything else to the app */
 const hookHost = () => {
  const eh = W.electronHost; if (W.kgptalkieHostHooked === 2 || !eh || typeof eh.setMessageHandler !== 'function' || typeof W.onNativeMessage !== 'function') return;
  W.kgptalkieHostHooked = 2;                                 // 2 = dispatches to W.kgptalkiePick[id] (import) as well as the folder dialog
  eh.setMessageHandler(m => {
   try {
    if (m && m.command === 'selectFile' && m.data) {
     const id = m.data.resourceId, f = m.data.file && m.data.file[0];
     if (id === 'kgptalkieOpenFolder') { if (f && W.kgptalkieOnFolder) W.kgptalkieOnFolder(f.path); return; }
     if (W.kgptalkiePick && typeof W.kgptalkiePick[id] === 'function') { if (f) W.kgptalkiePick[id](f); return; }
    }
   } catch (e) { }
   return W.onNativeMessage(m);
  });
 };
 const pickFolder = () => {
  hookHost();
  if (W.electronHost && W.kgptalkieHostHooked) W.electronHost.postMessage({ source: 'app', command: 'showOpenDialog', data: { id: 'kgptalkieOpenFolder', title: 'Open Folder', openLabel: 'Select Folder', canSelectFiles: false, canSelectFolders: true, canSelectMany: false, default: X.folder || undefined } });
  else toast('The folder dialog needs the Workbench window.');
 };
 let opening = '';
 const openFile = async path => {
  if (!CAN_OPEN.has(extOf(path))) { toast('Workbench opens .sql, .mysql, .js, .ts and .mysql-notebook files.'); return; }
  if (opening === path) return; opening = path;
  try {
   const dm = findComp(c => typeof c.openSupportedFile === 'function' && typeof c.getOrCreateSelectedUserConnectionPageEntry === 'function');
   if (!dm) { toast('Open a connection first.'); return; }
   const text = await fsGet('read', path);
   const pe = await dm.getOrCreateSelectedUserConnectionPageEntry(); if (!pe) { toast('Open a connection first.'); return; }
   await dm.openSupportedFile(pe, path, text);
  } catch (e) { toast('Could not open: ' + (e.message || e)); } finally { setTimeout(() => { if (opening === path) opening = ''; }, 800); }
 };
 const row = (cls, depth, inner, title) => `<div class="kgptalkieRow ${cls}" style="padding-left:${8 + depth * 12}px"${title ? ` title="${esc(title)}"` : ''}>${inner}</div>`;
 const treeHtml = (d, depth) => {
  const items = X.cache.get(d);
  if (!items) return row('kgptalkieNote', depth, '<span class="kgptalkieTw"></span>Loading...');
  if (items.error) return row('kgptalkieNote kgptalkieErr', depth, '<span class="kgptalkieTw"></span>' + esc(items.error));
  if (!items.length && depth) return row('kgptalkieNote', depth, '<span class="kgptalkieTw"></span>Empty folder');
  let h = '';
  for (const it of items) {
   const p = joinPath(d, it.n), sel = X.sel === p ? ' kgptalkieSel' : '';
   if (it.d) {
    const o = X.open.has(p); if (o && !X.cache.has(p)) loadDir(p);
    h += `<div data-p="${esc(p)}" data-d="1">` + row('kgptalkieDir' + sel, depth, `<span class="kgptalkieTw codicon codicon-chevron-${o ? 'down' : 'right'}"></span><span class="kgptalkieNm">${esc(it.n)}</span>`, p) + '</div>';
    if (o) h += treeHtml(p, depth + 1);
   } else {
    const e = extOf(it.n), ic = ICON[e] || ['file', '#8A8A8A'], can = CAN_OPEN.has(e);
    h += `<div data-p="${esc(p)}">` + row('kgptalkieFile' + sel + (can ? '' : ' kgptalkieNo'), depth, `<span class="kgptalkieTw"></span><span class="kgptalkieIc codicon codicon-${ic[0]}" style="color:${ic[1]}"></span><span class="kgptalkieNm">${esc(it.n)}</span>`, p) + '</div>';
   }
  }
  return h;
 };
 const renderTree = () => {
  const body = document.querySelector('.kgptalkieExp .kgptalkieExpBody'); if (!body) return;
  const st = body.scrollTop;
  if (!X.folder) {
   body.innerHTML = `<div class="kgptalkieEmpty"><p>You have not yet opened a folder.</p><button class="kgptalkieBtn" data-a="open">Open Folder</button><p class="kgptalkieHint">Pick the folder you work in. Its .sql scripts and notebooks open here in Workbench.</p></div>`;
  } else {
   const o = X.open.has(X.folder);
   body.innerHTML = `<div data-p="${esc(X.folder)}" data-d="1" data-root="1">` + row('kgptalkieRoot', 0, `<span class="kgptalkieTw codicon codicon-chevron-${o ? 'down' : 'right'}"></span><span class="kgptalkieNm">${esc(baseName(X.folder))}</span>`, X.folder) + '</div>'
    + (o ? (X.err ? row('kgptalkieNote kgptalkieErr', 1, '<span class="kgptalkieTw"></span>' + esc(X.err)) : treeHtml(X.folder, 1)) : '');
  }
  body.scrollTop = st;
 };
 const ensureExplorer = () => {
  const pane = document.getElementById('desktopSidebarPane'); if (!pane) return;
  let ex = pane.querySelector(':scope > .kgptalkieExp'); if (ex) return;
  ex = document.createElement('div'); ex.className = 'kgptalkieExp';
  ex.innerHTML = `<div class="kgptalkieExpHead"><span>EXPLORER</span><span class="kgptalkieActs">`
   + `<button data-a="open" title="Open Folder..."><span class="codicon codicon-folder-opened"></span></button>`
   + `<button data-a="refresh" title="Refresh Explorer"><span class="codicon codicon-refresh"></span></button>`
   + `<button data-a="collapse" title="Collapse Folders in Explorer"><span class="codicon codicon-collapse-all"></span></button></span></div>`
   + `<div class="kgptalkieExpBody"></div><div class="kgptalkieToast"></div>`;
  ex.addEventListener('click', e => {
   const b = e.target.closest('button[data-a]');
   if (b) { const a = b.dataset.a; if (a === 'open') pickFolder(); else if (a === 'refresh') { const keep = X.folder; X.cache.clear(); if (keep) loadDir(keep, true); renderTree(); } else if (a === 'collapse') { X.open = new Set(X.folder ? [X.folder] : []); saveOpen(); renderTree(); } return; }
   const it = e.target.closest('[data-p]'); if (!it) return; const p = it.dataset.p;
   if (it.dataset.d) { if (X.open.has(p)) X.open.delete(p); else { X.open.add(p); loadDir(p); } X.sel = it.dataset.root ? '' : p; saveOpen(); renderTree(); return; }
   X.sel = p; renderTree(); openFile(p);
  }, { signal: AC.signal });
  pane.appendChild(ex); renderTree(); if (X.folder && !X.cache.has(X.folder)) loadDir(X.folder);
 };
 /* show one of Workbench's own sections, expanded and full height */
 const showSection = sec => { const s = document.getElementById(sec + 'Section'); if (s && !s.classList.contains('expanded')) { const t = s.querySelector(':scope > .title') || s.firstElementChild; if (t) t.click(); } };
 const secHosts = () => [...document.querySelectorAll('#documentSideBar [id$=SectionHost]')].map(h => ({ h, id: h.id.replace(/SectionHost$/, '') }));
 /* the panel in view: the chosen one, or Database when the chosen one has no section right now (Administration
    exists only while connected; Workbench shows Connections before that and Schemas after) */
 const curPanel = hs => { const pd = PANELS.find(p => p.id === P.panel); if (!pd || !pd.secs || hs.some(x => pd.secs.includes(x.id))) return P.panel; return 'schemas'; };
 const applyPanel = force => {
  const hs = secHosts(), cur = curPanel(hs), pd = PANELS.find(p => p.id === cur);
  PANELS.forEach(p => document.body.classList.toggle('kgptalkieP-' + p.id, p.id === cur));
  const shown = (pd && pd.secs) ? hs.filter(x => pd.secs.includes(x.id)) : [];
  hs.forEach(x => { const on = shown.includes(x); x.h.classList.toggle('kgptalkieHideSec', !on); x.h.classList.toggle('kgptalkieFullSec', on); });
  document.querySelectorAll('.kgptalkieAct button[data-p]').forEach(b => { const q = PANELS.find(p => p.id === b.dataset.p); b.classList.toggle('kgptalkieNA', !!(q && q.secs) && !hs.some(x => q.secs.includes(x.id))); b.classList.toggle('on', b.dataset.p === cur && sideShown()); });
  const sig = cur + '|' + shown.map(x => x.id).join(',');
  if (force || X.secSig !== sig) { X.secSig = sig; shown.forEach(x => showSection(x.id)); }
 };
 const setPanel = id => {
  if (id === P.panel && sideShown()) { toggleSide(); setTimeout(applyPanel, 50); return; }
  P.panel = id; store.set('kgptalkiePanel', id); if (!sideShown()) toggleSide(); applyPanel(true); setTimeout(applyPanel, 120);
 };
 const ensureActivity = () => {
  const root = document.getElementById('root'); if (!root || !document.getElementById('desktopSidebarPane')) return;
  document.body.classList.add('kgptalkieActOn');
  let bar = root.querySelector(':scope > .kgptalkieAct');
  if (!bar) {
   bar = document.createElement('div'); bar.className = 'kgptalkieAct';
   bar.innerHTML = PANELS.map(p => `<button data-p="${p.id}" title="${p.t}"><span class="codicon codicon-${p.icon}"></span></button>`).join('') + '<span class="kgptalkieSp"></span><button data-a="settings" title="Settings"><span class="codicon codicon-settings-gear"></span></button>';
   bar.addEventListener('mousedown', e => {
    const b = e.target.closest('button'); if (!b || e.button !== 0) return; e.preventDefault();
    if (b.dataset.p) setPanel(b.dataset.p);
    else if (b.dataset.a === 'settings') { const h = findComp(c => typeof c.executeDesktopCommand === 'function'); if (h) h.executeDesktopCommand('app.preferences'); }
   }, { signal: AC.signal });
   root.insertBefore(bar, root.firstChild); applyPanel();
  }
  ensureExplorer();
  applyPanel();
  hookHost();
 };

 /* ---------- Settings > Code Editor > Notebook Autocomplete ---------- */
 const SET_ID = 'editor.kgptalkieAutocomplete';
 const setSuggest = on => { if (P.suggest === on) return; P.suggest = on; store.set('kgptalkieSuggest', on ? '1' : '0'); list.forEach(applyOpts); };
 const ensureSetting = inst => {
  const cat = (inst.state.settingsTree || []).find(c => c.key === 'editor'); if (!cat) return;
  if (!cat.values.some(v => v.id === SET_ID)) {
   cat.values.push({ id: SET_ID, key: 'kgptalkieAutocomplete', title: 'Notebook Autocomplete', valueType: 'boolean', defaultValue: P.suggest, advanced: false, parameters: {},
    description: 'Show code suggestions automatically while typing in notebooks and scripts. Ctrl+Space always opens them.' });
   try { if (inst.filterTimer) { clearTimeout(inst.filterTimer); inst.filterTimer = null; } inst.runFilterTimer(); } catch (e) { }
  }
  const el = document.getElementById(SET_ID); if (el) setSuggest(el.classList.contains('checked'));
 };

 /* ---------- editors ---------- */
 const applyOpts = ed => {
  const nb = isNB(ed); const v = 'v5' + (P.suggest ? 1 : 0); if (ed.kgptalkieOpt === v) return; ed.kgptalkieOpt = v;
  const o = { lineHeight: nb ? NB : SC, padding: { top: nb ? 0 : 14, bottom: 14 }, quickSuggestions: P.suggest ? { other: true, comments: false, strings: false } : false, suggestOnTriggerCharacters: P.suggest, wordBasedSuggestions: 'off' };
  if (nb) Object.assign(o, { lineNumbers: 'off', lineDecorationsWidth: MW, glyphMargin: false, folding: false, renderLineHighlight: 'none' });
  ed.updateOptions(o);
 };
 const find = () => {
  const root = [...document.querySelectorAll('*')].find(e => e.__k); const out = [];
  let setEd = null;
  const walk = v => { if (!v) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function') { out.push(c.editor); c.editor.kgptalkieCE = c; } if (c && c.state && Array.isArray(c.state.settingsTree) && typeof c.runFilterTimer === 'function') setEd = c; (v.__k || []).forEach(walk); };
  if (root) walk(root.__k); list = out;
  const sd = document.getElementById('settingsDialog'); if (sd && sd.__k && !setEd) walk(sd.__k);   // Settings is its own render root (a portal)
  if (setEd) try { ensureSetting(setEd); } catch (e) { W.kgptalkieErr = String(e && e.stack || e); }
  ensureChip();
  try { ensureActivity(); } catch (e) { W.kgptalkieErr = String(e && e.stack || e); }
  for (const ed of list) {
   const dom = ed.getDomNode(); if (!dom) continue; const nb = isNB(ed);
   applyOpts(ed);
   if (nb) ensureNbBar(ed);
   if (dom.kgptalkieAC === AC) continue;
   dom.kgptalkieAC = AC;
   dom.addEventListener('wheel', e => { if (!e.target.closest('.view-zones')) return; const th = e.target.closest('.tabulator-tableholder'); if (th && th.scrollHeight > th.clientHeight + 1) return; ed.setScrollTop(ed.getScrollTop() + e.deltaY); e.preventDefault(); }, { capture: true, passive: false, signal: AC.signal });
   if (!nb) continue;
   dom.addEventListener('mousedown', e => { if (e.button !== 0) return; const fr = e.target.closest('.kgptalkieCap, .kgptalkieBar'); const zk = fr && fr.closest('[data-kcell]'); if (zk) { e.preventDefault(); e.stopPropagation(); closeMenu(); enterCmd(ed, +zk.dataset.kcell); } }, { capture: true, signal: AC.signal });
   DISP.push(ed.onDidFocusEditorText(() => exitCmd(ed)));
   hookCase(ed);
   dom.addEventListener('mousedown', e => { if (!e.target.closest('.kgptalkieP')) return; e.preventDefault(); e.stopPropagation(); const t = ed.getTargetAtClientPoint(e.clientX, e.clientY); const ln = t && t.position && t.position.lineNumber; const i = ln ? cellAt(ed, ln) : -1; if (i >= 0) A.run(ed, i); }, { capture: true, signal: AC.signal });
   dom.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey && ed.hasTextFocus()) {
     const w = dom.querySelector('.suggest-widget.visible, .find-widget.visible, .parameter-hints-widget.visible, .rename-box');
     if (!w && ed.getSelections().length <= 1) { e.preventDefault(); e.stopPropagation(); enterCmd(ed); return; }
    }
    const p = ed.getPosition(); const i = p ? cellAt(ed, p.lineNumber) : -1; const x = ctxs(ed)[i]; if (!x) return;
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey) && !e.altKey && isAi(x)) { e.preventDefault(); e.stopPropagation(); A.aiCell(ed, i); if (e.shiftKey) { if (i + 1 < ctxs(ed).length) selectCell(ed, i + 1); } return; }
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey) && !e.altKey && isMd(x)) { e.preventDefault(); e.stopPropagation(); A.render(ed, i, e.shiftKey); return; }
    if ((e.code === 'KeyF' || (e.key || '').toLowerCase() === 'f') && e.shiftKey && e.altKey && !e.ctrlKey && !isMd(x)) { e.preventDefault(); e.stopPropagation(); A.format(ed, i); }
   }, { capture: true, signal: AC.signal });
   const setHover = i => { const S = ed.kgptalkieNB; if (S && S.hover !== i) { S.hover = i; S.dsig = ''; } };
   DISP.push(ed.onMouseMove(ev => { const t = ev.target; const z = t.element && t.element.closest && t.element.closest('[data-kcell]'); let i = -1;
    if (z) i = +z.dataset.kcell; else if (t.position) i = cellAt(ed, t.position.lineNumber); else if (t.detail && typeof t.detail.afterLineNumber === 'number') i = cellAt(ed, t.detail.afterLineNumber);
    setHover(i); }));
   DISP.push(ed.onMouseLeave(() => setHover(-1)));
   DISP.push(ed.onDidChangeCursorPosition(ev => {
    const S = ed.kgptalkieNB; if (!S) return; const all = ctxs(ed); const ni = cellAt(ed, ev.position.lineNumber);
    const prev = all[S.sel]; if (prev && isMd(prev) && MDE.has(prev) && S.sel !== ni) { MDE.delete(prev); S.sig = ''; }
    if (S.sel !== ni) { S.sel = ni; S.dsig = ''; }
   }));
  }
 };

 /* ---------- cell boxes, counts, line numbers, play, toolbars, markdown ---------- */
 const cap = (cls, withBar) => { const z = document.createElement('div'); const p = document.createElement('div'); p.className = 'kgptalkieCap ' + cls; z.appendChild(p); let b = null; if (withBar) { b = document.createElement('div'); b.className = 'kgptalkieBar ' + cls.split(' ')[1]; z.appendChild(b); } return { z, parts: b ? [p, b] : [p] }; };
 const insButtons = (ed, at) => {
  const d = document.createElement('div'); d.className = 'kgptalkieIns';
  d.innerHTML = '<button data-l="mysql"><span class="codicon codicon-add"></span>Code</button><button data-l="markdown"><span class="codicon codicon-add"></span>Markdown</button>';
  d.addEventListener('mousedown', e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); A.insertAt(ed, at, b.dataset.l); }, { signal: AC.signal });
  return d;
 };
 const cellBar = (ed, i, x, top) => {
  const bar = document.createElement('div'); bar.className = 'kgptalkieCellBar'; bar.style.top = top + 'px';
  const btn = (a, icon, t) => `<button data-a="${a}" title="${t}"><span class="codicon codicon-${icon}"></span></button>`;
  bar.innerHTML = isAi(x)
   ? btn('aigen', 'sparkle', 'Write the SQL (Ctrl+Enter)') + btn('more', 'ellipsis', 'More Actions') + btn('del', 'trash', 'Delete Cell')
   : isMd(x)
   ? (rendered(x) ? btn('edit', 'edit', 'Edit Markdown') : btn('render', 'check', 'Render Markdown (Ctrl+Enter)'))
     + btn('more', 'ellipsis', 'More Actions') + btn('del', 'trash', 'Delete Cell')
   : btn('aiexplain', 'sparkle', 'Explain with AI') + btn('above', 'run-above', 'Run Above') + btn('below', 'run-below', 'Run Cell and Below') + btn('more', 'ellipsis', 'More Actions') + btn('del', 'trash', 'Delete Cell');
  bar.addEventListener('mousedown', e => {
   const b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); const a = b.dataset.a;
   if (a === 'aiexplain') A.aiExplain(ed, i); else if (a === 'aigen') A.aiCell(ed, i);
   else if (a === 'above') A.runAbove(ed, i); else if (a === 'below') A.runBelow(ed, i); else if (a === 'del') A.remove(ed, i);
   else if (a === 'edit') A.edit(ed, i); else if (a === 'render') A.render(ed, i, false); else if (a === 'more') openMenu(b, cellMenu(ed, i));
  }, { signal: AC.signal });
  return bar;
 };
 const measure = (node, width) => { const h = document.createElement('div'); h.style.cssText = `position:absolute;left:-10000px;top:0;visibility:hidden;width:${width}px`; const c = node.cloneNode(true); c.style.position = 'static'; h.appendChild(c); document.body.appendChild(h); const v = c.offsetHeight; h.remove(); return v; };
 const hashStr = s => { let h = 0; for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) | 0; return h; };

 const paint = ed => {
  const m = ed.getModel(); const arr = ctxs(ed); if (!arr.length) return;
  const S = ed.kgptalkieNB || (ed.kgptalkieNB = { zones: [], decos: [], sig: '', dsig: '', caps: [], bars: [], hover: -1, sel: -1 });
  if (S.sel < 0) { const p0 = ed.getPosition(); S.sel = p0 ? cellAt(ed, p0.lineNumber) : -1; }
  syncAi(ed);
  const cw = ed.getLayoutInfo().contentWidth;
  const sig = arr.map(x => x.startLine + '-' + x.endLine + (isMd(x) ? (isAi(x) ? 'A' : rendered(x) ? 'R' + hashStr(textOf(m, x)) : 'E') : '')).join(',') + '|' + m.getLineCount() + '|' + cw;
  if (sig !== S.sig) {
   // hidden lines = rendered markdown cells and the marker line of AI cells (never every line)
   let hid = arr.filter(rendered).map(x => ({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }));
   arr.filter(x => isAi(x) && x.endLine > x.startLine).forEach(x => hid.push({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.startLine, endColumn: m.getLineMaxColumn(x.startLine) }));
   hid.sort((a, b) => a.startLineNumber - b.startLineNumber);
   if (hid.reduce((s, r) => s + r.endLineNumber - r.startLineNumber + 1, 0) >= m.getLineCount()) hid = hid.slice(0, -1);
   ed.setHiddenAreas(hid);
   // a cursor left inside hidden lines goes to the next visible cell
   const pc = ed.getPosition(); const ci = pc ? cellAt(ed, pc.lineNumber) : -1;
   if (ci >= 0 && rendered(arr[ci])) { const nv = arr.findIndex((x, k) => k > ci && !rendered(x)); if (nv >= 0) { const sv = S.sel; focusCell(ed, nv, false); S.sel = sv; } }
   ed.changeViewZones(a => {
    S.zones.forEach(id => a.removeZone(id)); S.zones = []; S.caps = []; S.bars = [];
    arr.forEach((x, i) => {
     const gap = i ? GAP : GAP0, base = { suppressMouseDown: true, showInHiddenAreas: true };
     if (rendered(x)) {
      const z = document.createElement('div'); z.dataset.kcell = i;
      const g = document.createElement('div'); g.className = 'kgptalkieGap'; g.style.height = gap + 'px'; if (i) g.appendChild(insButtons(ed, i)); z.appendChild(g);
      const w = document.createElement('div'); w.className = 'kgptalkieMdWrap'; w.style.top = gap + 'px';
      const body = document.createElement('div'); body.className = 'kgptalkieMdBody'; body.innerHTML = mdToHtml(textOf(m, x)); w.appendChild(body); w.appendChild(langBtn(ed, i, x));
      body.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }, { signal: AC.signal });
      w.addEventListener('mousedown', e => { if (e.button !== 0) return; e.stopPropagation(); closeMenu(); S.sel = i; S.dsig = ''; }, { signal: AC.signal });
      w.addEventListener('mouseup', e => { if (e.button !== 0) return; enterCmd(ed, i); }, { signal: AC.signal });
      z.appendChild(w);
      const h = Math.max(30, measure(w, Math.max(200, cw - RIGHT)));
      const bar = cellBar(ed, i, x, gap - 11); z.appendChild(bar);
      const mz = document.createElement('div'); mz.dataset.kcell = i; const mb = document.createElement('div'); mb.className = 'kgptalkieBar md'; mb.style.top = gap + 'px'; mb.style.height = h + 'px'; mz.appendChild(mb);
      const mm = document.createElement('div'); mm.className = 'kgptalkieMdM'; mm.style.top = gap + 'px'; mm.style.height = h + 'px'; mz.appendChild(mm);
      mm.addEventListener('mousedown', e => { if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); closeMenu(); enterCmd(ed, i); }, { signal: AC.signal });
      mm.addEventListener('dblclick', e => { e.preventDefault(); e.stopPropagation(); A.edit(ed, i); }, { signal: AC.signal });
      S.zones.push(a.addZone({ ...base, afterLineNumber: x.startLine - 1, ordinal: 1e9 + i, heightInPx: gap + h, domNode: z, marginDomNode: mz }));
      S.caps.push([w, mb, mm]); S.bars.push(bar);
      return;
     }
     const tc = cap('c t'), tm = cap('m t', true), bc = cap('c b'), bm = cap('m b', true);
     tc.z.dataset.kcell = i; tm.z.dataset.kcell = i; bc.z.dataset.kcell = i; bm.z.dataset.kcell = i;
     const g = document.createElement('div'); g.className = 'kgptalkieGap'; g.style.height = gap + 'px'; if (i) g.appendChild(insButtons(ed, i)); tc.z.appendChild(g);
     const bar = cellBar(ed, i, x, gap - 11); tc.z.appendChild(bar);
     S.zones.push(a.addZone({ ...base, afterLineNumber: x.startLine - 1, ordinal: 1e9 + i, heightInPx: gap + CAP, domNode: tc.z, marginDomNode: tm.z }));
     bc.z.appendChild(langBtn(ed, i, x));
     S.zones.push(a.addZone({ ...base, afterLineNumber: x.endLine, ordinal: 0, heightInPx: CAPB, domNode: bc.z, marginDomNode: bm.z }));
     S.caps.push([...tc.parts, ...tm.parts, ...bc.parts, ...bm.parts]); S.bars.push(bar);
    });
    const tz = document.createElement('div'); tz.className = 'kgptalkieTrail'; const tg = document.createElement('div'); tg.className = 'kgptalkieGap'; tg.style.height = TRAIL + 'px'; tg.appendChild(insButtons(ed, arr.length)); tz.appendChild(tg);
    S.zones.push(a.addZone({ suppressMouseDown: true, showInHiddenAreas: true, afterLineNumber: m.getLineCount(), ordinal: 2e9, heightInPx: TRAIL, domNode: tz }));
   });
   S.sig = sig; S.dsig = '';
   if (ed.kgptalkiePendingFocus) { const pf = ed.kgptalkiePendingFocus; ed.kgptalkiePendingFocus = null; const k = ctxs(ed).indexOf(pf.x); if (k >= 0) focusCell(ed, k, pf.atEnd); }
  }
  for (const x of arr) { const p = x.presentation; if (p && p.resultData && R.seen.get(x) !== p.resultData) { R.seen.set(x, p.resultData); R.num.set(x, ++R.n); } }
  const fi = S.sel;
  const lab = arr.map(x => { if (isMdOnly(x)) return 'M'; if (isAi(x)) { const st = AIO.get(x); return st && st.status === 'streaming' ? 'R' : (st && st.status === 'done' && R.num.get(x)) || 0; } const p = x.presentation; if (p && p.loadingState && p.loadingState !== 'idle') return 'R'; return (p && p.resultData && R.num.get(x)) || 0; });
  const aiEmpty = arr.map(x => (isAi(x) && !textOf(m, x).split('\n').slice(1).join('').trim()) ? 1 : 0);
  const dsig = sig + '|' + fi + '|' + S.hover + '|' + lab.join(',') + '|' + aiEmpty.join('');
  if (dsig === S.dsig) return; S.dsig = dsig;
  const decos = []; const line = ln => ({ startLineNumber: ln, startColumn: 1, endLineNumber: ln, endColumn: 1 });
  arr.forEach((x, i) => {
   const f = i === fi ? ' kgptalkieF' : ''; const show = i === fi || i === S.hover;
   (S.caps[i] || []).forEach(el => { el.classList.toggle('kgptalkieF', !!f); el.classList.toggle('kgptalkieH', i === S.hover); });
   if (S.bars[i]) S.bars[i].classList.toggle('kgptalkieShow', show && !isCmd(m, x));
   if (rendered(x)) return;
   const ai = isAi(x), s0 = ai && x.endLine > x.startLine ? x.startLine + 1 : x.startLine;   // AI cells start after the hidden marker
   for (let ln = s0; ln <= x.endLine; ln++) {
    decos.push({ range: line(ln), options: { isWholeLine: true, className: 'kgptalkieL' + (ai ? ' kgptalkieLA' : '') + f, linesDecorationsClassName: 'kgptalkieM' + f } });
    const k = ln - s0 + 1; decos.push({ range: line(ln), options: { linesDecorationsClassName: 'kgptalkieLn ' + rule('kgptalkieLn' + k, String(k)) + f } });
   }
   const k = lab[i];
   decos.push({ range: line(s0), options: { linesDecorationsClassName: 'kgptalkieN ' + (k === 'M' ? 'kgptalkieNM' : k === 'R' ? 'kgptalkieNR' : k ? rule('kgptalkieN' + k, '[' + k + ']') : 'kgptalkieN0') } });
   if (!isMdOnly(x)) decos.push({ range: line(s0), options: { linesDecorationsClassName: 'kgptalkieP' + (show ? ' kgptalkiePV' : '') } });
   if (ai && aiEmpty[i]) decos.push({ range: { startLineNumber: s0, startColumn: 1, endLineNumber: s0, endColumn: 1 }, options: { after: { content: 'Describe what you want in plain words, then run (Ctrl+Enter). The SQL appears in the cell below.', inlineClassName: 'kgptalkieAiHint' } } });
   const zid = x.presentation && x.presentation.zoneInfo && x.presentation.zoneInfo.zoneId;
   if (zid) { const zm = ed.getDomNode().querySelector(`.zoneMargin[monaco-view-zone="${zid}"]`); if (zm) zm.classList.toggle('kgptalkieF', !!f); }
  });
  S.decos = ed.deltaDecorations(S.decos, decos);
 };

 const fit = ed => {
  const nb = isNB(ed);
  for (const x of ctxs(ed)) {
   const p = x.presentation; if (!p || !p.renderTarget || !p.zoneInfo || !p.resultData) continue; const rt = p.renderTarget; let box;
   if (p.resultData.type === 'resultSets') {
    const t = rt.querySelector('.tabulator-table'), hd = rt.querySelector('.tabulator-header'), sb = rt.querySelector('.resultStatus');
    const st = RS.get(x), cap = st && st.expand ? 704 : 352;
    const extra = [':scope > .kgptalkieResBar', ':scope > .kgptalkieViewer'].reduce((s, q) => { const e = rt.querySelector(q); return s + (e ? e.offsetHeight : 0); }, 0);
    const cb = rt.querySelector(':scope > .kgptalkieChartBox');
    const fr = rt.querySelector('.kgptalkieFRow');
    /* several statements = a strip of result tabs (Output, Result #1 ...) above the grid; it needs its own room */
    const tabs = rt.querySelector('.resultTabview > .tabAreaContainer'), th = tabs ? tabs.offsetHeight : 0;
    if (st && st.view === 'chart' && cb) box = Math.ceil(extra + cb.offsetHeight + 8);
    else box = (t && hd && t.offsetHeight) ? Math.ceil(Math.min(cap, th + hd.offsetHeight + (fr ? fr.offsetHeight : 0) + t.offsetHeight + (sb ? sb.offsetHeight : 0) + 10) + extra) : 64 + extra;
   } else if (nb) {
    const ao = rt.querySelector('.actionOutput') || rt.querySelector('.outputHost'); if (!ao) continue;
    box = Math.min(600, Math.ceil([...ao.children].reduce((s, c) => s + c.offsetHeight, 0) + 10));
   } else continue;
   const pad = nb ? OUTPAD : 0, want = box + pad + (nb ? 0 : 22), z = p.zoneInfo.zone;
   if (nb && !z.showInHiddenAreas) { z.showInHiddenAreas = true; z.heightInPx = -1; }
   if (Math.abs(z.heightInPx - want) < 2 && rt.style.height === box + 'px') continue;
   p.currentHeight = box; p.manuallyResized = true; z.heightInPx = want; rt.style.height = box + 'px'; rt.style.marginTop = pad + 'px';
   p.backend.changeViewZones(a => a.layoutZone(p.zoneInfo.zoneId));
  }
 };

 const tick = () => { try { hookAll(); } catch (e) { W.kgptalkieErr = String(e && e.stack || e); } for (const ed of list) { try { fit(ed); if (isNB(ed)) { paint(ed); paintAi(ed); resultButtons(ed); } } catch (e) { W.kgptalkieErr = String(e && e.stack || e); } } };
 W.kgptalkieTick = tick;                                   // tests in a hidden window (no animation frames) call this
 const loop = () => { tick(); W.kgptalkieRaf = requestAnimationFrame(loop); };
 W.kgptalkieTeardown = () => {
  AC.abort(); DISP.forEach(d => { try { d.dispose(); } catch (e) { } }); closeMenu(); try { unhookWs(); } catch (e) { } try { unhookTreeMenus(); } catch (e) { } try { unhookCompletion(); } catch (e) { }
  document.querySelectorAll('.kgptalkieNbBar,.kgptalkieChip,.kgptalkieAct,.kgptalkieExp').forEach(b => b.remove());
  document.body.classList.remove('kgptalkieActOn', ...PANELS.map(p => 'kgptalkieP-' + p.id));
  document.querySelectorAll('.kgptalkieDlgBack,.kgptalkieFixBtn,.kgptalkieResAi,.kgptalkieResBar,.kgptalkieChartBox,.kgptalkieViewer,.kgptalkieFRow,.kgptalkiePin,.kgptalkieNbToast').forEach(b => b.remove());
  document.querySelectorAll('.kgptalkieChartView').forEach(b => b.classList.remove('kgptalkieChartView'));
  for (const ed of list) { exitCmd(ed); const S = ed.kgptalkieNB; if (!S) continue; try { ed.changeViewZones(a => { S.zones.forEach(id => a.removeZone(id)); if (S.ai) S.ai.forEach(z => a.removeZone(z.id)); }); ed.deltaDecorations(S.decos, []); ed.setHiddenAreas([]); } catch (e) { } ed.kgptalkieNB = null; ed.kgptalkieOpt = ''; }
 };
 const start = () => { barCls(); find(); loop(); W.kgptalkieLook = setInterval(find, 500); };
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
 return 'kgptalkie plugin v10 on';
})()
