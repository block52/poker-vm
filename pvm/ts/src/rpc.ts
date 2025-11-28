import { GameOptions, NonPlayerActionType, PlayerActionType, RPCMethods, RPCRequest, RPCResponse, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";

import {
    ISignedResponse,
    MeCommand,
} from "./commands";

import { PerformActionCommand } from "./commands/cosmos/performActionCommand";

import { makeErrorRPCResponse } from "./types/response";
import { READ_METHODS, WRITE_METHODS } from "./types/rpc";
import { LoggerFactory } from "./utils/logger";

export class RPC {
    static async handle(request: RPCRequest): Promise<RPCResponse<unknown>> {
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
    static async handleReadMethod(method: RPCMethods, request: RPCRequest): Promise<RPCResponse<unknown>> {
        const id = request.id;
        let result: ISignedResponse<unknown>;

        try {
            switch (method) {
                case RPCMethods.GET_CLIENT: {
                    const command = new MeCommand();
                    result = await command.execute();
                    break;
                }

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

        const processedData = result.data && typeof result.data === 'object' && 'toJson' in result.data && typeof (result.data as { toJson: () => unknown }).toJson === 'function'
            ? (result.data as { toJson: () => unknown }).toJson()
            : result.data;

        return {
            id,
            result: {
                data: processedData,
                signature: result.signature
            }
        };
    }

    // These always return a transaction hash
    static async handleWriteMethod(method: RPCMethods, request: RPCRequest): Promise<RPCResponse<unknown>> {
        const id = request.id;
        LoggerFactory.getInstance().log(`handleWriteMethod ${method} ${JSON.stringify(request)}`, "debug");

        try {
            switch (method) {
                // This readonly now too
                case RPCMethods.PERFORM_ACTION: {
                    // [RPCMethods.PERFORM_ACTION]: [string, string, string, string | null, string, number, string, string, string, number?];
                    // params: [from, to, action, value, index, gameStateJson, gameOptionsJson, data, timestamp?]
                    // timestamp (9th param) should be Cosmos block timestamp for deterministic gameplay
                    const params = request.params as unknown as [string, string, string, string | null, string, string, string, string, string, number?];
                    const [from, to, action, value, index, gameStateJson, gameOptionsJson, data, timestamp] = params;
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
                            signature: ""
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
