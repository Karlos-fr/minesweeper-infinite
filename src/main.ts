import './ui/styles/global.css';
import './ui/styles/canvas.css';
import { initializeMinesweeperApp } from './app/initialize';

const game = initializeMinesweeperApp();

window.addEventListener('beforeunload', () => {
  game.dispose();
});
