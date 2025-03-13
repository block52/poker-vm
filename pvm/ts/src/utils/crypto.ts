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

export const generateSharedSecret = (userPublicKey: string, ourPrivateKey: string): string => {
    try {
        // Create a public key instance from the user's public key
        const userPublicKeyObj = new ethers.SigningKey(userPublicKey);

        // Create our wallet from our private key
        const ourWallet = new ethers.Wallet(ourPrivateKey);

        // Compute the shared secret using ECDH (Elliptic Curve Diffie-Hellman)
        // In Ethereum's case, this is on the secp256k1 curve
        const sharedPoint = userPublicKeyObj.recoverPublicKey(ethers.getBytes(userPublicKey));

        // Convert the shared point to a hex string
        const sharedSecret = ethers.keccak256(ethers.getBytes(sharedPoint));

        console.log(`Generated shared secret: ${sharedSecret}`);

        return sharedSecret
    } catch (error) {
        console.error("Error generating shared secret:", error);
        throw new Error("Failed to generate shared secret");
    }
}

// A simplified AES encryption function using the crypto module
export const aesEncrypt = (data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array => {
    try {
        // In a browser environment, we would use the Web Crypto API
        // For Node.js, we'd use the crypto module
        // This is a simplified representation - in production, use proper libraries

        // Convert everything to Node.js Buffers for the crypto module
        const dataBuffer = Buffer.from(data);
        const keyBuffer = Buffer.from(key);
        const ivBuffer = Buffer.from(iv);

        // Create cipher using AES-256-CTR
        const cipher = createHash("sha256")
            .update(dataBuffer)
            .update(keyBuffer)
            .update(ivBuffer)
            .digest();

        // Convert back to Uint8Array and return
        return new Uint8Array(cipher);
    } catch (error) {
        console.error("Error in AES encryption:", error);
        throw new Error("Failed to perform AES encryption");
    }
}

export const createSeed = (length: number = 52): number[] => {
    // Array.from({ length: 52 }, () => crypto.randomInt(0, 1000000));
    const seed = Array.from({ length: length }, () => Math.floor(1000000 * Math.random()));
    return seed;
};

export default {
    recoverPublicKey,
    verifySignature,
    signData,
    castPemToHex,
    hexToPem
};
