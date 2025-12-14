import crypto from "../utils/crypto";
import { RPCResponse } from "@block52/poker-vm-sdk";

export function makeErrorRPCResponse(id: string, message: string): RPCResponse<unknown> {
    return {
        id,
        error: message,
        result: {
            signature: "",
            data: null
        }
    };
}

export async function makeGenericRPCResponse(id: string, data: unknown, privateKey: string): Promise<RPCResponse<unknown>> {
    return {
        id,
        result: {
            signature: await crypto.signData(privateKey, JSON.stringify(data)),
            data: data
        }
    };
}
