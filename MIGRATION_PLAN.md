# Plan de portage TypeScript (isomorphique, fonctionnel et rendu identique)

Objectif : migrer `download/minesweeper-master` vers TypeScript avec une architecture modulaire stricte (`1 fichier = 1 module/fonctionnalité`), sans régression de règles de jeu ni de rendu visuel.

## Référentiel de base
- Source d’analyse : `download/minesweeper-master` (non versionné, déjà ignoré)
- Repo cible : `.` (projet TypeScript)
- Règles globales
  - Types explicites partout (State, Cell, Difficulty, Action, Direction des interactions)
  - Un fichier = un module/fonctionnalité principale
  - Rendu visuel 1:1 (même assets, même états visuels)
  - Même comportements d’UX (clic gauche, clic droit, long-press, timer, smiley, niveaux)
  - Pas de dépendances visuelles additionnelles sans nécessité

---

## Phase 1 — Infrastructure TypeScript et base du projet

### Tâche 1.1 — Initialisation TS
- [x] Ajouter `tsconfig.json` (strict: true)
- [x] Basculer React scripts ou adapter la config build
  - Option A : CRA + TypeScript
  - [x] Option B : Vite + React + TS (choisir 1 seule)
- [x] Installer types (`typescript`, `@types/react`, `@types/react-dom`)
- [x] Mettre à jour les scripts (`start`, `build`, `serve`, `typecheck`)

### Tâche 1.2 — Arborescence cible
Créer la structure suivante (un fichier par unité fonctionnelle) :
- `src/app/`
- `src/core/`
- `src/core/engine/`
- `src/core/ui/`
- `src/ui/`
- `src/ui/components/`
- `src/ui/styles/`
- `src/utils/`
- [x] Arborescence de base créée

### Tâche 1.3 — Migration des assets
- [x] Copier `src/assets/*` vers `src/ui/assets/*`
- [x] Conserver les mêmes noms de fichiers au maximum pour réduire les écarts visuels

### Tâche 1.4 — Typage fondamental (fichiers modules dédiés)
- [x] `src/core/types.ts`
  - Types: `CellState`, `Difficulty`, `Cell`, `GameStatus`, `GameState`, `GameAction`
- [x] `src/core/config.ts`
  - Dériver de `Minesweeper/config.js`

---

## Phase 2 — Portage “moteur de jeu” (isomorphique)

### Tâche 2.1 — Module de génération
- [ ] `src/core/engine/gridFactory.ts`
  - Générer la grille plate (`rows * columns`) et initialiser `cover`
- [ ] `src/core/engine/minePlacer.ts`
  - Port de la logique d’exploration aléatoire sans bordures
- [ ] `src/core/engine/minesCounter.ts`
  - Calcul des mines adjacentes par cellule

### Tâche 2.2 — Module logique d’ouverture/expansion
- [ ] `src/core/engine/opening.ts`
  - `openCell`, `openAdjacentZeros` (BFS/DFS)
  - Gestion `misflagged`, `die`, `won`
- [ ] `src/core/engine/validator.ts`
  - Conditions de victoire, de défaite, garde-fous de clics invalides

### Tâche 2.3 — State machine de jeu
- [ ] `src/core/engine/gameReducer.ts`
  - Actions: `START`, `OPEN`, `FLAG`, `UNFLAG`, `RESET`, `SET_DIFFICULTY`
  - Timer start/stop, état de partie, compteurs
- [ ] `src/core/engine/useGameState.ts`
  - Hook ou service exposant état + dispatch

### Tâche 2.4 — Vérification iso-logiciel
- [ ] Créer mini-suite de tests mentaux (tableaux de cases connus)
- [ ] Vérifier parity avec comportements source (pas de test automatisé obligatoire ici, mais scenario listé)

---

## Phase 3 — Portage interface et interactions

### Tâche 3.1 — Entrée/sortie de données vers vue
- [ ] `src/app/MinesweeperController.ts`
  - Orchestre state + callbacks UI
- [ ] `src/app/types.ts` (props de haut niveau)

### Tâche 3.2 — Vue principale
- [ ] `src/ui/components/MinesweeperView.tsx`
  - Remplacement de `Minesweeper/MinesweeperView.js`
  - Utiliser le même CSS class pattern d’abord, puis convertir en CSS Modules si utile

### Tâche 3.3 — Boutons et événements
- [ ] `src/ui/components/Cell.tsx`
  - Click gauche: ouvrir, click droit: flag
- [ ] `src/ui/components/TopBar.tsx`
  - Compteur mines, smiley/win/lose
- [ ] `src/ui/components/Board.tsx`
  - Grille, clés, tailles, touches de raccourci

### Tâche 3.4 — Comportements tactiles / desktop
- [ ] `src/ui/hooks/usePlatform.ts`
  - Détection mobile/desktop (<=768px)
- [ ] `src/ui/hooks/useTouchLongPress.ts`
  - Long press / multi-touch compatible

### Tâche 3.5 — Styles
- [ ] `src/ui/styles/global.css` (issu de `src/index.css`)
- [ ] `src/ui/styles/minesweeper.css` (issu de styles styled-components)
- [ ] Si on conserve `styled-components`, créer un module dédié `src/ui/styles/styled.ts`

---

## Phase 4 — Fonction “grille en plein espace disponible” (exigence spéciale)

### Tâche 4.1 — Module de calcul d’adaptation
- [ ] `src/core/engine/fullscreenLayout.ts`
- [ ] Exporter une fonction :
  - `computeAdaptiveBoardLayout(viewport: DOMRect, rows: number, cols: number, uiChromePx: number): BoardLayout`
  - `BoardLayout` contient `cellPx`, `scale`, `offsetX`, `offsetY`

### Tâche 4.2 — Entrée publique du jeu
- [ ] `src/app/usePlayableGrid.ts`
- [ ] Exporter :
  - `createPlayableFullScreenGrid(root: HTMLElement, difficulty?: Difficulty, options?: PlayOptions): GameHandle`
  - `resize` listener auto
  - Recalcul adaptatif quand la fenêtre change

### Tâche 4.3 — Intégration UI
- [ ] `src/ui/components/FullscreenBoardHost.tsx`
  - Réalise le rendu sur toute la surface disponible (`width: 100vw`, `height: 100vh`)
  - Utilise `computeAdaptiveBoardLayout` pour scale/spacing

### Tâche 4.4 — Validation visuelle spécifique
- [ ] Scénario 4x résolution: desktop, fenêtre réduite, mobile, full-screen
- [ ] Vérifier: aucune cellule coupée, grille centrée, UI lisible, clics alignés

---

## Phase 5 — Finalisation et livraison

### Tâche 5.1 — Wiring final
- [ ] `src/main.tsx` ou `src/index.tsx` (entry)
- [ ] Mapping route racine -> `<App />`
- [ ] Service worker en mode opt-in selon cible

### Tâche 5.2 — Contrôle de compatibilité “full iso”
- [ ] Comparatif fonctionnalités avec version JS
  - Difficultés
  - Timer
  - États de fin de partie
  - Marquage / doute / erreur de drapeau
  - Reset

### Tâche 5.3 — Qualité
- [ ] `lint` + `typecheck`
- [ ] Supprimer code JS résiduel (sauf assets)

---

## Plan de découpage (mapping de migration)

- `src/core/types.ts` → états & contrats
- `src/core/config.ts` → constantes de difficulté
- `src/core/engine/gridFactory.ts` → création de grille
- `src/core/engine/minePlacer.ts` → placement mines
- `src/core/engine/minesCounter.ts` → nombre de mines adjacentes
- `src/core/engine/opening.ts` → ouverture récursive
- `src/core/engine/validator.ts` → règles de victoire/défaite
- `src/core/engine/gameReducer.ts` → logique de transitions
- `src/app/MinesweeperController.ts` → composant conteneur métier
- `src/ui/components/MinesweeperView.tsx` → rendu global
- `src/ui/components/Board.tsx` → matrice/zone de clic
- `src/ui/components/Cell.tsx` → cellule
- `src/ui/components/TopBar.tsx` → panneau haut
- `src/ui/styles/minesweeper.css` → style visuel
- `src/ui/styles/global.css` → styles globaux
- `src/app/usePlayableGrid.ts` → API de lancement en plein écran

---

## Définition de “done”

Le port est considéré terminé quand :
- l’app compile en TypeScript sans erreur stricte
- la mécanique est strictement identique
- la vue conserve le rendu original (sprites/états)
- la grille peut se lancer en mode "plein espace navigateur" via `createPlayableFullScreenGrid`
- toutes les dépendances JS sont retirées au profit de TS
