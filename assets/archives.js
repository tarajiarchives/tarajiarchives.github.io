/* Taraji Archives : visionneuse, partage, recherche des preuves */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const box = $('#lightbox');
  if (box) {
    document.addEventListener('click', e => {
      const z = e.target.closest('.zoom');
      if (!z) return;
      const fig = z.closest('figure');
      box.querySelector('img').src = z.dataset.full;
      box.querySelector('img').alt = z.getAttribute('aria-label') || '';
      box.querySelector('p').textContent = fig ? (fig.querySelector('.cap')?.textContent || '') : '';
      box.showModal();
    });
    box.addEventListener('click', e => { if (e.target === box || e.target.closest('.close')) box.close(); });
  }
  // partage : l'adresse de la page courante
  document.querySelectorAll('[data-share="fb"]').forEach(a => { a.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(location.href.split('#')[0]); });
  document.querySelectorAll('[data-share="copy"]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); b.textContent = 'Lien copié'; } catch (e) { b.textContent = location.href.split('#')[0]; }
  }));
  // preuves : recherche + filtre
  const list = $('#pvList');
  if (list) {
    let type = '', q = '';
    const apply = () => list.querySelectorAll('.pv').forEach(li => { li.hidden = (type && li.dataset.type !== type) || (q && !li.dataset.q.includes(q)); });
    $('#pvSearch').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); apply(); });
    document.querySelector('.pv-filters').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      type = b.dataset.t;
      b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
      apply();
    });
  }
})();

/* v2 : recherche, menu mobile, accueil (ce jour-là, en ce moment) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ\u064B-\u065F\u0670\u0640]/g, '').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase();
  let IDX = null;
  const loadIdx = async () => IDX || (IDX = (await (await fetch((window.TA_ROOT || '') + 'assets/data/' + (window.TA_LANG === 'ar' ? 'ar/' : '') + 'recherche.json')).json()).map(x => ({ ...x, _t: norm(x.t), _a: norm(x.t + ' ' + x.d + ' ' + x.k + ' ' + (x.s || '')) })));
  const ORDER = ['Réponse', 'جواب', 'Page', 'Fable', 'Dossier', 'Club', 'Saison', 'Ligue des champions', 'Portrait', 'Document'];
  window.taSearch = async q => {
    const idx = await loadIdx(); const toks = norm(q).split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    return idx.filter(x => toks.every(t => x._a.includes(t))).map(x => {
      let s = 0; const j = toks.join(' ');
      if (x._t === j) s += 100; if (x._t.startsWith(toks[0])) s += 40; if (toks.every(t => x._t.includes(t))) s += 30;
      s -= ORDER.indexOf(x.k) * 2; if (/^reponse-/.test(x.u)) s += 45; return [s, x];
    }).sort((a, b) => b[0] - a[0]).map(a => a[1]);
  };
  window.taItem = (x, cls = '') => `<a class="${cls}${/^reponse-/.test(x.u) ? ' is-rep' : ''}" href="${esc(x.u)}"><span class="k">${esc(x.k)}</span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></a>`;
  document.querySelectorAll('.ta-search').forEach(f => {
    const inp = f.querySelector('input'), ul = f.querySelector('.ts-res'); let sel = -1, t;
    const close = () => { ul.hidden = true; sel = -1; };
    const faq = async () => { try {
      const R = await (await fetch((window.TA_ROOT || '') + 'assets/data/reponses.json')).json(), AR = window.TA_LANG === 'ar';
      const T = {}; if (AR) (await loadIdx()).forEach(x => { T[x.u] = x.t; });
      ul.innerHTML = `<li class="ts-h">${AR ? 'ما يُروى… وما تقوله الوثائق' : 'Ce qu\'on raconte… et ce que disent les archives'}</li>` + R.map(r => `<li><a class="is-rep q" href="${window.TA_ROOT || ''}${esc(r.u)}"><b>${esc(AR ? T[r.u] || r.q : r.q)}</b></a></li>`).join('') +
        `<li><a class="all" href="${window.TA_ROOT || ''}reponses.html">${AR ? 'كل الأسئلة' : 'Toutes les questions'}</a></li>`; ul.hidden = false; sel = -1; } catch (e) {} };
    f.taFaq = faq;
    inp.addEventListener('focus', () => { if (inp.value.trim().length < 2) faq(); });
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(async () => {
      const q = inp.value.trim(); if (q.length < 2) return faq();
      const r = await window.taSearch(q);
      ul.innerHTML = r.slice(0, 8).map(x => '<li>' + window.taItem(x) + '</li>').join('') +
        `<li><a class="all" href="recherche.html?q=${encodeURIComponent(q)}">${r.length ? 'Voir les ' + r.length + ' résultats' : 'Aucun résultat : chercher autrement'}</a></li>`;
      ul.hidden = false; sel = -1; }, 120); });
    inp.addEventListener('keydown', e => {
      const links = [...ul.querySelectorAll('a')]; if (ul.hidden || !links.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length; links.forEach((a, i) => a.classList.toggle('sel', i === sel)); }
      if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); location.href = links[sel].href; }
      if (e.key === 'Escape') close();
    });
    document.addEventListener('click', e => { if (!f.contains(e.target) && !e.target.closest('.tb-search, .ts-btn')) close(); });
  });
  // barre mobile
  const here = location.pathname.split('/').pop() || 'index.html';
  const cur = document.querySelector('.portes a.on')?.getAttribute('href');
  document.querySelectorAll('.tabbar a').forEach(a => { const h = a.getAttribute('href'); if (h === here || (h !== 'index.html' && h === cur) || (h === 'stats.html' && ['ligue-1.html', 'afrique.html', 'outils.html'].includes(cur))) a.classList.add('on'); });
  const more = $('.tb-more'), sheet = $('#menuSheet');
  if (more && sheet) {
    const tog = open => { sheet.hidden = !open; more.setAttribute('aria-expanded', open); };
    more.addEventListener('click', () => tog(sheet.hidden));
    sheet.querySelector('.close').addEventListener('click', () => tog(false));
    sheet.addEventListener('click', e => { if (e.target.closest('a')) tog(false); });
  }
  // accueil : ce jour-là
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const today = $('#today');
  if (today) fetch((window.TA_ROOT || '') + 'assets/data/jours.json').then(r => r.json()).then(J => {
    const d = new Date();
    for (let k = 0; k < 15; k++) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
      const key = String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
      const items = J[key]; if (!items || !items.length) continue;
      const day = x.getDate() === 1 ? '1er' : x.getDate();
      const label = k === 0 ? `Ce jour-là, un ${day} ${MOIS[x.getMonth()]}` : `Bientôt : le ${day} ${MOIS[x.getMonth()]}`;
      const sh = a => a.slice().sort(() => Math.random() - .5);
      const hist = sh(items.filter(i => !i.m)).slice(0, 2), mt = sh(items.filter(i => i.m));
      const pick = hist.concat(mt.slice(0, 4 - hist.length)).sort((a, b) => a.y - b.y);
      const AR = window.TA_LANG === 'ar';
      today.innerHTML = `<span class="t-k">${label}</span>` + pick.map(i => `<p><b>${i.y}</b><a href="${esc((AR ? '' : '') + i.u)}">${esc(AR && i.ar ? i.ar : i.t)}</a></p>`).join('') + `<a class="more" href="frise.html">Toute la frise →</a>`;
      today.hidden = false; break;
    }
  }).catch(() => {});
  const EN = { January: 'janvier', February: 'février', March: 'mars', April: 'avril', May: 'mai', June: 'juin', July: 'juillet', August: 'août', September: 'septembre', October: 'octobre', November: 'novembre', December: 'décembre' };
  const frDate = s => String(s || '').replace(/[A-Z][a-z]+/g, m => EN[m] || m);
  // accueil : en ce moment (Ligue 1)
  const now = $('#hNow');
  if (now) fetch((window.TA_ROOT || '') + 'api/v1/saison-en-cours.json', { cache: 'no-cache' }).then(r => r.json()).then(S => {
    const rows = S.classement, est = rows.find(r => r.club_id === 'esperance-tunis');
    const show = rows.slice(0, 5); if (est && !show.includes(est)) show.push(est);
    const lead = rows[0], a = (S.analyse || []).find(x => x.id === 'esperance-tunis');
    let msg = '';
    if (est) {
      const gap = lead.pts - est.pts;
      msg = est.rang === 1 ? `L'Espérance est en tête, avec ${est.pts - rows[1].pts} point${est.pts - rows[1].pts > 1 ? 's' : ''} d'avance.`
        : `L'Espérance est ${est.rang}e, à ${gap} point${gap > 1 ? 's' : ''} de ${esc(lead.nom)}${est.j < lead.j ? ` (avec ${lead.j - est.j} match${lead.j - est.j > 1 ? 's' : ''} en moins)` : ''}.`;
      if (a && a.comparaison_titres) msg += ` Avec ${String(a.pct_points).replace('.', ',')} % des points, elle fait mieux que ${a.comparaison_titres.titres_moins_bons} de ses ${a.comparaison_titres.nb_titres} titres depuis l'indépendance à la fin de leur saison.`;
    }
    now.innerHTML = `<div><div class="block-head"><h2>En ce moment</h2><a class="more-link" href="ligue-1.html#now">Le classement complet</a></div>
      <p class="tool-sum">Ligue 1 ${esc(S.saison)} · après ${S.nb_journees} journées sur ${S.journees_total} · mise à jour du ${esc(frDate(S.mise_a_jour))}</p>
      <table class="mini">${show.map(r => `<tr class="${r.club_id === 'esperance-tunis' ? 'est' : ''}"><td class="n">${r.rang}</td><td>${esc(r.nom)}</td><td class="n">${r.j} m.</td><td class="n"><b>${r.pts}</b> pts</td></tr>`).join('')}</table></div>
      <div class="msg"><b class="big">${est ? est.pts + ' pts' : ''}</b><p>${msg}</p><a class="more-link" href="periode.html">Comparer avec les autres saisons →</a></div>`;
    now.hidden = false;
  }).catch(() => {});
})();

/* v3 : onglets (Ligue 1, Ligue des champions, dossiers), en-tête mobile, recherche plein écran, retour en haut */
(() => {
  const $ = (q, r = document) => r.querySelector(q);
  // --- onglets
  const nav = $('.ta-bar .subnav') || $('.chips-nav[data-tabs]');
  if (nav) {
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const ids = links.map(a => a.getAttribute('href').slice(1)).filter(id => document.getElementById(id));
    if (ids.length > 1) {
      const first = document.getElementById(ids[0]), parent = first.parentElement;
      const kids = [...parent.children].filter(el => !el.matches('nav, script, header.p-head, .crumbs'));
      const owner = new Map(); let cur = null; const pre = [];
      kids.forEach(el => { if (ids.includes(el.id)) cur = el.id; if (cur) owner.set(el, cur); else if (el.tagName === 'SECTION' || el.matches('.hero')) pre.push(el); });
      const preTab = ids.includes('palmares') ? 'palmares' : ids[0];
      pre.forEach(el => owner.set(el, preTab));
      if (ids.includes('palmares')) { const pi = kids.indexOf(document.getElementById('palmares')); pre.forEach(el => { document.getElementById('palmares').before(el); }); }
      let active = null;
      const tabOf = el => { while (el && el !== document.body) { if (owner.has(el)) return owner.get(el); el = el.parentElement; } return null; };
      const show = (id, scroll) => {
        if (!ids.includes(id)) return; active = id;
        owner.forEach((t, el) => el.classList.toggle('tab-off', t !== id));
        links.forEach(a => { const on = a.getAttribute('href') === '#' + id; a.classList.toggle('on', on); a.setAttribute('aria-selected', on); if (on) a.scrollIntoView ? origSIV.call(a, { block: 'nearest', inline: 'center' }) : 0; });
        if (scroll) window.scrollTo({ top: Math.max(0, parent.getBoundingClientRect().top + scrollY - 70) });
        window.dispatchEvent(new Event('resize'));
      };
      const origSIV = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function (o) { const t = tabOf(this); if (t && t !== active) show(t); return origSIV.call(this, o); };
      nav.classList.add('tabs'); nav.setAttribute('role', 'tablist');
      links.forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href').slice(1); if (!ids.includes(id)) return; e.preventDefault(); history.replaceState(null, '', '#' + id); show(id, true); }));
      const fromHash = () => { const h = decodeURIComponent(location.hash.slice(1)); const el = h && document.getElementById(h); const t = el ? tabOf(el) : null; show(t || active || ids[0]); if (el && t) setTimeout(() => origSIV.call(el, { block: 'start' }), 60); };
      window.addEventListener('hashchange', fromHash); fromHash();
    }
  }
  // --- recherche plein écran sur mobile
  const sb = $('.ts-btn'), sf = $('.ta-bar .ta-search');
  if (sb && sf) {
    const openS = () => { sf.classList.toggle('open'); if (sf.classList.contains('open')) { sf.querySelector('input').focus(); if (sf.taFaq) sf.taFaq(); } };
    sb.addEventListener('click', openS);
    document.querySelectorAll('.tb-search').forEach(b => b.addEventListener('click', () => { if (!sf.classList.contains('open')) openS(); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') sf.classList.remove('open'); });
    sf.addEventListener('click', e => { if (e.target === sf) sf.classList.remove('open'); });
  }
  // --- en-tête qui se cache en descendant (mobile), bouton retour en haut
  const bar = $('.ta-bar'), top = $('.to-top'); let last = scrollY;
  window.addEventListener('scroll', () => {
    const y = scrollY, mob = innerWidth <= 760;
    if (bar) bar.classList.toggle('hide', mob && y > last && y > 160 && !(sf && sf.classList.contains('open')));
    last = y;
    if (top) top.hidden = y < innerHeight * 1.5;
  }, { passive: true });
  if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* v3 : catégories de records repliables sur mobile */
(() => {
  const mob = () => innerWidth <= 760;
  const prep = list => {
    if (!mob()) return;
    [...list.querySelectorAll('.rec-cat')].forEach((c, i) => {
      if (c.dataset.fold) return; c.dataset.fold = 1;
      const h = c.querySelector('h3'); if (!h) return;
      const n = c.children.length - 1;
      h.insertAdjacentHTML('beforeend', ` <small class="rc-n">${n}</small>`);
      h.setAttribute('role', 'button'); h.tabIndex = 0;
      if (i > 0) c.classList.add('closed');
      const t = () => c.classList.toggle('closed'); h.addEventListener('click', t); h.addEventListener('keydown', e => { if (e.key === 'Enter') t(); });
    });
  };
  ['l1RecordList', 'recordList'].forEach(id => { const el = document.getElementById(id); if (!el) return; prep(el); new MutationObserver(() => prep(el)).observe(el, { childList: true }); });
})();

/* accueil : bande « En vidéo » */
(() => {
  const el = document.getElementById('hVideos'); if (!el) return;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  fetch((window.TA_ROOT || '') + 'assets/data/videos.json').then(r => r.json()).then(V => {
    const TH = Object.fromEntries(V.themes);
    const une = V.videos.find(v => v.id === V.une), rest = V.videos.filter(v => v.id !== V.une && v.d && !/^0:/.test(v.d)).slice(0, 3);
    el.innerHTML = [une, ...rest].filter(Boolean).map(v => `<li><a class="md-card" href="mediatheque.html#v-${esc(v.id)}"><span class="md-img"><img src="https://i.ytimg.com/vi/${esc(v.id)}/mqdefault.jpg" alt="" loading="lazy"><i>▶</i>${v.d ? `<small>${esc(v.d)}</small>` : ''}</span><span class="md-t" lang="ar" dir="rtl">${esc(v.t)}</span><span class="md-m">${esc(TH[v.th] || '')}</span></a></li>`).join('');
  }).catch(() => { el.closest('section').hidden = true; });
})();

/* changement de langue : garder les sélections (paramètres et ancre) de la page */
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a.lang-sw');
  if (!a || (!location.search && !location.hash)) return;
  const u = new URL(a.getAttribute('href'), location.href);
  if (!u.search) u.search = location.search;
  if (!u.hash) u.hash = location.hash;
  e.preventDefault(); location.href = u.href;
});

/* application installable (PWA) */
(() => {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone) document.documentElement.classList.add('is-app');
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const had = !!navigator.serviceWorker.controller; let done = false;
    addEventListener('load', () => navigator.serviceWorker.register('/sw.js').then(r => {
      document.addEventListener('visibilitychange', () => { if (!document.hidden) r.update().catch(() => {}); });   // l'app revient au premier plan : nouvelle version ?
    }).catch(() => {}));
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !done) { done = true; location.reload(); } });   // nouvelle version installée : on recharge
  }
  let ask = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); ask = e; window.__taInstall = e; document.documentElement.classList.add('can-install'); });
  addEventListener('appinstalled', () => { ask = null; document.documentElement.classList.add('is-app'); });
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a.ta-app, button.ta-install');
    if (!a || !ask) return;
    e.preventDefault(); ask.prompt(); ask.userChoice.finally(() => { ask = null; });
  });
})();

/* bannière d'installation (mobile, une fois ; « plus tard » = 14 jours) */
(() => {
  const K = 'ta-app-banner', AR = document.documentElement.lang === 'ar';
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone || innerWidth > 760 || /application\.html$/.test(location.pathname)) return;
  let last = 0; try { last = +localStorage.getItem(K) || 0; } catch (e) {}
  if (Date.now() - last < 14 * 864e5) return;
  let ask = null; addEventListener('beforeinstallprompt', e => { ask = e; });
  setTimeout(() => {
    if (document.documentElement.classList.contains('is-app')) return;
    const b = document.createElement('div'); b.className = 'app-banner'; b.setAttribute('role', 'dialog');
    b.innerHTML = `<img src="/assets/brand/logo-64.png" alt=""><p>${AR ? 'ثبّت تطبيق Taraji Archives على هاتفك' : 'Installe l’app Taraji Archives sur ton téléphone'}</p>`
      + `<button type="button" class="ab-go">${AR ? 'تثبيت' : 'Installer'}</button><button type="button" class="ab-no" aria-label="${AR ? 'لاحقًا' : 'Plus tard'}">×</button>`;
    const close = () => { try { localStorage.setItem(K, String(Date.now())); } catch (e) {} b.remove(); };
    b.querySelector('.ab-no').onclick = close;
    b.querySelector('.ab-go').onclick = () => {
      const p = ask || window.__taInstall;
      close();
      if (p && p.prompt) p.prompt(); else location.href = 'application.html';
    };
    document.body.appendChild(b);
  }, 3500);
})();

/* cartes-réponses : partager */
document.querySelectorAll('.rep-share').forEach(b => b.addEventListener('click', async () => {
  const r = document.getElementById('rep'), AR = document.documentElement.lang === 'ar';
  const txt = [r.querySelector('h1'), r.querySelector('.rep-big')].map(e => e.innerText.replace(/\s+/g, ' ').trim()).join(' : ');
  const data = { title: document.title, text: txt, url: location.href };
  try { if (navigator.share) return await navigator.share(data); await navigator.clipboard.writeText(txt + '\n' + location.href);
    b.textContent = AR ? 'تمّ النسخ ✓' : 'Lien copié ✓'; } catch (e) {}
}));
