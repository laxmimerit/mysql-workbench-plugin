(async () => {
  let rev = () => {}; const sleep = ms => new Promise(r => setTimeout(r, ms)).then(() => { rev(); window.kgptalkieTick(); }), R = window.kgptalkieResApi;
  let ed = null;
  const walk = (v, d) => { if (!v || d > 60 || ed) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) ed = c.editor; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const cs = ed.getModel().executionContexts.content, x = cs[cs.length - 1], rt = x.presentation.renderTarget, out = {};
  rev = () => ed.revealLineNearTop(x.startLine); await sleep(50);
  const fire = el => el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
  rt.querySelectorAll('.kgptalkieViewer').forEach(v => v.remove());
  if (rt.querySelector('[data-r=filter]').classList.contains('on')) fire(rt.querySelector('[data-r=filter]'));
  for (let n = 0; n < 20 && !R.tabOf(rt); n++) await sleep(150); let t = R.tabOf(rt);
  await sleep(100);
  out.pins = rt.querySelectorAll('.kgptalkiePin').length;
  fire(rt.querySelector('.tabulator-col[tabulator-field="1"] .kgptalkiePin')); await sleep(200); t = R.tabOf(rt);
  out.frozen = t.getColumn('1').getDefinition().frozen; out.pinOn = !!rt.querySelector('.tabulator-col[tabulator-field="1"] .kgptalkiePin.on');
  fire(rt.querySelector('.tabulator-col[tabulator-field="1"] .kgptalkiePin')); await sleep(200); t = R.tabOf(rt); out.unfrozen = !t.getColumn('1').getDefinition().frozen;
  const h0 = rt.getBoundingClientRect().height; fire(rt.querySelector('[data-r=expand]')); await sleep(300); const h1 = rt.getBoundingClientRect().height; fire(rt.querySelector('[data-r=expand]')); await sleep(300);
  out.expand = [Math.round(h0), Math.round(h1), Math.round(rt.getBoundingClientRect().height)];
  fire(rt.querySelector('[data-r=chart]')); for (let n = 0; n < 20 && !rt.querySelector('.kgptalkieChartBox svg'); n++) await sleep(150);
  const box = () => rt.querySelector('.kgptalkieChartBox'), cnt = () => { const s = box().querySelector('svg'); return s ? { rect: s.querySelectorAll('rect').length, path: s.querySelectorAll('path').length, circle: s.querySelectorAll('circle').length, text: s.querySelectorAll('text').length } : box().textContent.slice(0, 80); };
  out.types = {};
  for (const ty of ['bar', 'line', 'area', 'scatter', 'pie']) { const b = box().querySelector(`[data-c=type][data-v=${ty}]`); if (!b) { out.types[ty] = 'no button'; continue; } fire(b); await sleep(250); out.types[ty] = cnt(); }
  fire(box().querySelector('[data-c=type][data-v=bar]')); await sleep(250);
  fire(box().querySelector('[data-c=stack]')); await sleep(250); out.stacked = cnt();
  fire(box().querySelector('[data-c=horiz]')); await sleep(250); out.horiz = cnt();
  fire(box().querySelector('[data-c=horiz]')); await sleep(150); fire(box().querySelector('[data-c=stack]')); await sleep(150);
  fire(box().querySelector('[data-c=ymenu]')); await sleep(100);
  out.ymenu = [...document.querySelectorAll('.kgptalkieMenu .it')].map(i => i.textContent.trim());
  const it = [...document.querySelectorAll('.kgptalkieMenu .it')].find(i => /orders/.test(i.textContent)); if (it) it.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); await sleep(250);
  out.yAfter = box().querySelector('.kgptalkieYBtn').textContent.trim();
  const it2 = (fire(box().querySelector('[data-c=ymenu]')), await sleep(100), [...document.querySelectorAll('.kgptalkieMenu .it')].find(i => /orders/.test(i.textContent))); if (it2) it2.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); await sleep(250);
  out.yBack = box().querySelector('.kgptalkieYBtn').textContent.trim();
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
