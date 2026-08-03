# Minesweeper Infinite

Clone de Minesweeper (inspiration Windows XP) en TypeScript + Canvas.

## Fonctionnalités

- Moteur de jeu complet (placement de mines, ouverture récursive, drapeaux, conditions de victoire/défaite)
- Rendu Canvas fidèle avec sprites
- Grille responsive qui occupe l’espace disponible
- Support des trois difficultés (`Beginner`, `Intermediate`, `Expert`)
- Timer et états de jeu (`won` / `died`)
- Enregistrement service worker pour un usage hors ligne basique

## Démarrage local

```bash
npm install
npm run start
```

## Vérifications

```bash
npm run typecheck
npm run build
```

## Déploiement GitHub Pages

Le site est déployé automatiquement sur GitHub Pages.

- URL prévue: https://Karlos-fr.github.io/minesweeper-infinite/

Le déploiement est automatisé via GitHub Actions via le workflow `Deploy GitHub Pages` (`.github/workflows/gh-pages.yml`).

À chaque push sur `main`, une build est générée puis publiée sur GitHub Pages.

Pour activer le site manuellement :

1. Le workflow doit être présent dans le dépôt : `.github/workflows/gh-pages.yml`
2. Dans GitHub → Settings → Pages → Source = `GitHub Actions`
3. Pousser un commit sur `main`
4. Vérifier le job `Deploy GitHub Pages` dans l’onglet Actions
