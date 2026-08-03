import './ui/styles/global.css';
import './ui/styles/canvas.css';
import { createPlayableFullScreenGrid } from './app/usePlayableGrid';

const root = document.getElementById('root') ?? document.body;
const game = createPlayableFullScreenGrid(root, 'Beginner');

window.addEventListener('beforeunload', () => {
  game.dispose();
});
