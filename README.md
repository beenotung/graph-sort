# graph-sort

An efficient **sorting algorithm** designed for **selecting the top N items** from a list with **minimal comparisons**, **without mapping the items to absolute numeric values**.

[![npm Package Version](https://img.shields.io/npm/v/graph-sort.svg?maxAge=3600)](https://www.npmjs.com/package/graph-sort)

## Features

- **Minimized Comparisons**: Ideal when comparisons are costly or manual, as this library aim to reduce the number of comparisons.

- **Relative comparison**: The items can be relatively compared (pairwise) without mapping to an absolute numeric value.

- **Dynamic Algorithm Selection**: Automatically chooses the best sorting algorithm from available implementations based on the scenario (explained in [how-it-works](#how-it-works) and [benchmarking](#benchmarking) sections).

- **Non-Destructive**: The original list of values remains unchanged.

## Use Case

This package is particularly suitable for scenarios where:

- Comparisons between elements are expensive, such as requiring manual input or complex calculations.

- The elements cannot be directly assigned absolute values, necessitating pairwise comparisons.

Examples include ranking personnel candidates (for hiring or dating), non-price sensitive products, or preferences like colors or flavors.

## Installation

```bash
npm install graph-sort
```

You can also install this package with yarn, pnpm or slnpm.

## Usage Example

More usage examples see [example.ts](./test/example.ts), [graph-sort.spec.ts](./test/graph-sort.spec.ts) and [benchmark.ts](./test/benchmark.ts)

```typescript
import { CompareResult, sortTopN } from 'graph-sort'

// example dating profile
type Profile = {
  major: string
  minor: string | null
  yearOfEntry: number
  height: number | null
  weight: number | null
  district: string
  university: string
}

// user-generated data
type CompareRecord = {
  chosen: Profile
  not_chosen: Profile
}

function getCandidates() {
  try {
    let topN = 3
    let profiles: Profile[] = loadProfiles()
    let topNCandidates: Profile[] = sortTopN(compareProfile, topN, profiles)
    return {
      type: 'matched',
      topNCandidates,
    }
  } catch (error) {
    if (error instanceof NotCompared) {
      let { a, b } = error
      return {
        type: 'compare',
        profiles: [a, b],
      }
    }
    return {
      type: 'error',
      message: String(error),
    }
  }
}

function compareProfile(a: Profile, b: Profile): CompareResult<Profile> {
  let record: CompareRecord | null = findCompareRecord(a, b)
  if (!record) {
    // ask user to perform comparison
    throw new NotCompared(a, b)
  }
  return {
    small: record.not_chosen,
    large: record.chosen,
  }
}

class NotCompared extends Error {
  constructor(
    public a: Profile,
    public b: Profile,
  ) {
    super('not compared')
  }
}

// load from database
function loadProfiles(): Profile[]

// load from database
function findCompareRecord(a: Profile, b: Profile): CompareRecord | null
```

## Typescript Signature

**Main types**:

```typescript
type CompareResult<T> = { small: T; large: T }

type CompareFn<T> = (a: T, b: T) => CompareResult<T>

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
function sortTopN<T>(compareFn: CompareFn<T>, topN: number, values: T[]): T[]

/**
 * @description generator version of `sortTopN`
 * @returns iterator (generator) of `topN` elements in descending order.
 */
export function sortTopNIter<T>(
  compareFn: CompareFn<T>,
  topN: number,
  values: T[],
): Generator<T>

/**
 * @description benchmark against varies sorter.
 *  Use random samples to find out which sorter requires least number of comparisons
 *  to pick `topN` elements from a list of `totalCount` elements.
 *
 * @returns the most efficient sorter's class (constructor)
 */
function benchmarkBestSorter(options: {
  topN: number
  totalCount: number
  /** @description default: max(10, sqrt(totalCount)) */
  sampleCount?: number
}): typeof DAGSort | typeof NativeSort | typeof TreeSort

type SorterClass = ReturnType<typeof benchmarkBestSorter>

/** @description for benchmarking */
let benchmarkCompareFn: CompareFn<number> & {
  getCompareCount(): number
  reset(): void
}
```

<details>
<summary>Internal types (lower level but feel free to build on-top of them)</summary>

```typescript
export abstract class Sorter<T> {
  compareFn: CompareFn<T>

  constructor(compareFn: CompareFn<T>)

  abstract addValues(values: T[]): void

  abstract popTop(): T

  popTopN(n: number): T[]

  popTopNIter(n: number): Generator<T>

  compareTwoNodes<Node extends { value: T }>(
    a: Node,
    b: Node,
  ): CompareResult<Node>
}
```

```typescript
export class DAGSort<T> extends Sorter<T> {
  groups: Groups<T>
  orphans: Set<Node<T>>
  heads: Set<Node<T>>
  tails: Set<Node<T>>
  constructor(compareFn: CompareFn<T>)
  findAndConnect(): void
  connect(from: Node<T>, to: Node<T>): void
  findTwoNodesToConnect(): [Node<T>, Node<T>]
}
class Groups<T> {
  groups: Set<Group<T>>
  get size(): number
  newGroup(): Group<T>
  findTwoSmallGroups(): [Group<T>, Group<T>]
  mergeGroups(a: Group<T>, b: Group<T>): void
}
class Group<T> {
  nodes: Set<Node<T>>
  get size(): number
  findHead(): Node<T>
  findTail(): Node<T>
  popTop(graph: DAGSort<T>): Node<T>
  connectTwoHeads(from: Node<T>, to: Node<T>, graph: DAGSort<T>): void
}
class Node<T> {
  value: T
  group: Group<T>
  incomingNodes: Set<Node<T>>
  outgoingNodes: Set<Node<T>>
  constructor(value: T, group: Group<T>)
}
```

```typescript
export class TreeSort<T> extends Sorter<T> {
  topNodes: Node<T>[]
}
class Node<T> {
  value: T
  largerNodes: Set<Node<T>>
  smallerNodes: Set<Node<T>>
  constructor(value: T)
}
```

```typescript
export class NativeSort<T> extends Sorter<T> {
  protected values: T[]
  protected sorted: boolean
}
```

</details>

## How it works

This package mainly consists of 3 `Sorter` classes and a helper function `sortTopN()`.

Graph-based Sorter: **DAGSort**, **TreeSort**, and
Array-based Sorter: **NativeSort**

The graph based algorithms use directed acyclic graph (DAG) to represent the ordering of given items;
the array based algorithm leverage the built-in sort method from Array which tends to be quicksort in most cases.

The helper function `sortTopN(compareFn,topN,values)` will pick the sorter that require least number of comparison to pick `topN` elements from the given `values` by benchmarking against random samples.

The design assumes the comparison between two items is expensive (e.g. requiring manual input).

Moreover, this design assumes the items in list cannot be mapped to absolute values, hence each the items must be compared two-by-two.

## Benchmarking

`graph-sort` includes a benchmarking function `benchmarkBestSorter({topN,totalCount})` that tests various sorter classes (`DAGSort`, `TreeSort`, and `NativeSort`) against random samples to determine which performs the least number of comparisons for the provided scenario and returns the most efficient sorter class.

Each sorter has its own advantages depending on the number of top items needed:

- `TreeSort`: Optimized for selecting very few top items (approximately 1-5 out of 100).

- `DAGSort`: Offers balanced performance, particularly for selecting a moderate number of top items (approximately 10-35 out of 100).

- `NativeSort`: Utilizes the built-in Array sorting method, and is optimized for selecting a larger number of top items (approximately 40-100 out of 100).

## Experimental Benchmark

The benchmark [source code](./test/benchmark.ts) and [raw data](./benchmark.log) used to assess the performance and effectiveness of the sorting algorithms are available in the git repository.

Total number of items: 100

Top N: 1, 2, 3, 5, 10, 20, 30, 40, 50, 100

<details>
<summary> (click to see details)

| Picking top N | Best Algorithm |
| ------------- | -------------- |
| 1 to 5        | TreeSort       |
| 10 to 30      | DAGSort        |
| 40 to 100     | NativeSort     |

</summary>

| Algorithm  | top N    | number of comparison |
| ---------- | -------- | -------------------- |
| TreeSort   | 1        | 99                   |
| TreeSort   | 2        | 148                  |
| TreeSort   | 3        | 182                  |
| TreeSort   | 5        | 248                  |
| DAGSort    | 1        | 303                  |
| DAGSort    | 2        | 307                  |
| DAGSort    | 3        | 311                  |
| DAGSort    | 5        | 319                  |
| DAGSort    | 10       | 341                  |
| DAGSort    | 20       | 403                  |
| TreeSort   | 10       | 408                  |
| DAGSort    | 30       | 477                  |
| NativeSort | 1 to 100 | 534                  |
| DAGSort    | 40       | 559                  |
| DAGSort    | 50       | 638                  |
| TreeSort   | 20       | 702                  |
| DAGSort    | 100      | 910                  |
| TreeSort   | 30       | 963                  |
| TreeSort   | 40       | 1192                 |
| TreeSort   | 50       | 1389                 |
| TreeSort   | 100      | 1849                 |

</details>

## Complexity

The complexity of `graph-sort` varies depending on the chosen sorting algorithm for a given task, which is determined dynamically by `benchmarkBestSorter` based on the number of items and the number of top elements to select.

The Best Case: O(N-1)

The Average Case\*: O(N \* log(N))

The Worst Case\*: O(N \* N)

\*: the complexity of average case and worst case are taking reference from quicksort, the actual complexity of graph-sort depends on the number of top N to be picked from the given array. The complexity formulates are yet to be confirmed.

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
