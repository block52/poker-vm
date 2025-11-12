import { ZeroHash } from "ethers";
import { GameOptions, NonPlayerActionType, PlayerActionType, RPCMethods, RPCRequest, RPCRequestParams, RPCResponse, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";

import {
    GetNodesCommand,
    ISignedResponse,
    MeCommand,
    SharedSecretCommand,
} from "./commands";

import { PerformActionCommand } from "./commands/cosmos/performActionCommand";

import { makeErrorRPCResponse } from "./types/response";
import { READ_METHODS, WRITE_METHODS } from "./types/rpc";
import { getServerInstance } from "./core/server";
import { Node } from "./core/types";

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

        return makeErrorRPCResponse(request.id, "Method not found");
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

                case RPCMethods.GET_GAME_STATE: {;
                    throw new Error("GET_GAME_STATE not implemented, call cosmos directly");
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
    static async handleWriteMethod(method: RPCMethods, request: RPCRequest): Promise<any> {
        const id = request.id;
        console.log("handleWriteMethod", method, request);

        let result: ISignedResponse<any | null>;
        try {
            switch (method) {
                // This readonly now too
                case RPCMethods.PERFORM_ACTION: {
                    // [RPCMethods.PERFORM_ACTION]: [string, string, string, string | null, string, number, string, string, string, number?];
                    // params: [from, to, action, value, index, gameStateJson, gameOptionsJson, data, timestamp?]
                    // timestamp (9th param) should be Cosmos block timestamp for deterministic gameplay
                    const [from, to, action, value, index, gameStateJson, gameOptionsJson, data, timestamp] = request.params as any;
                    const gameState: TexasHoldemStateDTO = gameStateJson ? JSON.parse(gameStateJson) : null;
                    const gameOptions: GameOptions = gameOptionsJson ? JSON.parse(gameOptionsJson) : null;
                    const _action = action as PlayerActionType | NonPlayerActionType;
                    const _timestamp = timestamp ? Number(timestamp) : undefined;
                    const command = new PerformActionCommand(from, to, Number(index), BigInt(value || "0"), _action, gameState, gameOptions, data, _timestamp);
                    const _result = await command.execute();

                    return {
                        id: request.id,
                        result: {
                            data: _result,
                            signature: null
                        }
                    };
                }

                default:
                    return makeErrorRPCResponse(id, "Method not found");
            }
        } catch (e) {
            console.error(e);
            return makeErrorRPCResponse(id, "Operation failed");
        }
    }
}
