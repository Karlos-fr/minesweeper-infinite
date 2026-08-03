export interface CanvasHost {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export function bootstrap(root: HTMLElement): CanvasHost {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const container = root;
  container.style.margin = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.display = 'block';

  canvas.id = 'minesweeper-canvas';
  canvas.setAttribute('aria-label', 'Minesweeper canvas');
  canvas.tabIndex = 0;
  container.appendChild(canvas);

  const resizeCanvas = (): void => {
    const { innerWidth, innerHeight } = window;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgb(22, 22, 22)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  return {
    canvas,
    ctx,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
