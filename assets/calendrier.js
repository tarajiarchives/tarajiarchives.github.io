/* Taraji Archives — interface « Calendriers & Records » */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  if (!$('#calOut') || !window.TACal) return;
  const C = window.TACal, AR = window.TA_LANG === 'ar', L = (f, a) => AR ? a : f;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const P = new URLSearchParams(location.search);
  const COMPS = { 'TUN-L1': ['Ligue 1', 'الرابطة 1'], 'TUN-COUPE': ['Coupe de Tunisie', 'كأس تونس'], 'TUN-SC': ['Supercoupe de Tunisie', 'كأس السوبر التونسي'],
    'CAF-CL': ['Ligue des champions CAF', 'رابطة أبطال إفريقيا'], 'CAF-CC': ['Coupe de la Confédération', 'كأس الكنفدرالية'], 'CAF-SC': ['Supercoupe CAF', 'كأس السوبر الإفريقي'],
    'ARAB': ['Coupe arabe des clubs', 'البطولة العربية للأندية'] };
  const cn = c => COMPS[c] ? L(COMPS[c][0], COMPS[c][1]) : c;
  const today = new Date().toISOString().slice(0, 10);
  const fr = d => d ? d.split('-').reverse().join('/') : L('date inconnue', 'تاريخ غير معروف');
  fetch((window.TA_ROOT || '') + 'assets/data/calendrier.json').then(r => r.json()).then(D => {
    const ID = D.c, NM = D.n;
    const M = D.m.map(x => ({ d: x[0], c: x[1], s: x[2], h: ID[x[3]], a: ID[x[4]], bh: x[5], ba: x[6], st: x[7] || 'joué', n: x[8] ? 1 : 0, ph: x[9] }));
    const name = c => { const i = ID.indexOf(c); return i < 0 ? c : (AR && NM[i][1] ? NM[i][1] : NM[i][0]); };
    const TUN = ID.filter((c, i) => NM[i][2]);
    const present = [...new Set(M.map(m => m.c))];
    // ---------------------------------------------------------------- filtres
    const de = $('#calDe'), a = $('#calA'), an = $('#calAn'), sa = $('#calSa'), lieu = $('#calLieu');
    const years = [...new Set(M.filter(m => m.d).map(m => m.d.slice(0, 4)))].sort().reverse();
    an.innerHTML = `<option value="">—</option>` + years.map(y => `<option>${y}</option>`).join('');
    const seasons = [...new Set(M.filter(m => m.c === 'TUN-L1').map(m => m.s))].sort().reverse();
    sa.innerHTML = `<option value="">—</option>` + seasons.map(s => `<option>${s}</option>`).join('');
    $('#calComps').innerHTML = present.map(c => `<label class="cal-chip"><input type="checkbox" value="${c}" checked><span>${esc(cn(c))}</span></label>`).join('');
    de.value = P.get('de') || '2020-01-01'; a.value = P.get('a') || today; lieu.value = P.get('lieu') || '';
    if (P.get('comps')) $$('#calComps input').forEach(i => i.checked = P.get('comps').split(',').includes(i.value));
    let view = P.get('v') || 'classement', clubs = (P.get('clubs') || 'esperance-tunis,club-africain,etoile-sahel,cs-sfaxien').split(',').filter(c => TUN.includes(c));
    let club = P.get('club') || 'esperance-tunis', ind = P.get('ind') || 'matchs';
    const F = () => ({ de: de.value, a: a.value, lieu: lieu.value, comps: $$('#calComps input:checked').map(i => i.value) });
    an.onchange = () => { if (an.value) { de.value = an.value + '-01-01'; a.value = an.value + '-12-31'; sa.value = ''; } draw(); };
    sa.onchange = () => { if (sa.value) { const y = +sa.value.slice(0, 4); de.value = y + '-07-01'; a.value = (y + 1) + '-06-30'; an.value = ''; } draw(); };
    [de, a, lieu].forEach(e => e.onchange = () => { an.value = sa.value = ''; draw(); });
    $('#calComps').onchange = draw;
    $$('.cal-tabs button').forEach(b => b.onclick = () => { view = b.dataset.v; draw(); });
    const save = () => {
      const u = new URL(location), f = F();
      const o = { v: view, de: f.de, a: f.a, lieu: f.lieu, comps: f.comps.length === present.length ? '' : f.comps.join(','), club, clubs: clubs.join(','), ind };
      Object.entries(o).forEach(([k, v]) => v ? u.searchParams.set(k, v) : u.searchParams.delete(k)); history.replaceState(null, '', u);
    };
    // ---------------------------------------------------------------- outils d'affichage
    const LIST = []; // listes de matchs cliquables
    const mlink = (txt, ms, title) => { LIST.push([title, ms]); return `<button type="button" class="cal-k" data-k="${LIST.length - 1}">${txt}</button>`; };
    const res = (m, c) => C.res(m, c);
    const mtable = (ms, c) => `<div class="table-wrap"><table class="a-table cal-t"><thead><tr><th>${L('Date', 'التاريخ')}</th><th>${L('Compétition', 'المسابقة')}</th><th class="l">${L('Match', 'المباراة')}</th><th>${L('Score', 'النتيجة')}</th>${c ? `<th>${L('Repos', 'الراحة')}</th>` : ''}</tr></thead><tbody>` +
      ms.map((m, i) => { const g = c && i && m.d && ms[i - 1].d ? C.days(ms[i - 1].d, m.d) : null; const r = c ? res(m, c) : null;
        return `<tr class="${r ? 'r' + r : ''}"><td>${fr(m.d)}</td><td>${esc(cn(m.c))}<small> ${esc(m.ph || '')}</small></td><td class="l">${esc(name(m.h))} – ${esc(name(m.a))}${m.n ? ' <small>(' + L('terrain neutre', 'ملعب محايد') + ')</small>' : ''}</td><td><b>${m.bh === '' ? '–' : m.bh + '-' + m.ba}</b></td>${c ? `<td class="${g !== null && g < 3 ? 'hot' : g !== null && g < 4 ? 'warm' : ''}">${g === null ? '' : g + L(' j', ' ي')}</td>` : ''}</tr>`; }).join('') + `</tbody></table></div>`;
    const csv = (rows, fn) => { const b = new Blob(['﻿' + rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv' });
      const u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = fn; l.click(); URL.revokeObjectURL(u); };
    const prov = s => s.sansDate ? ` <span class="cal-prov" title="${L('matchs non datés dans la période', 'مباريات غير مؤرّخة في الفترة')}">${L('provisoire', 'مؤقّت')}</span>` : '';
    const dlg = $('#calDlg');
    $('#calOut').addEventListener('click', e => { const b = e.target.closest('.cal-k'); if (!b) return; const [t, ms] = LIST[+b.dataset.k];
      $('#calDlgB').innerHTML = `<h3>${esc(t)}</h3><p class="tool-sum">${ms.length} ${L('matchs', 'مباراة')}</p>` + mtable(ms, null); dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''); });
    const clubSel = (id, v) => `<select id="${id}">${TUN.slice().sort((x, y) => name(x).localeCompare(name(y))).map(c => `<option value="${c}"${c === v ? ' selected' : ''}>${esc(name(c))}</option>`).join('')}</select>`;
    const IND = {
      matchs: [L('Matchs joués', 'المباريات'), s => s.matchs, s => s.dated.concat(s.undated)],
      dom: [L('À domicile', 'داخل الديار'), s => s.dom, null], ext: [L('À l’extérieur', 'خارج الديار'), s => s.ext, null],
      w30: [L('Max. en 30 jours', 'الأقصى في 30 يومًا'), s => s.w30.n, s => s.w30.matches], w60: [L('Max. en 60 jours', 'الأقصى في 60 يومًا'), s => s.w60.n, s => s.w60.matches],
      w90: [L('Max. en 90 jours', 'الأقصى في 90 يومًا'), s => s.w90.n, s => s.w90.matches],
      moins3: [L('Matchs à moins de 3 jours du précédent', 'مباريات بعد أقلّ من 3 أيام'), s => s.moins3, s => s.dated.filter((m, i) => i && C.days(s.dated[i - 1].d, m.d) < 3)],
      moins4: [L('Matchs à moins de 4 jours du précédent', 'مباريات بعد أقلّ من 4 أيام'), s => s.moins4, s => s.dated.filter((m, i) => i && C.days(s.dated[i - 1].d, m.d) < 4)],
      gapMoy: [L('Repos moyen (jours)', 'معدّل الراحة (أيام)'), s => s.gapMoy === null ? null : Math.round(s.gapMoy * 10) / 10, null, 1],
      serie3: [L('Plus longue série à ≤ 3 jours d’écart', 'أطول سلسلة بفارق ≤ 3 أيام'), s => s.serie3.n, s => s.serie3.matches],
      serieExt: [L('Plus longue série à l’extérieur', 'أطول سلسلة خارج الديار'), s => s.serieExt.n, s => s.serieExt.matches]
    };
    const allStats = f => TUN.map(c => C.stats(M, c, f)).filter(s => s.matchs);
    // ---------------------------------------------------------------- vues
    function vClassement(f) {
      const S = allStats(f), I = IND[ind] || IND.matchs, asc = I[3];
      const rows = S.map(s => [s, I[1](s)]).filter(r => r[1] !== null).sort((x, y) => asc ? x[1] - y[1] : y[1] - x[1]);
      let h = `<div class="tool-bar"><label>${L('Indicateur', 'المؤشّر')} <select id="calInd">${Object.entries(IND).map(([k, v]) => `<option value="${k}"${k === ind ? ' selected' : ''}>${esc(v[0])}</option>`).join('')}</select></label>
        <button type="button" class="btn ghost" id="calCsv">${L('Exporter (CSV)', 'تصدير (CSV)')}</button></div>`;
      let rk = 0, prev = null; const two = ind !== 'matchs', mx = Math.max(1, ...rows.map(r => r[1]));
      h += `<div class="table-wrap"><table class="a-table cal-t"><thead><tr><th>#</th><th class="l">${L('Club', 'النادي')}</th><th>${esc(I[0])}</th>${two ? `<th>${L('Matchs', 'المباريات')}</th>` : ''}</tr></thead><tbody>` +
        rows.map(([s, v], i) => { if (v !== prev) rk = i + 1; prev = v;
          const val = I[2] ? mlink(v, I[2](s), name(s.club) + ' — ' + I[0]) : `<b>${v}</b>`;
          return `<tr class="${rk <= 3 ? 'top' : ''}"><td><span class="cal-rk">${rk}</span></td><td class="l">${esc(name(s.club))}${prov(s)}</td><td class="cal-v"><div>${val}<span class="cal-track"><i style="width:${Math.max(2, v / mx * 100).toFixed(1)}%"></i></span></div></td>${two ? `<td class="n">${s.matchs}</td>` : ''}</tr>`; }).join('') + `</tbody></table></div>`;
      $('#calOut').innerHTML = h;
      $('#calInd').onchange = e => { ind = e.target.value; draw(); };
      $('#calCsv').onclick = () => csv([[L('Rang', 'الترتيب'), L('Club', 'النادي'), I[0], L('Matchs', 'المباريات'), L('Sans date', 'دون تاريخ')]].concat(rows.map(([s, v], i) => [i + 1, name(s.club), v, s.matchs, s.sansDate])), 'classement.csv');
    }
    function vComparer(f) {
      const S = clubs.map(c => C.stats(M, c, f));
      let h = `<div class="tool-bar">${clubSel('calAdd', '')}<button type="button" class="btn" id="calAddB">${L('Ajouter', 'إضافة')}</button></div>
        <p class="cal-chips">${clubs.map(c => `<button type="button" class="chip" data-c="${c}">${esc(name(c))} ×</button>`).join('')}</p>`;
      if (S.length) {
        const ref = S[0];
        const row = (lab, fn, list) => `<tr><td class="l">${esc(lab)}</td>${S.map(s => { const v = fn(s); return `<td><b>${list && v ? mlink(v, list(s), name(s.club) + ' — ' + lab) : (v ?? '–')}</b></td>`; }).join('')}</tr>`;
        h += `<div class="table-wrap"><table class="a-table cal-t"><thead><tr><th></th>${S.map(s => `<th>${esc(name(s.club))}${prov(s)}</th>`).join('')}</tr></thead><tbody>` +
          row(L('Matchs joués', 'المباريات'), s => s.matchs, s => s.dated.concat(s.undated)) +
          `<tr><td class="l">${L('Écart avec ', 'الفارق مع ')}${esc(name(ref.club))}</td>${S.map(s => `<td>${s === ref ? '–' : (s.matchs - ref.matchs > 0 ? '+' : '') + (s.matchs - ref.matchs) + (ref.matchs ? ` (${Math.round((s.matchs - ref.matchs) / ref.matchs * 100)} %)` : '')}</td>`).join('')}</tr>` +
          present.map(c => row(cn(c), s => s.parComp[c] || 0, s => s.dated.concat(s.undated).filter(m => m.c === c))).join('') +
          row(L('À domicile', 'داخل الديار'), s => s.dom) + row(L('À l’extérieur', 'خارج الديار'), s => s.ext) +
          row(L('Repos moyen (jours)', 'معدّل الراحة (أيام)'), s => s.gapMoy === null ? null : Math.round(s.gapMoy * 10) / 10) +
          row(L('Repos médian (jours)', 'الراحة الوسيطة (أيام)'), s => s.gapMed) + row(L('Repos minimum (jours)', 'أدنى راحة (أيام)'), s => s.gapMin) +
          row(L('Matchs à moins de 3 jours', 'مباريات بعد أقلّ من 3 أيام'), s => s.moins3, IND.moins3[2]) +
          row(L('Max. en 30 jours', 'الأقصى في 30 يومًا'), s => s.w30.n, s => s.w30.matches) + row(L('Max. en 90 jours', 'الأقصى في 90 يومًا'), s => s.w90.n, s => s.w90.matches) +
          `</tbody></table></div><p class="tool-sum">${L('Mêmes règles et même période pour tous les clubs.', 'القواعد نفسها والفترة نفسها لكلّ الأندية.')}</p>`;
      }
      $('#calOut').innerHTML = h;
      $('#calAddB').onclick = () => { const v = $('#calAdd').value; if (!clubs.includes(v) && clubs.length < 6) clubs.push(v); draw(); };
      $$('.cal-chips .chip').forEach(b => b.onclick = () => { clubs = clubs.filter(c => c !== b.dataset.c); draw(); });
    }
    function vClub(f) {
      const s = C.stats(M, club, f);
      let h = `<div class="tool-bar"><label>${L('Club', 'النادي')} ${clubSel('calClub', club)}</label><button type="button" class="btn ghost" id="calCsv">${L('Exporter (CSV)', 'تصدير (CSV)')}</button></div>`;
      h += `<section class="dh-kpis"><div><b>${s.matchs}</b>${L('matchs', 'مباراة')}</div><div><b>${s.gapMoy === null ? '–' : Math.round(s.gapMoy * 10) / 10}</b>${L('jours de repos en moyenne', 'يوم راحة في المعدّل')}</div><div><b>${s.moins3}</b>${L('matchs à moins de 3 jours', 'مباراة بعد أقلّ من 3 أيام')}</div><div><b>${s.w30.n}</b>${L('max. en 30 jours', 'الأقصى في 30 يومًا')}</div></section>`;
      if (s.sansDate) h += `<p class="tool-sum daf-warn">${s.sansDate} ${L('match(s) sans date connue dans la période : comptés dans le total, pas dans les jours de repos.', 'مباراة دون تاريخ معروف في الفترة: تُحتسب في المجموع لا في أيام الراحة.')}</p>`;
      const R = s.repos;
      h += `<h3>${L('Résultats selon les jours de repos', 'النتائج حسب أيام الراحة')}</h3><div class="table-wrap"><table class="a-table cal-t"><thead><tr><th>${L('Jours depuis le match précédent', 'أيام منذ المباراة السابقة')}</th><th>${L('Matchs', 'المباريات')}</th><th>${L('V', 'ف')}</th><th>${L('N', 'ت')}</th><th>${L('D', 'خ')}</th><th>${L('% victoires', '% الانتصارات')}</th></tr></thead><tbody>` +
        R.map(r => `<tr><td>${r.lab}</td><td>${r.n}</td><td>${r.V}</td><td>${r.N}</td><td>${r.D}</td><td>${r.n ? Math.round(r.V / r.n * 100) + ' %' : '–'}</td></tr>`).join('') +
        `</tbody></table></div><p class="tool-sum">${L('Lecture descriptive : ces chiffres ne prouvent pas que le repos explique les résultats.', 'قراءة وصفية: هذه الأرقام لا تثبت أنّ الراحة تفسّر النتائج.')}</p>`;
      h += `<h3>${L('Tous les matchs', 'كلّ المباريات')}</h3>` + mtable(s.dated.concat(s.undated), club);
      $('#calOut').innerHTML = h;
      $('#calClub').onchange = e => { club = e.target.value; draw(); };
      $('#calCsv').onclick = () => { const ms = s.dated.concat(s.undated); csv([['date', 'competition', 'phase', 'dom', 'ext', 'score', 'repos']].concat(ms.map((m, i) => [m.d, cn(m.c), m.ph, name(m.h), name(m.a), m.bh === '' ? '' : m.bh + '-' + m.ba, i && m.d && ms[i - 1].d ? C.days(ms[i - 1].d, m.d) : ''])), club + '.csv'); };
    }
    function vCharge(f) {
      const sel = clubs.slice(0, 4);
      let h = `<p class="tool-sum">${L('Matchs par semaine ; la période de 30 jours la plus chargée est surlignée. Clubs : ceux de l’onglet « Comparer ».', 'المباريات أسبوعيًا؛ الفترة الأكثر ازدحامًا خلال 30 يومًا مظلّلة. الأندية: أندية تبويب «مقارنة».')}</p>`;
      const t0 = Date.parse(f.de), t1 = Date.parse(f.a), W = Math.max(1, Math.ceil((t1 - t0) / 6048e5));
      const w = 900, bh = 60;
      sel.forEach(c => {
        const s = C.stats(M, c, f), bins = new Array(W).fill(0);
        s.dated.forEach(m => { const k = Math.floor((Date.parse(m.d) - t0) / 6048e5); if (k >= 0 && k < W) bins[k]++; });
        const mx = Math.max(2, ...bins), bw = w / W;
        const hl = s.w30.from ? [(Date.parse(s.w30.from) - t0) / 6048e5 * bw, (Date.parse(s.w30.to) - Date.parse(s.w30.from) + 864e5) / 6048e5 * bw] : null;
        h += `<div class="cal-card"><h3>${esc(name(c))} · ${s.matchs} ${L('matchs', 'مباراة')}${s.w30.n ? `<small>${L('Pic', 'الذروة')} : ` + mlink(s.w30.n + L(' en 30 jours', ' في 30 يومًا'), s.w30.matches, name(c)) + ` (${fr(s.w30.from)} → ${fr(s.w30.to)})</small>` : ''}</h3>
          <svg class="cal-svg" viewBox="0 0 ${w} ${bh + 16}" role="img" aria-label="${esc(name(c))}">${hl ? `<rect x="${hl[0]}" y="0" width="${Math.max(2, hl[1])}" height="${bh}" class="hl"/>` : ''}` +
          bins.map((v, i) => v ? `<rect x="${i * bw}" y="${bh - v / mx * bh}" width="${Math.max(1, bw - 1)}" rx="1" height="${v / mx * bh}" class="b"><title>${v}</title></rect>` : '').join('') +
          `<text x="0" y="${bh + 14}">${fr(f.de)}</text><text x="${w}" y="${bh + 14}" text-anchor="end">${fr(f.a)}</text></svg></div>`;
      });
      $('#calOut').innerHTML = h;
    }
    function vRecords(f) {
      const S = allStats(f);
      const best = (fn, lab, list, asc) => { let b = null; S.forEach(s => { const v = fn(s); if (v === null || v === undefined) return; if (!b || (asc ? v < b.v : v > b.v)) b = { s, v }; }); return b ? { lab, ...b, ms: list ? list(b.s) : null } : null; };
      const yearMax = (() => { let b = null; S.forEach(s => Object.entries(s.parAnnee).forEach(([y, v]) => { if (y >= f.de.slice(0, 4) && y <= f.a.slice(0, 4) && (!b || v > b.v)) b = { s, v, y }; })); return b; })();
      const R = [
        yearMax && { lab: L('Le plus de matchs sur une année civile', 'أكثر عدد مباريات في سنة ميلادية') + ` (${yearMax.y})`, s: yearMax.s, v: yearMax.v, ms: yearMax.s.dated.filter(m => m.d.startsWith(yearMax.y)) },
        best(s => s.w30.n, L('Le plus de matchs en 30 jours', 'أكثر عدد مباريات في 30 يومًا'), s => s.w30.matches),
        best(s => s.w60.n, L('Le plus de matchs en 60 jours', 'أكثر عدد مباريات في 60 يومًا'), s => s.w60.matches),
        best(s => s.w90.n, L('Le plus de matchs en 90 jours', 'أكثر عدد مباريات في 90 يومًا'), s => s.w90.matches),
        best(s => s.gapMin, L('Le repos le plus court entre deux matchs (jours)', 'أقصر راحة بين مباراتين (أيام)'), s => { const i = s.dated.findIndex((m, k) => k && C.days(s.dated[k - 1].d, m.d) === s.gapMin); return s.dated.slice(i - 1, i + 1); }, 1),
        best(s => s.moins3, L('Le plus de matchs à moins de 3 jours du précédent', 'أكثر مباريات بعد أقلّ من 3 أيام'), IND.moins3[2]),
        best(s => s.serie3.n, L('La plus longue série de matchs à ≤ 3 jours d’écart', 'أطول سلسلة مباريات بفارق ≤ 3 أيام'), s => s.serie3.matches),
        best(s => s.serieExt.n, L('La plus longue série à l’extérieur', 'أطول سلسلة خارج الديار'), s => s.serieExt.matches),
        best(s => s.intl.n, L('Le plus de matchs internationaux en 90 jours', 'أكثر مباريات دولية في 90 يومًا'), s => s.intl.matches)
      ].filter(Boolean);
      $('#calOut').innerHTML = `<div class="cal-recs">` + R.map(r => `<article class="cal-rec"><span>${esc(r.lab)}</span><b>${r.ms ? mlink(r.v, r.ms, r.lab) : r.v}</b><em>${esc(name(r.s.club))}${prov(r.s)}</em>${r.ms && r.ms.length ? `<small>${fr(r.ms[0].d)} → ${fr(r.ms[r.ms.length - 1].d)}</small>` : ''}</article>`).join('') + `</div>
        <p class="tool-sum">${L('Records recalculés sur la période et les compétitions choisies. « Provisoire » : le club a des matchs sans date connue dans la période.', 'أرقام محسوبة على الفترة والمسابقات المختارة. «مؤقّت»: للنادي مباريات دون تاريخ معروف في الفترة.')}</p>`;
    }
    function vCouverture(f) {
      const y0 = +f.de.slice(0, 4) - 1, y1 = +f.a.slice(0, 4);
      const rows = D.cov.filter(r => +String(r[1]).slice(0, 4) >= y0 && +String(r[1]).slice(0, 4) <= y1);
      const ss = [...new Set(rows.map(r => r[1]))].sort(), cs = [...new Set(rows.map(r => r[0]))];
      $('#calOut').innerHTML = `<p class="tool-sum">${L('Matchs datés / matchs connus, par compétition et saison (clubs tunisiens).', 'المباريات المؤرّخة / المباريات المعروفة، حسب المسابقة والموسم (الأندية التونسية).')}</p><div class="table-wrap"><table class="a-table cal-t"><thead><tr><th>${L('Saison', 'الموسم')}</th>${cs.map(c => `<th>${esc(cn(c))}</th>`).join('')}</tr></thead><tbody>` +
        ss.map(s => `<tr><td>${s}</td>${cs.map(c => { const r = rows.find(x => x[0] === c && x[1] === s); return `<td class="${!r ? '' : r[2] === r[3] ? 'ok' : 'part'}">${r ? r[2] + '/' + r[3] : '–'}</td>`; }).join('')}</tr>`).join('') +
        `</tbody></table></div><p class="tool-sum">${L('« – » : aucune donnée pour cette compétition et cette saison (compétition non couverte ou club tunisien absent).', '«–»: لا معطيات لهذه المسابقة وهذا الموسم.')}</p>`;
    }
    function draw() {
      LIST.length = 0; const f = F();
      if (f.de > f.a) [de.value, a.value] = [a.value, de.value];
      $$('.cal-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.v === view));
      ({ classement: vClassement, comparer: vComparer, club: vClub, charge: vCharge, records: vRecords, couverture: vCouverture }[view] || vClassement)(F());
      save();
    }
    draw();
  });
})();
