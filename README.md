# Révisions 5e — site, Espace professeur, classeur et documents

Le site garde la même adresse. Les 3 premiers chapitres (calculs, triangles, fractions 1) ne changent pas.
Quatre chapitres s'ajoutent : **4 Proportionnalité · 5 Angles · 6 Fractions (partie 2) · 7 Divisibilité**.
Ils sont **fermés aux élèves par défaut** : c'est toi qui décides quand les ouvrir.

## Ce qu'il faut déposer dans le dépôt GitHub de 5e (tout à la racine, sans dossier)
- Le site : `index.html`, `script.js`, `style.css`, `chapitres-5e.js`, `chapitres-5e.css`, `espace-prof.js`, `controles-5e.js`, `qrcode.js`, `reglages.js`, `ouverture.js`, `classeur.html`
- Les documents PDF (22 fichiers) :
  - `cours-eleve-<Chapitre>.pdf` : cours à trous, à imprimer pour les élèves
  - `cours-prof-<Chapitre>.pdf` : le même cours complété (réponses en bleu)
  - `exercices-<Chapitre>.pdf` : fiche d'exercices des élèves (exercices numérotés, faits dans le cahier)
  - `exercices-corriges-<Chapitre>.pdf` : les mêmes exercices avec un corrigé détaillé
  - `projection-<Chapitre>.pdf` : les fiches à projeter (questions flash, activités, jeux)
  - `devoirs-impression.pdf` : les 6 fiches de devoirs à coller, deux exemplaires par feuille A4 (à couper)
  - `devoirs-corriges.pdf` : chaque fiche de devoir suivie de son corrigé

Les fichiers du même nom sont remplacés. Ne dépose rien dans le dépôt de 6e ni dans le dépôt « test ».
Avant de déposer, change le code `prof5e` dans `reglages.js`.

**Attention :** si le dépôt est public, les PDF « prof » et « corrigés » le sont aussi. Leur adresse n'est affichée nulle part pour les élèves, mais elle reste devinable.

## Espace professeur
- Adresse : `…/#/prof` (lien « Espace professeur » en bas de chaque page), code dans `reglages.js`.
- C'est la seule porte vers le classeur : sans le code, `classeur.html` renvoie vers l'Espace professeur.
- « Ce que voient les élèves » : coche les pages vues en classe, puis télécharge `ouverture.js` et dépose-le dans GitHub.

## Le classeur
Pour chaque créneau :
- le déroulé minuté ;
- **Repère et documents** : boutons qui ouvrent directement la bonne page du cours (élève ou prof), de la fiche d'exercices, des corrigés et de la fiche à projeter ;
- **École Directe** : le « Contenu de séance » et le « Travail à faire » déjà rédigés, avec un bouton « Copier » pour chacun ;
- l'activité, les 5 questions Plickers, le devoir à donner (avec la fiche à imprimer et son corrigé).

Après chaque cours, indique « Fait », « Pas tout fini » ou « Annulé » : la suite se recalcule, ainsi que les textes pour École Directe.

## Les cours
Mise en page LaTeX (encadrés, couleurs et polices comme ton modèle). Pas de nom ni de prénom sur les cours. Une petite mention « Séance n » indique où commence chaque séance. Les cours ne renvoient plus à un cahier d'activités : chaque « S'entraîner » donne les numéros de la fiche d'exercices du chapitre. Les sources LaTeX sont dans `Sources_LaTeX.zip`.

## Les contrôles sur papier, avec QR code
Espace professeur → « Contrôle sur papier » (même principe qu'en 6e) :
1. Coche les compétences, indique la classe, colle la liste des élèves, coche la version aménagée si besoin.
2. « Préparer le contrôle » : durée automatique (≈ 20, 30 ou 45 min), ajustable avec − et +, et vérification que chaque copie tient sur une page A4.
3. « Imprimer les sujets » : une page par élève, avec en haut son nom et prénom, juste en dessous un code et un QR code. Tu disposes aussi d'un « Corrigé » et d'un « Fichier pour la correction assistée ».
4. Colle les résultats (`CODE C1=TB C2=MF…`), vérifie le tableau, puis imprime les étiquettes QR (planche de 21 étiquettes L7160). Le QR ouvre « Mon contrôle » : le bilan de l'élève, le corrigé de son sujet et les exercices à refaire.

Rien n'est stocké sur un serveur : les contrôles restent sur l'appareil du professeur, et chaque sujet est recalculé à partir de son code.
