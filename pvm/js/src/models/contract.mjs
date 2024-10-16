const ethers = require("ethers");
const crypto = require("crypto");

const contracts = require("../schemas/contract").default;

class Contract {
  constructor() {}

  async hydrate(data) {}

  async getContract(address) {
    this.contract = await contracts.findOne({ address });
    return contract;
  }

  // MOVE TO GAME STATE
  async loadState() {
    // Get the tip of the game from the db

    const contract = await contracts.findOne({ address: this.address });
    const metadata = contract.metadata.split(":");

    if (metadata[0] === "no_limit_holdem") {
      return new NoLimitHoldem(this, contract);
    }
  }

  async processAction(action) {
    // Process the action
  }

  async loadMetadata() {
    // Get the metadata of the game
  }

  async deploy(data, signature, nonce) {
    // Deploy the contract
    const schema = JSON.parse(data);
    const hash = crypto.createHash("sha256").update(data).digest("hex");

    if (schema.variant === "texas_holdem") {
      // const contract = new NoLimitHoldem();
      // contract.deploy(data, signature, nonce);

      const owner = ethers.utils.verifyMessage(hash, signature);
      const found = await contracts.findOneBy({ hash: hash });

      if (found) {
        throw new Error("Contract already exists");
      }

      await contracts.create({
        data,
        hash,
      });
    }
  }
}

// module.exports = Contract;
export default Contract;
