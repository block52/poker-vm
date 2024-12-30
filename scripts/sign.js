const hash = createHash('sha256').update(data).digest();
        
const privateKeyHex = 'e49c8d12f9486c76aa7f92948c0a020fb3b2e8ad3c85061e9fdc381c0555bdc3';
// Convert hex to Buffer
const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');

const privateKeyObject = {
    key: privateKeyBuffer,
    curve: 'secp256k1'  // Specify the curve directly
};

const ecdh = createECDH('secp256k1');
ecdh.setPrivateKey(privateKeyBuffer);
const publicKeyBuffer = ecdh.getPublicKey();

const signature = sign(null, hash, privateKeyObject);