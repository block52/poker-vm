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
    private readonly size: number;
    
    constructor(size: number, defaultValue: T | null) {
        if (size <= 0) {
            throw new Error("Size must be greater than 0");
        }
        
        this.size = size;
        
        // Create first node with null
        this.head = new Node<T>(defaultValue);
        let current = this.head;
        
        // Create remaining nodes and link them
        for (let i = 1; i < size; i++) {
            current.next = new Node<T>(null);
            current = current.next;
        }
        
        // Complete the circle
        current.next = this.head;
    }

    // Find index of next null element starting from current position
    findNextElement(startIndex: number = 0): number | null {
        if (startIndex < 0 || startIndex >= this.size) {
            throw new Error(`Start index ${startIndex} is out of bounds for list of size ${this.size}`);
        }

        // Get to start position
        let current = this.head;
        for (let i = 0; i < startIndex; i++) {
            current = current.next!;
        }

        // Search for null, starting from startIndex
        let currentIndex = startIndex;
        do {
            if (current.data === null) {
                return currentIndex;
            }
            current = current.next!;
            currentIndex = (currentIndex + 1) % this.size;
        } while (currentIndex !== startIndex);

        // If we've gone full circle and found nothing
        return null;
    }

    // Set value at specific index
    set(index: number, value: T | null): void {
        if (index < 0 || index >= this.size) {
            throw new Error(`Index ${index} is out of bounds for list of size ${this.size}`);
        }

        let current = this.head;
        for (let i = 0; i < index; i++) {
            current = current.next!;
        }
        current.data = value;
    }

    // Get value at specific index
    get(index: number): T | null {
        if (index < 0 || index >= this.size) {
            throw new Error(`Index ${index} is out of bounds for list of size ${this.size}`);
        }

        let current = this.head;
        for (let i = 0; i < index; i++) {
            current = current.next!;
        }
        return current.data;
    }

    // Rotate the list by k positions
    rotate(k: number): void {
        if (k === 0 || this.size <= 1) return;

        // Normalize k to be within list size
        k = k % this.size;
        if (k < 0) {
            k += this.size;
        }

        // Perform rotation
        for (let i = 0; i < k; i++) {
            this.head = this.head.next!;
        }
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

    // Get size of the list
    getSize(): number {
        return this.size;
    }

    // Print the list
    print(): void {
        let current = this.head;
        do {
            process.stdout.write((current.data === null ? 'null' : current.data) + " -> ");
            current = current.next!;
        } while (current !== this.head);
        console.log("head");
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