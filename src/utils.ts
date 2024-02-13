export type CompareResult<T> = { small: T; large: T }

export type CompareFn<T> = (a: T, b: T) => CompareResult<T>

export abstract class Sorter<T> {
  constructor(public compareFn: CompareFn<T>) {}

  abstract addValues(values: T[]): void

  abstract popTop(): T

  popTopN(n: number): T[] {
    const topNValues: T[] = []
    for (let i = 0; i < n; i++) {
      topNValues.push(this.popTop())
    }
    return topNValues
  }

  compareTwoNodes<Node extends { value: T }>(a: Node, b: Node) {
    let result = this.compareFn(a.value, b.value)
    return result.small == a.value
      ? { small: a, large: b }
      : { small: b, large: a }
  }
}
