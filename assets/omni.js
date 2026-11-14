/* Palmarès omnisports : classement, comparaison, saison par saison, records */
(function () {
  'use strict';
  var AR = document.documentElement.lang === 'ar';
  var L = function (fr, ar) { return AR ? ar : fr; };
  var root = document.getElementById('omOut');
  if (!root) return;
  var base = AR ? '../' : '';
  var D, T = [], CL = {};
  var st = { sports: {}, levels: {}, comps: {}, from: 0, to: 9999, tab: 'classement', tun: true, a: 'esperance-tunis', b: 'club-africain', c: 'esperance-tunis', all: false };
  var LV = { 'Tunisie': L('Tunisie', 'تونس'), 'Afrique': L('Afrique', 'إفريقيا'), 'Monde arabe': L('Monde arabe', 'العالم العربي') };
  var ICON = { foot: '⚽', hand: '🤾', volley: '🏐', basket: '🏀' };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nm(id) { var c = CL[id]; if (!c) return id; return (AR && c.ar) ? c.ar : c.n; }
  function sp(k) { return AR ? D.sports[k].ar : D.sports[k].fr; }
  function cp(k) { return AR ? D.comps[k].ar : D.comps[k].fr; }
  function isTun(id) { return CL[id] && CL[id].p === 'Tunisie'; }

  function rows() {
    return T.filter(function (r) {
      return r.res === 'V' && st.sports[r.s] && st.levels[D.comps[r.c].niveau] && st.comps[r.s + '|' + r.c] !== false && r.y >= st.from && r.y <= st.to;
    });
  }

  // ---------------------------------------------------------------- filtres
  var F = document.getElementById('omF');
  function chip(name, val, label, on) {
    return '<label class="cal-chip"><input type="checkbox" name="' + name + '" value="' + esc(val) + '"' + (on ? ' checked' : '') + '><span>' + label + '</span></label>';
  }
  function buildFilters() {
    var ys = T.map(function (r) { return r.y; });
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    st.from = y0; st.to = y1;
    var opt = ''; for (var y = y0; y <= y1; y++) opt += '<option>' + y + '</option>';
    document.getElementById('omDe').innerHTML = opt; document.getElementById('omDe').value = y0;
    document.getElementById('omA').innerHTML = opt; document.getElementById('omA').value = y1;
    document.getElementById('omSp').innerHTML = Object.keys(D.sports).map(function (k) { st.sports[k] = true; return chip('sp', k, ICON[k] + ' ' + sp(k), true); }).join('');
    document.getElementById('omLv').innerHTML = Object.keys(LV).map(function (k) { st.levels[k] = true; return chip('lv', k, LV[k], true); }).join('');
    drawComps();
    var opts = Object.keys(CL).filter(isTun).sort(function (a, b) { return nm(a).localeCompare(nm(b)); })
      .map(function (k) { return '<option value="' + k + '">' + esc(nm(k)) + '</option>'; }).join('');
    ['omCa', 'omCb', 'omCc'].forEach(function (id) { document.getElementById(id).innerHTML = opts; });
    document.getElementById('omCa').value = st.a; document.getElementById('omCb').value = st.b; document.getElementById('omCc').value = st.c;
  }
  function drawComps() {
    var h = '';
    Object.keys(D.sports).forEach(function (s) {
      if (!st.sports[s]) return;
      var cs = Object.keys(D.comps).filter(function (c) { return T.some(function (r) { return r.s === s && r.c === c; }) && st.levels[D.comps[c].niveau]; });
      if (!cs.length) return;
      h += '<div class="om-cg"><b>' + ICON[s] + ' ' + sp(s) + '</b><div class="cal-comps">' +
        cs.map(function (c) { return chip('cp', s + '|' + c, cp(c), st.comps[s + '|' + c] !== false); }).join('') + '</div></div>';
    });
    document.getElementById('omCp').innerHTML = h;
  }
  F.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'sp') { st.sports[t.value] = t.checked; drawComps(); }
    else if (t.name === 'lv') { st.levels[t.value] = t.checked; drawComps(); }
    else if (t.name === 'cp') { st.comps[t.value] = t.checked; }
    else if (t.id === 'omDe') { st.from = +t.value; }
    else if (t.id === 'omA') { st.to = +t.value; }
    else if (t.id === 'omTun') { st.tun = t.checked; }
    render();
  });
  F.addEventListener('click', function (e) {
    var b = e.target.closest('[data-p]'); if (!b) return;
    var p = b.getAttribute('data-p').split('-');
    var ys = T.map(function (r) { return r.y; });
    st.from = p[0] === '*' ? Math.min.apply(null, ys) : +p[0];
    st.to = p[1] === '*' ? Math.max.apply(null, ys) : +p[1];
    document.getElementById('omDe').value = st.from; document.getElementById('omA').value = st.to;
    render();
  });
  document.querySelector('.om-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-v]'); if (!b) return;
    st.tab = b.getAttribute('data-v'); render();
  });
  ['omCa', 'omCb', 'omCc'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', function (e) {
      st[{ omCa: 'a', omCb: 'b', omCc: 'c' }[id]] = e.target.value; render();
    });
  });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-more]'); if (b) { st.all = true; render(); return; }
    var c = e.target.closest('[data-club]'); if (c) { st.c = c.getAttribute('data-club'); document.getElementById('omCc').value = st.c; st.tab = 'frise'; render(); window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); }
  });

  function period() {
    return '<p class="tool-sum">' + L('Période', 'الفترة') + ' : <b>' + st.from + ' – ' + st.to + '</b></p>';
  }
  function bar(v, m) { return '<div class="cal-v"><div><b>' + v + '</b><span class="cal-track"><i style="width:' + (m ? Math.round(100 * v / m) : 0) + '%"></i></span></div></div>'; }

  // ---------------------------------------------------------------- classement
  function classement() {
    var R = rows(), by = {}, sps = Object.keys(D.sports).filter(function (s) { return st.sports[s]; });
    R.forEach(function (r) {
      if (st.tun && !isTun(r.k)) return;
      var o = by[r.k] || (by[r.k] = { t: 0, s: {}, l: {} });
      o.t++; o.s[r.s] = (o.s[r.s] || 0) + 1; o.l[D.comps[r.c].niveau] = (o.l[D.comps[r.c].niveau] || 0) + 1;
    });
    var ks = Object.keys(by).sort(function (a, b) { return by[b].t - by[a].t || nm(a).localeCompare(nm(b)); });
    if (!ks.length) return period() + '<p>' + L('Aucun trophée pour ces critères.', 'لا ألقاب حسب هذه المعايير.') + '</p>';
    var max = by[ks[0]].t, lvs = Object.keys(LV).filter(function (k) { return st.levels[k]; });
    var n = st.all ? ks.length : Math.min(25, ks.length);
    var h = period() + '<div class="tbl-wrap"><table class="a-table cal-t om-t"><thead><tr><th>#</th><th>' + L('Club', 'النادي') + '</th><th>' + L('Trophées', 'الألقاب') + '</th>' +
      (sps.length > 1 ? sps.map(function (s) { return '<th title="' + esc(sp(s)) + '">' + ICON[s] + '</th>'; }).join('') : '') +
      (lvs.length > 1 ? lvs.map(function (l) { return '<th>' + LV[l] + '</th>'; }).join('') : '') + '</tr></thead><tbody>';
    var rk = 0, prev = -1;
    ks.slice(0, n).forEach(function (k, i) {
      var o = by[k]; if (o.t !== prev) { rk = i + 1; prev = o.t; }
      h += '<tr class="' + (k === 'esperance-tunis' ? 'om-est' : '') + (rk === 1 ? ' top' : '') + '"><td><span class="cal-rk">' + rk + '</span></td><td class="l"><button class="om-lnk" data-club="' + k + '">' + esc(nm(k)) + '</button></td><td>' + bar(o.t, max) + '</td>' +
        (sps.length > 1 ? sps.map(function (s) { return '<td class="n">' + (o.s[s] || '–') + '</td>'; }).join('') : '') +
        (lvs.length > 1 ? lvs.map(function (l) { return '<td class="n">' + (o.l[l] || '–') + '</td>'; }).join('') : '') + '</tr>';
    });
    h += '</tbody></table></div>';
    if (n < ks.length) h += '<p><button class="btn ghost" data-more>' + L('Voir tous les clubs', 'عرض كلّ الأندية') + ' (' + ks.length + ')</button></p>';
    return h;
  }

  // ---------------------------------------------------------------- comparer
  function comparer() {
    var R = rows(), A = st.a, B = st.b, cell = {};
    R.forEach(function (r) {
      if (r.k !== A && r.k !== B) return;
      var key = r.s + '|' + r.c; cell[key] = cell[key] || { a: 0, b: 0 };
      cell[key][r.k === A ? 'a' : 'b']++;
    });
    var h = period() + '<div class="tbl-wrap"><table class="a-table cal-t om-cmp"><thead><tr><th></th><th>' + esc(nm(A)) + '</th><th>' + esc(nm(B)) + '</th></tr></thead><tbody>';
    var ta = 0, tb = 0;
    Object.keys(D.sports).forEach(function (s) {
      if (!st.sports[s]) return;
      var ks = Object.keys(D.comps).filter(function (c) { return cell[s + '|' + c]; });
      if (!ks.length) return;
      var sa = 0, sb = 0;
      var body = ks.map(function (c) {
        var v = cell[s + '|' + c]; sa += v.a; sb += v.b;
        return '<tr><td class="l">' + esc(cp(c)) + '</td>' + td(v.a, v.b) + td(v.b, v.a) + '</tr>';
      }).join('');
      ta += sa; tb += sb;
      h += '<tr class="om-sp"><td>' + ICON[s] + ' ' + sp(s) + '</td>' + td(sa, sb) + td(sb, sa) + '</tr>' + body;
    });
    h += '<tr class="om-tot"><td>' + L('Total', 'المجموع') + '</td>' + td(ta, tb) + td(tb, ta) + '</tr></tbody></table></div>';
    if (!ta && !tb) h = period() + '<p>' + L('Aucun trophée pour ces critères.', 'لا ألقاب حسب هذه المعايير.') + '</p>';
    return h;
  }
  function td(x, y) { return '<td class="' + (x > y ? 'om-w' : '') + '">' + (x || '–') + '</td>'; }

  // ---------------------------------------------------------------- saison par saison
  function frise() {
    var R = rows().filter(function (r) { return r.k === st.c; }), by = {};
    R.forEach(function (r) { (by[r.y] = by[r.y] || []).push(r); });
    var ys = Object.keys(by).sort(function (a, b) { return b - a; });
    if (!ys.length) return period() + '<p>' + L('Aucun trophée pour ces critères.', 'لا ألقاب حسب هذه المعايير.') + '</p>';
    var h = period() + '<p class="tool-sum"><b>' + esc(nm(st.c)) + '</b> : ' + R.length + ' ' + L('trophées', 'لقبًا') + ', ' + ys.length + ' ' + L('années avec au moins un trophée', 'سنة بلقب واحد على الأقلّ') + '</p><ol class="om-years">';
    ys.forEach(function (y) {
      var list = by[y].sort(function (a, b) { return a.s.localeCompare(b.s); });
      h += '<li' + (list.length >= 3 ? ' class="hot"' : '') + '><b class="om-y">' + y + '<small>' + list.length + '</small></b><span>' +
        list.map(function (r) { return '<span class="om-b om-' + r.s + '">' + ICON[r.s] + ' ' + esc(cp(r.c)) + (r.sa !== String(r.y) ? ' <small>' + esc(r.sa) + '</small>' : '') + '</span>'; }).join('') + '</span></li>';
    });
    return h + '</ol>';
  }

  // ---------------------------------------------------------------- records
  function records() {
    var R = rows().filter(function (r) { return !st.tun || isTun(r.k); });
    if (!R.length) return period() + '<p>' + L('Aucun trophée pour ces critères.', 'لا ألقاب حسب هذه المعايير.') + '</p>';
    // 1. le plus de trophées en une année
    var yr = {};
    R.forEach(function (r) { var k = r.k + '|' + r.y; yr[k] = (yr[k] || 0) + 1; });
    var top = Object.keys(yr).sort(function (a, b) { return yr[b] - yr[a]; }).slice(0, 8);
    // 2. plus longues séries dans une compétition (éditions consécutives)
    var ed = {}, win = {};
    T.forEach(function (r) { if (r.res === 'V') { var k = r.s + '|' + r.c; (ed[k] = ed[k] || {})[r.y] = 1; } });
    R.forEach(function (r) { var k = r.s + '|' + r.c; ((win[k] = win[k] || {})[r.y] = r.k); });
    var streaks = [];
    Object.keys(win).forEach(function (k) {
      var eds = Object.keys(ed[k]).map(Number).sort(function (a, b) { return a - b; }).filter(function (y) { return y >= st.from && y <= st.to; });
      var cur = null, n = 0, y0 = 0;
      eds.concat([null]).forEach(function (y) {
        var w = y === null ? null : win[k][y];
        if (w && w === cur) { n++; } else { if (cur && n >= 3) streaks.push({ k: cur, c: k, n: n, a: y0, b: prevY }); cur = w; n = w ? 1 : 0; y0 = y; }
        prevY = y === null ? prevY : y;
      });
    });
    var prevY;
    streaks.sort(function (a, b) { return b.n - a.n; });
    // 3. meilleure décennie
    var dec = {};
    R.forEach(function (r) { var k = r.k + '|' + Math.floor(r.y / 10) * 10; dec[k] = (dec[k] || 0) + 1; });
    var tdec = Object.keys(dec).sort(function (a, b) { return dec[b] - dec[a]; }).slice(0, 8);
    // 4. doublés et triplés (championnat + coupe [+ Ligue des champions] la même saison, même sport)
    var dbl = {};
    R.forEach(function (r) { var k = r.k + '|' + r.s + '|' + r.y; (dbl[k] = dbl[k] || {})[r.c] = 1; });
    var dcount = {};
    Object.keys(dbl).forEach(function (k) {
      var c = dbl[k]; if (c['TUN-CH'] && c['TUN-CUP']) {
        var p = k.split('|'); var o = dcount[p[0]] = dcount[p[0]] || { d: 0, t: 0, s: {} };
        o.d++; o.s[p[1]] = (o.s[p[1]] || 0) + 1; if (c['AFR-CL']) o.t++;
      }
    });
    var dk = Object.keys(dcount).sort(function (a, b) { return dcount[b].d - dcount[a].d; }).slice(0, 8);
    function card(t, sub, body) { return '<div class="cal-card"><h3>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</h3>' + body + '</div>'; }
    function li(a) { return '<ol class="om-rec">' + a.join('') + '</ol>'; }
    var h = period();
    h += card(L('Le plus de trophées en une année', 'أكثر الألقاب في سنة واحدة'), '', li(top.map(function (k) { var p = k.split('|'); return '<li><b>' + yr[k] + '</b> ' + esc(nm(p[0])) + ' <span>(' + p[1] + ')</span></li>'; })));
    h += card(L('Les plus longues séries de titres', 'أطول سلاسل الألقاب المتتالية'), L('Éditions consécutives d\'une même compétition', 'دورات متتالية في المسابقة نفسها'),
      li(streaks.slice(0, 8).map(function (s) { var p = s.c.split('|'); return '<li><b>' + s.n + '</b> ' + esc(nm(s.k)) + ' <span>' + ICON[p[0]] + ' ' + esc(cp(p[1])) + ', ' + s.a + '–' + s.b + '</span></li>'; })));
    h += card(L('Les meilleures décennies', 'أفضل العشريات'), '', li(tdec.map(function (k) { var p = k.split('|'); return '<li><b>' + dec[k] + '</b> ' + esc(nm(p[0])) + ' <span>(' + p[1] + 's)</span></li>'; })));
    h += card(L('Doublés championnat-coupe', 'ثنائيات البطولة والكأس'), L('Même sport, même année ; entre parenthèses, les triplés avec la Ligue des champions', 'الاختصاص نفسه والسنة نفسها؛ وبين قوسين الثلاثيات مع رابطة الأبطال'),
      li(dk.map(function (k) { var o = dcount[k]; return '<li><b>' + o.d + '</b> ' + esc(nm(k)) + ' <span>' + Object.keys(o.s).map(function (s) { return ICON[s] + ' ' + o.s[s]; }).join(' · ') + (o.t ? ' (' + L('triplés', 'ثلاثيات') + ' : ' + o.t + ')' : '') + '</span></li>'; })));
    return h;
  }

  var KEY = 'ta-omni-filtres';
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ sports: st.sports, levels: st.levels, comps: st.comps, from: st.from, to: st.to, tab: st.tab, tun: st.tun, a: st.a, b: st.b, c: st.c })); } catch (e) {}
  }
  function restore() {
    var o; try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { o = null; }
    if (!o) return;
    ['sports', 'levels', 'comps'].forEach(function (k) { if (o[k]) Object.keys(o[k]).forEach(function (x) { if (k === 'comps' || x in st[k]) st[k][x] = o[k][x]; }); });
    if (o.from) st.from = o.from; if (o.to) st.to = o.to;
    if (o.tab) st.tab = o.tab; if (typeof o.tun === 'boolean') st.tun = o.tun;
    ['a', 'b', 'c'].forEach(function (k) { if (o[k] && CL[o[k]]) st[k] = o[k]; });
    F.querySelectorAll('input[name=sp]').forEach(function (i) { i.checked = !!st.sports[i.value]; });
    F.querySelectorAll('input[name=lv]').forEach(function (i) { i.checked = !!st.levels[i.value]; });
    drawComps();
    document.getElementById('omDe').value = st.from; document.getElementById('omA').value = st.to;
    document.getElementById('omTun').checked = st.tun;
    document.getElementById('omCa').value = st.a; document.getElementById('omCb').value = st.b; document.getElementById('omCc').value = st.c;
  }
  function render() {
    save();
    document.querySelectorAll('.om-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-v') === st.tab); });
    document.getElementById('omPickAB').hidden = st.tab !== 'comparer';
    document.getElementById('omPickC').hidden = st.tab !== 'frise';
    root.innerHTML = { classement: classement, comparer: comparer, frise: frise, records: records }[st.tab]();
  }

  fetch(base + 'assets/data/omni.json').then(function (r) { return r.json(); }).then(function (d) {
    D = d; CL = d.clubs;
    T = d.t.map(function (r) { return { s: r[0], c: r[1], y: r[2], sa: r[3], k: r[4], res: r[5], o: r[6] }; });
    buildFilters(); restore(); render();
  }).catch(function () { root.innerHTML = '<p>' + L('Chargement impossible.', 'تعذّر التحميل.') + '</p>'; });
})();
