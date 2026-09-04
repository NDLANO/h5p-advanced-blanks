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
