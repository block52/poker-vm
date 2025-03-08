import { ethers } from "ethers";
import { createVerify } from "crypto";

export const verifySignature = (publicKey: string, message: string, signature: string): boolean => {
    const verifier = createVerify("SHA256");
    verifier.update(message);
    verifier.end();
    return verifier.verify(publicKey, signature, "hex");
};

export const signData = (privateKey: string, message: string): Promise<string> => {
    const signer = new ethers.Wallet(privateKey);
    return signer.signMessage(message);
};

export const recoverPublicKey = (signature: string, data: string): string => {
    return ethers.recoverAddress(data, signature);
};

export const castPemToHex = (key: string): string => {
    // Remove the PEM header and footer
    const pem = key
        .replace(/-----BEGIN [\w\s]+-----/, "")
        .replace(/-----END [\w\s]+-----/, "")
        .replace(/\n/g, "");

    // Decode the base64-encoded content
    const binaryKey = Buffer.from(pem, "base64");

    // Convert the binary data to a hexadecimal string
    return binaryKey.toString("hex");
};

export const hexToPem = (hexKey: string): string => {
    if (!hexKey || hexKey.length === 0 || hexKey.length % 2 !== 0) {
        throw new Error("Invalid hex key");
    }

    // Determine the key type
    const keyType = hexKey.length === 64 ? "PRIVATE KEY" : "PUBLIC KEY";

    // Convert hex to binary buffer
    const binaryKey = Buffer.from(hexKey, "hex");

    // Encode the binary key in base64
    const base64Key = binaryKey.toString("base64");
    if (!base64Key) {
        throw new Error("Error converting key to base64");
    }

    // Format the base64 string into PEM format (64 characters per line)
    const matchResult = base64Key.match(/.{1,64}/g);
    if (!matchResult) {
        throw new Error("Error formatting key");
    }

    const formattedKey = matchResult.join("\n");

    // Wrap with PEM headers and footers
    return `-----BEGIN ${keyType}-----\n${formattedKey}\n-----END ${keyType}-----`;
};

export default {
    recoverPublicKey,
    verifySignature,
    signData,
    castPemToHex,
    hexToPem
};
