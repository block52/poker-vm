const ethers = require("ethers");
const abi = ["function balanceOf(address) view returns (uint256)"];

class Mainnet {
  constructor(node_url, deposit_address) {
    this.deposit_address = deposit_address;

    this.provider = new ethers.providers.JsonRpcProvider(node_url);
  }

  async getBalance(address) {
    // call the mainnet to get the balance of the address

    const provider = new ethers.providers.JsonRpcProvider(this.node_url);
    const contract = new ethers.Contract(this.deposit_address, abi, provider);

    const balance = await contract.balanceOf(address);
    return balance;
  }

  async isValidator(address) {
    const balance = await this.getBalance(address);
    return balance > 1000;
  }

  async isValidTransaction(txHash) {
    // recover the sender from the signature using ethers
    // Fetch the transaction details using the transaction hash
    const tx = await provider.getTransaction(txHash);

    // Ensure the transaction is signed and the signature components are available
    if (!tx || !tx.r || !tx.s || !tx.v) {
      throw new Error(
        "Transaction details are incomplete or not yet available"
      );
    }

    // Get the transaction data for recovery
    const txData = {
      nonce: tx.nonce,
      gasPrice: tx.gasPrice,
      gasLimit: tx.gasLimit,
      to: tx.to,
      value: tx.value,
      data: tx.data,
      chainId: tx.chainId,
    };

    // Serialize the transaction
    const serializedTx = ethers.utils.serializeTransaction(txData);

    // Get the signature components
    const r = tx.r;
    const s = tx.s;
    const v = tx.v;

    // Compute the message hash
    const msgHash = ethers.utils.keccak256(serializedTx);

    // Recover the sender's address from the signature
    const recoveredAddress = ethers.utils.recoverAddress(msgHash, {
      r: r,
      s: s,
      v: v,
    });

    return recoveredAddress;
  }
}
