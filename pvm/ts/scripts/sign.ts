import { generateKeyPairSync, createSign, createVerify } from 'crypto';

const privateKey2 = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgQr6U9vA6VsY9D9FG
eM9XsRv8b1gM7ZtZVc1p5IW+AXGhRANCAARUULCTnYsC8qS9D6lXd5zzR7XYcU/v
IGxwPjFJZyl5BbHKhgjZBBkGieTthxtX0FSOB3Pcy/W8ZMkP6AvUMqZ7
-----END PRIVATE KEY-----`;

const publicKey2 = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEVFCwk52LAvKkvQ+pV3ec80e12HFQ+8gb
HD4xSWcpOQWxyoYI2QQZBontbYcbV9BUjgdz3Mv1vGTP6AvUMqZ7Wg==
-----END PUBLIC KEY-----`;


// function signString(message, privateKey) {
//     const sign = createSign('SHA256');
//     sign.update(message);
//     sign.end();

//     // Sign the message using the private key
//     const signature = sign.sign(privateKey, 'hex');
//     return signature;
// }

// function verifySignature(message, signature, publicKey) {
//     const verify = createVerify('SHA256');
//     verify.update(message);
//     verify.end();

//     // Verify the message using the public key
//     return verify.verify(publicKey, signature, 'hex');
// }

const doSign = () => {
    // Generate EC key pair
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
        namedCurve: 'P-256',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    // // Log the private and public keys in text format
    // console.log("Private Key (PEM):\n", privateKey);
    // console.log("Public Key (PEM):\n", publicKey);
};


// // Log the private and public keys in text format
// console.log("Private Key (PEM):\n", privateKey);
// console.log("Public Key (PEM):\n", publicKey);

// // Example usage
// const message = "This is a test message";
// const signature = signString(message, privateKey);

// console.log("Signature:", signature);

// const isValid = verifySignature(message, signature, publicKey);
// console.log("Is the signature valid?", isValid);

doSign();