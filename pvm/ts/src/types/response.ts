import crypto from "../utils/crypto";
import { RPCResponse } from "./rpc";

export function makeErrorRPCResponse(id: string, message: string, ): RPCResponse<any> {
    return {
        id,
        error: message,
        result: {
            signature: "",
            data: null
        }
    };
}

export async function makeGenericRPCResponse(id: string, data: any, privateKey: string): Promise<RPCResponse<any>> {
    return {
        id,
        result: {
            signature: await crypto.signData(privateKey, JSON.stringify(data)),
            data: data
        }
    };
}


