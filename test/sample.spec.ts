import { expect } from 'chai'
import { DAGSort, NativeSort, TreeSort, benchmarkSorters } from '../src'
import { arrayToObject } from '@beenotung/tslib/array'

describe('benchmarkSorters()', () => {
  it('should run against all sorter classes', () => {
    let slots = benchmarkSorters({
      topN: 1,
      totalCount: 43,
    })
    expect(slots).to.be.lengthOf(3)
  })
  it('should take at least 10 samples', () => {
    let slots = benchmarkSorters({
      topN: 1,
      totalCount: 43,
    })
    expect(slots[0].sampleCount).to.equals(10)
    expect(slots[1].sampleCount).to.equals(10)
    expect(slots[2].sampleCount).to.equals(10)
  })
  it('should take at most sqrt(totalCount) samples', () => {
    let slots = benchmarkSorters({
      topN: 1,
      totalCount: 144,
    })
    expect(slots[1].sampleCount).to.equals(12)
    expect(slots[1].sampleCount).to.equals(12)
    expect(slots[2].sampleCount).to.equals(12)
  })
  it('should take exact number of samples if specified', () => {
    let slots = benchmarkSorters({
      topN: 1,
      totalCount: 144,
      sampleCount: 50,
    })
    expect(slots[1].sampleCount).to.equals(50)
    expect(slots[1].sampleCount).to.equals(50)
    expect(slots[2].sampleCount).to.equals(50)
  })
  it('should take more samples when not timeout', () => {
    let slots = benchmarkSorters({
      topN: 1,
      totalCount: 144,
      minTimeout: 10,
    })
    expect(slots[1].sampleCount).to.be.greaterThan(12)
    expect(slots[1].sampleCount).to.be.greaterThan(12)
    expect(slots[2].sampleCount).to.be.greaterThan(12)
  })
  it('should take less samples when timeout', () => {
    let slots = benchmarkSorters({
      topN: 1,
      totalCount: 144,
      sampleCount: 1000,
      maxTimeout: 1,
    })
    expect(slots[1].sampleCount).to.be.lessThan(1000)
    expect(slots[1].sampleCount).to.be.lessThan(1000)
    expect(slots[2].sampleCount).to.be.lessThan(1000)
  })
  it('should be stable', () => {
    let countsDict: Record<string, number[]> = {}
    let sample = 100
    for (let i = 0; i < sample; i++) {
      let slots = benchmarkSorters({
        topN: 5,
        totalCount: 43,
      })
      for (let slot of slots) {
        let name = slot.Sorter.name
        let counts = countsDict[name] || (countsDict[name] = [])
        counts.push(slot.averageCompareCount)
        let min = Math.min(...counts)
        let max = Math.max(...counts)
        let range = max - min
        let rate = range / max
        // try {
        expect(rate).to.be.lessThanOrEqual(0.5)
        // } catch (error) {
        //   console.log({ i, min, max, range, rate })
        //   throw error
        // }
      }
    }
  })
})
