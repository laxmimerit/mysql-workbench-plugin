(async () => {
  const D = window.kgptalkieDocApi, sleep = ms => new Promise(r => setTimeout(r, ms)).then(() => window.kgptalkieTick()), out = {};
  let ed = null;
  const walk = (v, d) => { if (!v || d > 60 || ed) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) ed = c.editor; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const m = ed.getModel(), ctxs = () => m.executionContexts.content;
  const before = ctxs().length, text0 = m.getValue();
  const nb = `-- sqlnb v1 {"connection":"x","variables":{"minrev":"1000"}}
-- %% md
-- # Sales check
-- Revenue above a threshold.
-- %% sql {"view":"chart","chart":{"type":"bar","x":"region","y":["revenue"],"stacked":false,"horizontal":false}}
SELECT region, revenue FROM kgptalkie_test.sales WHERE revenue > {{minrev}};

-- %% ai
-- total orders per region
`;
  await D.importCells(ed, D.cellsFromSql(nb)); await sleep(300);
  const all = ctxs(); out.added = all.length - before;
  out.tail = all.slice(-4).map(x => x.language + ':' + m.getValueInRange({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }).slice(0, 60).replace(/\n/g, ' / '));
  // run the imported SQL cell: variable comes from the saved notebook values, chart view from the cell meta
  const k = all.length - 2; const j = window.kgptalkieActions.run(ed, k); await window.kgptalkieActions.done(j, 15000); ed.revealLineNearTop(all[k].startLine); await sleep(300); await sleep(300);
  const rt = all[k].presentation.renderTarget, rdat = all[k].presentation.resultData; out.res = rdat && (rdat.type === 'resultSets' ? rdat.sets[0].sql + ' -> ' + rdat.sets[0].data.rows.length + ' rows' : JSON.stringify(rdat).slice(0, 200)); out.ran = (rt.querySelector('.kgptalkieMeta') || {}).textContent; out.chartView = !!rt.querySelector('.kgptalkieChartBox svg'); out.dlg = !!document.querySelector('.kgptalkieDlgBack');
  out.hostHook = window.kgptalkieHostHooked;
  // undo the import in one step (the run is its own result, not text)
  await sleep(800); out.chartView2 = !!rt.querySelector('.kgptalkieChartBox svg'); m.undo(); await sleep(300); out.afterUndo = ctxs().length; out.textBack = m.getValue() === text0;
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
