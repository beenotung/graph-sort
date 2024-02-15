import { expect } from 'chai'
import { SinonSpy, spy } from 'sinon'
import { CompareFn, sortTopN } from '../src'

describe('graph-sort TestSuit', () => {
  let compareFn: CompareFn<number> = (a, b) =>
    a < b ? { small: a, large: b } : { large: a, small: b }

  let compareFnSpy: SinonSpy
  beforeEach(() => {
    compareFnSpy = spy(compareFn)
  })

  function test(values: number[]) {
    let N = values.length
    let topN = 5
    let expectedTopNValues = values
      .slice()
      .sort((a, b) => {
        let res = compareFn(a, b)
        return a === b ? 0 : res.small === a ? -1 : 1
      })
      .reverse()
      .slice(0, topN)
    let actualTopNValues = sortTopN(compareFnSpy, topN, values)
    expect(actualTopNValues).deep.equals(expectedTopNValues)
    expect(compareFnSpy.callCount).greaterThan(N - 2)
    expect(compareFnSpy.callCount).lessThan(N * (N - 1))
  }

  it(`should sort numbers in good case`, () => {
    let values = [1, 3, 2, 5, 4, 6, 8, 7]
    test(values)
  })
  it(`should sort numbers in reversed good case`, () => {
    let values = [1, 3, 2, 5, 4, 6, 8, 7]
    values.reverse()
    test(values)
  })

  it('should sort numbers in sorted case', function () {
    let values = [1, 2, 3, 4, 5, 6, 7, 8]
    let N = values.length
    let topN = 5
    let actualTopNValues = sortTopN(compareFnSpy, topN, values)
    expect(actualTopNValues).deep.equals([8, 7, 6, 5, 4])
    expect(compareFnSpy.callCount).greaterThanOrEqual(N - 1)
  })
  it('should sort numbers in reversed sorted case', function () {
    let values = [1, 2, 3, 4, 5, 6, 7, 8].reverse()
    let N = values.length
    let topN = 5
    let actualTopNValues = sortTopN(compareFnSpy, topN, values)
    expect(actualTopNValues).deep.equals([8, 7, 6, 5, 4])
    expect(compareFnSpy.callCount).greaterThanOrEqual(N - 1)
  })

  it('should sort large number of numbers', function () {
    let N = 200
    let values: number[] = []
    for (let i = 0; i < N; i++) {
      values.push(Math.random())
    }
    test(values)
  })

  it('should not has error when the compareFn is not consistent', function () {
    let N = 2000
    let values: number[] = []
    for (let i = 0; i < N; i++) {
      values.push(Math.random() * 1000)
    }
    let compareFn: CompareFn<number> = (a, b) => {
      return Math.random() < 0.5
        ? { small: a, large: b }
        : { large: a, small: b }
    }
    compareFnSpy = spy(compareFn)
    let actualTopNValues = sortTopN(compareFnSpy, N, values)
    expect(actualTopNValues).length(N)
    expect(actualTopNValues).not.deep.equals(values)
    expect(new Set(actualTopNValues)).deep.equals(new Set(values))
    expect(compareFnSpy.callCount).greaterThan(N - 2)
    expect(compareFnSpy.callCount).lessThan(N * (N - 1))
  })
})
