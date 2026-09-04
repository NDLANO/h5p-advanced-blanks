/**
 * Return longest string from array of strings.
 * @param {string[]} strings Strings to compare.
 * @returns {string} Longest string in array.
 */
export function getLongestString(strings: string[]): string {
  return strings.reduce((prev, current) => current.length > prev.length ? current : prev, '');
}

/**
 * Shuffle array in place using Fisher-Yates algorithm.
 * @param {any[]} array Array to shuffle.
 * @returns {any[]} Same array, shuffled in place.
 */
export function shuffleArray(array: any[]): any[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}
