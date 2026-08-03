export interface CanvasHost {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dispose?: () => void;
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
    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || window.innerHeight);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgb(22, 22, 22)';
    ctx.fillRect(0, 0, width, height);
  };

  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(container);
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  return {
    canvas,
    ctx,
    width: canvas.width,
    height: canvas.height,
    dispose: () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    },
  };
}
