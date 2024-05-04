const crypto = require("crypto");
const ethers = require("ethers");

// const private_key = crypto.randomBytes(32).toString("hex");
// console.log(private_key);

// const account = new ethers.Wallet(private_key);
const account = new ethers.Wallet(
  "795844fd4b531b9d764cfa2bf618de808fe048cdec9e030ee49df1e464bddc68"
);

console.log("Test account: ", account.address);

const { createECDH, createHash } = require("node:crypto");

const alice = createECDH("secp256k1");
const bob = createECDH("secp256k1");

const ecdh = createECDH("secp256k1");
ecdh.generateKeys();

const pk = ecdh.getPrivateKey();
const pub = ecdh.getPublicKey();

console.log(pk.toString("hex"));
console.log(pub.toString("hex"));

// // This is a shortcut way of specifying one of Alice's previous private
// // keys. It would be unwise to use such a predictable private key in a real
// // application.
// alice.setPrivateKey(private_key);

// // Bob uses a newly generated cryptographically strong
// // pseudorandom key pair
// bob.generateKeys();

// const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, "hex");
// const bobSecret = bob.computeSecret(alice.getPublicKey(), null, "hex");

// // aliceSecret and bobSecret should be the same shared secret value
// console.log(aliceSecret === bobSecret);
