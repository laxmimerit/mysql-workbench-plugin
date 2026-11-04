(() => {
 const root = [...document.querySelectorAll('*')].find(e => e.__k); const eds = [];
 const walk = v => { if (!v) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function') eds.push(c.editor); (v.__k || []).forEach(walk); }; walk(root.__k);
 const ed = eds.find(e => e.getDomNode() && e.getDomNode().classList.contains('scriptingConsole'));
 if (!ed) return 'no notebook editor; editors: ' + eds.length;
 const m = ed.getModel(); const ec = m.executionContexts; const out = { lines: m.getLineCount(), ecKeys: Object.keys(ec || {}), ctx: [] };
 const own = o => { const r = []; for (const k in o) { try { const v = o[k]; r.push(k + ':' + (v === null ? 'null' : typeof v === 'object' ? (Array.isArray(v) ? 'arr' + v.length : 'obj') : typeof v === 'function' ? 'fn' : String(v).slice(0, 40))); } catch (e) { r.push(k + ':?'); } } return r.join(' '); };
 const protoFns = o => { const s = new Set(); let p = Object.getPrototypeOf(o); while (p && p !== Object.prototype) { Object.getOwnPropertyNames(p).forEach(n => s.add(n)); p = Object.getPrototypeOf(p); } return [...s].join(' '); };
 for (const x of ec.content) { const p = x.presentation; out.ctx.push({ ctx: own(x), ctxProto: protoFns(x).slice(0, 900), pres: p ? own(p) : null, presProto: p ? protoFns(p).slice(0, 900) : null, start: x.startLine, end: x.endLine, rt: p && p.renderTarget ? p.renderTarget.className + ' children:' + [...p.renderTarget.children].map(c => c.className).join('|') : null }); }
 const dom = ed.getDomNode(); out.marginClasses = [...new Set([...dom.querySelectorAll('.margin-view-overlays > div > div')].map(e => e.className))].slice(0, 20);
 out.zoneClasses = [...dom.querySelectorAll('.view-zones > div')].map(e => e.className + ' h' + e.offsetHeight + ' top' + e.style.top).slice(0, 20);
 out.marginZones = [...dom.querySelectorAll('.margin-view-zones > div')].map(e => e.className + ' h' + e.offsetHeight).slice(0, 20);
 out.opts = { lineNumbers: ed.getOption ? String(ed.getRawOptions().lineNumbers) : '', glyph: ed.getRawOptions().glyphMargin, lineDecos: ed.getRawOptions().lineDecorationsWidth, font: ed.getRawOptions().fontFamily, fs: ed.getRawOptions().fontSize };
 out.decoClasses = [...new Set(m.getAllDecorations().map(d => [d.options.className, d.options.linesDecorationsClassName, d.options.marginClassName, d.options.glyphMarginClassName, d.options.isWholeLine].join('/')))];
 return JSON.stringify(out, null, 1);
})()
