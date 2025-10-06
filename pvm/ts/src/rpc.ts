import { ZeroHash } from "ethers";
import { GameOptions, NonPlayerActionType, PlayerActionType, RPCMethods, RPCRequest, RPCRequestParams, RPCResponse } from "@bitcoinbrisbane/block52";

import {
    BlockCommand,
    BlockCommandParams,
    BurnCommand,
    CreateAccountCommand,
    DeployContractCommand,
    FindGameStateCommand,
    GameStateCommand,
    GetNodesCommand,
    GetTransactionsCommand,
    ISignedResponse,
    MeCommand,
    MineCommand,
    MintCommand,
    NewCommand,
    NewTableCommand,
    PurgeMempoolCommand,
    PerformActionCommandWithResult,
    ReceiveMinedBlockHashCommand,
    SharedSecretCommand,
    ShutdownCommand,
    StartServerCommand,
    StopServerCommand,
    TransferCommand,
    WithdrawCommand,
    GetCosmosBlocksCommand,
    CosmosAccountCommand
} from "./commands";

import { makeErrorRPCResponse } from "./types/response";
import { CONTROL_METHODS, READ_METHODS, WRITE_METHODS } from "./types/rpc";
import { getServerInstance } from "./core/server";
import { Node } from "./core/types";
import { GameManagement } from "./state/mongodb/gameManagement";

export class RPC {
    static async handle(request: RPCRequest): Promise<RPCResponse<any>> {
        if (!request) {
            throw new Error("Null request");
        }

        if (!request.method) {
            return makeErrorRPCResponse(request.id, "Missing method");
        }

        const method = request.method as RPCMethods;

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
        let result: any;
        switch (method) {
            case RPCMethods.PURGE: {
                const [username, password] = request.params as RPCRequestParams[RPCMethods.PURGE];
                const command = new PurgeMempoolCommand(username, password);
                result = await command.execute();
                break;
            }
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

        try {
            switch (method) {

                case RPCMethods.FIND_CONTRACT: {
                    throw new Error("FIND_CONTRACT not implemented, call cosmos directly");
                }

                case RPCMethods.GET_ACCOUNT: {
                    throw new Error("GET_ACCOUNT not implemented, call cosmos directly");
                }

                case RPCMethods.GET_BLOCK: {
                    throw new Error("GET_BLOCK not implemented, call cosmos directly");
                }

                case RPCMethods.GET_BLOCK_BY_HASH: {
                    throw new Error("GET_BLOCK_BY_HASH not implemented, call cosmos directly");
                }

                case RPCMethods.GET_BLOCK_HEIGHT: {
                    throw new Error("GET_BLOCK_HEIGHT not implemented, call cosmos directly");
                }

                case RPCMethods.GET_LAST_BLOCK: {
                    throw new Error("GET_LAST_BLOCK not implemented, call cosmos directly");
                }

                case RPCMethods.GET_CLIENT: {
                    const command = new MeCommand(validatorPrivateKey);
                    result = await command.execute();
                    break;
                }

                case RPCMethods.GET_NODES: {
                    const server = getServerInstance();
                    const nodes: Map<string, Node> = server.nodes;
                    const command = new GetNodesCommand(nodes, validatorPrivateKey);
                    result = await command.execute();
                    break;
                }

                case RPCMethods.GET_MEMPOOL: {
                    throw new Error("GET_MEMPOOL not implemented, call cosmos directly");
                }

                case RPCMethods.GET_TRANSACTION: {
                    throw new Error("GET_TRANSACTION not implemented, call cosmos directly");
                }

                case RPCMethods.GET_TRANSACTIONS: {
                    throw new Error("GET_TRANSACTIONS not implemented, call cosmos directly");
                }

                case RPCMethods.GET_BLOCKS: {
                    throw new Error("GET_BLOCKS not implemented, call cosmos directly");
                }

                case RPCMethods.GET_GAME_STATE: {
                    const [address, caller] = request.params as RPCRequestParams[RPCMethods.GET_GAME_STATE];
                    const comosUrl = "http://localhost:1317"; // TODO: make configurable
                    const command = new GameStateCommand(address, caller, comosUrl);
                    result = await command.execute();
                    break;
                }

                case RPCMethods.GET_SHARED_SECRET: {
                    const [publicKey] = request.params as RPCRequestParams[RPCMethods.GET_SHARED_SECRET];
                    const command = new SharedSecretCommand(publicKey, validatorPrivateKey);
                    result = await command.execute();
                    break;
                }

                default:
                    return makeErrorRPCResponse(id, `Unknown read method: ${method}`);
            }
        } catch (e) {
            console.error(e);
            return makeErrorRPCResponse(id, "Operation failed");
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
        };
    }

    // These always return a transaction hash
    static async handleWriteMethod(method: RPCMethods, request: RPCRequest): Promise<RPCResponse<ISignedResponse<any>>> {
        const id = request.id;
        const validatorPrivateKey = process.env.VALIDATOR_KEY || ZeroHash;
        console.log("handleWriteMethod", method, request);

        let result: ISignedResponse<any | null>;
        try {
            switch (method) {
                // Write methods
                case RPCMethods.BURN: {
                    if (request.params?.length !== 3) {
                        return makeErrorRPCResponse(id, "Invalid params");
                    }
                    const [burnFrom, amountString, bridgeTo] = request.params as RPCRequestParams[RPCMethods.BURN];
                    const amount = BigInt(amountString); // JSON doesn't allow BigInts

                    const command = new BurnCommand(burnFrom, amount, bridgeTo, validatorPrivateKey);
                    result = await command.execute();

                    break;
                }

                case RPCMethods.MINT: {
                    if (request.params?.length !== 1) {
                        return makeErrorRPCResponse(id, "Invalid params");
                    }
                    const [depositIndex] = request.params as RPCRequestParams[RPCMethods.MINT];

                    const command = new MintCommand(depositIndex, "", validatorPrivateKey);
                    result = await command.execute();

                    break;
                }

                case RPCMethods.TRANSFER: {
                    const [from, to, amount, nonce, data] = request.params as RPCRequestParams[RPCMethods.TRANSFER];

                    // Todo: get from out of the signed request
                    const command = new TransferCommand(from, to, BigInt(amount), nonce, data, validatorPrivateKey);
                    result = await command.execute();

                    break;
                }

                // case RPCMethods.CREATE_CONTRACT_SCHEMA: {
                //     const [category, name, schema] = request.params as RPCRequestParams[RPCMethods.CREATE_CONTRACT_SCHEMA];
                //     const command = new CreateContractSchemaCommand(category, name, schema, validatorPrivateKey);
                //     result = await command.execute();
                //     break;
                // }

                case RPCMethods.CREATE_ACCOUNT: {
                    const [privateKey] = request.params as RPCRequestParams[RPCMethods.CREATE_ACCOUNT];
                    const command = new CreateAccountCommand(privateKey);
                    result = await command.execute();
                    break;
                }

                case RPCMethods.PERFORM_ACTION: {
                    const [from, to, action, value, nonce, index, data] = request.params as RPCRequestParams[RPCMethods.PERFORM_ACTION];
                    const _action = action as PlayerActionType | NonPlayerActionType;
                    const command = new PerformActionCommandWithResult(from, to, Number(index), BigInt(value || "0"), _action, Number(nonce), validatorPrivateKey, data);
                    result = await command.execute();
                    break;
                }

                case RPCMethods.NEW_HAND: {
                    // This is deprecated, use perform_action instead with action = "new-hand"
                    const [to, nonce, index, data] = request.params as RPCRequestParams[RPCMethods.NEW_HAND];
                    const command = new NewCommand(to, index, Number(nonce), validatorPrivateKey, data);
                    result = await command.execute();
                    break;
                }

                case RPCMethods.NEW_TABLE: {
                    // The SDK sends [schemaAddress, owner, nonce]
                    const [gameOptionsString, owner, nonce] = request.params as [string, string, number, string];

                    if (!gameOptionsString || nonce === undefined) {
                        return makeErrorRPCResponse(id, "Invalid params");
                    }

                    const gameOptions: GameOptions = GameManagement.parseSchema(gameOptionsString);
                    const command = new NewTableCommand(owner, gameOptions, BigInt(nonce), validatorPrivateKey);
                    result = await command.execute();
                    break;
                }

                case RPCMethods.DEPLOY_CONTRACT: {
                    const [nonce, owner, data] = request.params as RPCRequestParams[RPCMethods.DEPLOY_CONTRACT];
                    const command = new DeployContractCommand(BigInt(nonce), owner, data, validatorPrivateKey);
                    result = await command.execute();
                    break;
                }

                case RPCMethods.MINE: {
                    const command = new MineCommand(validatorPrivateKey);
                    result = await command.execute();
                    break;
                }

                case RPCMethods.MINED_BLOCK_HASH: {
                    const blockHash = request.params[0] as string;
                    const nodeUrl = request.params[1] as string;
                    const command = new ReceiveMinedBlockHashCommand(blockHash, nodeUrl, validatorPrivateKey);
                    result = await command.execute();
                    break;
                }

                case RPCMethods.WITHDRAW: {
                    if (request.params?.length !== 4) {
                        return makeErrorRPCResponse(id, "Invalid params");
                    }
                    const [from, receiver, amountString, nonce] = request.params as RPCRequestParams[RPCMethods.WITHDRAW];
                    const amount = BigInt(amountString);    // JSON doesn't allow BigInts
                    const command = new WithdrawCommand(from, receiver, amount, Number(nonce), validatorPrivateKey);
                    result = await command.execute();
                    break;
                }

                default:
                    return makeErrorRPCResponse(id, "Method not found");
            }
            return {
                id: request.id,
                result: {
                    ...result,
                    data: result.data?.toJson ? result.data.toJson() : result.data
                }
            };
        } catch (e) {
            console.error(e);
            return makeErrorRPCResponse(id, "Operation failed");
        }
    }
}
