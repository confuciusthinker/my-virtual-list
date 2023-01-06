export enum CompareResult {
    eq = 1,
    lt,
    gt
  }
  
  export function binarySearch<T, VT>(
    list: T[],
    value: VT,
    compareFn: (current: T, value: VT) => CompareResult
  ) {
    let start = 0;
    let end = list.length - 1;
    let tempIndex = 0;
  
    while (start <= end) {
      tempIndex = Math.floor((start + end) / 2);
      const midValue = list[tempIndex];
  
      const compareRes: CompareResult = compareFn(midValue, value);
      if (compareRes === CompareResult.eq) {
        return tempIndex;
      }
      if (compareRes === CompareResult.lt) {
        start = tempIndex + 1;
      }
      if (compareRes === CompareResult.gt) {
        end = tempIndex - 1;
      }
    }
  
    return tempIndex;
  }
  