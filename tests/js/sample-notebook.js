(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)).then(() => window.kgptalkieTick()), out = {};
  // the visible notebook editor
  const eds = []; const walk = (v, d) => { if (!v || d > 60) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) eds.push(c.editor); for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const ed = eds.find(e => e.getDomNode().offsetWidth) || eds[eds.length - 1];
  const m = ed.getModel(), cs = () => m.executionContexts.content;
  out.before = cs().length;
  // Get Started -> Add the sample notebook, through the toolbar like a click
  const bar = ed.getDomNode().closest('.editorHost').parentElement.querySelector(':scope > .kgptalkieNbBar');
  bar.querySelector('[data-a=start]').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  await sleep(100); const dl = document.querySelector('.kgptalkieDlgBack'); out.dialog = dl && dl.querySelector('.kgptalkieDlgT').textContent;
  dl.querySelector('[data-f=sample]').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  for (let n = 0; n < 40 && cs().length < 10; n++) await sleep(150);
  out.cells = cs().length;
  const t0 = Date.now(); await window.kgptalkieActions.runAll(ed); out.runAllMs = Date.now() - t0;
  await sleep(500);
  const txt = x => m.getValueInRange({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) });
  out.results = cs().map((x, k) => { const r = x.presentation && x.presentation.resultData; const head = txt(x).split('\n')[0].slice(0, 50);
    if (!r) return k + ' ' + x.language + ' | ' + head;
    if (r.type === 'resultSets') return k + ' | ' + head + ' => ' + r.sets.map(s => (s.columns || []).map(c => c.title).slice(0, 4).join(',') + ' x' + ((s.data && s.data.rows) || []).length + (s.data && s.data.rows && s.data.rows[0] ? ' ' + JSON.stringify(s.data.rows[0]).slice(0, 80) : '')).join(' || ');
    return k + ' | ' + head + ' => text: ' + JSON.stringify(r.text).slice(0, 160); });
  out.err = window.kgptalkieErr || null; out.dlg = !!document.querySelector('.kgptalkieDlgBack');
  return JSON.stringify(out, null, 1);
})()
