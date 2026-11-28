/* La course aux titres, saison par saison : <div class="sp-race" data-sport="volley|hand|…"> (dossiers f45 volley, f46 handball)
   Données vivantes : assets/data/omni.json (palmarès omnisports, mis à jour par le robot). Rien n'est écrit en dur.
   Classement cumulé des clubs tunisiens ; « titres nationaux » = compétitions de niveau Tunisie. */
(function () {
  'use strict';
  var ROOTS = [].slice.call(document.querySelectorAll('.sp-race[data-sport]'));
  if (!ROOTS.length) return;
  var AR = document.documentElement.lang === 'ar';
  var L = function (fr, ar) { return AR ? ar : fr; };
  var base = AR ? '../' : '';
  var EST = 'esperance-tunis', NROW = 8;
  var COL = { 'esperance-tunis': 'est', 'cs-sfaxien': '#3a3a3a', 'etoile-sahel': '#c62828', 'club-africain': '#e0525c', 'as-marsa': '#2e7d32',
    'co-kelibia': '#1f6fb2', 'alliance-sportive': '#7b7f9e', 'es-goulettoise': '#4a6fa5', 'eo-goulette-kram': '#4a6fa5', 'saydia-sports': '#8e5a8a',
    'effort-sportif': '#6d4c41', 'asptt-tunis': '#f9a825', 'em-mahdia': '#00838f', 'tuc': '#5c6bc0', 'stade-gaulois': '#78909c', 'usm-menzel-bourguiba': '#558b2f', 'cs-sakiet-ezzit': '#ad1457', 'as-hammamet': '#0277bd' };
  var ORD = { 1: 'الأوّل', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس', 6: 'السادس', 7: 'السابع', 8: 'الثامن' };
  function ordo(r) { return AR ? (ORD[r] || String(r)) : (r === 1 ? '1er' : r + 'e'); }
  function sai(y) { return '\u2066' + (y - 1) + '-' + String(y).slice(2) + '\u2069'; }
  function nSai(n) { if (!AR) return n + ' saison' + (n > 1 ? 's' : ''); if (n === 1) return 'موسم واحد'; if (n === 2) return 'موسمان'; if (n <= 10) return n + ' مواسم'; return n + ' موسمًا'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var css = '.vb{background:var(--card,#fffdf8);border:1px solid var(--line,#e4dccb);border-radius:16px;padding:16px 14px 12px;margin:1.4em 0;font-family:var(--body,system-ui)}' +
    '.vb-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:10px}' +
    '.vb-tabs{display:flex;gap:6px}.vb-tabs button,.vb-ctl button{font:inherit;font-size:.9rem;border:1px solid var(--line,#ddd);background:transparent;color:inherit;border-radius:999px;padding:6px 12px;cursor:pointer}' +
    '.vb-tabs button[aria-pressed=true]{background:var(--red,#b5121b);border-color:var(--red,#b5121b);color:#fff}' +
    '.vb-season{font-family:var(--display,serif);font-size:1.9rem;font-weight:800;color:var(--gold-ink,#8a6400);line-height:1.1}' +
    'html[data-theme=dark] .vb-season{color:var(--gold,#e5ae0b)}' +
    '.vb-est{font-size:1rem;margin:2px 0 10px;min-height:1.4em}.vb-est b{color:var(--red,#b5121b)}' +
    '.vb-rows{position:relative}.vb-row{position:absolute;inset-inline:0;height:40px;display:flex;align-items:center;gap:8px;transition:top .42s ease,opacity .3s}' +
    '.vb-rk{flex:0 0 26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:.8rem;font-weight:700;background:#777;color:#fff}' +
    '.vb-rk.r1{background:#e5ae0b;color:#2a1c00}.vb-rk.r2{background:#b9bec7;color:#1d1d1d}.vb-rk.r3{background:#c07a3e;color:#fff}' +
    '.vb-nm{flex:0 0 32%;font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.vb-row.is-est .vb-nm{font-weight:700}' +
    '.vb-track{flex:1;position:relative;height:24px}.vb-bar{position:absolute;inset-block:0;inset-inline-start:0;border-radius:7px;transition:inline-size .42s ease;min-inline-size:2px}' +
    '.vb-bar.est{background:linear-gradient(90deg,#c8102e,#f5c400)}[dir=rtl] .vb-bar.est{background:linear-gradient(270deg,#c8102e,#f5c400)}' +
    '.vb-val{position:absolute;inset-block:0;display:flex;align-items:center;font-weight:700;font-size:.95rem;padding-inline-start:6px;transition:inset-inline-start .42s ease}' +
    '.vb-row.is-est .vb-val{color:var(--red,#b5121b)}' +
    '.vb-foot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-top:10px;font-size:.92rem}' +
    '.vb-ctl{display:flex;gap:6px;align-items:center;flex:1;min-width:220px}.vb-ctl input{flex:1;accent-color:var(--red,#b5121b)}' +
    '.vb-pod b{color:var(--red,#b5121b)}.vb-note{font-size:.8rem;opacity:.75;margin-top:6px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var CL = {};
  function init(root, D) {
  var SPORT = root.getAttribute('data-sport');
  root.classList.add('vb');
  root.innerHTML = '<div class="vb-top"><div class="vb-tabs" role="group" aria-label="' + L('Titres pris en compte', 'الألقاب المحتسبة') + '">' +
    '<button type="button" data-m="n" aria-pressed="true">' + L('Titres nationaux', 'الألقاب الوطنية') + '</button>' +
    '<button type="button" data-m="a" aria-pressed="false">' + L('Tous les titres', 'كلّ الألقاب') + '</button></div>' +
    '<div class="vb-season" aria-live="polite"></div></div><div class="vb-est"></div><div class="vb-rows"></div>' +
    '<div class="vb-foot"><div class="vb-ctl"><button type="button" class="vb-play">▶</button><input type="range" min="0" value="0" aria-label="' + L('Saison', 'الموسم') + '"></div>' +
    '<div class="vb-pod"></div></div><p class="vb-note"></p>';
  var $ = function (s) { return root.querySelector(s); };
  var rowsEl = $('.vb-rows'), seasonEl = $('.vb-season'), estEl = $('.vb-est'), podEl = $('.vb-pod'), slider = $('input'), play = $('.vb-play');
  rowsEl.style.height = (NROW * 46) + 'px';

  var MODE = 'n', SER = {}, idx = 0, timer = null, rowEls = {};
  var COURT = { 'esperance-tunis': ['Espérance', 'الترجي'], 'cs-sfaxien': ['CS Sfaxien', 'النادي الصفاقسي'], 'etoile-sahel': ['Étoile du Sahel', 'النجم الساحلي'],
    'club-africain': ['Club Africain', 'النادي الإفريقي'], 'as-marsa': ['AS Marsa', 'مستقبل المرسى'], 'co-kelibia': ['CO Kélibia', 'أولمبي قليبية'],
    'es-goulettoise': ['ES Goulettoise', 'نجم حلق الوادي'], 'eo-goulette-kram': ['EO Goulette-Kram', 'نجم حلق الوادي والكرم'], 'alliance-sportive': ['Alliance', 'ألِيانس'],
    'us-tunisienne': ['US Tunisienne', 'الاتحاد التونسي'], 'saydia-sports': ['Saydia', 'السعيدية'],
    'effort-sportif': ['Effort Sportif', 'الجهد الرياضي'], 'asptt-tunis': ['ASPTT Tunis', 'جمعية البريد'], 'em-mahdia': ['EM Mahdia', 'مكارم المهدية'],
    'tuc': ['TUC', 'النادي الجامعي'], 'stade-gaulois': ['Stade gaulois', 'ستاد غولوا'], 'usm-menzel-bourguiba': ['US Menzel Bourguiba', 'اتحاد منزل بورقيبة'],
    'cs-sakiet-ezzit': ['CS Sakiet Ezzit', 'ساقية الزيت'], 'as-hammamet': ['AS Hammamet', 'جمعية الحمامات'], 'amc-hammam-lif': ['AMC Hammam-Lif', 'المنصورة الشعبية'] };
  function nm(id) { if (COURT[id]) return COURT[id][AR ? 1 : 0]; var c = CL[id]; if (!c) return id; return (AR && c.ar) ? c.ar : c.n; }
  function build(m) {
    var W = D.t.filter(function (t) { return t[0] === SPORT && t[5] === 'V' && CL[t[4]] && CL[t[4]].p === 'Tunisie' && (m === 'a' || D.comps[t[1]].niveau === 'Tunisie'); });
    var y0 = Math.min.apply(null, W.map(function (t) { return t[2]; })), y1 = Math.max.apply(null, W.map(function (t) { return t[2]; }));
    var by = {}; W.forEach(function (t) { (by[t[2]] = by[t[2]] || []).push(t[4]); });
    var c = {}, out = [], order = [], pod = 0, p0 = null;
    for (var y = y0; y <= y1; y++) {
      (by[y] || []).forEach(function (k) { c[k] = (c[k] || 0) + 1; if (order.indexOf(k) < 0) order.push(k); });
      var snap = {}; for (var k in c) snap[k] = c[k];
      var prev = out.length ? out[out.length - 1].ord : order.slice();
      var ord = order.slice().sort(function (a, b) { return (snap[b] - snap[a]) || ((a === EST) ? -1 : (b === EST) ? 1 : prev.indexOf(a) - prev.indexOf(b)); });
      var e = snap[EST] || 0, r = e ? 1 + Object.keys(snap).filter(function (k) { return snap[k] > e; }).length : null;
      if (r && r <= 3) { if (p0 === null) p0 = y; pod++; }
      out.push({ y: y, c: snap, ord: ord, r: r, pod: pod, since: p0 });
    }
    return out;
  }
  function rank(snap, k) { var v = snap[k] || 0; return 1 + Object.keys(snap).filter(function (j) { return snap[j] > v; }).length; }
  function draw() {
    var S = SER[MODE][idx], max = Math.max(6, S.c[S.ord[0]] || 0) * 1.12;
    seasonEl.textContent = L('Saison ', 'موسم ') + sai(S.y);
    estEl.innerHTML = S.r ? L('L\'Espérance est <b>' + ordo(S.r) + '</b>', 'الترجي في المركز <b>' + ordo(S.r) + '</b>') : L('L\'Espérance n\'a pas encore de titre', 'لم يُحرز الترجي أيّ لقب بعد');
    podEl.innerHTML = S.since ? L('Sur le podium : <b>' + nSai(S.pod) + '</b> sur ' + (S.y - S.since + 1), 'على منصة التتويج: <b>' + nSai(S.pod) + '</b> من أصل ' + (S.y - S.since + 1)) : '';
    var shown = {};
    S.ord.slice(0, NROW).forEach(function (k, i) {
      shown[k] = 1;
      var el = rowEls[k];
      if (!el) {
        el = document.createElement('div'); el.className = 'vb-row' + (k === EST ? ' is-est' : '');
        el.innerHTML = '<span class="vb-rk"></span><span class="vb-nm">' + esc(nm(k)) + '</span><span class="vb-track"><span class="vb-bar' + (k === EST ? ' est' : '') + '"></span><span class="vb-val"></span></span>';
        if (k !== EST) el.querySelector('.vb-bar').style.background = COL[k] || '#8d8478';
        el.style.top = (NROW * 46) + 'px'; el.style.opacity = 0; rowsEl.appendChild(el); rowEls[k] = el; el.offsetWidth;
      }
      var v = S.c[k] || 0, w = (v / max * 100), r = rank(S.c, k);
      el.style.top = (i * 46) + 'px'; el.style.opacity = 1;
      var rk = el.querySelector('.vb-rk'); rk.textContent = r; rk.className = 'vb-rk' + (r <= 3 ? ' r' + r : '');
      el.querySelector('.vb-bar').style.inlineSize = w + '%';
      var val = el.querySelector('.vb-val'); val.textContent = v; val.style.insetInlineStart = w + '%';
    });
    for (var k in rowEls) if (!shown[k]) { rowEls[k].style.top = (NROW * 46) + 'px'; rowEls[k].style.opacity = 0; }
    slider.value = idx;
  }
  function stop() { clearInterval(timer); timer = null; play.textContent = '▶'; play.setAttribute('aria-label', L('Lancer', 'تشغيل')); }
  function start() {
    if (idx >= SER[MODE].length - 1) idx = 0;
    stop(); play.textContent = '❚❚'; play.setAttribute('aria-label', L('Pause', 'إيقاف'));
    timer = setInterval(function () { if (idx >= SER[MODE].length - 1) { stop(); return; } idx++; draw(); }, 480);
  }
  function setMode(m) {
    var y = SER[MODE] ? SER[MODE][idx].y : null; MODE = m;
    root.querySelectorAll('.vb-tabs button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === m ? 'true' : 'false'); });
    slider.max = SER[m].length - 1;
    var j = SER[m].findIndex(function (s) { return s.y === y; }); idx = j >= 0 ? j : SER[m].length - 1;
    for (var k in rowEls) rowEls[k].remove(); rowEls = {}; draw();
  }
  SER.n = build('n'); SER.a = build('a');
  if (!SER.n.length) { root.innerHTML = ''; root.className = ''; return; }
  var nat = []; D.t.forEach(function (t) { if (t[0] === SPORT && D.comps[t[1]].niveau === 'Tunisie' && nat.indexOf(t[1]) < 0) nat.push(t[1]); });
  var ORDC = ['TUN-CH', 'TUN-CUP', 'TUN-SC', 'TUN-FED']; nat.sort(function (a, b) { return ORDC.indexOf(a) - ORDC.indexOf(b); });
  var nn = nat.map(function (c) { return AR ? D.comps[c].ar : D.comps[c].fr; });
  var lst = nn.length > 1 ? nn.slice(0, -1).join(AR ? '، ' : ', ') + (AR ? ' و' : ' et ') + nn[nn.length - 1] : nn[0];
  root.querySelector('.vb-note').textContent = L('Titres nationaux : ' + lst + '. Tous les titres : avec les titres africains et arabes. Classement cumulé des clubs tunisiens à la fin de chaque saison.',
    'الألقاب الوطنية: ' + lst + '. كلّ الألقاب: مع الألقاب الإفريقية والعربية. الترتيب التراكمي للأندية التونسية في نهاية كلّ موسم.');
  slider.max = SER.n.length - 1; idx = SER.n.length - 1; draw();
  root.querySelectorAll('.vb-tabs button').forEach(function (b) { b.addEventListener('click', function () { stop(); setMode(b.dataset.m); }); });
  play.addEventListener('click', function () { timer ? stop() : start(); });
  slider.addEventListener('input', function () { stop(); idx = +slider.value; draw(); });
  var seen = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting && !seen) { seen = true; o.disconnect(); idx = 0; for (var k in rowEls) rowEls[k].remove(); rowEls = {}; draw(); start(); } }); }, { threshold: .4 }).observe(root);
  }
  }
  fetch(base + 'assets/data/omni.json').then(function (r) { return r.json(); }).then(function (d) {
    CL = d.clubs; ROOTS.forEach(function (r) { init(r, d); });
  }).catch(function () { ROOTS.forEach(function (r) { r.innerHTML = ''; r.className = ''; }); });
})();
