export function getNeighborIndexes(index: number, rows: number, columns: number): number[] {
  if (index < 0 || index >= rows * columns) return [];

  const row = Math.floor(index / columns);
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
  ].filter((_, arrayIndex) => {
    if (row === 0 && arrayIndex < 3) return false;
    if (row === rows - 1 && arrayIndex > 4) return false;
    if (column === 0 && [0, 3, 5].includes(arrayIndex)) return false;
    if (column === columns - 1 && [2, 4, 7].includes(arrayIndex)) return false;
    return true;
  });
}

export function pickRandomIndexes(pool: readonly number[], count: number): number[] {
  if (count <= 0) return [];
  if (count > pool.length) {
    throw new Error('Cannot sample more items than available');
  }

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const random = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[random]] = [shuffled[random], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
