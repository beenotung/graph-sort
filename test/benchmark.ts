import { GraphSort } from '../src/graph-sort'

function randomList(n: number) {
  let list = new Array(n)
  let dict: Record<number, number> = {}
  for (let i = 0; i < n; i++) {
    for (;;) {
      let r = Math.floor(Math.random() * n) + 1
      if (r in dict) continue
      list[i] = r
      dict[r] = i
      break
    }
  }
  return list
}

interface Sorter<T> {
  compare_count: number
  pop(): T
}

type SortAlgorithm<T> = (xs: T[]) => Sorter<T>

function measureAlgorithm(algorithm: SortAlgorithm<number>) {
  let n = 100
  let top = 30
  let input = randomList(n)
  let sorter = algorithm(input.slice())
  let output = new Array(n)
  for (let i = 0; i < top; i++) {
    output[i] = sorter.pop()
  }
  if (
    output.slice(0, top).toString() !=
    input
      .slice()
      .sort((a, b) => a - b)
      .reverse()
      .slice(0, top)
      .toString()
  ) {
    console.log({ input, output })
    throw new Error('not sorted')
  }
  return { input, output, sorter }
}

function benchmarkAlgorithm(algorithm: SortAlgorithm<number>) {
  let alpha = 0.9
  let beta = 1 - alpha
  let res = measureAlgorithm(algorithm)
  let compare_count = res.sorter.compare_count
  for (let i = 0; ; i++) {
    res = measureAlgorithm(algorithm)
    compare_count = compare_count * alpha + res.sorter.compare_count * beta
    console.log(
      `i: ${i.toLocaleString()}, compare_count: ${compare_count.toLocaleString()}`,
    )
  }
}

// compare_count
// top any/100: 533 - 534
let nativeSort: SortAlgorithm<number> = (xs: number[]): Sorter<number> => {
  let res: Sorter<number> = {
    compare_count: 0,
    pop() {
      if (xs.length > 0) return xs.pop()!
      throw new Error('empty')
    },
  }
  xs.sort((a, b) => {
    res.compare_count++
    return a - b
  })
  return res
}

// compare_count
// top 100/100: 905 - 924
// top  50/100: 625 - 638
// top  40/100: 551 - 562
// top  30/100: 472 - 486
// top  20/100: 399 - 414
// top  10/100: 327 - 350
// top   5/100: 322 - 330
// top   3/100: 304 - 313
// top   1/100: 288 - 314
let graphSort: SortAlgorithm<number> = (xs: number[]): Sorter<number> => {
  let res: Sorter<number> = {
    compare_count: 0,
    pop() {
      return sort.popTop()
    },
  }
  let sort = new GraphSort<number>((a, b) => {
    res.compare_count++
    return a < b ? { small: a, large: b } : { small: b, large: a }
  })
  sort.addValues(xs)
  return res
}

// benchmarkAlgorithm(nativeSort)
benchmarkAlgorithm(graphSort)
