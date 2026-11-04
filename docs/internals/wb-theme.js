(() => {
 /* KGP Talkie Workbench 26 recording theme v3 (2026-11-04): the approved look (wb-look.js v2) plus a Jupyter-style
    notebook (as in VS Code): each statement is a rounded cell box with an execution count [n] at its left,
    its result below on white, the focused cell outlined in blue. Safe to run again: it replaces itself. */
 const W = window;
 if (W.kgptalkieLook) clearInterval(W.kgptalkieLook); if (W.kgptalkieRaf) cancelAnimationFrame(W.kgptalkieRaf);
 if (W.kgptalkieTeardown) { try { W.kgptalkieTeardown(); } catch (e) { } }
 const NB = 24, SC = 24, CAP = 10, GAP = 18, GAP0 = 10, OUTPAD = 6, MW = 64, BX = 50, RIGHT = 18;
 const C = { bg: '#F7F7F7', bd: '#E3E3E3', focus: '#3B82C4', count: '#8A8A8A' };
 const css = `
#desktopWorkspaceTitlebar{display:none !important}
.resultStatus > .toolbar{display:none !important}
.resultStatus > .label{max-width:none !important;overflow:visible !important;color:#A3A3A3 !important;font-size:9px !important}
.resultStatus{background-color:#FDFDFD !important}
.scriptingConsole .editorPromptFirst::before,.scriptingConsole .editorPromptFirst::after,.scriptingConsole .statementStart::after{display:none !important}
.scriptingConsole .view-overlays .kgptalkieL{background:${C.bg};border-right:1px solid ${C.bd};box-sizing:border-box;width:calc(100% - ${RIGHT}px) !important}
.scriptingConsole .view-overlays .kgptalkieL.kgptalkieF{border-right-color:${C.focus}}
.scriptingConsole .kgptalkieM::after{content:'';position:absolute;left:${BX}px;right:0;top:0;bottom:0;background:${C.bg};border-left:1px solid ${C.bd}}
.scriptingConsole .kgptalkieM.kgptalkieF::after{border-left-color:${C.focus}}
.scriptingConsole .kgptalkieM.kgptalkieF::before{content:'';position:absolute;left:3px;width:3px;top:0;bottom:0;background:${C.focus};border-radius:2px}
.scriptingConsole .kgptalkieN::before{position:absolute;left:0;width:${BX - 8}px;text-align:right;font-family:var(--msg-monospace-font-family),Consolas,monospace;font-size:11px;color:${C.count};line-height:${NB}px}
.scriptingConsole .kgptalkieN0::before{content:'[ ]'}
.scriptingConsole .kgptalkieNR::before{content:'[*]';color:${C.focus}}
.kgptalkieCap{position:absolute;height:${CAP}px;background:${C.bg};border:0 solid ${C.bd};box-sizing:border-box}
.kgptalkieCap.t{bottom:0;border-top-width:1px}
.kgptalkieCap.b{top:0;border-bottom-width:1px}
.kgptalkieCap.c{left:0;right:${RIGHT}px;border-right-width:1px}
.kgptalkieCap.m{left:${BX}px;right:0;border-left-width:1px}
.kgptalkieCap.c.t{border-top-right-radius:6px}.kgptalkieCap.m.t{border-top-left-radius:6px}
.kgptalkieCap.c.b{border-bottom-right-radius:6px}.kgptalkieCap.m.b{border-bottom-left-radius:6px}
.kgptalkieCap.kgptalkieF{border-color:${C.focus}}
.kgptalkieBar{position:absolute;left:3px;width:3px;background:${C.focus};border-radius:2px;display:none}
.kgptalkieBar.kgptalkieF{display:block}
.kgptalkieBar.t{bottom:0;height:${CAP}px}.kgptalkieBar.b{top:0;height:${CAP}px}
.scriptingConsole .zoneHost .renderTarget{background:transparent !important}
.scriptingConsole .margin-view-zones .zoneMargin{background:transparent !important}
.scriptingConsole .margin-view-zones .zoneMargin::before{display:none !important}
.scriptingConsole .margin-view-zones .zoneMargin.kgptalkieF::before{display:block !important;left:3px !important;right:auto !important;width:3px !important;mask-image:none !important;background-color:${C.focus} !important;border-radius:2px}
.scriptingConsole .renderTarget > .divider.horizontal{display:none !important}
.scriptingConsole .tabContent,.scriptingConsole .outputHost{background:#fff !important}
.scriptingConsole .resultStatus{background:#fff !important}
.scriptingConsole .resultStatus > .label::before{content:'\\2713\\00a0\\00a0';color:#3A9A4F}
.scriptingConsole .actionOutput,.scriptingConsole .outputHost{overflow-x:hidden !important}
.scriptingConsole .actionRow{width:auto !important;min-width:0 !important;max-width:calc(100% - ${RIGHT}px)}
.scriptingConsole .resultText,.scriptingConsole .resultText span{white-space:pre-wrap !important;word-break:break-word;min-width:0}
.scriptingConsole .margin-view-overlays .statementError::after{display:none !important}
.scriptingConsole .resultText.error{color:#B42318 !important;background:#FEF3F2 !important;display:block;padding:4px 10px;border-radius:4px}
.scriptingConsole .tabulator{border:none !important;background:#fff !important}
.scriptingConsole .tabulator .tabulator-header{background:#fff !important;border-bottom:none !important}
.scriptingConsole .tabulator .tabulator-header .tabulator-col{background:#fff !important;border-right:none !important;border-bottom:1px solid #CFCFCF !important;color:#333 !important;font-weight:600}
.scriptingConsole .tabulator .tabulator-row{background:#fff !important;border-bottom:1px solid #EFEFEF !important}
.scriptingConsole .tabulator .tabulator-row.tabulator-row-even{background:#FAFAFA !important}
.scriptingConsole .tabulator .tabulator-row .tabulator-cell{border-right:none !important}
`;
 let st = document.getElementById('kgptalkieHideBar'); if (!st) { st = document.createElement('style'); st.id = 'kgptalkieHideBar'; document.head.appendChild(st); }
 st.textContent = css;
 let dyn = document.getElementById('kgptalkieDyn'); if (!dyn) { dyn = document.createElement('style'); dyn.id = 'kgptalkieDyn'; document.head.appendChild(dyn); }
 const numRules = new Set();
 const numClass = n => { if (!numRules.has(n)) { numRules.add(n); dyn.sheet.insertRule(`.scriptingConsole .kgptalkieN${n}::before{content:'[${n}]'}`, dyn.sheet.cssRules.length); } return 'kgptalkieN' + n; };
 const R = W.kgptalkieRun || (W.kgptalkieRun = { n: 0, seen: new WeakMap(), num: new WeakMap() });
 let list = [];
 const isNB = ed => { const d = ed.getDomNode(); return d && d.classList.contains('scriptingConsole'); };

 const find = () => {
  const root = [...document.querySelectorAll('*')].find(e => e.__k); const out = [];
  const walk = v => { if (!v) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function') out.push(c.editor); (v.__k || []).forEach(walk); };
  if (root) walk(root.__k); list = out;
  for (const ed of list) {
   const dom = ed.getDomNode(); if (!dom) continue; const nb = isNB(ed);
   if (ed.getRawOptions().lineHeight !== (nb ? NB : SC)) {
    const o = { lineHeight: nb ? NB : SC, padding: { top: nb ? 0 : 14, bottom: 14 }, quickSuggestions: false, suggestOnTriggerCharacters: false, wordBasedSuggestions: 'off' };
    if (nb) Object.assign(o, { lineNumbers: 'off', lineDecorationsWidth: MW, glyphMargin: false, folding: false, renderLineHighlight: 'none' });
    ed.updateOptions(o);
   }
   if (!dom.kgptalkie) { dom.kgptalkie = 1; dom.addEventListener('wheel', e => { if (!e.target.closest('.view-zones')) return; const th = e.target.closest('.tabulator-tableholder'); if (th && th.scrollHeight > th.clientHeight + 1) return; ed.setScrollTop(ed.getScrollTop() + e.deltaY); e.preventDefault(); }, { capture: true, passive: false }); }
  }
 };

 const cap = (cls, withBar) => { const z = document.createElement('div'); const p = document.createElement('div'); p.className = 'kgptalkieCap ' + cls; z.appendChild(p); let b = null; if (withBar) { b = document.createElement('div'); b.className = 'kgptalkieBar ' + cls.split(' ')[1]; z.appendChild(b); } return { z, parts: b ? [p, b] : [p] }; };

 const paint = ed => {
  const m = ed.getModel(); const arr = (m && m.executionContexts && m.executionContexts.content) || []; if (!arr.length) return;
  const S = ed.kgptalkieNB || (ed.kgptalkieNB = { zones: [], decos: [], sig: '', dsig: '', caps: [] });
  const cells = arr.map(x => ({ s: x.startLine, e: x.endLine, p: x.presentation, x }));
  const sig = cells.map(c => c.s + '-' + c.e).join(',');
  if (sig !== S.sig) {
   ed.changeViewZones(a => {
    S.zones.forEach(id => a.removeZone(id)); S.zones = []; S.caps = [];
    cells.forEach((c, i) => {
     const tc = cap('c t'), tm = cap('m t', true), bc = cap('c b'), bm = cap('m b', true);
     S.zones.push(a.addZone({ afterLineNumber: c.s - 1, ordinal: 1e9, heightInPx: (i ? GAP : GAP0) + CAP, domNode: tc.z, marginDomNode: tm.z, suppressMouseDown: true }));
     S.zones.push(a.addZone({ afterLineNumber: c.e, ordinal: 0, heightInPx: CAP, domNode: bc.z, marginDomNode: bm.z, suppressMouseDown: true }));
     S.caps.push([...tc.parts, ...tm.parts, ...bc.parts, ...bm.parts]);
    });
   });
   S.sig = sig; S.dsig = '';
  }
  for (const c of cells) { const p = c.p; if (p && p.resultData && R.seen.get(c.x) !== p.resultData) { R.seen.set(c.x, p.resultData); R.num.set(c.x, ++R.n); } }
  const pos = ed.getPosition(); const fi = cells.findIndex(c => pos && pos.lineNumber >= c.s && pos.lineNumber <= c.e);
  const lab = cells.map(c => (c.p && c.p.loadingState && c.p.loadingState !== 'idle') ? 'R' : (R.num.get(c.x) || 0));
  const dsig = sig + '|' + fi + '|' + lab.join(',');
  if (dsig === S.dsig) return; S.dsig = dsig;
  const decos = [];
  cells.forEach((c, i) => {
   const f = i === fi ? ' kgptalkieF' : '';
   for (let ln = c.s; ln <= c.e; ln++) decos.push({ range: { startLineNumber: ln, startColumn: 1, endLineNumber: ln, endColumn: 1 }, options: { isWholeLine: true, className: 'kgptalkieL' + f, linesDecorationsClassName: 'kgptalkieM' + f } });
   const k = lab[i]; decos.push({ range: { startLineNumber: c.s, startColumn: 1, endLineNumber: c.s, endColumn: 1 }, options: { isWholeLine: true, linesDecorationsClassName: 'kgptalkieN ' + (k === 'R' ? 'kgptalkieNR' : k ? numClass(k) : 'kgptalkieN0') } });
   (S.caps[i] || []).forEach(el => el.classList.toggle('kgptalkieF', !!f));
   const zid = c.p && c.p.zoneInfo && c.p.zoneInfo.zoneId;
   if (zid) { const zm = ed.getDomNode().querySelector(`.zoneMargin[monaco-view-zone="${zid}"]`); if (zm) zm.classList.toggle('kgptalkieF', !!f); }
  });
  S.decos = ed.deltaDecorations(S.decos, decos);
 };

 const fit = ed => {
  const m = ed.getModel(); const arr = (m && m.executionContexts && m.executionContexts.content) || []; const nb = isNB(ed);
  for (const x of arr) {
   const p = x.presentation; if (!p || !p.renderTarget || !p.zoneInfo || !p.resultData) continue; const rt = p.renderTarget; let box;
   if (p.resultData.type === 'resultSets') {
    const t = rt.querySelector('.tabulator-table'), hd = rt.querySelector('.tabulator-header'), sb = rt.querySelector('.resultStatus');
    box = (t && hd && t.offsetHeight) ? Math.min(352, Math.ceil(hd.offsetHeight + t.offsetHeight + (sb ? sb.offsetHeight : 0) + 10)) : 64;
   } else if (nb) {
    const ao = rt.querySelector('.actionOutput') || rt.querySelector('.outputHost'); if (!ao) continue;
    box = Math.min(600, Math.ceil([...ao.children].reduce((s, c) => s + c.offsetHeight, 0) + 10));
   } else continue;
   const pad = nb ? OUTPAD : 0, want = box + pad + (nb ? 0 : 22);
   if (Math.abs(p.zoneInfo.zone.heightInPx - want) < 2 && rt.style.height === box + 'px') continue;
   p.currentHeight = box; p.manuallyResized = true; p.zoneInfo.zone.heightInPx = want; rt.style.height = box + 'px'; rt.style.marginTop = pad + 'px';
   p.backend.changeViewZones(a => a.layoutZone(p.zoneInfo.zoneId));
  }
 };

 const loop = () => { for (const ed of list) { try { fit(ed); if (isNB(ed)) paint(ed); } catch (e) { W.kgptalkieErr = String(e && e.stack || e); } } W.kgptalkieRaf = requestAnimationFrame(loop); };
 W.kgptalkieTeardown = () => { for (const ed of list) { const S = ed.kgptalkieNB; if (!S) continue; try { ed.changeViewZones(a => S.zones.forEach(id => a.removeZone(id))); ed.deltaDecorations(S.decos, []); } catch (e) { } ed.kgptalkieNB = null; } };
 find(); loop(); W.kgptalkieLook = setInterval(find, 500); return 'theme v3 on';
})()
