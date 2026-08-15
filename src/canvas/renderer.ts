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

const openSources = [empty, open1, open2, open3, open4, open5, open6, open7, open8];

interface DomRenderer {
  readonly root: HTMLDivElement;
  readonly leftCounter: HTMLDivElement;
  readonly rightCounter: HTMLDivElement;
  readonly face: HTMLButtonElement;
  readonly faceImage: HTMLImageElement;
  readonly grid: HTMLDivElement;
  cells: HTMLDivElement[];
}

const renderers = new WeakMap<HTMLCanvasElement, DomRenderer>();

function formatCounter(value: number): string {
  const clamped = Math.max(-999, Math.min(999, value));
  if (clamped < 0) {
    return `-${Math.abs(clamped).toString().padStart(2, '0').slice(-2)}`;
  }
  return clamped.toString().padStart(3, '0').slice(-3);
}

function setCounter(container: HTMLDivElement, value: number): void {
  const chars = formatCounter(value).split('');
  const images = chars.map(char => {
    const image = document.createElement('img');
    image.src = digitSources[char] ?? digit0;
    image.alt = char;
    return image;
  });
  container.replaceChildren(...images);
}

function createDomRenderer(canvas: HTMLCanvasElement): DomRenderer {
  const root = document.createElement('div');
  root.className = 'ms-board';
  root.setAttribute('aria-hidden', 'true');

  const content = document.createElement('section');
  content.className = 'ms-board__content';
  const score = document.createElement('div');
  score.className = 'ms-board__score';
  const leftCounter = document.createElement('div');
  leftCounter.className = 'ms-board__digits';
  const rightCounter = document.createElement('div');
  rightCounter.className = 'ms-board__digits';
  const faceOuter = document.createElement('div');
  faceOuter.className = 'ms-board__face-outer';
  const face = document.createElement('button');
  face.type = 'button';
  face.className = 'ms-board__face';
  face.tabIndex = -1;
  const faceImage = document.createElement('img');
  faceImage.alt = '';
  face.appendChild(faceImage);
  faceOuter.appendChild(face);
  score.append(leftCounter, faceOuter, rightCounter);

  const grid = document.createElement('div');
  grid.className = 'ms-board__grid';
  content.append(score, grid);
  root.appendChild(content);
  canvas.parentElement?.appendChild(root);

  return { root, leftCounter, rightCounter, face, faceImage, grid, cells: [] };
}

function ensureCells(renderer: DomRenderer, count: number): void {
  if (renderer.cells.length === count) return;
  renderer.cells = Array.from({ length: count }, () => {
    const cell = document.createElement('div');
    cell.className = 'ms-board__cell';
    renderer.grid.appendChild(cell);
    return cell;
  });
  renderer.grid.replaceChildren(...renderer.cells);
}

function renderCell(cell: HTMLDivElement, state: GameState['ceils'][number]): void {
  const raised = (state.state === 'cover' || state.state === 'unknown') && !state.opening;
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

  const image = document.createElement('img');
  image.src = source;
  image.alt = '';
  cell.replaceChildren(background, image);
}

function countFlags(state: GameState): number {
  return state.ceils.filter(cell => cell.state === 'flag' || cell.state === 'misflagged').length;
}

export interface RenderOptions {
  readonly timerSeconds: number;
  readonly facePressed?: boolean;
}

export function onImagesLoaded(callback: () => void): () => void {
  callback();
  return () => undefined;
}

export function disposeRenderer(canvas: HTMLCanvasElement): void {
  const renderer = renderers.get(canvas);
  renderer?.root.remove();
  renderers.delete(canvas);
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  viewportWidth: number,
  viewportHeight: number,
  layout: BoardLayout,
  state: GameState,
  options: RenderOptions,
): void {
  ctx.clearRect(0, 0, viewportWidth, viewportHeight);
  ctx.fillStyle = 'rgb(22, 22, 22)';
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  let renderer = renderers.get(ctx.canvas);
  if (!renderer) {
    renderer = createDomRenderer(ctx.canvas);
    renderers.set(ctx.canvas, renderer);
  }

  const scale = layout.cellSize / 16;
  renderer.root.style.left = `${layout.topBar.x}px`;
  renderer.root.style.top = `${layout.topBar.y + 20 * scale}px`;
  renderer.root.style.setProperty('--ms-board-scale', `${scale}`);
  renderer.grid.style.gridTemplateColumns = `repeat(${state.columns}, calc(16px * var(--ms-board-scale)))`;
  renderer.grid.style.gridTemplateRows = `repeat(${state.rows}, calc(16px * var(--ms-board-scale)))`;

  setCounter(renderer.leftCounter, state.mines - countFlags(state));
  setCounter(renderer.rightCounter, Math.max(0, options.timerSeconds));
  renderer.face.classList.toggle('is-pressed', options.facePressed ?? false);
  renderer.faceImage.src =
    state.status === 'died'
      ? dead
      : state.status === 'won'
        ? win
        : options.facePressed
          ? ohh
          : smile;

  ensureCells(renderer, state.ceils.length);
  state.ceils.forEach((cell, index) => renderCell(renderer.cells[index]!, cell));
}
