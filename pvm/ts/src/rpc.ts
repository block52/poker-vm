import { MintCommand } from "./commands";
import { BlockCommand } from "./commands/blockCommand";
import { ICommand } from "./commands/interfaces";
import { RPCMethods, RPCRequest, RPCRequestParams, RPCResponse } from "./types/rpc";

export class RPC {
    // get the mempool

    static async handle(request: RPCRequest): Promise<RPCResponse> {

        if (!request) {
            throw new Error("Null request");
        }

        const id = request.id;

        const response: RPCResponse = {
            id,
            result: "",
        };

        // let command: ICommand;

        if (!request.method) {
            response.error = "Method not found";
            return response;
        }

        const method: RPCMethods = request.method as RPCMethods;

        switch (method) {
            case RPCMethods.GET_BLOCK: {
                if (!request.params) {
                    // Get the last block
                    return response;
                }

                const index = request.params[0];
                const blockCommand = new BlockCommand();
                break;
            }

            case RPCMethods.GET_LAST_BLOCK: {
                const command = new BlockCommand();
                break;
            }

            case RPCMethods.GET_MEMPOOL: {
                // Get the mempool
                break;
            }

            // Write methods
            case RPCMethods.MINT:
                if (request.params?.length !== 2) {
                    response.error = "Invalid params";
                }
                const [to, amount] = request.params as RPCRequestParams[RPCMethods.MINT];
                    
                const command = new MintCommand(
                    to,
                    amount,
                    request.data
                );

                const transaction = await command.execute();
                // return tx

                // push to mmepool

                // result is the tx.hash
                response.result = transaction.getId();
                break;
            case RPCMethods.TRANSFER:
                response.result = "Hello!";
                break;
            default:
                response.error = "Method not found";
        }

        // response.result = await command.execute();
        return response;
    }
}
