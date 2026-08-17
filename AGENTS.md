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

## Règles de commentaires

Tous les commentaires du code source doivent être écrits en français.

### En-têtes de fichiers

Chaque fichier source TypeScript ou JavaScript doit commencer par un en-tête en français qui décrit :

- le nom du module ;
- sa responsabilité ;
- sa frontière importante avec les autres modules.

Utiliser cette structure exacte avant les imports, déclarations ou instructions :

```ts
// ============================================================================
// Minesweeper Infinite - Module du contrôleur du plateau
// ----------------------------------------------------------------------------
// Ce fichier orchestre le moteur, les entrées et le rendu du plateau. Il ne
// contient pas les règles métier, qui restent dans src/core/engine.
// ============================================================================
```

Chaque fichier CSS doit utiliser l'équivalent suivant avant toute règle :

```css
/* ============================================================================
 * Minesweeper Infinite - Styles du plateau
 * ----------------------------------------------------------------------------
 * Ce fichier définit la présentation du plateau sans modifier sa géométrie
 * métier ni le comportement du moteur de jeu.
 * ========================================================================== */
```

- Garder le titre court et spécifique à la responsabilité réelle du fichier.
- Ne pas ajouter cet en-tête aux fichiers Markdown, JSON, images, sons ou autres assets qui n'acceptent pas naturellement les commentaires.
- Ne pas modifier un fichier généré uniquement pour lui ajouter un en-tête.

### Fonctions

Chaque fonction doit avoir un commentaire d'en-tête en français qui décrit :

- son action ;
- ses paramètres lorsqu'ils existent ;
- sa valeur de retour lorsqu'elle existe ;
- ses effets de bord importants lorsqu'ils existent.

Utiliser cette structure exacte :

```ts
// ----------------------------------------------------------------------------
// Calcule la densité de mines d'une grille finie.
//
// Paramètres :
// - state : état du jeu utilisé pour lire les dimensions et le nombre de mines.
//
// Retour :
// - densité de mines normalisée entre 0 et 1.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function getMineDensity(state: GameState): number {
  // ...
}
```

- Omettre les sections `Paramètres`, `Retour` ou `Effets de bord` uniquement lorsqu'elles ne s'appliquent réellement pas.
- Nommer chaque paramètre documenté exactement comme dans la signature.
- Documenter les fonctions exportées et locales, les méthodes, les callbacks, les gestionnaires d'événements, les listeners, les factories et les fonctions fléchées.
- Placer le commentaire immédiatement au-dessus de la déclaration ou, pour un callback en ligne, immédiatement avant le callback.
- Décrire les mutations du store, accès DOM, timers, sons, observers, abonnements et écouteurs dans les effets de bord.
- Conserver les lignes de séparation d'ouverture et de fermeture autour de chaque commentaire de fonction.

### Constantes

Chaque constante doit avoir un commentaire français dédié qui explique ce qu'elle représente.

Placer ce commentaire immédiatement au-dessus de la constante :

```ts
// Délai en millisecondes avant qu'un appui tactile devienne un appui long.
const LONG_PRESS_DELAY_MS = 550;
```

- Ne pas utiliser un commentaire commun pour plusieurs constantes.
- Documenter les constantes globales, locales, les tables de configuration et les valeurs de temporisation.
- Pour les variables CSS personnalisées, commenter uniquement celles dont le rôle ou l'unité ne sont pas évidents afin de ne pas surcharger les feuilles de style.

### Qualité et migration

- Expliquer l'intention, les limites, les hypothèses et les effets de bord plutôt que répéter littéralement le code.
- Maintenir les commentaires lorsque le comportement ou la signature change.
- Pour un nouveau fichier, appliquer immédiatement toutes ces règles.
- Dans un fichier historique qui ne respecte pas encore ces règles, documenter au minimum l'en-tête du fichier ainsi que chaque fonction et constante ajoutée ou modifiée par la tâche en cours.
- Ne pas réécrire tout un module sans rapport avec la demande uniquement pour compléter ses commentaires ; effectuer cette migration dans une tâche dédiée.

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
