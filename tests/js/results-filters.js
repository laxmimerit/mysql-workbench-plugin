(async () => {
  const A = window.kgptalkieActions, sleep = ms => new Promise(r => setTimeout(r, ms));
  let ed = null;
  const walk = (v, d) => { if (!v || d > 60 || ed) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) ed = c.editor; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const m = ed.getModel(), ctxs = () => m.executionContexts.content;
  const run = window.kgptalkieAi.sqlRun;
  await run(ed, 'CREATE TABLE IF NOT EXISTS kgptalkie_test.sales (id INT PRIMARY KEY, month DATE, region VARCHAR(20), revenue INT, orders INT, note TEXT)');
  await run(ed, 'DELETE FROM kgptalkie_test.sales');
  await run(ed, `INSERT INTO kgptalkie_test.sales VALUES (1,'2026-01-01','North',1200,10,NULL),(2,'2026-02-01','North',1500,12,'{"promo":true,"code":"WINTER"}'),(3,'2026-03-01','South',900,8,'a | pipe'),(4,'2026-04-01','South',2100,19,'multi\nline'),(5,'2026-05-01','East',1750,15,'quote "x", comma')`);
  await A.addBelow(ed, ctxs().length - 1, 'mysql'); const k = ctxs().length - 1; const x = ctxs()[k];
  ed.executeEdits('t', [{ range: { startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }, text: 'SELECT month, region, revenue, orders, note FROM kgptalkie_test.sales ORDER BY month' }]);
  const j = A.run(ed, k); await A.done(j, 20000);
  // a hidden window does not scroll or paint by itself, and Monaco keeps result zones below the fold hidden
  ed.setScrollTop(ed.getTopForLineNumber(x.startLine) - 20); ed.render(true); await sleep(200); window.kgptalkieTick();
  // the table view (results-chart, run earlier on the same SQL, may have left this result in chart view)
  for (let n = 0; n < 30 && !x.presentation.renderTarget.querySelector('.kgptalkieResBar'); n++) { await sleep(200); window.kgptalkieTick(); }
  if (x.presentation.renderTarget.classList.contains('kgptalkieChartView')) { x.presentation.renderTarget.querySelector('.kgptalkieResBar [data-r=table]').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); await sleep(200); window.kgptalkieTick(); }
  for (let n = 0; n < 30 && !x.presentation.renderTarget.querySelector('.kgptalkieResBar'); n++) await sleep(200);
  const rt = x.presentation.renderTarget, out = {};
  out.bar = [...rt.querySelectorAll('.kgptalkieResBar button')].map(b => b.dataset.r).join(',');
  out.meta = rt.querySelector('.kgptalkieMeta').textContent;
  // search
  const inp = rt.querySelector('.kgptalkieSearch'); inp.value = 'south'; inp.dispatchEvent(new Event('input'));
  await sleep(300); out.searchMeta = rt.querySelector('.kgptalkieMeta').textContent || '(loop not run)';
  // grab the tabulator through the same path the plugin uses
  let t = null; const w2 = v => { if (!v || t) return; const c = v.__c; if (c && c.tabulator && c.tabulator.element && c.tabulator.element.offsetWidth) t = c.tabulator; (v.__k || []).forEach(w2); }; w2(rt.__k);
  out.activeAfterSearch = t.getDataCount('active');
  inp.value = ''; inp.dispatchEvent(new Event('input'));
  // column filters through the button
  const fire = (el) => el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
  fire(rt.querySelector('[data-r=filter]')); await sleep(300); window.kgptalkieTick(); await sleep(100);
  const fr = rt.querySelector('.kgptalkieFRow'); out.filterRow = fr ? [...fr.querySelectorAll('input')].map(i => i.placeholder).join(' / ') : null;
  if (fr) { const rev = fr.querySelector('input[data-f="2"]'); rev.value = '1000..1800'; rev.dispatchEvent(new Event('input', { bubbles: true })); await sleep(200); out.range = t.getDataCount('active');
    rev.value = '>1500'; rev.dispatchEvent(new Event('input', { bubbles: true })); await sleep(200); out.gt = t.getDataCount('active');
    rev.value = ''; rev.dispatchEvent(new Event('input', { bubbles: true }));
    const note = fr.querySelector('input[data-f="4"]'); note.value = 'null'; note.dispatchEvent(new Event('input', { bubbles: true })); await sleep(200); out.isnull = t.getDataCount('active');
    note.value = '!pipe'; note.dispatchEvent(new Event('input', { bubbles: true })); await sleep(200); out.notpipe = t.getDataCount('active');
    note.value = ''; note.dispatchEvent(new Event('input', { bubbles: true })); await sleep(200); }
  // copy formats (what the menu copies)
  const cols = t.getColumns().filter(c => c.getField() !== undefined && c.isVisible());
  const d = { head: cols.map(c => c.getDefinition().title), rows: t.getData('active').map(r => cols.map(c => r[c.getField()])) };
  out.types = d.rows[0].map(v => v === null ? 'null' : typeof v);
  out.noteValues = d.rows.map(r => r[4]);
  // chart
  fire(rt.querySelector('[data-r=chart]')); await sleep(600);
  const cb = rt.querySelector('.kgptalkieChartBox'); out.chart = cb ? { ctl: [...cb.querySelectorAll('[data-c=type]')].map(b => b.dataset.v + (b.classList.contains('on') ? '*' : '')).join(','), y: (cb.querySelector('.kgptalkieYBtn') || {}).textContent, rects: cb.querySelectorAll('svg rect').length, paths: cb.querySelectorAll('svg path').length, svgW: cb.querySelector('svg') && cb.querySelector('svg').getAttribute('width') } : 'no chart box';
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
