/* Taraji Archives — refonte : diaporama d'archives, fable en 4 étapes, chapitres, compteurs, apparition au défilement. */
(() => {
  const AR = document.documentElement.lang === 'ar';
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -- diaporama de l'accueil */
  const H = document.querySelector('.rh-hero');
  if (H) {
    const im = H.querySelectorAll('.rh-slides img'), d = H.querySelectorAll('.rh-tl button'), cap = document.getElementById('rhCap');
    let k = 0, t = 0, left = 6000, st = 0;
    const mark = () => { d.forEach((b, i) => { b.classList.toggle('done', i < k); b.classList.remove('on'); }); void d[k].offsetWidth; d[k].classList.add('on'); };
    const run = ms => { clearTimeout(t); left = ms; st = Date.now(); if (!calme) t = setTimeout(() => go(k + 1), ms); };
    const go = n => {
      im[k].classList.remove('on'); k = (n + im.length) % im.length;
      const x = im[k]; if (x.loading === 'lazy') x.loading = 'eager';
      x.classList.add('on'); mark();
      if (cap) { cap.style.opacity = 0; setTimeout(() => { cap.textContent = (AR && x.dataset.capAr) || x.dataset.cap || ''; cap.style.opacity = 1; }, 400); }
      run(6000);
    };
    d.forEach((b, i) => b.addEventListener('click', () => go(i)));
    H.addEventListener('mouseenter', () => { clearTimeout(t); left -= Date.now() - st; H.classList.add('pause'); });
    H.addEventListener('mouseleave', () => { H.classList.remove('pause'); run(Math.max(left, 300)); });
    // balayage au doigt (mobile)
    let x0 = null;
    H.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    H.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(k + ((dx < 0) !== AR ? 1 : -1)); }, { passive: true });
    // précharger la photo suivante pendant la première
    setTimeout(() => im.forEach(x => { if (x.loading === 'lazy') x.loading = 'eager'; }), 2500);
    if (calme) d.forEach(b => b.classList.add('done')); else run(6000);
  }

  /* -- fable en 4 étapes (défilement) */
  const stage = document.querySelector('.rs-stage'), steps = document.querySelectorAll('.rs-step');
  if (stage && steps.length && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { steps.forEach(s => s.classList.remove('on')); x.target.classList.add('on'); stage.dataset.s = x.target.dataset.s; } }),
      { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => so.observe(s));
  }

  /* -- chapitres : flèches et barre de progression */
  const r = document.getElementById('rcRail'), bar = document.getElementById('rcBar');
  if (r) {
    const upd = () => { if (!bar) return; const w = r.clientWidth / r.scrollWidth, x = Math.abs(r.scrollLeft) / r.scrollWidth; bar.style.width = (w * 100) + '%'; bar.style.marginInlineStart = (x * 100) + '%'; };
    r.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    document.querySelectorAll('.rc-nav button').forEach(b => b.addEventListener('click', () => r.scrollBy({ left: +b.dataset.d * r.clientWidth * .8 * (AR ? -1 : 1), behavior: 'smooth' })));
  }

  /* -- compteurs et apparition au défilement */
  const count = el => { const n = +el.dataset.n; if (!n || calme) return; let t0 = null;
    const f = ts => { t0 = t0 || ts; const p = Math.min((ts - t0) / 1400, 1); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };
  const rv = document.querySelectorAll('.rh-sec, .rh-fonds > .rh-wrap > *');
  if (rv.length && 'IntersectionObserver' in window && !calme) {
    document.documentElement.classList.add('js-rv');
    rv.forEach(x => x.classList.add('rv-on'));
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); x.target.querySelectorAll('[data-n]').forEach(count); io.unobserve(x.target); } }), { threshold: .08 });
    rv.forEach(x => io.observe(x));
  }
})();
