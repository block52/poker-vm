import { GameOptions, NonPlayerActionType, PlayerActionType, RPCMethods, RPCRequest, RPCRequestParams, RPCResponse, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";

import {
    ISignedResponse,
    MeCommand,
} from "./commands";

import { PerformActionCommand } from "./commands/cosmos/performActionCommand";

import { makeErrorRPCResponse } from "./types/response";
import { READ_METHODS, WRITE_METHODS } from "./types/rpc";
import { LoggerFactory } from "./utils/logger";

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

        try {
            switch (method) {
                case RPCMethods.GET_CLIENT: {
                    const command = new MeCommand();
                    result = await command.execute();
                    break;
                }

                // All blockchain/state management methods are handled by Cosmos
                case RPCMethods.FIND_CONTRACT:
                case RPCMethods.GET_ACCOUNT:
                case RPCMethods.GET_BLOCK:
                case RPCMethods.GET_BLOCK_BY_HASH:
                case RPCMethods.GET_BLOCK_HEIGHT:
                case RPCMethods.GET_LAST_BLOCK:
                case RPCMethods.GET_BLOCKS:
                case RPCMethods.GET_MEMPOOL:
                case RPCMethods.GET_TRANSACTION:
                case RPCMethods.GET_TRANSACTIONS:
                case RPCMethods.GET_GAME_STATE:
                case RPCMethods.GET_NODES:
                case RPCMethods.GET_SHARED_SECRET:
                    return makeErrorRPCResponse(id, `${method} not implemented - query Cosmos chain directly`);

                default:
                    return makeErrorRPCResponse(id, `Unknown read method: ${method}`);
            }
        } catch (e) {
            LoggerFactory.getInstance().log(String(e), "error");
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
        LoggerFactory.getInstance().log(`handleWriteMethod ${method} ${JSON.stringify(request)}`, "debug");

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
            LoggerFactory.getInstance().log(String(e), "error");
            return makeErrorRPCResponse(id, "Operation failed");
        }
    }
}
