import type { GameState } from '../core/types';
import { BoardLayout, type BoardRect } from './layout';
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

interface LoadedImages {
  [key: string]: HTMLImageElement;
}

type ImageReadyListener = () => void;

const imageSources = {
  dead,
  smile,
  win,
  ohh,
  empty,
  open1,
  open2,
  open3,
  open4,
  open5,
  open6,
  open7,
  open8,
  flag,
  mine,
  mineDeath,
  misFlagged,
  question,
  digit0,
  digit1,
  digit2,
  digit3,
  digit4,
  digit5,
  digit6,
  digit7,
  digit8,
  digit9,
  digitMinus,
};

const imageEntries = Object.entries(imageSources);
const totalImageCount = imageEntries.length;
const imageReadyListeners = new Set<ImageReadyListener>();
let imagesAreReady = false;
let imageLoadAttemptCount = 0;
const imageLoadAttempts = new Set<string>();
const ORIGINAL_TILE_SIZE = 16;

function markImageLoaded(key: string): void {
  if (imageLoadAttempts.has(key)) {
    return;
  }
  imageLoadAttempts.add(key);
  imageLoadAttemptCount += 1;
  notifyImageReady();
}

function notifyImageReady(): void {
  if (imagesAreReady) return;

  if (imageLoadAttemptCount >= totalImageCount) {
    imagesAreReady = true;
    imageReadyListeners.forEach(listener => listener());
    imageReadyListeners.clear();
  }
}

function loadImages(): LoadedImages {
  const loaded: LoadedImages = {};
  imageEntries.forEach(([key, source]) => {
    const image = new Image();
    image.onload = (): void => {
      markImageLoaded(key);
    };
    image.onerror = (): void => {
      markImageLoaded(key);
    };
    image.src = source;
    loaded[key] = image;
    if (image.complete) {
      markImageLoaded(key);
    }
  });
  return loaded;
}

const images = loadImages();

export function onImagesLoaded(callback: ImageReadyListener): () => void {
  if (imagesAreReady) {
    callback();
    return () => {
      // no-op
    };
  }

  imageReadyListeners.add(callback);
  return () => {
    imageReadyListeners.delete(callback);
  };
}

notifyImageReady();

function drawCellSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
): void {
  if (!image.complete) return;
  const targetX = Math.floor(x);
  const targetY = Math.floor(y);
  const targetWidth = Math.max(1, Math.ceil(size));
  const targetHeight = Math.max(1, Math.ceil(size));
  ctx.drawImage(image, targetX, targetY, targetWidth, targetHeight);
}

function drawCellBackground(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  raised: boolean,
): void {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const cellSize = Math.max(1, Math.floor(size));
  const scale = Math.max(1, Math.round(cellSize / ORIGINAL_TILE_SIZE));
  const raisedBorder = Math.max(1, Math.round(2 * scale));
  const openBorder = Math.max(1, Math.round(1 * scale));

  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(cellX, cellY, cellSize, cellSize);

  if (raised) {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(cellX, cellY, cellSize, raisedBorder);
    ctx.fillRect(cellX, cellY, raisedBorder, cellSize);
    ctx.fillStyle = '#808080';
    ctx.fillRect(cellX, cellY + cellSize - raisedBorder, cellSize, raisedBorder);
    ctx.fillRect(cellX + cellSize - raisedBorder, cellY, raisedBorder, cellSize);
    return;
  }

  ctx.fillStyle = '#808080';
  ctx.fillRect(cellX, cellY, openBorder, cellSize);
  ctx.fillRect(cellX, cellY, cellSize, openBorder);
}

function formatCounter(value: number): string {
  const clamped = Math.max(-999, Math.min(999, value));
  if (clamped < 0) {
    const unsigned = Math.abs(clamped);
    const body = unsigned < 10 ? `00${unsigned}` : unsigned < 100 ? `0${unsigned}` : `${unsigned}`;
    return `-${body.slice(-2)}`;
  }

  const padded = clamped < 10 ? `00${clamped}` : clamped < 100 ? `0${clamped}` : `${clamped}`;
  return padded.slice(-3);
}

function numberToDigits(value: number): string[] {
  return formatCounter(value).split('');
}

function getDigitImage(char: string): HTMLImageElement {
  switch (char) {
    case '-':
      return images.digitMinus;
    case '0':
      return images.digit0;
    case '1':
      return images.digit1;
    case '2':
      return images.digit2;
    case '3':
      return images.digit3;
    case '4':
      return images.digit4;
    case '5':
      return images.digit5;
    case '6':
      return images.digit6;
    case '7':
      return images.digit7;
    case '8':
      return images.digit8;
    case '9':
      return images.digit9;
    default:
      return images.digit0;
  }
}

function drawCounter(
  ctx: CanvasRenderingContext2D,
  value: number,
  rect: BoardRect,
): void {
  const chars = numberToDigits(value);
  const sampleImg = getDigitImage('0');
  const ratio = sampleImg?.width ? sampleImg.width / Math.max(1, sampleImg.height) : 13 / 23;
  const scale = Math.max(1, Math.round(rect.width / 40));
  const spacing = 0;
  const digitHeight = Math.max(1, rect.height - scale);
  const digitWidth = Math.max(1, Math.round(digitHeight * ratio));
  const requiredWidth = chars.length * digitWidth + (chars.length - 1) * spacing;
  const availableWidth = Math.max(1, rect.width - scale);
  if (requiredWidth > availableWidth) return;

  const txStart = rect.x + rect.width - scale - requiredWidth;
  const ty = Math.max(0, Math.round(rect.y + (rect.height - digitHeight) / 2));

  chars.forEach((char, index) => {
    const img = getDigitImage(char);
    if (!img.complete) return;
    const tx = txStart + index * (digitWidth + spacing);
    ctx.drawImage(img, tx, ty, digitWidth, digitHeight);
  });
}

function drawCounterFrame(
  ctx: CanvasRenderingContext2D,
  rect: BoardRect,
): void {
  const x = Math.floor(rect.x);
  const y = Math.floor(rect.y);
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));
  const scale = Math.max(1, Math.round(w / 40));

  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + w - scale, y, scale, h);
  ctx.fillRect(x, y + h - scale, w, scale);
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  status: GameState['status'],
  x: number,
  y: number,
  size: number,
  pressing: boolean,
): void {
  const isDead = status === 'died';
  const isWon = status === 'won';
  const src = isDead ? images.dead : isWon ? images.win : pressing ? images.ohh : images.smile;
  const scale = Math.max(1, Math.round(size / 24));
  const border = Math.max(1, Math.round(2 * scale));
  const pressedBorder = Math.max(1, Math.round(1 * scale));
  const faceShift = Math.max(1, Math.round(1 * scale));
  const iconSide = Math.max(1, Math.round(size * (17 / 24)));
  const iconOffset = Math.round((size - iconSide) / 2) + (pressing ? Math.max(0, 1) : 0);
  const faceX = x + faceShift;

  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(faceX, y, size, size);

  ctx.fillStyle = '#808080';
  ctx.fillRect(faceX, y, faceShift, size);
  ctx.fillRect(faceX, y, size, faceShift);

  ctx.fillStyle = '#808080';
  if (pressing) {
    const pressed = pressedBorder;
    ctx.fillRect(faceX, y, size, pressed);
    ctx.fillRect(faceX, y + size - pressed, size, pressed);
    ctx.fillRect(faceX, y, pressed, size);
    ctx.fillRect(faceX + size - pressed, y, pressed, size);
  } else {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(faceX, y, size, border);
    ctx.fillRect(faceX, y, border, size);
    ctx.fillStyle = '#808080';
    ctx.fillRect(faceX, y + size - border, size, border);
    ctx.fillRect(faceX + size - border, y, border, size);
  }

  if (src.complete) {
    ctx.drawImage(src, faceX + iconOffset, y + iconOffset, iconSide, iconSide);
  }
}

function getOpenSprite(minesAround: number): HTMLImageElement {
  switch (minesAround) {
    case 1:
      return images.open1;
    case 2:
      return images.open2;
    case 3:
      return images.open3;
    case 4:
      return images.open4;
    case 5:
      return images.open5;
    case 6:
      return images.open6;
    case 7:
      return images.open7;
    case 8:
      return images.open8;
    default:
      return images.empty;
  }
}

function drawCeilContent(
  ctx: CanvasRenderingContext2D,
  state: GameState['ceils'][number],
  x: number,
  y: number,
  size: number,
): void {
  const { state: ceilState, minesAround } = state;
  const raised = ['cover', 'unknown'].includes(ceilState) && !state.opening;
  drawCellBackground(ctx, x, y, size, raised);

  switch (ceilState) {
    case 'open':
      drawCellSprite(ctx, getOpenSprite(minesAround), x, y, size);
      break;
    case 'flag':
      drawCellSprite(ctx, images.flag, x, y, size);
      break;
    case 'unknown':
      drawCellSprite(ctx, images.question, x, y, size);
      break;
    case 'mine':
      drawCellSprite(ctx, images.mine, x, y, size);
      break;
    case 'die':
      drawCellSprite(ctx, images.mineDeath, x, y, size);
      break;
    case 'misflagged':
      drawCellSprite(ctx, images.misFlagged, x, y, size);
      break;
    default:
      if (raised) {
        // keep style only
      }
      break;
  }
}

function countFlags(state: GameState): number {
  return state.ceils.filter(ceil => ceil.state === 'flag' || ceil.state === 'misflagged').length;
}

export interface RenderOptions {
  readonly timerSeconds: number;
  readonly facePressed?: boolean;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  viewportWidth: number,
  viewportHeight: number,
  layout: BoardLayout,
  state: GameState,
  options: RenderOptions,
): void {
  const width = viewportWidth;
  const height = viewportHeight;
  const { board, topBar } = layout;
  const scale = Math.max(1, Math.round(layout.cellSize / ORIGINAL_TILE_SIZE));
  const menuHeight = Math.max(1, Math.round(20 * scale));
  const scoreHeight = Math.max(1, Math.round(34 * scale));
  const contentPadding = Math.max(1, Math.round(5 * scale));
  const scoreGap = Math.max(1, Math.round(5 * scale));
  const scoreBorder = Math.max(1, Math.round(2 * scale));
  const innerContentBorder = Math.max(1, Math.round(3 * scale));
  const cellOffsetX = contentPadding + innerContentBorder;
  const cellOffsetY = contentPadding + scoreGap + innerContentBorder;

  const scoreX = Math.floor(board.x + contentPadding);
  const scoreY = Math.floor(topBar.y + menuHeight + contentPadding);
  const scoreW = Math.floor(board.width + innerContentBorder * 2);
  const scoreH = scoreHeight;

  const boardOuterX = Math.floor(board.x);
  const boardOuterY = Math.floor(board.y);
  const boardOuterW = Math.floor(board.width);
  const boardOuterH = Math.floor(board.height);
  const boardX0 = Math.floor(boardOuterX + contentPadding);
  const boardY0 = Math.floor(boardOuterY + scoreGap + contentPadding);
  const boardW = boardOuterW + innerContentBorder * 2;
  const boardH = boardOuterH + innerContentBorder * 2;

  const topBarX = Math.floor(topBar.x);
  const topBarY = Math.floor(topBar.y);
  const topBarW = Math.floor(topBar.width);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgb(35, 35, 35)';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;

  const remainMines = state.mines - countFlags(state);

  ctx.fillStyle = '#ece9d8';
  ctx.fillRect(topBarX, topBarY, topBarW, menuHeight);
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(scoreX, scoreY, scoreW, contentPadding);

  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(scoreX, scoreY, scoreW, scoreH);
  ctx.fillStyle = '#808080';
  ctx.fillRect(scoreX, scoreY, scoreW, scoreBorder);
  ctx.fillRect(scoreX, scoreY, scoreBorder, scoreH);
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(scoreX + scoreW - scoreBorder, scoreY, scoreBorder, scoreH);
  ctx.fillRect(scoreX, scoreY + scoreH - scoreBorder, scoreW, scoreBorder);

  const counterWidth = Math.max(1, Math.round(40 * scale));
  const counterHeight = Math.max(1, Math.round(24 * scale));
  const counterTop = Math.floor(scoreY + (scoreH - counterHeight) / 2);
  const leftCounter = {
    x: Math.floor(scoreX + Math.round(4 * scale)),
    y: counterTop,
    width: counterWidth,
    height: counterHeight,
  };
  const rightCounter = {
    x: Math.floor(scoreX + scoreW - Math.round(7 * scale) - counterWidth),
    y: counterTop,
    width: counterWidth,
    height: counterHeight,
  };
  const faceX = Math.floor(scoreX + (scoreW - layout.face.size) / 2);
  const faceY = Math.floor(scoreY + (scoreH - layout.face.size) / 2);

  drawCounterFrame(ctx, leftCounter);
  drawCounterFrame(ctx, rightCounter);
  drawCounter(ctx, remainMines, leftCounter);
  drawCounter(ctx, options.timerSeconds, rightCounter);
  drawFace(ctx, state.status, faceX, faceY, layout.face.size, options.facePressed ?? false);

  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(boardX0, boardY0, boardW, boardH);
  ctx.fillStyle = '#808080';
  ctx.fillRect(boardX0, boardY0, boardW, innerContentBorder);
  ctx.fillRect(boardX0, boardY0, innerContentBorder, boardH);
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(boardX0 + boardW - innerContentBorder, boardY0, innerContentBorder, boardH);
  ctx.fillRect(boardX0, boardY0 + boardH - innerContentBorder, boardW, innerContentBorder);

  for (let row = 0; row < state.rows; row += 1) {
    for (let column = 0; column < state.columns; column += 1) {
      const index = row * state.columns + column;
      const ceil = state.ceils[index];
      const x = board.x + cellOffsetX + column * layout.cellSize;
      const y = board.y + cellOffsetY + row * layout.cellSize;
      if (!ceil) continue;
      drawCeilContent(ctx, ceil, x, y, layout.cellSize);
    }
  }
}
