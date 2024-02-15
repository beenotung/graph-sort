import { ProgressCli } from '@beenotung/tslib/progress-cli'
import { SorterClass, benchmarkCompareFn, makeSampleList } from '../src/core'
import { NativeSort } from '../src/native-sort'
import { TreeSort } from '../src/tree-sort'
import { DAGSort } from '../src/dag-sort'
import { appendFileSync } from 'fs'

let cli = new ProgressCli()

let profiles = [1, 2, 3, 5, 10, 20, 30, 40, 50, 100].map(topN => ({
  totalCount: 100,
  topN,
}))

type Profile = (typeof profiles)[number]

function measureAlgorithm(profile: Profile, Sorter: SorterClass) {
  let { totalCount, topN } = profile
  benchmarkCompareFn.reset()
  let sorter = new Sorter(benchmarkCompareFn)
  let input = makeSampleList(totalCount)
  let originalInput = input.slice()
  sorter.addValues(input)
  let actualOutput = sorter.popTopN(topN)
  let compareCount = benchmarkCompareFn.getCompareCount()
  if (input.toString() != originalInput.toString()) {
    throw new Error('input updated in-place')
  }
  let expectedOutput = input
    .slice()
    .sort((a, b) => b - a)
    .slice(0, topN)
  if (actualOutput.toString() != expectedOutput.toString()) {
    console.log({ Sorter, actualOutput, expectedOutput })
    throw new Error('output not topN')
  }
  return { compareCount }
}

const MaxErrorRate = 1 / 100

function benchmarkAlgorithm(profile: Profile, Sorter: SorterClass) {
  let { totalCount, topN } = profile

  let acc = 0
  let n = 0

  let startTime = Date.now()
  let endTime = 0
  let compareCount = 0
  let usedTime = 0
  for (;;) {
    acc += measureAlgorithm(profile, Sorter).compareCount
    n++
    endTime = Date.now()

    if (endTime - startTime > 1000) {
      break
    }
  }

  for (;;) {
    let result = measureAlgorithm(profile, Sorter)
    let diff = Math.abs(result.compareCount - acc / n)
    acc += result.compareCount
    n++
    compareCount = acc / n
    endTime = Date.now()
    usedTime = endTime - startTime
    let errorRate = diff / compareCount

    cli.update(
      `[${Sorter.name}] top ${topN}/${totalCount}: n=${n.toLocaleString()}, compareCount=${compareCount.toFixed(0)}, usedTime=${(usedTime / 1000).toFixed(1)}sec, errorRate=${errorRate.toFixed(2)}`,
    )

    if (errorRate > MaxErrorRate) {
      continue
    }

    cli.nextLine()
    return { compareCount, n, usedTime }
  }
}

let logFile = 'benchmark.log'

function log(line: string) {
  appendFileSync(logFile, line + '\n')
}

function reportAlgorithm(Sorter: SorterClass) {
  log(Sorter.name)
  for (let profile of profiles) {
    let { totalCount, topN } = profile
    let { compareCount } = benchmarkAlgorithm(profile, Sorter)
    log(
      `top ${topN.toString().padStart(3, ' ')}/${totalCount}: ${compareCount.toFixed(0)}`,
    )
  }
  log('')
}

reportAlgorithm(NativeSort)
reportAlgorithm(TreeSort)
reportAlgorithm(DAGSort)
