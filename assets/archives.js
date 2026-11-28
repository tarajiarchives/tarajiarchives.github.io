/* Taraji Archives : visionneuse, partage, recherche des preuves */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const box = $('#lightbox');
  if (box) {
    document.addEventListener('click', e => {
      const z = e.target.closest('.zoom');
      if (!z) return;
      const fig = z.closest('figure');
      const f = z.dataset.full || '';
      box.querySelector('img').src = /^(https?:|\/|\.\.\/|data:)/.test(f) ? f : (window.TA_ROOT || '') + f;
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
  const PAGE = window.TA_LANG || 'fr', IDXS = {};
  const qLang = q => /[\u0600-\u06FF]/.test(q || '') ? 'ar' : PAGE;
  const loadIdx = async (lang = PAGE) => IDXS[lang] || (IDXS[lang] = (await (await fetch((window.TA_ROOT || '') + 'assets/data/' + (lang === 'fr' ? '' : lang + '/') + 'recherche.json')).json()).map(x => ({ ...x, _l: lang, _t: norm(x.t), _a: norm(x.t + ' ' + x.d + ' ' + x.k + ' ' + (x.s || '')) })));
  const href = x => !x._l || x._l === PAGE ? x.u : (window.TA_ROOT || '') + (x._l === 'fr' ? '' : x._l + '/') + x.u;
  const ORDER = ['Grand dossier', 'ملف كامل', 'Réponse', 'جواب', 'Answer', 'Page', 'Fable', 'Dossier', 'Encyclopédie', 'الموسوعة', 'Club', 'Saison', 'Ligue des champions', 'Portrait', 'Document'];
  window.taSearch = async q => {
    const idx = await loadIdx(qLang(q)); const toks = norm(q).split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    return idx.filter(x => toks.every(t => x._a.includes(t))).map(x => {
      let s = 0; const j = toks.join(' ');
      if (x._t === j) s += 100; if (x._t.startsWith(toks[0])) s += 40; if (toks.every(t => x._t.includes(t))) s += 30;
      s -= ORDER.indexOf(x.k) * 2; if (/^reponse-/.test(x.u)) s += 45; if (x.k === 'Grand dossier' || x.k === 'ملف كامل') s += 70; return [s, x];
    }).sort((a, b) => b[0] - a[0]).map(a => a[1]);
  };
  window.taItem = (x, cls = '') => `<a class="${cls}${/^reponse-/.test(x.u) ? ' is-rep' : ''}" href="${esc(href(x))}"${x._l && x._l !== 'fr' ? ` dir="${x._l === 'ar' ? 'rtl' : 'ltr'}"` : ''}><span class="k">${esc(x.k)}</span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></a>`;
  document.querySelectorAll('.ta-search').forEach(f => {
    const inp = f.querySelector('input'), ul = f.querySelector('.ts-res'); let sel = -1, t;
    const close = () => { ul.hidden = true; sel = -1; };
    const faq = async () => { try {
      const R = await (await fetch((window.TA_ROOT || '') + 'assets/data/reponses.json')).json(), AR = window.TA_LANG === 'ar';
      const T = {}; if (AR) (await loadIdx('ar')).forEach(x => { T[x.u] = x.t; });
      ul.innerHTML = `<li class="ts-h"><span>${AR ? 'ما يُروى… وما تقوله الوثائق' : 'Ce qu\'on raconte… et ce que disent les archives'}</span><button type="button" class="ts-x" aria-label="${AR ? 'إغلاق' : 'Fermer'}">✕</button></li>` + R.map(r => `<li><a class="is-rep q" href="${esc(r.u)}"><b>${esc(AR ? T[r.u] || r.q : r.q)}</b></a></li>`).join('') +
        `<li><a class="all" href="reponses.html">${AR ? 'كل الأسئلة' : 'Toutes les questions'}</a></li>`; ul.hidden = false; sel = -1; } catch (e) {} };
    f.taFaq = faq;
    inp.addEventListener('focus', () => { if (inp.value.trim().length < 2) faq(); });
    // recliquer dans le champ referme la liste (et la rouvre au clic suivant)
    let wasOpen = false;
    inp.addEventListener('pointerdown', () => { wasOpen = document.activeElement === inp && !ul.hidden; });
    inp.addEventListener('click', () => { if (wasOpen) { close(); return; } if (ul.hidden && document.activeElement === inp) { if (inp.value.trim().length < 2) faq(); else inp.dispatchEvent(new Event('input')); } });
    ul.addEventListener('click', e => { if (e.target.closest('.ts-x')) { e.preventDefault(); close(); inp.blur(); } });
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(async () => {
      const q = inp.value.trim(); if (q.length < 2) return faq();
      const r = await window.taSearch(q);
      if (!r.length && q.length >= 3) { clearTimeout(f._tv); f._tv = setTimeout(() => window.taTrack && window.taTrack('recherche-vide/' + q.toLowerCase(), 'Recherche sans résultat : ' + q), 1500); }
      ul.innerHTML = r.slice(0, 8).map(x => '<li>' + window.taItem(x) + '</li>').join('') +
        `<li><a class="all" href="${qLang(q) === PAGE ? '' : (window.TA_ROOT || '') + (qLang(q) === 'fr' ? '' : qLang(q) + '/')}recherche.html?q=${encodeURIComponent(q)}">${qLang(q) === 'ar' ? (r.length ? 'عرض كل النتائج (' + r.length + ')' : 'لا نتيجة: جرّب كلمات أخرى') : (r.length ? (r.length === 1 ? 'Voir le résultat' : 'Voir les ' + r.length + ' résultats') : 'Aucun résultat : chercher autrement')}</a></li>`;
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
      const hist = sh(items.filter(i => !i.m)).slice(0, 2);
      const mt = [...sh(items.filter(i => i.m && i.vt)), ...sh(items.filter(i => i.m && i.v && !i.vt)), ...sh(items.filter(i => i.m && !i.v))];   // matchs en vidéo d'abord (nos vidéos en tête)
      const pick = hist.concat(mt.slice(0, 5 - hist.length)).sort((a, b) => a.y - b.y);
      const AR = window.TA_LANG === 'ar';
      today.innerHTML = `<span class="t-k">${label}</span>` + pick.map(i => `<p><b>${i.y}</b><a href="${esc((AR ? '' : '') + i.u)}">${esc(AR && i.ar ? i.ar : i.t)}</a>${i.v ? ` <a class="t-v" href="mediatheque.html#v-${esc(i.v)}" title="${AR ? 'شاهد المباراة' : 'Voir le match'}" aria-label="${AR ? 'شاهد المباراة' : 'Voir le match'}">▶</a>` : ''}</p>`).join('') + `<a class="more" href="frise.html">Toute la frise →</a>`;
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
    // bouton « Chercher » de la barre du bas : ouvre la liste, ou la referme si elle est déjà ouverte
    document.querySelectorAll('.tb-search').forEach(b => b.addEventListener('click', () => {
      const ul = sf.querySelector('.ts-res'), inp = sf.querySelector('input');
      if (sf.classList.contains('open') && !ul.hidden) { ul.hidden = true; inp.blur(); return; }
      sf.classList.add('open'); const bar = sf.closest('.ta-bar'); if (bar) bar.classList.remove('hide');
      inp.focus({ preventScroll: true }); if (inp.value.trim().length < 2) { if (sf.taFaq) sf.taFaq(); } else inp.dispatchEvent(new Event('input'));
    }));
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
    const TH = Object.fromEntries(V.themes.map(([k, n, na]) => [k, document.documentElement.lang === 'ar' && na ? na : n]));
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

/* ================================================================ interactions locales (sans compte, sans serveur)
   - image à partager (réponses, dossiers, quiz, question du jour)
   - favoris « Mes archives »
   - question du jour + série de jours */
(() => {
  const AR = document.documentElement.lang === 'ar', ROOT = window.TA_ROOT || '';
  const T = (f, a) => AR ? a : f;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LS = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const page = () => location.pathname.split('/').pop() || 'index.html';
  const SITE = 'tarajiarchives.com';

  /* -- petit message */
  const toast = msg => { let t = document.querySelector('.ta-toast'); if (!t) { t = document.createElement('div'); t.className = 'ta-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600); };

  /* -- image 1080×1350 */
  const img = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  const wrap = (ctx, text, max) => { const words = clean(text).split(' '), lines = []; let l = '';
    for (const w of words) { const t = l ? l + ' ' + w : w; if (ctx.measureText(t).width > max && l) { lines.push(l); l = w; } else l = t; } if (l) lines.push(l); return lines; };
  const FD = AR ? '"Cairo", sans-serif' : '"Big Shoulders Display", "Cairo", sans-serif', FB = AR ? '"Cairo", sans-serif' : '"Public Sans", sans-serif';
  async function makeCard(d) {
    try { await Promise.all([document.fonts.load(`900 80px ${FD}`), document.fonts.load(`600 30px ${FB}`)]); } catch (e) {}
    await (document.fonts ? document.fonts.ready : 0);
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const g = x.createRadialGradient(W * .5, H * .38, 60, W * .5, H * .45, H * .9); g.addColorStop(0, '#2c1d1d'); g.addColorStop(1, '#100c0d');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { x.fillStyle = i % 2 ? '#F2C23A' : '#C8102E'; x.fillRect(0, i * 52, 16, 52); }  // bande sang et or
    x.strokeStyle = 'rgba(242,194,58,.45)'; x.lineWidth = 2; x.strokeRect(46, 46, W - 92, H - 92);
    x.direction = AR ? 'rtl' : 'ltr'; x.textAlign = AR ? 'right' : 'left'; x.textBaseline = 'alphabetic';
    const L = 100, R = W - 100, X = AR ? R : L, M = R - L; let y = 190;
    if (d.kick) { x.font = `800 34px ${FB}`; x.fillStyle = '#F2C23A'; x.fillText(clean(d.kick).toUpperCase().slice(0, 60), X, y); y += 40; }
    let fs = AR ? 76 : 92; x.font = `900 ${fs}px ${FD}`; x.fillStyle = '#fff';
    let tl = wrap(x, d.title, M); if (tl.length > 4) { fs = AR ? 60 : 72; x.font = `900 ${fs}px ${FD}`; tl = wrap(x, d.title, M).slice(0, 5); }
    const lh = fs * (AR ? 1.35 : 1.05); for (const l of tl) { y += lh; x.fillText(l, X, y); }
    y += 40;
    if (d.big) { const bs = d.big.length > 8 ? 120 : 190; x.font = `900 ${bs}px ${FD}`; x.fillStyle = d.bigColor || '#F2C23A';
      const bl = wrap(x, d.big, M).slice(0, 2); for (const l of bl) { y += bs * .95; x.fillText(l, X, y); } y += 20; }
    if (d.bigSub) { x.font = `700 40px ${FB}`; x.fillStyle = '#f1e5d6'; for (const l of wrap(x, d.bigSub, M).slice(0, 2)) { y += 54; x.fillText(l, X, y); } y += 16; }
    if (d.sub) { x.font = `500 36px ${FB}`; x.fillStyle = '#cfc2b3'; const max = Math.max(1, Math.floor((H - 300 - y) / 52));
      const sl = wrap(x, d.sub, M); const show = sl.slice(0, Math.min(max, 6)); if (sl.length > show.length) show[show.length - 1] += '…';
      for (const l of show) { y += 52; x.fillText(l, X, y); } }
    // pied : logo + nom + adresse
    x.fillStyle = 'rgba(242,194,58,.5)'; x.fillRect(L, H - 210, M, 2);
    const logo = await img(ROOT + 'assets/brand/logo-192.png');
    x.direction = 'ltr'; x.textAlign = 'left';
    if (logo) x.drawImage(logo, L, H - 180, 96, 96);
    x.font = `900 54px ${'"Big Shoulders Display", "Cairo", sans-serif'}`; x.fillStyle = '#F2C23A'; x.fillText('Taraji', L + 116, H - 118);
    const tw = x.measureText('Taraji ').width; x.fillStyle = '#E0303C'; x.fillText('Archives', L + 116 + tw, H - 118);
    x.font = `600 30px ${FB}`; x.fillStyle = '#bfb3a5'; x.fillText(SITE, L + 116, H - 80);
    return new Promise(r => c.toBlob(r, 'image/png'));
  }
  window.taShareCard = async (d, text, btn) => {
    const url = location.href.split('#')[0], label = btn && btn.innerHTML;
    window.taTrack && window.taTrack('partage-image/' + (d.kind || 'autre'), 'Image partagée : ' + (d.title || '').slice(0, 80));
    window.taProg && window.taProg('share');
    if (btn) { btn.disabled = true; btn.textContent = T('Préparation…', 'جارٍ التحضير…'); }
    try {
      const blob = await makeCard(d), file = new File([blob], 'taraji-archives.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text: text + '\n' + url }); return; } catch (e) { if (e.name === 'AbortError') return; }
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'taraji-archives.png'; document.body.appendChild(a); a.click(); a.remove();
      try { await navigator.clipboard.writeText(text + '\n' + url); toast(T('Image enregistrée · lien copié', 'تمّ حفظ الصورة · ونسخ الرابط')); } catch (e) { toast(T('Image enregistrée', 'تمّ حفظ الصورة')); }
    } finally { if (btn) { btn.disabled = false; btn.innerHTML = label; } }
  };

  /* -- ce que contient la page (réponse ou dossier) */
  const info = () => {
    const rep = document.getElementById('rep');
    if (rep) return { kind: 'rep', kick: clean(rep.querySelector('.rep-hd small')?.innerText), title: clean(rep.querySelector('h1')?.innerText),
      big: clean(rep.querySelector('.rep-num')?.innerText), bigSub: clean(rep.querySelector('.rep-big span')?.innerText), sub: clean(rep.querySelector('.rep-txt')?.innerText) };
    const dos = document.querySelector('article.dossier, .d-head');
    if (dos) { const st = document.querySelector('.stamp'); return { kind: 'dos', kick: clean(document.querySelector('.d-kicker')?.innerText), title: clean(document.querySelector('h1')?.innerText),
      big: clean(st?.innerText), bigColor: st && st.classList.contains('acc') ? '#ff5a63' : '#F2C23A', sub: clean(document.querySelector('.d-sum')?.innerText) }; }
    const h1 = document.querySelector('main h1, .wrap h1');
    if (h1 && document.querySelector('.share')) return { kind: 'page', kick: '', title: clean(h1.innerText), sub: clean(document.querySelector('.lead, .chapo, .d-sum')?.innerText) };
    return null;
  };

  /* -- favoris */
  const FK = 'ta-fav', favs = () => LS.get(FK, []), isFav = u => favs().some(f => f.u === u);
  const favBtn = () => { const u = page(), b = document.createElement('button'); b.type = 'button'; b.className = 'btn alt fav-btn';
    const paint = () => { const on = isFav(u); b.setAttribute('aria-pressed', on); b.innerHTML = on ? '★ ' + T('Gardé', 'محفوظ') : '☆ ' + T('Garder', 'احفظ'); };
    b.onclick = () => { const i = info() || {}; let F = favs();
      if (isFav(u)) { F = F.filter(f => f.u !== u); toast(T('Retiré de Mes archives', 'حُذف من أرشيفي')); }
      else { F.unshift({ u, t: i.title || document.title, k: i.kick || '', l: AR ? 'ar' : 'fr', at: Date.now() }); toast(T('Gardé dans Mes archives ★', 'حُفظ في أرشيفي ★')); window.taTrack && window.taTrack('favori/ajout'); }
      LS.set(FK, F.slice(0, 200)); paint(); };
    paint(); return b; };
  const shareImgBtn = () => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn alt img-btn';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg> ' + T('Image à partager', 'صورة للمشاركة');
    b.onclick = () => { const i = info(); if (i) window.taShareCard(i, [i.title, i.big && (i.big + ' ' + (i.bigSub || ''))].filter(Boolean).join(' : '), b); };
    return b; };
  // réponses : « Partager la réponse » devient l'image ; + Garder
  document.querySelectorAll('.rep-share').forEach(b => { const n = b.cloneNode(true); b.replaceWith(n);
    n.addEventListener('click', () => { const i = info(); window.taShareCard(i, i.title + (i.big ? ' : ' + i.big + ' ' + (i.bigSub || '') : ''), n); });
    n.insertAdjacentElement('afterend', favBtn()); });
  // dossiers et articles : bloc « Partager »
  document.querySelectorAll('.share').forEach(s => { if (s.querySelector('.img-btn')) return; const box = document.createElement('div'); box.className = 'share-plus';
    box.append(shareImgBtn(), favBtn()); s.insertAdjacentElement('beforebegin', box); });

  // page « Mes archives » + rappel sur l'accueil
  const list = document.getElementById('favList');
  const href = f => (f.l === 'ar' && !AR ? 'ar/' : (f.l !== 'ar' && AR ? '../' : '')) + f.u;
  if (list) { const draw = () => { const F = favs(); document.getElementById('favEmpty').hidden = !!F.length;
      list.innerHTML = F.map((f, i) => `<li><a href="${esc(href(f))}"><small>${esc(f.k)}</small><b>${esc(f.t)}</b></a><button type="button" data-i="${i}" aria-label="${T('Retirer', 'حذف')}">×</button></li>`).join('');
      list.querySelectorAll('button').forEach(b => b.onclick = () => { const F2 = favs(); F2.splice(+b.dataset.i, 1); LS.set(FK, F2); draw(); }); };
    draw(); }
  const hf = document.getElementById('hFavs');
  if (hf) { const F = favs(); if (F.length) { hf.hidden = false;
      hf.innerHTML = `<div class="block-head"><h2>★ ${T('Mes archives', 'أرشيفي')}</h2><a class="more-link" href="mes-archives.html">${T('Tout voir', 'عرض الكل')} (${F.length})</a></div>`
        + `<div class="hf-row">${F.slice(0, 6).map(f => `<a href="${esc(href(f))}"><small>${esc(f.k)}</small><b>${esc(f.t)}</b></a>`).join('')}</div>`; } }

  /* -- question du jour */
  const qd = document.getElementById('qdj');
  if (qd) fetch(ROOT + 'assets/data/quiz.json').then(r => r.json()).then(Q => {
    const now = new Date(), day = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const pool = Q.filter(q => !q.img && q.lv >= 2);
    let h = 0; for (const ch of 'ta' + day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const x = pool[h % pool.length]; if (!x) return;
    const yest = new Date(now - 864e5), yd = yest.getFullYear() + '-' + String(yest.getMonth() + 1).padStart(2, '0') + '-' + String(yest.getDate()).padStart(2, '0');
    let S = LS.get('ta-qdj', { last: '', n: 0, best: 0, ans: null });
    if (S.last && S.last !== day && S.last !== yd) S.n = 0;   // série interrompue
    const opts = [[x.a, x.aa], ...x.o.map((o, j) => [o, x.oa[j] || o])]; let k = h; for (let i = opts.length - 1; i > 0; i--) { k = (k * 1103515245 + 12345) >>> 0; const j = k % (i + 1); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    const streak = n => n ? `<span class="qd-st" title="${T('jours de suite', 'أيّام متتالية')}">🔥 ${n} ${n > 1 ? T('jours de suite', 'أيّام متتالية') : T('jour', 'يوم')}</span>` : '';
    const draw = () => {
      const done = S.last === day && S.ans != null, good = done && S.ans === x.a;
      qd.innerHTML = `<div class="qd-top"><span class="qd-k">${T('Question du jour', 'سؤال اليوم')}</span>${streak(S.last === day || S.last === yd ? S.n : 0)}</div>
        <h2>${esc(AR ? x.qa : x.q)}</h2><div class="qd-opts">${opts.map(o => `<button type="button" data-v="${esc(o[0])}" ${done ? 'disabled' : ''} class="${done && o[0] === x.a ? 'ok' : done && o[0] === S.ans ? 'ko' : ''}">${esc(AR ? o[1] : o[0])}</button>`).join('')}</div>
        ${done ? `<div class="qd-res"><p><b>${good ? T('Bonne réponse !', 'إجابة صحيحة!') : T('Raté.', 'خطأ.')}</b> ${esc(AR ? (x.ea || '') : x.e)}</p>
          <p class="qd-act"><a class="btn" href="quiz.html">${T('Plus de questions', 'أسئلة أخرى')}</a><button type="button" class="btn alt qd-sh">${T('Défier un ami', 'تحدَّ صديقًا')}</button>${x.u ? `<a class="qd-src" href="${esc(x.u)}">${T('La réponse en détail', 'الجواب بالتفصيل')} →</a>` : ''}</p>
          <p class="qd-next">${T('Nouvelle question demain.', 'سؤال جديد غدًا.')}</p></div>` : ''}`;
      qd.querySelectorAll('.qd-opts button').forEach(b => b.onclick = () => {
        if (S.last !== day) { S.n = (S.last === yd ? S.n : 0) + 1; S.best = Math.max(S.best || 0, S.n); S.last = day; }
        S.ans = b.dataset.v; LS.set('ta-qdj', S); window.taTrack && window.taTrack('question-du-jour/' + (S.ans === x.a ? 'bonne' : 'fausse')); draw(); qd.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
      const sh = qd.querySelector('.qd-sh');
      if (sh) sh.onclick = () => window.taShareCard({ kind: 'question-du-jour', kick: T('Question du jour', 'سؤال اليوم'), title: AR ? x.qa : x.q, big: S.ans === x.a ? '✓' : '?', bigSub: T('Et toi, tu sais ?', 'وأنت، هل تعرف؟') + (S.n > 1 ? '  ·  🔥 ' + S.n : ''), sub: '' },
        (AR ? x.qa : x.q) + '\n' + T('Question du jour sur Taraji Archives. Et toi, tu sais ?', 'سؤال اليوم على Taraji Archives. وأنت، هل تعرف؟'), sh);
    };
    qd.hidden = false; draw();
  }).catch(() => {});
})();


/* ================================================================ mesure d'audience (GoatCounter : sans cookies, sans donnée personnelle)
   Activer : mettre le code du compte dans GC (ex. 'tarajiarchives'). Vide = rien n'est chargé. */
(() => {
  const GC = 'tarajiarchvies';
  window.taTrack = (name, title) => { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: String(name).slice(0, 180), title: title || String(name), event: true }); } catch (e) {} };
  if (!GC || !/tarajiarchives/.test(location.hostname)) return;
  const sc = document.createElement('script'); sc.async = true; sc.dataset.goatcounter = `https://${GC}.goatcounter.com/count`; sc.src = 'https://gc.zgo.at/count.js';
  document.head.appendChild(sc);
  window.addEventListener('appinstalled', () => window.taTrack('app/installee'));
})();


/* ================================================================ fidélité : bandeau avant-derby + badges (tout reste sur l'appareil) */
(() => {
  const AR = document.documentElement.lang === 'ar';
  const T = (f, a) => AR ? a : f;
  const LS = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const page = (location.pathname.split('/').pop() || 'index.html');

  /* -- prochain match : le premier dont le jour n'est pas encore passé (jusqu'au soir du match) */
  const dl = document.getElementById('dmode');
  if (dl) { const now = new Date();
    const next = [...dl.querySelectorAll('.dmode')].find(s => new Date((s.dataset.fin || s.dataset.date) + 'T23:59:59') >= now);
    if (next) { next.hidden = false;
      const d0 = new Date(next.dataset.date + 'T00:00:00'), days = Math.ceil((d0 - now) / 864e5);
      next.querySelector('.dm-cd').textContent = next.dataset.joue ? T('Terminé', 'انتهت') : days <= 0 ? T("C'est aujourd'hui !", 'اليوم!') : days === 1 ? T('Demain', 'غدًا') : (AR ? 'بعد ' + days + ' أيّام' : 'J-' + days); } }

  /* -- badges */
  const P = LS.get('ta-prog', { rep: [], fab: [], share: 0, quiz: {} });
  const save = () => LS.set('ta-prog', P);
  const B = [
    ['curieux', '🔎', T('Curieux', 'فضولي'), T('5 réponses lues', 'قراءة 5 أجوبة'), () => P.rep.length >= 5, () => [P.rep.length, 5]],
    ['archiviste', '📚', T('Archiviste', 'أرشيفي'), T('20 réponses lues', 'قراءة 20 جوابًا'), () => P.rep.length >= 20, () => [P.rep.length, 20]],
    ['fables', '🧨', T('Démolisseur de fables', 'هادم الخرافات'), T('5 fables lues', 'قراءة 5 خرافات'), () => P.fab.length >= 5, () => [P.fab.length, 5]],
    ['fables10', '🛡️', T('Gardien de la vérité', 'حارس الحقيقة'), T('Les 10 fables lues', 'قراءة الخرافات العشر'), () => P.fab.length >= 10, () => [P.fab.length, 10]],
    ['derby', '🏟️', T('Spécialiste du derby', 'خبير الدربي'), T('Bilan du derby + face-à-face lus', 'حصيلة الدربي والمواجهات'), () => P.rep.includes('reponse-bilan-club-africain.html') && P.derbyH, () => [(P.rep.includes('reponse-bilan-club-africain.html') ? 1 : 0) + (P.derbyH ? 1 : 0), 2]],
    ['fidele', '🔥', T('Fidèle', 'وفيّ'), T('Question du jour : 3 jours de suite', 'سؤال اليوم: 3 أيّام متتالية'), () => (LS.get('ta-qdj', {}).best || 0) >= 3, () => [LS.get('ta-qdj', {}).best || 0, 3]],
    ['assidu', '🏆', T('Assidu', 'مواظب'), T('Question du jour : 7 jours de suite', 'سؤال اليوم: 7 أيّام متتالية'), () => (LS.get('ta-qdj', {}).best || 0) >= 7, () => [LS.get('ta-qdj', {}).best || 0, 7]],
    ['expert', '🧠', T('Expert', 'خبير'), T('Quiz difficile : 8/10 ou plus', 'اختبار صعب: 8/10 أو أكثر'), () => (P.quiz['3'] || 0) >= 0.8, () => [Math.round((P.quiz['3'] || 0) * 10), 8]],
    ['parfait', '💯', T('Sans faute', 'بلا خطأ'), T('Un quiz à 100 %', 'اختبار كامل دون خطأ'), () => Object.values(P.quiz).some(x => x >= 1), () => [Math.round(Math.max(0, ...Object.values(P.quiz)) * 10), 10]],
    ['ambassadeur', '📣', T('Ambassadeur', 'سفير'), T('3 images partagées', 'مشاركة 3 صور'), () => P.share >= 3, () => [P.share, 3]],
    ['collection', '⭐', T('Collectionneur', 'جامع'), T('5 éléments gardés', 'حفظ 5 عناصر'), () => LS.get('ta-fav', []).length >= 5, () => [LS.get('ta-fav', []).length, 5]],
  ];
  const got = () => LS.get('ta-badges', {});
  const check = () => { const G = got(); let nw = null;
    for (const b of B) if (!G[b[0]] && b[4]()) { G[b[0]] = Date.now(); nw = b; }
    LS.set('ta-badges', G);
    if (nw) { let t = document.querySelector('.ta-toast'); if (!t) { t = document.createElement('div'); t.className = 'ta-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
      t.innerHTML = `${nw[1]} ${T('Nouveau badge', 'شارة جديدة')} : <b>${nw[2]}</b> <a href="${AR ? '' : ''}mes-archives.html">${T('Voir', 'عرض')}</a>`; t.classList.add('on', 'bdg'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on', 'bdg'), 4500); } };
  window.taProg = (kind, x) => { if (kind === 'share') P.share++; if (kind === 'quiz' && x) P.quiz[x.lv] = Math.max(P.quiz[x.lv] || 0, x.score / x.n); save(); setTimeout(check, 300); };
  if (/^reponse-/.test(page) && !P.rep.includes(page)) { P.rep.push(page); save(); }
  if (/^fable-/.test(page) && !P.fab.includes(page)) { P.fab.push(page); save(); }
  if (page === 'comparer.html' && /club-africain/.test(location.search)) { P.derbyH = 1; save(); }
  setTimeout(check, 1200);
  document.addEventListener('click', e => { if (e.target.closest('.fav-btn, .qd-opts button')) setTimeout(check, 400); });

  const grid = document.getElementById('bdgGrid');
  if (grid) { const G = got(); grid.innerHTML = B.map(b => { const on = !!G[b[0]], [a, n] = b[5]();
      return `<div class="bdg${on ? ' on' : ''}"><span class="bi">${b[1]}</span><b>${b[2]}</b><small>${b[3]}</small>${on ? `<button type="button" class="bdg-sh" data-b="${b[0]}">${T('Partager', 'شارك')}</button>` : `<span class="bp"><i style="width:${Math.min(100, a / n * 100)}%"></i></span><small class="bn" dir="ltr">${Math.min(a, n)} / ${n}</small>`}</div>`; }).join('');
    const nOn = B.filter(b => G[b[0]]).length; grid.insertAdjacentHTML('beforebegin', `<p class="bdg-count">${nOn} / ${B.length} ${T('badges', 'شارات')}</p>`);
    grid.querySelectorAll('.bdg-sh').forEach(btn => btn.onclick = () => { const b = B.find(x => x[0] === btn.dataset.b);
      window.taShareCard && window.taShareCard({ kind: 'badge', kick: T('Nouveau badge', 'شارة جديدة'), title: b[2], big: b[1], bigSub: b[3], sub: T('Et toi, combien de badges sur Taraji Archives ?', 'وأنت، كم شارة لديك على Taraji Archives؟') },
        T(`J'ai débloqué le badge « ${b[2]} » sur Taraji Archives`, `حصلت على شارة «${b[2]}» في Taraji Archives`), btn); }); }
})();


/* ================================================================ likes ♥ (Supabase : compteur partagé, un like par appareil, aucune donnée personnelle) */
(() => {
  const SB = 'https://vojzrfcxfsncqcfjqhqd.supabase.co', KEY = 'sb_publishable_31Rzk1dCDhs1OZrWjys-oA_cDcxACIk';
  const AR = document.documentElement.lang === 'ar', T = (f, a) => AR ? a : f, ROOT = window.TA_ROOT || '';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rpc = (fn, body) => fetch(`${SB}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(r => r.ok ? r.json() : Promise.reject(r.status));
  let dev; try { dev = localStorage.getItem('ta-dev'); if (!dev) { dev = (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); })); localStorage.setItem('ta-dev', dev); } } catch (e) { dev = null; }
  const item = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
  const fmt = n => n > 999 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n);

  // bouton ♥ à côté de « Garder »
  const anchors = document.querySelectorAll('.fav-btn');
  if (anchors.length && dev) {
    const btns = [];
    anchors.forEach(a => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn alt like-btn'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span class="lk-h" aria-hidden="true">♡</span><span class="lk-n"></span><span class="sr">' + T("J'aime", 'أعجبني') + '</span>'; a.insertAdjacentElement('afterend', b); btns.push(b); });
    let on = false, n = 0, busy = false;
    const paint = () => btns.forEach(b => { b.setAttribute('aria-pressed', on); b.querySelector('.lk-h').textContent = on ? '♥' : '♡'; b.querySelector('.lk-n').textContent = n ? fmt(n) : T("J'aime", 'أعجبني'); });
    paint();
    rpc('get_reactions', { p_items: [item], p_device: dev }).then(R => { const r = (R || []).find(x => x.kind === 'like'); if (r) { n = +r.n; on = !!r.mine; } paint(); }).catch(() => {});
    btns.forEach(b => b.addEventListener('click', () => { if (busy) return; busy = true;
      const prev = [on, n]; on = !on; n = Math.max(0, n + (on ? 1 : -1)); paint(); b.classList.add('pop'); setTimeout(() => b.classList.remove('pop'), 350);
      rpc('toggle_reaction', { p_item: item, p_device: dev, p_kind: 'like' }).then(r => { on = !!r.on; n = +r.n; paint(); if (on) window.taTrack && window.taTrack('like/' + item); })
        .catch(() => { [on, n] = prev; paint(); }).finally(() => { busy = false; }); }));
  }

  // listes « les plus aimés » (accueil + page dédiée)
  const titles = async () => { try { const R = await (await fetch(ROOT + 'assets/data/' + (AR ? 'ar/' : '') + 'recherche.json')).json(); const M = {}; R.forEach(x => { const k = x.u.replace(/\.html.*$/, ''); if (!M[k]) M[k] = x; }); return M; } catch (e) { return {}; } };
  const row = (M, x, i) => { const t = M[x.item]; if (!t) return ''; return `<li><a href="${esc(x.item)}.html"><span class="tp-r">${i + 1}</span><span class="tp-t"><small>${esc(t.k)}</small><b>${esc(t.t)}</b></span><span class="tp-n">♥ ${fmt(+x.n)}</span></a></li>`; };
  const hTop = document.getElementById('hTop'), wk = document.getElementById('topWeek'), all = document.getElementById('topAll');
  if (hTop) Promise.all([rpc('top_reactions', { p_days: 7, p_limit: 12 }), rpc('top_reactions', { p_days: 3650, p_limit: 12 }), titles()]).then(([W, A, M]) => {
    const L = (W && W.length >= 3 ? W : A || []).filter(x => M[x.item]).slice(0, 5); if (!L.length) return;
    hTop.hidden = false; hTop.innerHTML = `<div class="block-head"><h2>♥ ${W && W.length >= 3 ? T('Les plus aimés cette semaine', 'الأكثر إعجابًا هذا الأسبوع') : T('Les plus aimés', 'الأكثر إعجابًا')}</h2><a class="more-link" href="les-plus-aimes.html">${T('Tout voir', 'عرض الكل')}</a></div><ol class="top-list">${L.map((x, i) => row(M, x, i)).join('')}</ol>`;
  }).catch(() => {});
  if (wk || all) Promise.all([rpc('top_reactions', { p_days: 7, p_limit: 30 }), rpc('top_reactions', { p_days: 3650, p_limit: 50 }), titles()]).then(([W, A, M]) => {
    const empty = `<li class="tp-empty">${T('Pas encore de votes. Sois le premier : touche ♥ sur une réponse ou une fable.', 'لا أصوات بعد. كن الأوّل: اضغط ♥ في أيّ جواب أو خرافة.')}</li>`;
    const w = (W || []).filter(x => M[x.item]).slice(0, 10), a = (A || []).filter(x => M[x.item]).slice(0, 30);
    if (wk) wk.innerHTML = w.length ? w.map((x, i) => row(M, x, i)).join('') : empty;
    if (all) all.innerHTML = a.length ? a.map((x, i) => row(M, x, i)).join('') : empty;
  }).catch(() => { if (wk) wk.innerHTML = `<li class="tp-empty">${T('Classement indisponible pour le moment.', 'الترتيب غير متاح حاليًا.')}</li>`; });
})();
