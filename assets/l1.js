/* Ligue 1 tunisienne : saison en cours + records. Données : api/v1/saison-en-cours.json, api/v1/records.json */
(() => {
  const API = (window.TA_ROOT || '') + 'api/v1/';
  const FEATURED = 'esperance-tunis';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const get = n => fetch(API + n, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(n); return r.json(); });
  const num = v => typeof v === 'number' && !Number.isInteger(v) ? v.toLocaleString('fr-FR') : v;
  const CODES = { 'esperance-tunis': 'EST', 'club-africain': 'CA', 'etoile-sahel': 'ESS', 'cs-sfaxien': 'CSS', 'stade-tunisien': 'ST', 'us-monastir': 'USM', 'us-ben-guerdane': 'USBG', 'cs-hammam-lif': 'CSHL', 'ca-bizertin': 'CAB', 'as-marsa': 'ASM' };
  const code = c => CODES[c.id] || c.nom.replace(/^(AS|FC|SC|CS|AC|US|ES|JS|CA|ST|EM|OC|CO)\s+/, '').split(/[\s'-]+/).map(w => w[0]).join('').toUpperCase().slice(0, 4);
  function textOn(hex) {
    const h = (hex || '#9AA5B1').replace('#', '');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#15233D' : '#FFFFFF';
  }
  const logo = c => `<span class="logo fallback" style="background:${c.couleur};color:${textOn(c.couleur)}">${esc(code(c))}</span>`;
  const ord = n => n === 1 ? '1re' : n + 'e';
  const MOIS = { January: 'janvier', February: 'février', March: 'mars', April: 'avril', May: 'mai', June: 'juin', July: 'juillet', August: 'août', September: 'septembre', October: 'octobre', November: 'novembre', December: 'décembre' };
  const frDate = s => (s || '').replace(/(\d+)\s+([A-Za-z]+)\s+(\d{4})/, (m, d, mo, y) => `${d} ${MOIS[mo] || mo} ${y}`);

  /* ---------------- saison en cours ---------------- */
  function renderNow(cur) {
    const box = $('#now');
    if (!cur) { box.hidden = true; document.querySelector('a[href="#now"]')?.remove(); return; }
    const played = Math.max(...cur.classement.map(t => t.j));
    $('#nowTitle').textContent = `Saison ${cur.saison}`;
    $('#nowMeta').textContent = `Après ${played} journée${played > 1 ? 's' : ''} sur ${cur.journees_total} · mise à jour du ${frDate(cur.mise_a_jour)} · source : ${cur.source}`;
    const form = id => (cur.forme[id] || []).filter(x => x).slice(-5);
    const chip = x => `<span class="fm ${x}" title="${{ W: 'Victoire', D: 'Nul', L: 'Défaite' }[x]}">${{ W: 'V', D: 'N', L: 'D' }[x]}</span>`;
    const n = cur.classement.length;
    $('#nowTable').innerHTML = `<thead><tr><th class="n">#</th><th>Club</th><th class="m">J</th><th class="m">V</th><th class="m">N</th><th class="m">D</th><th class="m hide-s">Buts</th><th class="m">Diff.</th><th class="m">Pts</th><th class="hide-s">Forme</th></tr></thead><tbody>${cur.classement.map(t => `
      <tr class="${t.club_id === FEATURED ? 'feat' : ''} ${t.rang <= 2 ? 'q-cl' : t.rang === 3 ? 'q-cc' : t.rang > n - 3 ? 'q-rel' : ''}">
        <td class="n">${t.rang}</td><td><span class="club">${logo({ id: t.club_id, nom: t.nom, couleur: t.couleur })}${esc(t.nom)}</span></td>
        <td class="m">${t.j}</td><td class="m">${t.v}</td><td class="m">${t.n}</td><td class="m">${t.d}</td><td class="m hide-s">${t.bp}-${t.bc}</td>
        <td class="m">${t.diff > 0 ? '+' : ''}${t.diff}</td><td class="m pts">${t.pts}</td><td class="hide-s"><span class="form">${form(t.club_id).map(chip).join('')}</span></td></tr>`).join('')}</tbody>`;
    // Espérance
    const est = cur.classement.find(t => t.club_id === FEATURED);
    const a = cur.analyse.find(x => x.id === FEATURED);
    const side = [];
    if (est && a) {
      const lead = cur.classement[0];
      const gap = lead.club_id === FEATURED ? `en tête, ${est.pts - cur.classement[1].pts} point${Math.abs(est.pts - cur.classement[1].pts) > 1 ? 's' : ''} devant ${esc(cur.classement[1].nom)}` : `${ord(est.rang)}, à ${lead.pts - est.pts} point${lead.pts - est.pts > 1 ? 's' : ''} de ${esc(lead.nom)}${lead.j !== est.j ? ` (${lead.j - est.j > 0 ? 'avec ' + (lead.j - est.j) + ' match' + (lead.j - est.j > 1 ? 's' : '') + ' en moins' : (est.j - lead.j) + ' match de plus'})` : ''}`;
      side.push(`<div class="now-est"><div class="big">${est.pts}<small>points en ${est.j} matchs</small></div><p>L'Espérance est <b>${gap}</b>.</p>
        ${a.comparaison_titres ? `<p>Avec <b>${num(a.pct_points)} % des points</b>, elle fait mieux que <b>${a.comparaison_titres.titres_moins_bons} de ses ${a.comparaison_titres.nb_titres} titres</b> à la fin de leur saison. Son record : ${num(a.comparaison_titres.meilleur.pct)} % en ${esc(a.comparaison_titres.meilleur.saison)}.</p>` : ''}
        <p class="proj">Projection à ce rythme : <b>${a.projection_points} points</b> sur ${cur.journees_total} journées.</p></div>`);
    }
    const watch = cur.analyse.flatMap(x => x.en_course.map(e => ({ ...e, club: x })));
    side.push(`<h4>Records en vue</h4>${watch.length ? `<ul class="watch">${watch.map(w => `<li>${logo(w.club)}<span><b>${esc(w.club.nom)}</b> · ${esc(w.texte)}</span></li>`).join('')}</ul>` : '<p class="muted">Aucun record de saison menacé pour l\'instant.</p>'}`);
    if (cur.buteurs.length) {
      const top = cur.buteurs.filter(b => b.buts === cur.buteurs[0].buts);
      side.push(`<h4>Meilleur${top.length > 1 ? 's' : ''} buteur${top.length > 1 ? 's' : ''}</h4><ul class="scorers">${cur.buteurs.slice(0, 5).map(b => `<li><span>${esc(b.joueur)}</span><span class="muted">${esc((cur.classement.find(t => t.club_id === b.club_id) || {}).nom || '')}</span><b>${b.buts}</b></li>`).join('')}</ul>`);
    }
    $('#nowSide').innerHTML = side.join('');
  }

  /* ---------------- records ---------------- */
  function renderRecords(R) {
    const cats = [...new Set(R.records.map(r => r.categorie))];
    const holder = h => `<span><i style="background:${h.couleur}"></i>${esc(h.nom)}</span>`;
    $('#l1RecordList').innerHTML = cats.map(cat => `<div class="rec-cat"><h3>${esc(cat)}</h3>${R.records.filter(r => r.categorie === cat).map(r => {
      const hist = R.historique.filter(h => h.record_id === r.record_id);
      const feat = r.detenteurs.some(h => h.id === FEATURED);
      const det = [...new Set(r.detenteurs.map(h => h.detail).filter(Boolean))];
      return `<div class="rec ${feat ? 'feat' : ''}"><div class="val">${num(r.valeur)}<small>${esc(r.unite)}</small></div><div>
        <div class="what">${esc(r.libelle)}${feat ? '<span class="tag">Espérance</span>' : ''}</div>
        <div class="who">${r.detenteurs.map(holder).join('')}</div>
        ${det.length ? `<div class="det">${esc(det.join(' / '))}</div>` : ''}
        <details class="hist"><summary>Historique (${hist.length} étape${hist.length > 1 ? 's' : ''})</summary><ol>${hist.map(h => `<li>${esc(h.saison)} : ${h.type} à ${num(h.valeur)} par ${esc(h.detenteurs.map(x => x.nom).join(', '))}${h.detail && h.type !== 'établi' && !/\d{4}-\d{2}$/.test(h.detail) ? '' : ''}</li>`).join('')}</ol></details>
      </div></div>`;
    }).join('')}</div>`).join('');
    if (R.notes && R.notes.length) $('#l1Notes').innerHTML = R.notes.map(n => `<p><b>${esc(n.nom)}, ${esc(n.saison)}</b> : ${esc(n.note)}. La saison compte dans ses saisons en Ligue 1, mais pas dans ses statistiques.</p>`).join('');
  }

  function renderClub(R, id) {
    const box = $('#l1ClubRecords');
    const list = R.clubs[id] || [];
    const c = R.medailles.find(m => m.id === id) || { id, nom: (list[0] && id) || id, couleur: '#9AA5B1' };
    const info = (R.top10.titres.concat(...Object.values(R.top10)).find(x => x.id === id)) || c;
    box.style.setProperty('--club', info.couleur === '#F4F4F4' ? '#9AA5B1' : info.couleur);
    const leaders = rid => (R.top10[rid] || []).filter(x => x.rang === 1);
    const rk = r => r.rang === 1 ? (leaders(r.record_id).length > 1 ? 'ex aequo' : 'record') : ord(r.rang);
    const line = r => {
      const ls = leaders(r.record_id).filter(x => x.id !== id);
      const ctx = r.rang === 1 ? (ls.length ? `à égalité avec ${ls.slice(0, 3).map(x => esc(x.nom)).join(', ')}` : `seul détenteur, sur ${r.nb_clubs} clubs`)
        : `record : ${num(r.record)} (${leaders(r.record_id).slice(0, 2).map(x => esc(x.nom)).join(', ')})`;
      return `<li><span class="rk ${r.rang <= 3 ? 'r' + r.rang : ''}">${r.rang}<small>${rk(r)}</small></span><span class="lib">${esc(r.libelle)}<small>${r.detail ? esc(r.detail) + ' · ' : ''}${ctx}</small></span><span class="v">${num(r.valeur)}<small>${esc(r.unite)}</small></span></li>`;
    };
    const f = list.filter(r => r.rang === 1), p = list.filter(r => r.rang === 2 || r.rang === 3), rest = list.filter(r => r.rang > 3);
    box.innerHTML = `<div class="cr-head"><div class="id">${logo(info)}<div><h3>Les records ${id === FEATURED ? "de l'Espérance" : 'de ' + esc(info.nom)}</h3><p>${f.length} record${f.length > 1 ? 's' : ''} détenu${f.length > 1 ? 's' : ''} et ${p.length} place${p.length > 1 ? 's' : ''} sur le podium en Ligue 1, depuis 1955-56.</p></div></div>
      <select id="l1ClubPick" aria-label="Voir les records d'un autre club">${Object.keys(R.clubs).map(k => ({ id: k, nom: (R.medailles.find(m => m.id === k) || Object.values(R.top10).flat().find(x => x.id === k) || { nom: k }).nom })).sort((a, b) => a.nom.localeCompare(b.nom)).map(o => `<option value="${o.id}" ${o.id === id ? 'selected' : ''}>${esc(o.nom)}</option>`).join('')}</select></div>
      ${f.length ? `<h4>En tête</h4><ul class="cr-list">${f.map(line).join('')}</ul>` : ''}
      ${p.length ? `<h4>Sur le podium</h4><ul class="cr-list">${p.map(line).join('')}</ul>` : ''}
      ${rest.length ? `<details><summary>Tous ses autres classements (${rest.length})</summary><ul class="cr-list">${rest.map(line).join('')}</ul></details>` : ''}`;
    $('#l1ClubPick').addEventListener('change', e => renderClub(R, e.target.value));
  }

  function renderMedals(R) {
    const box = $('#l1Medals');
    let sort = 'or', all = false;
    $('#l1MedalsIntro').textContent = `Sur ${R.nb_records} records de Ligue 1 : une médaille d'or par record détenu (seul ou à égalité), d'argent pour une 2e place, de bronze pour une 3e.`;
    const draw = () => {
      const list = R.medailles.slice().sort(sort === 'or' ? (a, b) => b.or - a.or || b.argent - a.argent || b.bronze - a.bronze || a.nom.localeCompare(b.nom)
        : (a, b) => b.total - a.total || b.or - a.or || b.argent - a.argent || a.nom.localeCompare(b.nom));
      const key = x => sort === 'or' ? [x.or, x.argent, x.bronze].join() : [x.total, x.or, x.argent].join();
      let rank = 0, prev = null;
      list.forEach((x, i) => { const k = key(x); if (k !== prev) rank = i + 1; x._rk = rank; prev = k; });
      let shown = all ? list : list.slice(0, 8);
      const f = list.find(x => x.id === FEATURED);
      if (!all && f && !shown.includes(f)) shown = [...shown, f];
      $('#l1MedalTable').innerHTML = `<thead><tr><th class="n">#</th><th>Club</th><th class="m"><span class="dot or"></span>1<sup>er</sup></th><th class="m"><span class="dot argent"></span>2<sup>e</sup></th><th class="m"><span class="dot bronze"></span>3<sup>e</sup></th><th class="m">Total</th><th class="m s">dont seul en tête</th></tr></thead><tbody>${shown.map(x => `
        <tr class="${x.id === FEATURED ? 'feat' : ''}" data-id="${x.id}" tabindex="0"><td class="n">${x._rk}</td><td><span class="club">${logo(x)}${esc(x.nom)}</span></td>
        <td class="m or">${x.or || '·'}</td><td class="m argent">${x.argent || '·'}</td><td class="m bronze">${x.bronze || '·'}</td><td class="m t">${x.total}</td><td class="m s">${x.seul || '·'}</td></tr>`).join('')}</tbody>`;
      $('#l1MedalMore').hidden = list.length <= 8;
      $('#l1MedalMore').textContent = all ? 'Afficher les 8 premiers' : `Voir les ${list.length} clubs médaillés`;
    };
    $('#l1MedalTable').addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (tr) { renderClub(R, tr.dataset.id); $('#l1ClubRecords').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    box.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; sort = b.dataset.sort; box.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
    $('#l1MedalMore').addEventListener('click', () => { all = !all; draw(); });
    draw();
  }

  Promise.all([get('saison-en-cours.json').catch(() => null), get('records.json')]).then(([cur, R]) => {
    renderNow(cur);
    renderClub(R, FEATURED);
    renderMedals(R);
    renderRecords(R);
  }).catch(e => { console.error(e); $('#l1Records').insertAdjacentHTML('beforeend', '<p class="muted">Les records n\'ont pas pu être chargés.</p>'); });
})();
