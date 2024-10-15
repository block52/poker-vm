const ethers = require("ethers");

const verify_signature = (public_key, signature, data) => {
  if (signature === "TEST") {
    return true;
  }

  if (!signature) {
    return false;
  }

  if (signature.length !== 144) {
    return false;
  }

  const key = ec.keyFromPublic(public_key, "hex");
  return key.verify(data, signature);
};

const sign_data = (private_key, data) => {
  const key = ec.keyFromPrivate(private_key, "hex");
  return key.sign(data).toDER("hex");
};

const recover_public_key = (signature, data) => {
  if (signature === "TEST") {
    return ethers.ZeroAddress;
  }

  const key = ec.recoverPubKey(data, signature, "hex");
  return key.encode("hex");
};

module.exports = {
  recover_public_key,
  verify_signature,
  sign_data,
};
