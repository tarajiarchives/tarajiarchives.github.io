/* Taraji Archives : outils (comparer, période, parcours, matchs, frise, quiz, recherche) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const J = {};
  const load = n => J[n] || (J[n] = fetch((window.TA_ROOT || '') + (n.startsWith('api/') ? n : 'assets/data/' + n), { cache: 'no-cache' }).then(r => r.json()));
  const params = new URLSearchParams(location.search);
  const setParams = o => { const u = new URL(location); Object.entries(o).forEach(([k, v]) => v ? u.searchParams.set(k, v) : u.searchParams.delete(k)); history.replaceState(null, '', u); };
  const EST = 'esperance-tunis';
  const PH = { prelim: 'Tours préliminaires', poules: 'Phase de poules', quarts: 'Quarts de finale', demis: 'Demi-finales', finale: 'Finale' };
  const PHR = { prelim: 0, poules: 1, quarts: 2, demis: 3, finale: 4 };
  let C = {};
  const nm = id => (C[id] && C[id].n) || id;
  const initials = id => { if (C[id] && C[id].s) return C[id].s; const w = nm(id).replace(/[^A-Za-zÀ-ÿ0-9 ]/g, ' ').split(/\s+/).filter(x => x && x[0] === x[0].toUpperCase()); return (w.length > 1 ? w.map(x => x[0]).join('') : nm(id).slice(0, 3)).slice(0, 4).toUpperCase(); };
  const badge = id => `<span class="badge" style="background:${(C[id] && C[id].c) || '#8A7F7A'}">${esc(initials(id))}</span>`;
  const pl = (n, s, p) => n + ' ' + (n > 1 ? (p || s + 's') : s);
  const opt = (id, sel) => `<option value="${esc(id)}"${id === sel ? ' selected' : ''}>${esc(nm(id))}</option>`;

  // ------------------------------------------------------------ comparer
  let BWMIN = 3;
  async function comparer() {
    const [clubs, L, K, H] = await Promise.all([load('clubs.json'), load('l1.json'), load('caf.json'), load('h2h.json').catch(() => [])]); C = clubs;
    const titles = {}; L.lignes.forEach(r => { if (r[11] === 'Champion') titles[r[1]] = (titles[r[1]] || 0) + 1; });
    const l1 = [...new Set(L.lignes.map(r => r[1]))].sort((a, b) => (titles[b] || 0) - (titles[a] || 0) || nm(a).localeCompare(nm(b)));
    const caf = [...new Set(K.parcours.map(p => p[1]))].filter(c => !l1.includes(c)).sort((a, b) => nm(a).localeCompare(nm(b)));
    const sa = $('#cmpA'), sb = $('#cmpB');
    let A = params.get('a') || EST, B = params.get('b') || (A === EST ? 'club-africain' : EST);
    const fill = (s, v) => s.innerHTML = `<optgroup label="Ligue 1 tunisienne">${l1.map(c => opt(c, v)).join('')}</optgroup><optgroup label="Autres clubs africains">${caf.map(c => opt(c, v)).join('')}</optgroup>`;
    fill(sa, A); fill(sb, B);
    const stats = id => {
      const rows = L.lignes.filter(r => r[1] === id && r[3] > 0);
      const s = { saisons: rows.length, titres: 0, deux: 0, trois: 0, releg: 0, j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0, best: null, sumr: 0, nr: 0 };
      rows.forEach(r => { if (r[11] === 'Champion') s.titres++; if (r[2] === 2) s.deux++; if (r[2] === 3) s.trois++; if (r[11] === 'Relégué') s.releg++;
        s.j += r[3]; s.v += r[4]; s.n += r[5]; s.d += r[6]; s.bp += r[7]; s.bc += r[8]; if (r[2]) { s.sumr += r[2]; s.nr++; s.best = s.best ? Math.min(s.best, r[2]) : r[2]; } });
      const P = K.parcours.filter(p => p[1] === id), M = K.matchs.filter(m => m[9] && (m[5] === id || m[6] === id));
      s.cafp = P.length; s.cafw = K.editions.filter(e => e[1] === id).length; s.caff = K.editions.filter(e => e[2] === id).length;
      s.cafbest = P.reduce((b, p) => Math.max(b, PHR[p[2]] ?? -1), -1); s.cafm = M.length;
      s.cafv = M.filter(m => (m[5] === id ? m[7] > m[8] : m[8] > m[7])).length;
      return s;
    };
    const draw = () => {
      A = sa.value; B = sb.value; setParams({ a: A, b: B });
      const a = stats(A), b = stats(B);
      const both = L.saisons.filter(s => L.lignes.some(r => r[0] === s && r[1] === A && r[2]) && L.lignes.some(r => r[0] === s && r[1] === B && r[2]));
      let ahead = 0, behind = 0;
      both.forEach(s => { const ra = L.lignes.find(r => r[0] === s && r[1] === A)[2], rb = L.lignes.find(r => r[0] === s && r[1] === B)[2]; if (ra < rb) ahead++; else behind++; });
      const row = (lab, x, y, low) => { const wa = low ? x < y : x > y, wb = low ? y < x : y > x;
        return `<div class="cmp-row"><span class="a${wa ? ' win' : ''}">${x ?? '–'}</span><span class="lab">${lab}</span><span class="b${wb ? ' win' : ''}">${y ?? '–'}</span></div>`; };
      const mean = s => s.nr ? Math.round(s.sumr / s.nr * 10) / 10 : null;
      const h2h = K.matchs.filter(m => m[9] && ((m[5] === A && m[6] === B) || (m[5] === B && m[6] === A))).reverse();
      const hv = h2h.filter(m => (m[5] === A ? m[7] > m[8] : m[8] > m[7])).length, hd = h2h.filter(m => m[7] === m[8]).length;
      let html = `<div class="cmp-head"><h2>${badge(A)}${esc(nm(A))}</h2><span class="vs">contre</span><h2>${badge(B)}${esc(nm(B))}</h2></div>`;
      const headLen = html.length;
      if (a.saisons || b.saisons) html += `<h3>Palmarès en Ligue 1</h3><div class="cmp-rows">${row('Titres de champion', a.titres, b.titres)}${row('Deuxièmes places', a.deux, b.deux)}${row('Podiums', a.titres + a.deux + a.trois, b.titres + b.deux + b.trois)}${row('Saisons en Ligue 1', a.saisons + (A === EST ? 1 : 0), b.saisons + (B === EST ? 1 : 0))}${row('Classement moyen', mean(a), mean(b), true)}${row('Matchs gagnés', a.v, b.v)}${row('Buts marqués', a.bp, b.bp)}${row('Relégations', a.releg, b.releg, true)}${both.length ? row(`Mieux classé que l'autre (${pl(both.length, 'saison')} en commun)`, ahead, behind) : ''}</div>`;
      // face à face en Ligue 1
      const HM = H.filter(m => (m[2] === A && m[3] === B) || (m[2] === B && m[3] === A));
      if (HM.length) {
        const gA = m => m[2] === A ? m[4] : m[5], gB = m => m[2] === A ? m[5] : m[4];
        const wa = HM.filter(m => gA(m) > gB(m)), wb = HM.filter(m => gB(m) > gA(m)), dr = HM.length - wa.length - wb.length;
        const big = L2 => L2.slice().sort((x, y) => (Math.abs(gA(y) - gB(y)) - Math.abs(gA(x) - gB(x))) || (Math.max(gA(y), gB(y)) - Math.max(gA(x), gB(x))))[0];
        const sorted = HM.slice().sort((x, y) => (y[0] + y[1]).localeCompare(x[0] + x[1]));
        let st = 0, who = null; for (const m of sorted) { const r = gA(m) > gB(m) ? 'A' : gB(m) > gA(m) ? 'B' : 'N'; if (who === null) who = r; if (r !== who) break; st++; }
        const serie = who === 'N' ? `${pl(st, 'nul')} de suite` : `${st} victoire${st > 1 ? 's' : ''} de suite pour ${esc(nm(who === 'A' ? A : B))}`;
        const sc = m => `${esc(nm(m[2]))} ${m[4]}-${m[5]} ${esc(nm(m[3]))} (${esc(m[0])})`;
        const bw = big(wa), bl = big(wb);
        const decs = {}; HM.forEach(m => { const d = Math.floor(+m[0].slice(0, 4) / 10) * 10; const o = decs[d] || (decs[d] = [0, 0, 0]); o[gA(m) > gB(m) ? 0 : gA(m) === gB(m) ? 1 : 2]++; });
        const dmax = Math.max(...Object.values(decs).map(o => o[0] + o[1] + o[2]));
        html = html.slice(0, headLen) + `<h3 id="h2h">Face à face en Ligue 1 : ${pl(HM.length, 'match')}</h3>
        <div class="cmp-rows">${row('Victoires', wa.length, wb.length)}${row('Matchs nuls', dr, dr)}${row('Buts marqués', HM.reduce((t, m) => t + gA(m), 0), HM.reduce((t, m) => t + gB(m), 0))}${row('Victoires à domicile', wa.filter(m => m[2] === A).length, wb.filter(m => m[2] === B).length)}${row('Victoires à l\'extérieur', wa.filter(m => m[3] === A).length, wb.filter(m => m[3] === B).length)}</div>
        <p class="tool-sum">Série en cours : <b>${serie}</b> · dernier match : ${sc(sorted[0])}</p>
        <h3 class="h2h-sub">Les larges victoires <small class="bw-note">(<select id="bwMin" aria-label="Écart minimal">${[2, 3, 4, 5].map(n => `<option value="${n}"${n === BWMIN ? ' selected' : ''}>${n}</option>`).join('')}</select> buts d'écart ou plus)</small></h3>
        <div class="bw-wrap">${bigBlock([[nm(A), wa.map(m => ({ g: gA(m), p: gB(m), html: sc(m) + (m[1] ? ' · ' + esc(m[1].split('-').reverse().join('/')) : '') }))], [nm(B), wb.map(m => ({ g: gB(m), p: gA(m), html: sc(m) + (m[1] ? ' · ' + esc(m[1].split('-').reverse().join('/')) : '') }))]], BWMIN, W => { const w = W.slice().sort((p, q) => (q.g - q.p) - (p.g - p.p) || q.g - p.g)[0]; return w ? `<b>${w.g}-${w.p}</b> · ${w.html}` : ''; })}</div>
        <div class="h2h-dec">${Object.entries(decs).map(([d, o]) => `<div><span>${d}</span><b style="width:${(o[0] + o[1] + o[2]) / dmax * 100}%"><i style="flex:${o[0]};background:#B5121B"></i><i style="flex:${o[1]};background:#CDBFA8"></i><i style="flex:${o[2]};background:#C89200"></i></b><small>${o[0]}-${o[1]}-${o[2]}</small></div>`).join('')}</div>
        <p class="tool-sum"><i style="display:inline-block;width:12px;height:12px;background:#B5121B"></i> ${esc(nm(A))} &nbsp; <i style="display:inline-block;width:12px;height:12px;background:#CDBFA8"></i> nul &nbsp; <i style="display:inline-block;width:12px;height:12px;background:#C89200"></i> ${esc(nm(B))} · par décennie</p>
        <details class="h2h-all"><summary>Tous les matchs, saison par saison (${HM.length})</summary><div class="h2h-seasons">${(() => { const S = {}; sorted.forEach(m => (S[m[0]] = S[m[0]] || []).push(m));
          return Object.entries(S).map(([s, G]) => { const v = G.filter(m => gA(m) > gB(m)).length, d = G.filter(m => gA(m) < gB(m)).length, n = G.length - v - d;
            return `<details class="h2h-s"><summary><b>${esc(s)}</b><span>${pl(G.length, 'match')}</span><span class="rec"><i class="v">${v}</i> <i class="n">${n}</i> <i class="d">${d}</i></span><span class="sc">${G.map(m => `<b class="${gA(m) > gB(m) ? 'w' : gA(m) < gB(m) ? 'l' : ''}">${gA(m)}-${gB(m)}</b>`).join(' ')}</span></summary>
              <div class="table-wrap"><table class="a-table">${G.map(m => { const r = gA(m) > gB(m) ? 'w' : gA(m) < gB(m) ? 'l' : ''; return `<tr><td>${esc(m[1] ? m[1].split('-').reverse().join('/') : 'date inconnue')}</td><td>${esc(m[6] || 'saison régulière')}</td><td>${esc(nm(m[2]))}</td><td class="${r}"><b>${m[4]}-${m[5]}</b></td><td>${esc(nm(m[3]))}</td></tr>`; }).join('')}</table></div></details>`; }).join(''); })()}</div>
          <p class="tool-sum">Sur chaque ligne : victoires de ${esc(nm(A))} · nuls · victoires de ${esc(nm(B))}, puis les scores vus du côté de ${esc(nm(A))}. Cliquez sur + pour la date, le lieu et la phase. La date n'est connue que pour une partie des matchs anciens.</p></details>
        <p class="src">Face à face : matchs de championnat (poules et play-offs compris) depuis 1955-56. Source : Kawarji ; saison en cours d'après Wikipédia.</p>` + html.slice(headLen);
      }
      html += `<h3>Palmarès en Ligue des champions</h3><div class="cmp-rows">${row('Titres', a.cafw, b.cafw)}${row('Finales', a.cafw + a.caff, b.cafw + b.caff)}${row('Participations', a.cafp, b.cafp)}${row('Matchs joués', a.cafm, b.cafm)}${row('Victoires', a.cafv, b.cafv)}${row('Meilleur parcours', a.cafbest >= 0 ? Object.values(PH)[a.cafbest] : '–', b.cafbest >= 0 ? Object.values(PH)[b.cafbest] : '–')}</div>`;
      if (h2h.length) html += `<h3>Face à face en Afrique : ${pl(h2h.length, 'match')}</h3><p class="tool-sum">${esc(nm(A))} : ${pl(hv, 'victoire')} · ${pl(hd, 'nul')} · ${esc(nm(B))} : ${pl(h2h.length - hv - hd, 'victoire')}</p><div class="table-wrap"><table class="a-table">${h2h.map(m => `<tr><td>${esc(m[0])}</td><td>${esc(m[1])}</td><td>${esc(nm(m[5]))}</td><td><b>${m[7]}-${m[8]}</b></td><td>${esc(nm(m[6]))}</td></tr>`).join('')}</table></div>`;
      else html += `<p class="tool-sum">Aucune confrontation directe en Ligue des champions.</p>`;
      if (A === EST || B === EST) html += `<p class="tool-sum">Espérance : la saison 1970-71 compte dans ses saisons en Ligue 1, mais ses résultats, annulés après la dissolution de la section football, ne figurent pas dans les statistiques.</p>`;
      if (a.saisons && b.saisons) html += `<h3>Classement final, saison par saison</h3>${rankChart(L, [[A, '#B5121B'], [B, '#C89200']])}`;
      $('#cmpOut').innerHTML = html;
      const bm = $('#bwMin'); if (bm) bm.onchange = () => { BWMIN = +bm.value; draw(); };
    };
    sa.onchange = sb.onchange = draw;
    $('#cmpSwap').onclick = () => { [sa.value, sb.value] = [sb.value, sa.value]; draw(); };
    draw();
  }
  // ------------------------------------------------------------ larges victoires (commun)
  // L : [{g, p, html}] matchs gagnés du point de vue du vainqueur (g buts marqués, p encaissés)
  const bigWins = (L, min) => {
    const big = L.filter(x => x.g - x.p >= min), groups = {};
    big.forEach(x => (groups[x.g + '-' + x.p] = groups[x.g + '-' + x.p] || []).push(x));
    const keys = Object.keys(groups).sort((a, b) => { const [ag, ap] = a.split('-').map(Number), [bg, bp] = b.split('-').map(Number); return (bg - bp) - (ag - ap) || bg - ag; });
    return { n: big.length, chips: keys.map(k => `<details class="bw"><summary><b>${k}</b>${groups[k].length > 1 ? ` <small>×${groups[k].length}</small>` : ''}</summary><ul>${groups[k].map(x => `<li>${x.html}</li>`).join('')}</ul></details>`).join('') };
  };
  const bigBlock = (sides, min, best) => sides.map(([name, L]) => { const r = bigWins(L, min);
    return `<div class="bw-side"><p class="bw-h"><b>${esc(name)}</b> : ${r.n ? r.n + (r.n > 1 ? ' larges victoires' : ' large victoire') : 'aucune large victoire'}</p>${r.n ? `<div class="bw-list">${r.chips}</div>` : (best(L) ? `<p class="tool-sum">Plus large victoire : ${best(L)}</p>` : '')}</div>`; }).join('');

  // ------------------------------------------------------------ face à face africain (club / pays)
  // ------------------------------------------------------------ combobox de recherche (clubs / pays)
  // sel : <select> caché, source de vérité (valeur, événement change) ; items : [{v, label, sub, grp, key, rank}]
  const nrm = s => String(s || '').normalize('NFD').replace(/[̀-ًͯ-ٰٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const T = s => (window.TA_LANG === 'ar' && window.taTr) ? window.taTr(s) : s;
  function combo(root, sel, items, onPick) {
    const inp = root.querySelector('input'), ul = root.querySelector('ul'), live = $('#dafLive');
    let shown = [], act = -1, open = false;
    const byV = new Map(items.map(x => [x.v, x]));
    const show = x => x ? x.label : '';
    const sync = () => { inp.value = show(byV.get(sel.value)); };
    const close = restore => { open = false; ul.hidden = true; inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); act = -1; if (restore) sync(); };
    const setAct = i => { act = i; [...ul.querySelectorAll('[role=option]')].forEach((li, k) => li.setAttribute('aria-selected', k === i ? 'true' : 'false'));
      const li = ul.querySelector(`[data-i="${i}"]`); if (li) { inp.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); } };
    const render = q => {
      const n = nrm(q); let res;
      if (!n) res = items.filter(x => x.grp === 'p').concat(items.filter(x => x.grp === 'c').slice(0, 40));
      else {
        const words = n.split(' ');
        res = items.map(x => { if (!words.every(w => x.key.includes(w))) return null; const nl = nrm(x.label);
            return { x, s: (nl === n ? 0 : nl.startsWith(n) ? 1 : (' ' + x.key).includes(' ' + words[0]) ? 2 : 3) * 1e6 - x.rank }; })
          .filter(Boolean).sort((a, b) => a.s - b.s).slice(0, 60).map(r => r.x);
      }
      shown = res;
      let h = '', lastG = '';
      res.forEach((x, i) => { const g = !n ? (x.grp === 'p' ? T('Pays (tous leurs clubs)') : T('Clubs les plus présents')) : '';
        if (g && g !== lastG) { h += `<li role="presentation" class="cbx-g">${esc(g)}</li>`; lastG = g; }
        h += `<li role="option" id="${ul.id}-${i}" data-i="${i}" aria-selected="false" class="${x.grp === 'p' ? 'is-p' : ''}${x.v === sel.value ? ' is-cur' : ''}">${x.grp === 'p' ? `<span class="cbx-tag">${esc(T('Pays'))}</span>` : badge(x.v)}<span class="cbx-n">${esc(x.label)}</span><small>${esc(x.sub)}</small></li>`; });
      if (!res.length) h = `<li role="presentation" class="cbx-none">${esc(T('Aucun résultat'))}</li>`;
      ul.innerHTML = h; ul.hidden = false; open = true; inp.setAttribute('aria-expanded', 'true');
      live.textContent = res.length ? (n ? res.length + ' ' + T(res.length > 1 ? 'résultats' : 'résultat') : '') : T('Aucun résultat');
      setAct(n && res.length ? 0 : -1);
    };
    const pick = i => { const x = shown[i]; if (!x) return; sel.value = x.v; close(); sync(); onPick(); };
    inp.addEventListener('focus', () => { inp.select(); render(''); });
    inp.addEventListener('click', () => { if (!open) render(''); });
    inp.addEventListener('input', () => render(inp.value));
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) render(''); setAct(Math.min(act + 1, shown.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(Math.max(act - 1, 0)); }
      else if (e.key === 'Enter') { if (open && act >= 0) { e.preventDefault(); pick(act); } }
      else if (e.key === 'Escape') { if (open) { e.preventDefault(); close(true); } }
      else if (e.key === 'Tab') close(true);
    });
    ul.addEventListener('mousedown', e => e.preventDefault()); // garde le focus dans le champ
    ul.addEventListener('click', e => { const li = e.target.closest('[role=option]'); if (li) pick(+li.dataset.i); });
    inp.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== inp) close(true); }, 120));
    document.addEventListener('ta-ar-ready', () => { items.forEach(x => { x.label = T(x.fr); x.sub = T(x.subfr); }); sync(); });
    sync();
    return { sync };
  }

  // ------------------------------------------------------------ face à face africain (club / pays)
  async function duelAfrique() {
    const [clubs, K, PA] = await Promise.all([load('clubs.json'), load('caf.json'), load('pays.json').catch(() => ({}))]); C = clubs;
    const AR = window.TA_LANG === 'ar';
    const pays = id => (C[id] && C[id].p) || '';
    const M0 = K.matchs.filter(m => m[9]);
    const played = new Set(M0.flatMap(m => [m[5], m[6]]));
    const nbm = {}; M0.forEach(m => { nbm[m[5]] = (nbm[m[5]] || 0) + 1; nbm[m[6]] = (nbm[m[6]] || 0) + 1; });
    const P = [...new Set([...played].map(pays).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const byP = {}; [...played].forEach(c => (byP[pays(c)] = byP[pays(c)] || []).push(c));
    const nbp = {}; P.forEach(p => nbp[p] = byP[p].reduce((s, c) => s + (nbm[c] || 0), 0));
    const fill = s => s.innerHTML = P.map(p => `<option value="p:${esc(p)}">${esc(p)}</option>`).join('') + [...played].map(c => `<option value="${esc(c)}">${esc(nm(c))}</option>`).join('');
    const sa = $('#dafA'), sb = $('#dafB'), se = $('#dafEp'), sp = $('#dafPh'), sl = $('#dafLieu');
    fill(sa); fill(sb);
    const valid = v => v && (v.startsWith('p:') ? P.includes(v.slice(2)) : played.has(v));
    const okIn = (el, v) => [...el.options].some(o => o.value === v) ? v : '';
    let A = params.get('a'), B = params.get('b'), bad = [];
    if (A && !valid(A)) { bad.push(A); A = ''; } if (B && !valid(B)) { bad.push(B); B = ''; }
    sa.value = A || EST; sb.value = B || 'p:Égypte';
    se.value = okIn(se, params.get('ep') || ''); sp.value = okIn(sp, params.get('ph') || ''); sl.value = okIn(sl, params.get('lieu') || '');
    const msg = t => { const m = $('#dafMsg'); m.textContent = t; clearTimeout(msg.k); if (t) msg.k = setTimeout(() => m.textContent = '', 6000); };
    if (bad.length) msg(T('Lien incomplet : club ou pays introuvable, sélection par défaut affichée.'));
    // éléments de recherche
    const items = P.map(p => ({ v: 'p:' + p, grp: 'p', fr: p, subfr: byP[p].length + ' clubs', rank: nbp[p] * 1000,
        key: nrm([p, PA[p] || '', 'pays'].join(' ')) }))
      .concat([...played].map(c => ({ v: c, grp: 'c', fr: nm(c), subfr: pays(c), rank: nbm[c] || 0,
        key: nrm([nm(c), C[c].ar || '', C[c].s || '', (C[c].v || '').replace(/\|/g, ' '), pays(c), PA[pays(c)] || ''].join(' ')) })))
      .sort((a, b) => b.rank - a.rank);
    items.forEach(x => { x.label = T(x.fr); x.sub = T(x.subfr); });
    const label = v => v.startsWith('p:') ? 'les clubs de ' + v.slice(2) : nm(v);
    const short = v => v.startsWith('p:') ? v.slice(2) : nm(v);
    const inS = (v, c) => v.startsWith('p:') ? pays(c) === v.slice(2) : c === v;
    const elim = {}; K.parcours.forEach(p => { if (p[4]) elim[p[0] + '|' + p[1]] = p[4]; });
    const sc = m => `${esc(m[0])} · ${esc(m[1])}${m[3] === 'aller' || m[3] === 'retour' ? ' (' + esc(m[3]) + ')' : ''} : ${esc(nm(m[5]))} ${m[7]}-${m[8]} ${esc(nm(m[6]))}${m[4] ? ' · ' + esc(m[4].split('-').reverse().join('/')) : ''}`;
    const tally = L => { const t = { j: L.length, v: 0, n: 0, d: 0, bp: 0, bc: 0 }; L.forEach(x => { t.bp += x.ga; t.bc += x.gb; x.ga > x.gb ? t.v++ : x.ga < x.gb ? t.d++ : t.n++; }); return t; };
    const keep = m => { const y = +m[0].slice(0, 4); if (se.value === 'ccc' && y >= 1997) return false; if (se.value === 'ldc' && y < 1997) return false;
      const ko = m[3] !== 'poule'; if (sp.value === 'ko' && !ko) return false; if (sp.value === 'poules' && ko) return false; return true; };
    const lieuOf = (m, aHome) => m[3] === 'unique' || m[3] === 'appui' ? 'neu' : aHome ? 'dom' : 'ext';
    const actifs = () => [se.value && se.selectedOptions[0].textContent, sp.value && sp.selectedOptions[0].textContent, sl.value && sl.selectedOptions[0].textContent].filter(Boolean);
    const filtNote = () => { const f = actifs(); return f.length ? T('Filtres appliqués :') + ' ' + f.join(' · ') : T('Toutes époques, phases et lieux.'); };
    const draw = () => {
      A = sa.value; B = sb.value; setParams({ a: A, b: B, ep: se.value, ph: sp.value, lieu: sl.value });
      cA.sync(); cB.sync();
      const f = actifs(); $('#dafFon').textContent = f.length ? '(' + f.length + ') ' + f.join(' · ') : '';
      const out = $('#dafOut');
      const head = `<div class="cmp-head"><h2>${A.startsWith('p:') ? '' : badge(A)}${esc(short(A))}</h2><span class="vs">contre</span><h2>${B.startsWith('p:') ? '' : badge(B)}${esc(short(B))}</h2></div>`;
      if (A === B) { out.innerHTML = head + `<p class="tool-sum daf-warn">${A.startsWith('p:') ? 'Choisissez deux côtés différents : par exemple un club contre un pays, ou deux pays.' : 'Choisissez deux clubs différents : un club ne peut pas être comparé à lui-même.'}</p>`; return; }
      // club contre son propre pays : on compte ses matchs contre les autres clubs de ce pays (explicite)
      let note = '';
      if (!A.startsWith('p:') && B.startsWith('p:') && pays(A) === B.slice(2)) note = `Matchs de ${esc(nm(A))} contre les autres clubs de ${esc(B.slice(2))} en Ligue des champions (rencontres entre clubs du même pays).`;
      if (A.startsWith('p:') && !B.startsWith('p:') && pays(B) === A.slice(2)) note = `Matchs de ${esc(nm(B))} contre les autres clubs de ${esc(A.slice(2))} en Ligue des champions (rencontres entre clubs du même pays).`;
      // matchs orientés du point de vue du côté A
      let L = [];
      M0.forEach(m => {
        if (!keep(m)) return;
        let o = null;
        if (inS(A, m[5]) && inS(B, m[6]) && !(inS(A, m[6]) && inS(B, m[5]) && m[5] > m[6])) o = { m, a: m[5], b: m[6], ga: m[7], gb: m[8], lieu: lieuOf(m, true) };
        else if (inS(A, m[6]) && inS(B, m[5])) o = { m, a: m[6], b: m[5], ga: m[8], gb: m[7], lieu: lieuOf(m, false) };
        if (!o || o.a === o.b) return;
        if (sl.value && o.lieu !== sl.value) return;
        L.push(o);
      });
      L.reverse();
      let html = head + (note ? `<p class="tool-sum daf-note">${note}</p>` : '') + `<p class="daf-scope">${esc(filtNote())}</p>`;
      if (!L.length) { out.innerHTML = html + `<p class="tool-sum daf-warn">Aucun match entre ${esc(label(A))} et ${esc(label(B))} en Ligue des champions${actifs().length ? ' avec ces filtres' : ''}.</p>` + nationsTable(); bindNations(); live(0); return; }
      const t = tally(L);
      const row = (lab, x, y) => `<div class="cmp-row"><span class="a${x > y ? ' win' : ''}">${x}</span><span class="lab">${lab}</span><span class="b${y > x ? ' win' : ''}">${y}</span></div>`;
      const ties = {}; L.filter(x => x.m[3] === 'aller' || x.m[3] === 'retour' || x.m[3] === 'unique' || x.m[3] === 'appui').forEach(x => { const k = x.m[0] + '|' + x.m[1] + '|' + x.a + '|' + x.b; (ties[k] = ties[k] || { a: x.a, b: x.b, ed: x.m[0], L: [] }).L.push(x); });
      let qa = 0, qb = 0; const tieList = Object.values(ties).map(T2 => { const q = elim[T2.ed + '|' + T2.b] === T2.a ? 'A' : elim[T2.ed + '|' + T2.a] === T2.b ? 'B' : ''; if (q === 'A') qa++; if (q === 'B') qb++; return { ...T2, q }; });
      html += `<h3>Bilan : ${pl(t.j, 'match')}</h3><div class="daf-kpi"><span><b>${t.v}</b>V</span><span><b>${t.n}</b>N</span><span><b>${t.d}</b>D</span><span><b>${t.bp}-${t.bc}</b>${'Buts'}</span>${qa + qb ? `<span><b>${qa}-${qb}</b>${'Qualifications'}</span>` : ''}</div>
        <div class="cmp-rows">${row('Victoires', t.v, t.d)}${row('Matchs nuls', t.n, t.n)}${row('Buts marqués', t.bp, t.bc)}${row('Victoires à domicile', L.filter(x => x.lieu === 'dom' && x.ga > x.gb).length, L.filter(x => x.lieu === 'ext' && x.ga < x.gb).length)}${row('Victoires à l\'extérieur', L.filter(x => x.lieu === 'ext' && x.ga > x.gb).length, L.filter(x => x.lieu === 'dom' && x.ga < x.gb).length)}${qa + qb ? row('Qualifications en élimination directe', qa, qb) : ''}</div>`;
      html += `<p class="tool-sum">Dernier match : ${sc(L[0].m)} · premier : ${sc(L[L.length - 1].m)}</p>`;
      const mk = (x, forA) => ({ g: forA ? x.ga : x.gb, p: forA ? x.gb : x.ga, html: sc(x.m) });
      const bestOf = W => { const w = W.slice().sort((p, q) => (q.g - q.p) - (p.g - p.p) || q.g - p.g)[0]; return w ? `<b>${w.g}-${w.p}</b> · ${w.html}` : ''; };
      html += `<h3>Les larges victoires <small class="bw-note">(3 buts d'écart ou plus)</small></h3><div class="bw-wrap">${bigBlock([[short(A), L.filter(x => x.ga > x.gb).map(x => mk(x, true))], [short(B), L.filter(x => x.gb > x.ga).map(x => mk(x, false))]], 3, bestOf)}</div>`;
      const grp = {}; L.forEach(x => { const k = (A.startsWith('p:') ? x.a + '|' : '') + x.b; (grp[k] = grp[k] || []).push(x); });
      const rows = Object.entries(grp).map(([k, G]) => ({ k, G, t: tally(G) })).sort((p, q) => q.t.j - p.t.j || (q.t.v - q.t.d) - (p.t.v - p.t.d));
      html += `<h3>Détail ${A.startsWith('p:') ? 'affiche par affiche' : 'club par club'} <small class="bw-note">(${pl(rows.length, A.startsWith('p:') ? 'affiche' : 'adversaire')})</small></h3>
        <div class="daf-head"><span>${A.startsWith('p:') ? 'Affiche' : 'Adversaire'}</span><span>J</span><span>V</span><span>N</span><span>D</span><span>Buts</span></div>
        <div class="daf-list">${rows.map(({ k, G, t: s }) => { const [ca, cb] = A.startsWith('p:') ? k.split('|') : [A, k];
          const tl = tieList.filter(T2 => T2.a === ca && T2.b === cb && T2.q);
          return `<details class="daf-row"><summary><span class="who">${A.startsWith('p:') ? `${badge(ca)}${esc(nm(ca))} – ` : ''}${badge(cb)}${esc(nm(cb))}<small>${esc(pays(cb))}</small></span><span>${s.j}</span><span class="v">${s.v}</span><span>${s.n}</span><span class="d">${s.d}</span><span>${s.bp}-${s.bc}</span></summary>
          ${tl.length ? `<p class="tool-sum">Doubles confrontations : ${tl.map(T2 => `${esc(T2.ed)} ${T2.q === 'A' ? esc(nm(ca)) : esc(nm(cb))} qualifié`).join(' · ')}</p>` : ''}
          <div class="table-wrap"><table class="a-table">${G.map(x => { const r = x.ga > x.gb ? 'w' : x.ga < x.gb ? 'l' : ''; return `<tr><td>${esc(x.m[0])}</td><td>${esc(x.m[1])}${x.m[3] === 'aller' || x.m[3] === 'retour' ? ' · ' + esc(x.m[3]) : ''}</td><td>${esc(x.m[4] ? x.m[4].split('-').reverse().join('/') : '')}</td><td>${esc(nm(x.m[5]))}</td><td class="${r}"><b>${x.m[7]}-${x.m[8]}</b></td><td>${esc(nm(x.m[6]))}</td></tr>`; }).join('')}</table></div></details>`; }).join('')}</div>`;
      out.innerHTML = html + nationsTable(); bindNations(); live(t.j);
    };
    const live = n => { $('#dafLive').textContent = short(A) + ' – ' + short(B) + ' : ' + n + ' ' + T(n > 1 ? 'matchs' : 'match'); };
    // bilan du côté A contre chaque pays — mêmes filtres que le bilan, indiqués en clair
    function nationsTable() {
      const R = {};
      M0.forEach(m => {
        if (!keep(m)) return;
        let b, ga, gb, aHome;
        if (inS(A, m[5]) && !inS(A, m[6])) { b = m[6]; ga = m[7]; gb = m[8]; aHome = true; } else if (inS(A, m[6]) && !inS(A, m[5])) { b = m[5]; ga = m[8]; gb = m[7]; aHome = false; } else return;
        if (sl.value && lieuOf(m, aHome) !== sl.value) return;
        const p = pays(b) || '?'; const t = R[p] || (R[p] = { j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0 }); t.j++; t.bp += ga; t.bc += gb; ga > gb ? t.v++ : ga < gb ? t.d++ : t.n++;
      });
      const L = Object.entries(R).sort((x, y) => y[1].j - x[1].j);
      if (!L.length) return '';
      return `<section class="daf-sec"><h3>${esc(short(A))} contre chaque pays</h3><p class="daf-scope">${esc(filtNote())}</p><p class="tool-sum">Cliquez sur un pays pour l'afficher en face.</p>
        <div class="table-wrap"><table class="a-table daf-nat"><thead><tr><th class="l">Pays</th><th>J</th><th>V</th><th>N</th><th>D</th><th>Buts</th><th>% vict.</th></tr></thead><tbody>${L.map(([p, t]) => `<tr><td class="l"><a href="?a=${encodeURIComponent(A)}&b=${encodeURIComponent('p:' + p)}" data-p="${esc(p)}">${esc(p)}</a></td><td>${t.j}</td><td>${t.v}</td><td>${t.n}</td><td>${t.d}</td><td>${t.bp}-${t.bc}</td><td>${Math.round(t.v / t.j * 100)} %</td></tr>`).join('')}</tbody></table></div></section>`;
    }
    function bindNations() { document.querySelectorAll('.daf-nat a[data-p]').forEach(a => a.onclick = e => { e.preventDefault(); sb.value = 'p:' + a.dataset.p; draw(); $('#cbxB').scrollIntoView({ block: 'start' }); }); }
    const cA = combo($('#cbxA'), sa, items, () => draw()), cB = combo($('#cbxB'), sb, items, () => draw());
    se.onchange = sp.onchange = sl.onchange = draw;
    $('#dafSwap').onclick = () => { [sa.value, sb.value] = [sb.value, sa.value]; draw(); msg(T('Côtés inversés.')); };
    $('#dafReset').onclick = () => { se.value = sp.value = sl.value = ''; draw(); msg(T('Filtres réinitialisés.')); };
    $('#dafCopy').onclick = async () => { try { await navigator.clipboard.writeText(location.href); msg(T('Lien copié.')); } catch (e) { msg(location.href); } };
    document.querySelectorAll('.daf-ex a[data-a]').forEach(a => a.onclick = e => { e.preventDefault(); sa.value = a.dataset.a; sb.value = a.dataset.b; draw(); });
    if (window.matchMedia('(min-width: 701px)').matches || actifs().length) $('#dafF').open = true;
    draw();
  }
  function rankChart(L, series) {
    const S = L.saisons, W = 1000, H = 300, pad = 34, max = 16, x = i => pad + i * (W - 2 * pad) / (S.length - 1), y = r => 14 + (Math.min(r, max) - 1) * (H - 40) / (max - 1);
    let g = '';
    [1, 4, 8, 12, 16].forEach(r => { g += `<line x1="${pad}" x2="${W - pad}" y1="${y(r)}" y2="${y(r)}" stroke="#EADCC4"/><text x="4" y="${y(r) + 4}" font-size="12" fill="#6E5F5A">${r}e</text>`; });
    S.forEach((s, i) => { if (i % 10 === 0) g += `<text x="${x(i)}" y="${H - 4}" font-size="12" fill="#6E5F5A" text-anchor="middle">${s}</text>`; });
    series.forEach(([id, col]) => {
      let seg = [], segs = [];
      S.forEach((s, i) => { const r = L.lignes.find(l => l[0] === s && l[1] === id); if (r && r[2]) seg.push([x(i), y(r[2]), r[2] === 1]); else if (seg.length) { segs.push(seg); seg = []; } });
      if (seg.length) segs.push(seg);
      segs.forEach(sg => { g += `<polyline fill="none" stroke="${col}" stroke-width="2.5" points="${sg.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}"/>`; sg.forEach(p => { if (p[2]) g += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${col}"/>`; }); });
    });
    const leg = series.map(([id, col]) => `<span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px"><i style="width:18px;height:4px;background:${col};display:inline-block"></i>${esc(nm(id))}</span>`).join('');
    return `<p class="tool-sum">${leg} · un point = un titre · trou = absent de la Ligue 1</p><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Classement final par saison">${g}</svg>`;
  }

  // ------------------------------------------------------------ période
  async function periode() {
    const [clubs, L] = await Promise.all([load('clubs.json'), load('l1.json')]); C = clubs;
    const S = L.saisons, de = $('#pDe'), a = $('#pA'), pts = $('#pPts');
    de.innerHTML = S.map(s => `<option>${s}</option>`).join(''); a.innerHTML = de.innerHTML;
    de.value = S.includes(params.get('de')) ? params.get('de') : S[0]; a.value = S.includes(params.get('a')) ? params.get('a') : S[S.length - 1];
    if (params.get('pts') === '310') pts.value = '310';
    const last = S.length - 1, idx = s => S.indexOf(s);
    const presets = [["Toute l'histoire", S[0], S[last]], ['Avant 1970', S[0], '1969-70'], ['1970 à 1999', '1970-71', '1998-99'], ['Depuis 2000', '1999-00', S[last]], ['10 dernières saisons', S[Math.max(0, last - 9)], S[last]], ['Saison la plus récente', S[last], S[last]]]
      .filter(p => S.includes(p[1]) && S.includes(p[2]));
    $('#pPresets').innerHTML = presets.map((p, i) => `<button type="button" data-i="${i}">${p[0]}</button>`).join('');
    $('#pPresets').onclick = e => { const b = e.target.closest('button'); if (!b) return; const p = presets[b.dataset.i]; de.value = p[1]; a.value = p[2]; draw(); };
    const draw = () => {
      let i0 = idx(de.value), i1 = idx(a.value); if (i0 > i1) [i0, i1] = [i1, i0];
      const sel = S.slice(i0, i1 + 1), set = new Set(sel); setParams({ de: S[i0], a: S[i1], pts: pts.value === '310' ? '310' : '' });
      $('#pPresets').querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-pressed', presets[k][1] === S[i0] && presets[k][2] === S[i1]));
      const single = sel.length === 1, agg = {};
      L.lignes.filter(r => set.has(r[0]) && r[3] > 0).forEach(r => {
        const g = agg[r[1]] || (agg[r[1]] = { id: r[1], s: 0, j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0, p: 0, t: 0, pod: 0, rang: r[2] });
        g.s++; g.j += r[3]; g.v += r[4]; g.n += r[5]; g.d += r[6]; g.bp += r[7]; g.bc += r[8];
        g.p += pts.value === '310' ? (r[10] ?? 3 * r[4] + r[5]) : r[9]; if (r[11] === 'Champion') g.t++; if (r[2] && r[2] <= 3) g.pod++;
      });
      const rows = Object.values(agg).sort(single ? (x, y) => (x.rang || 99) - (y.rang || 99) : (x, y) => y.p - x.p || (y.bp - y.bc) - (x.bp - x.bc));
      const champ = rows.find(r => r.t && single);
      $('#pSum').textContent = single ? `Classement final ${S[i0]}${champ ? ' · champion : ' + nm(champ.id) : ''}` : `${pl(sel.length, 'saison')}, de ${S[i0]} à ${S[i1]} · ${rows.length} clubs · classement par points cumulés.`;
      $('#pTable').innerHTML = `<thead><tr><th>#</th><th>Club</th>${single ? '' : '<th>Saisons</th><th>Titres</th><th>Podiums</th>'}<th>J</th><th>V</th><th>N</th><th>D</th><th>Buts</th><th>Diff.</th><th>Pts</th></tr></thead><tbody>` +
        rows.map((r, k) => `<tr class="${r.id === EST ? 'est' : ''}"><td>${single ? (r.rang || '–') : k + 1}</td><td>${badge(r.id)}<a href="comparer.html?a=${r.id}&b=${r.id === EST ? 'club-africain' : EST}">${esc(nm(r.id))}</a></td>${single ? '' : `<td>${r.s}</td><td>${r.t || ''}</td><td>${r.pod || ''}</td>`}<td>${r.j}</td><td>${r.v}</td><td>${r.n}</td><td>${r.d}</td><td>${r.bp}-${r.bc}</td><td>${r.bp - r.bc > 0 ? '+' : ''}${r.bp - r.bc}</td><td><b>${r.p}</b></td></tr>`).join('') + '</tbody>';
    };
    de.onchange = a.onchange = pts.onchange = draw; draw();
  }

  // ------------------------------------------------------------ parcours
  async function parcours() {
    const [clubs, K] = await Promise.all([load('clubs.json'), load('caf.json')]); C = clubs;
    const part = {}; K.parcours.forEach(p => part[p[1]] = (part[p[1]] || 0) + 1);
    const ids = Object.keys(part), tun = ids.filter(c => C[c] && C[c].p === 'Tunisie').sort((a, b) => part[b] - part[a]);
    const oth = ids.filter(c => !tun.includes(c)).sort((a, b) => nm(a).localeCompare(nm(b)));
    const sel = $('#pcClub'); const c0 = ids.includes(params.get('c')) ? params.get('c') : EST;
    sel.innerHTML = `<optgroup label="Clubs tunisiens">${tun.map(c => opt(c, c0)).join('')}</optgroup><optgroup label="Autres clubs">${oth.map(c => opt(c, c0)).join('')}</optgroup>`;
    const draw = () => {
      const id = sel.value; setParams({ c: id });
      const P = K.parcours.filter(p => p[1] === id), edOrder = K.editions.map(e => e[0]);
      P.sort((a, b) => edOrder.indexOf(b[0]) - edOrder.indexOf(a[0]));
      const M = K.matchs.filter(m => m[5] === id || m[6] === id), Ms = M.filter(m => m[9]);
      const w = K.editions.filter(e => e[1] === id).map(e => e[0]), f = K.editions.filter(e => e[2] === id).map(e => e[0]);
      const v = Ms.filter(m => (m[5] === id ? m[7] > m[8] : m[8] > m[7])).length, bp = Ms.reduce((s, m) => s + (m[5] === id ? m[7] : m[8]), 0);
      $('#pcSum').innerHTML = `<div><b>${P.length}</b><span>participations</span></div><div><b>${w.length}</b><span>titres${w.length ? ' (' + w.join(', ') + ')' : ''}</span></div><div><b>${w.length + f.length}</b><span>finales</span></div><div><b>${Ms.length}</b><span>matchs</span></div><div><b>${v}</b><span>victoires</span></div><div><b>${bp}</b><span>buts marqués</span></div>`;
      $('#pcList').innerHTML = P.map(p => {
        const won = w.includes(p[0]), fin = f.includes(p[0]), mm = M.filter(m => m[0] === p[0]);
        const res = won ? 'Vainqueur' : fin ? 'Finaliste' : p[3];
        return `<li><details id="ed-${esc(p[0])}"><summary><span class="ed">${esc(p[0])}</span><span>${esc(res)}${p[4] && !won ? ` · éliminé par <b>${esc(nm(p[4]))}</b>` : ''}</span><span class="ph ${won ? 'ph-w' : fin ? 'ph-f' : ''}">${esc(PH[p[2]] || p[2])}</span></summary>
          <div class="pc-m"><table>${mm.map(m => { const gf = m[5] === id ? m[7] : m[8], ga = m[5] === id ? m[8] : m[7], r = gf > ga ? 'w' : gf < ga ? 'l' : '';
            return `<tr><td>${esc(m[1])}${m[3] && m[3] !== 'poule' ? ' · ' + esc(m[3]) : ''}</td><td>${esc(m[4] ? m[4].split('-').reverse().join('/') : '')}</td><td>${esc(nm(m[5]))}</td><td class="${r}"><b>${m[7]}-${m[8]}</b></td><td>${esc(nm(m[6]))}</td></tr>`; }).join('')}</table></div></details></li>`;
      }).join('') || '<li>Aucune participation.</li>';
      const h = decodeURIComponent(location.hash.slice(1)); if (h) { const d = document.getElementById(h); if (d) { d.open = true; d.scrollIntoView({ block: 'center' }); } }
    };
    sel.onchange = () => { history.replaceState(null, '', location.pathname + '?c=' + sel.value); draw(); }; draw();
  }

  // ------------------------------------------------------------ matchs
  async function matchs() {
    const [clubs, K] = await Promise.all([load('clubs.json'), load('caf.json')]); C = clubs;
    let comp = params.get('comp') === 'l1' ? 'l1' : 'caf', limit = 100, L1 = null;
    const club = $('#mClub'), adv = $('#mAdv'), ed = $('#mEd'), sc = $('#mScore');
    const fillClubs = list => { const cur = club.value || params.get('c') || ''; const tun = list.filter(c => C[c] && C[c].p === 'Tunisie').sort((a, b) => nm(a).localeCompare(nm(b))), oth = list.filter(c => !tun.includes(c)).sort((a, b) => nm(a).localeCompare(nm(b)));
      club.innerHTML = `<option value="">Tous les clubs</option><optgroup label="Clubs tunisiens">${tun.map(c => opt(c, cur)).join('')}</optgroup>${oth.length ? `<optgroup label="Autres clubs">${oth.map(c => opt(c, cur)).join('')}</optgroup>` : ''}`; };
    const data = () => comp === 'caf' ? K.matchs.map(m => ({ ed: m[0], tour: m[1], date: m[4], h: m[5], a: m[6], x: m[7], y: m[8], ok: m[9] }))
      : (L1 ? L1.resultats.map(m => ({ ed: L1.saison, tour: 'Ligue 1', date: '', h: m.dom, a: m.ext, x: m.bd, y: m.be, ok: 1 })) : []);
    const setup = async () => {
      if (comp === 'l1' && !L1) L1 = await load('api/v1/saison-en-cours.json');
      document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === comp));
      $('#mEdL').hidden = comp !== 'caf';
      const D = data(); fillClubs([...new Set(D.flatMap(m => [m.h, m.a]))]);
      ed.innerHTML = '<option value="">Toutes</option>' + K.editions.map(e => e[0]).reverse().map(e => `<option${e === params.get('ed') ? ' selected' : ''}>${e}</option>`).join('');
      fillAdv(); draw();
    };
    const fillAdv = () => { const c = club.value, D = data(); const cur = adv.value || params.get('adv') || '';
      const list = [...new Set(D.filter(m => !c || m.h === c || m.a === c).flatMap(m => [m.h, m.a]))].filter(x => x !== c).sort((a, b) => nm(a).localeCompare(nm(b)));
      adv.innerHTML = '<option value="">Tous</option>' + list.map(x => opt(x, cur)).join(''); };
    const draw = () => {
      const c = club.value, o = adv.value, e = comp === 'caf' ? ed.value : '', s = sc.value.replace(/\s/g, '').match(/^(\d+)[-:](\d+)$/);
      setParams({ comp: comp === 'l1' ? 'l1' : '', c, adv: o, ed: e });
      let D = data().filter(m => (!c || m.h === c || m.a === c) && (!o || m.h === o || m.a === o) && (!e || m.ed === e));
      if (s) { const p = +s[1], q = +s[2]; D = D.filter(m => c ? (m.h === c ? m.x === p && m.y === q : m.y === p && m.x === q) : (m.x === p && m.y === q) || (m.x === q && m.y === p)); }
      D = D.slice().reverse();
      let sum = pl(D.length, 'match');
      if (c && D.length) { const v = D.filter(m => (m.h === c ? m.x > m.y : m.y > m.x)).length, n = D.filter(m => m.x === m.y).length; sum += ` · pour ${nm(c)} : ${pl(v, 'victoire')}, ${pl(n, 'nul')}, ${pl(D.length - v - n, 'défaite')}`; }
      $('#mSum').textContent = sum;
      $('#mTable').innerHTML = `<thead><tr><th>${comp === 'caf' ? 'Édition' : 'Saison'}</th><th>Tour</th><th>Date</th><th>Domicile</th><th>Score</th><th>Extérieur</th></tr></thead><tbody>` +
        D.slice(0, limit).map(m => { const r = c ? ((m.h === c ? m.x - m.y : m.y - m.x) > 0 ? 'w' : (m.x === m.y ? '' : 'l')) : '';
          return `<tr class="${m.h === EST || m.a === EST ? 'est' : ''}"><td>${comp === 'caf' ? `<a href="parcours.html?c=${c || m.h}#ed-${m.ed}">${esc(m.ed)}</a>` : esc(m.ed)}</td><td>${esc(m.tour)}</td><td>${esc(m.date ? m.date.split('-').reverse().join('/') : '')}</td><td>${esc(nm(m.h))}</td><td class="${r}"><b>${m.x}-${m.y}</b>${m.ok ? '' : ' <small title="Match non comptabilisé (forfait, tapis vert…)">*</small>'}</td><td>${esc(nm(m.a))}</td></tr>`; }).join('') + '</tbody>';
      $('#mMore').hidden = D.length <= limit;
    };
    document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { comp = b.dataset.c; limit = 100; club.value = ''; adv.value = ''; setup(); });
    club.onchange = () => { limit = 100; fillAdv(); draw(); }; adv.onchange = ed.onchange = () => { limit = 100; draw(); };
    sc.oninput = () => { limit = 100; draw(); }; $('#mMore').onclick = () => { limit += 200; draw(); };
    setup();
  }

  // ------------------------------------------------------------ frise
  async function frise() {
    const F = await load('frise.json'); const kinds = ['Tout', ...new Set(F.map(f => f.k))];
    let k = 'Tout';
    $('#fKinds').innerHTML = kinds.map(x => `<button type="button" data-k="${esc(x)}" aria-pressed="${x === k}">${esc(x === 'Tout' ? 'Tout' : x + 's').replace('Afriques', 'Afrique').replace('Présidents', 'Présidents')}</button>`).join('');
    const draw = () => {
      const L = F.filter(f => k === 'Tout' || f.k === k), years = [...new Set(L.map(f => f.y))];
      const decs = [...new Set(years.map(y => Math.floor(y / 10) * 10))];
      $('#fDec').innerHTML = decs.map(d => `<a href="#d${d}">${d}</a>`).join('');
      let lastDec = null;
      $('#frise').innerHTML = years.map(y => { const d = Math.floor(y / 10) * 10, id = d !== lastDec ? ` id="d${d}"` : ''; lastDec = d;
        return `<li${id}><p class="yr" id="y${y}">${y}</p><ul>${L.filter(f => f.y === y).map(f => `<li><a href="${esc(f.u)}"><span class="k ${esc(f.k)}">${esc(f.k)}</span><span>${esc(f.t)}</span></a></li>`).join('')}</ul></li>`; }).join('');
      document.querySelectorAll('#fKinds button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
    };
    $('#fKinds').onclick = e => { const b = e.target.closest('button'); if (b) { k = b.dataset.k; draw(); } };
    draw();
  }

  // ------------------------------------------------------------ quiz
  async function quiz() {
    const [clubs, L, K, FB, R] = await Promise.all([load('clubs.json'), load('l1.json'), load('caf.json'), load('fables.json'), load('api/v1/records.json').catch(() => null)]); C = clubs;
    const rnd = a => a[Math.floor(Math.random() * a.length)], shuf = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
    const champs = L.lignes.filter(r => r[11] === 'Champion'), titles = {}; champs.forEach(r => titles[r[1]] = (titles[r[1]] || 0) + 1);
    const big = Object.keys(titles).filter(c => titles[c] >= 2);
    const others = (ans, pool, n = 3) => shuf(pool.filter(x => x !== ans && x != null)).filter((x, i, a) => a.indexOf(x) === i).slice(0, n);
    const G = {
      champion() { const r = rnd(champs), s = r[0], top = L.lignes.filter(l => l[0] === s && l[2] && l[2] <= 5).sort((a, b) => a[2] - b[2]);
        const second = top.find(l => l[2] === 2);
        return { q: `Qui a été champion de Tunisie en ${s} ?`, a: nm(r[1]), o: others(nm(r[1]), top.map(l => nm(l[1])).concat(big.map(nm))),
          e: `${nm(r[1])} termine premier avec ${r[9]} points${second ? `, devant ${nm(second[1])} (${second[9]} points)` : ''}.`, src: ['Classement final ' + s, `periode.html?de=${s}&a=${s}`] }; },
      caf() { const e = rnd(K.editions.filter(x => x[1] && x[2])), win = K.editions.filter(x => x[1]).map(x => nm(x[1]));
        return { q: `Quel club a remporté la Ligue des champions ${e[0]} ?`, a: nm(e[1]), o: others(nm(e[1]), [nm(e[2])].concat(shuf(win))),
          e: `${nm(e[1])} bat ${nm(e[2])} en finale.`, src: ['Ligue des champions ' + e[0], `matchs.html?ed=${e[0]}`] }; },
      titres() { const c = rnd(['esperance-tunis', 'club-africain', 'etoile-sahel', 'cs-sfaxien', 'stade-tunisien', 'cs-hammam-lif'].filter(x => titles[x])), n = titles[c];
        const o = shuf([n - 3, n - 2, n - 1, n + 1, n + 2, n + 4].filter(x => x > 0)).slice(0, 3);
        return { q: `Combien de titres de champion de Tunisie compte ${nm(c)} ?`, a: String(n), o: o.map(String), e: `${nm(c)} a été sacré ${n} fois depuis 1955-56.`, src: ['Comparer les palmarès', `comparer.html?a=${c}&b=${c === EST ? 'club-africain' : EST}`] }; },
      president() { const P = L.presidences.filter(p => p[0] === EST && /^\d{4}$/.test(p[2])); const p = rnd(P.filter(p => p[3] && /^\d{4}$/.test(p[3])) || P);
        const y = +p[2] + Math.floor(Math.random() * Math.max(1, (+p[3] || +p[2]) - +p[2] + 1));
        const ok = P.filter(x => +x[2] <= y && y <= (+x[3] || 9999)).map(x => x[1]);
        return { q: `Qui présidait l'Espérance en ${y} ?`, a: p[1], o: others(p[1], P.map(x => x[1]).filter(x => !ok.includes(x))),
          e: `${p[1]} a présidé le club de ${p[2]} à ${p[3] || "aujourd'hui"}.`, src: ['Les présidents', 'ligue-1.html#presidents'] }; },
      finale() { const E = K.editions.filter(e => e[1] === EST || e[2] === EST), e = rnd(E), adv = e[1] === EST ? e[2] : e[1];
        return { q: `Contre quel club l'Espérance a-t-elle joué la finale africaine de ${e[0]} ?`, a: nm(adv), o: others(nm(adv), E.map(x => nm(x[1] === EST ? x[2] : x[1])).concat(K.editions.map(x => nm(x[1])))),
          e: `${e[1] === EST ? "L'Espérance remporte" : "L'Espérance perd"} la finale ${e[0]} face à ${nm(adv)}.`, src: ["Parcours africain de l'Espérance", `parcours.html?c=${EST}#ed-${e[0]}`] }; },
      fable() { const f = rnd(FB);
        return { q: `On raconte : « ${f[0].replace(/\s*\?$/, '')} ». Que montrent les archives ?`, a: "C'est faux", o: ["C'est vrai", 'Les archives ne permettent pas de trancher', 'Personne ne le sait'],
          e: f[2], src: ['La fable démontée', f[3]] }; },
      record() { if (!R || !R.records) return null; const r = rnd(R.records.filter(x => x.detenteurs && x.detenteurs.length === 1)); const h = r.detenteurs[0].nom;
        return { q: `Record de Ligue 1 : « ${r.libelle} ». Qui le détient ?`, a: h, o: others(h, R.records.flatMap(x => x.detenteurs.map(d => d.nom)).concat(big.map(nm))),
          e: `${h} : ${r.valeur} ${r.unite}${r.detail ? ' (' + r.detail + ')' : ''}.`, src: ['Les records de Ligue 1', 'ligue-1.html#l1Records'] }; },
    };
    const plan = shuf(['champion', 'champion', 'caf', 'caf', 'titres', 'president', 'finale', 'fable', 'record', 'fable']);
    let Q = [], seen = new Set();
    for (const t of plan) { for (let k = 0; k < 8; k++) { const x = G[t](); if (x && !seen.has(x.q) && x.o.length >= 2) { seen.add(x.q); x.opts = shuf([x.a, ...x.o.slice(0, 3)]); Q.push(x); break; } } }
    let i = 0, score = 0; const box = $('#quiz');
    const show = () => {
      if (i >= Q.length) {
        const msg = score >= 9 ? 'Mémoire de supporter, archives en main.' : score >= 6 ? 'Solide. Les dossiers vous attendent pour le reste.' : 'Les archives sont là pour ça : bonne lecture.';
        box.innerHTML = `<p class="q-prog">Résultat</p><p class="score">${score} / ${Q.length}</p><p>${msg}</p><p><button class="btn" type="button" id="qAgain">Rejouer avec dix nouvelles questions</button> <a class="btn ghost" href="verites.html">Lire les vérités</a></p>`;
        $('#qAgain').onclick = () => location.reload(); return;
      }
      const x = Q[i];
      box.innerHTML = `<p class="q-prog">Question ${i + 1} sur ${Q.length} · score : ${score}</p><h2>${esc(x.q)}</h2><div class="opts">${x.opts.map(o => `<button type="button" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div><div id="qAfter"></div>`;
      box.querySelectorAll('.opts button').forEach(b => b.onclick = () => {
        const good = b.dataset.v === x.a; if (good) score++;
        box.querySelectorAll('.opts button').forEach(z => { z.disabled = true; if (z.dataset.v === x.a) z.classList.add('ok'); else if (z === b) z.classList.add('ko'); });
        $('#qAfter').innerHTML = `<div class="expl"><b>${good ? 'Bonne réponse.' : 'Raté : la bonne réponse est « ' + esc(x.a) + ' ».'}</b> ${esc(x.e)}<small>Source : <a href="${esc(x.src[1])}" target="_blank">${esc(x.src[0])}</a></small></div><button class="btn" type="button" id="qNext">${i + 1 < Q.length ? 'Question suivante' : 'Voir mon score'}</button>`;
        $('#qNext').onclick = () => { i++; show(); }; $('#qNext').focus();
      });
    };
    show();
  }

  // ------------------------------------------------------------ recherche (page)
  async function recherche() {
    const inp = $('#rq'), q = params.get('q') || ''; inp.value = q;
    const run = async () => {
      const v = inp.value.trim(); setParams({ q: v });
      if (v.length < 2) { $('#rOut').innerHTML = '<p class="tool-sum">Tapez au moins deux lettres : un club, une saison (1994), un nom (Malki), un mot (Bab Souika)…</p>'; return; }
      const r = await window.taSearch(v), groups = {};
      r.forEach(x => (groups[x.k] = groups[x.k] || []).push(x));
      $('#rOut').innerHTML = r.length ? `<p class="tool-sum">${pl(r.length, 'résultat')}</p>` + Object.entries(groups).map(([k, L]) => `<h2 style="font:800 24px var(--display);margin:24px 0 8px">${esc(k)} <small style="color:var(--stone);font:600 15px var(--body)">${L.length}</small></h2>${L.slice(0, 30).map(x => window.taItem(x, 'r-item')).join('')}`).join('')
        : `<p class="tool-sum">Aucun résultat pour « ${esc(v)} ». Essayez un autre mot, ou parcourez <a href="histoire.html">l'histoire</a>, <a href="verites.html">les vérités</a> ou <a href="stats.html">les statistiques</a>.</p>`;
    };
    let t; inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 150); });
    $('.big-search').addEventListener('submit', e => { e.preventDefault(); run(); });
    const wait = () => window.taSearch ? run() : setTimeout(wait, 50); wait();
  }


  // ------------------------------------------------------------ médiathèque
  async function mediatheque() {
    const V = await load('videos.json'); const TH = Object.fromEntries(V.themes);
    const vids = V.videos, une = $('#mdUne');
    const play = (id, autoplay) => {
      const v = vids.find(x => x.id === id) || vids[0];
      une.innerHTML = `<div class="md-player" data-id="${esc(v.id)}">${autoplay ? `<iframe src="https://www.youtube-nocookie.com/embed/${esc(v.id)}?autoplay=1&rel=0" title="${esc(v.t)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
        : `<button type="button" class="md-facade" aria-label="Lancer la vidéo"><img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt=""><i>▶</i></button>`}</div>
        <div class="md-info"><p class="kicker">${v.id === V.une ? 'À la une · ' : ''}${esc(TH[v.th] || '')}</p><h2 lang="ar" dir="rtl">${esc(v.t)}</h2>
        <p class="tool-sum">${[v.d, v.an].filter(Boolean).map(esc).join(' · ')}</p>
        ${v.lt && v.lt.length ? `<p class="md-links">${v.lt.map(([u, t]) => `<a href="${esc(u)}">${esc(t)} →</a>`).join('')}</p>` : ''}
        <p><a class="more-link" href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">Voir sur YouTube ↗</a></p></div>`;
      const f = une.querySelector('.md-facade'); if (f) f.onclick = () => play(v.id, true);
    };
    let th = '';
    const themes = V.themes.filter(([k]) => vids.some(v => v.th === k));
    $('#mdThemes').innerHTML = `<button type="button" data-th="" aria-pressed="true">Tout (${vids.length})</button>` + themes.map(([k, n]) => `<button type="button" data-th="${k}" aria-pressed="false">${esc(n)} (${vids.filter(v => v.th === k).length})</button>`).join('');
    const grid = () => {
      $('#mdGrid').innerHTML = vids.filter(v => !th || v.th === th).map(v => `<li><a class="md-card" href="#v-${esc(v.id)}" data-id="${esc(v.id)}"><span class="md-img"><img src="https://i.ytimg.com/vi/${esc(v.id)}/mqdefault.jpg" alt="" loading="lazy"><i>▶</i>${v.d ? `<small>${esc(v.d)}</small>` : ''}</span><span class="md-t" lang="ar" dir="rtl">${esc(v.t)}</span><span class="md-m">${esc(TH[v.th] || '')}${v.an ? ' · ' + esc(v.an) : ''}</span></a></li>`).join('');
      document.querySelectorAll('#mdThemes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.th === th));
    };
    $('#mdThemes').onclick = e => { const b = e.target.closest('button'); if (b) { th = b.dataset.th; grid(); } };
    $('#mdGrid').onclick = e => { const a = e.target.closest('.md-card'); if (!a) return; e.preventDefault(); history.replaceState(null, '', '#v-' + a.dataset.id); play(a.dataset.id, true); une.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    grid();
    const h = location.hash.match(/^#v-([\w-]+)/);
    play(h ? h[1] : V.une, !!h);
  }

  const go = { mdGrid: mediatheque, dafOut: duelAfrique, cmpOut: comparer, pTable: periode, pcList: parcours, mTable: matchs, frise, quiz, rOut: recherche };
  Object.entries(go).forEach(([id, f]) => { if (document.getElementById(id)) f().catch(e => { console.error(e); document.getElementById(id).innerHTML = '<p class="tool-sum">Les données n\'ont pas pu être chargées. Rechargez la page.</p>'; }); });
})();
