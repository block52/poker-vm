import crypto from "../utils/crypto";
import { RPCResponse } from "./rpc";

export function makeErrorRPCResponse(id: string, message: string, ): RPCResponse<any> {
    return {
        id,
        error: message,
        result: {
            signature: "",
            result: null
        }
    };
}

export function makeGenericRPCResponse(id: string, result: any, privateKey: string): RPCResponse<any> {
    return {
        id,
        result: {
            signature: crypto.signData(privateKey, JSON.stringify(result)),
            result: result
        }
    };
}


