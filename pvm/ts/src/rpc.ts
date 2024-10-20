import { Mint } from "./commands";
import { BlockCommand } from "./commands/blockCommand";
import { ICommand } from "./commands/interfaces";
import { RPCRequest, RPCResponse } from "./types/rpc";

export class RPC {

    // get the mempool

    static async handle(request: RPCRequest): Promise<RPCResponse> {
        const id = request.id;

        const response: RPCResponse = {
            id,
        };

        // let command: ICommand;

        if (!request.method) {
            response.error = "Method not found";
            return response;
        }

        const method = request.method;

        switch (request.method) {
            case "get_block":
                if (!request.params) {
                    // Get the last block

                    return response;
                }

                const index = request.params[0];
                const blockCommand = new BlockCommand();
                break;
            case "get_last_block":
                const command = new BlockCommand();
                break;
            default:
                response.error = "Method not found";
        }

        // Write methods
        switch (request.method) {
            case "mint":
                if (!request.params || request.params.length !== 3) {
                    response.error = "Invalid params";
                }

                const to: string = request.params[0];
                const command = new Mint(request.params[0], params[1], params[2]);

                // return tx

                // push to mmepool

                // result is the tx.hash

                break;
            case "transfer":
                response.result = "Hello!";
                break;
            default:
                response.error = "Method not found";
        }

        // response.result = await command.execute();
        return response;
    }
}