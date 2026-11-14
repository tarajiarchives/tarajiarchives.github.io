/* Taraji Archives : Coupe de Tunisie — face à face en Coupe et édition tour par tour */
(() => {
  const $ = s => document.querySelector(s);
  if (!$('#cpOut')) return;
  const AR = window.TA_LANG === 'ar';
  const L = (fr, ar) => AR ? ar : fr;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const params = new URLSearchParams(location.search);
  const setParams = o => { const u = new URL(location); Object.entries(o).forEach(([k, v]) => v ? u.searchParams.set(k, v) : u.searchParams.delete(k)); history.replaceState(null, '', u); };
  const TOURS = [['F', 'Finales', 'النهائيات'], ['D', 'Demi-finales', 'نصف النهائي'], ['Q', 'Quarts de finale', 'ربع النهائي'], ['H', 'Huitièmes de finale', 'ثمن النهائي'], ['S', 'Seizièmes de finale', 'الدور 32'], ['P', 'Tours précédents', 'الأدوار السابقة']];
  const TN = Object.fromEntries(TOURS.map(t => [t[0], L(t[1], t[2])]));
  const sk = s => +String(s).slice(0, 4);
  fetch((window.TA_ROOT || '') + 'assets/data/coupe.json', { cache: 'no-cache' }).then(r => r.json()).then(D => {
    const N = D.n;
    const nm = id => N[id] ? (AR && N[id][1] ? N[id][1] : N[id][0]) : id;
    // m = [saison, tk, tour, date, dom, ext, bd, be, prol, tab, qualifié, forfait]
    const M = D.m;
    const sc = m => { if (m[6] == null) return m[11] ? L('forfait', 'انسحاب') : '–'; let x = m[6] + '-' + m[7];
      if (m[8] && /^\d+-\d+$/.test(m[8]) && m[8] !== x) x += ` (${L('a.p.', 'ب.ت.')} ${m[8]})`; else if (m[8]) x += ` (${L('a.p.', 'ب.ت.')})`;
      if (m[9]) x += ` (${L('t.a.b.', 'ر.ت.')} ${m[9]})`; return x; };
    // confrontations (match rejoué / aller-retour = une seule confrontation)
    const ties = []; const TI = {};
    M.forEach(m => { const k = m[0] + '|' + m[2] + '|' + [m[4], m[5]].sort().join('|'); if (!TI[k]) { TI[k] = { s: m[0], tk: m[1], tour: m[2], ms: [] }; ties.push(TI[k]); } TI[k].ms.push(m); });
    // clubs : classés par nombre de matchs
    const cnt = {}; M.forEach(m => { cnt[m[4]] = (cnt[m[4]] || 0) + 1; cnt[m[5]] = (cnt[m[5]] || 0) + 1; });
    const clubs = Object.keys(cnt).filter(c => cnt[c] >= 3 || N[c]).sort((a, b) => (N[b] ? 1 : 0) - (N[a] ? 1 : 0) || cnt[b] - cnt[a]);
    const opts = v => clubs.map(c => `<option value="${esc(c)}"${c === v ? ' selected' : ''}>${esc(nm(c))}</option>`).join('');
    const sa = $('#cpA'), sb = $('#cpB'), de = $('#cpDe'), jq = $('#cpJq');
    let A = params.get('a'), B = params.get('b');
    if (!clubs.includes(A)) A = 'esperance-tunis'; if (!clubs.includes(B)) B = A === 'club-africain' ? 'esperance-tunis' : 'club-africain';
    sa.innerHTML = opts(A); sb.innerHTML = opts(B);
    const S = D.s, so = S.map(s => `<option value="${s}">${s}</option>`).join('');
    de.innerHTML = so; jq.innerHTML = so;
    de.value = S.includes(params.get('de')) ? params.get('de') : S[0]; jq.value = S.includes(params.get('jusq')) ? params.get('jusq') : S[S.length - 1];
    const inR = s => sk(s) >= sk(de.value) && sk(s) <= sk(jq.value);
    const all = () => de.value === S[0] && jq.value === S[S.length - 1];
    const row = (lab, x, y) => `<div class="cmp-row"><span class="a${x > y ? ' win' : ''}">${x}</span><span class="lab">${lab}</span><span class="b${y > x ? ' win' : ''}">${y}</span></div>`;
    const pl = (n, s, p) => n + ' ' + (n > 1 ? p : s);
    const draw = () => {
      if (sk(de.value) > sk(jq.value)) jq.value = de.value;
      A = sa.value; B = sb.value; setParams({ a: A, b: B, de: all() ? '' : de.value, jusq: all() ? '' : jq.value });
      const out = $('#cpOut');
      let h = `<div class="cmp-head"><h2>${esc(nm(A))}</h2><span class="vs">${L('contre', 'ضدّ')}</span><h2>${esc(nm(B))}</h2></div>`;
      if (!all()) h += `<p class="daf-scope">${de.value === jq.value ? L('Saison ', 'موسم ') + de.value : L(`De ${de.value} à ${jq.value}`, `من ${de.value} إلى ${jq.value}`)}</p>`;
      if (A === B) { out.innerHTML = h + `<p class="tool-sum daf-warn">${L('Choisissez deux clubs différents.', 'اختر ناديين مختلفين.')}</p>`; return; }
      const T = ties.filter(t => inR(t.s) && t.ms.some(m => (m[4] === A && m[5] === B) || (m[4] === B && m[5] === A)));
      if (!T.length) { out.innerHTML = h + `<p class="tool-sum daf-warn">${L('Aucune confrontation en Coupe de Tunisie entre ces deux clubs' + (all() ? '.' : ' sur cette période.'), 'لا توجد مواجهة في كأس تونس بين هذين الناديين' + (all() ? '.' : ' خلال هذه الفترة.'))}</p>`; return; }
      const ms = T.flatMap(t => t.ms);
      const gA = m => m[4] === A ? m[6] : m[7], gB = m => m[4] === A ? m[7] : m[6];
      const pl1 = ms.filter(m => m[6] != null);
      const v = pl1.filter(m => gA(m) > gB(m)).length, d = pl1.filter(m => gA(m) < gB(m)).length, n = pl1.length - v - d;
      const qa = T.filter(t => t.ms[t.ms.length - 1][10] === A).length, qb = T.filter(t => t.ms[t.ms.length - 1][10] === B).length;
      h += `<h3>${L('Bilan total :', 'الحصيلة الكاملة:')} ${pl(T.length, L('confrontation', 'مواجهة'), L('confrontations', 'مواجهة'))}${L(', ', '، ')}${pl(ms.length, L('match', 'مباراة'), L('matchs', 'مباراة'))}</h3>
        <div class="cmp-rows">${row(L('Qualifications', 'التأهّل'), qa, qb)}${row(L('Victoires (temps réglementaire)', 'الانتصارات (الوقت الأصلي)'), v, d)}${row(L('Matchs nuls', 'التعادلات'), n, n)}${row(L('Buts marqués', 'الأهداف المسجّلة'), pl1.reduce((t, m) => t + gA(m), 0), pl1.reduce((t, m) => t + gB(m), 0))}</div>`;
      // détail par tour
      h += `<h3>${L('Le détail par tour', 'التفاصيل حسب الدور')}</h3><div class="table-wrap"><table class="a-table cp-tours"><thead><tr><th class="l">${L('Tour', 'الدور')}</th><th>${L('Confrontations', 'المواجهات')}</th><th>${esc(nm(A))}</th><th>${esc(nm(B))}</th></tr></thead><tbody>`;
      TOURS.forEach(([k]) => { const G = T.filter(t => t.tk === k); if (!G.length) return;
        const a1 = G.filter(t => t.ms[t.ms.length - 1][10] === A).length, b1 = G.filter(t => t.ms[t.ms.length - 1][10] === B).length;
        h += `<tr><td class="l">${TN[k]}</td><td>${G.length}</td><td class="${a1 > b1 ? 'w' : ''}"><b>${a1}</b></td><td class="${b1 > a1 ? 'w' : ''}"><b>${b1}</b></td></tr>`; });
      h += `</tbody></table></div><p class="tool-sum">${L('Chiffres = nombre de qualifications (ou de Coupes gagnées pour les finales).', 'الأرقام = عدد مرات التأهّل (أو الكؤوس المحرزة في النهائيات).')}</p>`;
      // liste
      h += `<h3>${L('Toutes les confrontations', 'كلّ المواجهات')}</h3><div class="table-wrap"><table class="a-table">`;
      T.slice().reverse().forEach(t => { const q = t.ms[t.ms.length - 1][10];
        h += `<tr><td>${t.s}</td><td>${esc(TN[t.tk] === TN.P ? t.tour : TN[t.tk])}</td><td>${t.ms.map(m => `${esc(nm(m[4]))} <b>${sc(m)}</b> ${esc(nm(m[5]))}`).join('<br>')}</td><td class="${q === A ? 'w' : q === B ? 'l' : ''}">${q ? esc(nm(q)) + ' ✓' : ''}</td></tr>`; });
      out.innerHTML = h + '</table></div>';
    };
    sa.onchange = sb.onchange = de.onchange = jq.onchange = draw;
    $('#cpSwap').onclick = () => { [sa.value, sb.value] = [sb.value, sa.value]; draw(); };
    $('#cpAll').onclick = () => { de.value = S[0]; jq.value = S[S.length - 1]; draw(); };
    draw();
    // édition tour par tour
    const ed = $('#cpEd'), eo = $('#cpEdOut');
    ed.innerHTML = S.slice().reverse().map(s => `<option value="${s}">${s}</option>`).join('');
    if (S.includes(params.get('ed'))) ed.value = params.get('ed');
    const drawEd = () => {
      const s = ed.value; if (eo.dataset.s) setParams({ ed: s }); eo.dataset.s = s;
      const G = ties.filter(t => t.s === s); const rounds = [];
      G.forEach(t => { let r = rounds.find(x => x.tour === t.tour); if (!r) rounds.push(r = { tour: t.tour, tk: t.tk, L: [] }); r.L.push(t); });
      rounds.sort((x, y) => 'FDQHSP'.indexOf(x.tk) - 'FDQHSP'.indexOf(y.tk));
      eo.innerHTML = rounds.map(r => `<details class="cp-round"${r.tk === 'F' || r.tk === 'D' ? ' open' : ''}><summary><b>${esc(r.tk === 'P' ? r.tour : TN[r.tk])}</b> <small>${r.L.length}</small></summary><div class="table-wrap"><table class="a-table">${r.L.map(t => t.ms.map(m => `<tr><td>${esc(m[3] ? m[3].split('-').reverse().join('/') : '')}</td><td class="l${m[10] === m[4] ? ' w' : ''}">${esc(nm(m[4]))}</td><td><b>${sc(m)}</b></td><td class="l${m[10] === m[5] ? ' w' : ''}">${esc(nm(m[5]))}</td></tr>`).join('')).join('')}</table></div></details>`).join('');
    };
    ed.onchange = drawEd; drawEd();
  });
})();
