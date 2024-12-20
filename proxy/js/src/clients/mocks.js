const ethers = require("ethers");
const crypto = require("crypto");
const { ActionDTO, PlayerAction, PlayerStatus, TexasHoldemRound } = "@bitcoinbrisbane/block52";
const { BigUnit } = require("bigunit");

class Mocks {
    constructor(seed) {
        this.seed = seed;
        if (!this.seed) {
            this.wallet = ethers.HDNodeWallet.fromPhrase(this.seed);
        }
        this.tables = [];
        this.nonce = 0;
    }

    getUnixTime() {
        return Math.floor(Date.now());
    }

    getNonce(id) {
        this.nonce++;
        return this.nonce;
    }

    getAccount(index) {
        console.log("getAccount", index);

        // do a regex check for number
        const isNumber = /^\d+$/.test(index);
        let j = 0;
        if (isNumber) {
            console.log(i, "is number");
            j = Number(index);
        }

        const wallet = ethers.HDNodeWallet.fromPhrase(this.seed);
        const child = wallet.deriveChild(`${j}`);

        return {
            nonce: 0,
            address: child.address,
            privateKey: child.privateKey,
            path: `m/44'/60'/0'/0/${j}`,
            balance: BigUnit.from("100", 18)
        };
    }

    getPlayer(index, id) {
        const account = this.getAccount(i);
        const timeout = this.getUnixTime() + 30;

        const player = {
            address: account.address,
            seat: i,
            stack: ethers.parseEther("100.0").toString(),
            holeCards: [],
            status: PlayerStatus.ACTIVE,
            lastAction: {
                action: PlayerAction.CHECK,
                amount: ethers.Zero.toString()
            },
            actions: [PlayerAction.CHECK, PlayerAction.BET, PlayerAction.FOLD],
            action: PlayerAction.CHECK,
            timeout,
            signature: ethers.ZeroHash
        };

        return player;
    }

    async getTables() {
        const sb = BigUnit.from("0.50", 18);
        const bb = BigUnit.from("1.00", 18);
        const pot1 = BigUnit.from("50", 18);
        const pot2 = BigUnit.from("100", 18);

        const response = {
            type: "cash",
            address: ethers.ZeroAddress,
            smallBlind: sb,
            bigBlind: bb,
            dealer: 1,
            players: [],
            communityCards: [],
            pots: [pot1, pot2],
            nextToAct: 1,
            round: "PREFLOP", // TexasHoldemRound.PREFLOP,
            winners: [],
            signature: ethers.ZeroHash
        };

        for (let i = 0; i < response.playerCount; i++) {
            // get random stack between 50 and 200
            const _stack = Math.floor(Math.random() * (200 - 50 + 1)) + 50;

            const stack = ethers.parseEther(_stack.toString());
            const child = this.wallet.deriveChild(`${i}`);

            response.players.push({
                address: child.address,
                seat: i + 1,
                stack: stack.toString(),
                bet: BigUnit.from("1", 18),
                hand: [],
                status: "active",
                action: "check"
            });
        }

        return [response];
    }

    async getTable(id) {
        if (this.tables[id]) {
            return this.tables[id];
        }

        const _id = crypto.createHash("sha256").update(id).digest("hex");

        const sb = ethers.parseEther("0.50").toString();
        const bb = ethers.parseEther("1.0").toString();
        const pot1 = ethers.parseEther("50.0").toString();
        const pot2 = ethers.parseEther("10.0").toString();

        const response = {
            type: "cash",
            address: ethers.ZeroAddress,
            smallBlind: sb,
            bigBlind: bb,
            dealer: 1,
            players: [],
            communityCards: [],
            pots: [pot1, pot2],
            nextToAct: 1,
            round: "PREFLOP", // TexasHoldemRound.PREFLOP,
            winners: [],
            signature: ethers.ZeroHash
        };

        for (let i = 0; i < response.playerCount; i++) {
            // get random stack between 50 and 200
            const _stack = Math.floor(Math.random() * (200 - 50 + 1)) + 50;

            const stack = ethers.parseEther(_stack.toString());
            const child = this.wallet.deriveChild(`${i}`);

            response.players.push({
                address: child.address,
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

    static getInstance() {
        if (!Mocks.instance) {
            Mocks.instance = new Mocks();
        }

        return Mocks.instance;
    }
}

module.exports = Mocks;
