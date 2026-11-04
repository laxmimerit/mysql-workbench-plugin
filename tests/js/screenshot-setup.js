(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)).then(() => window.kgptalkieTick());
  const ed = window.kgptalkieTestEd, m = ed.getModel(), cs = () => m.executionContexts.content;
  // fold the side panel for a wider notebook
  const h = document.getElementById('pane0Host'); if (h && h.getBoundingClientRect().width > 40) document.getElementById('desktopWorkspaceSidebarToggle').click();
  const bar = ed.getDomNode().closest('.editorHost').parentElement.querySelector(':scope > .kgptalkieNbBar');
  bar.querySelector('[data-a=start]').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  await sleep(200); const dl = document.querySelector('.kgptalkieDlgBack');
  dl.querySelector('[data-f=sample]').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  for (let n = 0; n < 40 && cs().length < 10; n++) await sleep(150);
  window.kgptalkieRunLog = 'running'; window.kgptalkieActions.runAll(ed).then(() => { window.kgptalkieRunLog = 'done'; }, e => { window.kgptalkieRunLog = 'err ' + e; });
  return cs().length;
})()
