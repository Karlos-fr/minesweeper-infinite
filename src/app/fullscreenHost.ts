// ============================================================================
// Minesweeper Infinite - Hôte plein écran
// ----------------------------------------------------------------------------
// Ce fichier installe le conteneur plein écran du jeu. La gestion du Canvas
// reste confiée au bootstrap.
// ============================================================================
import { bootstrap, type CanvasHost } from './bootstrap';

export interface FullscreenHost {
  readonly host: CanvasHost;
  readonly dispose: () => void;
}

// ----------------------------------------------------------------------------
// Crée fullscreen host.
//
// Paramètres :
// - root : valeur fournie au traitement.
//
// Retour :
// - valeur de type `FullscreenHost` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function createFullscreenHost(root: HTMLElement): FullscreenHost {
  root.style.margin = '0';
  root.style.width = '100vw';
  root.style.height = '100vh';
  root.style.minWidth = '100vw';
  root.style.minHeight = '100vh';
  root.style.display = 'block';
  root.style.overflow = 'hidden';
  root.style.position = 'relative';

  // Constante `host` utilisée par la responsabilité de ce module.
  const host = bootstrap(root);

  return {
    host,
    // ----------------------------------------------------------------------------
    // Libère le traitement demandé.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    dispose: () => {
      if (host.canvas.parentElement === root) {
        root.removeChild(host.canvas);
      }
      host.dispose?.();
      root.style.position = '';
    },
  };
}
