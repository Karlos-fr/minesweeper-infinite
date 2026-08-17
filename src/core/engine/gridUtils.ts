// ============================================================================
// Minesweeper Infinite - Utilitaires de grille
// ----------------------------------------------------------------------------
// Ce fichier calcule les voisinages et échantillonne des index. Il ne modifie
// pas directement l'état du jeu.
// ============================================================================
// ----------------------------------------------------------------------------
// Retourne voisin index.
//
// Paramètres :
// - index : valeur fournie au traitement.
// - rows : valeur fournie au traitement.
// - columns : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number[]` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function getNeighborIndexes(index: number, rows: number, columns: number): number[] {
  if (index < 0 || index >= rows * columns) return [];

  // Constante `row` utilisée par la responsabilité de ce module.
  const row = Math.floor(index / columns);
  // Constante `column` utilisée par la responsabilité de ce module.
  const column = index % columns;

  return [
    index - columns - 1,
    index - columns,
    index - columns + 1,
    index - 1,
    index + 1,
    index + columns - 1,
    index + columns,
    index + columns + 1,
  ].filter(
    // ----------------------------------------------------------------------------
    // Exécute le callback associé à filter.
    //
    // Paramètres :
    // - _ : valeur fournie au traitement.
    // - arrayIndex : valeur fournie au traitement.
    //
    // Retour :
    // - valeur de type `boolean` produite par le traitement.
    //
    // Effets de bord :
    // - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
    // ----------------------------------------------------------------------------
    (_, arrayIndex) => {
      if (row === 0 && arrayIndex < 3) return false;
      if (row === rows - 1 && arrayIndex > 4) return false;
      if (column === 0 && [0, 3, 5].includes(arrayIndex)) return false;
      if (column === columns - 1 && [2, 4, 7].includes(arrayIndex)) return false;
      return true;
    },
  );
}

// ----------------------------------------------------------------------------
// Sélectionne aléatoire index.
//
// Paramètres :
// - pool : valeur fournie au traitement.
// - count : valeur fournie au traitement.
//
// Retour :
// - valeur de type `number[]` produite par le traitement.
//
// Effets de bord :
// - peut mettre à jour l'état local, le DOM ou les dépendances appelées.
// ----------------------------------------------------------------------------
export function pickRandomIndexes(pool: readonly number[], count: number): number[] {
  if (count <= 0) return [];
  if (count > pool.length) {
    throw new Error('Cannot sample more items than available');
  }

  // Constante `shuffled` utilisée par la responsabilité de ce module.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Constante `random` utilisée par la responsabilité de ce module.
    const random = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[random]] = [shuffled[random], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
