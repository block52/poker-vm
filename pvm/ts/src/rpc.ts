import { MintCommand } from "./commands";
import { BlockCommand } from "./commands/blockCommand";
import { ICommand } from "./commands/interfaces";
import { MempoolCommand } from "./commands/mempoolCommand";
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
            result: null,
        };

        // let command: ICommand;

        if (!request.method) {
            response.error = "Method not found";
            return response;
        }

        const method: RPCMethods = request.method as RPCMethods;

        switch (method) {
            case RPCMethods.GET_BLOCK: {
                let command = new BlockCommand(undefined);
                
                if (request.params) {
                    const index = BigInt(request.params[0] as string);
                    command = new BlockCommand(index);
                }

                response.result = await command.execute();
                break;
            }

            case RPCMethods.GET_LAST_BLOCK: {
                const command = new BlockCommand(undefined);
                response.result = await command.execute();
                break;
            }

            case RPCMethods.GET_MEMPOOL: {
                const command = new MempoolCommand();
                response.result = await command.execute();
                break;
            }

            // Write methods
            case RPCMethods.MINT:
                if (request.params?.length !== 2) {
                    response.error = "Invalid params";
                }
                const [to, amount] = request.params as RPCRequestParams[RPCMethods.MINT];
                const privateKey = "FAKE_PRIVATE_KEY";
                    
                const command = new MintCommand(
                    to,
                    amount,
                    request.data,
                    privateKey
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
