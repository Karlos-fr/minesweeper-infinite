// ============================================================================
// Minesweeper Infinite - Rendu du plateau
// ----------------------------------------------------------------------------
// Ce fichier synchronise le Canvas et la couche DOM visuelle avec l'état du
// jeu. Il ne traite pas les entrées.
// ============================================================================
import type { GameState } from '../core/types';
import type { BoardLayout } from './layout';
import dead from '../ui/assets/dead.png';
import smile from '../ui/assets/smile.png';
import win from '../ui/assets/win.png';
import ohh from '../ui/assets/ohh.png';
import empty from '../ui/assets/empty.png';
import open1 from '../ui/assets/open1.png';
import open2 from '../ui/assets/open2.png';
import open3 from '../ui/assets/open3.png';
import open4 from '../ui/assets/open4.png';
import open5 from '../ui/assets/open5.png';
import open6 from '../ui/assets/open6.png';
import open7 from '../ui/assets/open7.png';
import open8 from '../ui/assets/open8.png';
import flag from '../ui/assets/flag.png';
import mine from '../ui/assets/mine-ceil.png';
import mineDeath from '../ui/assets/mine-death.png';
import misFlagged from '../ui/assets/misflagged.png';
import question from '../ui/assets/question.png';
import digit0 from '../ui/assets/digit0.png';
import digit1 from '../ui/assets/digit1.png';
import digit2 from '../ui/assets/digit2.png';
import digit3 from '../ui/assets/digit3.png';
import digit4 from '../ui/assets/digit4.png';
import digit5 from '../ui/assets/digit5.png';
import digit6 from '../ui/assets/digit6.png';
import digit7 from '../ui/assets/digit7.png';
import digit8 from '../ui/assets/digit8.png';
import digit9 from '../ui/assets/digit9.png';
import digitMinus from '../ui/assets/digit-.png';

// Constante `digitSources` utilisée par la responsabilité de ce module.
const digitSources: Record<string, string> = {
  '0': digit0,
  '1': digit1,
  '2': digit2,
  '3': digit3,
  '4': digit4,
  '5': digit5,
  '6': digit6,
  '7': digit7,
  '8': digit8,
  '9': digit9,
  '-': digitMinus,
};

// Constante `openSources` utilisée par la responsabilité de ce module.
const openSources = [empty, open1, open2, open3, open4, open5, open6, open7, open8];

interface DomRenderer {
  readonly root: HTMLDivElement;
  readonly leftCounter: HTMLDivElement;
  readonly rightCounter: HTMLDivElement;
  readonly face: HTMLButtonElement;
  readonly faceImage: HTMLImageElement;
  readonly grid: HTMLDivElement;
  cells: HTMLDivElement[];
  cellKeys: string[];
  layoutKey: string;
  canvasKey: string;
}

// Constante `renderers` utilisée par la responsabilité de ce module.
const renderers = new WeakMap<HTMLCanvasElement, DomRenderer>();

// ----------------------------------------------------------------------------
// Formate compteur.
//
// Paramètres :
// - value : valeur fournie au traitement.
//
// Retour :
// - valeur de type `string` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function formatCounter(value: number): string {
  // Constante `clamped` utilisée par la responsabilité de ce module.
  const clamped = Math.max(-999, Math.min(999, value));
  if (clamped < 0) {
    return `-${Math.abs(clamped).toString().padStart(2, '0').slice(-2)}`;
  }
  return clamped.toString().padStart(3, '0').slice(-3);
}

// ----------------------------------------------------------------------------
// Définit compteur.
//
// Paramètres :
// - container : valeur fournie au traitement.
// - value : valeur fournie au traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function setCounter(container: HTMLDivElement, value: number): void {
  // Valeur textuelle du compteur, utilisée pour éviter une reconstruction DOM inutile.
  const formatted = formatCounter(value);
  if (container.dataset.value === formatted) return;

  // Constante `chars` utilisée par la responsabilité de ce module.
  const chars = formatted.split('');
  // Constante `images` utilisée par la responsabilité de ce module.
  const images = chars.map(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à map.
    //
    // Paramètres :
    // - char : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `HTMLImageElement` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (char) => {
      // Constante `image` utilisée par la responsabilité de ce module.
      const image = document.createElement('img');
      image.src = digitSources[char] ?? digit0;
      image.alt = char;
      return image;
    },
  );
  container.replaceChildren(...images);
  container.dataset.value = formatted;
}

// ----------------------------------------------------------------------------
// Crée dom moteur de rendu.
//
// Paramètres :
// - canvas : valeur fournie au traitement.
//
// Retour :
// - valeur de type `DomRenderer` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function createDomRenderer(canvas: HTMLCanvasElement): DomRenderer {
  // Constante `root` utilisée par la responsabilité de ce module.
  const root = document.createElement('div');
  root.className = 'ms-board';
  root.setAttribute('aria-hidden', 'true');

  // Constante `content` utilisée par la responsabilité de ce module.
  const content = document.createElement('section');
  content.className = 'ms-board__content';
  // Constante `score` utilisée par la responsabilité de ce module.
  const score = document.createElement('div');
  score.className = 'ms-board__score';
  // Constante `leftCounter` utilisée par la responsabilité de ce module.
  const leftCounter = document.createElement('div');
  leftCounter.className = 'ms-board__digits';
  // Constante `rightCounter` utilisée par la responsabilité de ce module.
  const rightCounter = document.createElement('div');
  rightCounter.className = 'ms-board__digits';
  // Constante `faceOuter` utilisée par la responsabilité de ce module.
  const faceOuter = document.createElement('div');
  faceOuter.className = 'ms-board__face-outer';
  // Constante `face` utilisée par la responsabilité de ce module.
  const face = document.createElement('button');
  face.type = 'button';
  face.className = 'ms-board__face';
  face.tabIndex = -1;
  // Constante `faceImage` utilisée par la responsabilité de ce module.
  const faceImage = document.createElement('img');
  faceImage.alt = '';
  face.appendChild(faceImage);
  faceOuter.appendChild(face);
  score.append(leftCounter, faceOuter, rightCounter);

  // Constante `grid` utilisée par la responsabilité de ce module.
  const grid = document.createElement('div');
  grid.className = 'ms-board__grid';
  content.append(score, grid);
  root.appendChild(content);
  canvas.parentElement?.appendChild(root);

  return {
    root,
    leftCounter,
    rightCounter,
    face,
    faceImage,
    grid,
    cells: [],
    cellKeys: [],
    layoutKey: '',
    canvasKey: '',
  };
}

// ----------------------------------------------------------------------------
// Garantit cellules.
//
// Paramètres :
// - renderer : valeur fournie au traitement.
// - count : valeur fournie au traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function ensureCells(renderer: DomRenderer, count: number): void {
  if (renderer.cells.length === count) return;
  renderer.cellKeys = Array<string>(count).fill('');
  renderer.cells = Array.from(
    { length: count },
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à from.
    //
    // Retour :
    // - valeur de type `HTMLDivElement` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    () => {
      // Constante `cell` utilisée par la responsabilité de ce module.
      const cell = document.createElement('div');
      cell.className = 'ms-board__cell';
      renderer.grid.appendChild(cell);
      return cell;
    },
  );
  renderer.grid.replaceChildren(...renderer.cells);
}

// ----------------------------------------------------------------------------
// Construit la signature visuelle stable d'une cellule.
//
// Paramètres :
// - state : état de cellule dont le rendu doit être identifié.
//
// Retour :
// - clé qui change uniquement lorsqu'un élément visuel de la cellule change.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
function getCellRenderKey(state: GameState['ceils'][number]): string {
  return `${state.state}:${state.minesAround}:${state.opening ? 1 : 0}`;
}

// ----------------------------------------------------------------------------
// Effectue le rendu de cellule.
//
// Paramètres :
// - cell : valeur fournie au traitement.
// - state : valeur fournie au traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function renderCell(cell: HTMLDivElement, state: GameState['ceils'][number]): void {
  // Constante `raised` utilisée par la responsabilité de ce module.
  const raised = (state.state === 'cover' || state.state === 'unknown') && !state.opening;
  // Constante `background` utilisée par la responsabilité de ce module.
  const background = document.createElement('span');
  background.className = raised ? 'ms-board__cell-bg is-covered' : 'ms-board__cell-bg is-open';

  let source: string | undefined;
  switch (state.state) {
    case 'open':
      source = openSources[state.minesAround] ?? empty;
      break;
    case 'flag':
      source = flag;
      break;
    case 'unknown':
      source = question;
      break;
    case 'mine':
      source = mine;
      break;
    case 'die':
      source = mineDeath;
      break;
    case 'misflagged':
      source = misFlagged;
      break;
    default:
      source = undefined;
  }

  if (!source) {
    cell.replaceChildren(background);
    return;
  }

  // Constante `image` utilisée par la responsabilité de ce module.
  const image = document.createElement('img');
  image.src = source;
  image.alt = '';
  cell.replaceChildren(background, image);
}

// ----------------------------------------------------------------------------
// Compte flags.
//
// Paramètres :
// - state : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
function countFlags(state: GameState): number {
  return state.ceils.filter(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à filter.
    //
    // Paramètres :
    // - cell : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `boolean` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (cell) => cell.state === 'flag' || cell.state === 'misflagged',
  ).length;
}

export interface RenderOptions {
  readonly timerSeconds: number;
  readonly facePressed?: boolean;
}

// ----------------------------------------------------------------------------
// Réagit à images loaded.
//
// Paramètres :
// - callback : valeur fournie au traitement.
//
// Retour :
// - valeur de type `() => void` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
export function onImagesLoaded(callback: () => void): () => void {
  callback();
  // ----------------------------------------------------------------------------
  // Exécute le traitement callback.
  //
  // Retour :
  // - valeur de type `undefined` produite par le traitement.
  //
  // Effets de bord :
  // - aucun.
  // ----------------------------------------------------------------------------
  return () => undefined;
}

// ----------------------------------------------------------------------------
// Libère moteur de rendu.
//
// Paramètres :
// - canvas : valeur fournie au traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function disposeRenderer(canvas: HTMLCanvasElement): void {
  // Constante `renderer` utilisée par la responsabilité de ce module.
  const renderer = renderers.get(canvas);
  renderer?.root.remove();
  renderers.delete(canvas);
}

// ----------------------------------------------------------------------------
// Effectue le rendu de image de rendu.
//
// Paramètres :
// - ctx : valeur fournie au traitement.
// - viewportWidth : valeur fournie au traitement.
// - viewportHeight : valeur fournie au traitement.
// - layout : valeur fournie au traitement.
// - state : valeur fournie au traitement.
// - options : valeur fournie au traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  viewportWidth: number,
  viewportHeight: number,
  layout: BoardLayout,
  state: GameState,
  options: RenderOptions,
): void {
  let renderer = renderers.get(ctx.canvas);
  if (!renderer) {
    renderer = createDomRenderer(ctx.canvas);
    renderers.set(ctx.canvas, renderer);
  }

  // Signature du fond Canvas, qui ne varie qu'avec sa taille physique ou logique.
  const canvasKey = `${viewportWidth}:${viewportHeight}:${ctx.canvas.width}:${ctx.canvas.height}`;
  if (renderer.canvasKey !== canvasKey) {
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    ctx.fillStyle = 'rgb(22, 22, 22)';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    renderer.canvasKey = canvasKey;
  }

  // Constante `scale` utilisée par la responsabilité de ce module.
  const scale = layout.cellSize / 16;
  // Signature de disposition utilisée pour éviter de recalculer les styles de milliers de cellules.
  const layoutKey = `${layout.topBar.x}:${layout.topBar.y}:${scale}:${state.rows}:${state.columns}`;
  if (renderer.layoutKey !== layoutKey) {
    renderer.root.style.left = `${layout.topBar.x}px`;
    renderer.root.style.top = `${layout.topBar.y + 20 * scale}px`;
    renderer.root.style.setProperty('--ms-board-scale', `${scale}`);
    renderer.grid.style.gridTemplateColumns = `repeat(${state.columns}, calc(16px * var(--ms-board-scale)))`;
    renderer.grid.style.gridTemplateRows = `repeat(${state.rows}, calc(16px * var(--ms-board-scale)))`;
    renderer.layoutKey = layoutKey;
  }

  setCounter(renderer.leftCounter, state.mines - countFlags(state));
  setCounter(renderer.rightCounter, Math.max(0, options.timerSeconds));
  renderer.face.classList.toggle('is-pressed', options.facePressed ?? false);
  renderer.faceImage.src =
    state.status === 'died' ? dead : state.status === 'won' ? win : options.facePressed ? ohh : smile;

  ensureCells(renderer, state.ceils.length);
  state.ceils.forEach(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à for each.
    //
    // Paramètres :
    // - cell : valeur fournie au traitement.
    // - index : valeur fournie au traitement.
    //
    // Effets de bord :
    // - met à jour le DOM uniquement lorsque l'apparence de la cellule change.
    // ----------------------------------------------------------------------------
    (cell, index) => {
      // Signature visuelle de la cellule comparée au dernier rendu connu.
      const cellKey = getCellRenderKey(cell);
      if (renderer.cellKeys[index] === cellKey) return;
      renderCell(renderer.cells[index]!, cell);
      renderer.cellKeys[index] = cellKey;
    },
  );
}
