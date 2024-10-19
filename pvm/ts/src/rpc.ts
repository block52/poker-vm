import { RPCRequest, RPCResponse } from "./types/rpc";

class RPC {
    static async handle(request: RPCRequest): Promise<RPCResponse> {
        switch (request.method) {
            case "sayHello":
                return { result: "Hello from RPC!" };
            default:
                return { error: "Method not found" };
        }
    }
}