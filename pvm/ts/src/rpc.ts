import { ZeroHash } from "ethers";

import { RPCMethods, RPCRequest, RPCRequestParams, RPCResponse } from "@bitcoinbrisbane/block52";

import { AccountCommand } from "./commands/accountCommand";
import { BlockCommand } from "./commands/blockCommand";
import { CreateContractSchemaCommand } from "./commands/contractSchema/createContractSchemaCommand";
import { GetContractSchemaCommand } from "./commands/contractSchema/getContractSchemaCommand";
import { CreateAccountCommand } from "./commands/createAccountCommand";
import { GetBlocksCommand } from "./commands/getBlocksCommand";
import { GetNodesCommand } from "./commands/getNodesCommand";
import { GetTransactionsCommand } from "./commands/getTransactionsCommand";
import { ISignedResponse } from "./commands/interfaces";
import { MeCommand } from "./commands/meCommand";
import { MempoolCommand } from "./commands/mempoolCommand";
import { MineCommand } from "./commands/mineCommand";
import { MintCommand } from "./commands/mintCommand";
import { ReceiveMinedBlockHashCommand } from "./commands/receiveMinedBlockHashCommand";
import { ShutdownCommand } from "./commands/shutdownCommand";
import { StartServerCommand } from "./commands/startServerCommand";
import { StopServerCommand } from "./commands/stopServerCommand";
import { TransferCommand } from "./commands/transferCommand";
import { makeErrorRPCResponse } from "./types/response";
import { CONTROL_METHODS, READ_METHODS, WRITE_METHODS } from "./types/rpc";
import { GameStateCommand } from "./commands/gameStateCommand";

export class RPC {
    static async handle(request: RPCRequest): Promise<RPCResponse<any>> {
        console.log(request);
        if (!request) {
            throw new Error("Null request");
        }

        if (!request.method) {
            return makeErrorRPCResponse(request.id, "Missing method");
        }

        const method: RPCMethods = request.method as RPCMethods;
        if (!Object.values(RPCMethods).includes(method)) {
            return makeErrorRPCResponse(request.id, "Method not found");
        }

        if (READ_METHODS.includes(method)) {
            return this.handleReadMethod(method, request);
        }
        if (WRITE_METHODS.includes(method)) {
            return this.handleWriteMethod(method, request);
        }
        if (CONTROL_METHODS.includes(method)) {
            return this.handleControlMethod(method, request);
        }

        return makeErrorRPCResponse(request.id, "Method not found");
    }

    static async handleControlMethod(method: RPCMethods, request: RPCRequest): Promise<RPCResponse<any>> {
        const privateKey = process.env.VALIDATOR_KEY || ZeroHash;
        let result: any;
        switch (method) {
            case RPCMethods.START: {
                const command = new StartServerCommand();
                result = await command.execute();
                break;
            }
            case RPCMethods.STOP: {
                const command = new StopServerCommand();
                result = await command.execute();
                break;
            }
            case RPCMethods.SHUTDOWN: {
                const [username, password] = request.params as RPCRequestParams[RPCMethods.SHUTDOWN];
                const command = new ShutdownCommand(username, password);
                result = await command.execute();
                break;
            }
            default:
                return makeErrorRPCResponse(request.id, "Method not found");
        }
        return {
            id: request.id,
            result: result
        };
    }
    // Return a JSONModel
    static async handleReadMethod(method: RPCMethods, request: RPCRequest): Promise<RPCResponse<ISignedResponse<any>>> {
        const id = request.id;
        let result: ISignedResponse<any>;
        const validatorPrivateKey = process.env.VALIDATOR_KEY || ZeroHash;

        switch (method) {
            case RPCMethods.GET_ACCOUNT: {
                if (!request.params) {
                    return makeErrorRPCResponse(id, "Invalid params");
                }
                let command = new AccountCommand(request.params[0] as string, validatorPrivateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_BLOCK: {
                let command = new BlockCommand(undefined, validatorPrivateKey);

                if (request.params) {
                    // Use regex to check if the index is a number
                    const regex = new RegExp("^[0-9]+$");
                    const [index] = request.params as RPCRequestParams[RPCMethods.GET_BLOCK];
                    if (!regex.test(index)) {
                        return makeErrorRPCResponse(id, "Invalid params");
                    }
                    command = new BlockCommand(BigInt(index), validatorPrivateKey);
                }
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_CONTRACT_SCHEMA: {
                const [hash] = request.params as RPCRequestParams[RPCMethods.GET_CONTRACT_SCHEMA];
                const command = new GetContractSchemaCommand(hash, validatorPrivateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_LAST_BLOCK: {
                const command = new BlockCommand(undefined, validatorPrivateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_CLIENT: {
                const command = new MeCommand(validatorPrivateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_NODES: {
                const command = new GetNodesCommand(validatorPrivateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_MEMPOOL: {
                const command = new MempoolCommand(validatorPrivateKey);
                result = await command.execute();
                break;
            }

            //TODO: This should be a write method
            case RPCMethods.MINED_BLOCK_HASH: {
                const blockHash = request.params[0] as string;
                const command = new ReceiveMinedBlockHashCommand(blockHash, validatorPrivateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_TRANSACTIONS: {
                const [count] = request.params as RPCRequestParams[RPCMethods.GET_TRANSACTIONS];
                const command = new GetTransactionsCommand(Number(count), validatorPrivateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_BLOCKS: {
                const [count] = request.params as RPCRequestParams[RPCMethods.GET_BLOCKS];
                const command = new GetBlocksCommand(Number(count), validatorPrivateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_GAME_STATE: {
                console.log("HERE")
                const [address] = request.params as RPCRequestParams[RPCMethods.GET_GAME_STATE];
                const command = new GameStateCommand(address, validatorPrivateKey);
                result = await command.execute();
                break;
            }

            default:
                return makeErrorRPCResponse(id, `Unknown read method: ${method}`);
        }

        if (result === null) {
            return makeErrorRPCResponse(id, "Operation failed");
        }

        return {
            id,
            result: {
                ...result,
                data: result.data?.toJson ? result.data.toJson() : result.data
            }
            //result.data?.toJson ? result.data.toJson() : result.data
        };
    }

    // These always return a transaction hash
    static async handleWriteMethod(method: RPCMethods, request: RPCRequest): Promise<RPCResponse<ISignedResponse<any>>> {
        const id = request.id;
        const validatorPrivateKey = process.env.VALIDATOR_KEY || ZeroHash;

        let result: ISignedResponse<any | null>;
        switch (method) {
            // Write methods
            case RPCMethods.MINT: {
                if (request.params?.length !== 1) {
                    return makeErrorRPCResponse(id, "Invalid params");
                }
                const [depositIndex] = request.params as RPCRequestParams[RPCMethods.MINT];

                const command = new MintCommand(depositIndex, validatorPrivateKey);

                result = await command.execute();

                break;
            }

            case RPCMethods.TRANSFER: {
                // if (request.params?.length !== 3) {
                //     return makeErrorRPCResponse(id, "Invalid params");
                // }
                const [from, to, amount, data] = request.params as RPCRequestParams[RPCMethods.TRANSFER];

                const command = new TransferCommand(from, to, BigInt(amount), data, validatorPrivateKey);
                result = await command.execute();

                break;
            }
            case RPCMethods.CREATE_CONTRACT_SCHEMA: {
                const [category, name, schema] = request.params as RPCRequestParams[RPCMethods.CREATE_CONTRACT_SCHEMA];
                const command = new CreateContractSchemaCommand(category, name, schema, validatorPrivateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.CREATE_ACCOUNT: {
                const [privateKey] = request.params as RPCRequestParams[RPCMethods.CREATE_ACCOUNT];
                const command = new CreateAccountCommand(privateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.MINE: {
                const command = new MineCommand(validatorPrivateKey);
                result = await command.execute();
                break;
            }

            default:
                return makeErrorRPCResponse(id, "Method not found");
        }
        return {
            id,
            result: result.data.toJson()
        };
    }
}
