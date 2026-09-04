/**
 * Creates list of all possible permutations of a list of lists.
 * @param {any[][]} list The list to permute over.
 * @returns {any[][]} List of all permutations.
 */
export function createPermutations(list: any[][]): any[][] {
  let output: any[][] = [[]];
  for (const currentSublist of list) {
    const newOutput = [];
    for (const sublistObject of currentSublist) {
      for (const o of output) {
        const newList = o.slice();
        newList.push(sublistObject);
        newOutput.push(newList);
      }
    }
    output = newOutput;
  }
  return output;
}
