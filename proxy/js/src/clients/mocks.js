const ethers = require("ethers");
const crypto = require("crypto");

class Mocks {
    // todo, pass seed in constructor

    constructor() {
        this.seed = process.env.SEED;
        this.tables = [];
    }

    getAccount(i) {
        const j = Number(i);

        const wallet = ethers.HDNodeWallet.fromPhrase(this.seed);
        const child = wallet.deriveChild(`${j}`);

        return {
            address: child.address,
            privateKey: child.privateKey,
            path: `m/44'/60'/0'/0/${j}`,
            balance: ethers.parseEther("100.0").toString()
        };
    }

    getPlayer(i) {
        
    }

    async getTable(id) {

        if (this.tables[id]) {
            return this.tables[id];
        }

        const wallet = ethers.HDNodeWallet.fromPhrase(this.seed);
        const idHash = crypto.createHash("sha256").update(id).digest("hex");

        const sb = ethers.parseEther("0.50").toString();
        const bb = ethers.parseEther("1.0").toString();
        const pot1 = ethers.parseEther("50.0").toString();
        const pot2 = ethers.parseEther("10.0").toString();

        const response = {
            id: idHash,
            button: 1,
            playerCount: 9,
            players: [],
            pots: [pot1, pot2],
            sb,
            bb,
            board: [],
            signature: ethers.ZeroHash
        };

        for (let i = 0; i < response.playerCount; i++) {

            // get random stack between 50 and 200
            const _stake = Math.floor(Math.random() * (200 - 50 + 1)) + 50;

            const stack = ethers.parseEther(_stake.toString());
            const child = wallet.deriveChild(`${i}`);

            response.players.push({
                id: child.address,
                seat: i + 1,
                stack: stack.toString(),
                bet: ethers.parseEther("1.0").toString(),
                hand: [],
                status: "active",
                action: "check"
            });
        }

        const _response = JSON.parse(JSON.stringify(response));
        // const signature = await wallet.signMessage(_response)
        // response.signature = signature;

        this.tables[id] = response;

        return response;
    }

    // create singleton

    static getInstance() {
        if (!Mocks.instance) {
            Mocks.instance = new Mocks();
        }

        return Mocks.instance;
    }
}

module.exports = Mocks;
