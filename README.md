<p align="center">
  <img src="doc/header.png" alt="Minesweeper Infinite" />
</p>

<p align="center">
  <a href="README.md"><img src="doc/flag-fr.svg" alt="" width="18" height="12" /> Français</a>
  /
  <a href="doc/README.en.md"><img src="doc/flag-gb.svg" alt="" width="18" height="12" /> English</a>
</p>

# Minesweeper Infinite

Reproduction fidèle du Démineur classique pour navigateur, inspirée de l’interface de Windows XP et développée en TypeScript strict avec Vite.

Minesweeper Infinite fonctionne directement dans un navigateur moderne, sans installation. Il conserve les règles et la présentation pixel art familières tout en ajoutant une grille responsive, un mode d’adaptation à la fenêtre et plusieurs niveaux de zoom.

La présentation visuelle s’appuie sur [ShizukuIchi/minesweeper](https://github.com/ShizukuIchi/minesweeper).

## Fonctionnalités

- Moteur de jeu complet avec placement des mines, ouverture récursive, drapeaux, ouverture combinée et détection de victoire ou de défaite.
- Interface fidèle en pixel art inspirée de Windows XP, avec sprites, compteurs, visages et menu dans le style d’origine.
- Trois difficultés classiques : `Beginner`, `Intermediate` et `Expert`.
- Mode `Fit to window` qui adapte les dimensions de la grille et le nombre de mines à l’espace disponible.
- Zoom d’affichage `1x`, `1.5x` et `2x`, compatible avec chaque difficulté et avec `Fit to window`.
- Contrôles à la souris et au tactile, avec clic droit et appui long pour les drapeaux.
- Chronomètre, compteur de mines restantes, effets sonores et états visuels de la partie.
- Disposition responsive et centrée avec un rendu pixel art net.
- Prise en charge hors ligne basique grâce à un service worker.

## Jouer en ligne

La version actuelle est publiée sur GitHub Pages :

[Jouer à Minesweeper Infinite](https://karlos-fr.github.io/minesweeper-infinite/)

## Utilisation

1. Ouvrez le jeu dans un navigateur.
2. Choisissez une difficulté dans le menu `Game` ou sélectionnez `Fit to window`.
3. Ouvrez une cellule pour démarrer le chronomètre et générer le champ de mines.

Le menu `Game` propose :

- `New` (`F2`) : redémarre le mode de jeu actif ;
- `Beginner`, `Intermediate` et `Expert` : sélectionne une difficulté classique ;
- `Fit to window` : remplit l’espace disponible avec une grille de taille dynamique ;
- `Zoom 1x`, `Zoom 1.5x` et `Zoom 2x` : modifie la taille du plateau et de ses contrôles.

Contrôles :

- clic gauche ou toucher : ouvrir une cellule ;
- clic droit ou appui long tactile : placer ou faire défiler un marqueur ;
- pression simultanée des deux boutons sur une cellule numérotée ouverte : ouvrir ses voisines lorsque le nombre de drapeaux correspond ;
- clic sur le visage : démarrer une nouvelle partie.

Une fois la partie gagnée ou perdue, les interactions avec la grille restent désactivées jusqu’au démarrage d’une nouvelle partie.

## Difficultés

| Difficulté | Grille | Mines |
| --- | ---: | ---: |
| Beginner | 9 × 9 | 10 |
| Intermediate | 16 × 16 | 40 |
| Expert | 16 × 30 | 99 |

`Fit to window` calcule le nombre de lignes et de colonnes selon la fenêtre et le zoom sélectionné. Son nombre de mines conserve la densité de la difficulté active au moment de la sélection du mode.

## Architecture

```text
src/
├── app/            # Cycle de vie, menu, disposition et orchestration
├── canvas/         # Entrées pointeur, géométrie et rendu du plateau
├── core/           # Configuration et types partagés du jeu
│   └── engine/     # Reducer, store, génération, ouverture et validation
└── ui/
    ├── assets/     # Sprites pixel art et effets sonores
    └── styles/     # Styles globaux, du menu, du canvas et du plateau
public/
└── sw.js           # Service worker
```

Les règles du jeu restent indépendantes des API du navigateur. La couche applicative relie le store aux entrées, à la disposition, au menu, aux sons et au rendu hybride Canvas/DOM.

## Prérequis

- Node.js 20 ou version ultérieure recommandé ;
- npm ;
- un navigateur moderne.

## Développement local

```bash
npm install
npm run start
```

Vite sert par défaut l’application sur `http://localhost:5173/minesweeper-infinite/`.

## Vérifications et build

```bash
npm run typecheck
npm run build
npm run preview
```

L’application de production est générée dans `dist/`.

## Choix techniques

- TypeScript strict et API natives du navigateur.
- Vite pour le développement et le build de production.
- Aucun framework d’interface ni dépendance applicative à l’exécution.
- Moteur de jeu isolé du rendu et des interactions avec le navigateur.
- Rendu hybride Canvas/DOM pour une correspondance précise des clics et une présentation fidèle.
- Sprites raster dans le style d’origine, préservés grâce à une mise à l’échelle pixelisée.
