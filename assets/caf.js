/* Ligue des champions CAF – page publique. Données : ./api/v1/caf/*.json (scripts/build_caf_api.py). */
(() => {
  const API = (window.TA_ROOT || '') + 'api/v1/caf/';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => n == null || isNaN(n) ? '–' : Math.round(n).toLocaleString('fr-FR');
  const pct = n => n == null || isNaN(n) ? '–' : Math.round(n * 100) + ' %';
  const get = n => fetch(API + n, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(n); return r.json(); });

  const CODES = {
    'al-ahly': 'AHL', 'zamalek': 'ZAM', 'tp-mazembe': 'TPM', 'esperance-tunis': 'EST', 'wydad-ac': 'WAC', 'raja-casablanca': 'RCA',
    'as-far': 'FAR', 'asec-mimosas': 'ASEC', 'hafia-fc': 'HAF', 'canon-yaounde': 'CAN', 'asante-kotoko': 'KOT', 'hearts-of-oak': 'HOA',
    'enyimba': 'ENY', 'js-kabylie': 'JSK', 'es-setif': 'SÉT', 'mc-alger': 'MCA', 'club-africain': 'CA', 'etoile-sahel': 'ÉSS',
    'orlando-pirates': 'ORL', 'mamelodi-sundowns': 'MSU', 'pyramids': 'PYR', 'stade-d-abidjan': 'SDA', 'oryx-douala': 'ORY',
    'ismaily': 'ISM', 'as-vita-club': 'VIT', 'cara-brazzaville': 'CARA', 'union-douala': 'UDO', 'cs-sfaxien': 'CSS',
  };
  const PHASES = [['prelim', 'Tours préliminaires'], ['poules', 'Phase de poules'], ['quarts', 'Quarts de finale'], ['demis', 'Demi-finales'], ['finale', 'Finale']];
  const DEPTH = { 'Tours préliminaires': 1, 'Phase de poules': 2, 'Quart de finaliste': 3, 'Demi-finaliste': 4, 'Finaliste': 5, 'Vainqueur': 6, 'En course': 1.5 };
  const ERA_TXT = {
    ccc: ['Coupe des clubs champions', '1964-65 à 1996 · élimination directe en aller-retour, du premier tour à la finale'],
    ldc8: ['Ligue des champions, 8 en poules', '1997 à 2016 · tours préliminaires, deux poules de quatre, puis demies (dès 2001) et finale'],
    ldc16: ['Ligue des champions, 16 en poules', 'depuis 2017 · tours préliminaires, quatre poules de quatre, quarts, demies et finale'],
  };
  let meta, eds, clubs, byId, recs;

  const code = c => CODES[c.id] || c.nom.replace(/^(AS|FC|SC|CS|AC|US|ES|JS|CR|MC)\s+/, '').split(/[\s'-]+/).map(w => w[0]).join('').toUpperCase().slice(0, 4);
  function textOn(hex) {
    const h = (hex || '#9AA5B1').replace('#', '');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#15233D' : '#FFFFFF';
  }
  const swatch = c => `<i style="background:${c.couleur || '#9AA5B1'}"></i>`;
  const clubLink = c => c && c.id ? `<a href="#club" data-club="${esc(c.id)}">${esc(c.nom)}</a>` : esc(c ? c.nom : '');

  /* infobulle */
  const tip = $('#tip');
  const showTip = (el, x, y) => {
    tip.textContent = el.dataset.tip; tip.hidden = false;
    tip.style.left = Math.min(innerWidth - tip.offsetWidth - 8, Math.max(8, x - tip.offsetWidth / 2)) + 'px';
    tip.style.top = Math.max(8, y - tip.offsetHeight - 12) + 'px';
  };
  document.addEventListener('mousemove', e => { const el = e.target.closest('[data-tip]'); if (el) showTip(el, e.clientX, e.clientY); else tip.hidden = true; });
  document.addEventListener('focusin', e => { const el = e.target.closest('[data-tip]'); if (el) { const r = el.getBoundingClientRect(); showTip(el, r.left + r.width / 2, r.top); } });
  document.addEventListener('focusout', () => { tip.hidden = true; });
  // tout lien vers un club ouvre sa fiche
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-club]');
    if (a && !a.classList.contains('crest')) { e.preventDefault(); openClub(a.dataset.club); $('#club').scrollIntoView(); }
  });

  /* ---------------- mur des époques ---------------- */
  function renderWall() {
    const done = eds.filter(e => e.statut === 'terminée').length;
    $('#nbFinales').textContent = done;
    let i = 0;
    $('#eraWall').innerHTML = ['ccc', 'ldc8', 'ldc16'].map(code_ => {
      const list = eds.filter(e => e.epoque_code === code_);
      const tiles = list.map(e => {
        const w = e.vainqueur;
        if (!w) return `<button class="cell live" style="--i:${i++}" data-ed="${e.edition}" data-tip="${esc(e.edition + ' : en cours')}" aria-label="${esc(e.edition + ', édition en cours')}"><small>${esc(e.edition.slice(2, 4))}</small>…</button>`;
        const c = byId[w.id] || w;
        return `<button class="cell" style="--i:${i++};background:${w.couleur};color:${textOn(w.couleur)}" data-ed="${e.edition}" data-tip="${esc(e.edition + ' : ' + w.nom + (e.finaliste ? ' contre ' + e.finaliste.nom : ''))}" aria-label="${esc(e.edition + ', vainqueur ' + w.nom)}"><small>${esc(e.edition.slice(2, 4))}</small>${esc(code(c))}</button>`;
      }).join('');
      const [t, sub] = ERA_TXT[code_];
      return `<div class="era-band"><h3>${t}</h3><p>${sub}</p><div class="era-tiles">${tiles}</div></div>`;
    }).join('');
    $('#eraWall').addEventListener('click', e => { const b = e.target.closest('.cell'); if (b) { openEdition(b.dataset.ed); $('#edition').scrollIntoView(); } });
  }

  /* ---------------- records ---------------- */
  function renderRecords() {
    const last = eds.slice(-2).map(e => e.edition);
    const fresh = recs.historique.filter(h => last.includes(h.edition) && h.type !== 'établi').reverse();
    const holderTxt = hs => [...new Set(hs.map(h => h.nom))].join(', ');
    if (fresh.length) {
      $('#fresh').innerHTML = `<h3>Tombés récemment</h3><ul>${fresh.map(h => `<li><span class="badge ${h.type === 'égalé' ? 'egal' : ''}">${h.type === 'égalé' ? 'Égalé' : 'Battu'} · ${esc(h.edition)}</span>
        <span><b>${esc(h.libelle)}</b> : ${esc(holderTxt(h.detenteurs))} ${h.detenteurs.length ? 'avec ' : ''}<b>${h.valeur} ${esc(h.unite)}</b>${h.detail ? ' (' + esc(h.detail) + ')' : ''}${h.ancienne_valeur != null && h.type === 'battu' ? `. Ancien record : ${h.ancienne_valeur}${h.anciens_detenteurs.length ? ', ' + esc(holderTxt(h.anciens_detenteurs)) : ''}` : ''}.</span></li>`).join('')}</ul>`;
    }
    const cats = [...new Set(recs.records.map(r => r.categorie))];
    $('#recordList').innerHTML = cats.map(cat => `<div class="rec-cat"><h3>${esc(cat)}</h3>${recs.records.filter(r => r.categorie === cat).map(r => {
      const hist = recs.historique.filter(h => h.record_id === r.record_id);
      const feat = r.detenteurs.some(h => h.id === FEATURED);
      return `<div class="rec ${feat ? 'feat' : ''}"><div class="val">${r.valeur}<small>${esc(r.unite)}</small></div><div>
        <div class="what">${esc(r.libelle)}${feat ? '<span class="tag">Espérance</span>' : ''}</div>
        <div class="who">${r.detenteurs.filter((h, i, a) => !h.id || a.findIndex(x => x.id === h.id) === i).map(h => `<span>${h.id ? swatch(h) : ''}${h.id ? clubLink(h) : esc(h.nom)}</span>`).join('')}</div>
        ${r.detail ? `<div class="det">${esc(r.detail)}</div>` : ''}
        <details class="hist"><summary>Historique (${hist.length} étapes)</summary><ol>${hist.map(h => `<li>${esc(h.edition)} : ${h.type} à ${h.valeur}${h.detenteurs.length ? ' par ' + esc(holderTxt(h.detenteurs)) : ''}${h.detail && !/^\d{4}/.test(h.detail) ? ' (' + esc(h.detail) + ')' : ''}</li>`).join('')}</ol></details>
      </div></div>`;
    }).join('')}</div>`).join('');
  }


  /* ---------------- records d'un club (club mis en avant : l'Espérance) ---------------- */
  const FEATURED = 'esperance-tunis';
  async function renderClubRecords(id) {
    if (!byId[id]) return;
    const c = await (cache[id] ? Promise.resolve(cache[id]) : get('clubs/' + id + '.json').then(x => (cache[id] = x)));
    const box = $('#clubRecords');
    box.style.setProperty('--club', c.couleur === '#F4F4F4' ? '#9AA5B1' : c.couleur);
    const leaders = rid => (recs.top10[rid] || []).filter(x => x.rang === 1);
    const rkTxt = r => r.rang === 1 ? (leaders(r.record_id).length > 1 ? 'ex aequo' : 'record') : r.rang === 2 ? '2e' : r.rang === 3 ? '3e' : r.rang + 'e';
    const line = r => {
      const ls = leaders(r.record_id).filter(x => x.id !== id);
      const ctx = r.rang === 1
        ? (ls.length ? `à égalité avec ${ls.slice(0, 3).map(x => esc(x.nom)).join(', ')}${ls.length > 3 ? '…' : ''}` : `seul détenteur, sur ${r.nb_clubs} clubs`)
        : `record : ${r.record} (${leaders(r.record_id).slice(0, 2).map(x => esc(x.nom)).join(', ')})`;
      return `<li><span class="rk ${r.rang <= 3 ? 'r' + r.rang : ''}">${r.rang}<small>${rkTxt(r)}</small></span>
        <span class="lib">${esc(r.libelle)}<small>${r.detail ? esc(r.detail) + ' · ' : ''}${ctx}</small></span><span class="v">${r.valeur}<small>${esc(r.unite)}</small></span></li>`;
    };
    const firsts = c.records.filter(r => r.rang === 1), podium = c.records.filter(r => r.rang === 2 || r.rang === 3), rest = c.records.filter(r => r.rang > 3);
    box.innerHTML = `<div class="cr-head"><div class="id"><span class="logo fallback" style="background:${c.couleur};color:${textOn(c.couleur)}">${esc(code(c))}</span>
        <div><h3>Les records ${id === FEATURED ? "de l'Espérance" : 'de ' + esc(c.nom)}</h3><p>${firsts.length} record${firsts.length > 1 ? 's' : ''} détenu${firsts.length > 1 ? 's' : ''} et ${podium.length} place${podium.length > 1 ? 's' : ''} sur le podium, Coupe des clubs champions et Ligue des champions confondues.</p></div></div>
        <input id="crSearch" list="clubList" placeholder="Voir un autre club" aria-label="Voir les records d'un autre club" autocomplete="off"></div>
      ${firsts.length ? `<h4>En tête</h4><ul class="cr-list">${firsts.map(line).join('')}</ul>` : ''}
      ${podium.length ? `<h4>Sur le podium</h4><ul class="cr-list">${podium.map(line).join('')}</ul>` : ''}
      ${rest.length ? `<details><summary>Tous ses autres classements (${rest.length})</summary><ul class="cr-list">${rest.map(line).join('')}</ul></details>` : ''}`;
    const byName = Object.fromEntries(clubs.map(x => [x.nom, x.id]));
    $('#crSearch').addEventListener('change', e => { const nid = byName[e.target.value]; if (nid) renderClubRecords(nid); });
  }

  /* ---------------- tableau des médailles ---------------- */
  function renderMedals() {
    const box = $('#medals');
    if (!recs.medailles) { box.hidden = true; return; }
    let sort = 'or', all = false;
    $('#medalsIntro').textContent = `Qui détient le plus de records ? Sur ${recs.nb_records_clubs} records, une médaille d'or par record détenu (seul ou à égalité), d'argent pour une 2e place, de bronze pour une 3e.`;
    const draw = () => {
      const list = recs.medailles.slice().sort(sort === 'or'
        ? (a, b) => b.or - a.or || b.argent - a.argent || b.bronze - a.bronze || a.nom.localeCompare(b.nom)
        : (a, b) => b.total - a.total || b.or - a.or || b.argent - a.argent || a.nom.localeCompare(b.nom));
      const key = x => sort === 'or' ? [x.or, x.argent, x.bronze].join() : [x.total, x.or, x.argent].join();
      let rank = 0, prev = null;
      list.forEach((x, i) => { const k = key(x); if (k !== prev) rank = i + 1; x._rk = rank; prev = k; });
      let shown = all ? list : list.slice(0, 10);
      const f = list.find(x => x.id === FEATURED);
      if (!all && f && !shown.includes(f)) shown = [...shown, f];
      $('#medalTable').innerHTML = `<thead><tr><th class="n">#</th><th>Club</th><th class="m"><span class="dot or"></span>1<sup>er</sup></th><th class="m"><span class="dot argent"></span>2<sup>e</sup></th><th class="m"><span class="dot bronze"></span>3<sup>e</sup></th><th class="m">Total</th><th class="m s">dont seul en tête</th></tr></thead><tbody>${shown.map(x => `
        <tr class="${x.id === FEATURED ? 'feat' : ''}" data-id="${x.id}" tabindex="0" title="Voir les records de ${esc(x.nom)}">
          <td class="n">${x._rk}</td>
          <td><span class="club"><span class="logo fallback" style="background:${x.couleur};color:${textOn(x.couleur)}">${esc(code(x))}</span>${esc(x.nom)}</span></td>
          <td class="m or">${x.or || '·'}</td><td class="m argent">${x.argent || '·'}</td><td class="m bronze">${x.bronze || '·'}</td>
          <td class="m t">${x.total}</td><td class="m s">${x.seul || '·'}</td></tr>`).join('')}</tbody>`;
      $('#medalMore').textContent = all ? 'Afficher les 10 premiers' : `Voir les ${list.length} clubs médaillés`;
    };
    $('#medalTable').addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (tr) { renderClubRecords(tr.dataset.id); $('#clubRecords').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    $('#medalTable').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.closest('tr[data-id]')?.click(); });
    box.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; sort = b.dataset.sort; box.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
    $('#medalMore').addEventListener('click', () => { all = !all; draw(); });
    draw();
  }

  /* ---------------- palmarès ---------------- */
  function renderHonours(pays) {
    const champs = clubs.filter(c => c.finales > 0).sort((a, b) => b.titres - a.titres || b.finales - a.finales).slice(0, 18);
    const finalsOf = id => eds.filter(e => e.vainqueur && (e.vainqueur.id === id || (e.finaliste && e.finaliste.id === id)));
    $('#honours').innerHTML = champs.map(c => `<li><span class="logo fallback" style="background:${c.couleur};color:${textOn(c.couleur)}">${esc(code(c))}</span>
      <span class="name"><a href="#club" data-club="${c.id}">${esc(c.nom)}</a><small>${esc(c.pays)}</small></span>
      <span class="pips">${finalsOf(c.id).map(e => {
        const won = e.vainqueur.id === c.id;
        return `<button class="pip ${won ? '' : 'lost'}" style="background:${c.couleur};--c:${c.couleur === '#F4F4F4' ? '#9AA5B1' : c.couleur}" data-ed="${e.edition}" data-tip="${esc((won ? 'Vainqueur ' : 'Finaliste ') + e.edition + (won ? (e.finaliste ? ' contre ' + e.finaliste.nom : '') : ', battu par ' + e.vainqueur.nom))}" aria-label="${esc((won ? 'Titre ' : 'Finale perdue ') + e.edition)}"></button>`;
      }).join('')}</span><span class="count">${c.titres}</span></li>`).join('');
    $('#honours').addEventListener('click', e => { const p = e.target.closest('.pip'); if (p) { openEdition(p.dataset.ed); $('#edition').scrollIntoView(); } });
    $('#countries').innerHTML = pays.filter(p => p.finales > 0).slice(0, 12).map(p => `<li><span>${esc(p.pays)}<small>${Object.entries(p.clubs_titres).map(([k, v]) => `${esc(k)} ${v}`).join(', ') || 'aucun titre'} · ${p.finales} finales</small></span><b>${p.titres}</b></li>`).join('');
  }


  /* ---------------- classement historique ---------------- */
  async function bindRanking() {
    const data = await get('classement.json');
    const rows = Object.entries(data.clubs);
    const state = { phase: '*', epoque: '*', lieu: '*', sort: 'v', n: 20 };
    const groups = [
      ['phase', 'Phase', [['*', 'Toutes'], ...PHASES]],
      ['epoque', 'Époque', [['*', 'Toutes'], ['ccc', 'Coupe des clubs champions (1964-1996)'], ['ldc8', '8 en poules (1997-2016)'], ['ldc16', '16 en poules (depuis 2017)']]],
      ['lieu', 'Lieu', [['*', 'Partout'], ['Domicile', 'À domicile'], ['Extérieur', 'À l\'extérieur'], ['Neutre', 'Terrain neutre']]],
    ];
    $('#rankFilters').innerHTML = groups.map(([k, lab, opts]) => `<div class="grp" role="group" aria-label="${lab}"><span>${lab}</span>${opts.map(([v, l]) => `<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${v === '*'}">${esc(l)}</button>`).join('')}</div>`).join('');
    const cols = [['j', 'J'], ['v', 'V'], ['n', 'N'], ['d', 'D'], ['bp', 'BP'], ['bc', 'BC'], ['diff', 'Diff.'], ['pctv', '% V']];
    const val = (s, k) => k === 'diff' ? s[4] - s[5] : k === 'pctv' ? (s[0] >= 10 ? s[1] / s[0] : -1) : s[['j', 'v', 'n', 'd', 'bp', 'bc'].indexOf(k)];
    function draw() {
      const key = `${state.phase}|${state.epoque}|${state.lieu}`;
      const list = rows.map(([id, c]) => ({ id, c, s: c.stats[key] })).filter(x => x.s && x.s[0] > 0);
      const asc = state.sort === 'd' || state.sort === 'bc';
      list.sort((a, b) => (asc ? val(a.s, state.sort) - val(b.s, state.sort) : val(b.s, state.sort) - val(a.s, state.sort)) || b.s[1] - a.s[1] || (b.s[4] - b.s[5]) - (a.s[4] - a.s[5]));
      let pos = 0, prev = null;
      const body = list.slice(0, state.n).map((x, i) => {
        const v = val(x.s, state.sort);
        if (v !== prev) { pos = i + 1; prev = v; }
        const s = x.s, d = s[4] - s[5];
        return `<tr class="${x.c.pays === 'Tunisie' ? 'tun' : ''}"><td class="pos">${pos}</td><td class="l club"><div class="cl"><span class="logo fallback" style="background:${x.c.couleur};color:${textOn(x.c.couleur)}">${esc(code({ id: x.id, nom: x.c.nom }))}</span><span><a href="#club" data-club="${x.id}">${esc(x.c.nom)}</a> <small>${esc(x.c.pays)}</small></span></div></td>
          ${cols.map(([k]) => `<td class="${k === state.sort ? 'key' : ''}">${k === 'diff' ? (d > 0 ? '+' : '') + d : k === 'pctv' ? (s[0] ? pct(s[1] / s[0]) : '–') : s[['j', 'v', 'n', 'd', 'bp', 'bc'].indexOf(k)]}</td>`).join('')}</tr>`;
      }).join('');
      $('#rankTable').innerHTML = `<thead><tr><th>#</th><th class="l">Club</th>${cols.map(([k, l]) => `<th class="${k === state.sort ? 'sorted' : ''}" aria-sort="${k === state.sort ? (asc ? 'ascending' : 'descending') : 'none'}"><button type="button" data-sort="${k}">${l}</button></th>`).join('')}</tr></thead><tbody>${body || '<tr><td colspan="10" class="l">Aucun match pour cette combinaison.</td></tr>'}</tbody>`;
      $('#rankMore').hidden = list.length <= state.n;
      $('#rankMore').textContent = `Voir 30 clubs de plus (${list.length} au total)`;
    }
    $('#rankFilters').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      state[b.dataset.k] = b.dataset.v; state.n = 20;
      b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
      draw();
    });
    $('#rankTable').addEventListener('click', e => { const b = e.target.closest('[data-sort]'); if (b) { state.sort = b.dataset.sort; draw(); } });
    $('#rankMore').addEventListener('click', () => { state.n += 30; draw(); });
    draw();
  }

  /* ---------------- suivi club ---------------- */
  const cache = {};
  async function openClub(id) {
    if (!byId[id]) return;
    document.querySelectorAll('#quickClubs .crest').forEach(b => b.setAttribute('aria-pressed', b.dataset.club === id));
    $('#clubSearch').value = byId[id].nom;
    const c = cache[id] || (cache[id] = await get('clubs/' + id + '.json'));
    const s = c.stats;
    const panel = $('#clubPanel');
    panel.style.setProperty('--club', c.couleur === '#F4F4F4' ? '#9AA5B1' : c.couleur);
    const row = (lab, x) => `<tr><td>${lab}</td><td>${x.j}</td><td>${x.v}</td><td>${x.n}</td><td>${x.d}</td><td>${x.bp}</td><td>${x.bc}</td><td class="pct">${x.j ? pct(x.v / x.j) : '–'}<span class="bar" style="width:${x.j ? Math.round(x.v / x.j * 60) : 0}px"></span></td></tr>`;
    const lieu = (lab, x) => x.j ? `<div class="lieu"><span>${lab}</span><span class="stack" aria-hidden="true"><i class="v" style="width:${x.v / x.j * 100}%"></i><i class="n" style="width:${x.n / x.j * 100}%"></i><i class="d" style="width:${x.d / x.j * 100}%"></i></span><b>${pct(x.v / x.j)}</b></div>
      <div class="lieu" style="margin-top:-8px"><span></span><span class="muted" style="font-size:13px;color:var(--stone)">${x.j} matchs : ${x.v} V, ${x.n} N, ${x.d} D · ${x.bp} buts marqués, ${x.bc} encaissés</span></div>` : '';
    const first = eds.findIndex(e => e.edition === c.parcours[0]?.edition);
    const span = eds.slice(Math.max(0, first));
    const pmap = Object.fromEntries(c.parcours.map(p => [p.edition, p]));
    const ribbon = span.map(e => {
      const p = pmap[e.edition];
      if (!p) return `<span data-tip="${esc(e.edition + ' : absent')}"></span>`;
      const d = DEPTH[p.resultat] || 1;
      return `<span class="${p.resultat === 'Vainqueur' ? 'win' : ''}" tabindex="0" data-tip="${esc(e.edition + ' : ' + p.resultat + (p.elimine_par ? ', éliminé par ' + p.elimine_par.nom : ''))}"><i style="height:${d / 6 * 100}%"></i></span>`;
    }).join('');
    const phases = [...new Set(c.matchs.map(m => m.phase))];
    panel.innerHTML = `<div class="club-head"><span class="logo fallback" style="width:64px;height:64px;font-size:18px;background:${c.couleur};color:${textOn(c.couleur)}">${esc(code(c))}</span>
        <div><h3>${esc(c.nom)}</h3><p>${esc(c.pays)}${c.ville ? ', ' + esc(c.ville) : ''} · de ${esc(c.premiere)} à ${esc(c.derniere)} · meilleur résultat : ${esc(c.meilleur_resultat.toLowerCase())}</p></div></div>
      <div class="kpis">
        <div><b style="color:${c.titres ? '#C9A227' : 'inherit'}">${c.titres}</b><span>${c.titres > 1 ? 'titres' : 'titre'}</span></div>
        <div><b>${c.finales}</b><span>finales</span></div>
        <div><b>${c.participations}</b><span>participations</span></div>
        <div><b>${fmt(s.j)}</b><span>matchs</span></div>
        <div><b>${s.j ? pct(s.v / s.j) : '–'}</b><span>de victoires (${s.v} V, ${s.n} N, ${s.d} D)</span></div>
        <div><b>${fmt(s.bp)}</b><span>buts marqués, ${fmt(s.bc)} encaissés</span></div>
      </div>
      <h4 style="font:800 20px var(--display);margin:0 0 4px">Le parcours, édition par édition</h4>
      <div class="ribbon" aria-label="Phase atteinte à chaque édition">${ribbon}</div>
      <div class="ribbon-axis"><span>${esc(span[0]?.edition || '')}</span><span>Plus la barre est haute, plus le club est allé loin. Doré : titre.</span><span>${esc(span[span.length - 1]?.edition || '')}</span></div>
      <div class="club-grid" style="margin-top:28px">
        <div><h4>Par phase</h4><div class="table-wrap"><table class="phase-table"><thead><tr><th>Phase</th><th>J</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>% V</th></tr></thead>
          <tbody>${PHASES.map(([k, lab]) => c.par_phase[k].j ? row(lab, c.par_phase[k]) : '').join('')}${row('<b>Total</b>', s)}</tbody></table></div></div>
        <div><h4>À domicile, à l'extérieur</h4><div class="lieux">${lieu('Domicile', c.par_lieu['Domicile'])}${lieu('Extérieur', c.par_lieu['Extérieur'])}${lieu('Neutre', c.par_lieu['Neutre'])}</div>
          <div class="key"><span><i style="background:#2E7D52"></i>victoires</span><span><i style="background:#C9CFD8"></i>nuls</span><span><i style="background:#C0392B"></i>défaites</span></div></div>
      </div>
      <details class="matches"><summary>Tous les matchs (${c.matchs.length})</summary>
        <div class="match-filters" role="group" aria-label="Filtrer par phase"><button aria-pressed="true" data-ph="">Toutes les phases</button>${PHASES.filter(([k]) => phases.includes(k)).map(([k, l]) => `<button aria-pressed="false" data-ph="${k}">${l}</button>`).join('')}</div>
        <div class="table-wrap"><table class="mlist"><tbody></tbody></table></div></details>`;
    const fill = ph => {
      const rows = c.matchs.filter(m => !ph || m.phase === ph).slice().reverse();
      panel.querySelector('.mlist tbody').innerHTML = rows.map(m => `<tr><td class="muted">${esc(m.edition)}</td><td class="hide-s">${esc(m.tour)}${m.groupe ? ' ' + esc(m.groupe.replace('Group', '')) : ''}</td>
        <td class="muted hide-s">${esc(m.lieu)}</td><td>${clubLink(m.adversaire)}</td><td class="sc">${m.bp != null ? m.bp + '-' + m.bc : '–'}</td>
        <td class="res ${m.compte ? m.resultat : ''}">${m.compte ? m.resultat : '<span class="muted" title="non compté">' + esc(m.etat === 'awd' ? 'TV' : m.etat || '–') + '</span>'}</td></tr>`).join('');
    };
    fill('');
    panel.querySelector('.match-filters').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      panel.querySelectorAll('.match-filters button').forEach(x => x.setAttribute('aria-pressed', x === b));
      fill(b.dataset.ph);
    });
  }
  function bindClubs() {
    const byName = Object.fromEntries(clubs.map(c => [c.nom, c.id]));
    $('#clubList').innerHTML = clubs.slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map(c => `<option value="${esc(c.nom)}">${esc(c.pays)}</option>`).join('');
    $('#clubSearch').addEventListener('change', e => { const id = byName[e.target.value]; if (id) openClub(id); });
    const quick = clubs.filter(c => c.titres > 0 || ['club-africain', 'cs-sfaxien', 'etoile-sahel'].includes(c.id)).slice(0, 20);
    $('#quickClubs').innerHTML = quick.map(c => `<button class="crest" role="listitem" data-club="${c.id}" data-tip="${esc(c.nom)}" aria-label="${esc(c.nom)}" aria-pressed="false"><span class="logo fallback" style="background:${c.couleur};color:${textOn(c.couleur)};width:100%;height:100%;font-size:12px">${esc(code(c))}</span></button>`).join('');
    $('#quickClubs').addEventListener('click', e => { const b = e.target.closest('.crest'); if (b) openClub(b.dataset.club); });
  }


  /* ---------------- duel ---------------- */
  const loadClub = async id => cache[id] || (cache[id] = await get('clubs/' + id + '.json'));
  async function renderDuel(idA, idB) {
    if (!byId[idA] || !byId[idB] || idA === idB) return;
    $('#duelA').value = byId[idA].nom; $('#duelB').value = byId[idB].nom;
    const [a, b] = await Promise.all([loadClub(idA), loadClub(idB)]);
    const colA = a.couleur === '#F4F4F4' ? '#9AA5B1' : a.couleur;
    let colB = b.couleur === '#F4F4F4' ? '#9AA5B1' : b.couleur;
    if (colB === colA) colB = '#5F6B7E';
    // confrontations directes (matchs comptabilisés)
    const h = a.matchs.filter(m => m.adversaire.id === idB);
    const played = h.filter(m => m.compte);
    const wa = played.filter(m => m.resultat === 'V').length, wb = played.filter(m => m.resultat === 'D').length, dr = played.length - wa - wb;
    const ga = played.reduce((s, m) => s + m.bp, 0), gb = played.reduce((s, m) => s + m.bc, 0);
    const pa = Object.fromEntries(a.parcours.map(p => [p.edition, p]));
    const pb = Object.fromEntries(b.parcours.map(p => [p.edition, p]));
    const elimA = a.parcours.filter(p => p.elimine_par && p.elimine_par.id === idB).length;
    const elimB = b.parcours.filter(p => p.elimine_par && p.elimine_par.id === idA).length;
    const logo = c => `<span class="logo fallback" style="background:${c.couleur};color:${textOn(c.couleur)}">${esc(code(c))}</span>`;
    const scoreboard = `<div class="scoreboard"><div class="side a">${logo(a)}<span class="nm">${esc(a.nom)}</span></div>
      <div class="score">${played.length ? `${wa} – ${wb}<span class="draws">${dr} nul${dr > 1 ? 's' : ''}</span>` : '–'}
      <small>${played.length ? `victoires en ${played.length} matchs directs, ${ga} buts à ${gb}` : 'jamais affrontés en Ligue des champions'}${elimA + elimB ? ` · élimination directe : ${esc(b.nom)} a sorti ${esc(a.nom)} ${elimA} fois, ${esc(a.nom)} a sorti ${esc(b.nom)} ${elimB} fois` : ''}</small></div>
      <div class="side b"><span class="nm">${esc(b.nom)}</span>${logo(b)}</div></div>`;
    // comparaison globale
    const sa = a.stats, sb = b.stats;
    const reach = (c, ph) => c.parcours.filter(p => ['demis', 'finale'].includes(p.phase_max) || ['Vainqueur', 'Finaliste', 'Demi-finaliste'].includes(p.resultat)).length;
    const lieuPct = (c, l) => c.par_lieu[l].j ? c.par_lieu[l].v / c.par_lieu[l].j : null;
    const ind = [
      ['Titres', a.titres, b.titres, 1, v => fmt(v)],
      ['Finales', a.finales, b.finales, 1, v => fmt(v)],
      ['Demi-finales atteintes', reach(a), reach(b), 1, v => fmt(v)],
      ['Participations', a.participations, b.participations, 1, v => fmt(v)],
      ['Matchs joués', sa.j, sb.j, 1, v => fmt(v)],
      ['% de victoires', sa.v / sa.j, sb.v / sb.j, 1, pct],
      ['% de victoires à domicile', lieuPct(a, 'Domicile'), lieuPct(b, 'Domicile'), 1, pct],
      ['% de victoires à l\'extérieur', lieuPct(a, 'Extérieur'), lieuPct(b, 'Extérieur'), 1, pct],
      ['Buts marqués par match', sa.bp / sa.j, sb.bp / sb.j, 1, v => v == null ? '–' : v.toFixed(2).replace('.', ',')],
      ['Buts encaissés par match', sa.bc / sa.j, sb.bc / sb.j, -1, v => v == null ? '–' : v.toFixed(2).replace('.', ',')],
    ];
    const butterfly = ind.map(([lab, va, vb, dir, f]) => {
      const m = Math.max(va || 0, vb || 0) || 1;
      const winA = va != null && vb != null && (va - vb) * dir > 0, winB = va != null && vb != null && (vb - va) * dir > 0;
      return `<div class="bf-row"><span class="bar a"><i style="width:${(va || 0) / m * 100}%;background:${colA}"></i></span><span class="v a ${winA ? 'win' : ''}">${f(va)}</span><span class="lab">${lab}</span><span class="v ${winB ? 'win' : ''}">${f(vb)}</span><span class="bar b"><i style="width:${(vb || 0) / m * 100}%;background:${colB}"></i></span></div>`;
    }).join('') + '<p class="aside" style="margin-top:10px">Souligné en or : le club qui fait mieux.</p>';
    // parcours côte à côte
    const firstIdx = Math.min(...[a, b].map(c => eds.findIndex(e => e.edition === c.parcours[0]?.edition)).filter(i => i >= 0));
    const span = eds.slice(firstIdx);
    const rib = (c, pm, col) => `<div class="ribbon" style="--club:${col}">${span.map(e => {
      const p = pm[e.edition];
      if (!p) return `<span data-tip="${esc(e.edition + ' : ' + c.nom + ' absent')}"></span>`;
      return `<span class="${p.resultat === 'Vainqueur' ? 'win' : ''}" tabindex="0" data-tip="${esc(e.edition + ' : ' + c.nom + ', ' + p.resultat.toLowerCase())}"><i style="height:${(DEPTH[p.resultat] || 1) / 6 * 100}%"></i></span>`;
    }).join('')}</div>`;
    // liste des confrontations
    let lastEd = '';
    const rows = h.slice().reverse().map(m => {
      const sep = m.edition !== lastEd; lastEd = m.edition;
      const home = m.lieu === 'Domicile';
      const left = home ? a : b, right = home ? b : a;
      const sl = home ? m.bp : m.bc, sr = home ? m.bc : m.bp;
      const note = !m.compte ? ` <span class="muted">(${esc(m.etat === 'awd' ? 'tapis vert' : m.etat || 'non compté')})</span>` : m.lieu === 'Neutre' ? ' <span class="muted">(terrain neutre)</span>' : '';
      const won = m.phase === 'finale' ? 'vainqueur' : 'qualifié';
      const qual = sep ? (pa[m.edition]?.elimine_par?.id === idB ? `${esc(b.nom)} ${won}` : pb[m.edition]?.elimine_par?.id === idA ? `${esc(a.nom)} ${won}` : '') : '';
      return `<tr class="${sep ? 'sep' : ''}"><td class="muted">${sep ? esc(m.edition) : ''}</td><td>${esc(m.tour)}</td>
        <td class="r ${sl > sr ? 'w' : ''}">${esc(left.nom)}</td><td class="sc">${m.bp != null ? sl + '-' + sr : '–'}</td><td class="${sr > sl ? 'w' : ''}">${esc(right.nom)}${note}</td><td class="muted hide-s">${qual}</td></tr>`;
    }).join('');
    $('#duelPanel').innerHTML = scoreboard + `<div class="duel-cols"><div><h4>Toute l'histoire, côte à côte</h4>${butterfly}</div>
      <div><h4>Les confrontations directes</h4>${h.length ? `<div class="table-wrap"><table class="h2h"><tbody>${rows}</tbody></table></div>` : '<p class="aside">Ces deux clubs ne se sont jamais rencontrés dans la compétition.</p>'}</div></div>
      <div class="duel-wide"><h4>Leurs parcours, édition par édition</h4><div class="ribbons-2"><span class="lab">${esc(a.nom)}</span>${rib(a, pa, colA)}<span class="lab">${esc(b.nom)}</span>${rib(b, pb, colB)}</div>
      <div class="ribbon-axis" style="margin-left:152px"><span>${esc(span[0]?.edition || '')}</span><span>Plus la barre est haute, plus le club est allé loin. Doré : titre.</span><span>${esc(span[span.length - 1]?.edition || '')}</span></div></div>`;
  }
  function bindDuel() {
    const byName = Object.fromEntries(clubs.map(c => [c.nom, c.id]));
    let a = 'esperance-tunis', b = 'al-ahly';
    $('#duelA').addEventListener('change', e => { if (byName[e.target.value]) { a = byName[e.target.value]; renderDuel(a, b); } });
    $('#duelB').addEventListener('change', e => { if (byName[e.target.value]) { b = byName[e.target.value]; renderDuel(a, b); } });
    renderDuel(a, b);
  }

  /* ---------------- édition ---------------- */
  async function openEdition(ed) {
    $('#editionSelect').value = ed;
    document.querySelectorAll('.era-tiles .cell').forEach(b => b.classList.toggle('on', b.dataset.ed === ed));
    const e = await get('editions/' + ed + '.json');
    const name = c => clubLink(c);
    $('#editionPanel').innerHTML = `<div class="ed-head"><span>${esc(e.epoque)}</span><span>Vainqueur : <b>${e.vainqueur ? esc(e.vainqueur.nom) : 'en cours'}</b></span>${e.finaliste ? `<span>Finaliste : <b>${esc(e.finaliste.nom)}</b></span>` : ''}<span><b>${e.nb_clubs}</b> clubs</span><span><b>${e.nb_matchs}</b> matchs</span><span><b>${e.nb_buts}</b> buts</span><span>Source : ${esc(e.source)}</span></div>` +
      e.tours.slice().reverse().map(t => {
        let body = '';
        if (t.poules.length) {
          body += `<div class="groups">${t.poules.map(g => `<table class="gtab"><caption>${esc(g.groupe)}</caption><tbody>${g.classement.map((r, i) => `<tr class="${i < (e.epoque_code === 'ldc8' && e.annee_debut <= 2000 ? 1 : 2) ? 'up' : ''}"><td>${name(r)}</td><td>${r.j}</td><td>${r.v}-${r.n}-${r.d}</td><td>${r.bp}-${r.bc}</td><td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table>`).join('')}</div>`;
        }
        if (t.confrontations.length) {
          body += `<div class="ties">${t.confrontations.map(c => {
            const qa = c.qualifie === c.club_a.id, qb = c.qualifie === c.club_b.id;
            const legs = c.matchs.filter(m => m.score).map(m => m.score).join(', ');
            const extra = c.tab ? `t.a.b. ${c.tab}` : c.mode && !/cumul|unique/.test(c.mode) ? c.mode : legs;
            return `<div class="tie"><span class="a ${qa ? 'q' : ''}">${name(c.club_a)}</span><span class="s">${c.cumul || '–'}<small>${esc(extra)}</small></span><span class="${qb ? 'q' : ''}">${name(c.club_b)}</span></div>`;
          }).join('')}</div>`;
        }
        return `<div class="ed-tour"><h4>${esc(t.tour)}</h4>${body}</div>`;
      }).join('');
  }
  function bindEditions() {
    $('#editionSelect').innerHTML = eds.slice().reverse().map(e => `<option value="${e.edition}">${e.edition}${e.vainqueur ? ' – ' + esc(e.vainqueur.nom) : ' – en cours'}</option>`).join('');
    $('#editionSelect').addEventListener('change', e => openEdition(e.target.value));
  }

  /* ---------------- formats ---------------- */
  function renderFormats() {
    $('#formatGrid').innerHTML = ['ccc', 'ldc8', 'ldc16'].map(k => {
      const list = eds.filter(e => e.epoque_code === k);
      const m = list.reduce((a, e) => a + e.nb_matchs, 0), b = list.reduce((a, e) => a + e.nb_buts, 0);
      const winners = new Set(list.filter(e => e.vainqueur).map(e => e.vainqueur.id));
      const n = list.length;
      return `<div class="fmt"><h3>${ERA_TXT[k][0]}</h3><p class="yrs">${esc(list[0].edition)} à ${esc(list[n - 1].edition)}</p><dl>
        <dt>Éditions</dt><dd>${n}</dd><dt>Matchs par édition</dt><dd>${fmt(m / n)}</dd><dt>Buts par match</dt><dd>${(b / m).toFixed(2).replace('.', ',')}</dd>
        <dt>Clubs par édition</dt><dd>${fmt(list.reduce((a, e) => a + e.nb_clubs, 0) / n)}</dd><dt>Vainqueurs différents</dt><dd>${winners.size}</dd></dl></div>`;
    }).join('');
  }

  /* ---------------- données ---------------- */
  async function renderData() {
    const idx = await get('index.json');
    const labels = { meta: 'Métadonnées', editions: 'Éditions', clubs: 'Clubs', pays: 'Pays', records: 'Records', club: 'Un club', edition: 'Une édition' };
    $('#endpoints').innerHTML = Object.entries(idx.points_acces).map(([k, u]) => {
      const href = u.replace('{club_id}', 'esperance-tunis').replace('{edition}', '2018-19');
      return `<li><b>${labels[k] || k}</b><a href="${esc(href)}">${esc(u.replace(/^https:\/\/[^/]+\//, '…/'))}</a></li>`;
    }).join('');
    $('#rules').innerHTML = meta.regles.map(r => `<li>${esc(r)}</li>`).join('');
    const sy = meta.controles, total = Object.values(sy).reduce((a, b) => a + b, 0);
    $('#qualityText').textContent = `${total} contrôles automatiques : chaque champion comparé à la liste officielle, chaque score cumulé recalculé à partir des matchs, chaque classement de poule recalculé, chaque qualifié retrouvé au tour suivant. ${sy.OK || 0} sont OK ; voici les autres, sans les cacher.`;
    $('#issues').innerHTML = meta.anomalies.map(a => `<li><b>${esc(a.edition)}</b> : ${esc(a.controle)}${a.detail ? ' (' + esc(a.detail) + ')' : ''}${a.resultat === 'EXPLIQUÉ' ? ', expliqué' : ''}</li>`).join('');
    $('#sources').innerHTML = meta.sources.map(s => `<li><a href="${esc(s.url)}">${esc(s.nom)}</a>, ${esc(s.licence)} (${esc(s.editions)})</li>`).join('');
    if (meta.depot) { $('#repoLink').href = meta.depot; $('#csvLink').href = meta.csv; }
    $('#updated').textContent = meta.mise_a_jour ? new Date(meta.mise_a_jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '–';
  }

  async function init() {
    try {
      let pays;
      [meta, eds, clubs, recs, pays] = await Promise.all(['meta.json', 'editions.json', 'clubs.json', 'records.json', 'pays.json'].map(get));
      byId = Object.fromEntries(clubs.map(c => [c.id, c]));
      renderWall();
      renderRecords();
      renderClubRecords(FEATURED);
      renderMedals();
      renderHonours(pays);
      bindClubs();
      bindEditions();
      bindDuel();
      bindRanking();
      renderFormats();
      renderData();
      const hash = new URLSearchParams(location.search);
      openClub(hash.get('club') && byId[hash.get('club')] ? hash.get('club') : 'esperance-tunis');
      const lastDone = eds.filter(e => e.vainqueur).pop();
      openEdition(lastDone.edition);
    } catch (e) {
      $('#contenu').insertAdjacentHTML('afterbegin', `<p class="block">Les données n'ont pas pu être chargées (${esc(e.message)}). Rechargez la page dans un instant.</p>`);
    }
  }
  init();
})();
