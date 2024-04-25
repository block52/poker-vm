const verify_signature = (public_key, signature, data) => {
  const key = ec.keyFromPublic(public_key, "hex");
  return key.verify(data, signature);
};

const sign_data = (private_key, data) => {
  const key = ec.keyFromPrivate(private_key, "hex");
  return key.sign(data).toDER("hex");
};

module.exports = {
  verify_signature,
  sign_data,
};
