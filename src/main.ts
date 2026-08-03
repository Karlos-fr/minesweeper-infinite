import './ui/styles/global.css';
import './ui/styles/canvas.css';
import { bootstrap } from './app/bootstrap';
import { createMinesweeperCanvasController } from './app/MinesweeperCanvasController';

const root = document.getElementById('root') ?? document.body;
const host = bootstrap(root);
const controller = createMinesweeperCanvasController(host, { difficulty: 'Beginner' });

window.addEventListener('beforeunload', () => {
  controller.dispose();
});
