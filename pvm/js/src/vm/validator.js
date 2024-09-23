class Validator {
  validateBlock() {
    return true;
  }
}

export default Validatory;

const validateNonce = async (nonce, account) => {
  const query = { address: account };
  const height = await Account.countDocuments(query);

  return height === nonce;
};

module.exports = validateNonce;
