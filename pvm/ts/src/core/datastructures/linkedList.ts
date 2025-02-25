export class Node<T> {
    data: T | null;
    next: Node<T> | null;

    constructor(data: T | null) {
        this.data = data;
        this.next = null;
    }
}

export class FixedCircularList<T> {
    private head: Node<T | null>;
    private readonly maxSize: number;
    private size: number;

    constructor(maxSize: number, defaultValue: T | null) {
        if (maxSize <= 0) {
            throw new Error("Size must be greater than 0");
        }

        this.maxSize = maxSize;

        // Create first node with null
        this.head = new Node<T>(defaultValue);
        this.size = 0;

        if (defaultValue !== null) {
            this.size = 1;
        }

        let current = this.head;

        // Create remaining nodes and link them
        for (let i = 1; i <= maxSize; i++) {
            current.next = new Node<T>(null);
            current = current.next;
        }

        // Complete the circle
        current.next = this.head;
    }

    // Find index of next null element starting from current position
    next(startIndex: number = 1): number | null {
        if (startIndex < 1 || startIndex > this.maxSize) {
            throw new Error(`Start index ${startIndex} is out of bounds for list of size ${this.maxSize}`);
        }

        // Get to start position
        let current = this.head;
        for (let i = 1; i < startIndex; i++) {
            current = current.next!;
        }

        // Search for null, starting from startIndex
        let currentIndex = startIndex;
        do {
            if (current.data === null) {
                return currentIndex;
            }
            current = current.next!;
            currentIndex = (currentIndex + 1) % this.maxSize;
        } while (currentIndex !== startIndex);

        // If we've gone full circle and found nothing
        return null;
    }

    // Set value at specific index
    set(index: number, value: T | null): void {
        if (index < 1 || index >= this.maxSize) {
            throw new Error(`Index ${index} is out of bounds for list of size ${this.maxSize}`);
        }

        let current = this.head;
        for (let i = 1; i < index; i++) {
            current = current.next!;
        }

        this.size++;
        current.data = value;
    }

    // Set value at next null element clockwise
    add(value: T): void {
        const index = this.next();
        if (index === null) {
            throw new Error("No null element found in list");
        }
        this.set(index, value);
    }

    // Get value at specific index
    get(index: number): T | null {
        if (index < 1 || index >= this.maxSize) {
            throw new Error(`Index ${index} is out of bounds for list of size ${this.maxSize}`);
        }

        let current = this.head;
        for (let i = 1; i < index; i++) {
            current = current.next!;
        }
        return current.data;
    }

    // Get value at next null element clockwise
    getNext(): T | null {
        const index = this.next();
        if (index === null) {
            throw new Error("No null element found in list");
        }
        return this.get(index);
    }

    getNextIndex(): number {
        return this.next()!;
    }

    // Rotate the list by k positions
    rotate(k: number): void {
        if (k === 0 || this.maxSize <= 1) return;

        // Normalize k to be within list size
        k = k % this.maxSize;
        if (k < 0) {
            k += this.maxSize;
        }

        // Perform rotation
        for (let i = 0; i < k; i++) {
            this.head = this.head.next!;
        }
    }

    // // Delete value at specific index
    // deleteAt(index: number): boolean {
    //     if (this.head.data === data) {
    //         if (this.size === 1) {
    //             this.head = null;
    //         } else {
    //             let current = this.head;
    //             while (current.next !== this.head) {
    //                 current = current.next!;
    //             }
    //             this.head = this.head.next;
    //             current.next = this.head;
    //         }
    //         this.size--;
    //         return true;
    //     }

    //     let current = this.head;
    //     while (current.next !== this.head) {
    //         if (current.next!.data === data) {
    //             current.next = current.next!.next;
    //             this.size--;
    //             return true;
    //         }
    //         current = current.next!;
    //     }
    //     return false;
    // }
    
    delete(data: T): boolean {
        if (this.head.data === data) {
            if (this.size === 1) {
                // this.head = null;
            } else {
                let current = this.head;
                while (current.next !== this.head) {
                    current = current.next!;
                }
                // this.head = this.head.next;
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

    // Get all values as array starting from current head
    toArray(): (T | null)[] {
        const result: (T | null)[] = [];
        let current = this.head;

        do {
            result.push(current.data);
            current = current.next!;
        } while (current !== this.head);

        return result;
    }

    getMaxSize(): number {
        return this.maxSize;
    }

    // Get size of the list
    getSize(): number {
        return this.size;
    }

    // Check if list is empty
    isEmpty(): boolean {
        return this.size === 0;
    }

    // Check if list is full
    isFull(): boolean {
        return this.size === this.maxSize;
    }

    // Print the list
    print(): void {
        let current = this.head;
        do {
            process.stdout.write((current.data === null ? "null" : current.data) + " -> ");
            current = current.next!;
        } while (current !== this.head);
        console.log("head");
    }
}
