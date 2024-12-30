const crypto = require("crypto");

// Example private key as hex string
const privateKeyHex = "e49c8d12f9486c76aa7f92948c0a020fb3b2e8ad3c85061e9fdc381c0555bdc3";

// Convert hex to Buffer
const privateKeyBuffer = Buffer.from(privateKeyHex, "hex");

// Create PEM format private key
const asn1PrivateKey = Buffer.concat([
    Buffer.from("302e0201010420", "hex"), // ASN1 sequence + version + octet string tag + length
    privateKeyBuffer,
    Buffer.from("a00706052b8104000a", "hex") // OID for secp256k1
]);

const pemPrivateKey = "-----BEGIN EC PRIVATE KEY-----\n" + asn1PrivateKey.toString("base64") + "\n-----END EC PRIVATE KEY-----";

// Data to sign
const data = "Hello, world!";

// Create hash of the data
const hash = crypto.createHash("sha256").update(data).digest();

// Sign the hash
const sign = crypto.createSign("SHA256");
sign.update(hash);
const signature = sign.sign(pemPrivateKey);

console.log("Original Data:", data);
console.log("Hash:", hash.toString("hex"));
console.log("Signature:", signature.toString("hex"));
