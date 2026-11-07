/* Taraji Archives — version arabe : traduit à l'affichage les textes produits par les scripts (données, outils). */
(() => {
  const ROOT = window.TA_ROOT || '';
  const LAT = /[A-Za-zÀ-ÿ]{2}/;
  const SCORE = /(^|[^\d.,/:‏])(\d{1,4}(?:-\d{1,4})+)(?![\d.,/])/g;
  const NUM = /\d+(?:[.,]\d+)?(?:-\d+)?/g;
  const fixScore = s => s.replace(SCORE, (m, a, x) => a + x.split('-').join('‏-‏'));
  let X = {}, N = {}, T = {}, P = {}, RN = null, RP = null, ready = false;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const B = '(?<![\\p{L}\\p{N}])', E = '(?![\\p{L}\\p{N}])';
  const cache = new Map();

  function fill(tpl, names, nums) {
    return tpl.replace(/\{N(\d+)\}/g, (m, i) => { const n = names[i - 1]; return n == null ? '' : (N[n] || n); })
              .replace(/\{D(\d+)\}/g, (m, i) => nums[i - 1] ?? '');
  }
  function tr(raw) {
    const k = raw.replace(/\s+/g, ' ').trim();
    if (!k) return null;
    if (/^[A-Z]$/.test(k) && P[k]) return P[k];
    const ab = k.match(/^(\d+) ([a-z]{1,3}\.)$/); if (ab && P[ab[2]]) return ab[1] + ' ' + P[ab[2]];
    if (!LAT.test(k) || /[\u0600-\u06FF]/.test(k)) return SCORE.test(k) ? (SCORE.lastIndex = 0, fixScore(k)) : null;
    if (cache.has(k)) return cache.get(k);
    let r = X[k] || N[k] || null;
    if (!r) {
      const names = [], nums = [];
      let t = k.replace(RN, m => { names.push(m); return '{N' + names.length + '}'; });
      t = t.split(/(\{N\d+\})/).map(p => p.startsWith('{N') ? p : p.replace(NUM, m => { nums.push(m); return '{D' + nums.length + '}'; })).join('');
      if (T[t]) r = fill(T[t], names, nums);
      else {
        r = k.replace(RN, m => N[m] || m);
        if (RP) r = r.replace(RP, m => P[m] ?? P[m.toLowerCase()] ?? m);
      }
    }
    r = fixScore(r);
    cache.set(k, r);
    return r;
  }
  window.taTr = s => (ready && tr(s)) || s;

  const ATTR = ['placeholder', 'title', 'aria-label', 'data-tip', 'alt'];
  const skip = el => !el || el.closest('script,style,[data-notr],[lang=fr]');
  function doText(n) {
    const v = n.nodeValue; if (!v || !v.trim()) return;
    if (skip(n.parentElement)) return;
    const r = tr(v); if (r == null || r === v.trim()) return;
    const lead = /^\s/.test(v) ? ' ' : '', trail = /\s$/.test(v) ? ' ' : '';
    n.nodeValue = lead + r + trail;
  }
  function doEl(el) {
    if (el.nodeType !== 1 || skip(el)) return;
    for (const a of ATTR) { const v = el.getAttribute(a); if (v && LAT.test(v)) { const r = tr(v); if (r && r !== v) el.setAttribute(a, r); } }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    doEl(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = w.nextNode())) n.nodeType === 3 ? doText(n) : doEl(n);
  }
  const mo = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doEl(m.target);
      else m.addedNodes.forEach(walk);
    }
  });
  fetch(ROOT + 'assets/ar/dict.json?v=' + (window.TA_ARV || '1')).then(r => r.json()).then(d => {
    X = d.x || {}; N = d.n || {}; T = d.t || {}; P = d.p || {};
    const nk = Object.keys(N).sort((a, b) => b.length - a.length).map(esc);
    RN = nk.length ? new RegExp(B + '(?:' + nk.join('|') + ')' + E, 'gu') : /$^/g;
    const pk = Object.keys(P).filter(k => k.trim().length > 1).sort((a, b) => b.length - a.length);
    RP = pk.length ? new RegExp(pk.map(k => { const s = esc(k); return (/^[\p{L}]/u.test(k) ? B : '') + s + (/[\p{L}]$/u.test(k) ? E : ''); }).join('|'), 'gu') : null;
    ready = true;
    walk(document.body);
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTR });
    document.documentElement.classList.add('ar-ready');
    document.dispatchEvent(new Event('ta-ar-ready'));
  }).catch(() => document.documentElement.classList.add('ar-ready'));
})();
