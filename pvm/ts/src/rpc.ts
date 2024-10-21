import { ZeroHash } from "ethers";
import { MintCommand, TransferCommand } from "./commands";
import { BlockCommand } from "./commands/blockCommand";
import { MempoolCommand } from "./commands/mempoolCommand";
import {
    READ_METHODS,
    RPCMethods,
    RPCRequest,
    RPCRequestParams,
    RPCResponse,
    WRITE_METHODS
} from "./types/rpc";
import { Transaction } from "./models";
import { getMempoolInstance } from "./core/mempool";
import { IJSONModel } from "./models/interfaces";
import { MeCommand } from "./commands/meCommand";
import { TransactionDTO } from "./types/chain";


export class RPC {
    // get the mempool

    static async handle(request: RPCRequest): Promise<RPCResponse<any>> {
        if (!request) {
            throw new Error("Null request");
        }

        if (!request.method) {
            return {
                id: request.id,
                error: "Missing method",
                result: null
            };
        }

        const method: RPCMethods = request.method as RPCMethods;
        if (!Object.values(RPCMethods).includes(method)) {
            return {
                id: request.id,
                error: "Method not found",
                result: null
            };
        }

        if (READ_METHODS.includes(method)) {
            return this.handleReadMethod(method, request);
        } else {
            return this.handleWriteMethod(method, request);
        }
    }

    static async handleReadMethod(
        method: RPCMethods,
        request: RPCRequest
    ): Promise<RPCResponse<any>> {
        const id = request.id;
        let result: IJSONModel;
        switch (method) {
            case RPCMethods.GET_BLOCK: {
                let command = new BlockCommand(undefined);

                if (request.params) {
                    const index = BigInt(request.params[0] as string);
                    command = new BlockCommand(index);
                    result = await command.execute();

                }
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_LAST_BLOCK: {
                const command = new BlockCommand(undefined);
                result = await command.execute();

                break;
            }

            case RPCMethods.GET_CLIENT: {
                const command = new MeCommand();
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_NODES: {
                // Get the nodes
                result = {
                    toJson: () => {
                        return [];
                    }
                }
                break;
            }

            case RPCMethods.GET_MEMPOOL: {
                const command = new MempoolCommand();
                result = await command.execute();
                break;
            }
            default:
                return {
                    id,
                    error: "Method not found",
                    result: null
                };
        }

        return {
            id,
            result: result.toJson()
        };
    }
    static async handleWriteMethod(
        method: RPCMethods,
        request: RPCRequest
    ): Promise<RPCResponse<string | null>> {
        const id = request.id;

        let transaction: Transaction;
        switch (method) {
            // Write methods
            case RPCMethods.MINT: {
                if (request.params?.length !== 3) {
                    return {
                        id,
                        error: "Invalid params",
                        result: null
                    };
                }
                const [to, amount, transactionId] =
                    request.params as RPCRequestParams[RPCMethods.MINT];
                const privateKey = ZeroHash;

                const command = new MintCommand(
                    to,
                    amount,
                    transactionId,
                    privateKey
                );

                transaction = await command.execute();

                break;
            }

            case RPCMethods.TRANSFER: {
                if (request.params?.length !== 3) {
                    return {
                        id,
                        error: "Invalid params",
                        result: null
                    };
                }
                const [from, to, amount] =
                    request.params as RPCRequestParams[RPCMethods.TRANSFER];
                const privateKey = ZeroHash;
                const command = new TransferCommand(
                    from,
                    to,
                    amount,
                    privateKey
                );
                transaction = await command.execute();

                break;
            }

            default:
                return {
                    id,
                    error: "Method not found",
                    result: null
                };
        }
        if (!transaction) {
            throw new Error("No transaction created");
        }
        // push to mempool
        const mempool = getMempoolInstance();
        mempool.add(transaction);

        return {
            id,
            result: transaction.getId().toString()
        };
    }
}
