import * as crypto from "crypto";

export const sign = (data: string, privateKey: string): string => {
    if (!data) {
        throw new Error("Data must be provided");
    }

    if (!privateKey) {
        throw new Error("Private key must be provided");
    }

    // Convert hex to Buffer
    const privateKeyBuffer = Buffer.from(privateKey, "hex");

    // Create PEM format private key
    const asn1PrivateKey = Buffer.concat([
        Buffer.from("302e0201010420", "hex"), // ASN1 sequence + version + octet string tag + length
        privateKeyBuffer,
        Buffer.from("a00706052b8104000a", "hex") // OID for secp256k1
    ]);

    const pemPrivateKey = "-----BEGIN EC PRIVATE KEY-----\n" + asn1PrivateKey.toString("base64") + "\n-----END EC PRIVATE KEY-----";
    // Create hash of the data
    const hash = crypto.createHash("sha256").update(data).digest();

    // Sign the hash
    const sign = crypto.createSign("SHA256");
    sign.update(hash);
    const signature = sign.sign(pemPrivateKey);

    return signature.toString("hex");
};
