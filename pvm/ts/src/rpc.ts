import { ZeroHash } from "ethers";
import { MintCommand, TransferCommand } from "./commands";
import { BlockCommand } from "./commands/blockCommand";
import { ICommand } from "./commands/interfaces";
import { MempoolCommand } from "./commands/mempoolCommand";
import { RPCMethods, RPCRequest, RPCRequestParams, RPCResponse } from "./types/rpc";
import { MeCommand } from "./commands/meCommand";
import { IJSONModel } from "./models/interfaces";

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
                    const result: IJSONModel = await command.execute();
                    response.result = result.toJson();
                }

                response.result = await command.execute();
                break;
            }

            case RPCMethods.GET_LAST_BLOCK: {
                const command = new BlockCommand(undefined);
                const result: IJSONModel = await command.execute();
                response.result = result.toJson();
                break;
            }

            case RPCMethods.GET_CLIENT: {
                const command = new MeCommand();
                response.result = command.execute();
                break;
            }

            case RPCMethods.GET_MEMPOOL: {
                const command = new MempoolCommand();
                response.result = await command.execute();
                break;
            }

            case RPCMethods.GET_NODES: {
                // Get the nodes
                const nodes = [];
                break;
            }

            // Write methods
            case RPCMethods.MINT: {
                if (request.params?.length !== 3) {
                    response.error = "Invalid params";
                }
                const [to, amount, transactionId] = request.params as RPCRequestParams[RPCMethods.MINT];
                const privateKey = ZeroHash;
                    
                const command = new MintCommand(
                    to,
                    amount,
                    transactionId,
                    privateKey
                );

                const transaction = await command.execute();
                // return tx

                // push to mempool

                // result is the tx.hash
                response.result = transaction.getId();
                break;
            }

            case RPCMethods.TRANSFER: {
                if (request.params?.length !== 3) {
                    response.error = "Invalid params";
                }
                const [from, to, amount] = request.params as RPCRequestParams[RPCMethods.TRANSFER];
                const privateKey = ZeroHash;
                const command = new TransferCommand(from, to, amount, privateKey);
                const transaction = await command.execute();
                response.result = transaction.getId();
                break;  
            }
   
            default:
                response.error = "Method not found";
        }

        // response.result = await command.execute();
        return response;
    }
}
