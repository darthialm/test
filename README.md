# Révisions 5e — site + Espace professeur + classeur

Le site garde la même adresse. Les 3 premiers chapitres (calculs, triangles, fractions 1) ne changent pas.
Quatre chapitres s'ajoutent : **4 Proportionnalité · 5 Angles et parallèles · 6 Fractions (partie 2) · 7 Divisibilité**.
Ils sont **fermés aux élèves par défaut** : c'est toi qui décides quand ouvrir.

## Fichiers à déposer à la racine du dépôt GitHub 5e
`index.html`, `script.js`, `style.css` (inchangé), `chapitres-5e.js`, `chapitres-5e.css`, `espace-prof.js`, `reglages.js`, `ouverture.js`, `classeur.html`
(Remplace les fichiers existants du même nom. Ne touche pas au site de 6e.)

## Espace professeur
- Adresse : `…/#/prof` (lien « Espace professeur » en bas de chaque page).
- Code par défaut : `prof5e`. **Change-le** dans `reglages.js` (`codeProf`), puis redépose ce fichier.
- Le classeur n'est accessible que par là : sans le code, `classeur.html` renvoie vers l'Espace professeur.
- Le code est mémorisé sur l'appareil. Bouton « Verrouiller » pour l'effacer.
- Protection légère (c'est un site statique) : elle écarte les élèves, elle ne sécurise pas des données sensibles. Ne mets pas les PDF « prof » dans le dépôt.

## Choisir ce que voient les élèves
Espace professeur → « 👁 Ce que voient les élèves » : coche les pages vues en classe (fiche, exercices, contrôle…).
Un chapitre sans page cochée apparaît « 🔒 Bientôt ». Clique « Télécharger ouverture.js » (ou « Copier »), puis dépose ce fichier dans GitHub : les élèves voient le changement après quelques minutes.
Sur ton appareil, avec l'Espace professeur ouvert, tout reste visible (bandeau « masqué aux élèves »). Leur progression n'est jamais effacée.

## Hors site (non publics)
`Cours_a_trous.zip` (dossiers `eleve/` et `prof/`), `Devoirs_a_coller.pdf` (fiches + corrigés).
