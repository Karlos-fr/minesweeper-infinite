# Plan de portage TypeScript + Canvas (isomorphique, fonctionnel et rendu identique)

Objectif : migrer `download/minesweeper-master` vers TypeScript avec une architecture modulaire stricte (`1 fichier = 1 module/fonctionnalité`) en gardant l’équivalence de règles et de rendu.

## Décision technique confirmée
- Stack d’exécution : TypeScript + Vite + Canvas natif
- Source d’analyse : `download/minesweeper-master` (non versionné, ignoré)
- Repo cible : `.`
- Règles globales
  - Types explicites partout (State, Cellule, Difficulté, Action, Entrées utilisateur)
  - Un fichier = un module/fonctionnalité
  - Mécanique de jeu strictement inchangée
  - Rendu visuel fidèle au style XP via sprites et layout adaptatif

---

## Phase 1 — Infrastructure TypeScript + base Canvas

### Tâche 1.1 — Initialisation TS
- [x] Ajouter `tsconfig.json` (strict: true)
- [x] Basculer sur Vite + TypeScript (sans React)
- [x] Installer/valider dépendances TS (`typescript`, `vite`)
- [x] Mettre à jour les scripts (`start`, `build`, `serve`, `preview`, `typecheck`)

### Tâche 1.2 — Arborescence cible
Créer la structure suivante (un fichier par unité fonctionnelle) :
- `src/app/`
- `src/core/`
- `src/core/engine/`
- `src/canvas/`
- `src/utils/`

[x] Arborescence de base créée

### Tâche 1.3 — Migration des assets
- [x] Copier `src/assets/*` vers `src/ui/assets/*`
- [x] Conserver les mêmes noms de fichiers au maximum pour réduire les écarts visuels

### Tâche 1.4 — Typage fondamental (fichiers modules dédiés)
- [x] `src/core/types.ts`
  - Types: `CellState`, `Difficulty`, `Cell`, `GameStatus`, `GameState`, `GameAction`
- [x] `src/core/config.ts`
  - Dériver de `Minesweeper/config.js`

### Tâche 1.5 — Entrée canvas (mise en place du socle)
- [x] `src/main.ts`
  - Appelle le bootstrap et injecte le canvas au runtime
- [x] `src/app/bootstrap.ts`
  - Création du `<canvas>` principal, gestion resize, contexte 2D prêt pour le rendu

### Tâche 1.6 — Retrait des dépendances React
- [x] Retirer `react`, `react-dom` et `@vitejs/plugin-react` de la base
- [x] Supprimer l’entrée `src/App.tsx` et `src/main.tsx`

---

## Phase 2 — Portage du moteur de jeu (isomorphique)

### Tâche 2.1 — Module de génération
- [x] `src/core/engine/gridFactory.ts`
  - Générer la grille plate (`rows * columns`) et initialiser `cover`
- [x] `src/core/engine/minePlacer.ts`
  - Port de la logique d’exploration aléatoire sans bordures
- [x] `src/core/engine/minesCounter.ts`
  - Calcul des mines adjacentes par cellule
- [x] `src/core/engine/gridUtils.ts`
  - Fonctions partagées de voisinage et d’échantillonnage

### Tâche 2.2 — Module logique d’ouverture/expansion
- [x] `src/core/engine/opening.ts`
  - `openCell`, `openAdjacentZeros` (BFS/DFS)
  - Gestion `misflagged`, `die`, `won`
- [x] `src/core/engine/validator.ts`
  - Conditions de victoire, de défaite, garde-fous de clics invalides

### Tâche 2.3 — State machine de jeu
- [x] `src/core/engine/gameReducer.ts`
  - Actions: `START`, `OPEN`, `FLAG`, `UNFLAG`, `RESET`, `SET_DIFFICULTY`
  - Timer start/stop, état de partie, compteurs
- [x] `src/core/engine/useGameState.ts`
  - Service d’état + transitions

### Tâche 2.4 — Vérification iso-logiciel
- [ ] Créer mini-suite de scénarios manuels (tableaux de cases connus)
- [ ] Vérifier la parity avec le comportement source

---

## Phase 3 — Portage rendu Canvas et interactions

### Tâche 3.1 — Couche DOM → Canvas
- [x] `src/canvas/engine.ts`
  - Types d’entrées (`MouseButton`, `PointerEventLike`)
  - Utilitaires de normalisation de coordonnées

### Tâche 3.2 — Moteur de rendu principal
- [x] `src/canvas/renderer.ts`
  - Dessin des cellules, chiffres, mines, drapeaux, états
- [x] `src/canvas/layout.ts`
  - Mapping logique grille -> pixel (cellules, marges, scale)

### Tâche 3.3 — Contrôleur de vue canvas
- [x] `src/app/MinesweeperCanvasController.ts`
  - Lie état de jeu + moteur de rendu + événements

### Tâche 3.4 — Gestion des interactions
- [x] `src/canvas/input.ts`
  - Clic gauche/droit, pressions combinées, pointer events

### Tâche 3.5 — Styles DOM + canvas
- [x] `src/ui/styles/global.css` (globales layout)
- [x] `src/ui/styles/canvas.css` (variables, curseur, anti-aliasing)

---

## Phase 4 — Fonction "grille en plein espace disponible" (exigence spéciale)

### Tâche 4.1 — Module de calcul d’adaptation
- [ ] `src/app/fullscreenLayout.ts`
  - `computeAdaptiveBoardLayout(viewport, rows, cols, uiChromePx): BoardLayout`

### Tâche 4.2 — Entrée publique du jeu
- [ ] `src/app/usePlayableGrid.ts`
  - Exporter `createPlayableFullScreenGrid(root, difficulty?, options?)`
  - `resize` listener auto + recalcul layout

### Tâche 4.3 — Intégration runtime
- [ ] `src/app/fullscreenHost.ts`
  - Démarrage du gameplay dans la zone disponible (`100vw`/`100vh`)
  - Gestion des marges et centrage

### Tâche 4.4 — Validation visuelle spécifique
- [ ] Tests de ratio sur 4 résolutions (desktop, petite fenêtre, mobile, full-screen)
- [ ] Vérifier: aucune cellule tronquée, grille centrée, clics précis

---

## Phase 5 — Finalisation et livraison

### Tâche 5.1 — Wiring final
- [x] `src/main.ts` en entrée
- [ ] `src/app/initialize.ts` (orchestration complète quand le moteur est prêt)
- [ ] Service worker / offline: selon cible

### Tâche 5.2 — Contrôle de compatibilité “full iso”
- [ ] Comparatif fonctionnalités avec version JS
  - Difficultés
  - Timer
  - États de fin de partie
  - Marquage / doute / erreur de flag
  - Reset

### Tâche 5.3 — Qualité
- [ ] `typecheck`
- [ ] Retirer le code JS non utilisé (sauf assets)

---

## Plan de découpage (mapping de migration)

- `src/core/types.ts` → états & contrats
- `src/core/config.ts` → constantes de difficulté
- `src/core/engine/gridFactory.ts` → création de grille
- `src/core/engine/minePlacer.ts` → placement mines
- `src/core/engine/minesCounter.ts` → nombre de mines adjacentes
- `src/core/engine/opening.ts` → ouverture récursive
- `src/core/engine/validator.ts` → règles de victoire/défaite
- `src/core/engine/gameReducer.ts` → transitions d’état
- `src/app/bootstrap.ts` → bootstrap DOM/canvas
- `src/app/MinesweeperCanvasController.ts` → contrôleur de gameplay canvas
- `src/canvas/renderer.ts` → rendu visuel
- `src/canvas/layout.ts` → mapping grille -> pixels
- `src/canvas/input.ts` → gestion des événements
- `src/ui/styles/global.css` → styles globaux
- `src/ui/styles/canvas.css` → styles visuels canvas
- `src/app/usePlayableGrid.ts` → API de grille pleine page

---

## Définition de “done”

Le port est considéré terminé quand :
- l’app compile en TypeScript strict
- la mécanique est strictement identique
- la vue conserve le rendu original (sprites/états)
- la grille peut se lancer en mode plein espace via `createPlayableFullScreenGrid`
- toutes les dépendances React/JS sont retirées au profit de TypeScript + Canvas
