let serverInstance: Server | null = null;

export function getServerInstance(): Server {
    if (!serverInstance) {
        serverInstance = new Server();
    }
    return serverInstance;
}

export class Server {
    private _started: boolean = false;
    private readonly _port: number = 8545;
    private readonly _version: string = "1.0.3";

    constructor() {
        console.log(`PVM Server initializing on port ${this._port}...`);
    }

    public async me(): Promise<{ name: string; version: string; url: string }> {
        const url = process.env.PUBLIC_URL || `http://localhost:${this._port}`;
        return {
            name: "pvm-typescript",
            version: this._version,
            url
        };
    }

    get started(): boolean {
        return this._started;
    }

    public async start() {
        this._started = true;
        console.log(`Server starting on port ${this._port}...`);
    }

    public async stop() {
        this._started = false;
        console.log("Server stopping...");
    }

    public async bootstrap(_args: string[] = []) {
        this._started = true;
        console.log(`Server started on port ${this._port}`);
    }
}
