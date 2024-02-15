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
  let Sorter = benchmarkBestSorter({ topN, totalCount: values.length })
  let sorter = new Sorter<T>(compareFn)
  sorter.addValues(values)
  return sorter.popTopN(topN)
}

/**
 * @description generator version of `sortTopN`
 * @returns iterator (generator) of `topN` elements in descending order.
 */
export function* sortTopNIter<T>(
  compareFn: CompareFn<T>,
  topN: number,
  values: T[],
): Generator<T> {
  let Sorter = benchmarkBestSorter({ topN, totalCount: values.length })
  let sorter = new Sorter<T>(compareFn)
  sorter.addValues(values)
  yield* sorter.popTopNIter(topN)
}

/**
 * @description shortcut of `benchmarkSorters()`
 *
 * @returns the most efficient sorter's class (constructor)
 */
export function benchmarkBestSorter(options: {
  topN: number
  totalCount: number
  /** @description default: max(10, sqrt(totalCount)) */
  sampleCount?: number
}) {
  let { topN } = options
  if (topN <= 3) {
    return TreeSort
  }
  if (topN >= 40) {
    return DAGSort
  }
  let [{ Sorter }] = benchmarkSorters(options)
  return Sorter
}

export type SorterClass = ReturnType<typeof benchmarkBestSorter>

/**
 * @description benchmark against varies sorter.
 *  Use random samples to find out which sorter requires least number of comparisons
 *  to pick `topN` elements from a list of `totalCount` elements.
 *
 * @returns array of {averageCompareCount,Sorter}
 */
export function benchmarkSorters(options: {
  topN: number
  totalCount: number
  /** @description default: max(10, sqrt(totalCount)) */
  sampleCount?: number
}) {
  let { topN, totalCount } = options
  if (topN > totalCount) {
    throw new Error(
      `cannot pick top ${topN} candidates from ${totalCount} elements`,
    )
  }

  let sampleCount = options.sampleCount || max(10, floor(sqrt(totalCount)))

  let samplesList: number[][] = new Array(sampleCount)
  for (let i = 0; i < sampleCount; i++) {
    samplesList[i] = makeSampleList(totalCount)
  }

  let slots = [NativeSort, DAGSort, TreeSort].map(Sorter => {
    benchmarkCompareFn.reset()
    for (let i = 0; i < sampleCount; i++) {
      let sorter = new Sorter(benchmarkCompareFn)
      sorter.addValues(samplesList[i].slice())
      sorter.popTopN(topN)
    }
    return {
      averageCompareCount: benchmarkCompareFn.getCompareCount() / sampleCount,
      Sorter,
    }
  })
  slots.sort((a, b) => a.averageCompareCount - b.averageCompareCount)
  return slots
}

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
