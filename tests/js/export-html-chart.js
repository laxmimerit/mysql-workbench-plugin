(async () => {
  const D = window.kgptalkieDocApi, sleep = ms => new Promise(r => setTimeout(r, ms));
  let ed = null;
  const walk = (v, d) => { if (!v || d > 60 || ed) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) ed = c.editor; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const cs = ed.getModel().executionContexts.content;
  const x = cs.find(c => c.presentation && c.presentation.resultData && c.presentation.resultData.type === 'resultSets' && (c.presentation.resultData.sets[0].sql || '').includes('kgptalkie_test.sales'));
  if (x) { ed.revealLineNearTop(x.startLine); window.kgptalkieTick(); await sleep(50); window.kgptalkieTick(); const b = x.presentation.renderTarget.querySelector('[data-r=chart]'); if (b) b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 })); window.kgptalkieTick(); }
  const split = D.splitSql("SELECT 'a;b' AS x; -- why\nSELECT 2; # hash\nSELECT 3;");
  const html = D.toHtml(D.nbDoc(ed, 500));
  return JSON.stringify({ split, chartInHtml: (html.match(/<svg/g) || []).length, html });
})()
