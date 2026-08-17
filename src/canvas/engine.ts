// ============================================================================
// Minesweeper Infinite - Façade du moteur Canvas
// ----------------------------------------------------------------------------
// Ce fichier réexporte les points d'entrée utiles au rendu. Il ne porte aucune
// logique métier supplémentaire.
// ============================================================================
export type MouseButton = 'left' | 'right';

export interface PointerEventLike {
  readonly x: number;
  readonly y: number;
  readonly button?: MouseButton;
}

// ----------------------------------------------------------------------------
// Exécute le traitement normalize pointer.
//
// Paramètres :
// - x : valeur fournie au traitement.
// - y : valeur fournie au traitement.
//
// Retour :
// - valeur de type `{ x: number; y: number; }` produite par le traitement.
//
// Effets de bord :
// - aucun.
// ----------------------------------------------------------------------------
export function normalizePointer(x: number, y: number): { x: number; y: number } {
  return { x: Math.floor(x), y: Math.floor(y) };
}
