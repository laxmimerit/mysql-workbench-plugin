(async () => {
  const A = window.kgptalkieActions, RA = window.kgptalkieRunApi, sleep = ms => new Promise(r => setTimeout(r, ms)).then(() => window.kgptalkieTick());
  let ed = null;
  const walk = (v, d) => { if (!v || d > 60 || ed) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) ed = c.editor; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const m = ed.getModel(), ctxs = () => m.executionContexts.content, out = {};
  window.kgptalkieTick(); await sleep(1100); // hook pass
  out.hooked = RA.workspaces().map(w => !!w.sqlQueryExecutor.kgptalkieRun0);
  out.cls = ['DROP TABLE t', 'drop  database x', 'TRUNCATE t', 'DELETE FROM t', 'DELETE FROM t WHERE id=1', 'UPDATE t SET a=1 -- WHERE x', "UPDATE t SET a='WHERE' ", 'UPDATE t SET a=1 /* c */ WHERE id=2', 'SELECT 1', 'SELECT a INTO @x FROM t', '/* hi */ insert into t values (1)']
    .map(s => { const c = RA.classify(s); return s + ' => ' + (c.write ? 'W' : '-') + (c.risk ? ' ' + c.risk : ''); });
  // a scratch cell at the end
  await A.addBelow(ed, ctxs().length - 1, 'mysql'); const k = ctxs().length - 1;
  const setText = t => { const x = ctxs()[k]; ed.executeEdits('t', [{ range: { startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }, text: t }]); };
  const outText = () => { const rt = ctxs()[k].presentation.renderTarget; if (!rt) return null; const t = window.kgptalkieResApi.tabOf(rt); if (t) return 'rows=' + t.getDataCount() + ' ' + JSON.stringify(t.getData().slice(0, 3)); const e = rt.querySelector('.resultText'); return e ? e.textContent.trim().slice(0, 160) : rt.textContent.trim().slice(0, 160); };
  const dialog = async () => { for (let n = 0; n < 40; n++) { const d = document.querySelector('.kgptalkieDlgBack'); if (d) return d; await sleep(100); } return null; };
  const press = (d, sel) => d.querySelector(sel).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  const runWith = async (text, answer) => {
    setText(text); const j = A.run(ed, k); const res = { dlg: null };
    if (answer) { const d = await dialog(); res.dlg = d ? d.querySelector('.kgptalkieDlgT').textContent + ' | ' + (d.querySelector('p') || d.querySelector('.kgptalkieDlgHint') || {}).textContent : 'no dialog'; if (d) await answer(d); }
    await A.done(j, 15000); await sleep(200); res.out = outText(); return res;
  };
  // variables: prompt
  out.varPrompt = await runWith("SELECT region, revenue FROM kgptalkie_test.sales WHERE region = '{{reg}}' ORDER BY id", async d => { d.querySelector('input').value = 'North'; press(d, '[data-b=ok]'); });
  out.varReuse = await runWith("SELECT COUNT(*) AS n FROM kgptalkie_test.sales WHERE region = '{{reg}}'");
  out.varCancel = await runWith("SELECT '{{other}}' AS v", async d => press(d, '[data-b=cancel]'));
  out.env = await runWith("SELECT '{{env.PROCESSOR_ARCHITECTURE}}' AS arch");
  // safety: confirm on every connection
  localStorage.setItem('kgptalkieSettings', JSON.stringify({ confirm: 'always' }));
  await window.kgptalkieAi.sqlRun(ed, 'DROP TABLE IF EXISTS kgptalkie_test.sales_copy'); await window.kgptalkieAi.sqlRun(ed, 'CREATE TABLE kgptalkie_test.sales_copy AS SELECT * FROM kgptalkie_test.sales');
  out.delCancel = await runWith('DELETE FROM kgptalkie_test.sales_copy', async d => press(d, '[data-b=Cancel]'));
  out.countAfterCancel = (await window.kgptalkieAi.sqlRun(ed, 'SELECT COUNT(*) FROM kgptalkie_test.sales_copy')).rows[0][0];
  out.delRun = await runWith('DELETE FROM kgptalkie_test.sales_copy', async d => press(d, '[data-b=Run]'));
  out.countAfterRun = (await window.kgptalkieAi.sqlRun(ed, 'SELECT COUNT(*) FROM kgptalkie_test.sales_copy')).rows[0][0];
  out.safeDelete = await runWith('DELETE FROM kgptalkie_test.sales_copy WHERE id = 99');
  // production default mode, untagged connection: no prompt
  localStorage.setItem('kgptalkieSettings', JSON.stringify({}));
  out.prodModeUntagged = await runWith('TRUNCATE kgptalkie_test.sales_copy');
  // read-only tag
  const cap = RA.workspaces()[0].props.connection.details.caption;
  localStorage.setItem('kgptalkieConn:' + cap, JSON.stringify({ env: 'production', readOnly: true }));
  out.readOnly = await runWith('INSERT INTO kgptalkie_test.sales_copy SELECT * FROM kgptalkie_test.sales');
  out.readOnlySelect = await runWith('SELECT COUNT(*) AS n FROM kgptalkie_test.sales');
  window.kgptalkieTick(); await sleep(1100); out.tagChip = (document.querySelector('.kgptalkieNbBar .kgptalkieTag') || {}).textContent;
  localStorage.removeItem('kgptalkieConn:' + cap);
  // timeout
  localStorage.setItem('kgptalkieSettings', JSON.stringify({ timeout: 2 }));
  const t0 = Date.now(); out.timeout = await runWith('SELECT SLEEP(6) AS s'); out.timeoutMs = Date.now() - t0;
  localStorage.removeItem('kgptalkieSettings');
  out.text = ctxs()[k].presentation.renderTarget.textContent.slice(0, 300);
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
