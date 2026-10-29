'use strict';

/* =========================================================
   Outils
   ========================================================= */
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const eq = (a, b) => Math.abs(a - b) < 1e-9;

/** Écriture décimale à la française : 2.5 -> "2,5", -1 -> "−1" */
function fmt(x) {
  const r = Math.round(x * 1000) / 1000;
  return String(r).replace('.', ',').replace('-', '−');
}

/** Fraction affichée (HTML) */
function F(n, d) {
  if (typeof n === 'number' && n < 0) return '−' + F(-n, d);
  return `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
}

/** Fraction simplifiée (ou entier si le dénominateur devient 1) */
function Fs(n, d) {
  const g = gcd(n, d) || 1;
  const a = n / g, b = d / g;
  return b === 1 ? fmt(a) : F(a, b);
}

/** Chaîne d'égalités : 10/4 = 5/2 = 2,5 */
function chain(n, d) {
  const parts = [F(n, d)];
  const g = gcd(n, d);
  if (g > 1 && d / g !== 1) parts.push(Fs(n, d));
  parts.push(fmt(n / d));
  return parts.join(' = ');
}

/** Lit une réponse : "7/3", "2,5", "-0.75", "4" */
function parse(str) {
  if (str == null) return null;
  const s = String(str).trim().replace(/\s+/g, '').replace(/,/g, '.').replace(/[−–]/g, '-').replace(/[÷:]/g, '/');
  if (!s) return null;
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) {
    const n = Number(m[1]), d = Number(m[2]);
    if (d === 0) return null;
    return { value: n / d, n, d, isFrac: true };
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return { value: Number(s), isFrac: false };
  return null;
}

/** Champ de réponse */
function inp(kind = 'frac', label = 'Réponse') {
  const mode = kind === 'num' ? 'decimal' : 'text';
  return `<input class="ans ${kind}" type="text" inputmode="${mode}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${label}">`;
}
const val = (root, i = 0) => parse(root.querySelectorAll('.ans')[i]?.value);
const markInput = (root, i, ok) => root.querySelectorAll('.ans')[i]?.classList.add(ok ? 'right' : 'wrong');

/* ---------- Aides didactiques communes ---------- */
const ficheLink = (ch, t = 'la fiche') => `<a href="#/${ch}/fiche">${t}</a>`;
/** Colore l'unité de la droite graduée et numérote ses parts (outil, sans donner la réponse) */
function unitOverlay(r, L) {
  const svg = r.querySelector('.nl-svg'); if (!svg) return;
  const W = 720, m = 34, y = 58, sc = (W - 2 * m) / (L.max - L.min), X = (v) => m + (v - L.min) * sc;
  let o = `<rect x="${X(0)}" y="${y - 24}" width="${X(1) - X(0)}" height="48" class="u-zone"/>`;
  for (let k = 1; k <= L.den; k++) o += `<text x="${X((k - 0.5) / L.den)}" y="${y - 28}" class="u-num">${k}</text>`;
  svg.insertAdjacentHTML('beforeend', o);
}
/* =========================================================
   Droite graduée (SVG)
   ========================================================= */
function drawLine({ min, max, den, points = [], clickable = false }) {
  const W = 720, H = 120, m = 34, y = 58;
  const sc = (W - 2 * m) / (max - min);
  const X = (v) => m + (v - min) * sc;
  let s = `<svg class="nl-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Droite graduée de ${fmt(min)} à ${fmt(max)}, unité partagée en ${den}">`;
  s += `<line x1="${m - 18}" y1="${y}" x2="${W - m + 18}" y2="${y}" class="axis"/>`;
  s += `<path d="M${W - m + 22} ${y} l-10 -6 v12 z" class="arrow"/>`;
  for (let i = Math.round(min * den); i <= Math.round(max * den); i++) {
    const v = i / den, x = X(v).toFixed(1), major = i % den === 0;
    s += `<line x1="${x}" y1="${y - (major ? 15 : 9)}" x2="${x}" y2="${y + (major ? 15 : 9)}" class="tk${major ? ' major' : ''}"/>`;
    if (major) s += `<text x="${x}" y="${y + 44}" class="lbl">${fmt(v)}</text>`;
    if (clickable) {
      const w = sc / den;
      s += `<circle cx="${x}" cy="${y}" r="10" class="mark" data-i="${i}"/>`;
      s += `<rect x="${(X(v) - w / 2).toFixed(1)}" y="${y - 40}" width="${w.toFixed(1)}" height="80" class="hit" data-i="${i}"/>`;
    }
  }
  points.forEach((p) => {
    const x = X(p.v).toFixed(1);
    s += `<circle cx="${x}" cy="${y}" r="8" class="pt"/><text x="${x}" y="${y - 24}" class="pt-lbl">${p.label}</text>`;
  });
  return s + '</svg>';
}

const LINES = [
  { min: -2, max: 3, den: 4, w: 6 },  // quarts
  { min: -2, max: 3, den: 2, w: 2 },  // demis
  { min: 0, max: 2, den: 10, w: 2 },  // dixièmes
];
function pickLine() {
  const bag = [];
  LINES.forEach((l) => { for (let k = 0; k < l.w; k++) bag.push(l); });
  const { min, max, den } = pick(bag);
  return { min, max, den };
}
function pickTick(L) {
  let i;
  do { i = rand(L.min * L.den, L.max * L.den); } while (i % L.den === 0 && Math.random() < 0.9);
  return i;
}

/* =========================================================
   Générateurs d'exercices
   Chaque générateur renvoie { q, check(questionEl), mount?(questionEl) }
   check renvoie null (réponse incomplète), {retry, msg} ou {ok, msg}
   ========================================================= */

// 1. Tables
function genTables() {
  const a = rand(2, 10), b = rand(2, 10), t = rand(0, 2);
  let q, ans;
  if (t === 0) { q = `${a} × ${b} = ${inp('num')}`; ans = a * b; }
  else if (t === 1) { q = `${a} × ${inp('num')} = ${a * b}`; ans = b; }
  else { q = `${a * b} ÷ ${a} = ${inp('num')}`; ans = b; }
  const ex = pick([[7, 8], [6, 7], [8, 9], [7, 9], [6, 8], [8, 7]].filter(([x, y]) => !(x === a && y === b) && !(x === b && y === a)));
  const hints = [
    t === 2 ? `Une division, c'est une multiplication à trou : ${a} × … = ${a * b}. Quelle table peux-tu réciter ?`
      : t === 1 ? `Dans quelle table de multiplication peux-tu chercher ${a * b} ?`
        : 'Pars d\'un résultat que tu connais par cœur (× 2, × 5 ou × 10), puis avance ou recule dans la table.',
    `Exemple : pour ${ex[0]} × ${ex[1]}, je sais que ${ex[0]} × 10 = ${ex[0] * 10}. J'enlève ${10 - ex[1]} fois ${ex[0]} : ${ex[0] * 10} − ${ex[0] * (10 - ex[1])} = ${ex[0] * ex[1]}.`,
  ];
  return {
    hints,
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, ans)) return null;
      if (t === 0 && eq(x.value, a + b)) return 'Tu as additionné les deux nombres. Regarde le signe : c\'est une multiplication.';
      if (t > 0 && Number.isInteger(x.value) && x.value > 0) return `Vérifie ta réponse : ${a} × ${x.value} = ${a * x.value}. Est-ce bien ${a * b} ?`;
      if (t === 0 && x.value % a === 0 && Math.abs(x.value - ans) === a) return `Tu n'es pas loin ! Récite la table de ${a} pour vérifier.`;
      return null;
    },
    q: `<p class="big">${q}</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      const ok = eq(x.value, ans);
      markInput(r, 0, ok);
      return { ok, msg: ok ? `${a} × ${b} = ${a * b}.` : `${a} × ${b} = ${a * b}, donc la bonne réponse est <b>${ans}</b>.` };
    },
  };
}

// 2. Fractions usuelles <-> décimaux
const USUELLES = [[1, 2], [1, 4], [3, 4], [3, 2], [4, 2], [5, 2], [1, 10], [100, 100], [7, 1],
  [1, 5], [2, 5], [3, 10], [7, 10], [1, 100], [5, 4], [9, 4], [7, 2], [6, 3], [9, 10]];
function genDecimal() {
  const [n, d] = pick(USUELLES), v = n / d;
  const why = d === 1 ? `Diviser par 1 ne change rien : ${F(n, d)} = ${n}.` : `${F(n, d)} = ${n} ÷ ${d} = ${fmt(v)}.`;
  const known = { 2: `${F(1, 2)} = 0,5 (un demi).`, 4: `${F(1, 4)} = 0,25 (un quart).`, 10: `${F(1, 10)} = 0,1 (un dixième).`, 5: `${F(1, 5)} = 0,2 (un cinquième).`, 100: `${F(1, 100)} = 0,01 (un centième).`, 1: 'Diviser par 1 ne change pas le nombre.', 3: 'Pense à la table de 3.' }[d];
  if (Math.random() < 0.6) {
    return {
      hints: [
        `Que veut dire la barre de fraction ? Relis « Écritures décimales à connaître » dans ${ficheLink('fractions')}.`,
        decExample(n, d),
        `Outil — les fractions de référence : ${memoFractions(n, d)}`,
      ],
      remediate(r) {
        const x = val(r); if (!x || x.isFrac || eq(x.value, v)) return null;
        if (eq(x.value, Number(`${n}.${d}`))) return `Attention : ${F(n, d)} ne s'écrit pas ${n},${d} ! La barre de fraction ne se remplace pas par une virgule : elle veut dire « divisé par ».`;
        if (n !== d && eq(x.value, d / n)) return `Tu as divisé ${d} par ${n}. Dans une fraction, c'est le numérateur (en haut) qui est divisé par le dénominateur (en bas).`;
        return null;
      },
      q: `<p class="big">${F(n, d)} = ${inp('num')}</p><p class="hint">Donne l'écriture décimale.</p>`,
      check(r) {
        const x = val(r); if (!x) return null;
        if (x.isFrac) return { retry: true, msg: 'On attend une écriture décimale, par exemple 0,5 ou 2.' };
        const ok = eq(x.value, v); markInput(r, 0, ok);
        return { ok, msg: why };
      },
    };
  }
  return {
    hints: [
      `Comment se lit ${fmt(v)} ? Par exemple, ${eq(v, 0.7) ? '0,9 se lit « 9 dixièmes »' : '0,7 se lit « 7 dixièmes »'}.`,
      eq(v, 1.5) ? `Exemple : 2,5 = 25 dixièmes = ${F(25, 10)}, que l'on peut simplifier en ${F(5, 2)}.` : `Exemple : 1,5 = 15 dixièmes = ${F(15, 10)}, que l'on peut simplifier en ${F(3, 2)}.`,
      'Outil : place le nombre dans un tableau unités | dixièmes | centièmes. Le rang du dernier chiffre donne le dénominateur (10 ou 100).',
    ],
    remediate(r) {
      const x = val(r); if (!x || !x.isFrac || eq(x.value, v)) return null;
      const parts = fmt(v).split(',');
      if (parts.length === 2 && x.n === Number(parts[0]) && x.d === Number(parts[1])) return `${fmt(v)} n'est pas ${F(x.n, x.d)} : la virgule n'est pas une barre de fraction ! Combien de dixièmes (ou de centièmes) y a-t-il dans ${fmt(v)} ?`;
      if (eq(x.value, v / 10) || eq(x.value, v * 10)) return 'Attention au rang des chiffres : est-ce des dixièmes (dénominateur 10) ou des centièmes (dénominateur 100) ?';
      if (eq(x.value, 1 / v)) return 'Ta fraction est à l\'envers : vérifie ce qui va au numérateur (en haut) et au dénominateur (en bas).';
      return null;
    },
    q: `<p class="big">${fmt(v)} = ${inp('frac')}</p><p class="hint">Écris ce nombre sous forme de fraction (exemple : 3/4).</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      if (!x.isFrac) return { retry: true, msg: 'On attend une fraction, écrite avec une barre : 3/4.' };
      const ok = eq(x.value, v); markInput(r, 0, ok);
      return { ok, msg: `Par exemple : ${fmt(v)} = ${Fs(n, d)}${gcd(n, d) > 1 && d / gcd(n, d) !== 1 ? ` = ${F(n, d)}` : ''}. ${ok ? '' : why}` };
    },
  };
}

// 3. Nombre quotient
function genQuotient() {
  const a = rand(2, 12);
  let b = rand(1, 60);
  if (b % a === 0 && Math.random() < 0.75) b++;
  return {
    hints: [
      `Quel nombre faut-il multiplier par ${a} pour obtenir ${b} ? Relis « Multiplications à trou » dans ${ficheLink('fractions')} : ce nombre s'écrit avec une fraction.`,
      (() => { let p, qq; do { p = rand(2, 9); qq = rand(2, 20); } while (p === a || qq === b || qq % p === 0); return `Exemple : ${p} × … = ${qq}. La réponse est ${F(qq, p)}, car ${p} × ${F(qq, p)} = ${qq}.`; })(),
      'Pour contrôler ta réponse : multiplie-la par le premier nombre. Tu dois retrouver le résultat.',
    ],
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, b / a)) return null;
      if (a !== b && eq(x.value, a / b)) return `Tu as écrit ${F(a, b)}. Vérifie : est-ce que ${a} × ${F(a, b)} donne ${b} ? Quel nombre va en haut, quel nombre va en bas ?`;
      if (eq(x.value, b - a)) return 'Tu as fait une soustraction. Ici, on cherche le nombre qui, <b>multiplié</b> par le premier, donne le résultat.';
      if (eq(x.value, a * b)) return `Tu as multiplié ${a} par ${b}. Relis la question : on cherche le nombre qui, multiplié par ${a}, donne ${b}.`;
      if (Number.isInteger(x.value) && x.value === Math.floor(b / a)) return `${a} × ${x.value} = ${a * x.value}, et non ${b}. Le nombre cherché n'est pas un entier : écris-le avec une fraction.`;
      return null;
    },
    q: `<p class="big">${a} × ${inp('frac')} = ${b}</p><p class="hint">Écris le nombre manquant sous forme de fraction.</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      const ok = eq(x.value, b / a); markInput(r, 0, ok);
      const verif = `Vérification : ${a} × ${F(b, a)} = ${b}.`;
      if (ok && !x.isFrac) return { ok, msg: `C'est juste, mais on attend surtout la fraction ${F(b, a)}. ${verif}` };
      if (ok) return { ok, msg: verif };
      return { ok, msg: `Le nombre qui, multiplié par ${a}, donne ${b}, c'est ${F(b, a)}. ${verif}` };
    },
  };
}

// 4. Lire une abscisse
function genLire() {
  const L = pickLine(), i = pickTick(L), v = i / L.den;
  return {
    hints: [
      'Repère l\'unité : entre 0 et 1, en combien de parts égales la droite est-elle partagée ? Combien vaut alors une seule part ?',
      { html: 'Regarde la droite : l\'unité (de 0 à 1) est coloriée et ses parts sont numérotées.', act: (r) => unitOverlay(r, L) },
      lineExample(L.den, i, 'lire'),
    ],
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, v)) return null;
      if (Math.abs(i) > 1 && eq(Math.abs(x.value), Math.abs(i))) return 'Tu as compté les graduations, mais une graduation ne vaut pas 1. Combien vaut une seule graduation ?';
      if (eq(x.value, -v)) return 'Regarde de quel côté de 0 se trouve le point A. À gauche de 0, les nombres sont négatifs.';
      if (eq(x.value, i / (L.den + 1)) || (L.den > 2 && eq(x.value, i / (L.den - 1)))) return 'As-tu compté les <b>parts</b> (les intervalles) entre 0 et 1, et non les traits ?';
      if (eq(Math.abs(x.value - v), 1 / L.den)) return 'Tu es à une graduation près : recompte bien à partir de 0.';
      return null;
    },
    q: `<p>Quelle est l'abscisse du point <b>A</b> ? <span class="hint">(fraction ou écriture décimale)</span></p>
        <div class="nl">${drawLine({ ...L, points: [{ v, label: 'A' }] })}</div>
        <p class="big">A ( ${inp('frac')} )</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      const ok = eq(x.value, v); markInput(r, 0, ok);
      return { ok, msg: `L'unité est partagée en ${L.den} parts égales : chaque graduation vaut ${F(1, L.den)}. A est à ${Math.abs(i)} graduation${Math.abs(i) > 1 ? 's' : ''} ${i < 0 ? 'à gauche' : 'à droite'} de 0, donc A a pour abscisse ${chain(i, L.den)}.` };
    },
  };
}

// 5. Placer un nombre
function genPlacer() {
  const L = pickLine(), i = pickTick(L), v = i / L.den;
  const asFrac = i % L.den !== 0 && Math.random() < (L.den === 10 ? 0.3 : 0.55);
  const disp = asFrac ? Fs(i, L.den) : fmt(v);
  return {
    hints: [
      'En combien de parts égales l\'unité (de 0 à 1) est-elle partagée ? Combien vaut une graduation ?',
      { html: 'Regarde la droite : l\'unité est coloriée et ses parts sont numérotées. Sers-t\'en pour compter.', act: (r) => unitOverlay(r, L) },
      lineExample(L.den, i, 'placer'),
    ],
    remediate(r) {
      const nl = r.querySelector('.nl'); if (nl.dataset.sel === undefined) return null;
      const sel = Number(nl.dataset.sel); if (sel === i) return null;
      if (sel === -i) return 'Ton point est du mauvais côté de 0. Ce nombre est-il positif ou négatif ?';
      if (Math.abs(sel - i) === 1) return 'Tu es à une graduation près : recompte bien à partir de 0.';
      return null;
    },
    q: `<p>Place le nombre <b class="big-inline">${disp}</b> : clique sur la bonne graduation.</p>
        <div class="nl">${drawLine({ ...L, clickable: true })}</div>`,
    mount(r) {
      const nl = r.querySelector('.nl');
      nl.querySelectorAll('.hit').forEach((h) => h.addEventListener('click', () => {
        nl.dataset.sel = h.dataset.i;
        nl.querySelectorAll('.mark').forEach((c) => c.classList.toggle('on', c.dataset.i === h.dataset.i));
      }));
    },
    check(r) {
      const nl = r.querySelector('.nl');
      if (nl.dataset.sel === undefined) return null;
      const ok = Number(nl.dataset.sel) === i;
      nl.querySelector(`.mark[data-i="${i}"]`)?.classList.add('good');
      return { ok, msg: `${disp} = ${chain(i, L.den)}. Chaque graduation vaut ${F(1, L.den)}, il faut compter ${Math.abs(i)} graduation${Math.abs(i) > 1 ? 's' : ''} ${i < 0 ? 'vers la gauche' : 'vers la droite'} à partir de 0${ok ? '.' : ' (point vert).'}` };
    },
  };
}

// 6. Fractions égales
function genEgales() {
  let p, q;
  do { p = rand(1, 9); q = rand(2, 9); } while (gcd(p, q) !== 1 || p === q);
  const k = rand(2, 4), n = p * k, d = q * k;
  const key = (a, b) => `${a}/${b}`;
  const good = new Map(), bad = new Map();
  const addG = (a, b) => { if (!(a === n && b === d)) good.set(key(a, b), [a, b]); };
  const addB = (a, b, kind) => {
    if (a > 0 && b > 0 && !eq(a / b, p / q) && !(a === n && b === d) && !bad.has(key(a, b))) bad.set(key(a, b), [a, b, kind]);
  };
  const ms = shuffle([2, 3, 5, 10]);
  addG(p, q);
  addG(n * ms[0], d * ms[0]);
  if (Math.random() < 0.5) addG(p * ms[1], q * ms[1]);
  const s = rand(1, 4);
  addB(n + s, d + s, 'plus');  // piège : ajouter le même nombre
  addB(q, p, 'inv');           // fraction inverse
  addB(n * 2, d, 'num');       // multiplier seulement en haut
  addB(p + 1, q, 'autre');
  addB(n * ms[2], d + ms[2], 'mix');  // multiplier en haut, ajouter en bas
  addB(n, d * ms[3], 'den');   // multiplier seulement en bas

  const goodArr = [...good.values()];
  const badArr = shuffle([...bad.values()]).slice(0, Math.max(2, 5 - goodArr.length));
  const items = shuffle([...goodArr.map((f) => ({ f, ok: true })), ...badArr.map((f) => ({ f, ok: false }))]);

  const explain = (a, b) => {
    if (a % n === 0 && b % d === 0 && a / n === b / d) return `on multiplie numérateur et dénominateur par ${a / n} : ${F(`${n} × ${a / n}`, `${d} × ${a / n}`)} = ${F(a, b)}`;
    if (n % a === 0 && d % b === 0 && n / a === d / b) return `on divise numérateur et dénominateur par ${n / a} : ${F(`${n} ÷ ${n / a}`, `${d} ÷ ${n / a}`)} = ${F(a, b)}`;
    return `${F(n, d)} et ${F(a, b)} se simplifient toutes les deux en ${F(p, q)}`;
  };

  return {
    hints: [
      `Rappel : on obtient une fraction égale en multipliant (ou en divisant) le numérateur <b>et</b> le dénominateur par le <b>même</b> nombre. Pour chaque fraction proposée : par quoi a-t-on multiplié ${n} ? Et ${d} ?`,
      (n === 10 && d === 4) || (p === 5 && q === 2)
        ? `Exemple : ${F(14, 6)} et ${F(140, 60)} → 14 × 10 = 140 et 6 × 10 = 60 : même nombre, elles sont égales. ${F(14, 6)} et ${F(15, 7)} → on a ajouté 1 en haut et en bas : elles ne sont pas égales.`
        : `Exemple : ${F(10, 4)} et ${F(30, 12)} → 10 × 3 = 30 et 4 × 3 = 12 : même nombre, elles sont égales. ${F(10, 4)} et ${F(11, 5)} → on a ajouté 1 en haut et en bas : elles ne sont pas égales.`,
      'Outil : simplifie chaque fraction au maximum. Deux fractions égales ont la même forme simplifiée.',
    ],
    remediate(r) {
      const cbs = [...r.querySelectorAll('.cb')];
      if (!cbs.some((c) => c.checked)) return null;
      const wrongIt = items.find((it, j) => !it.ok && cbs[j].checked);
      if (wrongIt) {
        const [a, b, kind] = wrongIt.f, fr = F(a, b);
        if (kind === 'plus') return `Regarde ${fr} : on a <b>ajouté</b> le même nombre en haut et en bas. Est-ce que cela donne une fraction égale ?`;
        if (kind === 'inv') return `Dans ${fr}, le numérateur et le dénominateur ont été échangés. Est-ce la même fraction ?`;
        if (kind === 'num') return `Dans ${fr}, seul le numérateur a été multiplié. Et le dénominateur ?`;
        if (kind === 'den') return `Dans ${fr}, seul le dénominateur a été multiplié. Et le numérateur ?`;
        if (kind === 'mix') return `Dans ${fr}, on a multiplié en haut mais ajouté en bas : ce n'est pas la même opération.`;
        return `Regarde bien ${fr} : le numérateur et le dénominateur ont-ils été multipliés (ou divisés) par le même nombre ?`;
      }
      const missing = items.filter((it, j) => it.ok && !cbs[j].checked).length;
      if (missing) return `Les fractions que tu as cochées sont justes, mais il en manque ${missing > 1 ? 'plusieurs' : 'une'}. Regarde à nouveau chaque fraction.`;
      return null;
    },
    q: `<p>Coche <b>toutes</b> les fractions égales à ${F(n, d)} :</p>
        <div class="choices">${items.map((it, j) => `<label class="choice"><input type="checkbox" class="cb" data-j="${j}"> ${F(it.f[0], it.f[1])}</label>`).join('')}</div>`,
    check(r) {
      const cbs = [...r.querySelectorAll('.cb')];
      if (!cbs.some((c) => c.checked)) return null;
      let ok = true, trap = false;
      cbs.forEach((c, j) => {
        const it = items[j];
        if (c.checked !== it.ok) ok = false;
        if (it.ok) c.parentElement.classList.add('is-good');
        else if (c.checked) {
          c.parentElement.classList.add('is-bad');
          if (it.f[0] - n === it.f[1] - d) trap = true;
        }
        c.disabled = true;
      });
      let msg = `Les fractions égales à ${F(n, d)} sont (en vert) :<ul>${goodArr.map(([a, b]) => `<li>${F(a, b)} : ${explain(a, b)}</li>`).join('')}</ul>`;
      if (trap) msg += 'Attention : ajouter le même nombre en haut et en bas ne donne <b>pas</b> une fraction égale.';
      return { ok, msg };
    },
  };
}

// 7. Simplifier
function genSimplifier() {
  let p, q;
  do { p = rand(1, 20); q = rand(2, 12); } while (gcd(p, q) !== 1 || p === q);
  const k = pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const n = p * k, d = q * k;
  const spf = [2, 3, 5, 7].find((x) => k % x === 0) || k;
  return {
    hints: [
      `Simplifier, c'est diviser le numérateur et le dénominateur par un même nombre. Quel nombre divise à la fois ${n} et ${d} ?`,
      n === 39 && d === 12
        ? `Exemple : ${F(45, 30)} → 45 et 30 sont dans la table de 15 : ${F('45 ÷ 15', '30 ÷ 15')} = ${F(3, 2)}. 3 et 2 n'ont plus de diviseur commun (autre que 1) : c'est terminé.`
        : `Exemple : ${F(39, 12)} → 39 et 12 sont dans la table de 3 : ${F('39 ÷ 3', '12 ÷ 3')} = ${F(13, 4)}. 13 et 4 n'ont plus de diviseur commun (autre que 1) : c'est terminé.`,
      'Outil — les critères de divisibilité :<ul><li>par 2 : le nombre est pair ;</li><li>par 3 : la somme de ses chiffres est dans la table de 3 ;</li><li>par 5 : il se termine par 0 ou 5 ;</li><li>par 9 : la somme de ses chiffres est dans la table de 9 ;</li><li>par 10 : il se termine par 0.</li></ul>',
    ],
    remediate(r) {
      const x = val(r); if (!x || !x.isFrac || eq(x.value, n / d)) return null;
      if (Number.isInteger(x.n) && Number.isInteger(x.d) && x.n > 0 && x.d > 0) {
        if (n % x.n === 0 && d % x.d === 0 && n / x.n !== d / x.d) return `Tu as divisé ${n} par ${n / x.n}, mais ${d} par ${d / x.d}. Il faut diviser le haut et le bas par le <b>même</b> nombre.`;
        if (n - x.n === d - x.d && n > x.n) return 'Tu as soustrait le même nombre en haut et en bas. Pour simplifier, on <b>divise</b>.';
        if (eq(x.value, d / n)) return 'Ta fraction est à l\'envers : le numérateur reste en haut.';
      }
      return null;
    },
    q: `<p class="big">${F(n, d)} = ${inp('frac')}</p><p class="hint">Simplifie au maximum (exemple de saisie : 13/4).</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      if (!x.isFrac) return { retry: true, msg: 'Écris ta réponse sous forme de fraction, avec une barre : 13/4.' };
      if (!eq(x.value, n / d)) {
        markInput(r, 0, false);
        return { ok: false, msg: `On divise numérateur et dénominateur par ${k} : ${F(`${n} ÷ ${k}`, `${d} ÷ ${k}`)} = ${F(p, q)}.` };
      }
      const g = Number.isInteger(x.n) && Number.isInteger(x.d) ? gcd(x.n, x.d) : 0;
      if (g !== 1) return { retry: true, msg: `Ta fraction ${F(x.n, x.d)} est bien égale, mais elle peut encore se simplifier : cherche un diviseur commun à ${x.n} et ${x.d}.` };
      markInput(r, 0, true);
      return { ok: true, msg: `${F(`${n} ÷ ${k}`, `${d} ÷ ${k}`)} = ${F(p, q)}, et ${F(p, q)} ne se simplifie plus.` };
    },
  };
}

// 8. Formes multiples
function genFormes() {
  const den = pick([2, 4, 5, 10]);
  const E = rand(1, 4), rest = rand(1, den - 1), n = E * den + rest, v = n / den;
  const D = den === 4 ? 100 : 10;
  const decN = Math.round(v * D);
  const g = gcd(n, den), irrN = n / g, irrD = den / g;
  const rg = gcd(rest, den), rN = rest / rg, rD = den / rg;
  return {
    hints: [
      `Comment se lit ${fmt(v)} ? Combien d'unités, et combien de dixièmes (ou de centièmes) ?`,
      eq(v, 1.2) ? `Exemple : 2,5 = ${F(25, 10)} = ${F(5, 2)} = 2 + ${F(1, 2)}.` : `Exemple (fiche) : 1,2 = ${F(12, 10)} = ${F(6, 5)} = 1 + ${F(1, 5)}.`,
      'Outil : pour « entier + fraction », la fraction doit être plus petite que 1. C\'est ce qui reste quand on a enlevé la partie entière.',
    ],
    remediate(r) {
      const a = val(r, 0), b = val(r, 1), e = val(r, 2), f = val(r, 3);
      if (!a || !b || !e || !f) return null;
      const msgs = [];
      if (!(a.isFrac && (a.d === 10 || a.d === 100) && eq(a.value, v))) {
        markInput(r, 0, false);
        msgs.push(a.isFrac && a.d !== 10 && a.d !== 100 ? 'Ligne 1 : le dénominateur doit être 10 ou 100.' : `Ligne 1 : combien de chiffres après la virgule dans ${fmt(v)} ? Des dixièmes ou des centièmes ?`);
      }
      if (!(b.isFrac && eq(b.value, v) && Number.isInteger(b.n) && Number.isInteger(b.d) && gcd(b.n, b.d) === 1)) {
        markInput(r, 1, false);
        msgs.push(b.isFrac && eq(b.value, v) ? 'Ligne 2 : ta fraction est égale, mais elle peut encore se simplifier.' : 'Ligne 2 : ta fraction n\'est pas égale au nombre. Pars de la ligne 1 et simplifie.');
      }
      if (!eq(e.value, E)) { markInput(r, 2, false); msgs.push('Ligne 3 : la partie entière, c\'est le nombre avant la virgule.'); }
      if (!(f.isFrac && eq(f.value, rest / den))) {
        markInput(r, 3, false);
        msgs.push(f.value >= 1 ? 'Ligne 3 : la fraction doit être plus petite que 1.' : 'Ligne 3 : la fraction doit valoir ce qui reste après la partie entière.');
      }
      return msgs.length ? `<ul>${msgs.map((x) => `<li>${x}</li>`).join('')}</ul>` : null;
    },
    q: `<p>Écris le nombre <b>${fmt(v)}</b> sous trois formes :</p>
      <div class="form-lines">
        <div class="form-line">${fmt(v)} = ${inp('frac', 'Fraction décimale')}<small>fraction de dénominateur 10 ou 100</small></div>
        <div class="form-line">${fmt(v)} = ${inp('frac', 'Fraction irréductible')}<small>fraction simplifiée au maximum</small></div>
        <div class="form-line">${fmt(v)} = ${inp('num', 'Partie entière')} + ${inp('frac', 'Fraction inférieure à 1')}<small>entier + fraction plus petite que 1</small></div>
      </div>`,
    check(r) {
      const a = val(r, 0), b = val(r, 1), e = val(r, 2), f = val(r, 3);
      if (!a || !b || !e || !f) return null;
      const ok1 = a.isFrac && (a.d === 10 || a.d === 100) && eq(a.value, v);
      const ok2 = b.isFrac && eq(b.value, v) && Number.isInteger(b.n) && Number.isInteger(b.d) && gcd(b.n, b.d) === 1;
      const ok3 = eq(e.value, E) && f.isFrac && eq(f.value, rest / den);
      [ok1, ok2, eq(e.value, E), f.isFrac && eq(f.value, rest / den)].forEach((o, i) => markInput(r, i, o));
      const ok = ok1 && ok2 && ok3;
      return { ok, msg: `${fmt(v)} = ${F(decN, D)} = ${F(irrN, irrD)} = ${E} + ${F(rN, rD)}${ok ? '' : `<br>Astuce : ${fmt(v)}, c'est ${E} unité${E > 1 ? 's' : ''} et ${fmt(v - E)}.`}` };
    },
  };
}

/* ---------- Exemples et aide-mémoire ---------- */
function decExample(n, d) {
  const same = USUELLES.filter(([a, b]) => b === d && a !== n && b !== 1);
  const pool = same.length ? same : USUELLES.filter(([a, b]) => !(a === n && b === d) && b !== 1 && a !== b);
  const [a, b] = pick(pool);
  return `Exemple : ${F(a, b)} = ${a} ÷ ${b} = ${fmt(a / b)}, car ${b} × ${fmt(a / b)} = ${a}.`;
}
function memoFractions(n, d) {
  return [[1, 2], [1, 4], [1, 10], [1, 5]].filter(([a, b]) => !eq(a / b, n / d))
    .map(([a, b]) => `${F(a, b)} = ${fmt(a / b)}`).join(' ; ') + '. Si tu connais une part, combien valent plusieurs parts ?';
}
function lineExample(den, i, kind) {
  let k; do { k = rand(-(den * 2), den * 2); } while (k === 0 || k === i || k === -i || k % den === 0);
  const side = k < 0 ? 'à gauche' : 'à droite', g = Math.abs(k);
  if (kind === 'lire') return `Exemple : sur une droite où l'unité est partagée en ${den}, un point situé ${g} graduations ${side} de 0 a pour abscisse ${F(k, den)}${gcd(k, den) > 1 ? ` = ${Fs(k, den)}` : ''} = ${fmt(k / den)}.`;
  return `Exemple : pour placer ${fmt(k / den)} sur une droite graduée en ${den === 2 ? 'demis' : den === 4 ? 'quarts' : 'dixièmes'}, j'écris ${fmt(k / den)} = ${F(k, den)}, puis je compte ${g} graduations ${k < 0 ? 'vers la gauche' : 'vers la droite'} à partir de 0.`;
}

/* =========================================================
   CHAPITRE 1 — RÈGLES DE CALCUL
   ========================================================= */
const PRIO = { '+': 1, '−': 1, '×': 2, ':': 2 };
const OPF = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, ':': (a, b) => a / b };
const OPNOM = { '+': 'addition', '−': 'soustraction', '×': 'multiplication', ':': 'division' };

/** "20 − (4 + 7)" -> jetons */
function tokensFrom(str) {
  const out = [];
  const re = /\d+|[+−×:()]/g;
  let m;
  while ((m = re.exec(str.replace(/-/g, '−')))) {
    const t = m[0];
    if (/\d/.test(t)) out.push({ t: 'n', v: Number(t) });
    else if (t === '(' || t === ')') out.push({ t });
    else out.push({ t: 'op', v: t });
  }
  return out;
}
const tokTxt = (k) => (k.t === 'n' ? String(k.v) : k.t === 'op' ? k.v : k.t);

/** Jetons -> texte, avec surlignage éventuel des jetons [hi, hi+2] */
function tokHTML(toks, hi = -1) {
  let s = '';
  toks.forEach((k, i) => {
    const prev = toks[i - 1];
    if (i > 0 && !(prev.t === '(') && k.t !== ')') s += ' ';
    if (i === hi - 1) s += '<mark>';
    s += tokTxt(k);
    if (i === hi + 1) s += '</mark>';
  });
  return s;
}
const tokStr = (toks) => tokHTML(toks);

/** Effectue UNE opération en suivant les règles du cours */
function stepOnce(toks) {
  if (toks.length === 1) return null;
  let i = -1, j = toks.length;
  const close = toks.findIndex((k) => k.t === ')');
  if (close >= 0) {
    j = close;
    for (let k = close - 1; k >= 0; k--) if (toks[k].t === '(') { i = k; break; }
  }
  const seg = toks.slice(i + 1, j);
  const hasLow = seg.some((x) => x.t === 'op' && PRIO[x.v] === 1);
  let k = seg.findIndex((x) => x.t === 'op' && PRIO[x.v] === 2);
  const hasHigh = k >= 0;
  if (k < 0) k = seg.findIndex((x) => x.t === 'op');
  const op = seg[k].v, a = seg[k - 1].v, b = seg[k + 1].v;
  const res = OPF[op](a, b);
  let depth = 0;
  for (let q = 0; q <= i; q++) { if (toks[q].t === '(') depth++; if (toks[q].t === ')') depth--; }
  const abs = i + 1 + k;
  let nt = [...toks.slice(0, abs - 1), { t: 'n', v: res }, ...toks.slice(abs + 2)];
  if (i >= 0 && seg.length === 3) nt = [...nt.slice(0, i), nt[i + 1], ...nt.slice(i + 3)];
  let rule;
  if (depth >= 2) rule = 'règle 6 : parenthèse intérieure';
  else if (depth === 1) rule = 'règle 5 : parenthèses';
  else if (hasHigh && hasLow) rule = op === '×' ? 'règle 3 : × d’abord' : 'règle 4 : division d’abord';
  else rule = PRIO[op] === 1 ? 'règle 1 : gauche → droite' : 'règle 2 : gauche → droite';
  return { toks: nt, op, a, b, res, rule, opIndex: abs };
}

/** Toutes les étapes ; null si une étape sort des nombres entiers positifs */
function evalSteps(toks, max = 1000) {
  const steps = [];
  let cur = toks;
  for (;;) {
    const s = stepOnce(cur);
    if (!s) break;
    if (!Number.isInteger(s.res) || s.res < 0 || s.res > max) return null;
    steps.push({ before: cur, ...s });
    cur = s.toks;
  }
  return { steps, value: cur[0].v };
}

function stepsHTML(name, toks) {
  const ev = evalSteps(toks, 1e9);
  let html = '<div class="calc-steps">';
  ev.steps.forEach((s, i) => {
    html += `<span class="cl-n">${i === 0 ? name + ' =' : '='}</span><span class="cl-e">${tokHTML(s.before, s.opIndex)}</span><span class="cl-r">← ${s.rule}</span>`;
  });
  html += `<span class="cl-n">${ev.steps.length ? '=' : name + ' ='}</span><span class="cl-e"><b>${ev.value}</b></span><span></span></div>`;
  return html;
}

/** Fabrique un calcul à partir de modèles ("a + b × c") avec des résultats entiers positifs */
function buildExpr(tpls) {
  for (let tries = 0; tries < 30000; tries++) {
    const tpl = pick(tpls);
    const parts = tpl.split(' ');
    const toks = parts.map((p) => (/^[a-z]$/.test(p) ? { t: 'n', v: 0, ph: true } : p === '(' || p === ')' ? { t: p } : { t: 'op', v: p }));
    toks.forEach((k, i) => {
      if (!k.ph) return;
      const near = [toks[i - 1], toks[i + 1]].some((x) => x && x.t === 'op' && PRIO[x.v] === 2);
      k.v = near ? rand(2, 10) : rand(2, 30);
    });
    if (toks[0].ph && Math.random() < 0.6) toks[0].v = rand(10, 60);
    toks.forEach((k, i) => {
      if (k.t === 'op' && k.v === ':' && toks[i - 1] && toks[i - 1].ph && toks[i + 1] && toks[i + 1].ph) toks[i - 1].v = toks[i + 1].v * rand(2, 9);
    });
    const clean = toks.map((k) => (k.ph ? { t: 'n', v: k.v } : k));
    const ev = evalSteps(clean, 400);
    if (!ev || ev.steps.some((st) => st.res === 0)) continue;
    return { toks: clean, tpl, ...ev };
  }
  return null;
}

const TPL_SANS = ['a + b − c − d', 'a − b + c − d', 'a − b − c + d', 'a + b − c + d', 'a × b : c', 'a : b × c', 'a × b : c × d', 'a : b × c : d'];
const TPL_PRIO = ['a + b × c', 'a − b × c', 'a + b : c', 'a − b : c', 'a × b + c', 'a × b − c', 'a : b + c', 'a : b − c',
  'a − b + c × d', 'a + b × c − d', 'a × b − c : d', 'a × b + c × d', 'a − b × c + d'];
const TPL_PAR = ['a − ( b + c ) − d', 'a + b × ( c − d )', '( a + b ) × c', 'a × ( b − c )', '( a − b ) : c', 'a : ( b + c )',
  '( a + b ) × ( c − d )', 'a − ( b − c )', '( a + b ) : ( c − d )', 'a + ( b − c ) × d'];
const TPL_IMB = ['a − ( b − ( c + d ) )', '( a − ( b + c ) ) × d', 'a × ( b + ( c − d ) )', 'a + ( b × ( c − d ) )',
  '( a − ( b + c ) ) : d', 'a − ( b + ( c − d ) ) × e', '( a + ( b − c ) ) × d'];

function genCalcFrom(tpls) {
  return () => {
    const e = buildExpr(tpls);
    const name = pick(['A', 'B', 'C', 'D', 'E', 'F']);
    let exe = buildExpr([e.tpl]);
    for (let i = 0; i < 20 && tokStr(exe.toks) === tokStr(e.toks); i++) exe = buildExpr([e.tpl]);
    return {
      hints: [
        `Avant de calculer, observe : y a-t-il des parenthèses ? des multiplications ou des divisions ? Quelle règle de ${ficheLink('calculs')} s'applique en premier ?`,
        `Exemple résolu, avec la même structure :${stepsHTML('X', exe.toks)}`,
        'Méthode : souligne le calcul que tu fais en premier, recopie tout le reste en dessous, puis recommence ligne par ligne.',
      ],
      remediate(r) { const x = val(r); return x ? calcRemed(e.toks, e.value, x.value) : null; },
      q: `<p>Calcule en respectant les règles :</p><p class="big">${name} = ${tokStr(e.toks)}</p><p class="big">${name} = ${inp('num', 'Résultat')}</p>`,
      check(r) {
        const x = val(r); if (!x) return null;
        const ok = eq(x.value, e.value); markInput(r, 0, ok);
        return { ok, msg: `Voici le calcul étape par étape :${stepsHTML(name, e.toks)}` };
      },
    };
  };
}

function genFirstOp() {
  const e = buildExpr(pick([TPL_SANS, TPL_PRIO, TPL_PRIO, TPL_PAR, TPL_IMB]));
  const first = e.steps[0];
  const html = e.toks.map((k, i) => (k.t === 'op'
    ? `<button type="button" class="opbtn" data-i="${i}" aria-label="${OPNOM[k.v]}">${k.v}</button>`
    : `<span class="${k.t === 'n' ? 'tn' : 'tp'}">${tokTxt(k)}</span>`)).join('');
  const hasPar = e.toks.some((k) => k.t === '(');
  let ex = buildExpr([e.tpl]);
  for (let i = 0; i < 20 && tokStr(ex.toks) === tokStr(e.toks); i++) ex = buildExpr([e.tpl]);
  const dFirst = depthAt(e.toks, first.opIndex);
  return {
    hints: [
      hasPar ? 'Y a-t-il des parenthèses ? Si oui, lesquelles sont le plus à l\'intérieur ?' : 'Pas de parenthèses ici. Y a-t-il des multiplications ou des divisions ?',
      'Outil — l\'ordre des priorités : 1. les parenthèses (les plus intérieures d\'abord) ; 2. × et : ; 3. + et −. Pour des opérations de même priorité : de gauche à droite.',
      `Exemple : dans ${tokHTML(ex.toks, ex.steps[0].opIndex)}, on commence par le calcul surligné (${ex.steps[0].rule}).`,
    ],
    remediate(r) {
      if (r.dataset.sel === undefined) return null;
      const sel = Number(r.dataset.sel); if (sel === first.opIndex) return null;
      const dSel = depthAt(e.toks, sel), op = e.toks[sel].v;
      if (dSel < dFirst) return dSel === 0 ? 'Il y a des parenthèses dans ce calcul : on commence toujours par le calcul entre parenthèses (règle 5).' : 'Il y a des parenthèses à l\'intérieur d\'autres parenthèses : on commence par les plus intérieures (règle 6).';
      if (PRIO[op] === 1 && PRIO[first.op] === 2) return `Tu as choisi « ${op} ». Y a-t-il une multiplication ou une division au même niveau ? Elles passent avant (règles 3 et 4).`;
      return 'Ces opérations ont la même priorité : dans ce cas, on calcule de gauche à droite.';
    },
    q: `<p>Clique sur l'opération à effectuer <b>en premier</b> :</p><div class="expr">${html}</div>`,
    mount(r) {
      r.querySelectorAll('.opbtn').forEach((b) => b.addEventListener('click', () => {
        r.dataset.sel = b.dataset.i;
        r.querySelectorAll('.opbtn').forEach((x) => x.classList.toggle('sel', x === b));
      }));
    },
    check(r) {
      if (r.dataset.sel === undefined) return null;
      const ok = Number(r.dataset.sel) === first.opIndex;
      r.querySelectorAll('.opbtn').forEach((b) => {
        if (Number(b.dataset.i) === first.opIndex) b.classList.add('good');
        else if (b.classList.contains('sel')) b.classList.add('bad');
      });
      return { ok, msg: `On commence par <b>${first.a} ${first.op} ${first.b}</b> (${first.rule}).${stepsHTML('A', e.toks)}` };
    },
  };
}

/* ---------- Vocabulaire ---------- */
const NOM = { '+': ['la somme', 'et'], '−': ['la différence', 'et'], '×': ['le produit', 'par'], ':': ['le quotient', 'par'] };
const TYPE = { '+': 'une somme', '−': 'une différence', '×': 'un produit', ':': 'un quotient' };
const deX = (x) => (x.startsWith('le ') ? 'du ' + x.slice(3) : 'de ' + x);
function phrase(t) {
  if (typeof t === 'number') return String(t);
  const [n, link] = NOM[t.op];
  return `${n} ${deX(phrase(t.l))} ${link === 'et' ? 'et ' + deX(phrase(t.r)) : 'par ' + phrase(t.r)}`;
}
function treeToks(t, parent, side) {
  if (typeof t === 'number') return [{ t: 'n', v: t }];
  const inner = [...treeToks(t.l, t, 'l'), { t: 'op', v: t.op }, ...treeToks(t.r, t, 'r')];
  const need = parent && (PRIO[t.op] < PRIO[parent.op] || (PRIO[t.op] === PRIO[parent.op] && side === 'r'));
  return need ? [{ t: '(' }, ...inner, { t: ')' }] : inner;
}
function genTrees() {
  for (let t = 0; t < 5000; t++) {
    const [o1, o2] = shuffle(['+', '−', '×', ':']).slice(0, 2);
    const x = rand(2, 40), y = rand(2, 12), z = rand(2, 12);
    const shapes = (a, b) => [{ op: a, l: { op: b, l: x, r: y }, r: z }, { op: a, l: x, r: { op: b, l: y, r: z } }];
    const all = [...shapes(o1, o2), ...shapes(o2, o1)];
    const valid = all.filter((tr) => evalSteps(treeToks(tr), 600));
    if (!valid.length) continue;
    return { all, tree: pick(valid) };
  }
  return null;
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const withHints = (o, h) => { o.hints = h; return o; };
/** Remédiation d'un QCM : fn(indexChoisi, texteChoisi) renvoie un message (ou null) si la réponse est fausse */
const withRemed = (o, fn) => {
  o.remediate = (r) => {
    const sel = r.querySelector('.rb:checked'); if (!sel) return null;
    const i = Number(sel.dataset.o);
    return i === o._correct ? null : fn(i, o._opts[i]);
  };
  return o;
};
/** Profondeur de parenthèses à la position i */
function depthAt(toks, i) {
  let d = 0;
  for (let q = 0; q < i; q++) { if (toks[q].t === '(') d++; if (toks[q].t === ')') d--; }
  return d;
}
/** Évalue avec d'autres priorités (pour reconnaître une erreur de méthode) */
function evalWith(toks, P, ignorePar = false) {
  const out = [], ops = [];
  const apply = () => { const o = ops.pop(), b = out.pop(), a = out.pop(); out.push(OPF[o](a, b)); };
  for (const k of toks) {
    if (k.t === 'n') out.push(k.v);
    else if (k.t === '(') { if (!ignorePar) ops.push('('); }
    else if (k.t === ')') { if (!ignorePar) { while (ops.length && ops[ops.length - 1] !== '(') apply(); ops.pop(); } }
    else { while (ops.length && ops[ops.length - 1] !== '(' && P[ops[ops.length - 1]] >= P[k.v]) apply(); ops.push(k.v); }
  }
  while (ops.length) apply();
  return out[0];
}
/** Reconnaît les erreurs classiques sur les priorités */
function calcRemed(toks, value, ans) {
  if (eq(ans, value)) return null;
  const tries = [
    [{ '+': 1, '−': 1, '×': 1, ':': 1 }, false, 'Tu as calculé dans l\'ordre de lecture. Mais la multiplication et la division sont <b>prioritaires</b> sur l\'addition et la soustraction (règles 3 et 4).'],
    [PRIO, true, 'As-tu commencé par le calcul <b>entre parenthèses</b> ? C\'est toujours la première chose à faire (règle 5).'],
    [{ '+': 2, '−': 1, '×': 3, ':': 3 }, false, 'Quand il n\'y a que des + et des −, on ne fait pas les additions d\'abord : on calcule <b>de gauche à droite</b> (règle 1).'],
    [{ '+': 0, '−': 0, '×': 2, ':': 1 }, false, 'Quand il n\'y a que des × et des :, on ne fait pas les multiplications d\'abord : on calcule <b>de gauche à droite</b> (règle 2).'],
  ];
  for (const [P, ign, msg] of tries) {
    const v = evalWith(toks, P, ign);
    if (Number.isFinite(v) && !eq(v, value) && eq(v, ans)) return msg;
  }
  return null;
}

/** QCM générique (boutons radio) */
function mcq(prompt, options, correct, explain, { col = false, label } = {}) {
  const order = shuffle(options.map((_, i) => i));
  const name = 'q' + Math.random().toString(36).slice(2);
  return {
    label,
    _correct: correct,
    _opts: options,
    q: `${prompt}<div class="choices${col ? ' col' : ''}">${order.map((oi) => `<label class="choice${col ? ' text' : ''}"><input type="radio" name="${name}" class="rb" data-o="${oi}"> <span>${options[oi]}</span></label>`).join('')}</div>`,
    check(r) {
      const sel = r.querySelector('.rb:checked');
      if (!sel) return null;
      const ok = Number(sel.dataset.o) === correct;
      r.querySelectorAll('.rb').forEach((x) => {
        x.disabled = true;
        if (Number(x.dataset.o) === correct) x.parentElement.classList.add('is-good');
        else if (x.checked) x.parentElement.classList.add('is-bad');
      });
      return { ok, msg: explain };
    },
  };
}

function genMot() {
  const a = rand(4, 30), b = rand(2, 12);
  const qs = [
    () => mcq(`<p class="statement">Dans <b>${a} + ${b}</b>, les nombres ${a} et ${b} sont les … de cette somme.</p>`,
      ['termes', 'facteurs', 'dividendes', 'diviseurs'], 0, `Dans une somme (et dans une différence), les nombres s'appellent des <b>termes</b>.`),
    () => mcq(`<p class="statement">Dans <b>${a + b} − ${b}</b>, les nombres ${a + b} et ${b} sont les … de cette différence.</p>`,
      ['termes', 'facteurs', 'quotients', 'produits'], 0, `Dans une différence, comme dans une somme, les nombres s'appellent des <b>termes</b>.`),
    () => mcq(`<p class="statement">Dans <b>${b} × ${a}</b>, les nombres ${b} et ${a} sont les … de ce produit.</p>`,
      ['facteurs', 'termes', 'dividendes', 'diviseurs'], 0, `Dans un produit, les nombres s'appellent des <b>facteurs</b>.`),
    () => mcq(`<p class="statement">Dans <b>${a * b} : ${b}</b>, le nombre ${a * b} est le …</p>`,
      ['dividende', 'diviseur', 'facteur', 'terme'], 0, `Dans ${a * b} : ${b}, ${a * b} est le <b>dividende</b> (le nombre qu'on partage) et ${b} est le <b>diviseur</b>.`),
    () => mcq(`<p class="statement">Dans <b>${a * b} : ${b}</b>, le nombre ${b} est le …</p>`,
      ['diviseur', 'dividende', 'facteur', 'terme'], 0, `Dans ${a * b} : ${b}, ${b} est le <b>diviseur</b> et ${a * b} est le <b>dividende</b>.`),
    () => {
      const op = pick(['+', '−', '×', ':']);
      const ex = op === '+' ? `${a} + ${b}` : op === '−' ? `${a + b} − ${b}` : op === '×' ? `${a} × ${b}` : `${a * b} : ${b}`;
      const [x, y] = op === '+' ? [a, b] : op === '−' ? [a + b, b] : op === '×' ? [a, b] : [a * b, b];
      const opts = ['+', '−', '×', ':'].map((o) => `${NOM[o][0]} de ${x} ${NOM[o][1] === 'et' ? 'et de' : 'par'} ${y}`);
      return mcq(`<p class="statement"><b>${ex}</b> est …</p>`, opts, ['+', '−', '×', ':'].indexOf(op),
        `L'opération est une ${OPNOM[op]}, donc ${ex} est ${opts[['+', '−', '×', ':'].indexOf(op)]}.`, { col: true });
    },
  ];
  return withRemed(withHints(pick(qs)(), [`Quel est le signe de l'opération ? Relis le tableau « Vocabulaire » dans ${ficheLink('calculs')}.`]), (i, txt) => {
    if (/^termes/.test(txt)) return 'Les termes, ce sont les nombres d\'une somme ou d\'une différence. Quel est le signe ici ?';
    if (/^facteurs/.test(txt)) return 'Les facteurs, ce sont les nombres d\'un produit (une multiplication). Quel est le signe ici ?';
    if (/^dividende/.test(txt)) return 'Le dividende, c\'est le nombre que l\'on divise : il est écrit en premier dans la division.';
    if (/^diviseur/.test(txt)) return 'Le diviseur, c\'est le nombre par lequel on divise : il est écrit en second.';
    if (/^(quotients|produits)/.test(txt)) return 'Relis la question : on parle des nombres qui sont dans le calcul, pas du résultat.';
    return 'Regarde bien le signe de l\'opération, puis relis la première colonne du tableau de vocabulaire.';
  });
}

function genDerniere() {
  const { tree } = genTrees();
  const toks = treeToks(tree);
  const name = pick(['A', 'B', 'C', 'D', 'E']);
  const ops = ['+', '−', '×', ':'];
  const inner = typeof tree.l === 'object' ? tree.l.op : tree.r.op;
  const EXD = { '+': 'A = 25 + 4 × 3 : on calcule d\'abord 4 × 3, puis on ajoute 25. La dernière opération est une addition : A est une somme.',
    '×': 'B = (5 + 3) × 4 : on calcule d\'abord 5 + 3, puis on multiplie par 4. La dernière opération est une multiplication : B est un produit.',
    ':': 'C = 18 : (7 − 1) : on calcule d\'abord 7 − 1, puis on divise. La dernière opération est une division : C est un quotient.',
    '−': 'D = 40 − (5 + 8) : on calcule d\'abord 5 + 8, puis on soustrait. La dernière opération est une soustraction : D est une différence.' };
  const exK = pick(Object.keys(EXD).filter((o) => o !== tree.op));
  return withRemed(withHints(mcq(`<p class="big">${name} = ${tokStr(toks)}</p><p>${name} est …</p>`,
    ops.map((o) => TYPE[o]), ops.indexOf(tree.op),
    `Pour calculer ${name}, la dernière opération effectuée est une <b>${OPNOM[tree.op]}</b>.<br>${name} est ${phrase(tree)}.${stepsHTML(name, toks)}`),
    ['Fais le calcul au brouillon, dans l\'ordre des priorités. Quelle est la <b>toute dernière</b> opération que tu effectues ?', `Exemple (fiche) : ${EXD[exK]}`]),
    (i) => {
      const o = ['+', '−', '×', ':'][i];
      if (o === inner) return 'Tu as choisi l\'opération qui se fait en <b>premier</b>. On cherche celle qui se fait en <b>dernier</b>.';
      if (o !== tree.op) return `Il n'y a pas de ${OPNOM[o]} dans ce calcul ! Regarde bien les signes.`;
      return null;
    });
}

function genPhraseVersCalcul() {
  const { all, tree } = genTrees();
  const name = pick(['A', 'B', 'C', 'D', 'E']);
  const opts = all.map((t) => `${name} = ${tokStr(treeToks(t))}`);
  return withRemed(withHints(mcq(`<p class="statement">Quel calcul correspond à la phrase :<br><b>« ${name} est ${phrase(tree)} »</b> ?</p>`,
    opts, all.indexOf(tree),
    `« ${cap(phrase(tree))} » : on commence par le premier mot. C'est ${TYPE[tree.op]}, donc la <b>dernière</b> opération est une ${OPNOM[tree.op]}.<br>${name} = ${tokStr(treeToks(tree))}`, { col: true }),
    ['Lis le début de la phrase : « la somme », « la différence », « le produit » ou « le quotient » ? Ce mot indique la <b>dernière</b> opération du calcul.',
      'Exemple (fiche) : « D est la différence de 40 et de la somme de 5 et de 8 ». C\'est une différence entre deux nombres : 40, et la somme 5 + 8. Donc D = 40 − (5 + 8).',
      'Outil : coupe la phrase en deux morceaux autour du « et » (ou du « par ») principal. Chaque morceau est un nombre ou un petit calcul.']),
    (i) => {
      const t = all[i];
      if (t.op !== tree.op) return `Dans le calcul que tu as choisi, la dernière opération est une ${OPNOM[t.op]} : ce serait ${TYPE[t.op]}. Or la phrase commence par « ${NOM[tree.op][0]} ».`;
      return 'Le début est bon ! Regarde maintenant ce qui doit être calculé en premier : où faut-il des parenthèses ?';
    });
}

function genCalculVersPhrase() {
  const { all, tree } = genTrees();
  const name = pick(['A', 'B', 'C', 'D', 'E']);
  const opts = all.map((t) => `${name} est ${phrase(t)}.`);
  return withRemed(withHints(mcq(`<p>Quelle phrase traduit le calcul :</p><p class="big">${name} = ${tokStr(treeToks(tree))}</p>`,
    opts, all.indexOf(tree),
    `La dernière opération effectuée est une <b>${OPNOM[tree.op]}</b>, donc ${name} est ${TYPE[tree.op]} :<br>${name} est ${phrase(tree)}.`, { col: true }),
    ['Quelle est la dernière opération effectuée dans ce calcul ? C\'est elle qui donne le premier mot de la phrase.',
      'Exemple (fiche) : B = (5 + 3) × 4. On calcule 5 + 3, puis on multiplie : la dernière opération est une multiplication. B est le produit de la somme de 5 et de 3 par 4.']),
    (i) => {
      const t = all[i];
      if (t.op !== tree.op) return `La phrase choisie commence par « ${NOM[t.op][0]} » : elle décrit ${TYPE[t.op]}. Quelle est la dernière opération de ton calcul ?`;
      return 'Le premier mot est bon. Vérifie maintenant ce qui est calculé en premier, et l\'ordre des nombres.';
    });
}

/** Démonstrations de la fiche */
function renderCalcDemos() {
  document.querySelectorAll('.calc-demo').forEach((el) => {
    el.innerHTML = stepsHTML(el.dataset.name, tokensFrom(el.dataset.expr));
  });
}

/* =========================================================
   CHAPITRE 2 — TRIANGLES
   ========================================================= */
const G = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  mul: (a, k) => ({ x: a.x * k, y: a.y * k }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  cross: (a, b) => a.x * b.y - a.y * b.x,
  len: (a) => Math.hypot(a.x, a.y),
  dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  norm: (a) => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; },
  rot: (a, deg) => { const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return { x: a.x * c - a.y * s, y: a.x * s + a.y * c }; },
  perp: (a) => ({ x: -a.y, y: a.x }),
  mid: (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round1 = (v) => Math.round(v * 10) / 10;
const angDeg = (u, v) => (Math.acos(clamp(G.dot(u, v) / (G.len(u) * G.len(v) || 1), -1, 1)) * 180) / Math.PI;
/** angle en degrés au sommet V du triangle AVB */
const angleAt = (A, V, B) => angDeg(G.sub(A, V), G.sub(B, V));
const angHTML = (a, b, c) => `<span class="ang">${a}${b}${c}</span>`;
const cm = (x) => `${fmt(x)} cm`;

/* ---------- Intersections et projections ---------- */
function interLL(a, b) {
  const den = G.cross(a.d, b.d);
  if (Math.abs(den) < 1e-9) return [];
  const w = G.sub(b.P, a.P);
  const t = G.cross(w, b.d) / den, s = G.cross(w, a.d) / den;
  const e = 1e-6;
  if (t < a.t0 - e || t > a.t1 + e || s < b.t0 - e || s > b.t1 + e) return [];
  return [G.add(a.P, G.mul(a.d, t))];
}
function interLC(l, c) {
  const f = G.sub(l.P, c.c);
  const A = G.dot(l.d, l.d), B = 2 * G.dot(f, l.d), C = G.dot(f, f) - c.r * c.r;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return [];
  const sq = Math.sqrt(disc), out = [];
  for (const t of [(-B - sq) / (2 * A), (-B + sq) / (2 * A)]) if (t >= l.t0 - 1e-6 && t <= l.t1 + 1e-6) out.push(G.add(l.P, G.mul(l.d, t)));
  return out;
}
function interCC(a, b) {
  const d = G.dist(a.c, b.c);
  if (d < 1e-9 || d > a.r + b.r + 1e-9 || d < Math.abs(a.r - b.r) - 1e-9) return [];
  const x = (d * d + a.r * a.r - b.r * b.r) / (2 * d);
  const h = Math.sqrt(Math.max(0, a.r * a.r - x * x));
  const u = G.norm(G.sub(b.c, a.c)), m = G.add(a.c, G.mul(u, x)), p = G.perp(u);
  return h < 1e-9 ? [m] : [G.add(m, G.mul(p, h)), G.sub(m, G.mul(p, h))];
}

/* =========================================================
   Planche de construction
   ========================================================= */
const TOOLS = [
  { id: 'seg', icon: '📏', label: 'Règle' },
  { id: 'circle', icon: '◯', label: 'Compas' },
  { id: 'angle', icon: '◠', label: 'Rapporteur' },
  { id: 'point', icon: '●', label: 'Point' },
  { id: 'line', icon: '⟷', label: 'Droite' },
  { id: 'perp', icon: '⊥', label: 'Équerre' },
  { id: 'pan', icon: '✋', label: 'Déplacer' },
];
const HELP = {
  seg: ['Règle : clique sur le point de départ.', 'Déplace, puis clique pour placer l\'extrémité.'],
  line: ['Droite : clique sur un premier point.', 'Clique sur un second point de la droite.'],
  circle: ['Compas : clique sur le centre.', 'Écarte le compas, puis clique pour tracer le cercle.'],
  angle: ['Rapporteur : clique sur le sommet de l\'angle (un point déjà placé).', 'Clique sur un point du côté de départ (le 0°).', 'Tourne jusqu\'à la bonne mesure, puis clique pour tracer la demi-droite.'],
  point: ['Point : clique pour placer un point. Il s\'accroche aux intersections.'],
  pan: ['Déplacer : fais glisser la feuille pour déplacer toute la figure (si elle sort du cadre).'],
  perp: ['Équerre : clique sur la droite ou le segment de référence.', 'Clique sur le point par lequel doit passer la perpendiculaire.'],
};

function createBoard(host, opts = {}) {
  const W = 16, H = 11;
  const st = { points: [], objs: [], hist: [], tool: 'seg', step: 0, tmp: {}, cur: null, next: null, adj: null, uid: 1 };
  const taskNames = opts.names || [];

  host.innerHTML = `<div class="geo">
    <div class="geo-tools" role="toolbar" aria-label="Instruments">
      ${TOOLS.map((t) => `<button type="button" class="tool" data-t="${t.id}">${t.icon}<span>${t.label}</span></button>`).join('')}
      <span class="sep"></span>
      <button type="button" class="tool" data-a="undo">↶<span>Annuler</span></button>
      <button type="button" class="tool" data-a="clear">✕<span>Effacer</span></button>
    </div>
    <div class="geo-names"></div>
    <div class="geo-status"><span class="geo-msg"></span><span class="geo-read"></span><span class="geo-adj" hidden><button type="button" data-d="-1" aria-label="Diminuer">−</button><button type="button" data-d="1" aria-label="Augmenter">+</button></span></div>
    <div class="geo-wrap"><svg class="geo-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Feuille de construction">
      <g class="g-grid"></g><g class="g-objs"></g><g class="g-prev"></g><g class="g-pts"></g></svg></div>
  </div>`;
  const svg = host.querySelector('.geo-svg');
  const gObjs = svg.querySelector('.g-objs'), gPts = svg.querySelector('.g-pts'), gPrev = svg.querySelector('.g-prev');
  const elMsg = host.querySelector('.geo-msg'), elRead = host.querySelector('.geo-read'), elAdj = host.querySelector('.geo-adj');
  const elNames = host.querySelector('.geo-names');

  // quadrillage léger (1 cm)
  let grid = '';
  for (let x = 1; x < W; x++) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" class="grid"/>`;
  for (let y = 1; y < H; y++) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" class="grid"/>`;
  svg.querySelector('.g-grid').innerHTML = grid;

  const pt = (id) => st.points.find((p) => p.id === id);
  const byName = (n) => st.points.find((p) => p.name === n);
  const used = (n) => st.points.some((p) => p.name === n);

  /* ----- noms des points ----- */
  function autoName() {
    const pool = [...taskNames, ...'ABCDEFGHIJKLMNPQRSTUVWXYZ'.split('')];
    return pool.find((n) => !used(n)) || 'P' + st.uid;
  }
  function takeName() {
    const n = st.next && !used(st.next) ? st.next : autoName();
    st.next = taskNames.find((x) => !used(x) && x !== n) || null;
    return n;
  }
  function renderNames() {
    if (!taskNames.length) { elNames.innerHTML = '<span>Les points sont nommés automatiquement.</span>'; return; }
    if (!st.next || used(st.next)) st.next = taskNames.find((x) => !used(x)) || null;
    elNames.innerHTML = `<span>Prochain point :</span>${taskNames.map((n) => `<button type="button" class="chip${st.next === n ? ' on' : ''}" data-n="${n}"${used(n) ? ' disabled' : ''}>${n}</button>`).join('')}${st.next ? '' : '<span>(lettres suivantes automatiques)</span>'}`;
  }
  elNames.addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b || b.disabled) return;
    st.next = b.dataset.n; renderNames();
  });

  function addPoint(x, y, created, locked = false, name = null) {
    const p = { id: st.uid++, x, y, name: name || takeName(), locked };
    st.points.push(p);
    if (created) created.push(p.id);
    return p;
  }

  /* ----- géométrie des objets ----- */
  function lin(o) {
    if (o.kind === 'seg') { const A = pt(o.a), B = pt(o.b); return { P: A, d: G.sub(B, A), t0: 0, t1: 1 }; }
    if (o.kind === 'line') { const A = pt(o.a), B = pt(o.b); return { P: A, d: G.sub(B, A), t0: -Infinity, t1: Infinity }; }
    if (o.kind === 'ray') return { P: pt(o.o), d: o.dir, t0: 0, t1: Infinity };
    if (o.kind === 'perp') return { P: pt(o.p), d: o.d, t0: -Infinity, t1: Infinity };
    return null;
  }
  const circ = (o) => ({ c: pt(o.c), r: o.r });
  function project(o, p) {
    if (o.kind === 'circle') { const c = circ(o); return G.add(c.c, G.mul(G.norm(G.sub(p, c.c)), c.r)); }
    const L = lin(o); const dd = G.dot(L.d, L.d); if (dd < 1e-12) return null;
    const t = clamp(G.dot(G.sub(p, L.P), L.d) / dd, L.t0, L.t1);
    return G.add(L.P, G.mul(L.d, t));
  }
  function intersections() {
    const out = [];
    for (let i = 0; i < st.objs.length; i++) for (let j = i + 1; j < st.objs.length; j++) {
      const a = st.objs[i], b = st.objs[j];
      const ca = a.kind === 'circle', cb = b.kind === 'circle';
      if (ca && cb) out.push(...interCC(circ(a), circ(b)));
      else if (ca) out.push(...interLC(lin(b), circ(a)));
      else if (cb) out.push(...interLC(lin(a), circ(b)));
      else out.push(...interLL(lin(a), lin(b)));
    }
    return out.filter((p) => p.x > -0.01 && p.y > -0.01 && p.x < W + 0.01 && p.y < H + 0.01);
  }
  const th = () => { const m = svg.getScreenCTM(); return 16 / (m ? m.a : 40); };
  function snap(p, o = {}) {
    const T = th();
    let best = null, bd = T;
    for (const q of st.points) { if (q.id === o.exclude) continue; const d = G.dist(p, q); if (d < bd) { bd = d; best = { x: q.x, y: q.y, type: 'point', pid: q.id }; } }
    if (best) return best;
    bd = T;
    for (const q of intersections()) { const d = G.dist(p, q); if (d < bd) { bd = d; best = { x: q.x, y: q.y, type: 'inter' }; } }
    if (best) return best;
    bd = T * 0.75;
    for (const ob of st.objs) { const pr = project(ob, p); if (!pr) continue; const d = G.dist(p, pr); if (d < bd) { bd = d; best = { x: pr.x, y: pr.y, type: 'on' }; } }
    if (best) return best;
    return { x: clamp(p.x, 0.1, W - 0.1), y: clamp(p.y, 0.1, H - 0.1), type: 'free' };
  }
  function nearestLinear(p) {
    let best = null, bd = th();
    for (const o of st.objs) { if (o.kind === 'circle') continue; const pr = project(o, p); const d = G.dist(p, pr); if (d < bd) { bd = d; best = o; } }
    return best;
  }

  /* ----- calculs propres à chaque instrument ----- */
  function rulerEnd(p) {
    const A = pt(st.tmp.a);
    const s = snap(p, { exclude: st.tmp.a });
    if (s.type === 'point' || s.type === 'inter') return { ...s, L: G.dist(A, s) };
    const v = G.sub(s, A), L = G.len(v);
    if (L < 1e-6) return { ...s, L: 0 };
    const Lr = Math.max(0.1, round1(L));
    const u = G.mul(v, 1 / L);
    return { x: A.x + u.x * Lr, y: A.y + u.y * Lr, type: s.type, L: Lr };
  }
  function compassR(p) {
    const C = pt(st.tmp.c);
    const s = snap(p, { exclude: st.tmp.c });
    if (s.type === 'point' || s.type === 'inter') return G.dist(C, s);
    return Math.max(0.1, round1(G.dist(C, p)));
  }
  function protract(p) {
    const O = pt(st.tmp.o), R = pt(st.tmp.ref);
    const v1 = G.norm(G.sub(R, O)), v = G.sub(p, O);
    if (G.len(v) < 0.15) return null;
    const ang = clamp(Math.round(angDeg(v1, v)), 0, 180);
    const sign = G.cross(v1, v) >= 0 ? 1 : -1;
    return { ang, sign, v1, dir: G.rot(v1, sign * ang) };
  }

  /* ----- actions ----- */
  function msg(t, warn = false) { elMsg.textContent = t; elMsg.classList.toggle('warn', warn); }
  function help() { msg(HELP[st.tool][st.step] || HELP[st.tool][0]); }
  function commit(ids) { st.hist.push(ids); st.adj = null; }
  function cancel() {
    if (st.step > 0 && st.tmp.created) {
      const ids = new Set(st.tmp.created);
      st.points = st.points.filter((p) => !ids.has(p.id));
    }
    st.step = 0; st.tmp = {};
  }
  function setTool(t) {
    cancel(); st.tool = t; st.adj = null;
    host.querySelectorAll('.tool[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    svg.classList.toggle('panning', t === 'pan');
    help(); render();
  }
  function startPoint(s) {
    if (s.pid) return s.pid;
    return addPoint(s.x, s.y, st.tmp.created).id;
  }

  function handle(p) {
    const t = st.tool;
    if (t === 'point') {
      const s = snap(p);
      if (s.type === 'point') { msg('Il y a déjà un point ici.', true); return; }
      const c = []; addPoint(s.x, s.y, c); commit(c); help(); render(); return;
    }
    if (t === 'seg' || t === 'line') {
      if (st.step === 0) { st.tmp = { created: [] }; st.tmp.a = startPoint(snap(p)); st.step = 1; help(); render(); return; }
      const e = t === 'seg' ? rulerEnd(p) : snap(p, { exclude: st.tmp.a });
      if (e.pid === st.tmp.a || G.dist(e, pt(st.tmp.a)) < 0.05) { msg('Choisis un autre point.', true); return; }
      const b = e.pid || addPoint(e.x, e.y, st.tmp.created).id;
      const o = { id: st.uid++, kind: t, a: st.tmp.a, b };
      st.objs.push(o); st.tmp.created.push(o.id);
      commit(st.tmp.created);
      if (t === 'seg' && !e.pid && e.type !== 'inter') st.adj = { kind: 'len', o };
      st.step = 0; st.tmp = {}; help(); render(); return;
    }
    if (t === 'circle') {
      if (st.step === 0) { st.tmp = { created: [] }; st.tmp.c = startPoint(snap(p)); st.step = 1; help(); render(); return; }
      const r = compassR(p);
      const o = { id: st.uid++, kind: 'circle', c: st.tmp.c, r };
      st.objs.push(o); st.tmp.created.push(o.id); commit(st.tmp.created);
      st.adj = { kind: 'rad', o }; st.step = 0; st.tmp = {}; help(); render(); return;
    }
    if (t === 'angle') {
      if (st.step === 0) {
        const s = snap(p); if (s.type !== 'point') { msg('Clique sur un point déjà placé : ce sera le sommet de l\'angle.', true); return; }
        st.tmp = { created: [], o: s.pid }; st.step = 1; help(); render(); return;
      }
      if (st.step === 1) {
        const s = snap(p, { exclude: st.tmp.o }); if (s.type !== 'point') { msg('Clique sur un autre point déjà placé, sur le côté de départ.', true); return; }
        st.tmp.ref = s.pid; st.step = 2; help(); render(); return;
      }
      const pr = protract(p); if (!pr) return;
      const o = { id: st.uid++, kind: 'ray', o: st.tmp.o, ref: st.tmp.ref, ang: pr.ang, sign: pr.sign, dir: pr.dir };
      st.objs.push(o); commit([o.id]); st.adj = { kind: 'ang', o };
      st.step = 0; st.tmp = {}; help(); render(); return;
    }
    if (t === 'perp') {
      if (st.step === 0) {
        const o = nearestLinear(p); if (!o) { msg('Clique sur un segment ou une droite déjà tracé.', true); return; }
        st.tmp = { created: [], l: o.id }; st.step = 1; help(); render(); return;
      }
      const ref = st.objs.find((o) => o.id === st.tmp.l);
      const s = snap(p);
      const pid = startPoint(s);
      const o = { id: st.uid++, kind: 'perp', p: pid, d: G.perp(G.norm(lin(ref).d)) };
      st.objs.push(o); st.tmp.created.push(o.id); commit(st.tmp.created);
      st.step = 0; st.tmp = {}; help(); render();
    }
  }

  function undo() {
    if (st.step > 0) { cancel(); help(); render(); return; }
    const ids = st.hist.pop(); if (!ids) return;
    const s = new Set(ids);
    st.objs = st.objs.filter((o) => !s.has(o.id));
    st.points = st.points.filter((p) => !s.has(p.id));
    st.adj = null; render();
  }
  function clearAll() {
    cancel();
    st.objs = st.objs.filter((o) => o.locked);
    st.points = st.points.filter((p) => p.locked);
    st.hist = []; st.adj = null; render();
  }
  function adjust(d) {
    const a = st.adj; if (!a) return;
    if (a.kind === 'len') {
      const A = pt(a.o.a), B = pt(a.o.b);
      const L = round1(G.dist(A, B) + d * 0.1); if (L < 0.1) return;
      const u = G.norm(G.sub(B, A)); B.x = A.x + u.x * L; B.y = A.y + u.y * L;
    } else if (a.kind === 'rad') {
      a.o.r = Math.max(0.1, round1(a.o.r + d * 0.1));
    } else if (a.kind === 'ang') {
      a.o.ang = clamp(a.o.ang + d, 1, 179);
      a.o.dir = G.rot(G.norm(G.sub(pt(a.o.ref), pt(a.o.o))), a.o.sign * a.o.ang);
    }
    render();
  }

  /* ----- affichage ----- */
  const L2 = (a, b, cls) => `<line x1="${a.x.toFixed(3)}" y1="${a.y.toFixed(3)}" x2="${b.x.toFixed(3)}" y2="${b.y.toFixed(3)}" class="${cls}"/>`;
  const far = (P, d, k) => G.add(P, G.mul(G.norm(d), k));
  function objSVG(o, cls) {
    if (o.kind === 'circle') { const c = circ(o); return `<circle cx="${c.c.x}" cy="${c.c.y}" r="${c.r}" class="${cls || 'g-circ'}"/>`; }
    const L = lin(o);
    if (o.kind === 'seg') return L2(L.P, G.add(L.P, L.d), cls || (o.locked ? 'g-given' : 'g-seg'));
    if (o.kind === 'ray') return L2(L.P, far(L.P, L.d, 40), cls || 'g-ray');
    return L2(far(L.P, L.d, -40), far(L.P, L.d, 40), cls || 'g-line');
  }
  function readout() {
    const a = st.adj;
    if (a && st.step === 0) {
      elAdj.hidden = false;
      if (a.kind === 'len') elRead.textContent = `Longueur : ${cm(G.dist(pt(a.o.a), pt(a.o.b)))}`;
      if (a.kind === 'rad') elRead.textContent = `Rayon : ${cm(a.o.r)}`;
      if (a.kind === 'ang') elRead.textContent = `Angle : ${a.o.ang}°`;
    } else if (st.step === 0) { elAdj.hidden = true; elRead.textContent = ''; }
    else elAdj.hidden = true;
  }
  function render() {
    gObjs.innerHTML = st.objs.map((o) => objSVG(o)).join('');
    const all = st.points;
    const c = all.length ? { x: all.reduce((s, p) => s + p.x, 0) / all.length, y: all.reduce((s, p) => s + p.y, 0) / all.length } : { x: 8, y: 5 };
    gPts.innerHTML = all.map((p) => {
      let d = G.sub(p, c); d = G.len(d) < 0.3 ? { x: 0.3, y: -1 } : d;
      const l = G.add(p, G.mul(G.norm(d), 0.42));
      return `<circle cx="${p.x}" cy="${p.y}" r="0.075" class="g-pt"/><text x="${l.x}" y="${l.y}" class="g-lbl">${p.name}</text>`;
    }).join('');
    renderNames(); readout(); preview();
  }
  function preview() {
    const p = st.cur;
    let s = '';
    if (st.step > 0) {
      const A = pt(st.tmp.a || st.tmp.c || st.tmp.o);
      if (A) s += `<circle cx="${A.x}" cy="${A.y}" r="0.22" class="pv-ring"/>`;
    }
    if (!p) { gPrev.innerHTML = s; return; }
    const t = st.tool;
    if ((t === 'seg' || t === 'line') && st.step === 1) {
      const A = pt(st.tmp.a);
      if (t === 'seg') {
        const e = rulerEnd(p);
        s += L2(A, e, 'pv') + `<circle cx="${e.x}" cy="${e.y}" r="0.09" class="snap"/>`;
        const m = G.mid(A, e), n = G.norm(G.perp(G.sub(e, A)));
        const lp = G.add(m, G.mul(n, -0.45));
        s += `<text x="${lp.x}" y="${lp.y}" class="pv-txt">${cm(e.L)}</text>`;
        elRead.textContent = `Longueur : ${cm(e.L)}`;
      } else {
        const e = snap(p, { exclude: st.tmp.a });
        if (G.dist(A, e) > 0.05) s += L2(far(A, G.sub(e, A), -40), far(A, G.sub(e, A), 40), 'pv-dash');
        elRead.textContent = '';
      }
    } else if (t === 'circle' && st.step === 1) {
      const C = pt(st.tmp.c), r = compassR(p);
      const e = G.add(C, G.mul(G.norm(G.sub(p, C)), r));
      s += `<circle cx="${C.x}" cy="${C.y}" r="${r}" class="pv"/>` + L2(C, e, 'pv-dash');
      elRead.textContent = `Rayon : ${cm(r)}`;
    } else if (t === 'angle' && st.step === 2) {
      const pr = protract(p);
      const O = pt(st.tmp.o);
      if (pr) {
        const R = 2.6, sg = pr.sign;
        const a0 = G.add(O, G.mul(pr.v1, R)), a1 = G.add(O, G.mul(pr.v1, -R));
        s += `<path d="M${a0.x} ${a0.y} A ${R} ${R} 0 0 ${sg > 0 ? 1 : 0} ${a1.x} ${a1.y} Z" class="prot"/>`;
        for (let k = 0; k <= 180; k += 10) {
          const u = G.rot(pr.v1, sg * k), r0 = k % 30 === 0 ? 2.2 : 2.4;
          s += L2(G.add(O, G.mul(u, r0)), G.add(O, G.mul(u, R)), 'prot-tk');
          if (k % 30 === 0) { const q = G.add(O, G.mul(u, 1.95)); s += `<text x="${q.x}" y="${q.y}" class="prot-txt">${k}</text>`; }
        }
        s += L2(O, far(O, pr.dir, 40), 'pv');
        const q = G.add(O, G.mul(G.norm(G.add(pr.v1, pr.dir)), 1.2));
        s += `<text x="${q.x}" y="${q.y}" class="pv-txt">${pr.ang}°</text>`;
        elRead.textContent = `Angle : ${pr.ang}°`;
      }
    } else if (t === 'angle' && st.step === 1) {
      const sp = snap(p, { exclude: st.tmp.o });
      if (sp.type === 'point') s += L2(pt(st.tmp.o), sp, 'pv-dash');
    } else if (t === 'perp' && st.step === 0) {
      const o = nearestLinear(p); if (o) s += objSVG(o, 'hl');
    } else if (t === 'perp' && st.step === 1) {
      const ref = st.objs.find((o) => o.id === st.tmp.l);
      const sp = snap(p);
      s += objSVG(ref, 'hl');
      const d = G.perp(G.norm(lin(ref).d));
      s += L2(far(sp, d, -40), far(sp, d, 40), 'pv-dash');
    }
    if (st.step === 0 && t !== 'perp') {
      const sp = snap(p);
      if (sp.type === 'point' || sp.type === 'inter') s += `<circle cx="${sp.x}" cy="${sp.y}" r="0.12" class="snap"/>`;
    }
    gPrev.innerHTML = s;
  }

  /* ----- souris et doigt ----- */
  function toCm(e) {
    const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY;
    const r = q.matrixTransform(m.inverse()); return { x: r.x, y: r.y };
  }
  let down = null;
  svg.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;
    e.preventDefault();
    try { svg.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
    const p = toCm(e); st.cur = p;
    if (st.tool === 'pan') { down = { p, pan: true }; svg.classList.add('grabbing'); return; }
    down = { p, started: st.step === 0 };
    if (st.step === 0) handle(p);
  });
  svg.addEventListener('pointermove', (e) => {
    st.cur = toCm(e);
    if (down && down.pan) {
      const dx = st.cur.x - down.p.x, dy = st.cur.y - down.p.y;
      st.points.forEach((q) => { q.x += dx; q.y += dy; });
      down.p = st.cur; render(); return;
    }
    preview();
  });
  svg.addEventListener('pointerup', (e) => {
    if (!down) return;
    if (down.pan) { down = null; svg.classList.remove('grabbing'); return; }
    const p = toCm(e); st.cur = p;
    const moved = G.dist(p, down.p) > 0.35;
    if (!down.started) handle(p);
    else if (moved && st.step > 0) handle(p);
    down = null;
  });
  svg.addEventListener('pointerleave', () => { if (!down) { st.cur = null; preview(); } });

  host.querySelector('.geo-tools').addEventListener('click', (e) => {
    const b = e.target.closest('.tool'); if (!b) return;
    if (b.dataset.t) setTool(b.dataset.t);
    else if (b.dataset.a === 'undo') undo();
    else if (b.dataset.a === 'clear') clearAll();
  });
  elAdj.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) adjust(Number(b.dataset.d)); });

  /* ----- éléments imposés par l'énoncé ----- */
  if (opts.given) {
    (opts.given.points || []).forEach((g) => addPoint(g.x, g.y, null, true, g.name));
    (opts.given.segs || []).forEach(([a, b]) => st.objs.push({ id: st.uid++, kind: 'seg', a: byName(a).id, b: byName(b).id, locked: true }));
  }
  setTool(opts.tool || 'seg');

  /* ----- API pour la correction ----- */
  return {
    byName,
    hasSeg(n1, n2) {
      const a = byName(n1), b = byName(n2); if (!a || !b) return false;
      return st.objs.some((o) => o.kind === 'seg' && ((o.a === a.id && o.b === b.id) || (o.a === b.id && o.b === a.id)));
    },
    linears(includeLocked = false) {
      return st.objs.filter((o) => o.kind !== 'circle' && (includeLocked || !o.locked)).map((o) => ({ kind: o.kind, ...lin(o) }));
    },
    drawnCount: () => st.hist.length,
  };
}

/** distance d'un point à la droite qui porte l'objet linéaire */
const distToLine = (L, p) => Math.abs(G.cross(G.norm(L.d), G.sub(p, L.P)));
/** distance d'un point à l'objet (segment ou demi-droite compris) */
function distToObj(L, p) {
  const dd = G.dot(L.d, L.d);
  const t = clamp(G.dot(G.sub(p, L.P), L.d) / dd, L.t0, L.t1);
  return G.dist(p, G.add(L.P, G.mul(L.d, t)));
}
const ok = (b) => (b ? '✔' : '✘');

/* =========================================================
   Petites figures (fiche et corrections) — unités en cm
   ========================================================= */
function figure(pts, items, { pad = 0.9, labels = true, center = null, extra = [] } = {}) {
  const P = Object.values(pts).concat(extra);
  const minx = Math.min(...P.map((p) => p.x)) - pad, maxx = Math.max(...P.map((p) => p.x)) + pad;
  const miny = Math.min(...P.map((p) => p.y)) - pad, maxy = Math.max(...P.map((p) => p.y)) + pad;
  const c = center || { x: P.reduce((s, p) => s + p.x, 0) / P.length, y: P.reduce((s, p) => s + p.y, 0) / P.length };
  let lbl = '';
  if (labels) {
    for (const [n, p] of Object.entries(pts)) {
      if (n.startsWith('_')) continue;
      const u = G.len(G.sub(p, c)) < 0.2 ? { x: 0, y: -1 } : G.norm(G.sub(p, c));
      const q = G.add(p, G.mul(u, 0.42));
      lbl += `<circle cx="${p.x}" cy="${p.y}" r="0.06" class="f-pt"/><text x="${q.x}" y="${q.y}" class="f-lbl">${n}</text>`;
    }
  }
  const k = Math.max(1, (maxx - minx) / 8.5).toFixed(2);
  return `<svg class="fig" style="--k:${k}" viewBox="${minx.toFixed(2)} ${miny.toFixed(2)} ${(maxx - minx).toFixed(2)} ${(maxy - miny).toFixed(2)}" role="img" aria-label="Figure">${items.join('')}${lbl}</svg>`;
}
const F2 = {
  seg: (a, b, c = 'f-seg') => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${c}"/>`,
  xline: (p, d, c = 'f-red', k = 30) => { const u = G.norm(d); return F2.seg(G.sub(p, G.mul(u, k)), G.add(p, G.mul(u, k)), c); },
  circle: (c, r, cls = 'f-circ') => `<circle cx="${c.x}" cy="${c.y}" r="${r}" class="${cls}"/>`,
  arcAround: (c, r, toward, spread = 18, cls = 'f-arc') => {
    const u = G.norm(G.sub(toward, c));
    const a = G.add(c, G.mul(G.rot(u, -spread), r)), b = G.add(c, G.mul(G.rot(u, spread), r));
    return `<path d="M${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}" class="${cls}"/>`;
  },
  angle: (V, A, B, label, r = 0.7) => {
    const u = G.norm(G.sub(A, V)), w = G.norm(G.sub(B, V));
    const a = G.add(V, G.mul(u, r)), b = G.add(V, G.mul(w, r));
    const sweep = G.cross(u, w) > 0 ? 1 : 0;
    const bis = G.norm(G.add(u, w)), t = G.add(V, G.mul(bis, r + 0.45));
    return `<path d="M${a.x} ${a.y} A ${r} ${r} 0 0 ${sweep} ${b.x} ${b.y}" class="f-arc"/>` + (label ? `<text x="${t.x}" y="${t.y}" class="f-len">${label}</text>` : '');
  },
  right: (f, u, v, s = 0.28) => {
    const a = G.add(f, G.mul(G.norm(u), s)), b = G.add(a, G.mul(G.norm(v), s)), c = G.add(f, G.mul(G.norm(v), s));
    return `<path d="M${a.x} ${a.y} L${b.x} ${b.y} L${c.x} ${c.y}" class="f-mark"/>`;
  },
  ticks: (a, b, n = 2) => {
    const m = G.mid(a, b), u = G.norm(G.sub(b, a)), v = G.perp(u);
    let s = '';
    for (let i = 0; i < n; i++) {
      const o = G.add(m, G.mul(u, (i - (n - 1) / 2) * 0.12));
      s += F2.seg(G.add(G.add(o, G.mul(v, 0.16)), G.mul(u, 0.05)), G.sub(G.sub(o, G.mul(v, 0.16)), G.mul(u, 0.05)), 'f-mark');
    }
    return s;
  },
  len: (a, b, txt, c) => {
    const m = G.mid(a, b);
    let n = G.norm(G.perp(G.sub(b, a)));
    if (c && G.dot(n, G.sub(m, c)) < 0) n = G.mul(n, -1);
    const q = G.add(m, G.mul(n, 0.38));
    return `<text x="${q.x}" y="${q.y}" class="f-len">${txt}</text>`;
  },
};
const centroid = (...p) => ({ x: p.reduce((s, q) => s + q.x, 0) / p.length, y: p.reduce((s, q) => s + q.y, 0) / p.length });

/* ---------- Triangles à partir des données ---------- */
function tri3c(a, b, c) { // côtés : PQ = c, PR = b, QR = a
  const P = { x: 0, y: 0 }, Q = { x: c, y: 0 };
  const x = (c * c + b * b - a * a) / (2 * c);
  return [P, Q, { x, y: -Math.sqrt(Math.max(0, b * b - x * x)) }];
}
function tri2c1a(l1, l2, theta) { // X, V, Y avec VX = l1, VY = l2, angle en V
  const r = (theta * Math.PI) / 180;
  return [{ x: l1, y: 0 }, { x: 0, y: 0 }, { x: l2 * Math.cos(r), y: -l2 * Math.sin(r) }];
}
function tri1c2a(L, al, be) { // E, F, G : EF = L, angle en E = al, en F = be
  const r = (d) => (d * Math.PI) / 180;
  const EG = (L * Math.sin(r(be))) / Math.sin(r(al + be));
  return [{ x: 0, y: 0 }, { x: L, y: 0 }, { x: EG * Math.cos(r(al)), y: -EG * Math.sin(r(al)) }];
}

const NAMESETS = [['A', 'B', 'C'], ['D', 'E', 'F'], ['E', 'F', 'G'], ['R', 'S', 'T'], ['M', 'N', 'P'], ['I', 'J', 'K'], ['L', 'M', 'N'], ['U', 'V', 'W']];

/** Énoncé + figure de correction pour chaque type de construction */
function makeConstruction(mode) {
  const type = mode || pick(['3c', '2c1a', '1c2a']);
  const set = pick(NAMESETS);
  const tri = set.join('');
  if (type === '3c') {
    let a, b, c;
    for (;;) {
      a = rand(6, 18) / 2; b = rand(6, 18) / 2; c = rand(8, 18) / 2;
      const m = Math.max(a, b, c);
      if (m >= a + b + c - m - 0.8) continue;
      const T = tri3c(a, b, c);
      if (Math.min(angleAt(T[1], T[0], T[2]), angleAt(T[0], T[1], T[2]), angleAt(T[0], T[2], T[1])) < 25) continue;
      break;
    }
    const [P, Q, R] = set;
    const T = tri3c(a, b, c), ctr = centroid(...T);
    return {
      type, names: [P, Q, R],
      text: `Trace le triangle ${tri} tel que ${P}${Q} = ${cm(c)}, ${P}${R} = ${cm(b)} et ${Q}${R} = ${cm(a)}.`,
      sides: [[P, Q, c], [P, R, b], [Q, R, a]], angles: [],
      scene: () => scene3c([P, Q, R], T, { a, b, c }),
      method: [`Trace le segment [${P}${Q}] de ${cm(c)}.`, `Au compas, trace un arc de centre ${P} et de rayon ${cm(b)}.`, `Trace un arc de centre ${Q} et de rayon ${cm(a)}.`, `${R} est à l'intersection des deux arcs : place-le avec l'outil Point, puis trace [${P}${R}] et [${Q}${R}].`],
      fig: () => figure({ [P]: T[0], [Q]: T[1], [R]: T[2] }, [
        F2.arcAround(T[0], b, T[2]), F2.arcAround(T[1], a, T[2]),
        F2.seg(T[0], T[1]), F2.seg(T[0], T[2]), F2.seg(T[1], T[2]),
        F2.len(T[0], T[1], cm(c), ctr), F2.len(T[0], T[2], cm(b), ctr), F2.len(T[1], T[2], cm(a), ctr)]),
    };
  }
  if (type === '2c1a') {
    let l1, l2, th;
    for (;;) {
      l1 = rand(8, 16) / 2; l2 = rand(6, 14) / 2; th = rand(6, 28) * 5;
      const T = tri2c1a(l1, l2, th);
      if (Math.min(angleAt(T[1], T[0], T[2]), angleAt(T[0], T[2], T[1])) < 18) continue;
      break;
    }
    const vi = rand(0, 2), V = set[vi], [X, Y] = set.filter((_, i) => i !== vi);
    const T = tri2c1a(l1, l2, th), ctr = centroid(...T);
    return {
      type, names: [X, V, Y],
      text: `Trace le triangle ${tri} tel que ${X}${V} = ${cm(l1)}, ${Y}${V} = ${cm(l2)} et ${angHTML(X, V, Y)} = ${th}°.`,
      sides: [[X, V, l1], [Y, V, l2]], angles: [[X, V, Y, th]], segs: [[X, V], [V, Y], [X, Y]],
      scene: () => scene2c1a([X, V, Y], T, { l1, l2, th }),
      method: [`Trace le segment [${X}${V}] de ${cm(l1)}.`, `Rapporteur : clique sur ${V} (le sommet), puis sur ${X} (le 0°), tourne jusqu'à ${th}° et clique.`, `Avec la règle, pars de ${V} le long de la demi-droite et place ${Y} à ${cm(l2)}.`, `Trace [${X}${Y}].`],
      fig: () => figure({ [X]: T[0], [V]: T[1], [Y]: T[2] }, [
        F2.seg(T[0], T[1]), F2.seg(T[1], T[2]), F2.seg(T[0], T[2]),
        F2.angle(T[1], T[0], T[2], `${th}°`), F2.len(T[1], T[0], cm(l1), ctr), F2.len(T[1], T[2], cm(l2), ctr)]),
    };
  }
  let L, al, be;
  for (;;) {
    L = rand(10, 18) / 2; al = rand(5, 24) * 5; be = rand(5, 24) * 5;
    if (al + be > 150) continue;
    const T = tri1c2a(L, al, be);
    if (-T[2].y > 9.5 || Math.abs(T[2].x) > 13 || T[2].x > L + 5) continue;
    break;
  }
  const [E, F, Gn] = set;
  const T = tri1c2a(L, al, be), ctr = centroid(...T);
  return {
    type, names: [E, F, Gn],
    text: `Trace le triangle ${tri} tel que ${E}${F} = ${cm(L)}, ${angHTML(F, E, Gn)} = ${al}° et ${angHTML(E, F, Gn)} = ${be}°.`,
    sides: [[E, F, L]], angles: [[F, E, Gn, al], [E, F, Gn, be]],
    scene: () => scene1c2a([E, F, Gn], T, { L, al, be }),
    method: [`Trace le segment [${E}${F}] de ${cm(L)}.`, `Rapporteur : clique sur ${E}, puis sur ${F}, et trace la demi-droite à ${al}°.`, `Rapporteur : clique sur ${F}, puis sur ${E}, et trace la demi-droite à ${be}°, <b>du même côté</b>.`, `${Gn} est à l'intersection des deux demi-droites : place-le, puis trace [${E}${Gn}] et [${F}${Gn}].`],
    fig: () => figure({ [E]: T[0], [F]: T[1], [Gn]: T[2] }, [
      F2.seg(T[0], T[1]), F2.seg(T[0], T[2]), F2.seg(T[1], T[2]),
      F2.angle(T[0], T[1], T[2], `${al}°`), F2.angle(T[1], T[0], T[2], `${be}°`), F2.len(T[0], T[1], cm(L), ctr)]),
  };
}

function checkTriangle(board, spec, brief = false) {
  const pts = spec.names.map((n) => board.byName(n));
  if (!board.drawnCount()) return null;
  const miss = spec.names.filter((n, i) => !pts[i]);
  if (miss.length) return { retry: true, msg: `Il manque ${miss.length > 1 ? 'les points' : 'le point'} ${miss.join(', ')}. Choisis la lettre dans « Prochain point » avant de placer un point.` };
  const items = [];
  let allOk = true;
  const segs = spec.segs || [[spec.names[0], spec.names[1]], [spec.names[0], spec.names[2]], [spec.names[1], spec.names[2]]];
  for (const [a, b] of segs) {
    const has = board.hasSeg(a, b);
    if (!has) { allOk = false; items.push(`✘ Le côté [${a}${b}] n'est pas tracé à la règle.`); }
  }
  for (const [a, b, L] of spec.sides) {
    const d = G.dist(board.byName(a), board.byName(b));
    const good = Math.abs(d - L) <= 0.15; allOk = allOk && good;
    items.push(`${ok(good)} ${a}${b} = ${cm(round1(d))}${good ? '' : ` (il fallait ${cm(L)})`}`);
  }
  for (const [a, v, b, A] of spec.angles) {
    const m = angleAt(board.byName(a), board.byName(v), board.byName(b));
    const good = Math.abs(m - A) <= 2; allOk = allOk && good;
    items.push(`${ok(good)} ${angHTML(a, v, b)} = ${Math.round(m)}°${good ? '' : ` (il fallait ${A}°)`}`);
  }
  if (!spec.angles.length || spec.sides.length < 3) {
    // contrôle supplémentaire : le dernier côté doit être cohérent (évite les triangles « au hasard »)
  }
  if (brief) return { ok: allOk, partial: `Voici ce que mesure ta figure :<ul class="fb-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>Utilise <b>↶ Annuler</b> pour reprendre ce qui ne va pas.` };
  let msg = `<ul class="fb-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
  if (!allOk) msg += `<b>Méthode :</b><ol class="method">${spec.method.map((m) => `<li>${m}</li>`).join('')}</ol>${spec.fig()}`;
  else msg += 'Ta construction est juste !';
  return { ok: allOk, msg };
}

/** Exercice de construction (mode : '', '3c', '2c1a', '1c2a') */
let CONSTRUCT_MODE = '';
function genConstruire() {
  const spec = makeConstruction(CONSTRUCT_MODE);
  return {
    hints: constructHints(spec.type),
    anim: spec.scene,
    example: () => makeConstruction(spec.type).scene(),
    remediate(r) { const res = checkTriangle(r._board, spec, true); return res && res.partial && !res.ok ? res.partial : null; },
    q: `<p class="statement">${spec.text}</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { names: spec.names }); },
    check(r) { return checkTriangle(r._board, spec); },
  };
}

/* ---------- Triangle « donné » pour tracer des droites ---------- */
function placedTriangle() {
  for (;;) {
    const L = (rand(25, 45) * 2) / 10, be = rand(45, 80), ga = rand(45, 80);
    if (be + ga > 140) continue;
    const T = tri1c2a(L, be, ga); // B, C, A
    if (-T[2].y > 7) continue;
    const phi = rand(-20, 20), c = centroid(...T);
    const place = (p) => G.add({ x: 8, y: 6 }, G.rot(G.sub(p, c), phi));
    const [B, C, A] = T.map(place);
    if ([A, B, C].some((p) => p.x < 1 || p.x > 15 || p.y < 1 || p.y > 10)) continue;
    return { A, B, C, L };
  }
}

function genTraceMediatrice() {
  const set = pick([['A', 'B'], ['E', 'F'], ['M', 'N'], ['R', 'S']]);
  const L = (rand(20, 40) * 2) / 10, phi = rand(-35, 35);
  const u = G.rot({ x: 1, y: 0 }, phi), C = { x: 8, y: 5.5 };
  const A = G.sub(C, G.mul(u, L / 2)), B = G.add(C, G.mul(u, L / 2));
  const [nA, nB] = set;
  const names = ['I', 'J', 'K'].filter((n) => !set.includes(n));
  return {
    hints: [
      `Relis la définition de la médiatrice d'un segment dans ${ficheLink('triangles')}. Quelles sont ses deux caractéristiques ?`,
      'Outil : tous les points de la médiatrice sont à égale distance des deux extrémités du segment. Quel instrument permet de trouver des points situés à la même distance de deux points ?',
      'Clique sur « 🎬 Voir un exemple » pour voir la méthode sur un autre segment.',
    ],
    anim: () => sceneMediatrice([nA, nB], A, B, names),
    example: () => { const v = G.rot({ x: 1, y: 0 }, rand(-30, 30)), c = { x: 0, y: 0 }, l = rand(4, 7); return sceneMediatrice(['E', 'F'], G.sub(c, G.mul(v, l / 2)), G.add(c, G.mul(v, l / 2)), ['K', 'L']); },
    remediate(r) {
      const lins = r._board.linears(); if (!lins.length) return null;
      const M = G.mid(A, B);
      const thr = (Lx) => distToLine(Lx, M) <= 0.15, per = (Lx) => Math.abs(angDeg(Lx.d, G.sub(B, A)) - 90) <= 2;
      if (lins.some((Lx) => thr(Lx) && per(Lx))) return null;
      if (lins.some((Lx) => thr(Lx))) return `Ta droite passe bien par le milieu de [${nA}${nB}], mais elle n'est pas perpendiculaire à [${nA}${nB}].`;
      if (lins.some((Lx) => per(Lx))) return `Ta droite est bien perpendiculaire à [${nA}${nB}], mais passe-t-elle par son milieu ?`;
      return null;
    },
    q: `<p class="statement">Trace la <b>médiatrice</b> du segment [${nA}${nB}] (${nA}${nB} = ${cm(L)}).</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { names, tool: 'circle', given: { points: [{ name: nA, ...A }, { name: nB, ...B }], segs: [[nA, nB]] } }); },
    check(r) {
      const b = r._board, lins = b.linears();
      if (!lins.length) return b.drawnCount() ? { retry: true, msg: 'Trace la médiatrice avec l\'outil Droite (ou l\'Équerre) une fois les points de construction placés.' } : null;
      const M = G.mid(A, B);
      const good = lins.some((Lx) => distToLine(Lx, M) <= 0.15 && Math.abs(angDeg(Lx.d, G.sub(B, A)) - 90) <= 2);
      const msg = good ? 'Ta droite est bien perpendiculaire à [' + nA + nB + '] et passe par son milieu.'
        : `La médiatrice doit être <b>perpendiculaire</b> à [${nA}${nB}] et passer par son <b>milieu</b>.<b> Méthode :</b><ol class="method"><li>Compas : cercle de centre ${nA}, de rayon plus grand que la moitié de ${nA}${nB} (par exemple ${cm(round1(L * 0.75))}).</li><li>Même rayon, cercle de centre ${nB}.</li><li>Place les deux points d'intersection des cercles.</li><li>Outil Droite : trace la droite qui passe par ces deux points.</li></ol>${figure({ [nA]: A, [nB]: B }, [F2.circle(A, L * 0.75, 'f-thin'), F2.circle(B, L * 0.75, 'f-thin'), F2.seg(A, B), F2.xline(M, G.perp(u), 'f-red', 3), F2.right(M, u, G.perp(u)), F2.ticks(A, M), F2.ticks(M, B)], { extra: [G.add(M, G.mul(G.perp(u), 2.2)), G.sub(M, G.mul(G.perp(u), 2.2))] })}`;
      return { ok: good, msg };
    },
  };
}

function genTraceDroite() {
  const kind = pick(['hauteur', 'médiane']);
  const set = pick(NAMESETS);
  const [nA, nB, nC] = shuffle([...set]);
  const { A, B, C, L } = placedTriangle();
  const extra = kind === 'médiane' ? ['I', 'K'] : ['H', 'K'];
  const names = extra.filter((n) => !set.includes(n)).concat(['X', 'Y'].filter((n) => !set.includes(n))).slice(0, 2);
  const tri = [nA, nB, nC].sort().join('');
  const BC = G.sub(C, B), M = G.mid(B, C);
  const foot = G.add(B, G.mul(G.norm(BC), G.dot(G.sub(A, B), G.norm(BC))));
  return {
    hints: kind === 'médiane'
      ? [`Relis la définition d'une médiane dans ${ficheLink('triangles')} : par quels deux points passe-t-elle ?`, 'Outil : pour trouver le milieu d\'un segment, on mesure sa longueur et on la divise par 2.', 'Clique sur « 🎬 Voir un exemple » pour voir la méthode dans un autre triangle.']
      : [`Relis la définition d'une hauteur dans ${ficheLink('triangles')} : par quel point passe-t-elle, et quelle est sa position par rapport au côté opposé ?`, 'Outil : l\'Équerre trace une perpendiculaire. On choisit d\'abord la droite de référence, puis le point par lequel elle doit passer.', 'Clique sur « 🎬 Voir un exemple » pour voir la méthode dans un autre triangle.'],
    example: () => { const t = placedTriangle(); return kind === 'médiane' ? sceneMediane(['D', 'E', 'F'], t.A, t.B, t.C, t.L, 'K') : sceneHauteur(['D', 'E', 'F'], t.A, t.B, t.C, 'K'); },
    remediate(r) {
      const lins = r._board.linears(); if (!lins.length) return null;
      const viaA = (Lx) => distToLine(Lx, A) <= 0.12;
      if (kind === 'médiane') {
        const viaM = (Lx) => distToLine(Lx, M) <= 0.15;
        if (lins.some((Lx) => viaA(Lx) && viaM(Lx))) return null;
        if (lins.some(viaA)) return `Ta droite passe bien par ${nA}. Mais passe-t-elle par le milieu de [${nB}${nC}] ? Vérifie avec la règle.`;
        if (lins.some(viaM)) return `Ta droite passe par le milieu de [${nB}${nC}]. Mais une médiane passe aussi par un sommet : lequel ?`;
        return null;
      }
      const per = (Lx) => Math.abs(angDeg(Lx.d, BC) - 90) <= 2;
      if (lins.some((Lx) => viaA(Lx) && per(Lx))) return null;
      if (lins.some(viaA)) return `Ta droite passe bien par ${nA}, mais elle n'est pas perpendiculaire à (${nB}${nC}). Quel instrument trace une perpendiculaire ?`;
      if (lins.some(per)) return `Ta droite est bien perpendiculaire à (${nB}${nC}), mais elle ne passe pas par le sommet ${nA}.`;
      return null;
    },
    anim: () => (kind === 'médiane' ? sceneMediane([nA, nB, nC], A, B, C, L, names[0]) : sceneHauteur([nA, nB, nC], A, B, C, names[0])),
    q: `<p class="statement">Dans le triangle ${tri}, trace la <b>${kind}</b> issue de ${nA}${kind === 'médiane' ? ` (${nB}${nC} = ${cm(L)})` : ''}.</p><div class="board"></div>`,
    mount(r) {
      r._board = createBoard(r.querySelector('.board'), {
        names, tool: kind === 'hauteur' ? 'perp' : 'seg',
        given: { points: [{ name: nA, ...A }, { name: nB, ...B }, { name: nC, ...C }], segs: [[nA, nB], [nB, nC], [nA, nC]] },
      });
    },
    check(r) {
      const b = r._board, lins = b.linears();
      if (!lins.length) return null;
      let good;
      if (kind === 'médiane') good = lins.some((Lx) => distToLine(Lx, A) <= 0.12 && distToLine(Lx, M) <= 0.15 && G.dist(A, M) > 0.5);
      else good = lins.some((Lx) => distToLine(Lx, A) <= 0.12 && Math.abs(angDeg(Lx.d, BC) - 90) <= 2);
      const pts = { [nA]: A, [nB]: B, [nC]: C };
      const base = [F2.seg(A, B), F2.seg(B, C), F2.seg(A, C)];
      const figKind = kind === 'médiane'
        ? figure(pts, [...base, F2.seg(A, M, 'f-red'), F2.ticks(B, M), F2.ticks(M, C)])
        : figure(pts, [...base, F2.seg(A, foot, 'f-red'), F2.right(foot, G.sub(C, B), G.sub(A, foot))]);
      const method = kind === 'médiane'
        ? `<ol class="method"><li>${nB}${nC} = ${cm(L)}, donc le milieu est à ${cm(L / 2)} de ${nB}.</li><li>Règle : pars de ${nB}, glisse le long de [${nB}${nC}] et arrête-toi à ${cm(L / 2)} : c'est le milieu.</li><li>Trace le segment qui relie ${nA} à ce milieu.</li></ol>`
        : `<ol class="method"><li>Équerre : clique sur le côté [${nB}${nC}] (le côté opposé à ${nA}).</li><li>Clique sur ${nA} : la perpendiculaire à (${nB}${nC}) passant par ${nA} est tracée.</li></ol>`;
      return {
        ok: good,
        msg: good ? `C'est bien la ${kind} issue de ${nA}.`
          : `La ${kind} issue de ${nA} passe par ${nA} et ${kind === 'médiane' ? `par le <b>milieu</b> de [${nB}${nC}]` : `est <b>perpendiculaire</b> au côté opposé [${nB}${nC}]`}.<b> Méthode :</b>${method}${figKind}`,
      };
    },
  };
}

/* ---------- Exercices sans tracé ---------- */
function genInegalite() {
  const kind = pick(['ok', 'ok', 'non', 'plat']);
  let a, b, c;
  a = rand(4, 18) / 2; b = rand(4, 18) / 2;
  if (kind === 'ok') { const lo = Math.abs(a - b) + 0.5, hi = a + b - 0.5; c = Math.round(rand(lo * 2, hi * 2)) / 2; }
  else if (kind === 'plat') c = a + b;
  else c = a + b + rand(1, 6) / 2;
  const L = shuffle([a, b, c]);
  const set = pick(NAMESETS), [P, Q, R] = set;
  const sides = [[`${P}${Q}`, L[0]], [`${P}${R}`, L[1]], [`${Q}${R}`, L[2]]];
  const sorted = [...sides].sort((x, y) => y[1] - x[1]);
  const big = sorted[0], s = sorted[1][1] + sorted[2][1];
  const correct = eq(big[1], s) ? 2 : big[1] > s ? 1 : 0;
  const cmp = correct === 2 ? '=' : correct === 1 ? '>' : '<';
  const concl = ['donc le triangle existe : on peut le construire.', 'donc le triangle n\'existe pas : on ne peut pas le construire.', 'donc le triangle est aplati : les trois points sont alignés.'][correct];
  return withRemed(withHints(mcq(`<p class="statement">Peut-on construire un triangle ${set.join('')} tel que ${sides.map(([n, v]) => `${n} = ${cm(v)}`).join(', ')} ?</p>`,
    ['Oui, on peut le construire', 'Non, il n\'existe pas', 'Oui, mais il est aplati (points alignés)'], correct,
    `Le plus grand côté est ${big[0]} = ${cm(big[1])}. La somme des deux autres vaut ${fmt(sorted[1][1])} + ${fmt(sorted[2][1])} = ${cm(s)}.<br>${fmt(big[1])} ${cmp} ${fmt(s)}, ${concl}`, { col: true }),
  [`Relis l'inégalité triangulaire dans ${ficheLink('triangles')}. Quelle longueur faut-il comparer, et à quoi ?`,
    'Exemple (fiche) : avec 4 cm, 5 cm et 8 cm : 4 + 5 = 9 et 8 &lt; 9, donc le triangle existe.',
    'Outil — les 3 cas : la plus grande longueur est plus petite que la somme des deux autres → il existe ; égale → il est aplati ; plus grande → il n\'existe pas.']),
  (i) => (i === 2 ? 'Un triangle est aplati seulement si la plus grande longueur est <b>exactement égale</b> à la somme des deux autres. Est-ce le cas ici ?'
    : 'As-tu bien comparé la <b>plus grande</b> longueur à la somme des <b>deux autres</b> ? Refais l\'addition.'));
}

function genAngles() {
  const set = pick(NAMESETS), [A, B, C] = set;
  if (Math.random() < 0.65) {
    let x, y; do { x = rand(15, 120); y = rand(15, 120); } while (x + y > 165);
    const z = 180 - x - y;
    return {
      hints: [
        `Que sais-tu de la somme des trois angles d'un triangle ? (${ficheLink('triangles')}, partie 2)`,
        (x === 50 && y === 70) || (x === 70 && y === 50) ? 'Exemple : si deux angles mesurent 40° et 65°, le troisième mesure 180° − 40° − 65° = 75°.' : 'Exemple (fiche) : si deux angles mesurent 50° et 70°, le troisième mesure 180° − 50° − 70° = 60°.',
      ],
      remediate(r) {
        const v = val(r); if (!v || eq(v.value, z)) return null;
        if (eq(v.value, x + y)) return 'Tu as additionné les deux angles connus. Que vaut la somme des <b>trois</b> angles d\'un triangle ?';
        if (eq(v.value, 180 - x) || eq(v.value, 180 - y)) return 'Tu n\'as enlevé qu\'un seul angle à 180°. Combien d\'angles connais-tu ?';
        if (eq(v.value, 360 - x - y)) return 'La somme des angles d\'un triangle vaut 180°, pas 360°.';
        return null;
      },
      q: `<p class="statement">Dans le triangle ${set.join('')}, ${angHTML(B, A, C)} = ${x}° et ${angHTML(A, B, C)} = ${y}°.</p><p class="big">${angHTML(A, C, B)} = ${inp('num', 'Mesure de l\'angle')} °</p>`,
      check(r) {
        const v = val(r); if (!v) return null;
        const good = eq(v.value, z); markInput(r, 0, good);
        return { ok: good, msg: `La somme des angles d'un triangle vaut 180°, donc ${angHTML(A, C, B)} = 180° − ${x}° − ${y}° = <b>${z}°</b>.` };
      },
    };
  }
  const possible = Math.random() < 0.5;
  let x, y, z;
  do { x = rand(3, 24) * 5; y = rand(3, 24) * 5; z = possible ? 180 - x - y : 180 - x - y + pick([-20, -10, 10, 20]); } while (z < 10 || z > 150);
  return withRemed(withHints(mcq(`<p class="statement">Un triangle peut-il avoir des angles qui mesurent ${x}°, ${y}° et ${z}° ?</p>`,
    ['Oui', 'Non'], possible ? 0 : 1,
    `${x} + ${y} + ${z} = ${x + y + z}°. ${possible ? 'La somme fait bien 180°, donc c\'est possible.' : 'La somme ne fait pas 180°, donc ce triangle n\'existe pas.'}`),
  ['Que sais-tu de la somme des angles d\'un triangle ?', 'Outil : additionne les trois mesures et compare le total à 180°.']),
  () => 'As-tu additionné les <b>trois</b> mesures ? Compare le total à 180°.');
}

function remarkableFig(kind, withAll = false) {
  const { A, B, C } = (placedTriangleOverride || placedTriangle)();
  const pts = { A, B, C };
  const items = [F2.seg(A, B), F2.seg(B, C), F2.seg(A, C)];
  const sides = [[A, B, C], [B, C, A], [C, A, B]];
  const list = withAll ? sides : [sides[1]];
  let special = null;
  for (const [P, Q, S] of list) {
    const M = G.mid(P, Q), u = G.sub(Q, P);
    if (kind === 'médiatrice') { items.push(F2.xline(M, G.perp(u), 'f-red', withAll ? 6 : 4), F2.right(M, u, G.perp(u)), F2.ticks(P, M), F2.ticks(M, Q)); }
    if (kind === 'hauteur') { const f = G.add(P, G.mul(G.norm(u), G.dot(G.sub(S, P), G.norm(u)))); items.push(F2.xline(S, G.sub(f, S), 'f-red', withAll ? 6 : 4), F2.right(f, u, G.sub(S, f))); }
    if (kind === 'médiane') { items.push(F2.xline(S, G.sub(M, S), 'f-red', withAll ? 6 : 4), F2.ticks(P, M, 1), F2.ticks(M, Q, 1)); }
  }
  if (withAll) {
    if (kind === 'médiane') { special = ['G', centroid(A, B, C)]; }
    if (kind === 'médiatrice') {
      const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
      const sq = (p) => p.x * p.x + p.y * p.y;
      const O = { x: (sq(A) * (B.y - C.y) + sq(B) * (C.y - A.y) + sq(C) * (A.y - B.y)) / d, y: (sq(A) * (C.x - B.x) + sq(B) * (A.x - C.x) + sq(C) * (B.x - A.x)) / d };
      special = ['O', O]; items.unshift(F2.circle(O, G.dist(O, A)));
    }
    if (kind === 'hauteur') { const g = centroid(A, B, C), O = (() => { const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)); const sq = (p) => p.x * p.x + p.y * p.y; return { x: (sq(A) * (B.y - C.y) + sq(B) * (C.y - A.y) + sq(C) * (A.y - B.y)) / d, y: (sq(A) * (C.x - B.x) + sq(B) * (A.x - C.x) + sq(C) * (B.x - A.x)) / d }; })(); special = ['H', G.sub(G.mul(g, 3), G.mul(O, 2))]; }
    if (special) {
      const [n, p] = special;
      items.push(`<circle cx="${p.x}" cy="${p.y}" r="0.09" class="f-special"/><text x="${p.x + 0.35}" y="${p.y - 0.3}" class="f-lbl">${n}</text>`);
    }
  }
  const extra = kind === 'médiatrice' && withAll ? (() => { const O = special[1], r = G.dist(O, A); return [{ x: O.x - r, y: O.y - r }, { x: O.x + r, y: O.y + r }]; })() : [];
  return figure(pts, items, { pad: withAll ? 0.7 : 1.1, extra });
}

function genDroites() {
  const kinds = ['médiatrice', 'hauteur', 'médiane'];
  const t = rand(0, 2);
  if (t === 0) {
    const k = rand(0, 2);
    const def = ['une droite perpendiculaire à un côté qui passe par son milieu', 'une droite qui passe par un sommet et qui est perpendiculaire au côté opposé', 'une droite qui passe par un sommet et par le milieu du côté opposé'];
    return withRemed(withHints(mcq(`<p>Quelle est la droite rouge ?</p>${remarkableFig(kinds[k])}`,
      ['Une médiatrice', 'Une hauteur', 'Une médiane'], k,
      `C'est ${['une médiatrice', 'une hauteur', 'une médiane'][k]} : ${def[k]}. Regarde le codage : ${['angle droit et milieu', 'angle droit, et la droite passe par un sommet', 'milieu, et la droite passe par un sommet'][k]}.`),
      [`Relis les définitions des trois droites remarquables (${ficheLink('triangles')}, partie 3).`,
        'Outil : observe le codage. Un petit carré = un angle droit. De petits traits identiques = des longueurs égales (donc un milieu). Et la droite passe-t-elle par un sommet ?']),
      (i) => ['Une médiatrice coupe un côté en son <b>milieu</b> et lui est <b>perpendiculaire</b>. Vois-tu ces deux codages ici ?',
        'Une hauteur passe par un <b>sommet</b> et forme un <b>angle droit</b> avec le côté opposé. Est-ce le cas ici ?',
        'Une médiane relie un <b>sommet</b> au <b>milieu</b> du côté opposé. Est-ce le cas ici ?'][i]);
  }
  if (t === 1) {
    const k = rand(0, 2);
    const nm = ['médiatrices', 'hauteurs', 'médianes'][k];
    return withRemed(withHints(mcq(`<p class="statement">Le point de concours des trois <b>${nm}</b> d'un triangle s'appelle …</p>`,
      ['le centre du cercle circonscrit', 'l\'orthocentre', 'le centre de gravité'], k,
      `Médiatrices → centre du cercle circonscrit (O) ; hauteurs → orthocentre (H) ; médianes → centre de gravité (G).`, { col: true }),
      [`Relis le tableau des droites remarquables (${ficheLink('triangles')}, partie 3) : sa dernière ligne parle des points de concours.`,
        'Outil : « ortho » veut dire « droit » ; le cercle circonscrit passe par les trois sommets ; le centre de gravité est le point d\'équilibre du triangle.']),
      () => 'Relie bien chaque type de droite à son point de concours : relis la dernière ligne du tableau de la fiche.');
  }
  const k = rand(0, 2);
  const defs = ['Droite perpendiculaire à un côté et qui passe par son milieu.', 'Droite qui passe par un sommet et qui est perpendiculaire au côté opposé.', 'Droite qui passe par un sommet et par le milieu du côté opposé.'];
  return withRemed(withHints(mcq(`<p class="statement">« ${defs[k]} » C'est la définition d'…</p>`, ['une médiatrice', 'une hauteur', 'une médiane'], k, `${defs[k]} C'est ${['une médiatrice', 'une hauteur', 'une médiane'][k]}.`),
    ['Repère les mots-clés de la définition : « milieu » ? « sommet » ? « perpendiculaire » ?']),
    (i) => ['Une médiatrice passe-t-elle par un sommet ? Relis sa définition.', 'Une hauteur passe-t-elle par le milieu d\'un côté ? Relis sa définition.', 'Une médiane est-elle perpendiculaire au côté ? Relis sa définition.'][i]);
}

function genPropMediatrice() {
  const [A, B] = pick([['A', 'B'], ['E', 'F'], ['R', 'S']]);
  const M = pick(['M', 'P', 'K']);
  const x = rand(15, 95) / 10;
  if (Math.random() < 0.6) {
    return {
      hints: [
        `Relis la propriété de la médiatrice (${ficheLink('triangles')}, partie 3).`,
        A === 'E' ? 'Exemple : P est sur la médiatrice de [RS] et PR = 3 cm. Alors PS = 3 cm, car P est à égale distance de R et de S.' : 'Exemple : P est sur la médiatrice de [EF] et PE = 3 cm. Alors PF = 3 cm, car P est à égale distance de E et de F.',
      ],
      remediate(r) {
        const v = val(r); if (!v || eq(v.value, x)) return null;
        if (eq(v.value, 2 * x) || eq(v.value, x / 2)) return `Que dit la propriété de la médiatrice : ${M}${A} et ${M}${B} sont-elles différentes ?`;
        return null;
      },
      q: `<p class="statement">Le point ${M} est sur la médiatrice du segment [${A}${B}] et ${M}${A} = ${cm(x)}.</p><p class="big">${M}${B} = ${inp('num', 'Longueur')} cm</p>`,
      check(r) {
        const v = val(r); if (!v) return null;
        const good = eq(v.value, x); markInput(r, 0, good);
        return { ok: good, msg: `Tous les points de la médiatrice de [${A}${B}] sont à égale distance de ${A} et de ${B}, donc ${M}${B} = ${M}${A} = <b>${cm(x)}</b>.` };
      },
    };
  }
  const O = 'O';
  return {
    hints: ['Où se trouve le point O par rapport aux trois médiatrices du triangle ?', 'Outil : un point situé sur la médiatrice d\'un segment est à égale distance des deux extrémités de ce segment.'],
    q: `<p class="statement">O est le point de concours des médiatrices du triangle ${A}${B}C et O${A} = ${cm(x)}. Combien mesure OC ?</p><p class="big">OC = ${inp('num', 'Longueur')} cm</p>`,
    check(r) {
      const v = val(r); if (!v) return null;
      const good = eq(v.value, x); markInput(r, 0, good);
      return { ok: good, msg: `O est sur les trois médiatrices, donc il est à la même distance des trois sommets : O${A} = O${B} = OC = <b>${cm(x)}</b>. C'est le centre du cercle circonscrit.` };
    },
  };
}

/** Figures de la fiche « Triangles » */
function renderTriangleFiche() {
  const box = (id) => document.querySelector(`[data-fig="${id}"]`);
  if (box('ex-3c')) makePlayer(box('ex-3c'), scene3c(['A', 'B', 'C'], tri3c(6, 4, 5), { a: 6, b: 4, c: 5 }), { atEnd: true });
  if (box('ex-2c1a')) makePlayer(box('ex-2c1a'), scene2c1a(['R', 'T', 'S'], tri2c1a(6, 4, 70), { l1: 6, l2: 4, th: 70 }), { atEnd: true });
  if (box('ex-1c2a')) makePlayer(box('ex-1c2a'), scene1c2a(['E', 'F', 'G'], tri1c2a(7, 110, 40), { L: 7, al: 110, be: 40 }), { atEnd: true });
  const A = { x: 1.2, y: 4.2 }, B = { x: 6.2, y: 4.4 }, C = { x: 2.9, y: 0.6 };
  // figures fixes et nettes pour la fiche
  const fig = (kind) => {
    placedTriangleOverride = () => ({ A, B, C });
    const s = remarkableFig(kind, true); placedTriangleOverride = null; return s;
  };
  if (box('rem-mediatrices')) box('rem-mediatrices').innerHTML = fig('médiatrice');
  if (box('rem-hauteurs')) box('rem-hauteurs').innerHTML = fig('hauteur');
  if (box('rem-medianes')) box('rem-medianes').innerHTML = fig('médiane');
}
let placedTriangleOverride = null;

/** Indices pour les constructions (sans donner la construction de l'élève) */
function constructHints(type) {
  const ex = 'Clique sur « 🎬 Voir un exemple » : tu verras la même méthode sur un autre triangle.';
  if (type === '3c') return ['Tu connais les longueurs des trois côtés. Lequel peux-tu tracer tout de suite à la règle ?',
    'Le troisième sommet est à une distance connue de chacun des deux premiers. Quel instrument trace tous les points situés à une même distance d\'un point ?', ex];
  if (type === '2c1a') return ['Tu connais deux côtés et l\'angle entre eux. Quel est le sommet de cet angle ? Commence par tracer un côté qui part de ce sommet.',
    'Outil : le rapporteur. Son centre se place sur le sommet de l\'angle, et le 0° sur le côté déjà tracé.', ex];
  return ['Tu connais un côté et les deux angles à ses extrémités. Commence par tracer ce côté.',
    'Outil : à chaque extrémité, le rapporteur permet de tracer une demi-droite. Attention : les deux demi-droites doivent être du même côté du segment.', ex];
}

/* =========================================================
   ANIMATIONS DES CONSTRUCTIONS
   ========================================================= */
const ln = (a, b, cls) => `<line x1="${a.x.toFixed(3)}" y1="${a.y.toFixed(3)}" x2="${b.x.toFixed(3)}" y2="${b.y.toFixed(3)}" class="${cls}"/>`;
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const ang2 = (v) => Math.atan2(v.y, v.x);
function arcPath(c, r, a0, a1) {
  const p0 = { x: c.x + r * Math.cos(a0), y: c.y + r * Math.sin(a0) };
  const p1 = { x: c.x + r * Math.cos(a1), y: c.y + r * Math.sin(a1) };
  return `M${p0.x.toFixed(3)} ${p0.y.toFixed(3)} A ${r} ${r} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${a1 > a0 ? 1 : 0} ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`;
}
function ptSVG(name, p, center, alpha = 1) {
  const u = G.len(G.sub(p, center)) < 0.2 ? { x: 0, y: -1 } : G.norm(G.sub(p, center));
  const q = G.add(p, G.mul(u, 0.42));
  return `<g style="opacity:${alpha.toFixed(2)}"><circle cx="${p.x}" cy="${p.y}" r="${(0.06 + 0.1 * (1 - alpha)).toFixed(3)}" class="f-pt"/><text x="${q.x}" y="${q.y}" class="f-lbl">${name}</text></g>`;
}

/** Les instruments dessinés */
const INSTR = {
  pencil(p) {
    const q = { x: p.x + 0.45, y: p.y - 1.05 };
    return ln(p, q, 'a-pencil') + `<circle cx="${p.x}" cy="${p.y}" r="0.07" class="a-tip"/>`;
  },
  ruler(A, B, side) {
    const u = G.norm(G.sub(B, A)), L = G.dist(A, B);
    const a = G.sub(A, G.mul(u, 0.4)), b = G.add(B, G.mul(u, 0.7)), w = 0.85;
    const poly = [a, b, G.add(b, G.mul(side, w)), G.add(a, G.mul(side, w))];
    let s = `<polygon points="${poly.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ')}" class="a-ruler"/>`;
    const n = Math.floor((L + 0.6) * 2);
    for (let k = 0; k <= n; k++) {
      const p = G.add(A, G.mul(u, k * 0.5));
      s += ln(p, G.add(p, G.mul(side, k % 2 ? 0.16 : 0.3)), 'a-tick');
      if (k % 2 === 0) { const q = G.add(p, G.mul(side, 0.52)); s += `<text x="${q.x}" y="${q.y}" class="a-txt">${k / 2}</text>`; }
    }
    return s;
  },
  compass(C, P) {
    const r = G.dist(C, P), m = G.mid(C, P);
    let n = G.norm(G.perp(G.sub(P, C)));
    if (n.y > 0) n = G.mul(n, -1);
    const H = G.add(m, G.mul(n, Math.max(0.8, r * 0.4)));
    return ln(C, H, 'a-leg') + ln(P, H, 'a-leg') + ln(H, G.add(H, G.mul(n, 0.45)), 'a-leg')
      + `<circle cx="${H.x}" cy="${H.y}" r="0.13" class="a-hinge"/><circle cx="${P.x}" cy="${P.y}" r="0.07" class="a-tip"/>`;
  },
  protractor(V, u, sign, R = 1.8) {
    const a0 = G.add(V, G.mul(u, R)), a1 = G.sub(V, G.mul(u, R));
    let s = `<path d="M${a0.x} ${a0.y} A ${R} ${R} 0 0 ${sign > 0 ? 1 : 0} ${a1.x} ${a1.y} Z" class="a-prot"/>`;
    for (let k = 0; k <= 180; k += 10) {
      const d = G.rot(u, sign * k);
      s += ln(G.add(V, G.mul(d, k % 30 ? R * 0.9 : R * 0.82)), G.add(V, G.mul(d, R)), 'a-prot-tk');
      if (k % 30 === 0) { const q = G.add(V, G.mul(d, R * 0.68)); s += `<text x="${q.x}" y="${q.y}" class="a-txt a-prot-txt">${k}</text>`; }
    }
    return s;
  },
  square(F, u, v) {
    const p = [F, G.add(F, G.mul(u, 1.7)), G.add(F, G.mul(v, 2.6))];
    return `<polygon points="${p.map((q) => `${q.x.toFixed(3)},${q.y.toFixed(3)}`).join(' ')}" class="a-square"/>` + F2.right(F, u, v, 0.3);
  },
};

/** Fabriques d'étapes : draw(t, final) renvoie le dessin à l'avancement t (0 → 1) */
const STEP = {
  seg(A, B, text, { side, ends = [], center }) {
    return {
      text,
      draw(t, final) {
        const E = lerp(A, B, final ? 1 : t);
        let s = F2.seg(A, E);
        ends.forEach(([n, p], i) => { if (i === 0 || final || t >= 1) s += ptSVG(n, p, center); });
        if (!final) s += INSTR.ruler(A, B, G.mul(side, -1)) + INSTR.pencil(E);
        return s;
      },
    };
  },
  arc(C, r, a0, a1, text) {
    return {
      text,
      draw(t, final) {
        const a = a0 + (a1 - a0) * (final ? 1 : t);
        let s = t > 0.01 || final ? `<path d="${arcPath(C, r, a0, a)}" class="f-arc"/>` : '';
        if (!final) s += INSTR.compass(C, { x: C.x + r * Math.cos(a), y: C.y + r * Math.sin(a) });
        return s;
      },
    };
  },
  point(name, p, center, text, extra = '') {
    return { text, dur: 900, draw: (t, final) => (final ? extra : '') + ptSVG(name, p, center, final ? 1 : Math.min(1, t * 1.6)) };
  },
  ray(V, u, sign, dir, len, label, text) {
    return {
      text,
      dur: 2400,
      draw(t, final) {
        const tt = final ? 1 : clamp((t - 0.35) / 0.65, 0, 1);
        let s = '';
        if (tt > 0) s += F2.seg(V, G.add(V, G.mul(dir, len * tt)), 'f-thin');
        if (tt >= 1) s += F2.angle(V, G.add(V, u), G.add(V, dir), label, 0.75);
        if (!final) s += INSTR.protractor(V, u, sign);
        return s;
      },
    };
  },
  measure(B, C, M, text, side) {
    return { text, draw: (t, final) => (final ? '' : INSTR.ruler(B, C, G.mul(side, -1)) + INSTR.pencil(lerp(B, M, t))) };
  },
  xline(P, Q, text, side) {
    return {
      text,
      draw(t, final) {
        const u = G.norm(G.sub(Q, P)), a = G.sub(P, G.mul(u, 1)), b = G.add(Q, G.mul(u, 1));
        const E = lerp(a, b, final ? 1 : t);
        return F2.seg(a, E, 'f-red') + (final ? '' : INSTR.ruler(a, b, side) + INSTR.pencil(E));
      },
    };
  },
  slide(start, F, u, v, text) {
    return { text, draw: (t, final) => (final ? '' : INSTR.square(lerp(start, F, t), u, v)) };
  },
  marks(svg, text) { return { text, dur: 900, draw: () => svg }; },
};
const awayFrom = (A, B, other) => { let n = G.norm(G.perp(G.sub(B, A))); if (G.dot(n, G.sub(other, A)) > 0) n = G.mul(n, -1); return n; };

/* ---------- Scènes ---------- */
function scene3c([P, Q, R], T, { a, b, c }) {
  const [p, q, r] = T, ctr = centroid(...T);
  const tP = ang2(G.sub(r, p)), tQ = ang2(G.sub(r, q)), sp = 0.4;
  return {
    pts: T, center: ctr,
    steps: [
      STEP.seg(p, q, `Trace le segment [${P}${Q}] de ${cm(c)}.`, { side: awayFrom(p, q, r), ends: [[P, p], [Q, q]], center: ctr }),
      STEP.arc(p, b, tP - sp, tP + sp, `Compas : pointe sur ${P}, écartement ${cm(b)}. Trace un arc.`),
      STEP.arc(q, a, tQ - sp, tQ + sp, `Compas : pointe sur ${Q}, écartement ${cm(a)}. Trace un arc.`),
      STEP.point(R, r, ctr, `Les deux arcs se coupent : c'est le point ${R}.`),
      STEP.seg(p, r, `Trace le segment [${P}${R}].`, { side: awayFrom(p, r, q), center: ctr }),
      STEP.seg(q, r, `Trace le segment [${Q}${R}]. Le triangle est terminé !`, { side: awayFrom(q, r, p), center: ctr }),
    ],
  };
}
function scene2c1a([X, V, Y], T, { l1, l2, th }) {
  const [x, v, y] = T, ctr = centroid(...T);
  const u = G.norm(G.sub(x, v)), dir = G.norm(G.sub(y, v)), sign = G.cross(u, dir) >= 0 ? 1 : -1;
  return {
    pts: [...T, G.add(v, G.mul(dir, l2 + 1.4))], center: ctr,
    steps: [
      STEP.seg(v, x, `Trace le segment [${X}${V}] de ${cm(l1)}.`, { side: awayFrom(v, x, y), ends: [[V, v], [X, x]], center: ctr }),
      STEP.ray(v, u, sign, dir, l2 + 1.4, `${th}°`, `Rapporteur : centre sur ${V}, 0° sur [${V}${X}]. Repère ${th}° et trace la demi-droite.`),
      STEP.seg(v, y, `Sur la demi-droite, place ${Y} à ${cm(l2)} de ${V}.`, { side: G.mul(awayFrom(v, y, x), 1), ends: [[V, v], [Y, y]], center: ctr }),
      STEP.seg(x, y, `Trace le segment [${X}${Y}]. Le triangle est terminé !`, { side: awayFrom(x, y, v), center: ctr }),
    ],
  };
}
function scene1c2a([E, F, Gn], T, { L, al, be }) {
  const [e, f, g] = T, ctr = centroid(...T);
  const ue = G.norm(G.sub(f, e)), de = G.norm(G.sub(g, e)), uf = G.norm(G.sub(e, f)), df = G.norm(G.sub(g, f));
  return {
    pts: [...T, G.add(e, G.mul(de, G.dist(e, g) + 1.2)), G.add(f, G.mul(df, G.dist(f, g) + 1.2))], center: ctr,
    steps: [
      STEP.seg(e, f, `Trace le segment [${E}${F}] de ${cm(L)}.`, { side: awayFrom(e, f, g), ends: [[E, e], [F, f]], center: ctr }),
      STEP.ray(e, ue, G.cross(ue, de) >= 0 ? 1 : -1, de, G.dist(e, g) + 1.2, `${al}°`, `Rapporteur : centre sur ${E}, 0° sur [${E}${F}]. Trace la demi-droite à ${al}°.`),
      STEP.ray(f, uf, G.cross(uf, df) >= 0 ? 1 : -1, df, G.dist(f, g) + 1.2, `${be}°`, `Rapporteur : centre sur ${F}, 0° sur [${F}${E}]. Trace la demi-droite à ${be}°, du même côté.`),
      STEP.point(Gn, g, ctr, `Les deux demi-droites se coupent : c'est le point ${Gn}.`),
      STEP.seg(e, g, `Trace le segment [${E}${Gn}].`, { side: awayFrom(e, g, f), center: ctr }),
      STEP.seg(f, g, `Trace le segment [${F}${Gn}]. Le triangle est terminé !`, { side: awayFrom(f, g, e), center: ctr }),
    ],
  };
}
function sceneMediatrice([nA, nB], A, B, [nM, nN]) {
  const L = G.dist(A, B), r = round1(L * 0.75), ctr = G.mid(A, B);
  const al = Math.acos(L / 2 / r), t0 = ang2(G.sub(B, A)), t1 = ang2(G.sub(A, B)), e = 0.28;
  const u = G.norm(G.sub(B, A)), n = G.perp(u), h = Math.sqrt(r * r - (L / 2) ** 2);
  const M = G.add(ctr, G.mul(n, -h)), N = G.add(ctr, G.mul(n, h));
  return {
    pts: [A, B, M, N], center: ctr,
    base: [F2.seg(A, B), ptSVG(nA, A, ctr), ptSVG(nB, B, ctr)],
    steps: [
      STEP.arc(A, r, t0 - al - e, t0 + al + e, `Compas : pointe sur ${nA}, écartement plus grand que la moitié de ${nA}${nB} (ici ${cm(r)}). Trace un grand arc.`),
      STEP.arc(B, r, t1 - al - e, t1 + al + e, `Sans changer l'écartement, pointe sur ${nB} : trace un deuxième arc.`),
      STEP.point(nM, M, ctr, `Les arcs se coupent en deux points : ${nM}…`),
      STEP.point(nN, N, ctr, `… et ${nN}.`),
      STEP.xline(M, N, `Trace la droite (${nM}${nN}) : c'est la médiatrice de [${nA}${nB}].`, G.mul(u, -1)),
      STEP.marks(F2.right(ctr, u, n) + F2.ticks(A, ctr) + F2.ticks(ctr, B), `Elle est perpendiculaire à [${nA}${nB}] et passe par son milieu.`),
    ],
  };
}
function sceneHauteur([nA, nB, nC], A, B, C, nH) {
  const u = G.norm(G.sub(C, B)), H = G.add(B, G.mul(u, G.dot(G.sub(A, B), u))), v = G.norm(G.sub(A, H));
  const ctr = centroid(A, B, C);
  return {
    pts: [A, B, C], center: ctr,
    base: [F2.seg(A, B), F2.seg(B, C), F2.seg(A, C), ptSVG(nA, A, ctr), ptSVG(nB, B, ctr), ptSVG(nC, C, ctr)],
    steps: [
      STEP.slide(G.add(B, G.mul(u, 0.2)), H, u, v, `Pose un côté de l'équerre le long de [${nB}${nC}] et fais-la glisser jusqu'à ${nA}.`),
      STEP.xline(H, A, `Trace la droite le long de l'autre côté de l'équerre : elle passe par ${nA}.`, G.mul(u, -1)),
      STEP.point(nH, H, ctr, `C'est la hauteur issue de ${nA} : elle est perpendiculaire à [${nB}${nC}].`, F2.right(H, u, v)),
    ],
  };
}
function sceneMediane([nA, nB, nC], A, B, C, L, nI) {
  const M = G.mid(B, C), ctr = centroid(A, B, C);
  return {
    pts: [A, B, C], center: ctr,
    base: [F2.seg(A, B), F2.seg(B, C), F2.seg(A, C), ptSVG(nA, A, ctr), ptSVG(nB, B, ctr), ptSVG(nC, C, ctr)],
    steps: [
      STEP.measure(B, C, M, `${nB}${nC} = ${cm(L)}. Avec la règle, mesure ${cm(L / 2)} à partir de ${nB}.`, awayFrom(B, C, A)),
      STEP.point(nI, M, ctr, `${nI} est le milieu de [${nB}${nC}].`, F2.ticks(B, M) + F2.ticks(M, C)),
      STEP.seg(A, M, `Trace le segment [${nA}${nI}] : c'est la médiane issue de ${nA}.`, { side: awayFrom(A, M, B), center: ctr }),
    ],
  };
}

/* ---------- Lecteur ---------- */
function makePlayer(host, scene, { atEnd = false } = {}) {
  const P = scene.pts, pad = 1.4;
  const minx = Math.min(...P.map((p) => p.x)) - pad, maxx = Math.max(...P.map((p) => p.x)) + pad;
  const miny = Math.min(...P.map((p) => p.y)) - pad - 0.8, maxy = Math.max(...P.map((p) => p.y)) + pad;
  const k = Math.max(1, (maxx - minx) / 8.5).toFixed(2);
  host.innerHTML = `<div class="player">
    <svg class="fig anim-svg" style="--k:${k}" viewBox="${minx.toFixed(2)} ${miny.toFixed(2)} ${(maxx - minx).toFixed(2)} ${(maxy - miny).toFixed(2)}" role="img" aria-label="Animation de la construction"></svg>
    <p class="pl-text" aria-live="polite"></p>
    <div class="pl-bar">
      <button type="button" data-a="restart" title="Recommencer" aria-label="Recommencer">⏮</button>
      <button type="button" data-a="prev" title="Étape précédente" aria-label="Étape précédente">◀</button>
      <button type="button" data-a="play" class="pl-play" aria-label="Lecture">▶ Lecture</button>
      <button type="button" data-a="next" title="Étape suivante" aria-label="Étape suivante">▶|</button>
    </div></div>`;
  const svg = host.querySelector('svg'), txt = host.querySelector('.pl-text'), bPlay = host.querySelector('.pl-play');
  const n = scene.steps.length;
  let cur = atEnd ? n : 0, t = 0, playing = false, last = 0, pause = 0;
  function draw() {
    let s = (scene.base || []).join('');
    for (let i = 0; i < Math.min(cur, n); i++) s += scene.steps[i].draw(1, true);
    if (cur < n) s += scene.steps[cur].draw(t, false);
    svg.innerHTML = s;
    txt.innerHTML = cur < n ? `<b>Étape ${cur + 1} / ${n} :</b> ${scene.steps[cur].text}` : '<b>Construction terminée.</b> Clique sur ▶ pour la revoir.';
    bPlay.textContent = playing ? '⏸ Pause' : '▶ Lecture';
  }
  function frame(ts) {
    if (!playing || !svg.isConnected) { playing = false; return; }
    const dt = last ? ts - last : 16; last = ts;
    if (pause > 0) {
      pause -= dt;
      if (pause <= 0) { cur++; t = 0; if (cur >= n) { playing = false; draw(); return; } }
    } else {
      t = Math.min(1, t + dt / (scene.steps[cur].dur || 1800));
      if (t >= 1) pause = 700;
    }
    draw();
    requestAnimationFrame(frame);
  }
  function play() { if (cur >= n) { cur = 0; t = 0; } playing = true; last = 0; pause = 0; requestAnimationFrame(frame); draw(); }
  host.querySelector('.pl-bar').addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'play') { if (playing) { playing = false; draw(); } else play(); return; }
    playing = false;
    if (a === 'restart') { cur = 0; t = 0; play(); return; }
    if (a === 'prev') { if (cur >= n) { cur = n - 1; t = 1; } else if (cur > 0) { cur--; t = 1; } else t = 0; }
    if (a === 'next') { if (cur < n && t < 1) t = 1; else if (cur < n) { cur++; t = cur < n ? 1 : 0; } }
    draw();
  });
  draw();
  return { play };
}

/* =========================================================
   LECTURE À VOIX HAUTE
   ========================================================= */
const CAN_SPEAK = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
const FRAC_NAMES = { 2: ['demi', 'demis'], 3: ['tiers', 'tiers'], 4: ['quart', 'quarts'] };
function fracWords(a, b) {
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
    const N = Number(a), D = Number(b);
    if (FRAC_NAMES[D]) return `${N === 1 ? 'un' : N} ${FRAC_NAMES[D][N > 1 ? 1 : 0]}`;
    return `${N} sur ${D}`;
  }
  return `${a} , sur , ${b}`;
}
function mathWords(s) {
  s = s
    .replace(/\[([A-Z])([A-Z])\]/g, ' le segment $1 $2 ')
    .replace(/\(([A-Z])([A-Z])\)/g, ' la droite $1 $2 ')
    .replace(/\b([A-Z])([A-Z])([A-Z])\b/g, '$1 $2 $3')
    .replace(/\b([A-Z])([A-Z])\b/g, '$1 $2')
    .replace(/(\d)\s*cm\b/g, '$1 centimètres')
    .replace(/°/g, ' degrés')
    .replace(/×/g, ' fois ').replace(/÷/g, ' divisé par ')
    .replace(/(\d|\))\s*:\s*(?=[\d(])/g, '$1 divisé par ')
    .replace(/(\d)\s*\/\s*(\d)/g, '$1 sur $2')
    .replace(/\(\s*(?=[\d(])/g, ' ouvrez la parenthèse, ');
  for (let i = 0; i < 3; i++) s = s.replace(/(\d|parenthèse)\s*\)/g, '$1, fermez la parenthèse ');
  return s
    .replace(/−/g, ' moins ').replace(/\+/g, ' plus ').replace(/=/g, ' égale ')
    .replace(/</g, ' est plus petit que ').replace(/>/g, ' est plus grand que ')
    .replace(/[✔✘←→✨💡🎬🔊▶⏮◀⏸↶✕✋📏◯◠●⟷⊥…]/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1').replace(/\s+/g, ' ').trim();
}
function speechText(node) {
  const c = node.cloneNode(true);
  c.querySelectorAll('svg, .ex-bar, .geo-tools, .geo-names, .geo-status, .geo-wrap, .pl-bar, .cl-r, button, .ex-actions').forEach((e) => e.remove());
  c.querySelectorAll('.frac').forEach((f) => { const [a, b] = f.children; f.replaceWith(` ${fracWords(a.textContent.trim(), b.textContent.trim())} `); });
  c.querySelectorAll('.ang').forEach((a) => a.replaceWith(` l'angle ${a.textContent.trim().split('').join(' ')} `));
  c.querySelectorAll('input.ans').forEach((i) => i.replaceWith(' combien ? '));
  c.querySelectorAll('input').forEach((i) => i.remove());
  c.querySelectorAll('.choice').forEach((ch, i) => { ch.prepend(` Réponse ${i + 1} : `); ch.append('. '); });
  c.querySelectorAll('p, li, h1, h2, h3, .statement, .rule, .example, .tip, .warnbox, .hint, .cl-e, td, th, .memo > div').forEach((e) => e.append('. '));
  c.querySelectorAll('br').forEach((e) => e.replaceWith('. '));
  return mathWords(c.textContent.replace(/\.\s*\./g, '.'));
}
let speakingBtn = null;
function stopSpeaking() {
  if (!CAN_SPEAK) return;
  window.speechSynthesis.cancel();
  if (speakingBtn) { speakingBtn.classList.remove('on'); speakingBtn = null; }
}
function speak(text, btn) {
  if (!CAN_SPEAK) return;
  const wasSame = speakingBtn === btn;
  stopSpeaking();
  if (wasSame) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR'; u.rate = 0.92;
  const v = window.speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith('fr'));
  if (v) u.voice = v;
  u.onend = u.onerror = () => { if (speakingBtn === btn) { btn.classList.remove('on'); speakingBtn = null; } };
  speakingBtn = btn; btn.classList.add('on');
  window.speechSynthesis.speak(u);
}

/* =========================================================
   Registre des exercices
   ========================================================= */
const GENS = {
  // Chapitre 1 — Règles de calcul
  'c-sans': { ch: 'calculs', f: genCalcFrom(TPL_SANS), label: 'Calcul sans priorité' },
  'c-prio': { ch: 'calculs', f: genCalcFrom(TPL_PRIO), label: 'Calcul avec priorité' },
  'c-par': { ch: 'calculs', f: genCalcFrom(TPL_PAR), label: 'Parenthèses' },
  'c-imb': { ch: 'calculs', f: genCalcFrom(TPL_IMB), label: 'Parenthèses imbriquées' },
  'c-first': { ch: 'calculs', f: genFirstOp, label: 'Par où commencer ?' },
  'c-mot': { ch: 'calculs', f: genMot, label: 'Vocabulaire' },
  'c-derniere': { ch: 'calculs', f: genDerniere, label: 'Dernière opération' },
  'c-phrase': { ch: 'calculs', f: genPhraseVersCalcul, label: 'Phrase → calcul' },
  'c-traduire': { ch: 'calculs', f: genCalculVersPhrase, label: 'Calcul → phrase' },
  // Chapitre 2 — Triangles
  't-construire': { ch: 'triangles', f: genConstruire, label: 'Construire un triangle' },
  't-ineg': { ch: 'triangles', f: genInegalite, label: 'Inégalité triangulaire' },
  't-angles': { ch: 'triangles', f: genAngles, label: 'Somme des angles' },
  't-droites': { ch: 'triangles', f: genDroites, label: 'Droites remarquables' },
  't-prop': { ch: 'triangles', f: genPropMediatrice, label: 'Propriété de la médiatrice' },
  't-trace-med': { ch: 'triangles', f: genTraceMediatrice, label: 'Tracer une médiatrice' },
  't-trace-droite': { ch: 'triangles', f: genTraceDroite, label: 'Tracer hauteur / médiane' },
  // Chapitre 3 — Fractions
  tables: { ch: 'fractions', f: genTables, label: 'Tables' },
  decimal: { ch: 'fractions', f: genDecimal, label: 'Écritures décimales' },
  quotient: { ch: 'fractions', f: genQuotient, label: 'Nombre quotient' },
  lire: { ch: 'fractions', f: genLire, label: 'Lire sur une droite' },
  placer: { ch: 'fractions', f: genPlacer, label: 'Placer sur une droite' },
  egales: { ch: 'fractions', f: genEgales, label: 'Fractions égales' },
  simplifier: { ch: 'fractions', f: genSimplifier, label: 'Simplifier' },
  formes: { ch: 'fractions', f: genFormes, label: 'Formes multiples' },
};

const CHAPTERS = [
  { id: 'calculs', num: 1, title: 'Règles de calcul', symbol: '×÷', desc: 'Priorités opératoires, parenthèses, vocabulaire des opérations.' },
  { id: 'triangles', num: 2, title: 'Triangles', symbol: '△', desc: 'Constructions à la règle, au compas et au rapporteur, inégalité triangulaire, angles, droites remarquables.' },
  { id: 'fractions', num: 3, title: 'Fractions (partie 1)', symbol: '½', desc: 'Écritures décimales, nombre quotient, droite graduée, fractions égales, simplification.' },
];

/* =========================================================
   Progression et points faibles (enregistrés dans le navigateur)
   ========================================================= */
const STORE = 'revisions5e-v2';
let stats = {};
try { stats = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { stats = {}; }
function persist() { try { localStorage.setItem(STORE, JSON.stringify(stats)); } catch (e) { /* stockage indisponible */ } }
function saveStat(key, good, helped) {
  const s = stats[key] || (stats[key] = { ok: 0, total: 0, hint: 0 });
  s.total++;
  if (good) { s.ok++; if (helped) s.hint = (s.hint || 0) + 1; }
  persist();
}
/** Points faibles : un type raté y entre ; il en sort après 2 réussites d'affilée sans aide */
const NEED = 2;
function updateWeak(key, good, helped) {
  const w = stats._weak || (stats._weak = {});
  let out = null;
  if (!good) { out = key in w ? 'still' : 'added'; w[key] = 0; }
  else if (key in w) {
    if (helped) out = 'helped';
    else { w[key]++; if (w[key] >= NEED) { delete w[key]; out = 'fixed'; } else out = 'progress'; }
  }
  persist();
  return out;
}
function refreshWeakBadge(ch) {
  const a = document.querySelector(`#nav a[href="#/${ch}/erreurs"]`);
  if (!a) return;
  const n = weakKeys(ch).length;
  a.innerHTML = 'Mes erreurs' + (n ? ` <span class="count">${n}</span>` : '');
  const sum = document.querySelector(`.page[data-ch="${ch}"][data-p="erreurs"] .weak-summary`);
  if (sum) sum.innerHTML = n ? `<p><b>Tes points faibles :</b></p>${weakListHTML(ch)}` : '';
}
const weakKeys = (ch) => Object.keys(stats._weak || {}).filter((k) => GENS[k] && GENS[k].ch === ch && !GENS[k].locked);
const weakNote = {
  added: (l) => `<p class="weak-note">📌 « ${l} » est ajouté à <b>Mes erreurs</b> pour le retravailler.</p>`,
  still: (l) => `<p class="weak-note">📌 « ${l} » reste dans <b>Mes erreurs</b>.</p>`,
  helped: () => `<p class="weak-note">Réussi avec de l'aide : réessaie sans indice pour corriger ce point faible.</p>`,
  progress: () => `<p class="weak-note">Encore ${NEED - 1} réussite sans indice pour corriger ce point faible.</p>`,
  fixed: (l) => `<p class="weak-note fixed">✨ Point faible corrigé : « ${l} » sort de <b>Mes erreurs</b> !</p>`,
};

/* =========================================================
   Moteur d'exercice
   ========================================================= */
function makeExercise(root, gen, opts = {}) {
  const limit = opts.limit || 0;
  let cur = null, answered = false, count = 0, good = 0, history = [], used = 0, animSeen = false, tries = 0;
  if (opts.makeGen) gen = opts.makeGen();

  root.innerHTML = `
    <div class="ex-bar"><span class="ex-count"></span>${CAN_SPEAK ? '<button type="button" class="mini ex-say" title="Écouter l\'énoncé">🔊 Écouter</button>' : ''}<span class="ex-score"></span></div>
    <div class="ex-q"></div>
    <div class="ex-hints" aria-live="polite"></div>
    <div class="ex-anim"></div>
    <div class="ex-fb" aria-live="polite"></div>
    <div class="ex-actions">
      <button type="button" class="btn primary ex-check">Vérifier</button>
      <button type="button" class="btn ex-hint">💡 Un indice</button>
      <button type="button" class="btn ex-film">🎬 Voir la construction</button>
      <button type="button" class="btn ex-next">Question suivante →</button>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const qEl = $('.ex-q'), fb = $('.ex-fb'), hEl = $('.ex-hints'), aEl = $('.ex-anim');
  const bCheck = $('.ex-check'), bNext = $('.ex-next'), bHint = $('.ex-hint'), bFilm = $('.ex-film'), bSay = $('.ex-say');
  const cEl = $('.ex-count'), sEl = $('.ex-score');
  let restart = null;
  const label = () => cur.label || GENS[cur.key || opts.key]?.label || '';
  const helped = () => used > 0 || animSeen || tries > 0;

  function bar() {
    sEl.textContent = count && !opts.weakCh ? `Score : ${good} / ${count}` : count ? `Réussies : ${good} / ${count}` : '';
    cEl.textContent = limit ? `Question ${Math.min(answered ? count : count + 1, limit)} / ${limit}` : '';
  }
  function hintButton() {
    const n = cur.hints ? cur.hints.length : 0;
    bHint.hidden = !!limit || !n || answered || !!cur.empty;
    bHint.disabled = used >= n;
    bHint.textContent = used === 0 ? `💡 Un indice (${n})` : used < n ? `💡 Indice suivant (${used + 1}/${n})` : '💡 Plus d\'indice';
  }

  function render(focus) {
    stopSpeaking();
    cur = gen();
    answered = false; used = 0; animSeen = false; tries = 0;
    root.classList.remove('done');
    delete qEl.dataset.sel;
    qEl.innerHTML = cur.q;
    hEl.innerHTML = ''; aEl.innerHTML = '';
    fb.className = 'ex-fb'; fb.innerHTML = '';
    bCheck.hidden = !!cur.empty; bCheck.disabled = false;
    filmButton();
    bNext.textContent = cur.empty ? 'Actualiser' : limit ? 'Passer cette question →' : 'Question suivante →';
    bNext.disabled = false;
    if (bSay) bSay.hidden = !!cur.empty;
    hintButton();
    if (cur.mount) cur.mount(qEl);
    bar();
    if (focus) qEl.querySelector('input.ans')?.focus({ preventScroll: true });
  }

  function filmButton() {
    // avant la réponse : un exemple (autres données) ; après : la correction animée
    const can = answered ? !!cur.anim : !!cur.example && !limit;
    bFilm.hidden = !can;
    bFilm.textContent = answered ? '🎬 Voir la construction' : '🎬 Voir un exemple';
  }
  function showHint() {
    if (!cur.hints || used >= cur.hints.length) return;
    const h = cur.hints[used];
    const html = (typeof h === 'string' ? h : h.html).replace(/\[\[(.+?)\|(.+?)\]\]/g, (m, a, b) => F(a, b));
    hEl.insertAdjacentHTML('beforeend', `<div class="hint-box"><b>Indice ${used + 1} :</b> ${html}</div>`);
    if (h && h.act) h.act(qEl);
    used++;
    hintButton();
  }
  function showFilm() {
    if (!cur.anim) return;
    if (!answered) animSeen = true;
    const sc = answered ? cur.anim() : cur.example();
    const p = makePlayer(aEl, sc);
    if (!answered) aEl.insertAdjacentHTML('afterbegin', '<p class="small muted">Exemple avec d\'autres données : à toi ensuite de faire la même chose avec les tiennes.</p>');
    p.play();
    aEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function check() {
    if (answered || cur.empty) return;
    // 1er essai : si l'erreur est une erreur classique, on la signale et on laisse un 2e essai
    if (!limit && tries === 0 && cur.remediate) {
      const m = cur.remediate(qEl);
      if (m) {
        tries = 1;
        fb.className = 'ex-fb remed';
        fb.innerHTML = `<strong>🤔 Regarde bien…</strong> ${m}<p class="small">Corrige ta réponse, puis clique à nouveau sur « Vérifier ». C'est ton deuxième essai.</p>`;
        return;
      }
    }
    const res = cur.check(qEl);
    if (!res) { fb.className = 'ex-fb warn'; fb.innerHTML = 'Complète ta réponse avant de vérifier.'; return; }
    if (res.retry) { fb.className = 'ex-fb warn'; fb.innerHTML = res.msg; return; }
    answered = true; count++;
    if (res.ok) good++;
    const k = cur.key || opts.key;
    const h = helped();
    if (k && !limit) saveStat(k, res.ok, h);
    const w = k ? updateWeak(k, res.ok, h) : null;
    if (w && GENS[k]) refreshWeakBadge(GENS[k].ch);
    if (limit) history.push({ label: label(), ok: res.ok });
    root.classList.add('done');
    qEl.querySelectorAll('input').forEach((i) => { i.disabled = true; });
    fb.className = 'ex-fb ' + (res.ok ? 'ok' : 'ko');
    const head = res.ok ? (h ? '<strong>✔ Bravo, avec un peu d\'aide !</strong> ' : '<strong>✔ Bravo !</strong> ') : '<strong>✘ Pas tout à fait.</strong> ';
    fb.innerHTML = head + res.msg + (w && !limit ? weakNote[w](label()) : '');
    bCheck.disabled = true;
    filmButton();
    hintButton();
    bNext.disabled = false;
    bNext.textContent = limit && count >= limit ? 'Voir ma note' : 'Question suivante →';
    bar();
    bNext.focus({ preventScroll: true });
  }

  function summary() {
    const note = Math.round((good / limit) * 20 * 2) / 2;
    const k = opts.examKey;
    stats[k] = { last: note, best: Math.max(note, stats[k]?.best ?? 0), n: (stats[k]?.n ?? 0) + 1 };
    persist();
    const weak = history.filter((x) => !x.ok).length;
    const advice = note >= 16 ? 'Excellent, tu es prêt(e) pour le devoir !'
      : note >= 12 ? 'Bon travail ! Revois les points en rouge.'
        : 'Reprends la fiche puis entraîne-toi sur les points en rouge.';
    qEl.innerHTML = `<div class="result">
      <p class="note">${fmt(note)} / 20</p>
      <p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${limit}. ${advice}</p>
      <ul>${history.map((x) => `<li class="${x.ok ? 'ok' : 'ko'}">${x.label}</li>`).join('')}</ul>
      ${weak ? `<p><a class="btn primary" href="#/${opts.ch}/erreurs">Retravailler mes erreurs →</a></p>` : ''}</div>`;
    fb.className = 'ex-fb'; fb.innerHTML = ''; hEl.innerHTML = ''; aEl.innerHTML = '';
    bCheck.hidden = true; bHint.hidden = true; bFilm.hidden = true;
    bNext.textContent = 'Recommencer un contrôle';
    sEl.textContent = ''; cEl.textContent = '';
    restart = () => {
      restart = null; count = 0; good = 0; history = [];
      if (opts.makeGen) gen = opts.makeGen();
      render(true);
    };
  }

  function next() {
    if (restart) { restart(); return; }
    if (limit && !answered) {
      count++; history.push({ label: label() + ' (passée)', ok: false });
      if (cur.key) updateWeak(cur.key, false, false);
    }
    if (limit && count >= limit) { summary(); return; }
    render(true);
  }

  bCheck.addEventListener('click', check);
  bNext.addEventListener('click', next);
  bHint.addEventListener('click', showHint);
  qEl.addEventListener('input', (e) => { if (e.target.classList) e.target.classList.remove('wrong', 'right'); });
  bFilm.addEventListener('click', showFilm);
  if (bSay) bSay.addEventListener('click', () => {
    const parts = [qEl, hEl, fb].filter((x) => x.textContent.trim());
    speak(parts.map((x) => speechText(x)).join('. '), bSay);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !answered) { e.preventDefault(); check(); }
  });
  render(false);
  return { renew: () => { restart = null; render(false); } };
}

/* =========================================================
   Accueil général et accueils de chapitre
   ========================================================= */
function chapterStats(ch) {
  let ok = 0, total = 0;
  Object.entries(GENS).forEach(([k, g]) => { if (g.ch === ch) { ok += stats[k]?.ok || 0; total += stats[k]?.total || 0; } });
  return { ok, total, exam: stats[ch + ':controle'], weak: weakKeys(ch).length };
}
function renderChapters() {
  document.getElementById('chapters').innerHTML = CHAPTERS.map((c) => {
    const s = chapterStats(c.id);
    const pct = s.total ? Math.round((s.ok / s.total) * 100) : 0;
    const parts = [];
    if (s.total) parts.push(`${s.ok} / ${s.total} exercices réussis`);
    if (s.exam) parts.push(`contrôle : ${fmt(s.exam.best)}/20`);
    if (s.weak) parts.push(`📌 ${s.weak} point${s.weak > 1 ? 's' : ''} à retravailler`);
    if (c.locked) return `<div class="chapter-card locked" data-ch="${c.id}"><span class="symbol">${c.symbol}</span><span class="num">Chapitre ${c.num}</span><h2>${c.title}</h2><p>${c.desc}</p><span class="stat">🔒 Bientôt</span></div>`;
    if (c.hiddenNote) parts.push(c.hiddenNote);
    return `<a class="chapter-card" data-ch="${c.id}" href="#/${c.id}">
      <span class="symbol">${c.symbol}</span>
      <span class="num">Chapitre ${c.num}</span>
      <h2>${c.title}</h2>
      <p>${c.desc}</p>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <span class="stat">${parts.length ? parts.join(' · ') : 'Pas encore commencé'}</span></a>`;
  }).join('');
}
function weakListHTML(ch) {
  const ks = weakKeys(ch);
  if (!ks.length) return '';
  return `<ul class="weak-list">${ks.map((k) => `<li>${GENS[k].label}${stats._weak[k] ? ` <span class="small muted">(${stats._weak[k]}/${NEED})</span>` : ''}</li>`).join('')}</ul>`;
}
function renderChapterHome(ch) {
  const host = document.querySelector(`.page[data-ch="${ch}"][data-p="accueil"] .ch-cards`);
  const pages = [...document.querySelectorAll(`.page[data-ch="${ch}"]`)].filter((p) => p.dataset.p !== 'accueil');
  host.innerHTML = pages.map((p) => {
    const keys = [...p.querySelectorAll('.exercise[data-gen]')].map((e) => e.dataset.gen);
    const desc = p.querySelector('.lead')?.textContent.trim().split('. ')[0] || '';
    let body = '<div class="stat">À relire avant chaque séance →</div>';
    let cls = 'tile';
    if (p.dataset.p === 'erreurs') {
      const n = weakKeys(ch).length;
      cls += n ? ' tile-weak' : '';
      body = n ? `<div class="stat"><b>📌 ${n} point${n > 1 ? 's' : ''} à retravailler</b></div>${weakListHTML(ch)}` : '<div class="stat">Aucun point faible pour l\'instant 🎉</div>';
    } else if (p.dataset.exam) {
      const c = stats[ch + ':controle'];
      body = `<div class="bar"><span style="width:${c ? Math.round((c.best / 20) * 100) : 0}%"></span></div><div class="stat">${c ? `Meilleure note : ${fmt(c.best)} / 20` : 'Pas encore fait'}</div>`;
    } else if (keys.length) {
      let ok = 0, total = 0, hint = 0;
      keys.forEach((k) => { ok += stats[k]?.ok || 0; total += stats[k]?.total || 0; hint += stats[k]?.hint || 0; });
      const pct = total ? Math.round((ok / total) * 100) : 0;
      body = `<div class="bar"><span style="width:${pct}%"></span></div><div class="stat">${total ? `${ok} / ${total} réussies${hint ? ` (dont ${hint} avec indice)` : ''}` : 'Pas encore commencé'}</div>`;
    }
    return `<a class="${cls}" href="#/${ch}/${p.dataset.p}"><h3>${p.dataset.title}</h3><p>${desc.length > 90 ? desc.slice(0, 88) + '…' : desc}${desc.endsWith('.') ? '' : '.'}</p>${body}</a>`;
  }).join('');
}

/* =========================================================
   Navigation : #/chapitre/page
   ========================================================= */
const OLD = { fiche: 1, automatismes: 1, quotient: 1, droite: 1, egales: 1, simplifier: 1, formes: 1, controle: 1 };
const WEAK_CTL = {};
function route() {
  stopSpeaking();
  let h = location.hash.replace(/^#\/?/, '');
  if (OLD[h]) { location.replace('#/fractions/' + h); return; }
  if (h === 'accueil') h = '';
  let [ch, p] = h.split('/');
  const special = ch === 'prof';
  if (special) { ch = '_'; p = 'prof'; }
  else if (!CHAPTERS.some((c) => c.id === ch && !c.locked)) { ch = ''; p = ''; }
  p = p || 'accueil';
  let page = document.querySelector(`.page[data-ch="${ch}"][data-p="${p}"]`);
  if (!page) { p = 'accueil'; page = document.querySelector(`.page[data-ch="${ch}"][data-p="accueil"]`); }
  document.querySelectorAll('.page').forEach((x) => x.classList.toggle('active', x === page));
  document.body.dataset.ch = ch;
  const chap = CHAPTERS.find((c) => c.id === ch);
  const pill = document.getElementById('chap-pill');
  const nav = document.getElementById('nav');
  document.getElementById('logo-mark').innerHTML = chap ? chap.symbol : '5<sup>e</sup>';
  if (chap) {
    const nWeak = weakKeys(ch).length;
    pill.hidden = false; pill.textContent = `Chapitre ${chap.num} · ${chap.title}`; pill.title = 'Changer de chapitre';
    nav.innerHTML = [...document.querySelectorAll(`.page[data-ch="${ch}"]`)].map((x) =>
      `<a href="#/${ch}/${x.dataset.p}"${x === page ? ' aria-current="page"' : ''}${x.dataset.exam ? ' class="nav-exam"' : ''}>${x.dataset.title}${x.dataset.p === 'erreurs' && nWeak ? ` <span class="count">${nWeak}</span>` : ''}</a>`).join('');
    nav.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    document.title = `${chap.title} — Révisions 5e`;
  } else {
    pill.hidden = true; nav.innerHTML = '';
    document.title = 'Révisions 5e — Mathématiques';
  }
  if (special) { document.title = 'Espace professeur — Révisions 5e'; if (typeof renderProfLock === 'function') renderProfLock(); }
  else if (!ch) renderChapters();
  else if (p === 'accueil') renderChapterHome(ch);
  else if (p === 'erreurs') WEAK_CTL[ch]?.renew();
  window.scrollTo(0, 0);
}

/* =========================================================
   Démarrage
   ========================================================= */
/** Prépare une question « mélangée » (contrôle blanc, mes erreurs) */
function wrapGen(k) {
  const saved = CONSTRUCT_MODE; CONSTRUCT_MODE = '';
  const o = GENS[k].f();
  CONSTRUCT_MODE = saved;
  o.key = k;
  o.label = GENS[k].label;
  o.q = `<p class="tag">${GENS[k].label}</p>` + o.q;
  return o;
}

document.addEventListener('DOMContentLoaded', () => {
  // [[a|b]] -> fractions (chapitre 3)
  document.querySelectorAll('.page').forEach((el) => {
    if (el.innerHTML.includes('[[')) el.innerHTML = el.innerHTML.replace(/\[\[(.+?)\|(.+?)\]\]/g, (m, a, b) => F(a, b));
  });

  // Droite graduée de la fiche Fractions
  const ex = [['9', '4', 9 / 4], ['0,25', null, 0.25], ['−0,75', null, -0.75], ['5', '4', 5 / 4],
    ['2,75', null, 2.75], ['5', '2', 5 / 2], ['−1,25', null, -1.25]];
  const letters = 'ABCDEFG';
  document.getElementById('fiche-droite').innerHTML =
    drawLine({ min: -2, max: 3, den: 4, points: ex.map((e, i) => ({ v: e[2], label: letters[i] })) });
  document.getElementById('fiche-legende').innerHTML =
    ex.map((e, i) => `<span><b>${letters[i]}</b> : ${e[1] ? F(e[0], e[1]) + ' = ' + fmt(e[2]) : e[0]}</span>`).join('');

  renderCalcDemos();
  renderTriangleFiche();

  // Lecture à voix haute des fiches
  if (CAN_SPEAK) {
    document.querySelectorAll('.page[data-p="fiche"] .card').forEach((card) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mini say'; b.textContent = '🔊 Écouter';
      b.title = 'Écouter cette partie de la fiche';
      card.querySelector('h2').appendChild(b);
      b.addEventListener('click', () => speak(speechText(card), b));
    });
  }

  // Exercices d'entraînement
  const ctl = {};
  document.querySelectorAll('.exercise[data-gen]').forEach((el) => {
    const id = el.dataset.gen;
    ctl[id] = makeExercise(el, GENS[id].f, { key: id });
  });

  // Type de construction (triangles)
  document.querySelectorAll('.mode').forEach((b) => b.addEventListener('click', () => {
    CONSTRUCT_MODE = b.dataset.mode;
    document.querySelectorAll('.mode').forEach((x) => x.classList.toggle('on', x === b));
    ctl['t-construire'].renew();
  }));

  // Contrôles blancs : chaque compétence au moins une fois, complété au hasard jusqu'à 10
  document.querySelectorAll('.exercise[data-exam]').forEach((el) => {
    const ch = el.dataset.exam;
    makeExercise(el, null, {
      limit: 10, ch,
      examKey: ch + ':controle',
      makeGen() {
        const keys = Object.keys(GENS).filter((k) => GENS[k].ch === ch && !GENS[k].locked);
        const queue = shuffle(keys).slice(0, 10);
        while (queue.length < 10) queue.push(pick(keys));
        shuffle(queue);
        return () => wrapGen(queue.shift() || pick(keys));
      },
    });
  });

  // Mes erreurs : uniquement les types de questions ratés
  document.querySelectorAll('.exercise[data-weak]').forEach((el) => {
    const ch = el.dataset.weak;
    let last = null;
    WEAK_CTL[ch] = makeExercise(el, () => {
      const ks = weakKeys(ch);
      const sum = document.querySelector(`.page[data-ch="${ch}"][data-p="erreurs"] .weak-summary`);
      if (sum) sum.innerHTML = ks.length ? `<p><b>Tes points faibles :</b></p>${weakListHTML(ch)}` : '';
      if (!ks.length) {
        return { empty: true, q: `<div class="empty-state"><p class="big-emoji">🎉</p><p><b>Aucun point faible pour l'instant.</b></p><p>Quand tu rates une question, son type arrive ici. Il disparaît après ${NEED} réussites d'affilée sans indice.</p><p><a class="btn" href="#/${ch}/controle">Faire le contrôle blanc</a></p></div>` };
      }
      const choices = ks.length > 1 ? ks.filter((k) => k !== last) : ks;
      last = pick(choices);
      return wrapGen(last);
    }, { weakCh: ch });
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Effacer toute ta progression, dans tous les chapitres ?')) { stats = {}; persist(); route(); }
  });

  window.addEventListener('hashchange', route);
  route();
});
