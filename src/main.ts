import './ui/styles/global.css';
import './ui/styles/canvas.css';
import { initializeMinesweeperApp } from './app/initialize';
import { registerServiceWorker } from './app/offline';

const game = initializeMinesweeperApp();
registerServiceWorker();

window.addEventListener('beforeunload', () => {
  game.dispose();
});
