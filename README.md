# graph-sort

DAG-based sorting algorithm minimizing the number of comparison required to find top N items from a list without absolute value.

[![npm Package Version](https://img.shields.io/npm/v/graph-sort.svg?maxAge=3600)](https://www.npmjs.com/package/graph-sort)

## How it works

This algorithm used directed acyclic graph (DAG) to represent the ordering of items in a given list.

This algorithm assumes the comparison between two items is expensive (e.g. requiring manual input).

Moreover, this algorithm assumes the items in list cannot be mapped to absolute values, hence each the items must be compared two-by-two.

## Use Case

When comparing personnel candidates, non-price sensitive products, colors or flavor.

## Benchmark

The source code of experiment is available in [test/benchmark.ts](./test/benchmark.ts)

Total number of items: 100

| Algorithm  | top N    | number of comparison |
| ---------- | -------- | -------------------- |
| GraphSort  | 1        | 288 - 314            |
| GraphSort  | 3        | 304 - 313            |
| GraphSort  | 5        | 322 - 330            |
| GraphSort  | 10       | 327 - 350            |
| GraphSort  | 20       | 399 - 414            |
| GraphSort  | 30       | 472 - 486            |
| Array.sort | 1 to 100 | 533 - 534            |
| GraphSort  | 40       | 551 - 562            |
| GraphSort  | 50       | 625 - 638            |
| GraphSort  | 100      | 905 - 924            |

## Complexity

The Best Case: O(N-1)

The Worst Case: TBC

## License

[BSD-2-Clause](./LICENSE) (Free Open Source Software)
