import { expect } from 'chai'
import { SinonSpy, spy } from 'sinon'
import { CompareFn, GraphSort } from './graph-sort'

describe('graph-sort TestSuit', () => {
  let compareFn: CompareFn<number> = (a, b) =>
    a < b ? { small: a, large: b } : { large: a, small: b }

  let compareFnSpy: SinonSpy
  let graph: GraphSort<number>
  beforeEach(() => {
    compareFnSpy = spy(compareFn)
    graph = new GraphSort(compareFnSpy)
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
    graph.addValues(values)
    let actualTopNValues = graph.popTopN(topN)
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
    graph.addValues(values)
    let actualTopNValues = graph.popTopN(topN)
    expect(actualTopNValues).deep.equals([8, 7, 6, 5, 4])
    expect(compareFnSpy.callCount).equals(N - 1)
  })
  it('should sort numbers in reversed sorted case', function () {
    let values = [1, 2, 3, 4, 5, 6, 7, 8].reverse()
    let N = values.length
    let topN = 5
    graph.addValues(values)
    let actualTopNValues = graph.popTopN(topN)
    expect(actualTopNValues).deep.equals([8, 7, 6, 5, 4])
    expect(compareFnSpy.callCount).equals((N - 1) * 2)
  })

  it('should sort large number of numbers', function () {
    let N = 200
    let values: number[] = []
    for (let i = 0; i < N; i++) {
      values.push(Math.random())
    }
    test(values)
  })

  it('should sort', function () {})
})
