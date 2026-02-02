/**
 * Build a single list of cell URLs that shows all cliparts and all mockups, each exactly once.
 * When mockups are present: alternate mockup, clipart until one list runs out, then append the remainder of the longer list.
 * When no mockups: returns clipartUrls unchanged.
 */
export function buildInterleavedCellUrls(
  clipartUrls: string[],
  mockupUrls: string[]
): string[] {
  if (mockupUrls.length === 0) return clipartUrls;
  const result: string[] = [];
  let i = 0;
  while (i < mockupUrls.length && i < clipartUrls.length) {
    result.push(mockupUrls[i]);
    result.push(clipartUrls[i]);
    i++;
  }
  if (i < mockupUrls.length) result.push(...mockupUrls.slice(i));
  if (i < clipartUrls.length) result.push(...clipartUrls.slice(i));
  return result;
}
