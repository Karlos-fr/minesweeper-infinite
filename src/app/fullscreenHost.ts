import { bootstrap, type CanvasHost } from './bootstrap';

export interface FullscreenHost {
  readonly host: CanvasHost;
  readonly dispose: () => void;
}

export function createFullscreenHost(root: HTMLElement): FullscreenHost {
  root.style.margin = '0';
  root.style.width = '100vw';
  root.style.height = '100vh';
  root.style.minWidth = '100vw';
  root.style.minHeight = '100vh';
  root.style.display = 'block';
  root.style.overflow = 'hidden';
  root.style.position = 'relative';

  const host = bootstrap(root);

  return {
    host,
    dispose: () => {
      if (host.canvas.parentElement === root) {
        root.removeChild(host.canvas);
      }
      host.dispose?.();
      root.style.position = '';
    },
  };
}
