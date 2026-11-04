(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
  const ed = window.kgptalkieTestEd, m = ed.getModel(), cs = () => m.executionContexts.content;
  const sc = ed.getContribution('editor.contrib.suggestController');
  const setCase = v => { const s = JSON.parse(localStorage.getItem('kgptalkieSettings') || '{}'); if (v) s.kwCase = v; else delete s.kwCase; localStorage.setItem('kgptalkieSettings', JSON.stringify(s)); };
  const lab = i => (typeof i.completion.label === 'string' ? i.completion.label : i.completion.label.label);
  for (const [mode, typed] of [['upper', 'sel'], ['lower', 'SEL'], ['auto', 'sel'], ['auto', 'Sel'], ['upper', 'slt'], ['upper', 'select * from customers c where c.']]) {
    setCase(mode);
    const x = cs()[cs().length - 1], r = { startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) };
    ed.executeEdits('kgptalkie-test', [{ range: r, text: typed }]);
    const ln = cs()[cs().length - 1].startLine; ed.setPosition({ lineNumber: ln, column: m.getLineMaxColumn(ln) }); ed.focus();
    sc.model.cancel && sc.model.cancel(); ed.trigger('kgptalkie', 'editor.action.triggerSuggest', {});
    let items = null;
    for (let n = 0; n < 30; n++) { await sleep(100); const cm = sc.model._completionModel; if (cm) { items = cm.items; if (items.length || n > 15) break; } }
    out[mode + ' "' + typed + '"'] = items ? items.slice(0, 6).map(i => lab(i) + (i.completion.kind === 17 ? '(kw)' : '') + (i.completion.insertText !== lab(i) ? '->' + i.completion.insertText : '')).join(', ') : 'no model';
  }
  sc.model.cancel && sc.model.cancel(); setCase(null);
  const x = cs()[cs().length - 1]; ed.executeEdits('kgptalkie-test', [{ range: { startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) }, text: '' }]);
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
