const is_nonce_valid = async (nonce, account) => {
  const query = { address: account };
  const height = await Account.countDocuments(query);

  return height === nonce;
};

module.exports = is_nonce_valid;