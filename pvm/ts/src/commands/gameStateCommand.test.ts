import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { Transaction } from "../models";
import { GameStateCommand } from "./gameStateCommand";
import { ethers } from "ethers";

// seed "panther ahead despair juice crystal inch seat drill sight special vote guide"
const privateKey = "0x0000000000000000000000000000000000000000000000000000000000000001";
// "0xb101505bc06d3df59f281d23395fc0225e6df8bf6c2a6e39358a3151f62bd0a8"

jest.mock("../core/mempool", () => {
    const originalModule = jest.requireActual("../core/mempool");

    return {
        ...originalModule,
        getMempoolInstance: jest.fn(),
        Mempool: jest.fn()
    };
});

describe.only("GameStateCommand", () => {
    let mockMempool: jest.Mocked<Mempool>;

    beforeEach(() => {
        // Create a mock Mempool instance
        mockMempool = {
            findAll: jest.fn().mockReturnValue([]),
            get: jest.fn().mockReturnValue([])
            // Add other methods you might use
        } as unknown as jest.Mocked<Mempool>;

        // Mock getMempoolInstance to return the mock Mempool
        (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);
    });

    it("should get default table state", async () => {
        const command = new GameStateCommand(ethers.ZeroAddress, privateKey);
        const result = await command.execute();

        expect(result).toBeDefined();
    });

    describe.skip("GameStateCommand join table with one player", () => {
        const tableAddress = ethers.ZeroAddress;
        const joinTx = new Transaction(
            tableAddress,
            "0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f",
            ethers.parseEther("100"),
            ethers.ZeroHash,
            ethers.ZeroHash,
            Date.now(),
            0,
            0n,
            "join"
        );

        const txs = [joinTx];

        beforeEach(() => {
            // Create a mock Mempool instance
            mockMempool = {
                findAll: jest.fn().mockReturnValue(txs),
                get: jest.fn().mockReturnValue([])
                // Add other methods you might use
            } as unknown as jest.Mocked<Mempool>;

            // Mock getMempoolInstance to return the mock Mempool
            (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);
        });

        it("should allow one player to join the game", async () => {
            const command = new GameStateCommand(ethers.ZeroAddress, privateKey);
            const result = await command.execute();

            expect(result).toBeDefined();
            // const data: TexasHoldemGameStateDTO = result.data;
            // const json = data.toJson();

            // expect(json.players.length).toBe(1);

            // // Return the players
            // expect(json.players.length).toBe(2);

            // // Check the first player
            // const player1 = json.players[0];

            // expect(player1).toBeDefined();
            // expect(player1.stack).toBe("100000000000000000000");
            // expect(player1.isSmallBlind).toBe(true);
            // expect(player1.seat).toBe(1);
            // expect(player1.holeCards).toBeUndefined();
            // expect(player1.lastAction).toBeUndefined();
        });
    });

    describe("GameStateCommand join table with two players", () => {
        const tableAddress = ethers.ZeroAddress;
        const joinTx = new Transaction(
            tableAddress,
            "0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f",
            ethers.parseEther("100"),
            ethers.ZeroHash,
            ethers.ZeroHash,
            Date.now(),
            0,
            0n,
            "join"
        );

        const join2Tx = new Transaction(
            tableAddress,
            "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
            ethers.parseEther("100"),
            ethers.ZeroHash,
            ethers.ZeroHash,
            Date.now(),
            0,
            0n,
            "join"
        );
        // const sbTx = new Transaction(tableAddress, "0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f", 10n, ethers.ZeroHash, ethers.ZeroHash, Date.now(), 0, 0n, "bet");
        // const bbTx = new Transaction(tableAddress, "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 25n, ethers.ZeroHash, ethers.ZeroHash, Date.now(), 0, 0n, "bet");

        const txs = [joinTx, join2Tx];

        beforeEach(() => {
            // Create a mock Mempool instance
            mockMempool = {
                findAll: jest.fn().mockReturnValue(txs),
                get: jest.fn().mockReturnValue([])
                // Add other methods you might use
            } as unknown as jest.Mocked<Mempool>;

            // Mock getMempoolInstance to return the mock Mempool
            (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);
        });

        it.skip("should allow two players to join and auto post blinds", async () => {
            const command = new GameStateCommand(ethers.ZeroAddress, privateKey);
            const result = await command.execute();

            expect(result).toBeDefined();

            // We should have an empty table
            const json = result.data;
            expect(json).toBeDefined();
            expect(json.dealer).toBe(0);
            expect(json.smallBlindPosition).toBe(1);
            expect(json.bigBlindPosition).toBe(2);

            // Return the players
            expect(json.players.length).toBe(2);

            // Check the first player
            const player1 = json.players[0];

            expect(player1).toBeDefined();
            expect(player1.stack).toBe("100000000000000000000");
            expect(player1.isSmallBlind).toBe(true);
            expect(player1.seat).toBe(1);
            // expect(player1.holeCards).toBeUndefined();
            expect(player1.lastAction).toBeUndefined();

            // Check the second player
            const player2 = json.players[1];
            expect(player2).toBeDefined();
            expect(player2.address).toBe("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(player2.stack).toBe("100000000000000000000");
            expect(player2.isBigBlind).toBe(true);
            expect(player2.seat).toBe(2);
        });
    });
});
