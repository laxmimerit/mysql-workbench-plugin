(async () => {
  const T = window.kgptalkieTreeApi, sleep = ms => new Promise(r => setTimeout(r, ms)).then(() => window.kgptalkieTick()), out = {};
  window.kgptalkieTick(); await sleep(1100);
  const menus = T.treeMenus(); out.menus = menus.map(m => m.props.id + (m.kgptalkieSer0 ? ' hooked' : ''));
  let sb = null; const walk = (v, d) => { if (!v || d > 90 || sb) return; const c = v.__c; if (c && c.cdmTypeToMenuRefMap) sb = c; for (const k of v.__k || []) walk(k, d + 1); };
  walk(document.getElementById('root').__k, 0);
  const conn = sb.props.activeWorkspaceConnection, sch = conn.schemaEntries.find(s => s.caption === 'kgptalkie_test');
  if (!sch.tables.members.length && sch.tables.getChildren) { try { await sch.tables.getChildren(); } catch (e) { out.gc = String(e); } }
  if (!sch.tables.members.length && sch.tables.refresh) { try { await sch.tables.refresh(); } catch (e) { out.rf = String(e); } }
  const tb = sch.tables.members.find(t => t.caption === 'sales') || sch.tables.members[0];
  out.table = tb && tb.caption; out.parents = []; for (let p = tb && tb.parent; p; p = p.parent) out.parents.push(p.type + ':' + p.caption);
  const tm = menus.find(m => m.props.id === 'tableContextMenu');
  const map = new Map(); const items = tm.serializeNativeMenuItems(tm.props.children, { dataModelEntry: tb }, map);
  out.items = items.map(i => (i.type === 'separator' ? '---' : i.label + (i.enabled === false ? ' (disabled)' : '') + (i.submenu ? ' >' : '')));
  // pick our Describe item through the same path the native menu uses
  const id = items.find(i => i.label === 'Describe in Notebook').id;
  tm.handleNativeMenuSelection(map.get(id), { dataModelEntry: tb });
  let ed = null; const w2 = (v, d) => { if (!v || d > 60 || ed) return; const c = v.__c; if (c && c.editor && typeof c.editor.updateOptions === 'function' && c.editor.getDomNode().closest('.scriptingConsole')) ed = c.editor; for (const k of v.__k || []) w2(k, d + 1); };
  w2(document.getElementById('root').__k, 0);
  const m = ed.getModel(), cs = () => m.executionContexts.content;
  for (let n = 0; n < 50; n++) { const x = cs()[cs().length - 1]; const rd2 = x.presentation && x.presentation.resultData; if (rd2 && rd2.type === 'resultSets') break; await sleep(150); }
  const x = cs()[cs().length - 1], rs = x.presentation.resultData;
  out.cell = m.getValueInRange({ startLineNumber: x.startLine, startColumn: 1, endLineNumber: x.endLine, endColumn: m.getLineMaxColumn(x.endLine) });
  out.result = rs && rs.type === 'resultSets' ? rs.sets[0].columns.map(c => c.title).join(',') + ' / ' + rs.sets[0].data.rows.length + ' rows' : JSON.stringify(rs).slice(0, 200);
  // the Top 100 item makes a new cell (the last one is no longer empty)
  const id2 = items.find(i => i.label === 'Select Top 100 in Notebook').id; tm.handleNativeMenuSelection(map.get(id2), { dataModelEntry: tb });
  await sleep(1500); const y = cs()[cs().length - 1];
  out.cell2 = m.getValueInRange({ startLineNumber: y.startLine, startColumn: 1, endLineNumber: y.endLine, endColumn: m.getLineMaxColumn(y.endLine) });
  out.err = window.kgptalkieErr || null;
  return JSON.stringify(out, null, 1);
})()
