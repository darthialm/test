# Révisions 5e — site + Espace professeur + classeur

Le site garde la même adresse. Les 3 premiers chapitres (calculs, triangles, fractions 1) ne changent pas.
Quatre chapitres s'ajoutent : **4 Proportionnalité · 5 Angles et parallèles · 6 Fractions (partie 2) · 7 Divisibilité**.
Ils sont **fermés aux élèves par défaut** : c'est toi qui décides quand ouvrir.

## Fichiers à déposer à la racine du dépôt GitHub 5e
`index.html`, `script.js`, `style.css` (inchangé), `chapitres-5e.js`, `chapitres-5e.css`, `espace-prof.js`, `controles-5e.js`, `qrcode.js`, `reglages.js`, `ouverture.js`, `classeur.html`, et les 8 PDF `cours-eleve-*.pdf` et `cours-prof-*.pdf` (à la racine, pas de dossier).
(Remplace les fichiers existants du même nom. Dépose dans le dépôt **5e**, pas dans celui de 6e.)

## Espace professeur
- Adresse : `…/#/prof` (lien « Espace professeur » en bas de chaque page).
- Code par défaut : `prof5e`. **Change-le** dans `reglages.js` (`codeProf`), puis redépose ce fichier.
- Le classeur n'est accessible que par là : sans le code, `classeur.html` renvoie vers l'Espace professeur.
- Le code est mémorisé sur l'appareil. Bouton « Verrouiller » pour l'effacer.
- Protection légère (c'est un site statique) : elle écarte les élèves, elle ne sécurise pas des données sensibles. **Attention : si le dépôt est public, les PDF `cours-prof-*.pdf` (avec les réponses) le sont aussi** — l'adresse n'est pas affichée aux élèves mais reste devinable. Si ça te gêne, ne dépose que les `cours-eleve-*` et garde les PDF prof sur ton ordinateur (les boutons « prof » du classeur ne marcheront alors pas).

## Choisir ce que voient les élèves
Espace professeur → « 👁 Ce que voient les élèves » : coche les pages vues en classe (fiche, exercices, contrôle…).
Un chapitre sans page cochée apparaît « 🔒 Bientôt ». Clique « Télécharger ouverture.js » (ou « Copier »), puis dépose ce fichier dans GitHub : les élèves voient le changement après quelques minutes.
Sur ton appareil, avec l'Espace professeur ouvert, tout reste visible (bandeau « masqué aux élèves »). Leur progression n'est jamais effacée.

## Cours à trous (vrais PDF LaTeX)
`cours-eleve-<Chapitre>.pdf` (à trous) et `cours-prof-<Chapitre>.pdf` (complétés, réponses en bleu). Chaque cours porte de petites mentions « Séance n » (n° du classeur). Dans le classeur, le cadre « Repère » de chaque séance a deux boutons qui ouvrent le PDF directement à la bonne page. Les numéros de pages d'exercices sont laissés en blanc (« p. …… ») à compléter à la main. Sources LaTeX : `Sources_LaTeX.zip` (compiler deux fois avec `pdflatex`).

## Contrôles sur papier avec QR codes
Espace professeur → « 📝 Contrôle sur papier » (même principe qu'en 6e) :
1. Coche les compétences (types d'exercices du site), choisis la classe, colle la liste des élèves, coche la version aménagée si besoin.
2. « Préparer le contrôle » : durée automatique (≈ 20/30/45 min) ajustable avec − / +, vérification que chaque copie tient sur une page A4.
3. « Imprimer les sujets » : une page par élève (prénom sur une bande à détacher, code anonyme + QR). « Corrigé » et « Fichier pour la correction assistée » (à envoyer à Claude avec le scan des copies anonymes).
4. Colle les résultats (`CODE C1=TB C2=MF…`), vérifie le tableau, puis imprime les étiquettes QR (planche 21 étiquettes L7160). Le QR ouvre « Mon contrôle » : bilan, corrigé de son sujet, lien vers les exercices à refaire.
Rien n'est stocké sur un serveur : les contrôles sont mémorisés sur l'appareil du professeur, les sujets sont recalculés à partir du code. Le QR contient l'adresse du site (affichée dans la carte) : vérifie-la avant d'imprimer. Pour qu'un élève puisse refaire les exercices, la page correspondante doit être ouverte (Ouverture).

## Hors site (non publics)
`Cours_a_trous.zip` (dossiers `eleve/` et `prof/`), `Devoirs_a_coller.pdf` (fiches + corrigés).
