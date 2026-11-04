/* Screenshot of a page that is never painted (hidden test window): the live DOM and its same-origin styles are
   drawn into an SVG foreignObject and rasterised on a canvas, inside the page. Fonts and images used by the styles
   are inlined as data URLs. Canvas elements (Monaco minimap) come out blank. Returns a PNG data URL. */
(async () => {
 const W = innerWidth, H = innerHeight, SCALE = 2;
 const toData = async u => { try { const r = await fetch(u); const b = await r.blob(); return await new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(b); }); } catch (e) { return u; } };
 const cache = new Map(); const inl = async u => { if (u.startsWith('data:')) return u; if (!cache.has(u)) cache.set(u, await toData(u)); return cache.get(u); };
 let css = '';
 for (const sh of document.styleSheets) {
  let rules; try { rules = sh.cssRules; } catch (e) { continue; }
  const base = sh.href || location.href;
  for (const r of rules) {
   let t = r.cssText; const urls = [...t.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]);
   for (const u of urls) { if (u.startsWith('data:') || u.startsWith('#')) continue; const abs = new URL(u, base).href; t = t.split(u).join(await inl(abs)); }
   css += t + '\n';
  }
 }
 // fonts registered from script (FontFace API) are not in any stylesheet: match them to loaded font files by name
 const files = performance.getEntriesByType('resource').map(e => e.name).filter(u => /\.(ttf|woff2?|otf)(\?|$)/i.test(u));
 for (const f of document.fonts) {
  const fam = f.family.replace(/["']/g, ''); if (css.includes(`font-family: ${fam};`) || css.includes(`font-family: "${fam}";`) && css.includes('@font-face')) continue;
  const u = files.find(x => x.toLowerCase().includes(fam.toLowerCase())); if (u) css += `@font-face{font-family:"${fam}";src:url(${await inl(u)});}\n`;
 }
 const clone = document.documentElement.cloneNode(true);
 clone.querySelectorAll('script,link[rel=stylesheet],style').forEach(e => e.remove());
 // keep scroll offsets of scrolled boxes
 const src = document.querySelectorAll('*'), dst = clone.querySelectorAll('*');
 for (let i = 0; i < src.length; i++) {
  const s = src[i], d = dst[i]; if (!d) continue;
  if ((s.scrollTop || s.scrollLeft) && s.firstElementChild && d.firstElementChild) { d.style.overflow = 'hidden'; [...d.children].forEach(c => { c.style.transform = `translate(${-s.scrollLeft}px,${-s.scrollTop}px)`; }); }
  if (s.tagName === 'IMG' && s.src) d.setAttribute('src', await inl(s.src));
  if (s.tagName === 'INPUT' || s.tagName === 'TEXTAREA') d.setAttribute('value', s.value);
 }
 const st = document.createElement('style'); st.textContent = css; clone.querySelector('head').appendChild(st);
 clone.querySelector('body').style.cssText += `;width:${W}px;height:${H}px;overflow:hidden;margin:0`;
 const xml = new XMLSerializer().serializeToString(clone);
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject x="0" y="0" width="100%" height="100%">${xml}</foreignObject></svg>`;
 const img = new Image(); img.decoding = 'sync';
 await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('svg image failed')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
 await new Promise(r => setTimeout(r, 300));
 const c = document.createElement('canvas'); c.width = W * SCALE; c.height = H * SCALE; const g = c.getContext('2d'); g.scale(SCALE, SCALE);
 g.fillStyle = getComputedStyle(document.body).backgroundColor || '#fff'; g.fillRect(0, 0, W, H); g.drawImage(img, 0, 0);
 return c.toDataURL('image/png');
})()
