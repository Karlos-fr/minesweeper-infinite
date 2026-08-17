# Journal des modifications

Toutes les modifications notables de Minesweeper Infinite sont recensées dans ce fichier.

Le projet ne possède pas encore de versions taguées. L’historique est donc regroupé chronologiquement par date de développement, à partir des commits Git réalisés depuis sa création.

## 17 août 2026

### Ajouté

- Documentation complète en français dans `README.md`.
- Documentation anglaise dans `doc/README.en.md`.
- Navigation multilingue avec les drapeaux français et britannique.
- Bannière `doc/header.png` intégrée aux deux README.
- Instructions spécifiques au projet dans `AGENTS.md`.
- Règles françaises pour les en-têtes de fichiers, fonctions, callbacks, effets de bord et constantes.
- En-têtes et commentaires structurés dans l’ensemble des fichiers TypeScript.

### Amélioré

- Performances du mode `Fit to window` sur les grandes grilles.
- Mise en cache du rendu visuel des cellules afin de ne reconstruire que les cellules modifiées.
- Mise en cache des compteurs, de la disposition et du fond Canvas.
- Partage structurel des cellules inchangées pendant les aperçus de clic.
- Parcours d’ouverture récursive optimisé avec une file et un ensemble d’index déjà ajoutés.

### Commits principaux

- `b5ce8bd` — documentation du projet et commentaires du code source.
- `e91ab0a` — optimisation des interactions du mode Fit.

## 16 août 2026

### Ajouté

- Options de zoom `1x`, `1.5x` et `2x` dans le menu `Game`.
- Prise en charge du zoom pour les difficultés `Beginner`, `Intermediate` et `Expert`.
- Adaptation automatique du nombre de lignes et de colonnes du mode `Fit to window` selon le zoom.
- Conservation de la densité de mines lors des changements de zoom et de fenêtre.
- Mise à l’échelle pixelisée des sprites pour préserver leur netteté.

### Commit principal

- `c50f427` — ajout des options de zoom de la grille.

## 15 août 2026

### Ajouté

- Feuille de style dédiée au plateau dans `src/ui/styles/board.css`.
- Documentation initiale des responsabilités et conventions du projet dans `AGENTS.md`.

### Modifié

- Refonte du plateau et du menu pour reproduire fidèlement l’apparence de [ShizukuIchi/minesweeper](https://github.com/ShizukuIchi/minesweeper).
- Remplacement du dessin intégral des sprites sur Canvas par un rendu visuel DOM/CSS superposé au Canvas d’entrée.
- Alignement des dimensions, bordures, espacements, couleurs, compteurs, visage et cellules avec la référence.
- Prise en compte du ratio de pixels de l’écran dans le calcul des bordures et du centrage.
- Restauration de l’entrée `Fit to window` dans le menu `Game`.

### Corrigé

- Netteté des sprites `ohh.png`, `smile.png`, `win.png` et `dead.png`.
- Blocage des clics, drapeaux, ouvertures combinées et aperçus après une victoire ou une défaite.
- Maintien du bouton visage actif pour pouvoir recommencer une partie terminée.

### Commits principaux

- `2960c22` — alignement initial des visuels avec la référence.
- `7c2a3e2` — correspondance finale du rendu avec la version d’origine.
- `6e93641` — désactivation des entrées de grille après la fin de partie.
- `2ccfe77` — adaptation initiale des instructions des agents.
- `2ef63e8` — restauration du mode `Fit to window` dans le menu.

## 3 août 2026

### Fondation du projet

- Initialisation du dépôt et rédaction du plan de migration TypeScript.
- Mise en place de TypeScript strict, Vite, du fichier HTML et des scripts npm.
- Passage d’un échafaudage TSX initial à une architecture TypeScript centrée sur Canvas.
- Import des sprites classiques du Démineur : cellules, chiffres, mines, drapeaux, marqueurs et visages.
- Ajout des styles globaux et de la surface Canvas.

### Moteur de jeu

- Création des types du domaine, actions et états de partie.
- Configuration des difficultés classiques :
  - `Beginner` : 9 × 9, 10 mines ;
  - `Intermediate` : 16 × 16, 40 mines ;
  - `Expert` : 16 × 30, 99 mines.
- Génération des grilles et placement aléatoire des mines après le premier clic.
- Calcul des mines voisines et ouverture récursive des zones vides.
- Gestion des drapeaux, marqueurs, ouvertures combinées, victoire et défaite.
- Création du reducer et du store observable du jeu.

### Interface et interactions

- Création de la boucle de rendu Canvas, du calcul de disposition et du contrôleur principal.
- Gestion des clics gauche et droit, de la pression simultanée des boutons et des aperçus de cellules.
- Ajout de l’appui long tactile pour placer un drapeau.
- Création de l’hôte plein écran et de l’API de grille jouable.
- Ajout du menu classique `Game` et `Help`, des difficultés et des actions associées.
- Synchronisation de la taille et de la position du menu avec le plateau.
- Ajout du mode `Fit to window` utilisant tout l’espace disponible.
- Ajout d’une disposition et d’un rendu capables de changer d’échelle.
- Intégration des sons d’ouverture, de victoire et de défaite.

### Fidélité visuelle

- Ajustement progressif de la hauteur du menu et de son alignement avec le plateau.
- Suppression de l’espace vertical entre le menu et la fenêtre du jeu.
- Correction du chargement différé, du clipping et du rendu des sprites.
- Alignement des tuiles, compteurs, cadres et profondeur du bouton visage avec le Démineur classique.
- Correction des décalages du rendu et des zones cliquables.
- Plusieurs expérimentations de disposition ont été réalisées, dont une modification annulée avant la refonte finale.

### Application et déploiement

- Ajout de l’orchestration d’initialisation de l’application.
- Ajout d’un service worker pour une prise en charge hors ligne basique.
- Configuration du chemin Vite `/minesweeper-infinite/`.
- Mise en place du déploiement automatique sur GitHub Pages avec GitHub Actions.
- Ajout du lien vers le dépôt GitHub dans le menu d’aide.
- Citation du dépôt Minesweeper d’origine dans le README.

### Commits structurants

- `c51e717` — création du dépôt.
- `845b93b` — échafaudage TypeScript et Vite.
- `e482583` — passage au rendu Canvas TypeScript.
- `b9d4d68` — moteur de jeu complet.
- `768b59b` — boucle jouable Canvas.
- `67c3225` — grille plein écran et disposition adaptative.
- `91cdfaf` — orchestration de l’application.
- `9338b74` — service worker.
- `26b85bc` — déploiement GitHub Pages.
- `bdaa941` et `df33e22` — menu classique et actions.
- `7b315a9` — prise en charge de l’appui long tactile.
- `ab57b32` — mode `Fit to window`.
- `e5f8580` — effets sonores classiques.
