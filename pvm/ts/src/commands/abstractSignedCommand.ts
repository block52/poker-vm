import { IJSONModel } from "../models/interfaces";
import crypto from "../utils/crypto";
import {
    ISignedResponse
} from "./interfaces";

export async function signResult<T>(
    commandResult: T,
    privateKey: string
): Promise<ISignedResponse<T>> {
    const data =
        typeof (commandResult as any).toJson === "function"
            ? (commandResult as IJSONModel).toJson()
            : commandResult;

    const message = JSON.stringify(data);
    const signature = await crypto.signData(privateKey, message);
    return {
        data: commandResult,
        signature
    };
}
