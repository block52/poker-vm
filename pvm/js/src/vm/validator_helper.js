const validator_abi = require("../data/abis/IValidator.json");
const ethers = require("ethers");

const isValidator = async (address) => {
  const node_rpc = process.env.NODE_RPC || "http://localhost:8545";
  const provider = new ethers.providers.JsonRpcProvider(node_rpc);

  const validator_contract = new ethers.Contract(address, validator_abi, provider);
  const is_validator = await validator_contract.isValidator();

  // Check if the address is a validator
  return Boolean(is_validator);
};

export default isValidator;