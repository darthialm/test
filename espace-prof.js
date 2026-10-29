'use strict';
/* =========================================================
   ESPACE PROFESSEUR
   - accès par code (réglages.js) ; c'est la seule porte d'entrée du classeur ;
   - « Ce que voient les élèves » : ouvrir ou fermer les chapitres (ouverture.js).
   Sur l'appareil du professeur (Espace professeur ouvert), tout reste visible.
   ========================================================= */
const CODE_PROF = (window.REGLAGES && window.REGLAGES.codeProf) || 'prof5e';
const PROF_KEY = 'revisions5e-prof';
const profNorm = (s) => String(s || '').trim().toLowerCase();
const profOpen = () => { try { return localStorage.getItem(PROF_KEY) === profNorm(CODE_PROF) + ':ok'; } catch (e) { return false; } };

/* ---------- Ce que voient les élèves ---------- */
const AUTO_PAGES = ['accueil', 'erreurs'];
function ouv(ch) { const o = (window.OUVERTURE || {})[ch]; return o === undefined ? true : o; }
function pageOuverte(ch, p) {
  const o = ouv(ch);
  if (o === true) return true;
  if (!Array.isArray(o) || !o.length) return false;
  return AUTO_PAGES.includes(p) || o.includes(p);
}
/* catalogue des pages (relevé avant de retirer quoi que ce soit) */
const PAGES_CAT = Object.fromEntries(CHAPTERS.map((c) => [c.id, [...document.querySelectorAll(`.page[data-ch="${c.id}"]`)].map((sec) => ({ p: sec.dataset.p, t: sec.dataset.title || sec.dataset.p }))]));
const PROF_AU_CHARGEMENT = profOpen();
(function appliquerOuverture() {
  CHAPTERS.forEach((c) => {
    const secs = [...document.querySelectorAll(`.page[data-ch="${c.id}"]`)];
    const closed = secs.filter((sec) => !pageOuverte(c.id, sec.dataset.p));
    if (!closed.length) return;
    const allClosed = closed.length === secs.length;
    if (PROF_AU_CHARGEMENT) {
      c.hiddenNote = allClosed ? '🔒 Masqué aux élèves' : `🔒 ${closed.length} page${closed.length > 1 ? 's' : ''} masquée${closed.length > 1 ? 's' : ''} aux élèves`;
      closed.forEach((sec) => { sec.dataset.hiddenEleves = '1'; sec.insertAdjacentHTML('afterbegin', '<p class="hidden-banner">🔒 Page masquée aux élèves (tu la vois parce que l\'Espace professeur est ouvert sur cet appareil).</p>'); });
      return;
    }
    const openKeys = new Set(secs.filter((sec) => !closed.includes(sec)).flatMap((sec) => [...sec.querySelectorAll('[data-gen]')].map((e) => e.dataset.gen)));
    closed.forEach((sec) => { sec.querySelectorAll('[data-gen]').forEach((e) => { if (!openKeys.has(e.dataset.gen) && GENS[e.dataset.gen]) GENS[e.dataset.gen].locked = true; }); sec.remove(); });
    if (allClosed) c.locked = true;
  });
}());

/* ---------- Carte « Ce que voient les élèves » ---------- */
function renderOuvertureCard() {
  const host = document.getElementById('p5-ouverture'); if (!host) return;
  if (host.dataset.ready) return;
  host.dataset.ready = '1';
  const state = {};
  CHAPTERS.forEach((c) => {
    const o = ouv(c.id), pages = PAGES_CAT[c.id].filter((x) => !AUTO_PAGES.includes(x.p));
    state[c.id] = Object.fromEntries(pages.map((x) => [x.p, o === true || (Array.isArray(o) && o.includes(x.p))]));
  });
  const title = (ch, p) => (PAGES_CAT[ch].find((x) => x.p === p) || { t: p }).t;
  const fileText = () => {
    const lines = CHAPTERS.map((c) => {
      const ps = Object.entries(state[c.id]).filter(([, v]) => v).map(([k]) => k);
      const all = ps.length === Object.keys(state[c.id]).length;
      return `  ${JSON.stringify(c.id)}: ${all ? 'true' : JSON.stringify(ps)}`;
    });
    return `/* =========================================================\n   CE QUE VOIENT LES ÉLÈVES\n   Fichier fabriqué par l'Espace professeur (« Ce que voient les élèves »).\n   Pour chaque chapitre :  true = tout est ouvert ;  [] = chapitre fermé ;\n   ["fiche", "tableaux", …] = seulement ces pages.\n   ========================================================= */\nwindow.OUVERTURE = {\n${lines.join(',\n')}\n};\n`;
  };
  let opened = true;
  const closedList = () => CHAPTERS.filter((c) => Object.values(state[c.id]).every((v) => !v));
  const draw = () => {
    host.innerHTML = `<details class="ouv-box card"${opened ? ' open' : ''}><summary><h2>👁 Ce que voient les élèves</h2><span class="small muted">${closedList().map((c) => 'ch. ' + c.num).join(', ') || 'rien'} masqué${closedList().length > 1 ? 's' : ''}</span></summary>
      <p class="small">Coche ce qui a été vu en classe. Une page non cochée est <b>invisible pour les élèves</b> (un chapitre sans aucune page cochée apparaît « 🔒 Bientôt »). Leur progression n'est jamais effacée.</p>
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
  host.addEventListener('click', (e) => {
    if (e.target.id === 'ouv-dl') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([fileText()], { type: 'text/javascript' }));
      a.download = 'ouverture.js'; document.body.appendChild(a); a.click(); a.remove();
    } else if (e.target.id === 'ouv-copy') {
      const b = e.target;
      (navigator.clipboard ? navigator.clipboard.writeText(fileText()) : Promise.reject()).then(() => { b.textContent = '✔ Copié'; setTimeout(() => { b.textContent = 'Copier son contenu'; }, 1500); }).catch(() => { b.textContent = 'Copie impossible : utilise le téléchargement'; });
    }
  });
  host.__fileText = fileText;
}

/* ---------- Verrou de l'Espace professeur ---------- */
function renderProfLock() {
  const lock = document.getElementById('prof-lock'), content = document.getElementById('prof-content');
  if (!lock || !content) return;
  const open = profOpen();
  lock.hidden = open; content.hidden = !open;
  if (open) { try { renderOuvertureCard(); } catch (e) { content.insertAdjacentHTML('afterbegin', `<p class="ex-fb ko">⚠ Problème dans l'Espace professeur : ${e.message}. Recharge la page avec Ctrl+F5.</p>`); } return; }
  if (lock.dataset.ready) return;
  lock.dataset.ready = '1';
  const inpC = lock.querySelector('#prof-code'), msg = lock.querySelector('.lock-msg');
  const tryCode = () => {
    if (profNorm(inpC.value) && profNorm(inpC.value) === profNorm(CODE_PROF)) {
      try { localStorage.setItem(PROF_KEY, profNorm(CODE_PROF) + ':ok'); } catch (e) { /* rien */ }
      location.reload();
    } else { msg.textContent = 'Code incorrect.'; inpC.classList.add('wrong'); inpC.select(); }
  };
  lock.querySelector('#prof-unlock').addEventListener('click', tryCode);
  inpC.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryCode(); });
  inpC.addEventListener('input', () => inpC.classList.remove('wrong'));
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('prof-relock')?.addEventListener('click', () => { try { localStorage.removeItem(PROF_KEY); } catch (e) { /* rien */ } location.reload(); });
});
