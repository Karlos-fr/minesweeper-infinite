// ============================================================================
// Minesweeper Infinite - Création de l'hôte Canvas
// ----------------------------------------------------------------------------
// Ce fichier prépare le Canvas et son contexte de rendu. Il ne construit ni le
// moteur ni le menu.
// ============================================================================
export interface CanvasHost {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dispose?: () => void;
}

// ----------------------------------------------------------------------------
// Exécute le traitement bootstrap.
//
// Paramètres :
// - root : valeur fournie au traitement.
//
// Retour :
// - valeur de type `CanvasHost` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function bootstrap(root: HTMLElement): CanvasHost {
  // Constante `canvas` utilisée par la responsabilité de ce module.
  const canvas = document.createElement('canvas');
  // Constante `ctx` utilisée par la responsabilité de ce module.
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Constante `container` utilisée par la responsabilité de ce module.
  const container = root;
  container.style.margin = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.display = 'block';

  canvas.id = 'minesweeper-canvas';
  canvas.setAttribute('aria-label', 'Minesweeper canvas');
  canvas.tabIndex = 0;
  container.appendChild(canvas);

  // ----------------------------------------------------------------------------
  // Exécute le traitement resize canvas.
  //
  // Effets de bord :
  // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
  // ----------------------------------------------------------------------------
  const resizeCanvas = (): void => {
    // Constante `width` utilisée par la responsabilité de ce module.
    const width = Math.max(1, container.clientWidth || window.innerWidth);
    // Constante `height` utilisée par la responsabilité de ce module.
    const height = Math.max(1, container.clientHeight || window.innerHeight);
    // Constante `dpr` utilisée par la responsabilité de ce module.
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

  // Constante `observer` utilisée par la responsabilité de ce module.
  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(container);
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  return {
    canvas,
    ctx,
    width: canvas.width,
    height: canvas.height,
    // ----------------------------------------------------------------------------
    // Libère le traitement demandé.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    dispose: () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    },
  };
}
