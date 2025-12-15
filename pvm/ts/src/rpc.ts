import { GameOptions, NonPlayerActionType, PlayerActionType, RPCMethods, RPCRequest, RPCResponse, TexasHoldemStateDTO } from "@block52/poker-vm-sdk";

import {
    ISignedResponse,
    MeCommand,
} from "./commands";

import { PerformActionCommand } from "./commands/cosmos/performActionCommand";

import { makeErrorRPCResponse } from "./types/response";
import { LoggerFactory } from "./utils/logger";

export class RPC {
    static async handle(request: RPCRequest): Promise<RPCResponse<unknown>> {
        if (!request) {
            throw new Error("Null request");
        }

        if (!request.method) {
            return makeErrorRPCResponse(request.id, "Missing method");
        }

        const method = request.method as string;
        return await this.handleMethod(method, request);
    }

    private static async handleGetLogs(id: string, lines: number): Promise<RPCResponse<unknown>> {
        try {
            const logger = LoggerFactory.getInstance();
            const logs = await logger.getLogs(lines);

            return {
                id,
                result: {
                    data: {
                        logs
                    },
                    signature: ""
                }
            };
        } catch (e) {
            LoggerFactory.getInstance().log(String(e), "error");
            return makeErrorRPCResponse(id, "Failed to retrieve logs");
        }
    }

    // Return a JSONModel
    static async handleMethod(method: string, request: RPCRequest): Promise<RPCResponse<unknown>> {
        const id = request.id;
        let result: ISignedResponse<unknown>;

        try {
            switch (method) {
                case RPCMethods.GET_CLIENT: {
                    const command = new MeCommand();
                    result = await command.execute();
                    break;
                }

                case "get_logs": {
                    const params = request.params as [number?] | undefined;
                    const lines = params?.[0] ?? 100;
                    return await this.handleGetLogs(id, lines);
                }

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
                    return makeErrorRPCResponse(id, `Unknown method: ${method}`);
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
}
