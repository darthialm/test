'use strict';
/* =========================================================
   Contrôles sur papier, évalués par compétences (repris du site de 6e)
   - le professeur coche des compétences (= types d'exercices du site) et colle sa liste d'élèves ;
   - le site imprime une feuille par élève (bande prénom à détacher + code anonyme + QR), un corrigé,
     et un fichier texte pour la correction assistée par l'IA ;
   - après correction, il colle les niveaux (TB, MS, MF, MI) et imprime des étiquettes QR ;
   - le QR ouvre la page « Mon contrôle » (#/r/…) : bilan, corrigé de SON sujet, exercices pour s'entraîner.
   Rien n'est stocké sur un serveur : le sujet est recréé à partir d'une « graine ».
   ========================================================= */
const CTL_STORE = 'revisions5e-controles', CTL_AMEN = 'revisions5e-amenages', CTL_CLASSES = 'revisions5e-classes';
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const LEVELS = ['TB', 'MS', 'MF', 'MI'];
const LEVEL_TXT = { TB: 'Très bonne maîtrise', MS: 'Maîtrise satisfaisante', MF: 'Maîtrise fragile', MI: 'Maîtrise insuffisante' };
const LV1 = { TB: 'T', MS: 'S', MF: 'F', MI: 'I' }, LV1R = { T: 'TB', S: 'MS', F: 'MF', I: 'MI' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normName = (s) => String(s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const ROSTER_KEY = (c) => 'revisions5e-liste-' + normName(c || 'sans');
const siteURL = () => location.href.split('#')[0].replace(/[^/]*$/, '');

/* ---------- Hasard reproductible ---------- */
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash32(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function withSeed(seed, fn) { const orig = Math.random; Math.random = mulberry32(seed); try { return fn(); } finally { Math.random = orig; } }

/* ---------- Durée : temps estimé par question (minutes, sur papier ; à ajuster après quelques contrôles) ---------- */
const CTL_T = {
  'p-reconnaitre': 2.5, 'p-coef': 1.5, 'p-completer': 2.5, 'p-probleme': 3, 'p-pct-appliquer': 2, 'p-pct-calculer': 2, 'p-solde': 2, 'p-echelle-app': 2, 'p-echelle-calc': 2.5, 'p-vitesse': 3, 'p-duree': 2,
  'a-180': 2, 'a-rect': 1.5, 'a-iso': 2, 'a-nature': 2, 'a-vocab': 1.5, 'a-par-calc': 2.5, 'a-prouver': 2,
  'f-meme': 1.5, 'f-couple': 2, 'f-comparer': 1.5, 'f-encadrer': 2, 'f-add-meme': 1.5, 'f-add-1': 2, 'f-add-2': 3, 'f-probleme': 3,
  'd-euclid': 3, 'd-egalite': 1.5, 'd-decimal': 2.5, 'd-vocab': 1.5, 'd-multiples': 2, 'd-diviseurs': 3, 'd-criteres': 1.5, 'd-critere-nb': 2, 'd-premier': 2,
};
const ctlT = (k) => GENS[k]?.t ?? CTL_T[k] ?? 2;

/** Une question « papier » d'un type d'exercice (sans l'étiquette du type, que la feuille affiche déjà) */
function mkQ(k) {
  const saved = CONSTRUCT_MODE; CONSTRUCT_MODE = '';
  try { const o = GENS[k].f(); o.q = o.q.replace(/<p class="tag">.*?<\/p>/, '').replace(/\[\[(.+?)\|(.+?)\]\]/g, (m, a, b) => F(a, b)); return o; } finally { CONSTRUCT_MODE = saved; }
}
const isBoard = (k) => { try { return /class="board"/.test(GENS[k].f().q); } catch (e) { return true; } };

/** Plan d'un contrôle : n = nombre de questions par compétence ; a = plan de la version aménagée (sinon : une de moins) */
function ctlPlan(c) {
  if (Array.isArray(c.n)) return { n: c.n.map(Number), a: Array.isArray(c.a) ? c.a.map(Number) : null };
  return { n: c.k.map(() => Number(c.q) || 3), a: null };
}
function ctlVer(plan, keys, ver) { return { n: plan.n.map((x, i) => (ver !== 'a' ? x : plan.a ? plan.a[i] : Math.max(1, x - 1))) }; }
const ctlMinutes = (keys, p) => keys.reduce((s, k, i) => s + ctlT(k) * p.n[i], 0);
const planStr = (p) => p.n.map((x, i) => x + (p.a ? 'a' + p.a[i] : '')).join('-');
const planParse = (str) => {
  const parts = String(str || '').split('-').map((t) => t.match(/^(\d)(?:h(\d))?(?:a(\d))?$/));
  if (!parts.every(Boolean)) return null;
  return { n: parts.map((m) => Number(m[1])), a: parts.every((m) => m[3]) ? parts.map((m) => Number(m[3])) : null };
};
/** Les questions d'une copie : toujours les mêmes pour le même contrôle et le même numéro d'élève. */
function ctlQuestions(id, n, ver, keys, plan, salt = 0) {
  const p = ctlVer(plan, keys, ver);
  return keys.flatMap((k, ci) => (GENS[k] ? Array.from({ length: p.n[ci] }, (_, m) => ({
    k, ci, m, hard: false, o: withSeed(hash32(`${id}#${n}#${ci}#${m}${salt ? '#' + salt : ''}`), () => mkQ(k)),
  })) : []));
}
const ctlSalt = (c, n) => Number(c.r?.[n]) || 0;
const ctlCode = (id, n) => `${id}-${String(n).padStart(2, '0')}`;
const newCtlId = () => { let s = ''; for (let i = 0; i < 3; i++) s += B32[Math.floor(Math.random() * 32)]; return s; };
/** Niveau proposé à partir des réponses justes (1) / fausses (0) */
function levelFromBits(bits) {
  const n = bits.length, g = [...bits].filter((b) => b === '1').length;
  if (!n) return '';
  if (g === n) return 'TB';
  const r = g / n;
  return r >= 2 / 3 - 1e-9 ? 'MS' : r >= 1 / 3 - 1e-9 && g > 0 ? 'MF' : 'MI';
}

/* ---------- Mise en forme « papier » d'une question ---------- */
function paperHTML(html) {
  const d = document.createElement('div'); d.innerHTML = html;
  d.querySelectorAll('input.ans').forEach((i) => { const sp = document.createElement('span'); sp.className = 'blank'; sp.textContent = ' '; i.replaceWith(sp); });
  d.querySelectorAll('input[type=radio], input[type=checkbox]').forEach((i) => { const sp = document.createElement('span'); sp.className = 'box'; sp.textContent = '☐'; i.replaceWith(sp); });
  d.querySelectorAll('button').forEach((b) => { const sp = document.createElement('span'); sp.className = b.className + ' as-text'; sp.textContent = b.textContent; b.replaceWith(sp); });
  d.querySelectorAll('a').forEach((a) => a.replaceWith(document.createTextNode(a.textContent)));
  d.querySelectorAll('.choices').forEach((ch) => {
    const t = [...ch.querySelectorAll('.choice')].map((c) => c.textContent.trim());
    if (t.some((x) => x.length > 24)) ch.classList.add('long');
    else if (!ch.querySelector('svg') && t.every((x) => x.length <= 8)) ch.classList.add('short');
  });
  // une ligne qui ne contient qu'une case remonte à la fin de la consigne : gain de place
  d.querySelectorAll('p').forEach((pp) => {
    const prev = pp.previousElementSibling;
    if (!prev || prev.tagName !== 'P' || !pp.querySelector('.blank') || pp.querySelector('svg, img, table') || pp.textContent.trim().length > 16) return;
    prev.append(' ', ...pp.childNodes); pp.remove();
  });
  return d.innerHTML.replace(/Écris ta réponse sous la forme 3\/8\./g, 'Écris ta réponse sous la forme d\'une fraction.');
}
/** Texte brut d'un morceau de HTML (fichier pour la correction assistée) */
function plain(html, strip = false) {
  const d = document.createElement('div'); d.innerHTML = String(html || '');
  d.querySelectorAll('.frac').forEach((f) => { const [a, b] = f.children; if (a && b) f.textContent = ` ${a.textContent}/${b.textContent} `; });
  d.querySelectorAll(strip ? 'svg, table' : 'svg').forEach((e) => e.remove());
  d.querySelectorAll('td, th').forEach((e) => e.append(' | '));
  d.querySelectorAll('p, div, li, label, tr, br, h3, h4').forEach((e) => e.after(' '));
  return d.textContent.replace(/\s+/g, ' ').replace(/ ([.,;)])(?=\s|$)/g, '$1').trim();
}
function ctlWork() {
  let w = document.getElementById('ctl-work');
  if (!w) { w = document.createElement('div'); w.id = 'ctl-work'; w.setAttribute('aria-hidden', 'true'); document.body.appendChild(w); }
  return w;
}
/** Remplit la bonne réponse (si on sait) et renvoie la correction du site */
function revealAnswer(cur, q) {
  if (typeof cur.__solve === 'function') { try { cur.__solve(q); } catch (e) { /* rien */ } }
  else if (cur._correct !== undefined) q.querySelector(`.rb[data-o="${cur._correct}"]`).checked = true;
  else q.querySelectorAll('.ans').forEach((i) => { if (!i.value) i.value = '0'; });
  const res = cur.check(q) || { msg: '' };
  q.querySelectorAll('.ans').forEach((i) => { i.value = ''; i.classList.remove('wrong', 'right'); });
  return res;
}
function questionAnswer(o) {
  const body = ctlWork(); body.innerHTML = o.q;
  let msg = '', good = '';
  try { const r = revealAnswer(o, body); msg = typeof r?.msg === 'string' ? r.msg : ''; } catch (e) { msg = ''; }
  if (o._correct !== undefined) {
    const order = [...o.q.matchAll(/data-o="(\d+)"/g)].map((m) => Number(m[1]));
    good = `choix n° ${order.indexOf(o._correct) + 1} (dans l'ordre de la copie) : ${plain(o._opts[o._correct])}`;
  }
  body.innerHTML = '';
  return { msg, good };
}

/* ---------- Stockage (sur cet appareil) ---------- */
const ctlAll = () => { try { return JSON.parse(localStorage.getItem(CTL_STORE) || '[]'); } catch (e) { return []; } };
function ctlSave(c) {
  const all = ctlAll().filter((x) => x.id !== c.id); all.unshift(c);
  try { localStorage.setItem(CTL_STORE, JSON.stringify(all.slice(0, 40))); } catch (e) { /* rien */ }
}
const ctlFind = (id) => ctlAll().find((c) => c.id === id);
const amenGet = (classe) => { try { return (JSON.parse(localStorage.getItem(CTL_AMEN) || '{}'))[normName(classe || 'sans')] || []; } catch (e) { return []; } };
function amenSet(classe, list) {
  try { const all = JSON.parse(localStorage.getItem(CTL_AMEN) || '{}'); all[normName(classe || 'sans')] = list; localStorage.setItem(CTL_AMEN, JSON.stringify(all)); } catch (e) { /* rien */ }
}

/* ---------- Fenêtre d'impression ---------- */
function printWindow(title, bodyHTML, extraCSS = '', after) {
  const w = window.open('', '_blank');
  if (!w) { alert('Ton navigateur a bloqué la fenêtre d\'impression. Autorise les fenêtres pop-up pour ce site, puis recommence.'); return null; }
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')].filter((l) => /style\.css|chapitres-5e\.css/.test(l.getAttribute('href'))).map((l) => `<link rel="stylesheet" href="${l.href}">`).join('');
  w.document.open();
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title)}</title>${links}<style>${extraCSS}</style></head><body class="print-doc">${bodyHTML}</body></html>`);
  w.document.close();
  return w;
}

/* ---------- Sujets ---------- */
function sheetHTML(c, i) {
  const [name, ver] = c.s[i], n = i + 1, code = ctlCode(c.id, n);
  const qs = ctlQuestions(c.id, n, ver, c.k, ctlPlan(c), ctlSalt(c, n));
  const date = new Date(c.d).toLocaleDateString('fr-FR');
  return `<div class="ctl-sheet${ver === 'a' ? ' ver-a' : ''}" data-code="${code}">
    <div class="ctl-band"><span>Prénom : <b>${esc(name)}</b></span><span>${[c.c, c.t, date].filter(Boolean).map(esc).join(' · ')}</span></div>
    <div class="ctl-cut">✂ — — — à détacher (ou à replier) avant de rendre la copie — — —</div>
    <div class="ctl-head">
      <div class="ctl-code">${window.qrSVG ? qrSVG(code, 'M') : ''}<b>${code}</b></div>
      <div class="ctl-title"><b>${esc(c.t)}</b><br><span class="small">Écris tes réponses dans les cases.</span></div>
      <table class="ctl-grid"><tr><th>Compétence</th><th>TB</th><th>MS</th><th>MF</th><th>MI</th></tr>
        ${c.k.map((k, ci) => `<tr><td>C${ci + 1} · ${esc(GENS[k]?.label || k)}</td><td></td><td></td><td></td><td></td></tr>`).join('')}</table>
    </div>
    <div class="ctl-qs">${qs.map((x, j) => {
      const first = j === 0 || qs[j - 1].ci !== x.ci;
      return `<section class="pq ctl-q">${first ? `<h3 class="ctl-ch">C${x.ci + 1} · ${esc(GENS[x.k].label)}</h3>` : ''}<div class="ctl-qb"><span class="ctl-num"><span class="qn">${j + 1}</span></span><div class="ctl-qt">${paperHTML(x.o.q)}</div></div></section>`;
    }).join('')}</div>
  </div>`;
}
/** Codes des copies qui dépassent une page A4 (mesure hors écran, largeur imprimable 190 mm) */
function ctlOverflow(c, only) {
  const box = document.createElement('div'); box.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden';
  box.innerHTML = '<div style="height:100mm;width:1px"></div>'; document.body.appendChild(box);
  const mm = box.firstElementChild.getBoundingClientRect().height / 100, over = [];
  (only || c.s.map((_, i) => i)).forEach((i) => { box.innerHTML = sheetHTML(c, i); box.firstElementChild.style.width = '190mm'; if (box.firstElementChild.getBoundingClientRect().height > 277 * mm) over.push(ctlCode(c.id, i + 1)); });
  box.remove(); return over;
}
/** Plan automatique : on ajoute des questions (compétences les moins fournies d'abord) tant que la durée visée
    n'est pas atteinte et que la page tient. Une copie qui déborde reçoit un autre tirage (salt). */
function ctlAutoPlan(c, target = 30) {
  const K = c.k, am = [], st = [];
  c.s.forEach(([, v], i) => (v === 'a' ? am : st).push(i));
  const idx = st.length ? st.slice(0, 3) : am.slice(0, 1);
  const p = { n: K.map(() => 1), a: null };
  const T = () => ctlMinutes(K, p);
  let salts = {};
  const cfg = () => ({ ...c, n: p.n, a: p.a, r: salts });
  const overIdx = (list) => ctlOverflow(cfg(), list).map((code) => parseInt(code.split('-')[1], 10) - 1);
  const fixCopies = (list, tries = 8) => {
    const bad = [];
    for (const i of overIdx(list)) {
      let ok = false;
      for (let sl = 1; sl <= tries && !ok; sl++) { salts[i + 1] = sl; ok = !overIdx([i]).length; }
      if (!ok) { delete salts[i + 1]; bad.push(i); }
    }
    return bad;
  };
  const fits = (list) => !fixCopies(list, 3).length;
  const full = new Set();
  const startOk = fits(idx);
  for (let g = 0; g < 60 && startOk && T() < target - 1; g++) {
    const cand = K.map((_, i) => i).filter((i) => !full.has(i) && p.n[i] < 6);
    if (!cand.length) break;
    const i = cand.reduce((a, b) => (p.n[b] < p.n[a] || (p.n[b] === p.n[a] && ctlT(K[b]) < ctlT(K[a])) ? b : a));
    if (T() + ctlT(K[i]) > target + 2 && T() >= target - 3) break;
    p.n[i]++;
    if (!fits(idx)) { p.n[i]--; full.add(i); }
  }
  for (let g = 0; g < 12 && st.length && fixCopies(st).length; g++) {
    const cand = K.map((_, i) => i).filter((i) => p.n[i] > 1);
    if (!cand.length) break;
    p.n[cand.reduce((a, b) => (p.n[b] > p.n[a] ? b : a))]--; salts = {};
  }
  let amOver = false;
  if (am.length) {
    p.a = K.map((k, i) => Math.max(1, p.n[i] - 1));
    for (let g = 0; g < 20 && fixCopies(am).length; g++) {
      const cand = K.map((_, i) => i).filter((i) => p.a[i] > 1);
      if (!cand.length) { amOver = true; break; }
      p.a[cand.reduce((a, b) => (p.a[b] > p.a[a] ? b : a))]--;
      am.forEach((i) => delete salts[i + 1]);
    }
    if (p.a.every((x, i) => x === Math.max(1, p.n[i] - 1))) p.a = null;
  }
  Object.keys(salts).forEach((nn) => { const keep = salts[nn]; delete salts[nn]; if (overIdx([Number(nn) - 1]).length) salts[nn] = keep; });
  p.r = salts;
  if (st.length && overIdx(st).length) return { p, tooMany: true };
  const t = T();
  return { p, short: t < target - 3, long: t > target + 5, amOver };
}
const PRINT_CSS = `@page { size: A4; margin: 7mm 10mm; } body.print-doc { background: #fff; margin: 0; } .ctl-sheet { page-break-after: always; break-after: page; }`;
function printSheets(c) {
  const bar = `<div class="no-print ctl-bar"><p id="ctl-fit" class="small">Vérification de la mise en page…</p><p><button type="button" class="btn primary" onclick="print()">🖨️ Imprimer</button> <span class="small muted">Recto seul, sans mise à l'échelle (100 %).</span></p></div>`;
  const w = printWindow(`Sujets ${c.id} — ${c.t}`, bar + c.s.map((_, i) => sheetHTML(c, i)).join(''), PRINT_CSS);
  if (!w) return;
  const go = () => {
    const probe = w.document.createElement('div'); probe.style.cssText = 'position:absolute;height:100mm;width:1px;visibility:hidden'; w.document.body.appendChild(probe);
    const mm = probe.getBoundingClientRect().height / 100; probe.remove();
    const over = [...w.document.querySelectorAll('.ctl-sheet')].filter((s) => s.getBoundingClientRect().height > 283 * mm).map((s) => s.dataset.code);
    const el = w.document.getElementById('ctl-fit'); if (!el) return;
    el.style.color = over.length ? '#9a5b00' : '#237a3b';
    el.textContent = over.length ? `⚠ ${over.length} copie(s) dépassent une page (${over.slice(0, 8).join(', ')}${over.length > 8 ? '…' : ''}) : enlève une question par compétence.` : `✔ ${c.s.length} copies, une page chacune.`;
  };
  if (w.document.readyState === 'complete') setTimeout(go, 400); else w.addEventListener('load', () => setTimeout(go, 400));
}

/* ---------- Corrigé du professeur, et fichier pour la correction assistée ---------- */
function printCorrige(c) {
  const parts = c.s.map(([name, ver], i) => {
    const n = i + 1, qs = ctlQuestions(c.id, n, ver, c.k, ctlPlan(c), ctlSalt(c, n));
    return `<section class="ctl-corr"><h3>${ctlCode(c.id, n)} — ${esc(name)}${ver === 'a' ? ' <span class="small muted">(aménagé)</span>' : ''}</h3><ol>${qs.map((x) => {
      const a = questionAnswer(x.o);
      return `<li><span class="small muted">C${x.ci + 1}</span> ${a.good ? `<b>${esc(a.good)}</b> — ` : ''}${String(a.msg).replace(/<table[\s\S]*?<\/table>/g, '')}</li>`;
    }).join('')}</ol></section>`;
  }).join('');
  printWindow(`Corrigé ${c.id}`, `<div class="no-print ctl-bar"><p><button type="button" class="btn primary" onclick="print()">🖨️ Imprimer le corrigé</button></p></div><h1>Corrigé — ${esc(c.t)}${c.c ? ` (${esc(c.c)})` : ''}</h1>${parts}`, '@page { size: A4; margin: 10mm; } .ctl-corr { break-inside: avoid; } body.print-doc { padding: 0 8mm; }');
}
function aiText(c) {
  const L = [];
  L.push(`CONTRÔLE ${c.id} — ${c.t} — ${c.c || ''} — ${new Date(c.d).toLocaleDateString('fr-FR')}`);
  L.push('Compétences : ' + c.k.map((k, i) => `C${i + 1} = ${GENS[k]?.label || k}`).join(' ; '));
  L.push('');
  L.push('CONSIGNES POUR LA CORRECTION');
  L.push('- Chaque copie porte un code (ex. ' + ctlCode(c.id, 1) + '). Les réponses sont écrites dans des cases ; les cases à cocher sont des ☐.');
  L.push('- Pour chaque question : 1 si la réponse est juste, 0 sinon.');
  L.push('- Niveau par compétence : tout juste = TB ; au moins 2/3 = MS ; au moins 1/3 = MF ; sinon MI.');
  L.push('  (2 questions : 2/2 = TB, 1/2 = MF, 0/2 = MI ; 1 question : juste = TB, faux = MI.) Le professeur peut ajuster.');
  L.push('- RÉPONDRE avec une ligne par copie, exactement sous cette forme :');
  const ps = ctlVer(ctlPlan(c), c.k, 's');
  L.push(`  ${ctlCode(c.id, 1)} ${c.k.map((k, i) => `C${i + 1}=TB(${'1'.repeat(ps.n[i])})`).join(' ')}`);
  L.push('  (un chiffre par question, dans l\'ordre des questions de la compétence ; la version aménagée a une question de moins par compétence)');
  { const n1 = ps.n[0], b = n1 > 1 ? '1'.repeat(n1 - 1) + '0' : '0';
    L.push(`  Ajouter « ? » après un niveau en cas de doute (ex. C1=${levelFromBits(b)}?(${b})), et une courte remarque après « // » si utile.`); }
  L.push('');
  c.s.forEach(([, ver], i) => {
    const n = i + 1, qs = ctlQuestions(c.id, n, ver, c.k, ctlPlan(c), ctlSalt(c, n));
    L.push(`=== ${ctlCode(c.id, n)} (version ${ver === 'a' ? 'aménagée' : 'standard'}) ===`);
    qs.forEach((x, j) => {
      const a = questionAnswer(x.o);
      L.push(`${j + 1}. [C${x.ci + 1}] Énoncé : ${plain(paperHTML(x.o.q))}`);
      L.push(`   Attendu : ${a.good ? a.good + ' — ' : ''}${plain(a.msg, true)}`);
    });
    L.push('');
  });
  return L.join('\n');
}
function download(name, text, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- Résultats collés et étiquettes ---------- */
function parseCtlResults(text, c) {
  const res = {};
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.toUpperCase().match(/\b([0-9A-Z]{3})\s*-\s*(\d{1,2})\b/);
    if (!m || m[1] !== c.id) continue;
    const n = Number(m[2]); if (n < 1 || n > c.s.length) continue;
    const r = res[n] = res[n] || { lv: [], bits: [], doubt: [], note: '' };
    const body = line.slice(line.toUpperCase().indexOf(m[0]) + m[0].length);
    const [main, note] = body.split('//');
    for (const x of main.toUpperCase().matchAll(/C\s*(\d+)\s*=\s*(TB|MS|MF|MI)?\s*(\?)?\s*(?:\(\s*([01\s]+)\s*\))?/g)) {
      const ci = Number(x[1]) - 1; if (ci < 0 || ci >= c.k.length) continue;
      const bits = (x[4] || '').replace(/\s/g, '');
      r.bits[ci] = bits; r.lv[ci] = x[2] || levelFromBits(bits); r.doubt[ci] = !!x[3];
    }
    if (note) r.note = note.trim();
  }
  return res;
}
function retourURL(c, n, levels, bits) {
  const ver = c.s[n - 1][1];
  const plan = ctlPlan(c), pv = ctlVer(plan, c.k, ver);
  const allBits = c.k.map((k, i) => { const b = bits[i] || ''; const want = pv.n[i]; return b.length === want ? b : '-'.repeat(want); }).join('');
  const cl = encodeURIComponent(c.c || '').replace(/\./g, '%2E');
  return siteURL() + `#/r/2.${c.id}.${n}.${ver}${ctlSalt(c, n) || ''}.${planStr(plan)}.${c.k.join('+')}.${levels.map((l) => LV1[l] || '-').join('')}.${/[01]/.test(allBits) ? allBits : '-'}.${cl}`;
}
function printLabels(c, rows, skip) {
  const W = 63.5, H = 38.1, TOP = 15.15, LEFT = 7.21, GAP = 2.54, PER = 21;
  const cells = [...Array(skip).fill(null), ...rows];
  const pages = [];
  for (let p = 0; p * PER < cells.length; p++) pages.push(cells.slice(p * PER, (p + 1) * PER));
  const body = `<div class="no-print ctl-bar"><p><button type="button" class="btn primary" onclick="print()">🖨️ Imprimer les étiquettes</button></p>
    <p class="small">Planche A4 de 21 étiquettes (3 × 7, 63,5 × 38,1 mm, type L7160). Dans la fenêtre d'impression : <b>marges : aucune</b>, <b>échelle : 100 %</b>. Fais d'abord un essai sur une feuille blanche, posée sur la planche, à contre-jour.</p></div>`
    + pages.map((pg) => `<div class="lbl-page">${pg.map((r, i) => {
      const x = LEFT + (i % 3) * (W + GAP), y = TOP + Math.floor(i / 3) * H;
      if (!r) return '';
      const url = retourURL(c, r.n, r.lv, r.bits);
      return `<div class="lbl" style="left:${x}mm;top:${y}mm;width:${W}mm;height:${H}mm">${qrSVG(url, 'L')}<div class="lbl-txt"><b>${esc(r.name)}</b><span>${ctlCode(c.id, r.n)}</span><span class="lbl-lv">${r.lv.map((l, ci) => `C${ci + 1} ${l}`).join(' · ')}</span><span class="lbl-hint">📱 Scanne-moi : ton corrigé et tes exercices</span></div></div>`;
    }).join('')}</div>`).join('');
  printWindow(`Étiquettes ${c.id}`, body, `@page { size: A4; margin: 0; } body.print-doc { margin: 0; background: #fff; }`);
}

/* ---------- Espace professeur : la carte « Contrôle sur papier » ---------- */
function setupControles() {
  const host = document.getElementById('p5-controles');
  if (!host || host.dataset.ready) return;
  host.dataset.ready = '1';
  const comps = CHAPTERS.map((ch) => {
    const ks = Object.keys(GENS).filter((k) => GENS[k].ch === ch.id && !isBoard(k));
    return ks.length ? `<details class="ctl-ch-d"${ch.num >= 4 ? ' open' : ''}><summary><b>Chapitre ${ch.num} · ${esc(ch.title)}</b></summary><div class="ctl-checks">${ks.map((k) => `<label><input type="checkbox" class="ctl-comp" value="${k}"> ${esc(GENS[k].label)}</label>`).join('')}</div></details>` : '';
  }).join('');
  host.innerHTML = `<div class="card" id="ctl-card">
    <h2>📝 Contrôle sur papier, par compétences</h2>
    <p class="small">Chaque compétence = un type d'exercice du site. Chaque élève reçoit <b>son propre sujet</b> (mêmes exercices que sur le site, nombres différents), avec son prénom sur une bande à détacher, un <b>code anonyme</b> et un QR code. Après correction, tu imprimes une étiquette QR par élève : elle ouvre son bilan, son corrigé et des exercices.</p>
    <h3>1. Compétences évaluées</h3>
    <div id="ctl-comps">${comps}</div>
    <p id="ctl-sel" class="small"></p>
    <h3>2. Classe et élèves</h3>
    <div class="prof-opts">
      <span><label for="ctl-title"><b>Titre :</b></label> <input type="text" id="ctl-title" maxlength="60" placeholder="Évaluation — Proportionnalité"></span>
      <span><label for="ctl-classe"><b>Classe :</b></label> <input type="text" id="ctl-classe" list="ctl-classes" maxlength="30" placeholder="5e B"><datalist id="ctl-classes"></datalist></span>
      <span><label for="ctl-q"><b>Durée :</b></label> <select id="ctl-q"><option value="a30" selected>≈ 30 min (automatique)</option><option value="a20">≈ 20 min (automatique)</option><option value="a45">≈ 45 min (automatique)</option><option value="1">1 question par compétence</option><option value="2">2 questions par compétence</option><option value="3">3 questions par compétence</option></select></span>
    </div>
    <label for="ctl-names"><b>Élèves</b> (un prénom par ligne) :</label>
    <textarea id="ctl-names" rows="5" placeholder="Léa M.&#10;Tom B.&#10;…"></textarea>
    <div id="ctl-students"></div>
    <div class="prof-row">
      <button type="button" class="btn primary" id="ctl-make">🧮 Préparer le contrôle</button>
      <button type="button" class="btn" id="ctl-corr" disabled>📄 Corrigé</button>
      <button type="button" class="btn" id="ctl-ai" disabled>🤖 Fichier pour la correction assistée</button>
    </div>
    <p id="ctl-status" class="small"></p>
    <div id="ctl-plan"></div>
    <p class="small muted">Adresse inscrite dans les QR codes : <code id="ctl-url"></code> (vérifie que c'est bien l'adresse de ton site, sinon ouvre cette page depuis la bonne adresse avant d'imprimer les étiquettes).</p>
    <details class="howto small"><summary>Comment corriger avec l'IA</summary><ol class="steps-form">
      <li>Avant de scanner, détache (ou replie) les bandes avec les prénoms : les copies ne portent plus que leur code.</li>
      <li>Scanne la pile avec ton téléphone (un seul PDF) et envoie-le à Claude avec le <b>fichier pour la correction assistée</b>.</li>
      <li>Claude répond une ligne par copie (<code>ABC-07 C1=TB(111) C2=MS(110)…</code>) : colle-la plus bas, vérifie, puis imprime les étiquettes.</li>
    </ol><p>Les copies scannées sont anonymes. Fais valider cet usage par ton établissement.</p></details>
    <h3>3. Après la correction : étiquettes QR</h3>
    <div class="prof-opts">
      <span><label for="ctl-pick"><b>Contrôle :</b></label> <select id="ctl-pick"></select></span>
      <span><label for="ctl-skip"><b>Commencer à l'étiquette n°</b></label> <select id="ctl-skip">${Array.from({ length: 21 }, (_, i) => `<option value="${i}">${i + 1}</option>`).join('')}</select></span>
    </div>
    <label for="ctl-res"><b>Résultats</b> (colle la réponse de Claude, ou tape : <code>CODE C1=TB C2=MF…</code>) :</label>
    <textarea id="ctl-res" rows="4"></textarea>
    <div id="ctl-table"></div>
  </div>`;
  const $ = (id) => document.getElementById(id);
  $('ctl-url').textContent = siteURL();
  const sel = () => [...host.querySelectorAll('.ctl-comp:checked')].map((i) => i.value);
  const fillClasses = () => { let cl = []; try { cl = JSON.parse(localStorage.getItem(CTL_CLASSES) || '[]'); } catch (e) { cl = []; } $('ctl-classes').innerHTML = cl.map((c) => `<option value="${esc(c)}">`).join(''); };
  const rememberClass = (c) => { if (!c) return; let cl = []; try { cl = JSON.parse(localStorage.getItem(CTL_CLASSES) || '[]'); } catch (e) { cl = []; } if (!cl.includes(c)) { cl.push(c); try { localStorage.setItem(CTL_CLASSES, JSON.stringify(cl)); } catch (e) { /* rien */ } fillClasses(); } };
  fillClasses();
  const loadNames = () => { let r = ''; try { r = localStorage.getItem(ROSTER_KEY($('ctl-classe').value)) || ''; } catch (e) { /* rien */ } if (r && !$('ctl-names').value.trim()) $('ctl-names').value = r; drawStudents(); };
  $('ctl-classe').addEventListener('change', () => { $('ctl-names').value = ''; loadNames(); });
  const names = () => [...new Set($('ctl-names').value.split(/\n+/).map((x) => x.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  function drawStudents() {
    const ns = names(), am = new Set(amenGet($('ctl-classe').value));
    $('ctl-students').innerHTML = ns.length ? `<p class="small"><b>${ns.length} élève${ns.length > 1 ? 's' : ''}</b> — coche la version aménagée (une question de moins par compétence) pour ceux qui en ont besoin :</p><div class="ctl-studs">${ns.map((n) => `<label><input type="checkbox" data-n="${esc(n)}"${am.has(normName(n)) ? ' checked' : ''}> ${esc(n)}</label>`).join('')}</div>` : '';
  }
  $('ctl-names').addEventListener('change', () => { try { localStorage.setItem(ROSTER_KEY($('ctl-classe').value), $('ctl-names').value); } catch (e) { /* rien */ } drawStudents(); });
  $('ctl-students').addEventListener('change', () => amenSet($('ctl-classe').value, [...$('ctl-students').querySelectorAll('input:checked')].map((i) => normName(i.dataset.n))));
  const showSel = () => { const ks = sel(); $('ctl-sel').innerHTML = ks.length ? `Compétences : ${ks.map((k, i) => `<b>C${i + 1}</b> ${esc(GENS[k].label)}`).join(' · ')}` : '<span class="warn-t">Coche au moins une compétence.</span>'; };
  $('ctl-comps').addEventListener('change', showSel); showSel();
  loadNames();
  let last = null;
  const status = (cls, html) => { $('ctl-status').className = 'small ' + cls; $('ctl-status').innerHTML = html; };
  function create(c) {
    ctlSave(c); last = c; rememberClass(c.c);
    printSheets(c);
    $('ctl-corr').disabled = false; $('ctl-ai').disabled = false;
    status('ok-t', `✔ Contrôle <b>${c.id}</b> créé (${c.s.length} copies, codes ${ctlCode(c.id, 1)} à ${ctlCode(c.id, c.s.length)}). Il est enregistré sur cet appareil.`);
    fillPick(c.id);
  }
  let prep = null;
  const planBox = $('ctl-plan');
  const invalidate = () => { if (prep) { prep = null; planBox.innerHTML = ''; status('', 'Liste ou compétences modifiées : clique à nouveau sur « Préparer le contrôle ».'); } };
  ['ctl-names', 'ctl-students', 'ctl-classe', 'ctl-q', 'ctl-title'].forEach((id) => $(id).addEventListener('change', invalidate));
  $('ctl-comps').addEventListener('change', invalidate);
  function drawPlan(msg = '') {
    const { c, p } = prep, K = c.k;
    const T = ctlMinutes(K, p), pa = ctlVer(p, K, 'a'), hasA = c.s.some(([, v]) => v === 'a');
    const nq = (pp) => pp.n.reduce((a, b) => a + b, 0);
    planBox.innerHTML = `<div class="ctl-plan"><table class="voc"><thead><tr><th>Compétence</th><th>Questions</th><th>≈ min</th>${hasA ? '<th>Version aménagée</th>' : ''}</tr></thead><tbody>${K.map((k, i) => `<tr><td><b>C${i + 1}</b> ${esc(GENS[k]?.label || k)}</td>
        <td><button type="button" class="mini" data-d="-1" data-i="${i}" aria-label="Une question de moins">−</button> <b>${p.n[i]}</b> <button type="button" class="mini" data-d="1" data-i="${i}" aria-label="Une question de plus">+</button></td>
        <td>${fmt(Math.round(ctlT(k) * p.n[i] * 2) / 2)}</td>${hasA ? `<td>${pa.n[i]}</td>` : ''}</tr>`).join('')}</tbody></table>
      <p><b>Durée estimée : ≈ ${Math.round(T)} min</b> (${nq(p)} questions)${hasA ? ` · version aménagée : ${nq(pa)} questions` : ''}. <span class="small muted">Temps estimés : à ajuster après un premier contrôle.</span></p>
      ${msg ? `<p class="small">${msg}</p>` : ''}
      <p><button type="button" class="btn primary" id="ctl-print">🖨️ Imprimer les sujets</button> <span class="small muted">${c.s.length} copies · contrôle ${c.id}</span></p></div>`;
    planBox.querySelectorAll('button[data-i]').forEach((bt) => bt.addEventListener('click', () => {
      const i = Number(bt.dataset.i), d = Number(bt.dataset.d);
      p.n[i] = Math.min(6, Math.max(1, p.n[i] + d)); p.a = null; p.r = {};
      drawPlan();
    }));
    $('ctl-print').addEventListener('click', () => {
      const cc = { ...c, n: [...p.n], a: p.a ? [...p.a] : null, r: { ...(p.r || {}) } };
      const over = ctlOverflow(cc);
      if (!over.length) { create(cc); return; }
      drawPlan(`<span class="warn-t">⚠ ${over.length} copie${over.length > 1 ? 's' : ''} sur ${cc.s.length} dépasse${over.length > 1 ? 'nt' : ''} une page (${over.slice(0, 6).join(', ')}${over.length > 6 ? '…' : ''}) : enlève une question (−), ou</span> <button type="button" class="mini" id="ctl-force">imprime quand même</button>`);
      $('ctl-force').addEventListener('click', () => create(cc));
    });
  }
  $('ctl-make').addEventListener('click', () => {
    const ks = sel(), ns = names();
    if (!ks.length) { status('ko-t', 'Coche au moins une compétence.'); return; }
    if (!ns.length) { status('ko-t', 'Colle la liste des élèves.'); $('ctl-names').focus(); return; }
    try { localStorage.setItem(ROSTER_KEY($('ctl-classe').value), $('ctl-names').value); } catch (e) { /* rien */ }
    const am = new Set(amenGet($('ctl-classe').value));
    const c = { id: newCtlId(), t: $('ctl-title').value.trim() || 'Évaluation', c: $('ctl-classe').value.trim(), d: Date.now(), k: ks, s: ns.map((n) => [n, am.has(normName(n)) ? 'a' : 's']) };
    const mode = $('ctl-q').value;
    status('', '🧮 Calcul du contrôle (mise en page de chaque copie)…'); planBox.innerHTML = '';
    setTimeout(() => {
      let p, msg = '';
      if (mode.startsWith('a')) {
        const r = ctlAutoPlan(c, Number(mode.slice(1)));
        p = r.p;
        if (r.tooMany) msg = '<span class="warn-t">⚠ Même avec une seule question par compétence, la page déborde : enlève une compétence.</span>';
        else if (r.short) msg = `<span class="warn-t">La page est pleine à ≈ ${Math.round(ctlMinutes(c.k, p))} min.</span> Pour aller jusqu'à ${mode.slice(1)} min : ajoute une compétence.`;
        else if (r.long) msg = '<span class="warn-t">Ces compétences demandent déjà plus de temps que prévu, même avec une seule question chacune.</span>';
        if (r.amOver) msg += ' <span class="warn-t">La version aménagée dépasse une page même avec une question par compétence : enlève une compétence.</span>';
      } else p = { n: ks.map(() => Number(mode)), a: null };
      prep = { c, p };
      status('ok-t', `Contrôle ${c.id} préparé. Vérifie la durée, ajuste si besoin avec − et +, puis imprime.`);
      drawPlan(msg);
    }, 30);
  });
  $('ctl-corr').addEventListener('click', () => { if (last) printCorrige(last); });
  $('ctl-ai').addEventListener('click', () => { if (last) download(`controle-${last.id}-correction.txt`, aiText(last)); });
  function fillPick(id) {
    const all = ctlAll();
    $('ctl-pick').innerHTML = all.length ? all.map((c) => `<option value="${c.id}"${c.id === id ? ' selected' : ''}>${c.id} · ${esc(c.t)} · ${esc(c.c || '')} · ${new Date(c.d).toLocaleDateString('fr-FR')}</option>`).join('') : '<option value="">(aucun contrôle sur cet appareil)</option>';
    drawTable();
  }
  let edits = {};
  function drawTable() {
    const c = ctlFind($('ctl-pick').value); const tb = $('ctl-table');
    if (!c) { tb.innerHTML = ''; return; }
    const res = parseCtlResults($('ctl-res').value, c);
    const rows = c.s.map(([name, ver], i) => {
      const n = i + 1, r = res[n] || { lv: [], bits: [], doubt: [] }, e = edits[c.id + n] || {};
      return { n, name, ver, lv: c.k.map((_, ci) => e[ci] || r.lv[ci] || ''), bits: r.bits, doubt: r.doubt, note: r.note };
    });
    const done = rows.filter((r) => r.lv.every(Boolean));
    tb.innerHTML = `<div class="table-wrap"><table class="voc res-tab ctl-res"><thead><tr><th>Élève</th><th>Code</th>${c.k.map((k, i) => `<th title="${esc(GENS[k]?.label || k)}">C${i + 1}</th>`).join('')}<th>Remarque</th></tr></thead><tbody>${rows.map((r) => `<tr><td><b>${esc(r.name)}</b>${r.ver === 'a' ? ' <span class="small muted">(am.)</span>' : ''}</td><td>${ctlCode(c.id, r.n)}</td>${r.lv.map((l, ci) => `<td${r.doubt[ci] ? ' class="doubt"' : ''}><select data-n="${r.n}" data-ci="${ci}" class="lv-${l}" aria-label="Niveau de ${esc(r.name)}, compétence ${ci + 1}"><option value="">—</option>${LEVELS.map((x) => `<option${x === l ? ' selected' : ''}>${x}</option>`).join('')}</select></td>`).join('')}<td class="small">${esc(r.note || '')}</td></tr>`).join('')}</tbody></table></div>
      <p class="small muted">Cases orangées : doute, vérifie la copie. Tu peux changer chaque niveau.</p>
      <p><button type="button" class="btn primary" id="ctl-print-lbl"${done.length ? '' : ' disabled'}>🏷️ Imprimer ${done.length} étiquette${done.length > 1 ? 's' : ''}</button> <button type="button" class="btn" id="ctl-copy">Copier le tableau</button> <span class="small muted">Seuls les élèves dont toutes les compétences ont un niveau ont une étiquette.</span></p>`;
    tb.querySelectorAll('select').forEach((s) => s.addEventListener('change', () => { const k = c.id + s.dataset.n; edits[k] = edits[k] || {}; edits[k][s.dataset.ci] = s.value; drawTable(); }));
    $('ctl-print-lbl')?.addEventListener('click', () => printLabels(c, done, Number($('ctl-skip').value)));
    $('ctl-copy').addEventListener('click', async (ev) => {
      const tsv = [['Élève', 'Code', ...c.k.map((k, i) => `C${i + 1} ${GENS[k]?.label || k}`)].join('\t'), ...rows.map((r) => [r.name, ctlCode(c.id, r.n), ...r.lv].join('\t'))].join('\n');
      try { await navigator.clipboard.writeText(tsv); ev.target.textContent = '✔ Copié'; } catch (_) { ev.target.textContent = 'Copie impossible'; }
    });
  }
  $('ctl-pick').addEventListener('change', () => { edits = {}; drawTable(); });
  $('ctl-res').addEventListener('input', drawTable);
  fillPick(ctlAll()[0]?.id);
}
document.addEventListener('DOMContentLoaded', () => { try { if (profOpen()) setupControles(); } catch (e) { /* rien */ } });

/* ---------- Page « Mon contrôle » : #/r/2.ID.n.ver.plan.clés.niveaux.réponses.classe ---------- */
let retourSpec = null, retourCh = '';
const pageOfGen = (k) => { const pg = document.querySelector(`.page [data-gen="${k}"]`)?.closest('.page'); return pg ? `#/${pg.dataset.ch}/${pg.dataset.p}` : ''; };
function routeRetour(spec) {
  const page = document.querySelector('.page[data-p="retour"]'), host = page.querySelector('.retour');
  if (spec === retourSpec) return retourCh;
  retourSpec = spec; retourCh = '';
  const [main] = spec.split('/');
  const [v, id, nS, verS, qS, ksS, lvS, bitsS] = main.split('.');
  const ver = (verS || 's')[0], salt = parseInt((verS || '').slice(1), 10) || 0;
  const keys = (ksS || '').split('+'), n = parseInt(nS, 10);
  const plan = v === '1' ? ctlPlan({ k: keys, q: parseInt(qS, 10) }) : v === '2' ? planParse(qS) : null;
  if (!plan || plan.n.length !== keys.length || !/^[0-9A-Z]{3}$/.test(id || '') || !n || !keys.length) {
    host.innerHTML = '<h1>Lien illisible</h1><p class="lead">Ce QR code n\'a pas pu être lu en entier. Réessaie de le scanner, bien à plat et bien éclairé.</p><p><a class="btn" href="#/">Accueil du site</a></p>';
    return '';
  }
  const levels = keys.map((_, i) => LV1R[(lvS || '')[i]] || '');
  const qs = ctlQuestions(id, n, ver === 'a' ? 'a' : 's', keys, plan, salt);
  const counts = ctlVer(plan, keys, ver === 'a' ? 'a' : 's').n, starts = counts.map((_, i) => counts.slice(0, i).reduce((a, b) => a + b, 0));
  const bitOf = (x) => ((bitsS || '').length === qs.length ? bitsS[starts[x.ci] + x.m] || '-' : '-');
  const tone = { TB: 'ok', MS: 'ok2', MF: 'mid', MI: 'ko' };
  host.innerHTML = `<div class="hero"><p class="kicker">Mon contrôle · ${ctlCode(id, n)}</p><h1>Ton corrigé et tes exercices</h1>
    <p class="lead">Regarde d'abord ton bilan, puis refais les exercices proposés : c'est comme ça qu'une compétence fragile devient acquise.</p></div>
    <div class="card"><h2>Ton bilan</h2><ul class="ctl-bilan">${keys.map((k, i) => {
      const l = levels[i], lab = GENS[k]?.label || 'Notion inconnue';
      const link = GENS[k] ? pageOfGen(k) : '';
      const act = !GENS[k] || !l ? '' : l === 'TB' ? '<span class="ok-t">✔ Bravo !</span>' : link ? `<a class="btn${l === 'MS' ? '' : ' primary'}" href="${link}">${l === 'MS' ? '💪 Je m\'entraîne encore' : '🔁 Je refais ces exercices'}</a>` : '<span class="small muted">Les exercices arrivent bientôt.</span>';
      return `<li><span class="lv lv-${tone[l] || 'none'}">${l || '?'}</span> <b>${esc(lab)}</b> <span class="small muted">${l ? LEVEL_TXT[l] : ''}</span> ${act}</li>`;
    }).join('')}</ul>
    <p class="small muted">Les exercices sont sur ce site : fais-les jusqu'à réussir sans indice, ton bilan s'améliorera.</p></div>
    <div class="card"><h2>Le corrigé de ton sujet</h2><div class="ctl-ret"></div></div>`;
  const list = host.querySelector('.ctl-ret');
  qs.forEach((x, j) => {
    const sec = document.createElement('section'); sec.className = 'ctl-rq';
    const b = bitOf(x);
    sec.innerHTML = `<h3><span class="qn">${j + 1}</span> <span class="small muted">${esc(GENS[x.k].label)}</span> ${b === '1' ? '<span class="ok-t">✔ juste</span>' : b === '0' ? '<span class="ko-t">✘ à revoir</span>' : ''}</h3><div class="ex-q"></div><div class="ex-fb ok"></div>`;
    list.appendChild(sec);
    const qd = sec.querySelector('.ex-q'), fb = sec.querySelector('.ex-fb');
    qd.innerHTML = x.o.q;
    let res = { msg: '' };
    try { res = revealAnswer(x.o, qd) || res; } catch (e) { /* rien */ }
    qd.querySelectorAll('input, button').forEach((i) => { i.disabled = true; });
    fb.innerHTML = res.msg ? '<strong>Correction :</strong> ' + res.msg : '';
    if (!fb.innerHTML) fb.remove();
  });
  retourCh = GENS[keys.find((k) => GENS[k])]?.ch || '';
  return retourCh;
}
