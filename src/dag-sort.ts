import { CompareFn, Sorter } from './utils'

/**
 * @description DAG-based, balanced performance.
 * better than Tree-based and native sort when picking top 10-35 / 100 items
 * */
export class DAGSort<T> extends Sorter<T> {
  groups = new Groups<T>()

  // indices
  orphans = new Set<Node<T>>()
  heads = new Set<Node<T>>()
  tails = new Set<Node<T>>()

  constructor(compareFn: CompareFn<T>) {
    super(compareFn)
  }

  addValues(values: T[]) {
    for (const value of values) {
      const group = this.groups.newGroup()
      const node = new Node(value, group)
      group.nodes.add(node)
      this.orphans.add(node)
      this.heads.add(node)
      this.tails.add(node)
    }
  }

  popTop(): T {
    while (this.groups.size > 1) {
      this.findAndConnect()
    }
    if (this.groups.size == 0) {
      throw new Error('cannot pop from empty graph')
    }
    const group: Group<T> = Array.from(this.groups.groups)[0]
    const head = group.popTop(this)
    this.heads.delete(head)
    return head.value
  }

  findAndConnect() {
    const [node1, node2] = this.findTwoNodesToConnect()
    const result = this.compareFn(node1.value, node2.value)
    // should connect: (from) small -> (to) large
    if (result.small === node1.value) {
      this.connect(node1, node2)
    } else {
      this.connect(node2, node1)
    }
  }

  connect(from: Node<T>, to: Node<T>) {
    this.orphans.delete(from)
    this.orphans.delete(to)
    this.heads.delete(from)
    this.tails.delete(to)
    from.outgoingNodes.add(to)
    to.incomingNodes.add(from)
    this.groups.mergeGroups(from.group, to.group)
  }

  findTwoNodesToConnect(): [Node<T>, Node<T>] {
    if (this.orphans.size >= 2) {
      const orphans = Array.from(this.orphans)
      return [orphans[0], orphans[1]]
    }
    if (this.groups.size >= 2) {
      const [group1, group2] = this.groups.findTwoSmallGroups()
      const head = group1.findHead()
      const tail = group2.findTail()
      return [head, tail]
    }
    throw new Error('failed to findTwoNodesToConnect')
  }
}

class Groups<T> {
  groups = new Set<Group<T>>()

  get size() {
    return this.groups.size
  }

  newGroup() {
    const group = new Group<T>()
    this.groups.add(group)
    return group
  }

  findTwoSmallGroups(): [Group<T>, Group<T>] {
    let group1: Group<T> | undefined
    for (const group of this.groups) {
      if (group.size === 2) {
        if (!group1) {
          group1 = group
          continue
        }
        return [group1, group]
      }
    }
    const groups = Array.from(this.groups).sort((a, b) => a.size - b.size)
    return [groups[0], groups[1]]
  }

  mergeGroups(a: Group<T>, b: Group<T>) {
    if (a === b) {
      return
    }
    let small: Group<T>
    let large: Group<T>
    if (a.size > b.size) {
      large = a
      small = b
    } else {
      small = a
      large = b
    }
    // move all nodes from small group to large group
    for (const node of small.nodes) {
      large.nodes.add(node)
      node.group = large
    }
    this.groups.delete(small)
  }
}

class Group<T> {
  nodes = new Set<Node<T>>()

  get size() {
    return this.nodes.size
  }

  findHead(): Node<T> {
    return filterSetToArray(
      this.nodes,
      node => node.outgoingNodes.size === 0,
    ).sort((a, b) => a.incomingNodes.size - b.incomingNodes.size)[0]
  }

  findTail(): Node<T> {
    return filterSetToArray(
      this.nodes,
      node => node.incomingNodes.size === 0,
    ).sort((a, b) => a.outgoingNodes.size - b.outgoingNodes.size)[0]
  }

  popTop(graph: DAGSort<T>): Node<T> {
    for (;;) {
      const heads = filterSetToArray(
        this.nodes,
        node => node.outgoingNodes.size === 0,
      )
      if (heads.length === 1) {
        const head = heads[0]
        head.group.nodes.delete(head)
        head.incomingNodes.forEach(node => node.outgoingNodes.delete(head))
        return head
      }
      // multi head
      heads.sort((a, b) => a.incomingNodes.size - b.incomingNodes.size)
      let from: Node<T> = heads[0]
      for (let i = 1; i < heads.length; i++) {
        const to: Node<T> = heads[i]
        const result = graph.compareFn(from.value, to.value)
        // should connect: (from) small -> (to) large
        if (result.small === from.value) {
          this.connectTwoHeads(from, to, graph)
        } else {
          this.connectTwoHeads(to, from, graph)
          from = to
        }
      }
    }
  }

  connectTwoHeads(from: Node<T>, to: Node<T>, graph: DAGSort<T>) {
    graph.heads.delete(from)
    from.outgoingNodes.add(to)
    to.incomingNodes.add(from)
  }
}

class Node<T> {
  incomingNodes = new Set<Node<T>>()
  outgoingNodes = new Set<Node<T>>()

  constructor(
    public value: T,
    public group: Group<T>,
  ) {}
}

function filterSetToArray<T>(set: Set<T>, f: (x: T) => boolean): T[] {
  const xs: T[] = []
  set.forEach(x => {
    if (f(x)) {
      xs.push(x)
    }
  })
  return xs
}
