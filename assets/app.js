/* Ligue 1 tunisienne – site public. Données : ./api/v1/*.json (générées par scripts/build_api.py). */
(() => {
  const API = (window.TA_ROOT || '') + 'api/v1/';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n, d = 0) => n == null || isNaN(n) ? '–' : n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = n => n == null || isNaN(n) ? '–' : Math.round(n * 100) + ' %';
  const SVGNS = 'http://www.w3.org/2000/svg';

  const CODES = {
    'esperance-tunis': 'EST', 'club-africain': 'CA', 'etoile-sahel': 'ESS', 'cs-sfaxien': 'CSS',
    'stade-tunisien': 'ST', 'ca-bizertin': 'CAB', 'cs-hammam-lif': 'CSHL', 'js-kairouan': 'JSK',
    'sfax-railways': 'SRS', 'us-monastir': 'USM',
  };

  let clubs = [], byId = {}, saisons = [], rows = [], rowsByClub = {}, rowsBySeason = {};

  const code = c => CODES[c.id] || c.nom_court.split(/[\s-]+/).filter(w => !/^(de|du|des|la|le|d'|l')$/i.test(w)).map(w => w[0]).join('').toUpperCase().slice(0, 4);
  function textOn(hex) {
    const h = (hex || '#999').replace('#', '');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#15233D' : '#FFFFFF';
  }
  function logo(c, cls = 'logo') {
    if (c && c.logo) return `<img class="${cls}" src="${esc(c.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-club="${esc(c.id)}">`;
    const col = c ? c.couleur : '#9AA5B1';
    return `<span class="${cls} fallback" style="background:${col};color:${textOn(col)}" aria-hidden="true">${esc(c ? code(c) : '?')}</span>`;
  }
  // un logo qui ne charge pas est remplacé par une pastille aux couleurs du club
  document.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.dataset.club) return;
    const c = byId[img.dataset.club];
    const span = document.createElement('span');
    span.className = img.className + ' fallback';
    span.style.background = c.couleur; span.style.color = textOn(c.couleur);
    span.textContent = code(c);
    img.replaceWith(span);
  }, true);

  /* infobulle partagée : tout élément avec data-tip */
  const tip = $('#tip');
  function showTip(el, x, y) {
    tip.textContent = el.dataset.tip; tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2)) + 'px';
    tip.style.top = Math.max(8, y - h - 12) + 'px';
  }
  document.addEventListener('mouseover', e => { const el = e.target.closest('[data-tip]'); if (el) showTip(el, e.clientX, e.clientY); });
  document.addEventListener('mousemove', e => { const el = e.target.closest('[data-tip]'); if (el) showTip(el, e.clientX, e.clientY); else tip.hidden = true; });
  document.addEventListener('focusin', e => { const el = e.target.closest('[data-tip]'); if (el) { const r = el.getBoundingClientRect(); showTip(el, r.left + r.width / 2, r.top); } });
  document.addEventListener('focusout', () => { tip.hidden = true; });

  const svg = (w, h, inner, label) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" xmlns="${SVGNS}">${inner}</svg>`;

  /* ---------------- mur des champions ---------------- */
  function renderWall() {
    const wall = $('#wall');
    const bySeasonStart = Object.fromEntries(saisons.map(s => [s.annee_debut, s]));
    const first = Math.floor(saisons[0].annee_debut / 10) * 10, last = saisons[saisons.length - 1].annee_debut;
    let html = '<span></span>' + Array.from({ length: 10 }, (_, i) => `<span class="head" aria-hidden="true">${i}</span>`).join('');
    let i = 0;
    for (let dec = first; dec <= last; dec += 10) {
      html += `<span class="dec" aria-hidden="true">${dec}</span>`;
      for (let y = dec; y < dec + 10; y++) {
        const s = bySeasonStart[y];
        if (!s) { html += '<span class="empty" aria-hidden="true"></span>'; continue; }
        const c = byId[s.champion];
        const col = c ? c.couleur : '#D6DEEA';
        html += `<button class="cell" role="listitem" style="--i:${i++};background:${col};color:${textOn(col)}" data-season="${s.saison}" data-tip="${esc(s.saison + ' : ' + (c ? c.nom_court : 'pas de champion'))}" aria-label="${esc(s.saison + ', champion ' + (c ? c.nom_court : 'inconnu'))}"><small>${s.saison.slice(2, 4)}</small>${c ? code(c) : ''}</button>`;
      }
    }
    wall.innerHTML = html;
    wall.addEventListener('click', e => {
      const b = e.target.closest('.cell'); if (!b) return;
      selectSeason(b.dataset.season);
      $('#saison').scrollIntoView();
    });
    const champs = clubs.filter(c => c.stats.titres > 0);
    $('#wallLegend').innerHTML = champs.map(c => `<span><i style="background:${c.couleur}"></i>${esc(code(c))} ${esc(c.nom_court)}</span>`).join('');
  }

  /* ---------------- classement d'une saison ---------------- */
  function selectSeason(s) {
    $('#seasonSelect').value = s;
    document.querySelectorAll('.wall .cell').forEach(b => b.classList.toggle('on', b.dataset.season === s));
    const meta = saisons.find(x => x.saison === s);
    const champ = byId[meta.champion];
    $('#seasonMeta').innerHTML = `<span>Champion : <b>${esc(champ ? champ.nom_court : '–')}</b></span><span><b>${meta.nb_equipes}</b> équipes</span><span>Format : <b>${esc(meta.format)}</b></span><span>Barème : <b>${esc(meta.bareme)}</b> (victoire-nul-défaite)</span>`;
    const list = (rowsBySeason[s] || []).slice().sort((a, b) => (a.rang ?? 99) - (b.rang ?? 99) || (b.pts ?? 0) - (a.pts ?? 0));
    $('#standings').innerHTML = `<thead><tr><th>#</th><th class="l">Club</th><th>J</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>Diff.</th><th>Pts</th></tr></thead><tbody>` +
      list.map(r => {
        const c = byId[r.club_id];
        const cls = r.champion ? 'champ' : r.relegue ? 'releg' : '';
        const note = r.penalite ? ` <span class="note">(${r.penalite} pts de pénalité)</span>` : r.relegue ? ' <span class="note">relégué</span>' : '';
        return `<tr class="${cls}" data-club="${r.club_id}" tabindex="0"><td class="rank">${r.rang ?? '–'}</td><td class="l club">${logo(c)}<span>${esc(c.nom_court)}${note}</span></td><td>${r.j}</td><td>${r.v}</td><td>${r.n}</td><td>${r.d}</td><td>${r.bp}</td><td>${r.bc}</td><td>${r.bp - r.bc > 0 ? '+' : ''}${r.bp - r.bc}</td><td class="pts">${r.pts ?? '–'}</td></tr>`;
      }).join('') + '</tbody>';
  }
  function bindStandings() {
    const open = tr => { selectClub(tr.dataset.club); $('#club').scrollIntoView(); };
    $('#standings').addEventListener('click', e => { const tr = e.target.closest('tr[data-club]'); if (tr) open(tr); });
    $('#standings').addEventListener('keydown', e => { const tr = e.target.closest('tr[data-club]'); if (tr && e.key === 'Enter') open(tr); });
    $('#seasonSelect').innerHTML = saisons.slice().reverse().map(s => `<option value="${s.saison}">${s.saison}</option>`).join('');
    $('#seasonSelect').addEventListener('change', e => selectSeason(e.target.value));
  }

  /* ---------------- palmarès ---------------- */
  function renderHonours() {
    const champs = clubs.filter(c => c.stats.titres > 0).sort((a, b) => b.stats.titres - a.stats.titres);
    $('#honours').innerHTML = champs.map(c => `<li>${logo(c)}<span class="name">${esc(c.nom_court)}<small>${esc(c.ville)}</small></span>
      <span class="pips">${c.stats.titres_saisons.map(s => `<button class="pip" style="background:${c.couleur}" data-tip="${esc(c.nom_court + ' champion ' + s)}" data-season="${s}" aria-label="Titre ${s}"></button>`).join('')}</span>
      <span class="count">${c.stats.titres}</span></li>`).join('');
    $('#honours').addEventListener('click', e => { const p = e.target.closest('.pip'); if (p) { selectSeason(p.dataset.season); $('#saison').scrollIntoView(); } });
  }

  /* ---------------- course aux titres ---------------- */
  function renderRace() {
    const top = clubs.filter(c => c.stats.titres > 0).sort((a, b) => b.stats.titres - a.stats.titres).slice(0, 5);
    const W = narrow() ? 520 : 1100, H = narrow() ? 520 : 440, L = 36, R = narrow() ? 150 : 170, T = 16, B = 34;
    const y0 = saisons[0].annee_debut, y1 = saisons[saisons.length - 1].annee_debut;
    const max = Math.max(...top.map(c => c.stats.titres));
    const X = y => L + (y - y0) / (y1 - y0) * (W - L - R);
    const Y = v => T + (1 - v / max) * (H - T - B);
    let g = '';
    for (let v = 0; v <= max; v += 5) g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
    for (let y = Math.ceil(y0 / 10) * 10; y <= y1; y += narrow() ? 20 : 10) g += `<text x="${X(y)}" y="${H - 10}" text-anchor="middle">${y}</text>`;
    const ends = [];
    top.forEach(c => {
      const won = new Set(c.stats.titres_saisons);
      let n = 0, d = `M${X(y0)},${Y(0)}`;
      saisons.forEach(s => { const x = X(s.annee_debut); if (won.has(s.saison)) { n++; d += `H${x}V${Y(n)}`; } });
      d += `H${X(y1)}`;
      const stroke = c.couleur === '#1C1C1C' ? '#1C1C1C' : c.couleur;
      g += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="3.5" stroke-linejoin="round"/>`;
      ends.push({ c, y: Y(n), n });
    });
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 18) ends[i].y = ends[i - 1].y + 18;
    ends.forEach(e => { g += `<text class="lbl" x="${W - R + 10}" y="${e.y + 5}" style="fill:${e.c.couleur === '#F7D117' ? '#9A7F00' : e.c.couleur}">${esc(e.c.nom_court)} ${e.n}</text>`; });
    $('#raceChart').innerHTML = svg(W, H, g, 'Titres cumulés des cinq clubs les plus titrés de 1955 à aujourd\'hui');
  }

  /* ---------------- trajectoire (rang par saison) ---------------- */
  const narrow = () => window.innerWidth < 700;
  function trajectory(series, W = narrow() ? 420 : 760, H = 300) {
    const L = 30, R = 12, T = 14, B = 30;
    const y0 = saisons[0].annee_debut, y1 = saisons[saisons.length - 1].annee_debut;
    const maxRank = Math.max(12, ...series.flatMap(s => s.rows.map(r => r.rang || 0)));
    const X = y => L + (y - y0) / (y1 - y0) * (W - L - R);
    const Y = r => T + (r - 1) / (maxRank - 1) * (H - T - B);
    let g = '';
    [1, 4, 8, 12, 16].filter(r => r <= maxRank).forEach(r => { g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(r)}" y2="${Y(r)}"/><text x="${L - 8}" y="${Y(r) + 4}" text-anchor="end">${r}</text>`; });
    for (let y = Math.ceil(y0 / 10) * 10; y <= y1; y += narrow() ? 20 : 10) g += `<text x="${X(y)}" y="${H - 8}" text-anchor="middle">${y}</text>`;
    series.forEach(s => {
      const pts = s.rows.filter(r => r.rang).map(r => ({ x: X(+r.saison.slice(0, 4)), y: Y(r.rang), r })).sort((a, b) => a.x - b.x);
      let d = '';
      pts.forEach((p, i) => {
        const gap = i === 0 || (+p.r.saison.slice(0, 4)) - (+pts[i - 1].r.saison.slice(0, 4)) > 1;
        d += (gap ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1);
      });
      g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" opacity=".9"/>`;
      pts.forEach(p => {
        const champ = p.r.champion;
        g += `<circle cx="${p.x}" cy="${p.y}" r="${champ ? 6 : 3.5}" fill="${champ ? '#C9A227' : s.color}" stroke="#fff" stroke-width="${champ ? 2 : 1}" tabindex="0" data-tip="${esc(s.name + ' · ' + p.r.saison + ' : ' + p.r.rang + (p.r.rang === 1 ? 'er' : 'e') + (champ ? ', champion' : ''))}"/>`;
      });
    });
    return svg(W, H, g, 'Classement final saison par saison, le premier en haut');
  }

  /* ---------------- fiche club ---------------- */
  function selectClub(id) {
    const c = byId[id]; if (!c) return;
    $('#clubSelect').value = id;
    document.querySelectorAll('.crest').forEach(b => b.setAttribute('aria-pressed', b.dataset.club === id));
    const s = c.stats;
    const lastTitle = s.titres_saisons[s.titres_saisons.length - 1];
    const card = $('#clubCard');
    card.style.setProperty('--club', c.couleur);
    card.innerHTML = `<div class="club-id">${logo(c)}<h3>${esc(c.nom_court)}</h3>${c.nom_ar ? `<p class="ar" lang="ar">${esc(c.nom_ar)}</p>` : ''}
        <p>${esc(c.nom)}</p><p>${esc(c.ville)}${c.fondation ? ', fondé en ' + c.fondation : ''}</p>
        <div class="stats">
          <div class="stat"><b style="color:${s.titres ? '#C9A227' : 'inherit'}">${s.titres}</b><span>${s.titres > 1 ? 'titres' : 'titre'}${lastTitle ? ', dernier en ' + lastTitle : ''}</span></div>
          <div class="stat"><b>${s.saisons}</b><span>saisons en Ligue 1, depuis ${esc(s.premiere_saison)}</span></div>
          <div class="stat"><b>${s.podiums}</b><span>podiums</span></div>
          <div class="stat"><b>${pct(s.v / s.j)}</b><span>de victoires (${fmt(s.v)} sur ${fmt(s.j)} matchs)</span></div>
        </div></div>
      <div class="club-chart"><h4>Classement final, saison par saison</h4><div class="chart">${trajectory([{ name: c.nom_court, color: c.couleur, rows: rowsByClub[id] || [] }])}</div>
      <p class="aside">En haut, la première place. Les points dorés sont les titres. Les trous sont les saisons hors de la Ligue 1.</p></div>`;
  }
  function bindClubs() {
    const sorted = clubs.slice().sort((a, b) => a.nom_court.localeCompare(b.nom_court, 'fr'));
    $('#clubSelect').innerHTML = sorted.map(c => `<option value="${c.id}">${esc(c.nom_court)}</option>`).join('');
    $('#clubSelect').addEventListener('change', e => selectClub(e.target.value));
    const regulars = clubs.slice().sort((a, b) => b.stats.saisons - a.stats.saisons).slice(0, 18);
    $('#crestRow').innerHTML = regulars.map(c => `<button class="crest" role="listitem" data-club="${c.id}" data-tip="${esc(c.nom_court)}" aria-label="${esc(c.nom_court)}" aria-pressed="false">${logo(c)}</button>`).join('');
    $('#crestRow').addEventListener('click', e => { const b = e.target.closest('.crest'); if (b) selectClub(b.dataset.club); });
  }

  /* ---------------- duel ---------------- */
  function renderDuel() {
    const a = byId[$('#duelA').value], b = byId[$('#duelB').value];
    const ra = Object.fromEntries((rowsByClub[a.id] || []).map(r => [r.saison, r]));
    const rb = Object.fromEntries((rowsByClub[b.id] || []).map(r => [r.saison, r]));
    let aw = 0, bw = 0, common = 0;
    Object.keys(ra).forEach(s => { if (rb[s] && ra[s].rang && rb[s].rang) { common++; if (ra[s].rang < rb[s].rang) aw++; else bw++; } });
    $('#scoreboard').innerHTML = `<div class="side a">${logo(a)}<span class="nm">${esc(a.nom_court)}</span></div>
      <div class="score">${aw} – ${bw}<small>saisons terminées devant l'autre, sur ${common} saisons ensemble en Ligue 1</small></div>
      <div class="side b"><span class="nm">${esc(b.nom_court)}</span>${logo(b)}</div>`;
    const sa = a.stats, sb = b.stats;
    const ind = [
      ['Titres', sa.titres, sb.titres, 1, v => fmt(v)],
      ['Saisons en Ligue 1', sa.saisons, sb.saisons, 1, v => fmt(v)],
      ['Podiums', sa.podiums, sb.podiums, 1, v => fmt(v)],
      ['% de victoires', sa.v / sa.j, sb.v / sb.j, 1, pct],
      ['Points par match (3-1-0)', sa.pts_310 / sa.j, sb.pts_310 / sb.j, 1, v => fmt(v, 2)],
      ['Buts marqués par match', sa.bp / sa.j, sb.bp / sb.j, 1, v => fmt(v, 2)],
      ['Buts encaissés par match', sa.bc / sa.j, sb.bc / sb.j, -1, v => fmt(v, 2)],
      ['Relégations', sa.relegations, sb.relegations, -1, v => fmt(v)],
    ];
    const ca = a.couleur, cb = b.couleur === a.couleur ? '#5F6B7E' : b.couleur;
    $('#butterfly').innerHTML = '<h4>Face à face</h4>' + ind.map(([lab, va, vb, dir, f]) => {
      const m = Math.max(va || 0, vb || 0) || 1;
      const winA = (va - vb) * dir > 0, winB = (vb - va) * dir > 0;
      return `<div class="bf-row"><span class="bar a"><i style="width:${(va || 0) / m * 100}%;background:${ca}"></i></span><span class="v a ${winA ? 'win' : ''}">${f(va)}</span><span class="lab">${lab}</span><span class="v ${winB ? 'win' : ''}">${f(vb)}</span><span class="bar b"><i style="width:${(vb || 0) / m * 100}%;background:${cb}"></i></span></div>`;
    }).join('') + '<p class="aside" style="margin-top:10px">Souligné en or : le club qui fait mieux.</p>';
    $('#duelChart').innerHTML = `<h4>Qui finit devant ?</h4>` + trajectory([
      { name: a.nom_court, color: ca, rows: rowsByClub[a.id] || [] },
      { name: b.nom_court, color: cb, rows: rowsByClub[b.id] || [] },
    ]);
  }
  function bindDuel() {
    const opts = clubs.slice().sort((x, y) => x.nom_court.localeCompare(y.nom_court, 'fr')).map(c => `<option value="${c.id}">${esc(c.nom_court)}</option>`).join('');
    $('#duelA').innerHTML = opts; $('#duelB').innerHTML = opts;
    $('#duelA').value = 'esperance-tunis'; $('#duelB').value = 'club-africain';
    $('#duelA').addEventListener('change', renderDuel); $('#duelB').addEventListener('change', renderDuel);
    renderDuel();
  }

  /* ---------------- présidents ---------------- */
  function renderPresidents() {
    const est = rowsByClub['esperance-tunis'] || [];
    const eraOf = Object.fromEntries(saisons.map(s => [s.saison, s.ere_esperance]));
    const eras = [['Avant Chiboub', 'jusqu\'en 1989', ''], ['Ère Chiboub', '1989 – 2004', 'mid'], ['Après Chiboub', 'depuis 2004', '']];
    $('#eras').innerHTML = eras.map(([name, yrs, cls]) => {
      const r = est.filter(x => eraOf[x.saison] === name && x.j > 0);
      const t = r.filter(x => x.champion).length, rate = r.length ? t / r.length : 0;
      return `<div class="era ${cls}"><h4>${name}</h4><p class="yrs">${yrs}</p><b>${t}</b><span>titres en ${r.length} saisons</span>
        <div class="rate" aria-hidden="true"><i style="width:${rate * 100}%"></i></div><p class="small">Champion ${pct(rate)} des saisons</p></div>`;
    }).join('');
    const agg = {};
    rows.forEach(r => {
      if (!r.president) return;
      const k = r.club_id + '|' + r.president;
      const a = agg[k] || (agg[k] = { club: r.club_id, nom: r.president, t: 0, s: 0, from: r.saison, to: r.saison });
      a.s++; a.t += r.champion ? 1 : 0;
      if (r.saison < a.from) a.from = r.saison; if (r.saison > a.to) a.to = r.saison;
    });
    const top = Object.values(agg).filter(a => a.t > 0).sort((x, y) => y.t - x.t || x.s - y.s).slice(0, 12);
    $('#presList').innerHTML = top.map(a => {
      const c = byId[a.club];
      return `<li>${logo(c)}<span>${esc(a.nom)}<small>${esc(c.nom_court)}, ${a.from} à ${a.to} (${a.s} saisons)</small></span><b style="color:${c.couleur === '#1C1C1C' ? '#1C1C1C' : c.couleur}">${a.t}</b></li>`;
    }).join('');
  }

  /* ---------------- données ---------------- */
  async function renderData(meta) {
    const [idx, ctrl] = await Promise.all([fetch(API + 'index.json', { cache: 'no-cache' }).then(r => r.json()), fetch(API + 'controles.json', { cache: 'no-cache' }).then(r => r.json())]);
    const labels = { meta: 'Métadonnées', clubs: 'Clubs', saisons: 'Saisons', classements: 'Classements', presidences: 'Présidences', controles: 'Contrôles', club: 'Un club', saison: 'Une saison' };
    $('#endpoints').innerHTML = Object.entries(idx.points_acces).map(([k, u]) => {
      const href = u.replace('{club_id}', 'esperance-tunis').replace('{saison}', '2024-25');
      return `<li><b>${labels[k] || k}</b><a href="${esc(href)}">${esc(u.replace(/^https:\/\/[^/]+\//, '…/'))}</a></li>`;
    }).join('');
    const sy = ctrl.synthese, total = Object.values(sy).reduce((a, b) => a + b, 0);
    $('#qualityText').textContent = `${total} contrôles automatiques à chaque mise à jour (victoires + nuls + défaites = matchs, buts marqués = buts encaissés, un seul champion, points conformes au barème). ${sy.OK || 0} sont OK. Les cas restants sont listés ici, sans les cacher.`;
    const names = t => String(t || '').replace(/[a-z0-9]+(?:-[a-z0-9]+)+/g, id => byId[id] ? byId[id].nom_court : id);
    const human = d => d.controle === 'Rang final connu'
      ? `la source ne publie pas le rang final de ${names(d.detail)}`
      : d.controle === 'Points = barème'
        ? `points différents du barème pour ${names(d.detail)}${d.resultat === 'EXPLIQUÉ' ? '' : ', à vérifier'}`
        : `${d.controle} : ${names(d.detail)}`;
    $('#issues').innerHTML = ctrl.details.sort((a, b) => a.saison.localeCompare(b.saison)).map(d => `<li><b>${esc(d.saison)}</b> : ${esc(human(d))}</li>`).join('');
    $('#sources').innerHTML = meta.sources.map(s => `<li><a href="${esc(s.url)}">${esc(s.nom)}</a>, ${esc(s.licence)}</li>`).join('');
    if (meta.depot) $('#repoLink').href = meta.depot;
    $('#updated').textContent = meta.mise_a_jour ? new Date(meta.mise_a_jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '–';
  }

  async function init() {
    try {
      const [c, s, r, meta] = await Promise.all(['clubs', 'saisons', 'classements', 'meta'].map(n => fetch(API + n + '.json', { cache: 'no-cache' }).then(x => { if (!x.ok) throw new Error(n); return x.json(); })));
      clubs = c; saisons = s; rows = r;
      byId = Object.fromEntries(clubs.map(x => [x.id, x]));
      rows.forEach(x => { (rowsByClub[x.club_id] ||= []).push(x); (rowsBySeason[x.saison] ||= []).push(x); });
      $('#nbSaisons').textContent = saisons.length;
      renderWall();
      bindStandings();
      selectSeason(saisons[saisons.length - 1].saison);
      renderHonours();
      renderRace();
      bindClubs();
      selectClub('esperance-tunis');
      bindDuel();
      renderPresidents();
      renderData(meta);
    } catch (e) {
      $('#contenu').insertAdjacentHTML('afterbegin', `<p class="block">Les données n'ont pas pu être chargées (${esc(e.message)}). Rechargez la page dans un instant.</p>`);
    }
  }
  init();
})();
