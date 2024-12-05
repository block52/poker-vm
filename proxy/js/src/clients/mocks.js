const ethers = require("ethers");

class Mocks {
  
    // todo, pass seed in constructor

    getAccount(i) {
        const seed = process.env.SEED;
        const j = Number(i);
    
        const wallet = ethers.HDNodeWallet.fromPhrase(seed);
        const child = wallet.deriveChild(`${j}`);

        return {
            address: child.address,
            privateKey: child.privateKey,
            path: `m/44'/60'/0'/0/${j}`,
            balance: ethers.parseEther("100.0").toString()
        };
    }
}

module.exports = Mocks;