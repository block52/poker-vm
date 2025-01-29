export class Node<T> {
    data: T;
    next: Node<T> | null;

    constructor(data: T) {
        this.data = data;
        this.next = null;
    }
}

export class CircularLinkedList<T> {
    private head: Node<T> | null;
    private size: number;
    private readonly maxSize: number;

    constructor(maxSize: number, defaultValue?: T) {
        if (maxSize <= 0) {
            throw new Error("Maximum size must be greater than 0");
        }
        
        this.head = null;
        this.size = 0;
        this.maxSize = maxSize;

        // Initialize with default value if provided
        if (defaultValue !== undefined) {
            for (let i = 0; i < maxSize; i++) {
                this.append(defaultValue);
            }
        }
    }

    next(): Node<T> | null {
        if (!this.head) {
            return null;
        }

        const current = this.head;
        this.head = this.head.next;
        return current;
    }

    // Insert at the end of the list
    append(data: T): void {
        if (this.size >= this.maxSize) {
            throw new Error(`List is full. Maximum size is ${this.maxSize}`);
        }

        const newNode = new Node(data);
        
        if (!this.head) {
            this.head = newNode;
            newNode.next = this.head;
        } else {
            let current = this.head;
            while (current.next !== this.head) {
                current = current.next!;
            }
            current.next = newNode;
            newNode.next = this.head;
        }
        this.size++;
    }

    // Insert at the beginning of the list
    prepend(data: T): void {
        if (this.size >= this.maxSize) {
            throw new Error(`List is full. Maximum size is ${this.maxSize}`);
        }

        const newNode = new Node(data);
        
        if (!this.head) {
            this.head = newNode;
            newNode.next = this.head;
        } else {
            let current = this.head;
            while (current.next !== this.head) {
                current = current.next!;
            }
            newNode.next = this.head;
            this.head = newNode;
            current.next = this.head;
        }
        this.size++;
    }

    // Delete first occurrence of a node with given data
    delete(data: T): boolean {
        if (!this.head) {
            return false;
        }

        if (this.head.data === data) {
            if (this.size === 1) {
                this.head = null;
            } else {
                let current = this.head;
                while (current.next !== this.head) {
                    current = current.next!;
                }
                this.head = this.head.next;
                current.next = this.head;
            }
            this.size--;
            return true;
        }

        let current = this.head;
        while (current.next !== this.head) {
            if (current.next!.data === data) {
                current.next = current.next!.next;
                this.size--;
                return true;
            }
            current = current.next!;
        }
        return false;
    }

    // Print the list
    print(): void {
        if (!this.head) {
            console.log("List is empty");
            return;
        }

        let current = this.head;
        do {
            console.log(current.data);
            current = current.next!;
        } while (current !== this.head);
    }

    // Get the size of the list
    getSize(): number {
        return this.size;
    }

    // Get the maximum size of the list
    getMaxSize(): number {
        return this.maxSize;
    }

    // Check if list is empty
    isEmpty(): boolean {
        return this.size === 0;
    }

    // Check if list is full
    isFull(): boolean {
        return this.size === this.maxSize;
    }
}