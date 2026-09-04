/**
 * Extend object just like JQuery's extend.
 * @param {object} target Target.
 * @param {...object} sources Sources.
 * @returns {object} Merged objects.
 */
export const extend = (target: object, ...sources: object[]): object => {
  sources.forEach((source) => {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (key === '__proto__' || key === 'constructor') {
          continue; // Prevent prototype pollution
        }

        if (source[key] === undefined) {
          continue;
        }

        if (
          typeof target[key] === 'object' && !Array.isArray(target[key]) &&
          typeof source[key] === 'object' && !Array.isArray(source[key])
        ) {
          extend(target[key], source[key]);
        }
        else if (Array.isArray(source[key])) {
          target[key] = source[key].slice();
        }
        else {
          target[key] = source[key];
        }
      }
    }
  });
  return target;
};

/**
 * Return longest string from array of strings.
 * @param {string[]} strings Strings to compare.
 * @returns {string} Longest string in array.
 */
export const getLongestString = (strings: string[]): string => {
  return strings.reduce((prev, current) => current.length > prev.length ? current : prev, '');
};

/**
 * Shuffle array in place using Fisher-Yates algorithm.
 * @param {any[]} array Array to shuffle.
 * @returns {any[]} Same array, shuffled in place.
 */
export const shuffleArray = (array: any[]): any[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
};
