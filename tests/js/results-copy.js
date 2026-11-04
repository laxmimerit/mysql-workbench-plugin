(async () => {
  let rev = () => {}; const sleep = ms => new Promise(r => setTimeout(r, ms)).then(() => { rev(); window.kgptalkieTick(); }), R = window.kgptalkieResApi;
  let ed = null;
  const walk = (v, d) => { if (!v || d > 60 || ed) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) ed = c.editor; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const m = ed.getModel(), ctxs = () => m.executionContexts.content;
  const x = ctxs()[ctxs().length - 1], rt = x.presentation.renderTarget, out = {}; rev = () => ed.revealLineNearTop(x.startLine); rev(); window.kgptalkieTick();
  const fire = el => el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
  fire(rt.querySelector('[data-r=table]')); await sleep(300);
  if (!rt.querySelector('[data-r=filter]').classList.contains('on')) fire(rt.querySelector('[data-r=filter]')); for (let n = 0; n < 20 && !rt.querySelector('.kgptalkieFRow'); n++) await sleep(150);
  rev(); for (let n = 0; n < 20 && !R.tabOf(rt); n++) await sleep(150); const t = R.tabOf(rt); out.tabW = rt.offsetWidth; const fr = rt.querySelector('.kgptalkieFRow');
  out.filterRow = fr ? [...fr.querySelectorAll('input')].map(i => i.dataset.f + ':' + i.placeholder) : null;
  const setF = async (f, v) => { const i = fr.querySelector(`input[data-f="${f}"]`); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); await sleep(120); return t.getDataCount('active'); };
  if (fr) { out.f = { range: await setF('2', '1000..1800'), gt: await setF('2', '>1500'), ne: await setF('2', '!=900'), none: await setF('2', ''), isnull: await setF('4', 'null'), notnull: await setF('4', 'not null'), notpipe: await setF('4', '!pipe'), contains: await setF('4', 'WINTER'), region: (await setF('4', ''), await setF('1', 'north')) }; await setF('1', ''); }
  const d = R.visible(t);
  out.tsv = R.FMT.tsv(d).split('\n').slice(0, 6);
  out.csv = R.FMT.csv(d).split('\n');
  out.md = R.FMT.md(d).split('\n').slice(0, 4);
  out.json = R.FMT.json(d).slice(0, 160);
  // value viewer: double-click a JSON cell
  const row = t.getRows()[1], cell = row.getCell('4');
  cell.getElement().dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
  await sleep(300);
  const vw = rt.querySelector('.kgptalkieViewer'); out.viewer = vw ? { head: vw.querySelector('.kgptalkieViewerH').textContent, body: vw.querySelector('pre').textContent } : null;
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
