// ============================================================================
// Minesweeper Infinite - Enregistrement hors ligne
// ----------------------------------------------------------------------------
// Ce fichier enregistre le service worker dans les contextes autorisés. Il ne
// définit pas sa stratégie de cache.
// ============================================================================
// ----------------------------------------------------------------------------
// Enregistre service worker.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Constante `canRegister` utilisée par la responsabilité de ce module.
  const canRegister =
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (!canRegister) {
    return;
  }

  window.addEventListener(
    'load',
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à add event listener.
    //
    // Effets de bord :
    // - aucun.
    // ----------------------------------------------------------------------------
    () => {
      navigator.serviceWorker.register('/sw.js').catch(
        // ----------------------------------------------------------------------------
        // Exécute le callback associé à catch.
        //
        // Paramètres :
        // - error : valeur fournie au traitement.
        //
        // Effets de bord :
        // - aucun.
        // ----------------------------------------------------------------------------
        (error: unknown) => {
          console.warn('Service worker registration failed', error);
        },
      );
    },
  );
}
