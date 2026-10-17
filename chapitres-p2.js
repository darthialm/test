'use strict';
/* =========================================================
   PÉRIODE 2 — Chapitres 5, 6 et 7 : Opérations, Angles, Triangles
   Ce fichier se charge après script.js : il ajoute ses exercices
   au registre GENS et ses chapitres à CHAPTERS.
   Les clés commencent par o-, a- et t- : elles ne touchent pas
   la progression déjà enregistrée par les élèves.
   ========================================================= */

/* ---------- Outils communs ---------- */
/** direction d'angle « mathématique » (sens inverse des aiguilles d'une montre, à l'écran) */
const polar = (deg, r = 1) => ({ x: r * Math.cos((deg * Math.PI) / 180), y: -r * Math.sin((deg * Math.PI) / 180) });
const angN = (s) => `<span class="ang">${s}</span>`;
const deg = (x) => `${fmt(x)}°`;
const intIn = (r, a, b) => r >= a && r <= b;
/** arc de marquage d'un angle de sommet V entre les directions u et v (angle < 180°) */
function arcMark(V, u, v, r = 0.7, cls = 'f-arcm') {
  const a = G.add(V, G.mul(G.norm(u), r)), b = G.add(V, G.mul(G.norm(v), r));
  const sw = G.cross(G.sub(a, V), G.sub(b, V)) > 0 ? 1 : 0;
  return `<path d="M${a.x.toFixed(3)} ${a.y.toFixed(3)} A ${r} ${r} 0 0 ${sw} ${b.x.toFixed(3)} ${b.y.toFixed(3)}" class="${cls}"/>`;
}
/** texte placé dans l'ouverture d'un angle */
function arcLabel(V, u, v, txt, r = 1.15, cls = 'f-len') {
  const m = G.norm(G.add(G.norm(u), G.norm(v)));
  return F2.text(G.add(V, G.mul(m, r)), txt, cls);
}
/** petit trait de codage sur un segment (n traits) */
const tick = (a, b, n = 1) => F2.ticks(a, b, n);
/** rapporteur dessiné (fiches, animations, exercices de lecture) : centre C, base dans la direction b,
    demi-disque du côté de n ; double graduation comme un vrai rapporteur */
function protractorDraw(C, b, n, R = 3, { inner = true, cls = 'a-prot' } = {}) {
  const at = (d, rr) => G.add(C, G.add(G.mul(b, rr * Math.cos((d * Math.PI) / 180)), G.mul(n, rr * Math.sin((d * Math.PI) / 180))));
  const e0 = at(0, R), e1 = at(180, R);
  const sw = G.cross(G.sub(e0, C), G.sub(at(90, R), C)) > 0 ? 1 : 0;
  let s = `<path d="M${e0.x.toFixed(3)} ${e0.y.toFixed(3)} A ${R} ${R} 0 0 ${sw} ${e1.x.toFixed(3)} ${e1.y.toFixed(3)} Z" class="${cls}"/>`;
  s += `<path d="M${at(0, R * 0.22).x} ${at(0, R * 0.22).y} A ${R * 0.22} ${R * 0.22} 0 0 ${sw} ${at(180, R * 0.22).x} ${at(180, R * 0.22).y}" class="a-prot-tk" fill="none"/>`;
  for (let k = 0; k <= 180; k += 5) {
    const q0 = at(k, R), q1 = at(k, R - (k % 10 ? 0.14 : 0.3));
    s += `<line x1="${q0.x.toFixed(3)}" y1="${q0.y.toFixed(3)}" x2="${q1.x.toFixed(3)}" y2="${q1.y.toFixed(3)}" class="a-prot-tk"/>`;
    if (k % 10 === 0) {
      const p1 = at(k, R - 0.52);
      s += `<text x="${p1.x.toFixed(3)}" y="${p1.y.toFixed(3)}" class="p2-prot-out">${k}</text>`;
      if (inner) { const p2 = at(k, R - 0.95); s += `<text x="${p2.x.toFixed(3)}" y="${p2.y.toFixed(3)}" class="p2-prot-in">${180 - k}</text>`; }
    }
  }
  s += `<circle cx="${C.x}" cy="${C.y}" r="0.06" class="a-tip"/>`;
  return s;
}
/** demi-droites tracées depuis un point (pour corriger les constructions d'angles) */
function raysFrom(board, O, tol = 0.15) {
  const out = [];
  board.linears().forEach((Lx) => {
    const A = Lx.P, B = G.add(Lx.P, Lx.d);
    if (Lx.kind === 'hray' && G.dist(A, O) < tol) out.push(Lx.d);
    else if (Lx.kind === 'seg') { if (G.dist(A, O) < tol) out.push(Lx.d); else if (G.dist(B, O) < tol) out.push(G.mul(Lx.d, -1)); }
    else if (Lx.kind === 'line' && distToLine(Lx, O) < tol) { out.push(Lx.d); out.push(G.mul(Lx.d, -1)); }
  });
  return out;
}
const pickNames3 = () => pick([['A', 'B', 'C'], ['D', 'E', 'F'], ['R', 'S', 'T'], ['K', 'L', 'M'], ['P', 'Q', 'R'], ['E', 'F', 'G'], ['M', 'N', 'P'], ['I', 'J', 'K']]);

/* =========================================================
   CHAPITRE 5 — ADDITIONNER, SOUSTRAIRE, MULTIPLIER
   ========================================================= */
const OPW = { '+': ['la somme', 'les termes', 'addition'], '−': ['la différence', 'les termes', 'soustraction'], '×': ['le produit', 'les facteurs', 'multiplication'] };
const opCalc = (a, op, b) => (op === '+' ? a + b : op === '−' ? a - b : a * b);
const randOpPair = (op) => {
  if (op === '×') return [rand(3, 12), rand(3, 12)];
  if (op === '+') return [rand(12, 89), rand(11, 79)];
  const a = rand(30, 99); return [a, rand(11, a - 8)];
};

/* ---------- 1. Vocabulaire ---------- */
function genOpVoc() {
  const op = pick(['+', '−', '×']), [a, b] = randOpPair(op), c = opCalc(a, op, b);
  const v = rand(0, 2);
  const hints = [`Relis le tableau du vocabulaire dans ${ficheLink('operations')}.`, 'Outil : somme → addition (+) ; différence → soustraction (−) ; produit → multiplication (×). Les nombres de départ : des termes pour + et −, des facteurs pour ×.'];
  if (v === 0) {
    const askRes = Math.random() < 0.55;
    const opts = ['la somme', 'la différence', 'le produit', 'les termes', 'les facteurs'];
    const good = askRes ? OPW[op][0] : OPW[op][1];
    const o = mcq(`<p class="statement">Dans le calcul <b>${fmt(a)} ${op} ${fmt(b)} = ${fmt(c)}</b>, ${askRes ? `<b>${fmt(c)}</b> est…` : `<b>${fmt(a)}</b> et <b>${fmt(b)}</b> sont…`}</p>`, opts, opts.indexOf(good),
      `C'est une ${OPW[op][2]} : ${fmt(a)} et ${fmt(b)} sont ${OPW[op][1]}, ${fmt(c)} est ${OPW[op][0]}.`, { keepOrder: true });
    return withRemed(withHints(o, hints), (i) => (askRes === (i >= 3) ? (askRes ? 'On demande le nom du <b>résultat</b>, pas des nombres de départ.' : 'On demande le nom des <b>nombres de départ</b>, pas du résultat.') : `Regarde le signe de l'opération : ${op}. Quel mot va avec ce signe ?`));
  }
  if (v === 1) {
    const phr = op === '×' ? `le produit de ${a} par ${b}` : `${OPW[op][0]} de ${a} et de ${b}`;
    return {
      hints: [...hints, `Exemple : la différence de 11 et de 3, c'est 11 − 3 = 8.`],
      remediate(r) {
        const x = val(r); if (!x || eq(x.value, c)) return null;
        for (const o2 of ['+', '−', '×']) if (o2 !== op && eq(x.value, opCalc(a, o2, b))) return `Tu as fait une ${OPW[o2][2]}. Mais « ${OPW[op][0]} » veut dire une <b>${OPW[op][2]}</b>.`;
        return null;
      },
      q: `<p class="statement">Calcule <b>${phr}</b>.</p><p class="big">${inp('num', 'Résultat')}</p>`,
      check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, c); markInput(r, 0, ok); return { ok, msg: `${cap(phr)} : ${a} ${op} ${b} = <b>${fmt(c)}</b>.` }; },
    };
  }
  const opts = ['La somme', 'La différence', 'Le produit'];
  const o = mcq(`<p class="statement">Complète : <b>…………</b> de ${a} ${op === '×' ? 'par' : 'et de'} ${b} vaut ${fmt(c)}.</p>`, opts, ['+', '−', '×'].indexOf(op),
    `${a} ${op} ${b} = ${fmt(c)} : c'est ${OPW[op][0]}.`, { keepOrder: true });
  return withRemed(withHints(o, hints), (i) => `Vérifie : ${a} ${['+', '−', '×'][i]} ${b} = ${fmt(opCalc(a, ['+', '−', '×'][i], b))}, et non ${fmt(c)}. Essaie les trois opérations.`);
}

/* ---------- Étapes de calcul (affichage) ---------- */
const stepsHTML = (name, lines) => `<div class="p2-steps">${lines.map((l, i) => `<div><span class="p2-n">${i === 0 ? name : ''}</span><span>${i === 0 ? '=' : '='} ${l}</span></div>`).join('')}</div>`;

/* ---------- 2. De gauche à droite ---------- */
function genOpGauche() {
  const name = pick(['A', 'B', 'C', 'D']);
  let a, b, c, d = null, ops;
  for (;;) {
    a = rand(20, 80); b = rand(5, 30); c = rand(3, 25);
    ops = pick([['−', '+'], ['+', '−'], ['−', '−'], ['−', '+', '−']]);
    if (ops.length === 3) d = rand(2, 15); else d = null;
    let r = opCalc(opCalc(a, ops[0], b), ops[1], c);
    if (d !== null) r = opCalc(r, ops[2], d);
    const mid = opCalc(a, ops[0], b);
    if (r >= 0 && mid >= 0 && !(ops[0] === '+' && ops[1] === '+')) break;
  }
  const nums = d === null ? [a, b, c] : [a, b, c, d];
  const expr = nums.map((x, i) => (i ? ` ${ops[i - 1]} ${x}` : `${x}`)).join('');
  const lines = []; let cur = a;
  for (let i = 1; i < nums.length; i++) { cur = opCalc(cur, ops[i - 1], nums[i]); lines.push(`${cur}${nums.slice(i + 1).map((x, j) => ` ${ops[i + j]} ${x}`).join('')}`); }
  const ans = cur;
  // erreur classique : on commence par la fin (b op2 c)
  let wrong = null;
  if (nums.length === 3 && ops[0] === '−') wrong = a - opCalc(b, ops[1], c);
  if (Math.random() < 0.3) {
    const opts = [`${a} ${ops[0]} ${b}`, `${b} ${ops[1]} ${c}`];
    return withHints(mcq(`<p class="statement">${name} = ${expr}</p><p>Quel calcul fait-on <b>en premier</b> ?</p>`, opts, 0,
      `Il n'y a que des additions et des soustractions : on calcule <b>de la gauche vers la droite</b>. On commence par ${a} ${ops[0]} ${b} = ${opCalc(a, ops[0], b)}.`, { keepOrder: true }),
    [`Relis la règle 1 dans ${ficheLink('operations')}.`, 'Outil : lis le calcul comme une phrase, de gauche à droite.']);
  }
  return {
    hints: [`Relis la règle 1 dans ${ficheLink('operations')} : dans quel sens calcule-t-on ?`, `Exemple : 40 − 12 + 3 = 28 + 3 = 31 (on fait d'abord 40 − 12).`, `Outil : commence par ${a} ${ops[0]} ${b}.`],
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, ans)) return null;
      if (wrong !== null && eq(x.value, wrong)) return `Tu as commencé par ${b} ${ops[1]} ${c}. Avec seulement des + et des −, on calcule <b>de gauche à droite</b> : d'abord ${a} ${ops[0]} ${b}.`;
      return null;
    },
    q: `<p class="statement">Calcule en respectant la règle.</p><p class="big">${name} = ${expr} = ${inp('num', 'Résultat')}</p>`,
    check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, ans); markInput(r, 0, ok); return { ok, msg: `De gauche à droite :${stepsHTML(name, [expr, ...lines.slice(0, -1), `<b>${ans}</b>`])}` }; },
  };
}

/* ---------- 3. Parenthèses ---------- */
function genOpPar() {
  const name = pick(['A', 'B', 'C', 'D', 'E']);
  const forms = [
    () => { const b = rand(4, 20), c = rand(3, 15), a = rand(b + c + 3, 80); return { expr: `${a} − (${b} + ${c})`, inner: `${b} + ${c}`, iv: b + c, step: (iv) => `${a} − ${iv}`, ans: a - b - c, naive: a - b + c }; },
    () => { const c = rand(2, 9), b = rand(c + 2, 15), a = rand(3, 9); return { expr: `${a} × (${b} − ${c})`, inner: `${b} − ${c}`, iv: b - c, step: (iv) => `${a} × ${iv}`, ans: a * (b - c), naive: a * b - c }; },
    () => { const a = rand(2, 12), b = rand(2, 9), c = rand(3, 9); return { expr: `(${a} + ${b}) × ${c}`, inner: `${a} + ${b}`, iv: a + b, step: (iv) => `${iv} × ${c}`, ans: (a + b) * c, naive: a + b * c }; },
    () => { const c = rand(3, 12), b = rand(c + 4, 30), a = rand(5, 40); return { expr: `${a} + (${b} − ${c})`, inner: `${b} − ${c}`, iv: b - c, step: (iv) => `${a} + ${iv}`, ans: a + b - c, naive: null }; },
    () => { const c = rand(3, 12), b = rand(c + 4, 30), a = rand(b + 5, 80); return { expr: `${a} − (${b} − ${c})`, inner: `${b} − ${c}`, iv: b - c, step: (iv) => `${a} − ${iv}`, ans: a - (b - c), naive: a - b - c }; },
  ];
  const f = pick(forms)();
  if (Math.random() < 0.25) {
    const all = f.expr.match(/\d+ [+−×] \d+/g) || [];
    const opts = [f.inner, ...all.filter((x) => x !== f.inner)].slice(0, 3);
    if (opts.length < 2) opts.push('on ne peut pas savoir');
    return withHints(mcq(`<p class="statement">${name} = ${f.expr}</p><p>Quel calcul fait-on <b>en premier</b> ?</p>`, opts, 0,
      `On commence toujours par le calcul <b>entre parenthèses</b> : ${f.inner} = ${f.iv}.`), [`Relis la règle 2 dans ${ficheLink('operations')}.`]);
  }
  return {
    hints: [`Relis la règle 2 dans ${ficheLink('operations')} : par quoi commence-t-on ?`, 'Exemple : 5 × (12 − 4) = 5 × 8 = 40.', `Outil : calcule d'abord ${f.inner}.`],
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, f.ans)) return null;
      if (f.naive !== null && eq(x.value, f.naive)) return `Tu as calculé sans tenir compte des parenthèses. On commence par le calcul <b>entre parenthèses</b> : ${f.inner}.`;
      return null;
    },
    q: `<p class="statement">Calcule en respectant les règles.</p><p class="big">${name} = ${f.expr} = ${inp('num', 'Résultat')}</p>`,
    check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, f.ans); markInput(r, 0, ok); return { ok, msg: `Les parenthèses d'abord :${stepsHTML(name, [f.expr, f.step(f.iv), `<b>${f.ans}</b>`])}` }; },
  };
}

/* ---------- 4. Parenthèses doubles ---------- */
function genOpPar2() {
  const name = pick(['A', 'B', 'D', 'E']);
  const forms = [
    () => { const c = rand(2, 9), d = rand(2, 9), b = rand(c + d + 4, 40), a = rand(b + 5, 99); const i1 = c + d, i2 = b - i1; return { expr: `${a} − (${b} − (${c} + ${d}))`, s: [`${a} − (${b} − ${i1})`, `${a} − ${i2}`], ans: a - i2, wrongs: [a - (b - c + d), a - b - c - d] }; },
    () => { const c = rand(2, 9), d = rand(2, 6), b = rand(c + d + 2, 30), a = rand(2, 6); const i1 = c + d, i2 = b - i1; return { expr: `${a} × (${b} − (${c} + ${d}))`, s: [`${a} × (${b} − ${i1})`, `${a} × ${i2}`], ans: a * i2, wrongs: [a * (b - c + d)] }; },
    () => { const c = rand(10, 30), d = rand(2, 9), b = rand(3, 20), a = rand(b + c, 99); const i1 = c - d, i2 = b + i1; return { expr: `${a} − (${b} + (${c} − ${d}))`, s: [`${a} − (${b} + ${i1})`, `${a} − ${i2}`], ans: a - i2, wrongs: [a - b + c - d] }; },
    () => { const c = rand(2, 8), d = rand(2, 8), b = rand(2, 9), a = rand(2, 5); const i1 = c + d, i2 = b + i1; return { expr: `(${b} + (${c} + ${d})) × ${a}`, s: [`(${b} + ${i1}) × ${a}`, `${i2} × ${a}`], ans: i2 * a, wrongs: [b + c + d * a] }; },
  ];
  const f = pick(forms)();
  return {
    hints: [`Relis la règle 3 dans ${ficheLink('operations')} : quelles parenthèses calcule-t-on en premier ?`, 'Exemple : 60 − (25 − (4 + 6)) = 60 − (25 − 10) = 60 − 15 = 45.', 'Outil : cherche les parenthèses qui ne contiennent pas d\'autres parenthèses.'],
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, f.ans)) return null;
      if (f.wrongs.some((w) => eq(x.value, w))) return 'Commence par les parenthèses <b>les plus intérieures</b>, puis celles qui les entourent, en écrivant chaque étape.';
      return null;
    },
    q: `<p class="statement">Calcule en écrivant les étapes sur ton cahier.</p><p class="big">${name} = ${f.expr} = ${inp('num', 'Résultat')}</p>`,
    check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, f.ans); markInput(r, 0, ok); return { ok, msg: `Les parenthèses les plus intérieures d'abord :${stepsHTML(name, [f.expr, ...f.s, `<b>${f.ans}</b>`])}` }; },
  };
}

/* ---------- Opérations posées (affichage) ---------- */
/** nombre décimal {m, k} : valeur m / 10^k */
const dv = (m, k) => ({ m, k });
const dStr = (x) => decStr(x.m, x.k, false);
const dNice = (x) => fmt(x.m / P10(x.k));
const dPad = (x, K) => ({ m: x.m * P10(K - x.k), k: K });
/** addition ou soustraction posée : virgules alignées, zéros ajoutés en couleur */
function poseAddHTML(a, b, op, showRes = true, blankPad = false) {
  const K = Math.max(a.k, b.k);
  const A = dPad(a, K), B = dPad(b, K), R = { m: op === '+' ? A.m + B.m : A.m - B.m, k: K };
  const row = (x, orig) => {
    const s = decStr(x.m, x.k, false), added = K - orig.k;
    if (!added) return s;
    if (blankPad) { const t = orig.k ? decStr(orig.m, orig.k, false) : String(orig.m) + ' '; return t + ' '.repeat(s.length - t.length); }
    return `${s.slice(0, s.length - added)}<b class="p2-z">${s.slice(s.length - added)}</b>`;
  };
  return `<div class="p2-pose"><div><span class="p2-op"></span>${row(A, a)}</div><div><span class="p2-op">${op}</span>${row(B, b)}</div><div class="p2-res">${showRes ? decStr(R.m, R.k, false) : '&nbsp;'}</div></div>`;
}
/** multiplication posée : on calcule sans les virgules, puis on place la virgule */
function poseMulHTML(a, b) {
  const M1 = a.m, M2 = b.m, digs = String(M2).split('').reverse().map(Number);
  const lines = digs.length > 1 ? digs.map((d, i) => M1 * d * P10(i)) : [];
  const P = M1 * M2, K = a.k + b.k;
  const fmtI = (n) => groupInt(String(n));
  let h = `<div class="p2-pose"><div><span class="p2-op"></span>${dStr(a)}</div><div><span class="p2-op">×</span>${dStr(b)}</div>`;
  if (lines.length) {
    h += lines.map((l, i) => `<div class="${i === 0 ? 'p2-res' : ''}"><span class="p2-op">${i ? '+' : ''}</span>${fmtI(l)}</div>`).join('');
  }
  h += `<div class="p2-res"><b>${decStr(P, K, false)}</b></div></div>`;
  return h;
}
/** un décimal « joli » : m entier avec k chiffres après la virgule, dernier chiffre non nul */
function randDv(k, lo, hi) { for (;;) { const m = rand(lo * P10(k), hi * P10(k)); if (k === 0 || m % 10) return dv(m, k); } }

/* ---------- 5. Poser une addition, une soustraction ---------- */
function genOpPoseAdd() {
  const op = pick(['+', '−']);
  let a, b;
  for (;;) {
    const ka = rand(0, 2), kb = rand(1, 2);
    a = randDv(ka, op === '−' ? 30 : 10, op === '−' ? 95 : 80); b = randDv(kb, 5, op === '−' ? 60 : 70);
    if (ka === kb) continue;
    if (op === '−' && a.m / P10(a.k) <= b.m / P10(b.k) + 3) continue;
    break;
  }
  const K = Math.max(a.k, b.k), A = dPad(a, K), B = dPad(b, K);
  const res = (op === '+' ? A.m + B.m : A.m - B.m) / P10(K);
  // erreur classique : chiffres alignés à droite (virgules décalées)
  const sh = Math.abs(a.k - b.k);
  const wrongAl = a.k < b.k ? opCalc(a.m * P10(sh) / P10(b.k), op, b.m / P10(b.k)) : opCalc(a.m / P10(a.k), op, b.m * P10(sh) / P10(a.k));
  const expr = `${dNice(a)} ${op} ${dNice(b)}`;
  if (Math.random() < 0.3) {
    // QCM : quelle opération est bien posée ?
    const good = poseAddHTML(a, b, op, false, true);
    const right = `<div class="p2-pose p2-right"><div><span class="p2-op"></span>${dStr(a)}</div><div><span class="p2-op">${op}</span>${dStr(b)}</div><div class="p2-res">&nbsp;</div></div>`;
    const left = `<div class="p2-pose p2-left"><div><span class="p2-op"></span>${dStr(a)}</div><div><span class="p2-op">${op}</span>${dStr(b)}</div><div class="p2-res">&nbsp;</div></div>`;
    const o = mcq(`<p class="statement">On veut calculer <b>${expr}</b>. Quelle opération est bien posée ?</p>`, [good, right, left], 0,
      'On aligne les <b>virgules</b> les unes sous les autres (donc les unités sous les unités, les dixièmes sous les dixièmes…), et on complète avec des zéros.', { cls: 'p2-poses' });
    return withRemed(withHints(o, [`Relis « Poser une addition et une soustraction » dans ${ficheLink('operations')}.`, 'Outil : regarde les virgules. Sont-elles les unes sous les autres ?']),
      () => 'Regarde les virgules : sont-elles alignées ? Les unités doivent être sous les unités.');
  }
  return {
    hints: [`Relis « Poser une addition et une soustraction » dans ${ficheLink('operations')}. Qu'est-ce qu'on aligne ?`, `Exemple : 47,6 + 28,35 → on écrit 47,60 sous forme posée, virgule sous virgule.`, { html: 'Outil : voici l\'opération bien posée, à toi de calculer.', act: (r) => r.insertAdjacentHTML('beforeend', `<div class="hint-fig">${poseAddHTML(a, b, op, false)}</div>`) }],
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, res)) return null;
      if (eq(x.value, wrongAl)) return 'Tu as aligné les derniers chiffres. Il faut aligner les <b>virgules</b> (unités sous unités), et compléter avec des zéros.';
      if ([0.01, 0.1, 1, 10].some((d) => eq(Math.abs(x.value - res), d))) return 'Ton calcul est presque juste : vérifie les <b>retenues</b>, colonne par colonne en partant de la droite.';
      return null;
    },
    q: `<p class="statement">Pose l'opération sur ton cahier, puis écris le résultat.</p><p class="big">${expr} = ${inp('num', 'Résultat')}</p>`,
    check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, res); markInput(r, 0, ok); return { ok, msg: `Virgules alignées, zéros ajoutés : ${expr} = <b>${fmt(res)}</b>.${poseAddHTML(a, b, op)}` }; },
  };
}

/* ---------- 6. Poser une multiplication ---------- */
function genOpPoseMul() {
  let a, b;
  const kind = rand(0, 2);
  if (kind === 0) { a = randDv(1, 2, 60); b = dv(rand(2, 9), 0); }
  else if (kind === 1) { a = randDv(2, 1, 9); b = randDv(1, 1, 9); }
  else { a = randDv(1, 2, 40); b = randDv(1, 1, 6); }
  const K = a.k + b.k, P = a.m * b.m, res = P / P10(K);
  const expr = `${dNice(a)} × ${dNice(b)}`;
  const v = Math.random();
  if (v < 0.22) {
    const o = mcq(`<p class="statement">On pose <b>${dStr(a)} × ${dStr(b)}</b> sans les virgules : on trouve ${groupInt(String(P))}.<br>Combien de chiffres après la virgule doit avoir le produit ?</p>`, ['0', '1', '2', '3'], K,
      `${dStr(a)} a ${a.k} chiffre${a.k > 1 ? 's' : ''} après la virgule, ${dStr(b)} en a ${b.k} : ${a.k} + ${b.k} = <b>${K}</b>. Donc ${expr} = ${decStr(P, K, false)} = <b>${fmt(res)}</b>.`, { keepOrder: true });
    return withRemed(withHints(o, [`Relis « Poser une multiplication » dans ${ficheLink('operations')}.`, 'Outil : compte les chiffres après la virgule dans chaque facteur, puis additionne.']),
      () => 'Compte les chiffres après la virgule dans <b>les deux</b> facteurs, puis ajoute-les.');
  }
  if (v < 0.4) {
    const est = Math.round(a.m / P10(a.k)) * Math.max(1, Math.round(b.m / P10(b.k)));
    const opts = [res, res * 10, res / 10, res * 100].map((x) => fmt(Math.round(x * 1e6) / 1e6));
    const o = mcq(`<p class="statement">Sans poser l'opération, quel est le bon résultat de <b>${expr}</b> ?</p><p class="hint">Aide-toi d'un ordre de grandeur.</p>`, opts, 0,
      `Ordre de grandeur : ${expr} ≈ ${fmt(Math.round(a.m / P10(a.k)))} × ${fmt(Math.max(1, Math.round(b.m / P10(b.k))))} = ${fmt(est)}. Le seul résultat proche est <b>${fmt(res)}</b>.`);
    return withRemed(withHints(o, ['Outil : arrondis chaque facteur à l\'unité, puis multiplie de tête.']), () => `Arrondis : ${dNice(a)} ≈ ${fmt(Math.round(a.m / P10(a.k)))}. Le résultat doit être proche de ${fmt(est)}.`);
  }
  return {
    hints: [`Relis « Poser une multiplication » dans ${ficheLink('operations')} : s'occupe-t-on des virgules pendant le calcul ?`, 'Exemple : 36,4 × 2,5 → 364 × 25 = 9 100 ; 1 + 1 = 2 chiffres après la virgule → 91,00 = 91.', `Outil : calcule ${groupInt(String(a.m))} × ${b.m}, puis place la virgule.`],
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, res)) return null;
      for (const f of [10, 100, 1000, 0.1, 0.01]) if (eq(x.value, res * f)) return `Les chiffres sont justes, mais la <b>virgule</b> est mal placée : ${dStr(a)} a ${a.k} chiffre${a.k > 1 ? 's' : ''} après la virgule et ${dStr(b)} en a ${b.k}. Le produit doit en avoir ${K}.`;
      return null;
    },
    q: `<p class="statement">Pose la multiplication sur ton cahier, puis écris le résultat.</p><p class="big">${expr} = ${inp('num', 'Résultat')}</p>`,
    check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, res); markInput(r, 0, ok); return { ok, msg: `On calcule ${groupInt(String(a.m))} × ${b.m} = ${groupInt(String(P))}, puis ${a.k} + ${b.k} = ${K} chiffre${K > 1 ? 's' : ''} après la virgule : ${expr} = <b>${fmt(res)}</b>.${poseMulHTML(a, b)}` }; },
  };
}

/* ---------- 7. Problèmes ---------- */
const e2 = (c) => (c % 100 ? decStr(c, 2) : groupInt(String(c / 100)));
const eur = (c) => `${e2(c)} €`;
const eurIn = (label) => `${inp('num', label)} €`;
function genOpProbleme() {
  const who = pick(['Léa', 'Tom', 'Inès', 'Noah', 'Jade', 'Yanis', 'Emma', 'Lucas']);
  const t = rand(0, 2);
  let steps, text, phrase;
  if (t === 0) {
    const objs = pick([['cahiers', 'une trousse'], ['stylos', 'une règle'], ['croissants', 'une baguette'], ['classeurs', 'un compas']]);
    const n = rand(2, 5), p = rand(115, 395), q = rand(150, 890), tot = n * p + q, billet = tot < 1500 ? 2000 : tot < 4500 ? 5000 : 10000;
    text = `${who} achète ${n} ${objs[0]} à ${eur(p)} l'un et ${objs[1]} à ${eur(q)}. ${who === 'Tom' || who === 'Noah' || who === 'Yanis' || who === 'Lucas' ? 'Il' : 'Elle'} paie avec un billet de ${eur(billet)}. Combien lui rend-on ?`;
    steps = [{ l: `Prix des ${objs[0]}`, v: n * p / 100, w: `${n} × ${e2(p)} = ${eur(n * p)}` }, { l: 'Prix total', v: tot / 100, w: `${e2(n * p)} + ${e2(q)} = ${eur(tot)}` }, { l: 'Monnaie rendue', v: (billet - tot) / 100, w: `${e2(billet)} − ${e2(tot)} = ${eur(billet - tot)}` }];
    phrase = `On rend <b>${eur(billet - tot)}</b> à ${who}.`;
  } else if (t === 1) {
    const L = rand(30, 80) * 10, n = rand(3, 6), l = rand(45, 120);
    if (n * l >= L) return genOpProbleme();
    text = `Un rouleau de ruban mesure ${fmt(L / 100)} m. ${who} coupe ${n} morceaux de ${fmt(l / 100)} m chacun. Quelle longueur de ruban reste-t-il ?`;
    steps = [{ l: 'Longueur coupée (m)', v: n * l / 100, w: `${n} × ${fmt(l / 100)} = ${fmt(n * l / 100)} m`, unit: 'm' }, { l: 'Longueur restante (m)', v: (L - n * l) / 100, w: `${fmt(L / 100)} − ${fmt(n * l / 100)} = ${fmt((L - n * l) / 100)} m`, unit: 'm' }];
    phrase = `Il reste <b>${fmt((L - n * l) / 100)} m</b> de ruban.`;
  } else {
    const m0 = rand(1200, 4000), d1 = rand(250, 980), g = rand(500, 1500), n = rand(2, 4);
    text = `${who} a ${eur(m0)} dans sa tirelire. ${who} dépense ${eur(d1)}, puis reçoit ${n} fois ${eur(g)}. Combien a-t-${who === 'Tom' || who === 'Noah' || who === 'Yanis' || who === 'Lucas' ? 'il' : 'elle'} maintenant ?`;
    steps = [{ l: 'Après la dépense', v: (m0 - d1) / 100, w: `${e2(m0)} − ${e2(d1)} = ${eur(m0 - d1)}` }, { l: 'Somme reçue', v: n * g / 100, w: `${n} × ${e2(g)} = ${eur(n * g)}` }, { l: 'Somme finale', v: (m0 - d1 + n * g) / 100, w: `${e2(m0 - d1)} + ${e2(n * g)} = ${eur(m0 - d1 + n * g)}` }];
    phrase = `${who} a maintenant <b>${eur(m0 - d1 + n * g)}</b>.`;
  }
  return {
    hints: ['Lis l\'énoncé deux fois. Qu\'est-ce qu\'on cherche à la fin ?', 'Outil : réponds aux questions intermédiaires dans l\'ordre ; chaque étape sert pour la suivante.', 'À l\'évaluation, écris chaque calcul et termine par une phrase réponse.'],
    remediate(r) {
      const ins = [...r.querySelectorAll('.ans')];
      for (let i = 0; i < steps.length; i++) { const x = parse(ins[i].value); if (x && !eq(x.value, steps[i].v)) return `Vérifie la ligne « ${steps[i].l} » : quelle opération faut-il faire ?`; }
      return null;
    },
    q: `<p class="statement">${text}</p><div class="form-lines">${steps.map((s) => `<div class="form-line"><span>${s.l} :</span> ${s.unit ? inp('num', s.l) : eurIn(s.l)}</div>`).join('')}</div>`,
    check(r) {
      const ins = [...r.querySelectorAll('.ans')];
      if (ins.some((i) => !parse(i.value))) return null;
      let ok = true;
      ins.forEach((i, j) => { const g = eq(parse(i.value).value, steps[j].v); if (!g) ok = false; markInput(r, j, g); });
      return { ok, msg: `<ul class="fb-list">${steps.map((s) => `<li>${s.l} : ${s.w}</li>`).join('')}</ul>${phrase}` };
    },
  };
}

/* =========================================================
   CHAPITRE 6 — LES ANGLES
   ========================================================= */
/** figure d'un angle seul : sommet V, côtés vers les directions a1, a2 (degrés), noms [P1, V, P2] */
function angleFig(a1, a2, names, { len = 3.6, arc = true, arcCls = 'f-arcm', label = null, right = false, extra = [], rays = true } = {}) {
  const V = { x: 0, y: 0 }, u = polar(a1), v = polar(a2);
  const P1 = G.mul(u, len * 0.82), P2 = G.mul(v, len * 0.82);
  const items = [rays ? F2.seg(V, G.mul(u, len)) : F2.seg(V, P1), rays ? F2.seg(V, G.mul(v, len)) : F2.seg(V, P2)];
  if (right) items.push(F2.right(V, u, v, 0.4)); else if (arc) items.push(arcMark(V, u, v, 0.75, arcCls));
  if (label) items.push(arcLabel(V, u, v, label, 1.35));
  const [n1, nV, n2] = names;
  const pts = { [nV]: V, [n1]: P1, [n2]: P2 };
  return figure(pts, items.concat(extra), { marks: { [nV]: 'none', [n1]: { dash: u }, [n2]: { dash: v } }, extra: [G.mul(u, len), G.mul(v, len), { x: -1, y: -1 }, { x: 1, y: 1 }], pad: 0.7, center: G.mul(G.norm(G.add(u, v)), -2) });
}
/** triangle pour les questions de vocabulaire (sommets nommés) */
function randTriangle(minAng = 30) {
  for (;;) {
    const A = { x: 0, y: 0 }, B = { x: rand(50, 75) / 10, y: rand(-8, 8) / 10 }, C = { x: rand(10, 60) / 10, y: -rand(28, 45) / 10 };
    const angs = [[A, B, C], [B, C, A], [C, A, B]].map(([P, Q, R]) => angDeg(G.sub(Q, P), G.sub(R, P)));
    if (angs.every((x) => x >= minAng)) return [A, B, C];
  }
}

/* ---------- 1. Nommer un angle ---------- */
function genAngNom() {
  const ns = pickNames3(), v = rand(0, 2);
  const hints = [`Relis « Définition et notation » dans ${ficheLink('angles')}. Où se place la lettre du sommet ?`, 'Outil : le sommet de l\'angle s\'écrit <b>au milieu</b>, entre une lettre de chaque côté.'];
  if (v === 0) {
    const P = randTriangle(35), i = rand(0, 2), j = (i + 1) % 3, k = (i + 2) % 3;
    const V = P[i], items = [F2.seg(P[0], P[1]), F2.seg(P[1], P[2]), F2.seg(P[2], P[0]), arcMark(V, G.sub(P[j], V), G.sub(P[k], V), 0.75, 'f-arcm f-arc-red')];
    const fig = figure({ [ns[0]]: P[0], [ns[1]]: P[1], [ns[2]]: P[2] }, items, { marks: { [ns[0]]: 'none', [ns[1]]: 'none', [ns[2]]: 'none' } });
    const good1 = ns[j] + ns[i] + ns[k], good2 = ns[k] + ns[i] + ns[j];
    const items2 = shuffle([{ html: angN(good1), ok: true }, { html: angN(good2), ok: true }, { html: angN(ns[i] + ns[j] + ns[k]), ok: false, kind: 'debut' }, { html: angN(ns[j] + ns[k] + ns[i]), ok: false, kind: 'fin' }]);
    return withHints(multiQ(`<p>Coche <b>tous</b> les noms possibles de l'angle marqué en rouge.</p>${fig}`, items2,
      `Le sommet de l'angle rouge est ${ns[i]} : il s'écrit au milieu. L'angle se nomme ${angN(good1)} ou ${angN(good2)}.`,
      () => `Le sommet de l'angle rouge est <b>${ns[i]}</b> : sa lettre doit être <b>au milieu</b> du nom.`), hints);
  }
  if (v === 1) {
    const nm = ns.join('');
    const o = mcq(`<p class="statement">Quel est le sommet de l'angle ${angN(nm)} ?</p>`, [ns[0], ns[1], ns[2]], 1, `Dans ${angN(nm)}, la lettre du milieu est ${ns[1]} : le sommet est <b>${ns[1]}</b>.`, { keepOrder: true });
    return withRemed(withHints(o, hints), () => 'Le sommet est toujours la lettre <b>du milieu</b>.');
  }
  const nm = ns.join('');
  const opts = [`[${ns[1]}${ns[0]}) et [${ns[1]}${ns[2]})`, `[${ns[0]}${ns[1]}) et [${ns[0]}${ns[2]})`, `[${ns[0]}${ns[1]}] et [${ns[1]}${ns[2]}]`, `(${ns[0]}${ns[1]}) et (${ns[1]}${ns[2]})`];
  const o = mcq(`<p class="statement">Quels sont les côtés de l'angle ${angN(nm)} ?</p>`, opts, 0, `Les côtés d'un angle sont deux <b>demi-droites</b> qui partent du sommet ${ns[1]} : [${ns[1]}${ns[0]}) et [${ns[1]}${ns[2]}).`, { col: true });
  return withRemed(withHints(o, hints), (i) => (i === 1 ? `Les côtés partent du <b>sommet</b>, ici ${ns[1]} (la lettre du milieu).` : 'Un angle est délimité par deux <b>demi-droites</b> de même origine : ce ne sont ni des segments, ni des droites.'));
}

/* ---------- 2. Nature d'un angle ---------- */
const NATS = ['aigu', 'droit', 'obtus', 'plat'];
const natOf = (m) => (m < 90 ? 0 : m === 90 ? 1 : m < 180 ? 2 : 3);
function genAngNature() {
  const kind = pick([0, 0, 1, 2, 2, 3]);
  const m = kind === 0 ? rand(15, 75) : kind === 1 ? 90 : kind === 2 ? rand(105, 165) : 180;
  const hints = [`Relis le tableau « Nature d'un angle » dans ${ficheLink('angles')}.`, 'Outil : compare avec un angle droit (le coin de l\'équerre) : plus petit → aigu ; plus grand → obtus ; les côtés dans le prolongement l\'un de l\'autre → plat.'];
  const NATMSG = [`plus petit qu'un angle droit : il est <b>aigu</b>`, 'un angle droit (90°) : il est <b>droit</b>', 'plus grand qu\'un angle droit, mais pas plat : il est <b>obtus</b>', 'ses côtés sont dans le prolongement l\'un de l\'autre (180°) : il est <b>plat</b>'];
  if (Math.random() < 0.55) {
    const a1 = rand(-40, 40), ns = pickNames3();
    const fig = angleFig(a1, a1 + m, ns, { right: m === 90, len: 3.4 });
    const o = mcq(`<p>Quelle est la nature de l'angle ${angN(ns.join(''))} ?</p>${fig}`, NATS.map(cap), kind, `L'angle ${angN(ns.join(''))} est ${NATMSG[kind]}.`, { keepOrder: true });
    return withRemed(withHints(o, hints), (i) => (kind === 0 && i === 2 ? 'Compare avec le coin de l\'équerre : cet angle est-il plus ouvert ou moins ouvert qu\'un angle droit ?' : kind === 2 && i === 0 ? 'Cet angle est plus ouvert qu\'un angle droit.' : i === 1 ? 'Un angle droit est codé par un petit carré. Est-ce le cas ici ?' : 'Regarde l\'ouverture entre les deux côtés.'));
  }
  const o = mcq(`<p class="statement">Un angle mesure <b>${deg(m)}</b>. Quelle est sa nature ?</p>`, NATS.map(cap), kind,
    `${deg(m)} : ${['entre 0° et 90°, l\'angle est <b>aigu</b>', 'exactement 90°, l\'angle est <b>droit</b>', 'entre 90° et 180°, l\'angle est <b>obtus</b>', 'exactement 180°, l\'angle est <b>plat</b>'][kind]}.`, { keepOrder: true });
  return withRemed(withHints(o, [`Relis « Mesures des angles particuliers » dans ${ficheLink('angles')}.`, 'Outil : aigu → moins de 90° ; droit → 90° ; obtus → entre 90° et 180° ; plat → 180°.']), () => `Compare ${deg(m)} avec 90° et avec 180°.`);
}

/* ---------- 3. Mesurer un angle (lire le rapporteur) ---------- */
function protractorScene(m) {
  const ns = pickNames3(), beta = rand(-25, 25), flip = Math.random() < 0.45;
  const b = polar(beta), nUp = polar(beta + 90);
  // côté de départ : extrémité « droite » (0 de la graduation extérieure) ou « gauche » (0 de la graduation intérieure)
  const s1 = flip ? G.mul(b, -1) : b;
  const theta = flip ? 180 - m : m;
  const s2 = G.add(G.mul(b, Math.cos((theta * Math.PI) / 180)), G.mul(nUp, Math.sin((theta * Math.PI) / 180)));
  const V = { x: 0, y: 0 }, L = 4.3;
  const P1 = G.mul(s1, L - 0.3), P2 = G.mul(s2, L - 0.3);
  const items = [protractorDraw(V, b, nUp, 3.1), F2.seg(V, G.mul(s1, L), 'f-seg f-thick'), F2.seg(V, G.mul(s2, L), 'f-seg f-thick')];
  const fig = figure({ [ns[1]]: V, [ns[0]]: P1, [ns[2]]: P2 }, items, { marks: { [ns[1]]: 'none', [ns[0]]: { dash: s1 }, [ns[2]]: { dash: s2 } }, extra: [G.mul(b, 3.6), G.mul(b, -3.6), G.mul(nUp, 3.5), G.mul(nUp, -0.6)], pad: 0.6, center: G.mul(nUp, -2), cls: 'p2-protfig' });
  return { ns, fig, flip };
}
function genAngMesure() {
  let m; do { m = 5 * rand(4, 32); } while (m >= 80 && m <= 100);
  const nm = (ns) => angN(ns.join(''));
  if (Math.random() < 0.3) {
    const ns = pickNames3(), a1 = rand(-30, 40);
    const fig = angleFig(a1, a1 + m, ns, { len: 3.4 });
    const cand = [...new Set([m, 180 - m, clamp(m + pick([-30, 30, 45]), 10, 170), clamp(m + pick([-60, 60]), 10, 170)])].slice(0, 4);
    while (cand.length < 3) cand.push(clamp(m + 20 * cand.length, 10, 170));
    const o = mcq(`<p>Estime la mesure de l'angle ${nm(ns)}, sans rapporteur.</p>${fig}`, cand.map(deg), 0, `L'angle ${nm(ns)} mesure ${deg(m)} : il est ${NATS[natOf(m)]}${m < 90 ? ', donc moins de 90°' : ', donc plus de 90°'}.`);
    return withRemed(withHints(o, ['Outil : l\'angle est-il aigu ou obtus ? Compare-le à un angle droit (90°), puis à la moitié d\'un angle droit (45°).']), () => `Commence par la nature : l'angle est ${NATS[natOf(m)]}. Élimine les mesures impossibles.`);
  }
  const { ns, fig, flip } = protractorScene(m);
  return {
    hints: [`Relis les 4 étapes « Utiliser le rapporteur » dans ${ficheLink('angles')}.`, `Outil : repère le côté [${ns[1]}${ns[0]}) : sur quelle graduation est-il à 0 ? ${flip ? 'Ici, le 0 est sur la graduation intérieure.' : 'Ici, le 0 est sur la graduation extérieure.'}`, `Outil : l'angle est ${NATS[natOf(m)]} : ta mesure doit être ${m < 90 ? 'plus petite' : 'plus grande'} que 90°.`],
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, m)) return null;
      if (eq(x.value, 180 - m)) return `Tu as lu la mauvaise graduation. Suis celle qui part de <b>0</b> sur le côté [${ns[1]}${ns[0]}). Vérifie avec la nature : l'angle est ${NATS[natOf(m)]}.`;
      return null;
    },
    q: `<p>Lis la mesure de l'angle ${nm(ns)} sur le rapporteur.</p>${fig}<p class="big">${nm(ns)} = ${inp('num', 'Mesure')} °</p>`,
    check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, m); markInput(r, 0, ok); return { ok, msg: `Le centre est sur ${ns[1]}, le 0° est sur [${ns[1]}${ns[0]}) (graduation ${flip ? 'intérieure' : 'extérieure'}). On lit <b>${deg(m)}</b> sur [${ns[1]}${ns[2]}). L'angle est bien ${NATS[natOf(m)]}.` }; },
  };
}

/* ---------- 4. Construire un angle (planche avec rapporteur) ---------- */
function sceneAngle(O, b, m, nO = 'O', nx = 'x', ny = 'y', sg = -1) {
  // sg = -1 : la nouvelle demi-droite est au-dessus (à l'écran)
  const n = G.mul(G.perp(b), sg), X = G.add(O, G.mul(b, 6.5));
  const d = G.rot(b, sg * m), Mk = G.add(O, G.mul(d, 3)), Y = G.add(O, G.mul(d, 6));
  const c = G.add(O, G.mul(n, -2));
  return {
    pts: [O, X, Y, G.add(O, G.mul(n, 3.4)), G.add(O, G.mul(b, -3.4))],
    base: [F2.seg(O, X), ptSVG(nO, O, c, 1, 'none'), F2.text(G.add(X, G.mul(n, -0.45)), nx, 'f-lname')],
    steps: [
      { text: `Place le <b>centre</b> du rapporteur sur ${nO} et le <b>0°</b> sur la demi-droite [${nO}${nx}).`, dur: 1600, draw: (t, final) => (final ? '' : protractorDraw(O, b, n, 3.1)) },
      { text: `Suis la graduation qui part de 0 jusqu'à <b>${m}°</b> et fais une petite marque.`, dur: 1600, draw: (t, final) => (final ? `<circle cx="${Mk.x}" cy="${Mk.y}" r="0.08" class="a-tip"/>` : protractorDraw(O, b, n, 3.1) + `<circle cx="${Mk.x}" cy="${Mk.y}" r="${(0.08 * Math.min(1, t * 2)).toFixed(3)}" class="a-tip"/>`) },
      STEP.seg(O, Y, `Enlève le rapporteur et relie la marque à ${nO} : c'est la demi-droite [${nO}${ny}).`, { side: G.perp(d), center: c }),
      STEP.marks(arcMark(O, b, d, 0.8, 'f-arcm f-arc-red') + arcLabel(O, b, d, `${m}°`, 1.4) + F2.text(G.add(Y, G.mul(n, 0.45)), ny, 'f-lname'), `L'angle ${angN(nx + nO + ny)} mesure ${m}°.`),
    ],
  };
}
function genAngConstruire() {
  let m; do { m = rand(3, 33) * 5; } while (m === 90);
  const nO = pick(['O', 'A', 'K', 'S']), nx = pick(['x', 'u']), ny = nx === 'x' ? 'y' : 'v';
  const beta = rand(-12, 12), b = dirDeg(beta);
  const O = { x: m > 90 ? 8.2 : 4.5, y: 8 }, X = G.add(O, G.mul(b, 6.8));
  const good = (d) => Math.abs(angDeg(b, d) - m) <= 1.5;
  return {
    hints: [`Relis les 4 étapes « Construire un angle » dans ${ficheLink('angles')}.`, `Outil Rapporteur : clique sur ${nO}, puis sur la demi-droite [${nO}${nx}), tourne jusqu'à ${m}° et clique pour faire une marque. Enfin, outil Demi-droite : de ${nO} vers la marque.`, 'Clique sur « 🎬 Voir un exemple ».'],
    anim: () => sceneAngle(O, b, m, nO, nx, ny),
    example: () => sceneAngle({ x: 0, y: 0 }, { x: 1, y: 0 }, m === 65 ? 140 : 65, 'A', 'u', 'v'),
    remediate(r) {
      const ds = raysFrom(r._board, O); if (!ds.length || ds.some(good)) return null;
      if (ds.some((d) => Math.abs(angDeg(b, d) - (180 - m)) <= 1.5)) return `Ton angle mesure ${180 - m}° : tu as suivi la mauvaise graduation. Suis celle qui part de <b>0</b> sur [${nO}${nx}).`;
      const a = Math.round(angDeg(b, ds[ds.length - 1]));
      return `Ta demi-droite fait un angle de ${a}° avec [${nO}${nx}), au lieu de ${m}°. Utilise le Rapporteur pour placer une marque précise.`;
    },
    q: `<p class="statement">Construis un angle ${angN(nx + nO + ny)} de <b>${m}°</b> à partir de la demi-droite [${nO}${nx}).</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { prot: true, tool: 'prot', names: [], given: { points: [{ name: nO, ...O }, { name: nx, ...X, mark: { dash: b } }], segs: [[nO, nx]] } }); },
    check(r) {
      const ds = raysFrom(r._board, O);
      if (!ds.length) return r._board.drawnCount() ? { retry: true, msg: `Il manque le deuxième côté : trace la demi-droite d'origine ${nO} qui passe par ta marque (outil Demi-droite).` } : null;
      const ok = ds.some(good);
      return { ok, msg: ok ? `Ton angle mesure bien ${m}°.` : `Il fallait une demi-droite d'origine ${nO} qui fait un angle de <b>${m}°</b> avec [${nO}${nx}). Centre du rapporteur sur ${nO}, 0° sur [${nO}${nx}), marque à ${m}° sur la graduation qui part de 0, puis on relie.` };
    },
  };
}

/* ---------- 5. Relations entre angles : calculer ---------- */
function crossFig(names, a0, x, askI) {
  // deux droites sécantes en O ; secteurs 0..3 dans le sens direct à partir de la direction a0
  const [nE, nF, nG, nH] = names, O = { x: 0, y: 0 }, L = 3.2;
  const dE = polar(a0 + 180), dF = polar(a0), dG = polar(a0 + 180 - x), dH = polar(a0 - x);
  const E = G.mul(dE, L), F = G.mul(dF, L), Gp = G.mul(dG, L), H = G.mul(dH, L);
  // angle donné : EOG (entre dE et dG), mesure x
  const items = [F2.seg(E, F), F2.seg(Gp, H), arcMark(O, dE, dG, 0.7, 'f-arcm f-arc-red'), arcLabel(O, dE, dG, `${x}°`, 1.3)];
  if (askI) items.push(arcMark(O, askI[0], askI[1], 0.55, 'f-arcm f-arc-blue'), arcLabel(O, askI[0], askI[1], '?', 1.15, 'f-len f-blue-t'));
  return { fig: figure({ [nE]: E, [nF]: F, [nG]: Gp, [nH]: H, O }, items, { marks: { [nE]: { dash: dE }, [nF]: { dash: dF }, [nG]: { dash: dG }, [nH]: { dash: dH }, O: 'none' }, center: G.mul(polar(a0 + 90), -6) }), dE, dF, dG, dH };
}
function genAngCalcul() {
  const v = rand(0, 3);
  if (v <= 1) {
    const comp = v === 0, tot = comp ? 90 : 180, x = comp ? rand(12, 78) : rand(25, 155);
    return {
      hints: [`Relis le tableau « Relations entre deux angles » dans ${ficheLink('angles')}.`, comp ? 'Outil : deux angles complémentaires font 90° à eux deux.' : 'Outil : deux angles supplémentaires font 180° à eux deux.', `Exemple : ${comp ? '90° − 35° = 55°' : '180° − 120° = 60°'}.`],
      remediate(r) {
        const y = val(r); if (!y || eq(y.value, tot - x)) return null;
        if (eq(y.value, (comp ? 180 : 90) - x)) return comp ? 'Attention : <b>complémentaires</b> → la somme vaut 90°, pas 180°.' : 'Attention : <b>supplémentaires</b> → la somme vaut 180°, pas 90°.';
        if (eq(y.value, x)) return `Les deux angles n'ont pas forcément la même mesure : leur <b>somme</b> vaut ${tot}°.`;
        return null;
      },
      q: `<p class="statement">Deux angles sont <b>${comp ? 'complémentaires' : 'supplémentaires'}</b>. L'un mesure ${deg(x)}. Combien mesure l'autre ?</p><p class="big">${inp('num', 'Mesure')} °</p>`,
      check(r) { const y = val(r); if (!y) return null; const ok = eq(y.value, tot - x); markInput(r, 0, ok); return { ok, msg: `${comp ? 'Complémentaires' : 'Supplémentaires'} : la somme vaut ${tot}°. ${tot}° − ${deg(x)} = <b>${deg(tot - x)}</b>.` }; },
    };
  }
  const names = pick([['E', 'F', 'G', 'H'], ['A', 'B', 'C', 'D'], ['R', 'S', 'T', 'U']]), [nE, nF, nG, nH] = names;
  const x = rand(30, 150), a0 = rand(-20, 20), opp = v === 2;
  const pre = crossFig(names, a0, x);
  const ask = opp ? [pre.dF, pre.dH] : [pre.dE, pre.dH];
  const { fig } = crossFig(names, a0, x, ask);
  const askN = opp ? `${nF}O${nH}` : `${nE}O${nH}`, ans = opp ? x : 180 - x;
  if (Math.random() < 0.35) {
    const opts = ['Ils sont opposés par le sommet, donc ils ont la même mesure.', 'Ils sont supplémentaires : ensemble, ils forment un angle plat.', 'Ils sont complémentaires.', 'Ils sont adjacents, donc ils ont la même mesure.'];
    const o = mcq(`<p>Les droites (${nE}${nF}) et (${nG}${nH}) se coupent en O. Que peut-on dire des angles ${angN(nE + 'O' + nG)} et ${angN(askN)} ?</p>${fig}`, opts, opp ? 0 : 1,
      opp ? `${angN(nE + 'O' + nG)} et ${angN(askN)} sont <b>opposés par le sommet</b> : ils ont la même mesure, ${deg(x)}.` : `${nG}, O et ${nH} sont alignés : ${angN(nE + 'O' + nG)} et ${angN(askN)} forment un angle plat. Ils sont <b>supplémentaires</b> : ${angN(askN)} = 180° − ${deg(x)} = ${deg(180 - x)}.`, { col: true });
    return withRemed(withHints(o, [`Relis la propriété des angles opposés par le sommet dans ${ficheLink('angles')}.`, 'Outil : les côtés de l\'un sont-ils dans le prolongement des côtés de l\'autre ? Ou forment-ils ensemble un angle plat ?']),
      (i) => (i === 3 ? 'Des angles adjacents n\'ont pas forcément la même mesure.' : opp ? 'Regarde : les côtés de l\'un prolongent les côtés de l\'autre.' : 'Regarde : à eux deux, ils forment un demi-tour (un angle plat).'));
  }
  return {
    hints: [`Relis la méthode « Utiliser les angles opposés par le sommet » dans ${ficheLink('angles')}.`, opp ? 'Outil : les deux angles sont-ils opposés par le sommet ?' : `Outil : ${nG}, O et ${nH} sont alignés. Les deux angles forment ensemble un angle plat (180°).`],
    remediate(r) {
      const y = val(r); if (!y || eq(y.value, ans)) return null;
      if (eq(y.value, opp ? 180 - x : x)) return opp ? 'Ces deux angles sont <b>opposés par le sommet</b> : ils ont la même mesure.' : 'Ces deux angles ne sont pas opposés par le sommet : ils sont côte à côte et forment un angle plat.';
      if (eq(y.value, 90 - x)) return 'Ici, il n\'y a pas d\'angle droit : pense plutôt à l\'angle plat (180°).';
      return null;
    },
    q: `<p>Les droites (${nE}${nF}) et (${nG}${nH}) se coupent en O, et ${angN(nE + 'O' + nG)} = ${deg(x)}.</p>${fig}<p class="big">${angN(askN)} = ${inp('num', 'Mesure')} °</p>`,
    check(r) { const y = val(r); if (!y) return null; const ok = eq(y.value, ans); markInput(r, 0, ok); return { ok, msg: opp ? `${angN(nE + 'O' + nG)} et ${angN(askN)} sont opposés par le sommet, donc ils ont la même mesure : ${angN(askN)} = <b>${deg(x)}</b>.` : `${angN(nE + 'O' + nG)} et ${angN(askN)} forment un angle plat : ils sont supplémentaires. ${angN(askN)} = 180° − ${deg(x)} = <b>${deg(180 - x)}</b>.` }; },
  };
}

/* ---------- 6. Relations entre angles : reconnaître ---------- */
function genAngReco() {
  if (Math.random() < 0.4) {
    const kind = rand(0, 2), x = rand(15, 75);
    const y = kind === 0 ? 90 - x : kind === 1 ? 180 - x : pick([95 - x, 100 - x, 170 - x, 175 - x]);
    const opts = ['complémentaires', 'supplémentaires', 'ni complémentaires, ni supplémentaires'];
    const o = mcq(`<p class="statement">Deux angles mesurent ${deg(x)} et ${deg(y)}. Ils sont…</p>`, opts, kind, `${deg(x)} + ${deg(y)} = ${deg(x + y)} : ${kind === 0 ? 'la somme vaut 90°, ils sont <b>complémentaires</b>' : kind === 1 ? 'la somme vaut 180°, ils sont <b>supplémentaires</b>' : 'ni 90°, ni 180° : ils ne sont <b>ni complémentaires, ni supplémentaires</b>'}.`, { keepOrder: true });
    return withRemed(withHints(o, ['Outil : additionne les deux mesures.', 'Complémentaires → 90° ; supplémentaires → 180°.']), () => `Calcule ${deg(x)} + ${deg(y)}.`);
  }
  const kind = rand(0, 3); // 0 adjacents, 1 opposés, 2 même côté (pas adjacents), 3 sommets différents
  const O = { x: 0, y: 0 }, a0 = rand(-15, 25), L = 3.3;
  let items = [], pts = { O }, marks = { O: 'none' };
  const d = (a) => polar(a), P = (a) => G.mul(polar(a), L);
  if (kind === 0) {
    const a1 = a0, a2 = a0 + rand(30, 60), a3 = a2 + rand(30, 60);
    items = [F2.seg(O, P(a1)), F2.seg(O, P(a2)), F2.seg(O, P(a3)), arcMark(O, d(a1), d(a2), 0.75, 'f-arcm f-arc-red'), arcMark(O, d(a2), d(a3), 0.95, 'f-arcm f-arc-blue')];
  } else if (kind === 1) {
    const x = rand(40, 130);
    items = [F2.seg(P(a0), P(a0 + 180)), F2.seg(P(a0 + x), P(a0 + x + 180)), arcMark(O, d(a0), d(a0 + x), 0.75, 'f-arcm f-arc-red'), arcMark(O, d(a0 + 180), d(a0 + x + 180), 0.75, 'f-arcm f-arc-blue')];
  } else if (kind === 2) {
    const a1 = a0, a2 = a0 + rand(25, 45), a3 = a2 + rand(25, 50);
    items = [F2.seg(O, P(a1)), F2.seg(O, P(a2)), F2.seg(O, P(a3)), arcMark(O, d(a1), d(a2), 0.7, 'f-arcm f-arc-red'), arcMark(O, d(a1), d(a3), 1.15, 'f-arcm f-arc-blue')];
  } else {
    const Q = { x: 4.2, y: 0.3 };
    items = [F2.seg(O, Q), F2.seg(O, P(a0 + 60)), F2.seg(Q, G.add(Q, polar(120, L))), arcMark(O, G.sub(Q, O), d(a0 + 60), 0.75, 'f-arcm f-arc-red'), arcMark(Q, G.sub(O, Q), polar(120), 0.75, 'f-arcm f-arc-blue')];
    pts = { O, P: Q }; marks = { O: 'none', P: 'none' };
  }
  const fig = figure(pts, items, { marks, extra: [P(a0), P(a0 + 180), P(a0 + 90), P(a0 + 270)].concat(kind === 3 ? [{ x: 5, y: -3 }] : []), pad: 0.5 });
  const opts = ['adjacents', 'opposés par le sommet', 'ni adjacents, ni opposés par le sommet'];
  const good = kind <= 1 ? kind : 2;
  const expl = ['Ils ont le même sommet, un côté commun, et ils sont de part et d\'autre de ce côté : ils sont <b>adjacents</b>.', 'Les côtés de l\'un sont dans le prolongement des côtés de l\'autre : ils sont <b>opposés par le sommet</b>.', 'Ils ont un côté commun, mais ils ne sont pas de part et d\'autre de ce côté (l\'un est dans l\'autre) : ils ne sont <b>pas adjacents</b>.', 'Ils n\'ont pas le même sommet : ils ne sont <b>ni adjacents, ni opposés par le sommet</b>.'][kind];
  const o = mcq(`<p>Les angles rouge et bleu sont…</p>${fig}`, opts, good, expl, { keepOrder: true });
  return withRemed(withHints(o, [`Relis le tableau « Relations entre deux angles » dans ${ficheLink('angles')}.`, 'Outil : vérifie dans l\'ordre : même sommet ? un côté commun ? de part et d\'autre de ce côté ?']),
    () => (kind === 2 ? 'Ils ont bien un côté commun… mais l\'angle rouge est <b>à l\'intérieur</b> de l\'angle bleu. Sont-ils de part et d\'autre du côté commun ?' : kind === 3 ? 'Regarde les sommets : est-ce le même point ?' : 'Vérifie les conditions une par une : même sommet, côté commun, position.'));
}

/* ---------- 7. La bissectrice ---------- */
function sceneBiss(K, ux, m, nK = 'K', sg = -1) {
  const n = G.mul(G.perp(ux), sg), uy = G.rot(ux, sg * m), uz = G.rot(ux, (sg * m) / 2);
  const X = G.add(K, G.mul(ux, 6)), Y = G.add(K, G.mul(uy, 5.5)), Z = G.add(K, G.mul(uz, 6)), Mk = G.add(K, G.mul(uz, 3));
  const c = G.add(K, G.mul(G.add(ux, uy), -1.5));
  return {
    pts: [K, X, Y, Z, G.add(K, G.mul(n, 3.4)), G.add(K, G.mul(ux, -1))],
    base: [F2.seg(K, X), F2.seg(K, Y), ptSVG(nK, K, c, 1, 'none'), F2.text(G.add(X, G.mul(n, -0.45)), 'x', 'f-lname'), F2.text(G.add(Y, G.mul(G.perp(uy), sg * 0.45)), 'y', 'f-lname')],
    steps: [
      { text: `On mesure l'angle : ${angN('x' + nK + 'y')} = ${m}°.`, dur: 1700, draw: (t, final) => (final ? '' : protractorDraw(K, ux, n, 3.1)) },
      { text: `On divise par 2 : ${m}° : 2 = <b>${m / 2}°</b>. On fait une marque à ${m / 2}° à partir de [${nK}x).`, dur: 1700, draw: (t, final) => (final ? `<circle cx="${Mk.x}" cy="${Mk.y}" r="0.08" class="a-tip"/>` : protractorDraw(K, ux, n, 3.1) + `<circle cx="${Mk.x}" cy="${Mk.y}" r="0.08" class="a-tip"/>`) },
      STEP.seg(K, Z, 'On relie la marque au sommet : c\'est la bissectrice.', { side: G.perp(uz), center: c, cls: 'f-seg f-blue' }),
      STEP.marks(arcMark(K, ux, uz, 0.9, 'f-arcm f-arc-red') + arcMark(K, uz, uy, 1.1, 'f-arcm f-arc-red') + arcLabel(K, ux, uz, `${m / 2}°`, 1.55) + arcLabel(K, uz, uy, `${m / 2}°`, 1.7), `Les deux angles obtenus mesurent ${m / 2}° chacun.`),
    ],
  };
}
function genAngBiss() {
  if (Math.random() < 0.4) {
    const half = rand(12, 80), toHalf = Math.random() < 0.6, nO = pick(['O', 'A', 'K']);
    const q = toHalf ? `[${nO}z) est la bissectrice de l'angle ${angN('x' + nO + 'y')}, et ${angN('x' + nO + 'y')} = ${deg(2 * half)}.` : `[${nO}z) est la bissectrice de l'angle ${angN('x' + nO + 'y')}, et ${angN('x' + nO + 'z')} = ${deg(half)}.`;
    const askN = toHalf ? 'x' + nO + 'z' : 'x' + nO + 'y', ans = toHalf ? half : 2 * half;
    return {
      hints: [`Relis la définition de la bissectrice dans ${ficheLink('angles')}.`, 'Outil : la bissectrice partage l\'angle en <b>deux angles de même mesure</b>.'],
      remediate(r) { const y = val(r); if (!y || eq(y.value, ans)) return null; if (eq(y.value, toHalf ? 2 * half : half)) return toHalf ? `${angN('x' + nO + 'z')} n'est que la moitié de ${angN('x' + nO + 'y')}.` : `${angN('x' + nO + 'y')} est l'angle entier : il vaut deux fois ${angN('x' + nO + 'z')}.`; return null; },
      q: `<p class="statement">${q}</p><p class="big">${angN(askN)} = ${inp('num', 'Mesure')} °</p>`,
      check(r) { const y = val(r); if (!y) return null; const ok = eq(y.value, ans); markInput(r, 0, ok); return { ok, msg: toHalf ? `La bissectrice partage l'angle en deux : ${deg(2 * half)} : 2 = <b>${deg(half)}</b>.` : `L'angle entier vaut deux fois la moitié : 2 × ${deg(half)} = <b>${deg(2 * half)}</b>.` }; },
    };
  }
  const m = 2 * rand(18, 70), nK = pick(['K', 'O', 'A']);
  const beta = rand(-10, 10), ux = dirDeg(beta), uy = G.rot(ux, -m), uz = G.rot(ux, -m / 2);
  const K = { x: m > 100 ? 7.5 : 4.5, y: 8.4 }, X = G.add(K, G.mul(ux, 6.8)), Y = G.add(K, G.mul(uy, 6));
  const good = (d) => Math.abs(angDeg(d, uz) ) <= 1.5;
  return {
    hints: [`Relis la méthode « Construire la bissectrice » dans ${ficheLink('angles')}.`, `Outil : mesure d'abord l'angle ${angN('x' + nK + 'y')} avec le Rapporteur (clique sur ${nK}, puis sur [${nK}x) : la mesure s'affiche quand tu vises [${nK}y)). Puis divise par 2.`, 'Clique sur « 🎬 Voir un exemple ».'],
    anim: () => sceneBiss(K, ux, m, nK),
    example: () => sceneBiss({ x: 0, y: 0 }, { x: 1, y: 0 }, m === 70 ? 100 : 70, 'A'),
    remediate(r) {
      const ds = raysFrom(r._board, K).filter((d) => Math.abs(angDeg(d, ux)) > 1 && Math.abs(angDeg(d, uy)) > 1); if (!ds.length || ds.some(good)) return null;
      const d = ds[ds.length - 1], ax = Math.round(angDeg(d, ux)), ay = Math.round(angDeg(d, uy));
      if (Math.abs(angDeg(d, G.mul(uz, -1))) <= 1.5 || ax + ay > m + 2) return 'La bissectrice est <b>à l\'intérieur</b> de l\'angle, entre ses deux côtés.';
      return `Ta demi-droite fait ${ax}° avec [${nK}x) et ${ay}° avec [${nK}y) : les deux angles doivent être égaux, ${m / 2}° chacun.`;
    },
    q: `<p class="statement">Construis la <b>bissectrice</b> de l'angle ${angN('x' + nK + 'y')}.</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { prot: true, tool: 'prot', names: [], given: { points: [{ name: nK, ...K }, { name: 'x', ...X, mark: { dash: ux } }, { name: 'y', ...Y, mark: { dash: uy } }], segs: [[nK, 'x'], [nK, 'y']] } }); },
    check(r) {
      const ds = raysFrom(r._board, K).filter((d) => Math.abs(angDeg(d, ux)) > 1 && Math.abs(angDeg(d, uy)) > 1);
      if (!ds.length) return r._board.drawnCount() ? { retry: true, msg: `Trace la bissectrice : une demi-droite d'origine ${nK} qui passe par ta marque.` } : null;
      const ok = ds.some(good);
      return { ok, msg: ok ? `${angN('x' + nK + 'y')} = ${m}° et ${m}° : 2 = ${m / 2}° : ta demi-droite partage bien l'angle en deux angles de ${m / 2}°.` : `On mesure : ${angN('x' + nK + 'y')} = ${m}°. On divise par 2 : ${m / 2}°. On construit un angle de <b>${m / 2}°</b> à partir de [${nK}x).` };
    },
  };
}

/* =========================================================
   CHAPITRE 7 — LES TRIANGLES
   ========================================================= */
const triFig = (pts, extra = [], opts = {}) => {
  const ks = Object.keys(pts).filter((k) => !k.startsWith('_'));
  const [A, B, C] = ks.map((k) => pts[k]);
  const marks = {}; ks.forEach((k) => { marks[k] = 'none'; });
  return figure(pts, [F2.seg(A, B), F2.seg(B, C), F2.seg(C, A), ...extra], { marks, ...opts });
};
/** sommet C d'un triangle connaissant [AB] et les longueurs AC = b, BC = a (côté « au-dessus » à l'écran) */
function apex(A, B, b, a, up = true) {
  const sol = interCC({ c: A, r: b }, { c: B, r: a });
  if (!sol.length) return null;
  return sol.sort((p, q) => (up ? p.y - q.y : q.y - p.y))[0];
}
const otherSide = (A, B, P) => { const u = G.norm(G.sub(B, A)), H = G.add(A, G.mul(u, G.dot(G.sub(P, A), u))); return G.sub(G.mul(H, 2), P); };
/** base [AB] sur la planche (16 × 11) : horizontale à peu près, en bas */
function boardBase(L, tilt = 8) {
  const u = dirDeg(rand(-tilt, tilt)), M = { x: 8, y: 8.6 };
  return { A: G.sub(M, G.mul(u, L / 2)), B: G.add(M, G.mul(u, L / 2)), u };
}
const half = (x) => Math.round(x * 2) / 2;

/* ---------- 1. Vocabulaire ---------- */
function genTriVoc() {
  const ns = pickNames3(), P = randTriangle(35), [n0, n1, n2] = ns;
  const v = rand(0, 3);
  const hints = [`Relis « Définition et vocabulaire » dans ${ficheLink('triangles')}.`, 'Outil : le côté opposé à un sommet est le côté qui ne passe pas par ce sommet (il est « en face »).'];
  if (v === 3) {
    // hypoténuse
    const A = { x: 0, y: 0 }, B = { x: rand(35, 60) / 10, y: 0 }, C = { x: 0, y: -rand(25, 40) / 10 };
    const fig = triFig({ [n0]: A, [n1]: B, [n2]: C }, [F2.right(A, G.sub(B, A), G.sub(C, A), 0.35)]);
    const opts = [`[${n1}${n2}]`, `[${n0}${n1}]`, `[${n0}${n2}]`];
    const o = mcq(`<p>Le triangle ${ns.join('')} est rectangle en ${n0}. Quelle est son <b>hypoténuse</b> ?</p>${fig}`, opts, 0, `L'hypoténuse est le côté <b>opposé à l'angle droit</b> : c'est [${n1}${n2}]. C'est aussi le plus long côté.`, { keepOrder: true });
    return withRemed(withHints(o, [`Relis « Le triangle rectangle » dans ${ficheLink('triangles')}.`, 'Outil : l\'hypoténuse est en face de l\'angle droit.']), () => `[${opts[1].slice(1, 3)}] et [${opts[2].slice(1, 3)}] forment l'angle droit. L'hypoténuse est le côté <b>en face</b> de l'angle droit.`);
  }
  const fig = triFig({ [n0]: P[0], [n1]: P[1], [n2]: P[2] });
  if (v === 0) {
    const i = rand(0, 2), opp = `[${ns[(i + 1) % 3]}${ns[(i + 2) % 3]}]`;
    const opts = [opp, `[${ns[i]}${ns[(i + 1) % 3]}]`, `[${ns[i]}${ns[(i + 2) % 3]}]`];
    const o = mcq(`<p>Dans le triangle ${ns.join('')}, quel est le côté <b>opposé au sommet ${ns[i]}</b> ?</p>${fig}`, opts, 0, `Le côté opposé à ${ns[i]} est celui qui ne passe pas par ${ns[i]} : <b>${opp}</b>.`);
    return withRemed(withHints(o, hints), () => `Ce côté passe par ${ns[i]}. Le côté opposé est en face de ${ns[i]}.`);
  }
  if (v === 1) {
    const i = rand(0, 2), side = `[${ns[(i + 1) % 3]}${ns[(i + 2) % 3]}]`;
    const o = mcq(`<p>Dans le triangle ${ns.join('')}, quel est le sommet <b>opposé au côté ${side}</b> ?</p>${fig}`, [ns[i], ns[(i + 1) % 3], ns[(i + 2) % 3]], 0, `Le sommet opposé à ${side} est celui qui n'est pas sur ce côté : <b>${ns[i]}</b>.`, { keepOrder: false });
    return withRemed(withHints(o, hints), () => `Ce point est une extrémité de ${side}. Le sommet opposé est en face.`);
  }
  const i = rand(0, 2), j = (i + 1) % 3, k = (i + 2) % 3;
  const fig2 = triFig({ [n0]: P[0], [n1]: P[1], [n2]: P[2] }, [arcMark(P[i], G.sub(P[j], P[i]), G.sub(P[k], P[i]), 0.6, 'f-arcm f-arc-red')]);
  const opts = [angN(ns[j] + ns[i] + ns[k]), angN(ns[i] + ns[j] + ns[k]), angN(ns[j] + ns[k] + ns[i])];
  const o = mcq(`<p>Comment s'appelle l'angle marqué en rouge ?</p>${fig2}`, opts, 0, `Son sommet est ${ns[i]}, au milieu du nom : ${opts[0]}.`);
  return withRemed(withHints(o, [`Relis « Nommer un angle » dans ${ficheLink('angles')}.`, 'Outil : le sommet de l\'angle s\'écrit au milieu.']), () => `Le sommet de l'angle rouge est ${ns[i]} : sa lettre doit être au milieu.`);
}

/* ---------- 2. Reconnaître un triangle particulier (codage) ---------- */
function genTriNature() {
  const ns = pickNames3(), kind = rand(0, 3); // 0 isocèle, 1 équilatéral, 2 rectangle, 3 rectangle isocèle
  const top = rand(0, 2); // sommet particulier
  let A, B, C;
  if (kind === 1) { A = { x: 0, y: 0 }; B = { x: 4, y: 0 }; C = { x: 2, y: -2 * Math.sqrt(3) }; }
  else if (kind === 0) { const h = rand(25, 50) / 10, w = rand(25, 45) / 10; A = { x: 0, y: 0 }; B = { x: w, y: 0 }; C = { x: w / 2, y: -h }; }
  else if (kind === 2) { A = { x: 0, y: 0 }; B = { x: rand(35, 55) / 10, y: 0 }; C = { x: 0, y: -rand(20, 35) / 10 }; }
  else { A = { x: 0, y: 0 }; B = { x: 3.4, y: 0 }; C = { x: 0, y: -3.4 }; }
  const rotA = rand(-25, 25);
  [A, B, C] = [A, B, C].map((p) => G.rot(p, rotA));
  // le sommet principal (C pour isocèle, A pour rectangle) reçoit le nom ns[top]
  const order = kind === 0 ? [C, A, B] : [A, B, C]; // order[0] = sommet particulier
  const names = [ns[top], ns[(top + 1) % 3], ns[(top + 2) % 3]];
  const pts = { [names[0]]: order[0], [names[1]]: order[1], [names[2]]: order[2] };
  const [S, Q, R] = order, items = [];
  if (kind === 0) items.push(tick(S, Q), tick(S, R));
  if (kind === 1) items.push(tick(S, Q), tick(Q, R), tick(R, S));
  if (kind >= 2) items.push(F2.right(S, G.sub(Q, S), G.sub(R, S), 0.35));
  if (kind === 3) items.push(tick(S, Q), tick(S, R));
  const nm = names.join('');
  const good = [`isocèle en ${names[0]}`, 'équilatéral', `rectangle en ${names[0]}`, `rectangle isocèle en ${names[0]}`][kind];
  const pool = [`isocèle en ${names[0]}`, `isocèle en ${names[1]}`, 'équilatéral', `rectangle en ${names[0]}`, `rectangle en ${names[2]}`, `rectangle isocèle en ${names[0]}`, 'quelconque'];
  const opts = [good, ...shuffle(pool.filter((x) => x !== good)).slice(0, 3)];
  const expl = ['deux côtés codés de la même longueur, qui partent de ' + names[0], 'trois côtés codés de la même longueur', 'un angle droit codé en ' + names[0], 'un angle droit en ' + names[0] + ' et deux côtés de même longueur qui partent de ' + names[0]][kind];
  const o = mcq(`<p>Quelle est la nature du triangle ${nm} ? Utilise le codage.</p>${triFig(pts, items)}`, opts, 0, `Le codage montre ${expl} : ${nm} est <b>${good}</b>.`);
  return withRemed(withHints(o, [`Relis les définitions des triangles particuliers dans ${ficheLink('triangles')}.`, 'Outil : les petits traits identiques codent des longueurs égales ; le petit carré code un angle droit.']), (i, t) => (/en /.test(t) && t.split(' en ')[0] === good.split(' en ')[0] ? 'Le bon type, mais pas le bon sommet : regarde d\'où partent les côtés codés (ou où est l\'angle droit).' : 'Regarde bien le codage : combien de côtés ont le même trait ? Y a-t-il un petit carré ?'));
}

/* ---------- 3. Construire un triangle connaissant ses trois côtés ---------- */
function sceneTri3([nA, nB, nC], A, B, C, b, a) {
  const ctr = centroid(A, B, C), u = G.norm(G.sub(B, A));
  const aA = ang2(G.sub(C, A)), aB = ang2(G.sub(C, B)), e = 0.3;
  return {
    pts: [A, B, C], center: ctr,
    base: [F2.seg(A, B), ptSVG(nA, A, ctr, 1, 'none'), ptSVG(nB, B, ctr, 1, 'none')],
    steps: [
      STEP.arc(A, b, aA - e, aA + e, `Pique en ${nA}, écarte le compas de <b>${cm(b)}</b> (${nA}${nC}) et trace un arc.`),
      STEP.arc(B, a, aB - e, aB + e, `Pique en ${nB}, écarte le compas de <b>${cm(a)}</b> (${nB}${nC}) et trace un arc.`),
      STEP.point(nC, C, ctr, `${nC} est à l'intersection des deux arcs.`),
      STEP.seg(A, C, `Trace [${nA}${nC}]…`, { side: G.perp(G.norm(G.sub(C, A))), center: ctr }),
      STEP.seg(B, C, `… et [${nB}${nC}]. Garde les arcs : ce sont les traits de construction.`, { side: G.perp(G.norm(G.sub(C, B))), center: ctr }),
    ],
    endText: 'Triangle construit.',
  };
}
function genTri3() {
  const ns = pickNames3(), [nA, nB, nC] = ns;
  if (Math.random() < 0.22) {
    const x = rand(2, 6), y = rand(2, 6), poss = Math.random() < 0.5, z = poss ? rand(Math.max(x, y) + 1, x + y - 1) : rand(x + y + 1, x + y + 4);
    const o = mcq(`<p class="statement">Peut-on construire un triangle ${ns.join('')} tel que ${nA}${nB} = ${cm(z)}, ${nA}${nC} = ${cm(x)} et ${nB}${nC} = ${cm(y)} ?</p>`, ['Oui', 'Non'], poss ? 0 : 1,
      poss ? `${x} + ${y} = ${x + y} est plus grand que ${z} : les deux arcs se coupent, le triangle existe.` : `${x} + ${y} = ${x + y} est plus petit que ${z} : les deux arcs ne se coupent pas, le triangle est <b>impossible</b>.`, { keepOrder: true });
    return withRemed(withHints(o, ['Outil : imagine la construction au compas. Les deux arcs vont-ils se rencontrer ?', 'Outil : compare le plus grand côté avec la somme des deux autres.']), () => `Compare ${z} avec ${x} + ${y}.`);
  }
  let L, b, a, C, base;
  for (;;) {
    L = half(rand(50, 80) / 10); b = half(rand(30, 70) / 10); a = half(rand(30, 70) / 10);
    if (b + a < L + 1 || Math.abs(b - a) > L - 1) continue;
    base = boardBase(L); C = apex(base.A, base.B, b, a, true);
    if (C && C.y > 0.8 && C.x > 0.6 && C.x < 15.4) break;
  }
  const { A, B } = base, C2 = otherSide(A, B, C);
  const at = (p) => G.dist(p, C) <= 0.15 || G.dist(p, C2) <= 0.15;
  return {
    hints: [`Relis la méthode « Construire un triangle connaissant ses trois côtés » dans ${ficheLink('triangles')}.`, `Outil : le point ${nC} est à ${cm(b)} de ${nA}, et à ${cm(a)} de ${nB}. Quel instrument trace tous les points situés à une distance donnée d'un point ?`, 'Clique sur « 🎬 Voir un exemple ».'],
    anim: () => sceneTri3(ns, A, B, C, b, a),
    example: () => { const A0 = { x: 0, y: 0 }, B0 = { x: 6, y: 0 }; return sceneTri3(['E', 'F', 'G'], A0, B0, apex(A0, B0, 4, 5), 4, 5); },
    remediate(r) {
      const P = r._board.byName(nC); if (!P || at(P)) return null;
      const dA = round1(G.dist(P, A)), dB = round1(G.dist(P, B));
      return `${nA}${nC} = ${cm(dA)} et ${nB}${nC} = ${cm(dB)}, au lieu de ${cm(b)} et ${cm(a)}. Trace deux arcs : centre ${nA} rayon ${cm(b)}, centre ${nB} rayon ${cm(a)}.`;
    },
    _t: { A, B, C },
    q: `<p class="statement">Construis le triangle ${ns.join('')} tel que ${nA}${nB} = ${cm(L)}, ${nA}${nC} = ${cm(b)} et ${nB}${nC} = ${cm(a)}. Le côté [${nA}${nB}] est déjà tracé.</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { tool: 'circle', names: [nC], given: { points: [{ name: nA, ...A }, { name: nB, ...B }], segs: [[nA, nB]] } }); },
    check(r) {
      const bd = r._board, P = bd.byName(nC);
      if (!P) return bd.drawnCount() ? { retry: true, msg: `Place le point ${nC} à l'intersection des deux arcs (choisis « ${nC} » dans « Prochain point »).` } : null;
      if (at(P) && !(bd.hasSeg(nA, nC) && bd.hasSeg(nB, nC))) return { retry: true, msg: `${nC} est bien placé ! Trace maintenant les côtés [${nA}${nC}] et [${nB}${nC}] avec la Règle.` };
      const ok = at(P);
      return { ok, msg: ok ? `${nA}${nC} = ${cm(b)} et ${nB}${nC} = ${cm(a)} : ton triangle est juste.` : `${nC} est à l'intersection de l'arc de centre ${nA} et de rayon ${cm(b)}, et de l'arc de centre ${nB} et de rayon ${cm(a)}.` };
    },
  };
}

/* ---------- 4. Construire un triangle avec des angles ---------- */
function sceneTriAng([nK, nL, nM], K, L, M, al, be) {
  const ctr = centroid(K, L, M), u = G.norm(G.sub(L, K)), up = G.mul(G.perp(u), -1);
  const dK = G.norm(G.sub(M, K)), dL = G.norm(G.sub(M, L));
  return {
    pts: [K, L, M, G.add(K, G.mul(up, 3.3)), G.add(L, G.mul(up, 3.3)), G.sub(K, G.mul(u, 1)), G.add(L, G.mul(u, 1))], center: ctr,
    base: [F2.seg(K, L), ptSVG(nK, K, ctr, 1, 'none'), ptSVG(nL, L, ctr, 1, 'none')],
    steps: [
      { text: `Rapporteur : centre sur ${nK}, 0° sur [${nK}${nL}). Marque à <b>${al}°</b>.`, dur: 1700, draw: (t, f) => (f ? '' : protractorDraw(K, u, up, 2.6)) },
      STEP.seg(K, G.add(K, G.mul(dK, G.dist(K, M) + 1.2)), `Trace la demi-droite d'origine ${nK} qui passe par la marque.`, { side: G.perp(dK), center: ctr, cls: 'f-seg f-thin' }),
      { text: `Rapporteur : centre sur ${nL}, 0° sur [${nL}${nK}). Marque à <b>${be}°</b>.`, dur: 1700, draw: (t, f) => (f ? '' : protractorDraw(L, G.mul(u, -1), up, 2.6)) },
      STEP.seg(L, G.add(L, G.mul(dL, G.dist(L, M) + 1.2)), `Trace la demi-droite d'origine ${nL} qui passe par la marque.`, { side: G.perp(dL), center: ctr, cls: 'f-seg f-thin' }),
      STEP.point(nM, M, ctr, `${nM} est à l'intersection des deux demi-droites.`, arcMark(K, u, dK, 0.7, 'f-arcm f-arc-red') + arcMark(L, G.mul(u, -1), dL, 0.7, 'f-arcm f-arc-red')),
    ],
  };
}
function genTriAngles() {
  const ns = pickNames3(), [nK, nL, nM] = ns;
  const twoSides = Math.random() < 0.35;
  let L, al, be, base, M, l2;
  for (;;) {
    L = half(rand(50, 75) / 10); base = boardBase(L, 6);
    const up = G.mul(G.perp(base.u), -1);
    if (twoSides) {
      al = 5 * rand(6, 24); l2 = half(rand(30, 60) / 10);
      M = G.add(base.A, G.mul(G.rot(base.u, -al), l2));
    } else {
      al = 5 * rand(6, 15); be = 5 * rand(6, 15);
      if (al + be > 130) continue;
      const d1 = G.rot(base.u, -al), d2 = G.rot(G.mul(base.u, -1), be);
      const X = interLL({ P: base.A, d: d1, t0: 0, t1: 50 }, { P: base.B, d: d2, t0: 0, t1: 50 });
      if (!X.length) continue; M = X[0];
    }
    if (M.y > 0.8 && M.x > 0.6 && M.x < 15.4 && up) break;
  }
  const { A: K, B: Lp } = base, M2 = otherSide(K, Lp, M);
  const at = (p) => G.dist(p, M) <= 0.18 || G.dist(p, M2) <= 0.18;
  const st = twoSides
    ? `Construis le triangle ${ns.join('')} tel que ${nK}${nL} = ${cm(L)}, ${angN(nL + nK + nM)} = ${al}° et ${nK}${nM} = ${cm(l2)}.`
    : `Construis le triangle ${ns.join('')} tel que ${nK}${nL} = ${cm(L)}, ${angN(nL + nK + nM)} = ${al}° et ${angN(nK + nL + nM)} = ${be}°.`;
  return {
    hints: [`Relis la méthode « ${twoSides ? 'Deux côtés et l\'angle compris entre eux' : 'Un côté et les deux angles qui lui sont adjacents'} » dans ${ficheLink('triangles')}.`, twoSides ? `Outil : construis l'angle de ${al}° en ${nK} (Rapporteur, puis Demi-droite), puis place ${nM} à ${cm(l2)} de ${nK} sur cette demi-droite (Règle).` : `Outil : Rapporteur en ${nK} (0° sur [${nK}${nL})) pour ${al}°, puis en ${nL} (0° sur [${nL}${nK})) pour ${be}°. ${nM} est à l'intersection des deux demi-droites.`, 'Clique sur « 🎬 Voir un exemple ».'],
    anim: () => (twoSides ? { ...sceneAngle(K, base.u, al, nK, nL, nM), endText: `Il reste à placer ${nM} à ${cm(l2)} de ${nK}, puis à tracer [${nL}${nM}].` } : sceneTriAng(ns, K, Lp, M, al, be)),
    example: () => { const K0 = { x: 0, y: 0 }, L0 = { x: 6, y: 0 }, X = interLL({ P: K0, d: polar(40), t0: 0, t1: 50 }, { P: L0, d: polar(120), t0: 0, t1: 50 })[0]; return sceneTriAng(['K', 'L', 'M'], K0, L0, X, 40, 60); },
    remediate(r) {
      const P = r._board.byName(nM); if (!P || at(P)) return null;
      const aK = Math.round(angDeg(G.sub(Lp, K), G.sub(P, K))), aL = Math.round(angDeg(G.sub(K, Lp), G.sub(P, Lp)));
      if (twoSides) return `Avec ton point, ${angN(nL + nK + nM)} = ${aK}° et ${nK}${nM} = ${cm(round1(G.dist(K, P)))}. Il faut ${al}° et ${cm(l2)}.`;
      if (Math.abs(aK - (180 - al)) <= 2 || Math.abs(aL - (180 - be)) <= 2) return 'Un de tes angles est le supplémentaire de celui demandé : tu as suivi la mauvaise graduation du rapporteur.';
      return `Avec ton point, ${angN(nL + nK + nM)} = ${aK}° et ${angN(nK + nL + nM)} = ${aL}°. Il faut ${al}° et ${be}°.`;
    },
    q: `<p class="statement">${st} Le côté [${nK}${nL}] est déjà tracé.</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { prot: true, tool: 'prot', names: [nM], given: { points: [{ name: nK, ...K }, { name: nL, ...Lp }], segs: [[nK, nL]] } }); },
    check(r) {
      const bd = r._board, P = bd.byName(nM);
      if (!P) return bd.drawnCount() ? { retry: true, msg: `Place le point ${nM} (outil Point, en choisissant « ${nM} » dans « Prochain point »).` } : null;
      if (at(P) && !(bd.hasSeg(nK, nM) && bd.hasSeg(nL, nM)) && !raysFrom(bd, K).length) return { retry: true, msg: `${nM} est bien placé ! Trace les côtés [${nK}${nM}] et [${nL}${nM}].` };
      const ok = at(P);
      return { ok, msg: ok ? 'Ton triangle respecte les mesures demandées.' : twoSides ? `On construit l'angle de ${al}° en ${nK} à partir de [${nK}${nL}), puis on place ${nM} à ${cm(l2)} de ${nK} sur la demi-droite.` : `On construit l'angle de ${al}° en ${nK} et l'angle de ${be}° en ${nL} (0° sur [${nL}${nK})). ${nM} est à l'intersection des deux demi-droites.` };
    },
  };
}

/* ---------- 5. Triangles isocèle et équilatéral ---------- */
function genTriIso() {
  const ns = pickNames3(), [nI, nJ, nK] = ns, equi = Math.random() < 0.3;
  let bL, l, base, I;
  for (;;) {
    bL = half(rand(40, 70) / 10); l = equi ? bL : half(rand(35, 75) / 10);
    if (!equi && (l <= bL / 2 + 0.6 || Math.abs(l - bL) < 0.4)) continue;
    base = boardBase(bL); I = apex(base.A, base.B, l, l, true);
    if (I && I.y > 0.8) break;
  }
  const { A: J, B: K } = base, I2 = otherSide(J, K, I);
  const at = (p) => G.dist(p, I) <= 0.15 || G.dist(p, I2) <= 0.15;
  const st = equi ? `Construis le triangle ${ns.join('')} <b>équilatéral</b> de côté ${cm(bL)}.` : `Construis le triangle ${ns.join('')} <b>isocèle en ${nI}</b> tel que ${nJ}${nK} = ${cm(bL)} et ${nI}${nJ} = ${cm(l)}.`;
  return {
    hints: [`Relis la méthode « Construire un triangle ${equi ? 'équilatéral' : 'isocèle'} » dans ${ficheLink('triangles')}.`, equi ? `Outil : les trois côtés mesurent ${cm(bL)}.` : `Outil : isocèle en ${nI}, donc ${nI}${nK} = ${nI}${nJ} = ${cm(l)}. Tu connais alors les trois côtés.`, `Outil : deux arcs de rayon ${cm(l)}, de centres ${nJ} et ${nK}.`],
    anim: () => ({ ...sceneTri3([nJ, nK, nI], J, K, I, l, l), endText: 'Triangle construit : code les côtés de même longueur.' }),
    example: () => { const A0 = { x: 0, y: 0 }, B0 = { x: 4, y: 0 }; return sceneTri3(['N', 'P', 'M'], A0, B0, apex(A0, B0, 5, 5), 5, 5); },
    remediate(r) {
      const P = r._board.byName(nI); if (!P || at(P)) return null;
      const d1 = round1(G.dist(P, J)), d2 = round1(G.dist(P, K));
      if (!equi && (Math.abs(d1 - l) <= 0.15) !== (Math.abs(d2 - l) <= 0.15)) return `${nI}${nJ} = ${cm(d1)} mais ${nI}${nK} = ${cm(d2)}. Le triangle est isocèle en ${nI} : ${nI}${nK} doit aussi mesurer ${cm(l)}.`;
      return `${nI}${nJ} = ${cm(d1)} et ${nI}${nK} = ${cm(d2)} : les deux doivent mesurer ${cm(l)}.`;
    },
    q: `<p class="statement">${st} Le côté [${nJ}${nK}] est déjà tracé.</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { tool: 'circle', names: [nI], given: { points: [{ name: nJ, ...J }, { name: nK, ...K }], segs: [[nJ, nK]] } }); },
    check(r) {
      const bd = r._board, P = bd.byName(nI);
      if (!P) return bd.drawnCount() ? { retry: true, msg: `Place le point ${nI} à l'intersection des deux arcs.` } : null;
      if (at(P) && !(bd.hasSeg(nI, nJ) && bd.hasSeg(nI, nK))) return { retry: true, msg: `${nI} est bien placé ! Trace [${nI}${nJ}] et [${nI}${nK}].` };
      const ok = at(P);
      return { ok, msg: (ok ? `${nI}${nJ} = ${nI}${nK} = ${cm(l)} : c'est juste. ` : `${equi ? 'Équilatéral : les trois côtés mesurent ' + cm(bL) : `Isocèle en ${nI} : ${nI}${nJ} = ${nI}${nK} = ${cm(l)}`}. On trace deux arcs de rayon ${cm(l)}, de centres ${nJ} et ${nK} : ${nI} est à leur intersection. `) + 'Sur ton cahier, n\'oublie pas de <b>coder</b> les côtés de même longueur.' };
    },
  };
}

/* ---------- 6. Triangle rectangle ---------- */
function genTriRect() {
  const ns = pickNames3(), [nA, nB, nC] = ns, hyp = Math.random() < 0.4;
  let p, q, h, base, C;
  for (;;) {
    p = half(rand(40, 70) / 10);
    if (hyp) { h = half(rand(Math.ceil((p + 1) * 10), 95) / 10); q = Math.sqrt(h * h - p * p); } else q = half(rand(25, 65) / 10);
    if (q > 7) continue;
    base = boardBase(p, 5); base = { ...base, A: G.add(base.A, { x: -1.5, y: 0 }), B: G.add(base.B, { x: -1.5, y: 0 }) };
    C = G.add(base.A, G.mul(G.perp(base.u), -q));
    if (C.y > 0.8) break;
  }
  const { A, B } = base, C2 = otherSide(A, B, C);
  const at = (P) => G.dist(P, C) <= 0.15 || G.dist(P, C2) <= 0.15;
  const st = hyp ? `Construis le triangle ${ns.join('')} rectangle en ${nA} tel que ${nA}${nB} = ${cm(p)} et ${nB}${nC} = ${cm(h)}.` : `Construis le triangle ${ns.join('')} rectangle en ${nA} tel que ${nA}${nB} = ${cm(p)} et ${nA}${nC} = ${cm(q)}.`;
  const sceneRect = () => {
    const ctr = centroid(A, B, C), up = G.norm(G.sub(C, A)), u = G.norm(G.sub(B, A));
    return {
      pts: [A, B, C, G.add(A, G.mul(up, 1.2)), G.sub(A, G.mul(u, 1))], center: ctr,
      base: [F2.seg(A, B), ptSVG(nA, A, ctr, 1, 'none'), ptSVG(nB, B, ctr, 1, 'none')],
      steps: [
        STEP.slide(G.add(A, G.mul(u, 2)), A, u, up, `Place l'équerre : l'angle droit sur ${nA}, un côté le long de [${nA}${nB}].`),
        STEP.xline(A, G.add(A, G.mul(up, G.dist(A, C) + 0.6)), `Trace la perpendiculaire à [${nA}${nB}] passant par ${nA}.`, u, 'f-thin', 0),
        hyp ? STEP.arc(B, h, ang2(G.sub(C, B)) - 0.25, ang2(G.sub(C, B)) + 0.25, `Arc de centre ${nB}, de rayon ${cm(h)} : il coupe la perpendiculaire en ${nC}.`) : STEP.measure(A, C, C, `Place ${nC} sur la perpendiculaire, à ${cm(q)} de ${nA}.`, G.mul(u, -1)),
        STEP.point(nC, C, ctr, `Voici ${nC}.`, F2.right(A, u, up, 0.35)),
        STEP.seg(B, C, `Trace [${nB}${nC}].`, { side: G.perp(G.norm(G.sub(C, B))), center: ctr }),
      ],
    };
  };
  return {
    anim: sceneRect,
    hints: [`Relis la méthode « Construire un triangle rectangle ${hyp ? 'connaissant l\'hypoténuse' : 'connaissant les côtés de l\'angle droit'} » dans ${ficheLink('triangles')}.`, `Outil : Équerre → clique sur [${nA}${nB}], puis sur ${nA} : tu obtiens la perpendiculaire en ${nA}.`, hyp ? `Outil : ${nC} est sur la perpendiculaire, à ${cm(h)} de ${nB} : arc de centre ${nB}, de rayon ${cm(h)}.` : `Outil : ${nC} est sur la perpendiculaire, à ${cm(q)} de ${nA} (Règle).`],
    remediate(r) {
      const P = r._board.byName(nC); if (!P || at(P)) return null;
      const a = Math.round(angDeg(G.sub(B, A), G.sub(P, A)));
      if (Math.abs(a - 90) > 1.5) return `L'angle en ${nA} mesure ${a}° : il doit être droit. Utilise l'Équerre en ${nA}.`;
      return hyp ? `${nB}${nC} = ${cm(round1(G.dist(B, P)))} au lieu de ${cm(h)}.` : `${nA}${nC} = ${cm(round1(G.dist(A, P)))} au lieu de ${cm(q)}.`;
    },
    q: `<p class="statement">${st} Le côté [${nA}${nB}] est déjà tracé.</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { tool: 'perp', names: [nC], given: { points: [{ name: nA, ...A }, { name: nB, ...B }], segs: [[nA, nB]] } }); },
    check(r) {
      const bd = r._board, P = bd.byName(nC);
      if (!P) return bd.drawnCount() ? { retry: true, msg: `Place le point ${nC} (choisis « ${nC} » dans « Prochain point »).` } : null;
      if (at(P) && !bd.hasSeg(nB, nC)) return { retry: true, msg: `${nC} est bien placé ! Trace les côtés du triangle (au moins [${nB}${nC}]).` };
      const ok = at(P);
      return { ok, msg: ok ? `L'angle en ${nA} est droit et ${hyp ? `${nB}${nC} = ${cm(h)}` : `${nA}${nC} = ${cm(q)}`}.` : `On trace la perpendiculaire à [${nA}${nB}] passant par ${nA}, puis ${hyp ? `un arc de centre ${nB} et de rayon ${cm(h)} : il coupe la perpendiculaire en ${nC}` : `on place ${nC} dessus à ${cm(q)} de ${nA}`}.` };
    },
  };
}

/* ---------- 7. Règle des 180° ---------- */
function genTri180() {
  const ns = pickNames3(), [nA, nB, nC] = ns, v = rand(0, 3);
  let q, ans, expl, wrongs = [];
  if (v === 0) {
    const a = rand(25, 95), b = rand(20, 150 - a); ans = 180 - a - b;
    q = `${ns.join('')} est un triangle tel que ${angN(nA)} = ${deg(a)} et ${angN(nB)} = ${deg(b)}. Calcule ${angN(nC)}.`;
    expl = `${deg(a)} + ${deg(b)} = ${deg(a + b)}. La somme des angles d'un triangle vaut 180°, donc ${angN(nC)} = 180° − ${deg(a + b)} = <b>${deg(ans)}</b>.`;
    wrongs = [[a + b, 'Tu as additionné les deux angles : il reste à calculer combien il manque pour faire 180°.'], [180 - a, `Il faut enlever <b>les deux</b> angles connus de 180°.`], [180 - b, 'Il faut enlever <b>les deux</b> angles connus de 180°.']];
  } else if (v === 1) {
    const b = rand(15, 75); ans = 90 - b;
    q = `${ns.join('')} est un triangle rectangle en ${nA} et ${angN(nB)} = ${deg(b)}. Calcule ${angN(nC)}.`;
    expl = `${angN(nA)} = 90°, donc ${angN(nC)} = 180° − 90° − ${deg(b)} = <b>${deg(ans)}</b>. (Les deux angles aigus d'un triangle rectangle font 90° ensemble.)`;
    wrongs = [[180 - b, `N'oublie pas l'angle droit en ${nA} : il mesure 90°.`]];
  } else if (v === 2) {
    const top = 2 * rand(10, 70); ans = (180 - top) / 2;
    q = `${ns.join('')} est un triangle isocèle en ${nA} et ${angN(nA)} = ${deg(top)}. Calcule ${angN(nB)}.`;
    expl = `180° − ${deg(top)} = ${deg(180 - top)}. Les deux angles à la base ont la même mesure : ${angN(nB)} = ${deg(180 - top)} : 2 = <b>${deg(ans)}</b>.`;
    wrongs = [[180 - top, `${deg(180 - top)}, c'est pour <b>les deux</b> angles à la base ensemble : partage en deux.`], [top, 'Les angles égaux sont les angles <b>à la base</b>, pas l\'angle au sommet principal.']];
  } else {
    const bAng = rand(25, 80); ans = 180 - 2 * bAng;
    q = `${ns.join('')} est un triangle isocèle en ${nA} et ${angN(nB)} = ${deg(bAng)}. Calcule ${angN(nA)}.`;
    expl = `Isocèle en ${nA} : ${angN(nC)} = ${angN(nB)} = ${deg(bAng)}. Donc ${angN(nA)} = 180° − ${deg(bAng)} − ${deg(bAng)} = <b>${deg(ans)}</b>.`;
    wrongs = [[180 - bAng, `Le triangle est isocèle en ${nA} : ${angN(nC)} aussi mesure ${deg(bAng)}.`]];
  }
  return {
    hints: [`Relis la propriété « La règle des 180° » dans ${ficheLink('triangles')}.`, v >= 2 ? 'Outil : dans un triangle isocèle, les deux angles à la base ont la même mesure.' : v === 1 ? 'Outil : un angle droit mesure 90°.' : 'Exemple : si deux angles mesurent 55° et 70°, le troisième mesure 180° − 125° = 55°.'],
    remediate(r) { const x = val(r); if (!x || eq(x.value, ans)) return null; const w = wrongs.find(([wv]) => eq(x.value, wv)); return w ? w[1] : null; },
    q: `<p class="statement">${q}</p><p class="big">${inp('num', 'Mesure')} °</p>`,
    check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, ans); markInput(r, 0, ok); return { ok, msg: expl }; },
  };
}

/* ---------- 8. Nature d'un triangle à partir de ses angles ---------- */
function genTriNatAng() {
  const ns = pickNames3(), [nA, nB, nC] = ns, kind = rand(0, 3); // 0 isocèle, 1 rectangle, 2 équilatéral, 3 quelconque
  let a, b;
  if (kind === 0) { do { b = rand(25, 75); } while (b === 45 || b === 60); a = pick([b, 180 - 2 * b]); }
  else if (kind === 1) { a = rand(20, 70); b = 90 - a; if (Math.random() < 0.4) { b = 90; } }
  else if (kind === 2) { a = 60; b = 60; }
  else { for (;;) { a = rand(25, 100); b = rand(20, 150 - a); const c = 180 - a - b; if (new Set([a, b, c]).size === 3 && ![a, b, c].includes(90) && c > 10) break; } }
  const c = 180 - a - b, angs = { [nA]: a, [nB]: b, [nC]: c };
  let good;
  if (a === 60 && b === 60) good = 'équilatéral';
  else if (a === 90 || b === 90 || c === 90) good = `rectangle en ${Object.keys(angs).find((k) => angs[k] === 90)}`;
  else if (a === b) good = `isocèle en ${nC}`; else if (a === c) good = `isocèle en ${nB}`; else if (b === c) good = `isocèle en ${nA}`;
  else good = 'quelconque';
  const pool = [`isocèle en ${nA}`, `isocèle en ${nB}`, `isocèle en ${nC}`, `rectangle en ${nA}`, `rectangle en ${nB}`, `rectangle en ${nC}`, 'équilatéral', 'quelconque'];
  const opts = [good, ...shuffle(pool.filter((x) => x !== good)).slice(0, 3)];
  const order = shuffle(opts.map((_, i) => i)), name = 'n' + Math.random().toString(36).slice(2);
  const why = good === 'équilatéral' ? 'les trois angles mesurent 60°' : good.startsWith('rectangle') ? `un angle mesure 90°` : good.startsWith('isocèle') ? `deux angles ont la même mesure (les angles à la base) ; le sommet principal est le troisième sommet` : 'les trois angles sont différents et aucun n\'est droit';
  return {
    hints: [`Relis la méthode « Trouver la nature d'un triangle à partir de ses angles » dans ${ficheLink('triangles')}.`, 'Outil : calcule d\'abord le troisième angle avec la règle des 180°, puis compare les trois angles.', 'Outil : isocèle → deux angles égaux ; équilatéral → trois angles de 60° ; rectangle → un angle de 90°.'],
    q: `<p class="statement">${ns.join('')} est un triangle tel que ${angN(nA)} = ${deg(a)} et ${angN(nB)} = ${deg(b)}.</p>
      <p class="big">${angN(nC)} = ${inp('num', 'Mesure')} °</p>
      <p>Le triangle ${ns.join('')} est :</p><div class="choices">${order.map((i) => `<label class="choice"><input type="radio" name="${name}" class="rb" data-o="${i}"> <span>${opts[i]}</span></label>`).join('')}</div>`,
    remediate(r) {
      const x = val(r), sel = r.querySelector('.rb:checked'); if (!x || !sel) return null;
      if (!eq(x.value, c)) return `Vérifie ${angN(nC)} : 180° − ${deg(a)} − ${deg(b)}.`;
      if (Number(sel.dataset.o) !== 0) return 'Ton calcul est juste. Compare maintenant les trois angles : y en a-t-il deux égaux ? un de 90° ?';
      return null;
    },
    check(r) {
      const x = val(r), sel = r.querySelector('.rb:checked'); if (!x || !sel) return null;
      const okA = eq(x.value, c), okN = Number(sel.dataset.o) === 0;
      markInput(r, 0, okA);
      r.querySelectorAll('.rb').forEach((e) => { e.disabled = true; if (Number(e.dataset.o) === 0) e.parentElement.classList.add('is-good'); else if (e.checked) e.parentElement.classList.add('is-bad'); });
      return { ok: okA && okN, msg: `${deg(a)} + ${deg(b)} = ${deg(a + b)}, donc ${angN(nC)} = 180° − ${deg(a + b)} = <b>${deg(c)}</b>. Les angles sont ${deg(a)}, ${deg(b)} et ${deg(c)} : ${why}. Le triangle est <b>${good}</b>.` };
    },
  };
}

/* ---------- 9. Cercle circonscrit ---------- */
function sceneCirc([nA, nB, nC], A, B, C) {
  const O = circumcenter(A, B, C), R = G.dist(O, A), ctr = O;
  const med = (P, Q) => { const M = G.mid(P, Q), u = G.norm(G.perp(G.sub(Q, P))); return [G.add(M, G.mul(u, -R - 0.6)), G.add(M, G.mul(u, R + 0.6))]; };
  const [m1a, m1b] = med(A, B), [m2a, m2b] = med(B, C), [m3a, m3b] = med(C, A);
  return {
    pts: [G.add(O, { x: -R - 0.8, y: -R - 0.8 }), G.add(O, { x: R + 0.8, y: R + 0.8 })], center: ctr,
    base: [F2.seg(A, B), F2.seg(B, C), F2.seg(C, A), ptSVG(nA, A, ctr, 1, 'none'), ptSVG(nB, B, ctr, 1, 'none'), ptSVG(nC, C, ctr, 1, 'none')],
    steps: [
      STEP.xline(m1a, m1b, `Trace la médiatrice de [${nA}${nB}] (au compas, comme au chapitre 3).`, G.norm(G.sub(B, A)), 'f-thin', 0),
      STEP.xline(m2a, m2b, `Trace la médiatrice de [${nB}${nC}].`, G.norm(G.sub(C, B)), 'f-thin', 0),
      STEP.point('O', O, G.add(O, { x: 0, y: 3 }), 'Elles se coupent en O, le centre du cercle.', '', 'x'),
      STEP.xline(m3a, m3b, `La médiatrice de [${nA}${nC}] passe aussi par O : les trois médiatrices sont concourantes.`, G.norm(G.sub(A, C)), 'f-thin', 0),
      STEP.fullCircle(O, R, `Pique en O, écarte le compas jusqu'à ${nA} et trace le cercle : il passe par ${nA}, ${nB} et ${nC}.`, ang2(G.sub(A, O))),
    ],
  };
}
function circumcenter(A, B, C) {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  const sq = (P) => P.x * P.x + P.y * P.y;
  return { x: (sq(A) * (B.y - C.y) + sq(B) * (C.y - A.y) + sq(C) * (A.y - B.y)) / d, y: (sq(A) * (C.x - B.x) + sq(B) * (A.x - C.x) + sq(C) * (B.x - A.x)) / d };
}
function genTriCercle() {
  const ns = pickNames3(), [nA, nB, nC] = ns;
  if (Math.random() < 0.3) {
    const v = rand(0, 1);
    const o = v === 0
      ? mcq('<p class="statement">Le centre du cercle circonscrit à un triangle est le point d\'intersection…</p>', ['des médiatrices des côtés', 'des côtés du triangle', 'des bissectrices des angles', 'des segments qui joignent les sommets aux milieux'], 0, 'Le centre est le point d\'intersection des trois <b>médiatrices</b> : il est à égale distance des trois sommets.', { col: true })
      : mcq('<p class="statement">Le cercle circonscrit à un triangle passe par…</p>', ['ses trois sommets', 'les milieux de ses côtés', 'un seul de ses sommets', 'le centre de chaque côté et les sommets'], 0, 'Le cercle circonscrit passe par les <b>trois sommets</b> du triangle.', { col: true });
    return withHints(o, [`Relis la partie 4 « Le cercle circonscrit » dans ${ficheLink('triangles')}.`, 'Outil : un point de la médiatrice d\'un segment est à égale distance de ses extrémités (chapitre 3).']);
  }
  let A, B, C, O, R;
  for (;;) {
    O = { x: 8, y: 5.6 }; R = rand(28, 42) / 10;
    const t0 = rand(0, 359), t1 = t0 + rand(95, 140), t2 = t1 + rand(95, 140);
    if (t2 - t0 > 320) continue;
    [A, B, C] = [t0, t1, t2].map((t) => G.add(O, polar(t, R)));
    break;
  }
  const fit = (c) => G.dist(c.c, O) <= 0.18 && Math.abs(c.r - R) <= 0.18;
  return {
    hints: [`Relis la méthode « Tracer le cercle circonscrit à un triangle » dans ${ficheLink('triangles')}.`, 'Outil : trace la médiatrice de deux côtés (au compas, comme au chapitre 3). Place leur point d\'intersection O.', 'Outil : Compas → pique en O, puis clique sur un sommet.'],
    anim: () => sceneCirc(ns, A, B, C),
    example: () => { const O0 = { x: 0, y: 0 }; return sceneCirc(['E', 'F', 'G'], polar(200, 3), polar(330, 3), polar(80, 3)); },
    remediate(r) {
      const cs = r._board.circles().filter((c) => !(G.dist(c.c, A) < 0.05 || G.dist(c.c, B) < 0.05 || G.dist(c.c, C) < 0.05));
      if (!cs.length || cs.some(fit)) return null;
      const c = cs[cs.length - 1];
      if (G.dist(c.c, O) > 0.18) return 'Le centre de ton cercle n\'est pas au bon endroit : c\'est le point où se coupent les <b>médiatrices</b> des côtés.';
      return 'Le centre est bon ! Écarte le compas jusqu\'à un sommet du triangle (clique sur le sommet).';
    },
    q: `<p class="statement">Trace le <b>cercle circonscrit</b> au triangle ${ns.join('')}.</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { tool: 'circle', names: ['O'], given: { points: [{ name: nA, ...A }, { name: nB, ...B }, { name: nC, ...C }], segs: [[nA, nB], [nB, nC], [nC, nA]] } }); },
    check(r) {
      const cs = r._board.circles().filter((c) => !(G.dist(c.c, A) < 0.05 || G.dist(c.c, B) < 0.05 || G.dist(c.c, C) < 0.05));
      if (!cs.length) return r._board.drawnCount() ? { retry: true, msg: 'Il manque le cercle : place O à l\'intersection des médiatrices, puis Compas → pique en O et clique sur un sommet.' } : null;
      const ok = cs.some(fit);
      return { ok, msg: ok ? `Ton cercle a pour centre le point d'intersection des médiatrices et passe par ${nA}, ${nB} et ${nC}.` : 'On trace les médiatrices de deux côtés : elles se coupent en O. Le cercle de centre O qui passe par un sommet passe aussi par les deux autres.' };
    },
  };
}

/* =========================================================
   Registre et chapitres
   ========================================================= */
Object.assign(GENS, {
  // Chapitre 5 — Opérations
  'o-voc': { ch: 'operations', f: genOpVoc, label: 'Vocabulaire des opérations' },
  'o-gauche': { ch: 'operations', f: genOpGauche, label: 'Calculer de gauche à droite' },
  'o-par': { ch: 'operations', f: genOpPar, label: 'Calculer avec des parenthèses' },
  'o-par2': { ch: 'operations', f: genOpPar2, label: 'Parenthèses « doubles »' },
  'o-add': { ch: 'operations', f: genOpPoseAdd, label: 'Poser une addition, une soustraction' },
  'o-mul': { ch: 'operations', f: genOpPoseMul, label: 'Poser une multiplication' },
  'o-pb': { ch: 'operations', f: genOpProbleme, label: 'Résoudre un problème' },
  // Chapitre 6 — Angles
  'a-nom': { ch: 'angles', f: genAngNom, label: 'Nommer un angle' },
  'a-nature': { ch: 'angles', f: genAngNature, label: 'Nature d\'un angle' },
  'a-mesure': { ch: 'angles', f: genAngMesure, label: 'Mesurer un angle' },
  'a-construire': { ch: 'angles', f: genAngConstruire, label: 'Construire un angle', slow: true },
  'a-calcul': { ch: 'angles', f: genAngCalcul, label: 'Calculer avec les relations entre angles' },
  'a-reco': { ch: 'angles', f: genAngReco, label: 'Reconnaître des angles adjacents, opposés…' },
  'a-biss': { ch: 'angles', f: genAngBiss, label: 'La bissectrice', slow: true },
  // Chapitre 7 — Triangles
  't-voc': { ch: 'triangles', f: genTriVoc, label: 'Vocabulaire du triangle' },
  't-nature': { ch: 'triangles', f: genTriNature, label: 'Reconnaître un triangle particulier' },
  't-3cotes': { ch: 'triangles', f: genTri3, label: 'Construire avec les trois côtés', slow: true },
  't-angles': { ch: 'triangles', f: genTriAngles, label: 'Construire avec des angles', slow: true },
  't-iso': { ch: 'triangles', f: genTriIso, label: 'Construire un triangle isocèle, équilatéral', slow: true },
  't-rect': { ch: 'triangles', f: genTriRect, label: 'Construire un triangle rectangle', slow: true },
  't-180': { ch: 'triangles', f: genTri180, label: 'La règle des 180°' },
  't-natang': { ch: 'triangles', f: genTriNatAng, label: 'Nature d\'un triangle par ses angles' },
  't-cercle': { ch: 'triangles', f: genTriCercle, label: 'Le cercle circonscrit', slow: true },
});
CHAPTERS.push(
  { id: 'operations', num: 5, title: 'Additionner, soustraire, multiplier', symbol: '×', desc: 'Vocabulaire, règles de calcul avec parenthèses, opérations posées avec des décimaux, problèmes.' },
  { id: 'angles', num: 6, title: 'Les angles', symbol: '∠', desc: 'Nommer, mesurer et construire un angle, relations entre angles, bissectrice.' },
  { id: 'triangles', num: 7, title: 'Les triangles', symbol: '△', desc: 'Construire un triangle, triangles particuliers, règle des 180°, cercle circonscrit.' },
);

/* =========================================================
   Figures et animations des fiches
   ========================================================= */
function renderP2Fiches() {
  const box = (id) => document.querySelector(`[data-fig="${id}"]`);
  const set = (id, html) => { const b = box(id); if (b) b.innerHTML = html; };
  // Opérations
  set('o-pose-add', `<div class="p2-row">${poseAddHTML(dv(476, 1), dv(2835, 2), '+')}${poseAddHTML(dv(632, 1), dv(2547, 2), '−')}</div>`);
  set('o-pose-mul', poseMulHTML(dv(364, 1), dv(25, 1)));
  // Angles
  set('a-def', angleFig(10, 70, ['A', 'B', 'C'], { len: 3.4 }));
  set('a-nat-aigu', angleFig(0, 50, ['', '', ''].map((_, i) => '_' + i), { len: 2.6 }));
  set('a-nat-droit', angleFig(0, 90, ['_a', '_b', '_c'], { len: 2.6, right: true }));
  set('a-nat-obtus', angleFig(0, 130, ['_a', '_b', '_c'], { len: 2.6 }));
  set('a-nat-plat', angleFig(0, 180, ['_a', '_b', '_c'], { len: 2.6 }));
  { const { fig } = (() => { const V = { x: 0, y: 0 }, b = { x: 1, y: 0 }, n = { x: 0, y: -1 }, s2 = polar(48); const items = [protractorDraw(V, b, n, 3.1), F2.seg(V, { x: 4.2, y: 0 }, 'f-seg f-thick'), F2.seg(V, G.mul(s2, 4.2), 'f-seg f-thick')]; return { fig: figure({ S: V, T: { x: 3.9, y: 0 }, R: G.mul(s2, 3.9) }, items, { marks: { S: 'none', T: { dash: b }, R: { dash: s2 } }, extra: [{ x: -3.5, y: 0.6 }, { x: 4.4, y: -3.6 }], pad: 0.4, center: { x: 0, y: 2 }, cls: 'p2-protfig' }) }; })(); set('a-mesure', fig); }
  if (box('a-anim-construire')) makePlayer(box('a-anim-construire'), sceneAngle({ x: 0, y: 0 }, { x: 1, y: 0 }, 65, 'O', 'x', 'y'), { atEnd: true });
  { const V = { x: 0, y: 0 }; set('a-rel-adj', figure({ O: V }, [F2.seg(V, polar(0, 3)), F2.seg(V, polar(40, 3)), F2.seg(V, polar(95, 3)), arcMark(V, polar(0), polar(40), 0.7, 'f-arcm f-arc-red'), arcMark(V, polar(40), polar(95), 0.9, 'f-arcm f-arc-blue')], { marks: { O: 'none' }, extra: [polar(0, 3), polar(95, 3), { x: -0.6, y: 0.4 }], pad: 0.4 }));
    set('a-rel-opp', figure({ O: V }, [F2.seg(polar(20, 2.6), polar(200, 2.6)), F2.seg(polar(110, 2.6), polar(290, 2.6)), arcMark(V, polar(20), polar(110), 0.6, 'f-arcm f-arc-red'), arcMark(V, polar(200), polar(290), 0.6, 'f-arcm f-arc-red')], { marks: { O: 'none' }, pad: 0.3, extra: [polar(20, 2.6), polar(200, 2.6), polar(110, 2.6), polar(290, 2.6)] }));
    set('a-rel-comp', figure({ O: V }, [F2.seg(V, polar(0, 3)), F2.seg(V, polar(35, 3)), F2.seg(V, polar(90, 3)), F2.right(V, polar(0), polar(90), 0.3), arcLabel(V, polar(0), polar(35), '35°', 1.6), arcLabel(V, polar(35), polar(90), '55°', 1.6)], { marks: { O: 'none' }, extra: [polar(0, 3), polar(90, 3)], pad: 0.4 }));
    set('a-rel-supp', figure({ O: V }, [F2.seg(polar(0, 3), polar(180, 3)), F2.seg(V, polar(60, 3)), arcLabel(V, polar(0), polar(60), '60°', 1.2), arcLabel(V, polar(60), polar(180), '120°', 1.2)], { marks: { O: 'none' }, extra: [polar(0, 3), polar(180, 3), polar(60, 3)], pad: 0.4 })); }
  if (box('a-anim-biss')) makePlayer(box('a-anim-biss'), sceneBiss({ x: 0, y: 0 }, { x: 1, y: 0 }, 70, 'A'), { atEnd: true });
  // Triangles
  { const D = { x: 2, y: -3 }, E = { x: 0, y: 0 }, F = { x: 5, y: 0 }; set('t-def', triFig({ D, E, F }, [arcMark(F, G.sub(E, F), G.sub(D, F), 0.6, 'f-arcm f-arc-red'), F2.text({ x: 3.4, y: 0.55 }, 'côté [EF]', 'f-len')])); }
  { const A0 = { x: 0, y: 0 }, B0 = { x: 6, y: 0 }; if (box('t-anim-3')) makePlayer(box('t-anim-3'), sceneTri3(['A', 'B', 'C'], A0, B0, apex(A0, B0, 4, 5), 4, 5), { atEnd: true }); }
  { const K0 = { x: 0, y: 0 }, L0 = { x: 6, y: 0 }, X = interLL({ P: K0, d: polar(40), t0: 0, t1: 50 }, { P: L0, d: polar(120), t0: 0, t1: 50 })[0]; if (box('t-anim-ang')) makePlayer(box('t-anim-ang'), sceneTriAng(['K', 'L', 'M'], K0, L0, X, 40, 60), { atEnd: true }); }
  { const N = { x: 0, y: 0 }, P = { x: 4, y: 0 }, M = apex(N, P, 5, 5); set('t-iso', triFig({ M, N, P }, [tick(M, N), tick(M, P)])); }
  { const E = { x: 0, y: 0 }, F = { x: 4.5, y: 0 }, Gp = apex(E, F, 4.5, 4.5); set('t-equi', triFig({ E, F, G: Gp }, [tick(E, F), tick(F, Gp), tick(Gp, E)])); }
  { const A = { x: 0, y: 0 }, B = { x: 5, y: 0 }, C = { x: 0, y: -3 }; set('t-rect', triFig({ A, B, C }, [F2.right(A, G.sub(B, A), G.sub(C, A), 0.35), F2.text(G.add(G.mid(B, C), { x: 0.9, y: -0.45 }), 'hypoténuse', 'f-len')])); }
  { const A = { x: 0, y: 0 }, B = { x: 6, y: 0 }, C = interLL({ P: A, d: polar(55), t0: 0, t1: 50 }, { P: B, d: polar(110), t0: 0, t1: 50 })[0]; set('t-180', triFig({ A, B, C }, [arcMark(A, G.sub(B, A), G.sub(C, A), 0.7, 'f-arcm f-arc-red'), arcMark(B, G.sub(A, B), G.sub(C, B), 0.7, 'f-arcm f-arc-blue'), arcMark(C, G.sub(A, C), G.sub(B, C), 0.6, 'f-arcm f-arc-green'), arcLabel(A, G.sub(B, A), G.sub(C, A), '55°', 1.2), arcLabel(B, G.sub(A, B), G.sub(C, B), '70°', 1.2), arcLabel(C, G.sub(A, C), G.sub(B, C), '?', 1.0)])); }
  if (box('t-anim-cercle')) makePlayer(box('t-anim-cercle'), sceneCirc(['A', 'B', 'C'], polar(205, 3), polar(330, 3), polar(85, 3)), { atEnd: true });
}
document.addEventListener('DOMContentLoaded', () => {
  try { renderP2Fiches(); } catch (e) { console.error(e); }
  if (CAN_SPEAK) {
    document.querySelectorAll('.page[data-p="fiche"][data-ch="operations"] .card, .page[data-p="fiche"][data-ch="angles"] .card, .page[data-p="fiche"][data-ch="triangles"] .card').forEach((card) => {
      if (card.querySelector('.say')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mini say'; b.textContent = '🔊 Écouter'; b.title = 'Écouter cette partie de la fiche';
      card.querySelector('h2')?.appendChild(b); b.addEventListener('click', () => speak(speechText(card), b));
    });
  }
});

/* =========================================================
   CE QUE VOIENT LES ÉLÈVES (ouverture.js)
   Les pages fermées sont retirées pour les élèves ; leur progression n'est pas touchée.
   Sur l'appareil du professeur (Espace professeur déverrouillé), tout reste visible.
   ========================================================= */
const AUTO_PAGES = ['accueil', 'erreurs'];
function ouv(ch) { const o = (window.OUVERTURE || {})[ch]; return o === undefined ? true : o; }
function pageOuverte(ch, p) {
  const o = ouv(ch);
  if (o === true) return true;
  if (!Array.isArray(o) || !o.length) return false;
  return AUTO_PAGES.includes(p) || o.includes(p);
}
(function appliquerOuverture() {
  let prof = false; try { prof = profOpen(); } catch (e) { prof = false; }
  CHAPTERS.forEach((c) => {
    const secs = [...document.querySelectorAll(`.page[data-ch="${c.id}"]`)];
    const closed = secs.filter((sec) => !pageOuverte(c.id, sec.dataset.p));
    if (!closed.length) return;
    const allClosed = closed.length === secs.length;
    if (prof) {
      c.hiddenNote = allClosed ? '🔒 Masqué aux élèves' : `🔒 ${closed.length} page${closed.length > 1 ? 's' : ''} masquée${closed.length > 1 ? 's' : ''} aux élèves`;
      closed.forEach((sec) => { sec.dataset.hiddenEleves = '1'; sec.insertAdjacentHTML('afterbegin', '<p class="hidden-banner">🔒 Page masquée aux élèves (tu la vois parce que l\'Espace professeur est ouvert sur cet appareil).</p>'); });
      return;
    }
    const openKeys = new Set(secs.filter((sec) => !closed.includes(sec)).flatMap((sec) => [...sec.querySelectorAll('[data-gen]')].map((e) => e.dataset.gen)));
    closed.forEach((sec) => { sec.querySelectorAll('[data-gen]').forEach((e) => { if (!openKeys.has(e.dataset.gen) && GENS[e.dataset.gen]) GENS[e.dataset.gen].locked = true; }); sec.remove(); });
    if (allClosed) c.locked = true;
  });
}());

/* ---------- Carte de l'Espace professeur ---------- */
function renderOuvertureCard() {
  const host = document.getElementById('p2-ouverture'); if (!host) return;
  const state = {};
  CHAPTERS.forEach((c) => {
    const o = ouv(c.id), pages = [...document.querySelectorAll(`.page[data-ch="${c.id}"]`)].filter((sec) => !AUTO_PAGES.includes(sec.dataset.p));
    state[c.id] = Object.fromEntries(pages.map((sec) => [sec.dataset.p, o === true || (Array.isArray(o) && o.includes(sec.dataset.p))]));
  });
  const title = (ch, p) => document.querySelector(`.page[data-ch="${ch}"][data-p="${p}"]`)?.dataset.title || p;
  const fileText = () => {
    const lines = CHAPTERS.map((c) => {
      const ps = Object.entries(state[c.id]).filter(([, v]) => v).map(([k]) => k);
      const all = ps.length === Object.keys(state[c.id]).length;
      return `  ${JSON.stringify(c.id)}: ${all ? 'true' : JSON.stringify(ps)}`;
    });
    return `/* =========================================================\n   CE QUE VOIENT LES ÉLÈVES\n   Fichier fabriqué par l'Espace professeur (« Ce que voient les élèves »).\n   Pour chaque chapitre :  true = tout est ouvert ;  [] = chapitre fermé ;\n   ["fiche", "vocabulaire", …] = seulement ces pages.\n   ========================================================= */\nwindow.OUVERTURE = {\n${lines.join(',\n')}\n};\n`;
  };
  let opened = false;
  const draw = () => {
    host.innerHTML = `<details class="ouv-box"${opened ? ' open' : ''}><summary><h2>👁 Ce que voient les élèves</h2><span class="small muted">${CHAPTERS.filter((c) => Object.values(state[c.id]).every((v) => !v)).map((c) => 'ch. ' + c.num).join(', ') || 'rien'} masqué${CHAPTERS.filter((c) => Object.values(state[c.id]).every((v) => !v)).length > 1 ? 's' : ''}</span></summary>
      <p class="small">Coche ce qui a été vu en classe. Une page non cochée est <b>invisible pour les élèves</b> (un chapitre sans aucune page cochée apparaît « 🔒 Bientôt »). Leur progression n'est jamais effacée. Les liens de devoir que tu donnes marchent toujours, même pour une notion masquée.</p>
      <div class="ouv-grid">${CHAPTERS.slice().reverse().map((c) => {
        const ps = Object.keys(state[c.id]), n = ps.filter((p) => state[c.id][p]).length;
        return `<fieldset class="ouv-ch"><legend><label><input type="checkbox" data-ouvch="${c.id}" ${n === ps.length ? 'checked' : ''}> <b>Chapitre ${c.num} · ${c.title}</b></label> <span class="small muted">${n === ps.length ? 'tout ouvert' : n ? `${n} / ${ps.length}` : 'fermé'}</span></legend>
          ${ps.map((p) => `<label class="ouv-p"><input type="checkbox" data-ouv="${c.id}|${p}" ${state[c.id][p] ? 'checked' : ''}> ${title(c.id, p)}</label>`).join('')}</fieldset>`;
      }).join('')}</div>
      <p><button type="button" class="btn primary" id="ouv-dl">⬇ Télécharger ouverture.js</button> <button type="button" class="btn" id="ouv-copy">Copier son contenu</button></p>
      <ol class="small steps-form"><li>Télécharge le fichier <b>ouverture.js</b>.</li><li>Sur GitHub, dans ton dépôt : <b>Add file → Upload files</b>, dépose ouverture.js (il remplace l'ancien), puis <b>Commit changes</b>.</li><li>Les élèves voient le changement 1 à 2 minutes plus tard. Sur cet appareil, tu vois tout (avec 🔒 sur ce qui est masqué) ; pour voir comme un élève, ouvre le site dans une fenêtre de navigation privée.</li></ol></details>`;
    host.querySelector('details').addEventListener('toggle', (e) => { opened = e.target.open; });
  };
  draw();
  host.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.ouvch) { const on = t.checked; Object.keys(state[t.dataset.ouvch]).forEach((p) => { state[t.dataset.ouvch][p] = on; }); draw(); }
    else if (t.dataset.ouv) { const [ch, p] = t.dataset.ouv.split('|'); state[ch][p] = t.checked; draw(); }
  });
  host.addEventListener('click', async (e) => {
    if (e.target.id === 'ouv-dl') {
      const url = URL.createObjectURL(new Blob([fileText()], { type: 'text/javascript' }));
      const a = document.createElement('a'); a.href = url; a.download = 'ouverture.js'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 20000);
    }
    if (e.target.id === 'ouv-copy') { try { await navigator.clipboard.writeText(fileText()); e.target.textContent = '✔ Copié'; } catch (_) { e.target.textContent = 'Copie impossible'; } }
  });
}
document.addEventListener('DOMContentLoaded', renderOuvertureCard);
