(async () => {
  const A = window.kgptalkieActions, sleep = ms => new Promise(r => setTimeout(r, ms));
  let ed = null;
  const walk = (v, d) => { if (!v || d > 60 || ed) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) ed = c.editor; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  if (!ed) return 'no editor';
  const m = ed.getModel(), ctxs = () => m.executionContexts.content;
  const setText = (i, t) => { const x = ctxs()[i]; ed.executeEdits('t', [{ range: { startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }, text: t }]); };
  const txt = i => { const x = ctxs()[i]; return m.getValueInRange({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }); };
  const card = x => { const st = window.kgptalkieAiOut.get(x); return st ? { kind: st.kind, status: st.status, len: st.md.length, sql: st.sql ? st.sql.slice(0, 160) : null, head: st.md.slice(0, 160) } : null; };
  const out = {};
  // 1. a query + Explain
  setText(ctxs().length - 1, 'SELECT city, COUNT(*) AS n FROM kgptalkie_test.students GROUP BY city');
  const j = A.run(ed, ctxs().length - 1); await A.done(j, 20000);
  const t0 = Date.now(); await A.aiExplain(ed, 0); out.explain = { ...card(ctxs()[0]), ms: Date.now() - t0 };
  await sleep(400);
  out.zone = (() => { const z = document.querySelector('.kgptalkieAiZone .kgptalkieAi'); return z ? { h: z.offsetHeight, title: z.querySelector('.kgptalkieAiH b').textContent, hasBody: z.querySelector('.kgptalkieAiB').textContent.length } : null; })();
  // 2. AI cell -> SQL below
  await A.addAi(ed, 0);
  const ai = 1; const xa = ctxs()[ai];
  out.aiCellType = { lines: txt(ai).split('\n').length, first: txt(ai).split('\n')[0], isAi: window.kgptalkieAiCells.has(xa) };
  ed.executeEdits('t', [{ range: { startLineNumber: xa.endLine, startColumn: 1, endLineNumber: xa.endLine, endColumn: m.getLineMaxColumn(xa.endLine) }, text: 'How many students live in each city? Most first.' }]);
  const st = await A.aiCell(ed, ai);
  out.aiCell = { status: st && st.status, note: st && st.note, cells: ctxs().length, below: txt(ai + 1).slice(0, 200) };
  // run the generated SQL
  const j2 = A.run(ed, ai + 1); if (j2) await A.done(j2, 20000);
  out.genRun = !!(ctxs()[ai + 1].presentation && ctxs()[ai + 1].presentation.resultData);
  // 3. an error + Fix with AI
  await A.addBelow(ed, ctxs().length - 1, 'mysql'); const e = ctxs().length - 1;
  setText(e, 'SELECT nme, cty FROM kgptalkie_test.students');
  const j3 = A.run(ed, e); await A.done(j3, 20000); await sleep(300);
  out.err = { text: (ctxs()[e].presentation.renderTarget.querySelector('.resultText.error') || {}).textContent, fixBtn: !!ctxs()[e].presentation.renderTarget.querySelector('.kgptalkieFixBtn') };
  await A.aiFix(ed, e); out.fix = card(ctxs()[e]);
  // 4. Optimize on the first cell
  await A.aiOptimize(ed, 0); out.optimize = card(ctxs()[0]);
  out.resAiBtn = document.querySelectorAll('.kgptalkieResAi').length;
  out.err2 = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
