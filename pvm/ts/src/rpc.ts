import { ZeroHash } from "ethers";
import { MintCommand, TransferCommand } from "./commands";
import { BlockCommand } from "./commands/blockCommand";
import { MempoolCommand } from "./commands/mempoolCommand";
import {
    CONTROL_METHODS,
    READ_METHODS,
    WRITE_METHODS,
    RPCMethods,
    RPCRequest,
    RPCRequestParams,
    RPCResponse
} from "./types/rpc";
import { Transaction } from "./models";
import { getMempoolInstance } from "./core/mempool";
import { IJSONModel } from "./models/interfaces";
import { MeCommand } from "./commands/meCommand";
import { getServerInstance } from "./core/server";
import { CreateContractSchemaCommand } from "./commands/contractSchema/createContractSchemaCommand";
import { GetContractSchemaCommand } from "./commands/contractSchema/getContractSchemaCommand";

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
        } else if (WRITE_METHODS.includes(method)) {
            return this.handleWriteMethod(method, request);
        } else if (CONTROL_METHODS.includes(method)) {
            return this.handleControlMethod(method, request);
        } else {
            return {
                id: request.id,
                error: "Method not found",
                result: null
            };
        }
    }

    static async handleControlMethod(
        method: RPCMethods,
        request: RPCRequest
    ): Promise<RPCResponse<any>> {
        let result: string | null = null;
        switch (method) {
            case RPCMethods.START: {
                const server = getServerInstance();
                await server.start();
                break;
            }
            case RPCMethods.STOP: {
                const server = getServerInstance();
                await server.stop();
                break;
            }
            case RPCMethods.SHUTDOWN: {
                const [username, password] = request.params as RPCRequestParams[RPCMethods.SHUTDOWN];
                if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
                    process.exit(0);
                }
                break;
            }
            case RPCMethods.CREATE_CONTRACT_SCHEMA: {
                const [category, name, schema] = request.params as RPCRequestParams[RPCMethods.CREATE_CONTRACT_SCHEMA];
                const command = new CreateContractSchemaCommand(category, name, schema);
                result = await command.execute();
                break;
            }
        }
        return {
            id: request.id,
            result: result
        };
    }
    static async handleReadMethod(
        method: RPCMethods,
        request: RPCRequest
    ): Promise<RPCResponse<any>> {
        const id = request.id;
        let result: IJSONModel | null = null;
        switch (method) {
            case RPCMethods.GET_BLOCK: {
                let command = new BlockCommand(undefined);

                if (request.params) {
                    const index = BigInt(request.params[0] as string);
                    command = new BlockCommand(index);
                }
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_CONTRACT_SCHEMA: {
                const [hash] = request.params as RPCRequestParams[RPCMethods.GET_CONTRACT_SCHEMA];
                const command = new GetContractSchemaCommand(hash);
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
                };
                break;
            }

            case RPCMethods.GET_MEMPOOL: {
                const command = new MempoolCommand();
                result = await command.execute();
                break;
            }

            case RPCMethods.MINED_BLOCK_HASH: {
                console.log(`Received mined block hash: ${request.params[0]}`);
                result = {
                    toJson: () => {
                        return null;
                    }
                };
                break;
            }

            default:
                return {
                    id,
                    error: "Method not found",
                    result: null
                };
        }

        if (result === null) {
            return {
                id,
                error: "Operation failed",
                result: null
            };
        }

        return {
            id,
            result: result.toJson()
        };
    }

    // These always return a transaction hash
    static async handleWriteMethod(
        method: RPCMethods,
        request: RPCRequest
    ): Promise<RPCResponse<string | null>> {
        const id = request.id;
        const privateKey = process.env.VALIDATOR_KEY || ZeroHash;

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
