# Instructions pour les agents

## Contexte du projet

Minesweeper Infinite est un clone du Démineur inspiré de Windows XP, développé en TypeScript strict avec Vite.

Le comportement et l'affichage doivent rester fidèles au projet de référence :

- dépôt : https://github.com/ShizukuIchi/minesweeper
- version déployée : https://mines.vercel.app/

Préserver les règles du jeu, les trois niveaux de difficulté, la grille adaptative, les sons et le fonctionnement hors ligne.

## Organisation du code

- `src/core/` contient les types, la configuration et la logique métier indépendante du navigateur.
- `src/core/engine/` contient le moteur de jeu : grille, mines, ouverture, validation, reducer et store.
- `src/app/` orchestre l'application, le cycle de vie, le menu, le redimensionnement et la connexion entre moteur et interface.
- `src/canvas/` gère les entrées pointeur, les calculs de disposition et le rendu de la grille.
- `src/ui/styles/` contient les styles globaux, du menu, du canvas et du plateau.
- `src/ui/assets/` contient les sprites et les sons d'origine.

Respecter ces responsabilités. Placer une modification dans le module qui la possède déjà et éviter les fichiers utilitaires génériques sans besoin partagé réel.

## Règles d'implémentation

- Écrire du TypeScript strict, simple et lisible, sans introduire de dépendance inutile.
- Conserver la logique métier indépendante du DOM, du Canvas et des API du navigateur.
- Faire transiter les changements d'état du jeu par le store et le reducer existants.
- Garder `MinesweeperCanvasController.ts` centré sur l'orchestration ; extraire une responsabilité si elle devient autonome ou volumineuse.
- Ne pas modifier une fonctionnalité sans rapport avec la demande.
- Ne pas écraser les changements existants de l'utilisateur.
- Mettre à jour le README lorsqu'une commande, une fonctionnalité visible ou le processus de développement change.
- Ajouter des commentaires seulement lorsqu'ils expliquent une intention, une contrainte ou un comportement non évident. Les écrire en français.

## Fidélité graphique

- Maintenir une correspondance visuelle aussi exacte que possible avec https://mines.vercel.app/.
- Réutiliser les sprites présents dans `src/ui/assets/` sans les redessiner, les lisser ou les remplacer sauf demande explicite.
- Préserver leur netteté : éviter tout redimensionnement non entier ou filtrage qui rendrait les pixels flous.
- Conserver les dimensions, bordures, espacements, couleurs, polices et états visuels du jeu de référence.
- Ne pas modifier les règles ou l'état du jeu pour résoudre un problème purement graphique.
- Après une modification visuelle, vérifier l'affichage local dans le navigateur à la même taille de fenêtre et au même ratio de pixels que la référence lorsque les outils le permettent.

## Interactions

- Prendre en charge la souris, le tactile, le clic droit, l'appui long et le chord sans régression.
- Une partie terminée (`won` ou `died`) ne doit plus accepter d'action sur les cellules ; seul un redémarrage ou un changement de partie doit réactiver la grille.
- Nettoyer les écouteurs, timers, observers et éléments de rendu lors de la destruction d'un contrôleur.
- Ne pas laisser un aperçu de pression modifier l'état après la fin d'une partie.

## Vérifications

Installer les dépendances et lancer le serveur local avec :

```bash
npm install
npm run start
```

Avant de terminer une modification de code, exécuter au minimum :

```bash
npm run typecheck
npm run build
```

Exécuter également les tests ciblés disponibles et `git diff --check`. Pour une modification d'interface ou d'interaction, compléter ces vérifications par un test dans le navigateur lorsque celui-ci est accessible.

## Git

- Garder les commits ciblés et utiliser un message décrivant le résultat obtenu.
- Ne pas inclure de fichiers sans rapport avec la demande.
- Ne pas pousser, réécrire l'historique ou créer une pull request sans demande explicite.
