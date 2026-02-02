const NUM_COLS = 2;

/**
 * Row 1: clipart, mockup, clipart, ... ; Row 2: mockup, clipart, mockup, ... ; and so on.
 * Slot (row, col) is clipart when (row + col) % 2 === 0, mockup when (row + col) % 2 === 1.
 * Flat index i: row = floor(i / numCols), col = i % numCols.
 */
function isClipartSlot(flatIndex: number): boolean {
  const row = Math.floor(flatIndex / NUM_COLS);
  const col = flatIndex % NUM_COLS;
  return (row + col) % 2 === 0;
}

/**
 * Build a single list of cell URLs with grid alternation: row 1 = clipart, mockup, clipart... ; row 2 = mockup, clipart, mockup...
 * When mockups are present: total cells = clipartCount + mockupCount; pattern (row+col)%2 assigns clipart vs mockup; distribute if counts don't match.
 * When no mockups: returns clipartUrls unchanged.
 */
export function buildInterleavedCellUrls(
  clipartUrls: string[],
  mockupUrls: string[]
): string[] {
  if (mockupUrls.length === 0) return clipartUrls;
  const totalCells = clipartUrls.length + mockupUrls.length;
  const result: string[] = new Array(totalCells);
  const clipartSlotIndices: number[] = [];
  const mockupSlotIndices: number[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (isClipartSlot(i)) clipartSlotIndices.push(i);
    else mockupSlotIndices.push(i);
  }
  clipartSlotIndices.forEach((idx, j) => {
    result[idx] = clipartUrls[j % clipartUrls.length];
  });
  mockupSlotIndices.forEach((idx, j) => {
    result[idx] = mockupUrls[j % mockupUrls.length];
  });
  return result;
}
