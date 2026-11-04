(async () => {
  const D = window.kgptalkieDocApi, out = {};
  let ed = null;
  const walk = (v, d) => { if (!v || d > 60 || ed) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) ed = c.editor; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const doc = D.nbDoc(ed, 3);
  out.cells = doc.cells.map(c => c.kind + ':' + c.text.slice(0, 40).replace(/\n/g, ' ') + (c.outs ? ' | ' + c.outs.map(o => o.kind + (o.kind === 'table' ? `(${o.rows.length}/${o.total}${o.chart ? ',chart' : ''})` : ':' + o.text.slice(0, 40))).join(', ') : '') + (c.ai ? ' | ai:' + c.ai.title : ''));
  window.__kgptalkieHtml = D.toHtml(doc); window.__kgptalkieMd = D.toMarkdown(doc); window.__kgptalkieNb = D.toSqlnb(ed);
  out.htmlLen = window.__kgptalkieHtml.length; out.mdHead = window.__kgptalkieMd.slice(0, 600); out.sqlnb = window.__kgptalkieNb.slice(0, 900);
  const rt = D.parseSqlnb(window.__kgptalkieNb); out.roundTrip = rt.cells.length + ' cells; same text: ' + rt.cells.every((c, k) => c.text === doc.cells[k].text.replace(/\s+$/, '') && c.kind === doc.cells[k].kind) + '; meta ' + JSON.stringify(rt.meta);
  out.split = D.splitSql(`-- top comment\nSELECT 1;\nSELECT 'a;b' AS x; -- trailing\n/* block ; */\nUPDATE t SET a=1 WHERE id=2;\n\nDELIMITER $$\nCREATE PROCEDURE p()\nBEGIN\n  SELECT 1;\n  SELECT 2;\nEND$$\nDELIMITER ;\nSELECT "x""y";\n-- end note`);
  out.oldExt = D.cellsFromSql('/*markdown\n# Title\nSome text\n*/\nSELECT 1;\n\nSELECT 2;').cells.map(c => c.kind + ':' + c.text);
  out.hl = D.hlSql("SELECT name, 'it''s' -- note\nFROM t WHERE id = 42");
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
