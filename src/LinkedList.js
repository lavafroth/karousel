class LinkedList {
    constructor() {
        this.firstNode = null;
        this.lastNode = null;
        this.length = 0;
    }

    insertBefore(node, nextNode) {
        this.insert(node, nextNode.prev, nextNode);
    }

    insertAfter(node, prevNode) {
        this.insert(node, prevNode, prevNode.next);
    }

    insertStart(node) {
        this.insert(node, null, this.firstNode);
    }

    insertEnd(node) {
        this.insert(node, this.lastNode, null);
    }

    insert(node, prevNode, nextNode) {
        node.next = nextNode;
        node.prev = prevNode;
        if (nextNode !== null) {
            assert(nextNode.prev === prevNode);
            nextNode.prev = node;
        }
        if (prevNode !== null) {
            assert(prevNode.next === nextNode);
            prevNode.next = node;
        }
        if (this.firstNode === nextNode) {
            this.firstNode = node;
        }
        if (this.lastNode === prevNode) {
            this.lastNode = node;
        }
        this.length++;
    }

    remove(node) {
        const prevNode = node.prev;
        const nextNode = node.next;
        if (prevNode !== null) {
            prevNode.next = nextNode;
        }
        if (nextNode !== null) {
            nextNode.prev = prevNode;
        }
        if (this.firstNode === node) {
            this.firstNode = nextNode;
        }
        if (this.lastNode === node) {
            this.lastNode = prevNode;
        }
        this.length--;
        node.reset();
    }

    swap(node0, node1) {
        assert(node0.next === node1 && node1.prev === node0);
        const prevNode = node0.prev;
        const nextNode = node1.next;

        if (prevNode !== null) {
            prevNode.next = node1;
        }
        node1.next = node0;
        node0.next = nextNode;

        if (nextNode !== null) {
            nextNode.prev = node0;
        }
        node0.prev = node1;
        node1.prev = prevNode;

        if (this.firstNode === node0) {
            this.firstNode = node1;
        }
        if (this.lastNode === node1) {
            this.lastNode = node0;
        }
    }

    moveBack(node) {
        if (node.prev !== null) {
            assert(node !== this.firstNode);
            this.swap(node.prev, node);
        }
    }

    moveForward(node) {
        if (node.next !== null) {
            assert(node !== this.lastNode);
            this.swap(node, node.next);
        }
    }

    *iterator() {
        for (let node = this.firstNode; node !== null; node = node.next) {
            yield node;
        }
    }
}

class LinkedListNode {
    constructor(item) {
        this.item = item;
        this.reset();
    }

    reset() {
        this.prev = null;
        this.next = null;
    }
}
