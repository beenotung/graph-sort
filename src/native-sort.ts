import { CompareFn, Sorter } from './utils'

/**
 * @description sort with built-in method from Array, optimized for more candidates.
 * better than DAG-based sort when picking top 40-100 / 100 items
 */
export class NativeSort<T> extends Sorter<T> {
  protected values: T[] = []
  protected sorted = false

  constructor(compareFn: CompareFn<T>) {
    super(compareFn)
  }

  addValues(values: T[]): void {
    this.values.push(...values)
    this.sorted = false
  }

  popTop(): T {
    if (this.values.length == 0) {
      throw new Error('cannot pop from empty graph')
    }
    if (!this.sorted) {
      this.values.sort((a, b) => {
        let result = this.compareFn(a, b)
        return result.small == a ? -1 : 1
      })
      this.sorted = true
    }
    return this.values.pop()!
  }
}
