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
            console.log(j, "is number");
            j = Number(index);
        }

        const wallet = ethers.HDNodeWallet.fromPhrase(this.seed);
        const child = wallet.deriveChild(`${j}`);

        return {
            nonce: 0,
            address: child.address,
            privateKey: child.privateKey,
            path: `m/44'/60'/0'/0/${j}`,
            balance: BigUnit.from("100", 18).toString()
        };
    }

    getPlayer(tableId, seat) {
        const account = this.getAccount(seat);
        const timeout = this.getUnixTime() + 30;

        const lastAction = {
            action: "check",
            amount: BigUnit.from("0", 18).toString()
        };

        const check_action = {
            action: "check",
            amount: BigUnit.from("0", 18).toString()
        };

        const fold_action = {
            action: "fold",
            amount: BigUnit.from("0", 18).toString()
        };

        const bet_action = {
            action: "bet",
            min_amount: BigUnit.from("1", 18).toString(),
            max_amount: BigUnit.from("100", 18).toString()
        };

        const player = {
            address: account.address,
            seat: seat,
            stack: BigUnit.from("100", 18).toString(),
            holeCards: [],
            status: "active",
            lastAction,
            actions: [check_action, fold_action, bet_action],
            hand_strength: "Ace High",
            timeout,
            signature: ethers.ZeroHash
        };

        return player;
    }

    getGames() {
        const id1 = ethers.ZeroAddress;
        const id2 = ethers.ZeroAddress;

        const min = BigUnit.from("0.01", 18).toString();
        const max = BigUnit.from("1", 18).toString();

        const response = [
            { id: id1, variant: "Texas Holdem", type: "Cash", limit: "No Limit", max_players: 9, min, max },
            { id: id2, variant: "Texas Holdem", type: "Cash", limit: "No Limit", max_players: 6, min, max }
        ];

        return response;
    }

    async getTables() {
        const sb = BigUnit.from("0.50", 18);
        const bb = BigUnit.from("1.00", 18);
        const pot1 = BigUnit.from("50", 18);
        const pot2 = BigUnit.from("100", 18);

        const response = {
            type: "No Limit Texas Holdem",
            address: ethers.ZeroAddress,
            smallBlind: sb.toString(),
            bigBlind: bb.toString(),
            dealer: 1,
            players: [],
            communityCards: [],
            pots: [pot1.toString(), pot2.toString()],
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

    async getTableOld(id) {
        if (this.tables[id]) {
            return this.tables[id];
        }

        const sb = BigUnit.from("0.50", 18);
        const bb = BigUnit.from("1", 18);
        const pot1 = BigUnit.from("10", 18);
        const pot2 = BigUnit.from("5", 18);

        const players = [
            {
                seat: 1,
                address: "0x1234567890123456789012345678901234567890",
                stack: BigUnit.from("100", 18).toString()
            },
            {
                seat: 3,
                address: "0x1234567890123456789012345678901234567890",
                stack: BigUnit.from("200", 18).toString()
            }
        ];

        const response = {
            type: "No Limit Texas Holdem",
            address: ethers.ZeroAddress,
            smallBlind: sb.toString(),
            bigBlind: bb.toString(),
            dealer: 1,
            players: players,
            communityCards: ["AS", "KS", "QS", "JS", "TS"],
            pots: [pot1.toString(), pot2.toString()],
            nextToAct: 1,
            round: "PREFLOP", // TexasHoldemRound.PREFLOP,
            winners: [],
            signature: ethers.ZeroHash
        };

        for (let i = 0; i < response.playerCount; i++) {
            // get random stack between 50 and 200
            const _stack = Math.floor(Math.random() * (200 - 50 + 1)) + 50;

            const stack = BigUnit.from(_stack.toString());
            const child = this.wallet.deriveChild(`${i}`);

            response.players.push({
                address: child.address,
                seat: i + 1,
                stack: stack.toString(),
                bet: BigUnit.from("1", 18).toString(),
                hand: [],
                status: "active",
                action: "check"
            });
        }

        this.tables[id] = response;

        return response;
    }

    getTable(id) {
        const response = {
            type: "cash",
            address: "0x1234567890123456789012345678901234567890",
            smallBlind: "500",
            bigBlind: "100",
            dealer: 0,
            players: [
                {
                    address: "0x1111111111111111111111111111111111111111",
                    seat: 0,
                    stack: "100",
                    isSmallBlind: true,
                    isBigBlind: false,
                    isDealer: true,
                    holeCards: [0, 13],
                    status: "active",
                    lastAction: {
                        action: "post small blind",
                        amount: "500"
                    },
                    actions: [
                        {
                            action: "fold",
                            min: null,
                            max: null
                        },
                        {
                            action: "call",
                            min: "500",
                            max: "500"
                        },
                        {
                            action: "raise",
                            min: "200",
                            max: "100"
                        }
                    ],
                    timeout: 1234567890,
                    signature: "0x0000000000000000000000000000000000000000"
                },
                {
                    address: "0x2222222222222222222222222222222222222222",
                    seat: 1,
                    stack: "500",
                    isSmallBlind: false,
                    isBigBlind: true,
                    isDealer: false,
                    holeCards: [26, 39],
                    status: "active",
                    lastAction: {
                        action: "post big blind",
                        amount: "1000000000000000000"
                    },
                    actions: [
                        {
                            action: "check",
                            min: null,
                            max: null
                        },
                        {
                            action: "bet",
                            min: "100",
                            max: "500"
                        }
                    ],
                    timeout: 1234567890,
                    signature: "0x0000000000000000000000000000000000000000"
                }
            ],
            communityCards: [51, 50, 49],
            pots: ["300"],
            nextToAct: 0,
            round: "flop",
            winners: [],
            signature: "0x000000000000000000000000000000000000000"
        };

        return response;
    }

    postAction(id) {
        const table = this.tables[id];
        const player = table.players[table.nextToAct - 1];

        const action = new ActionDTO();

        action.tableId = id;
        action.player = player.address;
        action.seat = player.seat;
        action.action = PlayerAction.BET;
        action.amount = BigUnit.from("1", 18).toString();
        action.signature = ethers.ZeroHash;

        return action;
    }

    static getInstance() {
        if (!Mocks.instance) {
            Mocks.instance = new Mocks();
        }

        return Mocks.instance;
    }
}

module.exports = Mocks;
