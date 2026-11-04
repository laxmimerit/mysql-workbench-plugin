(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)).then(() => window.kgptalkieTick()), out = {};
  const eds = []; const walk = (v, d) => { if (!v || d > 60) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) eds.push(c.editor); for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const ed = eds.find(e => e.getDomNode().offsetWidth) || eds[eds.length - 1];
  const m = ed.getModel(), cs = () => m.executionContexts.content;
  const txt = x => m.getValueInRange({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) });
  const FROM = +(window.kgptalkieSampleFrom || 9);
  // wait for the last SQL cell (the {{country}} one, then the AI cell) to get a result
  const last = () => cs()[cs().length - 1];
  for (let n = 0; n < 400; n++) { const x = cs()[17]; if (x && x.presentation && x.presentation.resultData) break; await sleep(250); }
  await sleep(1500);
  out.results = cs().slice(FROM).map((x, i) => { const k = FROM + i; const r = x.presentation && x.presentation.resultData; const head = txt(x).split('\n')[0].slice(0, 50);
    if (!r) return k + ' ' + x.language + ' | ' + head;
    if (r.type === 'resultSets') return k + ' | ' + head + ' => ' + r.sets.map(s => (s.columns || []).map(c => c.title).slice(0, 5).join(',') + ' x' + ((s.data && s.data.rows) || []).length + (s.data && s.data.rows && s.data.rows[0] ? ' ' + JSON.stringify(s.data.rows[0]).slice(0, 90) : '')).join(' || ');
    return k + ' | ' + head + ' => text: ' + JSON.stringify(r.text).slice(0, 200); });
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
