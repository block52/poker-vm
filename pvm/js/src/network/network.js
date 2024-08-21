const axios = require("axios");

class Network {
  contract_address = "";

  constructor() {
    this._nodes = [];
  }

  addNode(node) {
    this._nodes.push(node);
  }

  getNodes() {
    return this._nodes;
  }

  async getBlock(block_number) {
    // const provider = new ethers.providers.JsonRpcProvider();
    // const block = await provider.getBlock(block_number);

    const node = this._nodes[0];
    const block = await axios.get(`${node.url}/block/${block_number}`);

    return block;
  }
}

module.exports = Network;
