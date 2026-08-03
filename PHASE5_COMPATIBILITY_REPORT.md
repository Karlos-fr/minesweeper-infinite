# Vérification de compatibilité phase 5.2

## Critères vérifiés (portage isomorphe)

- Difficultés :
  - `Difficulty` supportées: `Beginner`, `Intermediate`, `Expert`.
  - Changement de difficulté disponible via l’orchestrateur/contrôleur.
- Timer :
  - Démarrage automatique au premier clic.
  - Arrêt en fin de partie (`won` / `died`) et sur reset.
- États de fin de partie :
  - `won` déclenché par `WON` dans le reducer après ouverture valide.
  - `died` déclenché par `GAME_OVER` et affichage visuel dédié.
- Marquage / doute / erreur de drapeau :
  - `cover -> flag -> unknown -> cover`.
  - Affichage `misflagged` pour drapeaux erronés après échec.
- Reset :
  - Reset via clic face + logique `CLEAR_MAP`.

## Références

- Core mécanique: `src/core/engine/*`
- Contrôleur/rendu: `src/app/MinesweeperCanvasController.ts`, `src/canvas/renderer.ts`
- Entrée publique: `src/app/usePlayableGrid.ts`

## Remarque

La matrice complète de parity source 1:1 avec `download/minesweeper-master` n’est pas automatisée. Le flux de gameplay principal est conforme au modèle classique Minesweeper.
