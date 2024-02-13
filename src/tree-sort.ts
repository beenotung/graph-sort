import { CompareFn, Sorter } from './utils'

/**
 * @description Tree-based, optimized for fewer candidates.
 * better than DAG-based sort when picking top 1-5 / 100 items
 */
export class TreeSort<T> extends Sorter<T> {
  topNodes: Node<T>[] = []

  constructor(compareFn: CompareFn<T>) {
    super(compareFn)
  }

  addValues(values: T[]) {
    for (let value of values) {
      let node = new Node(value)
      this.topNodes.push(node)
    }
  }

  popTop(): T {
    for (;;) {
      let topNodes = this.topNodes
      if (topNodes.length == 0) {
        throw new Error('cannot pop from empty graph')
      }
      if (topNodes.length == 1) {
        let node = topNodes.pop()!
        let { smallerNodes, value } = node
        for (let smallerNode of smallerNodes) {
          smallerNode.largerNodes.delete(node)
          if (smallerNode.largerNodes.size == 0) {
            this.topNodes.push(smallerNode)
          }
        }
        return value
      }
      let node1 = topNodes.pop()!
      let node2 = topNodes.pop()!
      let { small, large } = this.compareTwoNodes(node1, node2)
      small.largerNodes.add(large)
      large.smallerNodes.add(small)
      topNodes.push(large)
    }
  }
}

class Node<T> {
  largerNodes = new Set<Node<T>>()
  smallerNodes = new Set<Node<T>>()

  constructor(public value: T) {}
}
