// ============================================================================
// Minesweeper Infinite - Point d'entrée de l'application
// ----------------------------------------------------------------------------
// Ce fichier charge les styles, initialise le jeu et organise sa fermeture. Il
// ne contient pas les règles métier.
// ============================================================================
import './ui/styles/global.css';
import './ui/styles/canvas.css';
import './ui/styles/board.css';
import './ui/styles/menu.css';
import { initializeMinesweeperApp } from './app/initialize';
import { registerServiceWorker } from './app/offline';

// Constante `game` utilisée par la responsabilité de ce module.
const game = initializeMinesweeperApp();
registerServiceWorker();

window.addEventListener(
  'beforeunload',
  // ----------------------------------------------------------------------------
  // Exécute le callback associé à add event listener.
  //
  // Effets de bord :
  // - aucun.
  // ----------------------------------------------------------------------------
  () => {
    game.dispose();
  },
);
