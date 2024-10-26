import { ZeroHash } from "ethers";
import { MintCommand, TransferCommand } from "./commands";
import { BlockCommand } from "./commands/blockCommand";
import { CreateContractSchemaCommand } from "./commands/contractSchema/createContractSchemaCommand";
import { GetContractSchemaCommand } from "./commands/contractSchema/getContractSchemaCommand";
import { GetNodesCommand } from "./commands/getNodesCommand";
import { ISignedResponse } from "./commands/interfaces";
import { MeCommand } from "./commands/meCommand";
import { MempoolCommand } from "./commands/mempoolCommand";
import { ReceiveMinedBlockHashCommand } from "./commands/receiveMinedBlockHashCommand";
import { ShutdownCommand } from "./commands/shutdownCommand";
import { StartServerCommand } from "./commands/startServerCommand";
import { StopServerCommand } from "./commands/stopServerCommand";
import { makeErrorRPCResponse } from "./types/response";
import {
    CONTROL_METHODS,
    READ_METHODS,
    RPCMethods,
    RPCRequest,
    RPCRequestParams,
    RPCResponse,
    WRITE_METHODS
} from "./types/rpc";

export class RPC {

    static async handle(request: RPCRequest): Promise<RPCResponse<any>> {
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

    static async handleControlMethod(
        method: RPCMethods,
        request: RPCRequest
    ): Promise<RPCResponse<any>> {
        const privateKey = process.env.VALIDATOR_KEY || ZeroHash;
        let result: ISignedResponse<any>;
        switch (method) {
            case RPCMethods.START: {
                const command = new StartServerCommand(privateKey);
                result = await command.execute();
                break;
            }
            case RPCMethods.STOP: {
                const command = new StopServerCommand(privateKey);
                result = await command.execute();
                break;
            }
            case RPCMethods.SHUTDOWN: {
                const [username, password] = request.params as RPCRequestParams[RPCMethods.SHUTDOWN];
                const command = new ShutdownCommand(username, password, privateKey);
                result = await command.execute();
                break;
            }
            case RPCMethods.CREATE_CONTRACT_SCHEMA: {
                const [category, name, schema] = request.params as RPCRequestParams[RPCMethods.CREATE_CONTRACT_SCHEMA];
                const command = new CreateContractSchemaCommand(category, name, schema, privateKey);
                result = await command.execute();
                break;
            }
            default:
                return makeErrorRPCResponse(request.id, "Method not found");
        }
        if (result) {

        }
        return {
            id: request.id,
            result: result
        };
    }
    // Return a JSONModel
    static async handleReadMethod(
        method: RPCMethods,
        request: RPCRequest
    ): Promise<RPCResponse<any>> {
        const id = request.id;
        let result: ISignedResponse<any>;
        const privateKey = process.env.VALIDATOR_KEY || ZeroHash;
        switch (method) {
            
            case RPCMethods.GET_BLOCK: {
                let command = new BlockCommand(undefined, privateKey);

                if (request.params) {
                    const index = BigInt(request.params[0] as string);
                    command = new BlockCommand(index, privateKey);
                }
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_CONTRACT_SCHEMA: {
                const [hash] = request.params as RPCRequestParams[RPCMethods.GET_CONTRACT_SCHEMA];
                const command = new GetContractSchemaCommand(hash, privateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_LAST_BLOCK: {
                const command = new BlockCommand(undefined, privateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_CLIENT: {
                const command = new MeCommand(privateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_NODES: {
                const command = new GetNodesCommand(privateKey);
                result = await command.execute();
                break;
            }

            case RPCMethods.GET_MEMPOOL: {
                const command = new MempoolCommand(privateKey);
                result = await command.execute();
                break;
            }

            //TODO: This should be a write method
            case RPCMethods.MINED_BLOCK_HASH: {
                const blockHash = request.params[0] as string;
                const command = new ReceiveMinedBlockHashCommand(blockHash, privateKey);
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
            result
        };
    }

    // These always return a transaction hash
    static async handleWriteMethod(
        method: RPCMethods,
        request: RPCRequest
    ): Promise<RPCResponse<string | null>> {
        const id = request.id;
        const privateKey = process.env.VALIDATOR_KEY || ZeroHash;

        let result: ISignedResponse<any | null>;
        switch (method) {
            // Write methods
            case RPCMethods.MINT: {
                if (request.params?.length !== 3) {
                    return makeErrorRPCResponse(id, "Invalid params");

                }
                const [to, amount, transactionId] =
                    request.params as RPCRequestParams[RPCMethods.MINT];

                const command = new MintCommand(
                    to,
                    amount,
                    transactionId,
                    privateKey
                );

                result = await command.execute();

                break;
            }

            case RPCMethods.TRANSFER: {
                if (request.params?.length !== 3) {
                    return makeErrorRPCResponse(id, "Invalid params");
                }
                const [from, to, amount] =
                    request.params as RPCRequestParams[RPCMethods.TRANSFER];

                const command = new TransferCommand(
                    from,
                    to,
                    amount,
                    privateKey
                );
                result = await command.execute();

                break;
            }

            default:
                return makeErrorRPCResponse(id, "Method not found");

        }
        return {
            id,
            result
        };
    }
}
