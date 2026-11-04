(async () => {
  const A = window.kgptalkieActions, sleep = ms => new Promise(r => setTimeout(r, ms));
  let ed = null;
  const walk = (v, d) => { if (!v || d > 60 || ed) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) ed = c.editor; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const m = ed.getModel(), ctxs = () => m.executionContexts.content;
  const txt = x => m.getValueInRange({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) });
  const cells = ctxs().map((x, i) => i + ':' + x.language + ':' + txt(x).replace(/\n/g, ' | ').slice(0, 50));
  const q = ctxs().findIndex(x => /GROUP BY city/.test(txt(x)) && !/AI-written/.test(txt(x)));
  const card = x => { const st = window.kgptalkieAiOut.get(x); return st ? { kind: st.kind, status: st.status, len: st.md.length, sql: st.sql ? st.sql.slice(0, 200) : null, head: st.md.slice(0, 220) } : null; };
  const out = { cells, q };
  let t0 = Date.now(); await A.aiExplain(ed, q); out.explain = { ...card(ctxs()[q]), ms: Date.now() - t0 };
  await sleep(300);
  const z = [...document.querySelectorAll('.kgptalkieAiZone .kgptalkieAi')].map(z => ({ h: z.offsetHeight, title: z.querySelector('.kgptalkieAiH b').textContent, acts: [...z.querySelectorAll('.kgptalkieAiActs button')].map(b => b.textContent) }));
  out.cards = z;
  t0 = Date.now(); await A.aiOptimize(ed, q); out.optimize = { ...card(ctxs()[q]), ms: Date.now() - t0 };
  t0 = Date.now(); await A.aiResult(ed, q); out.result = { ...card(ctxs()[q]), ms: Date.now() - t0 };
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
