(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
  const eds = []; const walk = (v, d) => { if (!v || d > 60) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) eds.push(c.editor); for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0); const ed = eds.find(e => e.getDomNode().offsetWidth) || eds[eds.length - 1];
  const A = window.kgptalkieActions, m = ed.getModel(), cs = () => m.executionContexts.content;
  // a scratch cell at the end, reused across runs
  let x = cs()[cs().length - 1];
  const txt = x => m.getValueInRange({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) });
  if (x.language === 'markdown' || !/^(-- comp|)$/.test(txt(x).split('\n')[0])) { await A.insertAt(ed, cs().length, 'mysql'); await sleep(300); x = cs()[cs().length - 1]; }
  const sc = ed.getContribution('editor.contrib.suggestController');
  const CASES = (window.kgptalkieCompCases || ['slt', 'SEL', 'sel', 'SELECT * FROM stdnt', 'SELECT * FROM STU', 'SELECT * FROM sls', 'SELECT * FROM kgptalkie_test.STD', 'SELECT * FROM students s WHERE s.', 'SELECT * FROM students AS st WHERE st.ct', 'grpcon', 'ifnl']);
  out.res = {};
  for (const c of CASES) {
    const r = { startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) };
    ed.executeEdits('kgptalkie-test', [{ range: r, text: c }]);
    const ln = cs()[cs().length - 1].startLine; ed.setPosition({ lineNumber: ln, column: m.getLineMaxColumn(ln) }); ed.focus();
    sc.model.cancel && sc.model.cancel();
    ed.trigger('kgptalkie', 'editor.action.triggerSuggest', {});
    let items = null;
    for (let n = 0; n < 30; n++) { await sleep(100); const cm = sc.model._completionModel; if (cm) { items = cm.items; if (items.length || n > 15) break; } }
    out.res[c] = items ? items.length + ': ' + items.slice(0, 8).map(i => (typeof i.completion.label === 'string' ? i.completion.label : i.completion.label.label)).join(', ') : 'no model';
  }
  sc.model.cancel && sc.model.cancel();
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
