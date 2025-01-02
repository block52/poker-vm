import { ethers } from "ethers";
import { createVerify } from "crypto";

function verifySignature(
  publicKey: string,
  message: string,
  signature: string
): boolean {
  const verifier = createVerify("SHA256");
  verifier.update(message);
  verifier.end();

  return verifier.verify(publicKey, signature, "hex");
};

// const signData = (privateKey: string, data: string): string => {
//   const sign = createSign("SHA256");
//   sign.update(data);
//   sign.end();
//   return sign.sign(privateKey, "hex");
// };

export const signData = (privateKey: string, message: string): Promise<string> => {
  const signer = new ethers.Wallet(privateKey);
  return signer.signMessage(message);
};

const recoverPublicKey = (signature: string, data: string): string => {
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
}

export function hexToPem(hexKey: string): string {
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
}

// export const sign = (data: string, privateKey: string): string => {
//   if (!data) {
//       throw new Error("Data must be provided");
//   }

//   if (!privateKey) {
//       throw new Error("Private key must be provided");
//   }

//   // Convert hex to Buffer
//   const privateKeyBuffer = Buffer.from(privateKey, "hex");

//   // Create PEM format private key
//   const asn1PrivateKey = Buffer.concat([
//       Buffer.from("302e0201010420", "hex"), // ASN1 sequence + version + octet string tag + length
//       privateKeyBuffer,
//       Buffer.from("a00706052b8104000a", "hex") // OID for secp256k1
//   ]);

//   const pemPrivateKey = "-----BEGIN EC PRIVATE KEY-----\n" + asn1PrivateKey.toString("base64") + "\n-----END EC PRIVATE KEY-----";
//   // Create hash of the data
//   const hash = crypto.createHash("sha256").update(data).digest();

//   // Sign the hash
//   const sign = crypto.createSign("SHA256");
//   sign.update(hash);
//   const signature = sign.sign(pemPrivateKey);

//   return signature.toString("hex");
// };


export default {
  recoverPublicKey,
  verifySignature,
  signData,
  // signMessage,
};
