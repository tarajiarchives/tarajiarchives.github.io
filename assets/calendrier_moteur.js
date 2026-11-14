/* Taraji Archives — moteur statistique « Calendriers & Records » (fonctions pures, testées dans tests/calendrier.test.js).
   Un match : { d: 'AAAA-MM-JJ' | '', c: compétition, s: saison, h: club recevant, a: club visiteur, bh, ba, st: statut, n: neutre } */
(function (root) {
  const DAY = 86400000;
  const t = d => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  const days = (a, b) => Math.round((t(b) - t(a)) / DAY);
  const played = m => m.st !== 'tapis vert' && m.st !== 'annulé' && m.st !== 'forfait';

  // matchs d'un club, triés ; ceux sans date sont rendus à part
  function clubMatches(M, club, f) {
    const all = M.filter(m => (m.h === club || m.a === club) && played(m) && keep(m, club, f));
    const dated = all.filter(m => m.d).sort((x, y) => x.d < y.d ? -1 : x.d > y.d ? 1 : 0);
    return { dated, undated: all.filter(m => !m.d) };
  }
  function keep(m, club, f) {
    f = f || {};
    if (f.comps && f.comps.length && !f.comps.includes(m.c)) return false;
    if (f.lieu === 'dom' && (m.h !== club || m.n)) return false;
    if (f.lieu === 'ext' && (m.a !== club || m.n)) return false;
    if (m.d) return (!f.de || m.d >= f.de) && (!f.a || m.d <= f.a);
    return inSeasonRange(m, f);
  }
  // un match sans date est rattaché à la période si sa saison est entièrement dedans
  function inSeasonRange(m, f) {
    f = f || {};
    const y = +String(m.s).slice(0, 4); if (!y) return false;
    const s0 = String(m.s).length > 4 ? `${y}-07-01` : `${y}-01-01`, s1 = String(m.s).length > 4 ? `${y + 1}-06-30` : `${y}-12-31`;
    return (!f.de || s0 >= f.de) && (!f.a || s1 <= f.a);
  }
  // intervalles entre deux matchs successifs (jours calendaires)
  function gaps(dated) {
    const g = [];
    for (let i = 1; i < dated.length; i++) g.push(days(dated[i - 1].d, dated[i].d));
    return g;
  }
  const median = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
  // fenêtre glissante : nombre maximal de matchs dans n jours consécutifs (bornes incluses), avec la première fenêtre qui l'atteint
  function maxWindow(dated, n) {
    let best = 0, bi = -1, bj = -1, j = 0;
    for (let i = 0; i < dated.length; i++) {
      while (days(dated[j].d, dated[i].d) > n - 1) j++;
      if (i - j + 1 > best) { best = i - j + 1; bi = j; bj = i; }
    }
    return { n: best, from: bi >= 0 ? dated[bi].d : null, to: bj >= 0 ? dated[bj].d : null, matches: bi >= 0 ? dated.slice(bi, bj + 1) : [] };
  }
  // plus longue série de matchs consécutifs espacés d'au plus k jours
  function longestTight(dated, k) {
    let best = dated.length ? 1 : 0, bs = 0, s = 0;
    for (let i = 1; i < dated.length; i++) {
      if (days(dated[i - 1].d, dated[i].d) > k) s = i;
      if (i - s + 1 > best) { best = i - s + 1; bs = s; }
    }
    return { n: best, matches: dated.slice(bs, bs + best) };
  }
  // plus longue série de matchs consécutifs à l'extérieur
  function longestAway(dated, club) {
    let best = 0, cur = 0, end = -1;
    dated.forEach((m, i) => { if (m.a === club && !m.n) { cur++; if (cur > best) { best = cur; end = i; } } else cur = 0; });
    return { n: best, matches: end >= 0 ? dated.slice(end - best + 1, end + 1) : [] };
  }
  const res = (m, club) => { if (m.bh === '' || m.bh == null) return null; const f = m.h === club ? m.bh - m.ba : m.ba - m.bh; return f > 0 ? 'V' : f < 0 ? 'D' : 'N'; };
  // résultats selon les jours de repos depuis le match précédent
  const BUCKETS = [[0, 2, '≤ 2'], [3, 3, '3'], [4, 6, '4 à 6'], [7, 1e9, '7 et +']];
  function byRest(dated, club) {
    const out = BUCKETS.map(b => ({ lab: b[2], V: 0, N: 0, D: 0, n: 0 }));
    for (let i = 1; i < dated.length; i++) {
      const g = days(dated[i - 1].d, dated[i].d), r = res(dated[i], club); if (!r) continue;
      const k = BUCKETS.findIndex(b => g >= b[0] && g <= b[1]); out[k][r]++; out[k].n++;
    }
    return out;
  }
  function count(arr, f) { const o = {}; arr.forEach(x => { const k = f(x); o[k] = (o[k] || 0) + 1; }); return o; }
  // indicateurs d'un club sur la période
  function stats(M, club, f) {
    const { dated, undated } = clubMatches(M, club, f);
    const all = dated.concat(undated), g = gaps(dated);
    return {
      club, matchs: all.length, dates: dated.length, sansDate: undated.length,
      dom: all.filter(m => m.h === club && !m.n).length, ext: all.filter(m => m.a === club && !m.n).length, neutre: all.filter(m => m.n).length,
      parComp: count(all, m => m.c), parAnnee: count(dated, m => m.d.slice(0, 4)), parMois: count(dated, m => m.d.slice(0, 7)), parSaison: count(all, m => m.s),
      gapMoy: g.length ? g.reduce((a, b) => a + b, 0) / g.length : null, gapMed: median(g), gapMin: g.length ? Math.min(...g) : null,
      moins3: g.filter(x => x < 3).length, moins4: g.filter(x => x < 4).length,
      w7: maxWindow(dated, 7), w15: maxWindow(dated, 15), w30: maxWindow(dated, 30), w60: maxWindow(dated, 60), w90: maxWindow(dated, 90),
      serie3: longestTight(dated, 3), serieExt: longestAway(dated, club),
      intl: maxWindow(dated.filter(m => /^CAF|^ARAB|^UAFA/.test(m.c)), 90),
      repos: byRest(dated, club), dated, undated
    };
  }
  const API = { days, gaps, median, maxWindow, longestTight, longestAway, byRest, stats, clubMatches, inSeasonRange, res };
  if (typeof module !== 'undefined') module.exports = API; else root.TACal = API;
})(this);
