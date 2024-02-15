import { DAGSort } from './dag-sort'
import { NativeSort } from './native-sort'
import { TreeSort } from './tree-sort'
import { CompareFn } from './utils'

let { max, floor, sqrt } = Math

/**
 * @description use the most efficient sorter from `benchmarkBestSorter()`
 *  to pick `topN` elements from a list of `totalCount` elements.
 *
 * @param compareFn comparison function (a,b) => {small, large}
 * @param topN number of top n largest elements to return
 * @param values array of elements that is *not updated* in-place
 *
 * @returns list of `topN` elements in descending order.
 */
export function sortTopN<T>(
  compareFn: CompareFn<T>,
  topN: number,
  values: T[],
): T[] {
  let size = values.length
  if (topN > size) {
    throw new Error('given values has less than n elements')
  }
  let Sorter = benchmarkBestSorter({ topN, totalCount: values.length })
  let sorter = new Sorter<T>(compareFn)
  sorter.addValues(values)
  return sorter.popTopN(topN)
}

/**
 * @description benchmark against varies sorter.
 *  Use random samples to find out which sorter requires least number of comparisons
 *  to pick `topN` elements from a list of `totalCount` elements.
 *
 * @returns the most efficient sorter's class (constructor)
 */
export function benchmarkBestSorter(options: {
  topN: number
  totalCount: number
  /** @description default: max(10, sqrt(totalCount)) */
  sampleCount?: number
}) {
  let sampleCount =
    options.sampleCount || max(10, floor(sqrt(options.totalCount)))
  if (options.topN >= 40) {
    return DAGSort
  }
  let samplesList: number[][] = new Array(sampleCount)
  for (let i = 0; i < sampleCount; i++) {
    samplesList[i] = makeSampleList(options.totalCount)
  }

  let slots = [NativeSort, DAGSort, TreeSort].map(Class => {
    benchmarkCompareFn.reset()
    for (let i = 0; i < sampleCount; i++) {
      let sorter = new Class(benchmarkCompareFn)
      sorter.addValues(samplesList[i].slice())
      sorter.popTopN(options.topN)
    }
    return {
      compareCount: benchmarkCompareFn.getCompareCount() / sampleCount,
      Class,
    }
  })
  slots.sort((a, b) => a.compareCount - b.compareCount)
  let bestSlot = slots[0]

  return bestSlot.Class
}

export type SorterClass = ReturnType<typeof benchmarkBestSorter>

/** @description for benchmarking */
export let benchmarkCompareFn = (function () {
  let benchmarkCompareCount = 0
  let compare: CompareFn<number> = (a, b) => {
    benchmarkCompareCount++
    return a <= b ? { small: a, large: b } : { small: b, large: a }
  }
  return Object.assign(compare, {
    getCompareCount() {
      return benchmarkCompareCount
    },
    reset() {
      benchmarkCompareCount = 0
    },
  })
})()

/** @description for benchmarking */
export function makeSampleList(totalCount: number): number[] {
  let list = new Array(totalCount)
  let used: Record<number, number> = {}
  for (let i = 0; i < totalCount; i++) {
    for (;;) {
      let r = floor(Math.random() * totalCount) + 1
      if (r in used) continue
      list[i] = r
      used[r] = i
      break
    }
  }
  return list
}
