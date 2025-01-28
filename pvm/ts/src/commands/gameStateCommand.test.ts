import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { Transaction } from "../models";
import { TexasHoldemGameState } from "../models/game";
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

describe("GameStateCommand", () => {
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

    describe("GameStateCommand join table with transactions", () => {
        const tableAddress = ethers.ZeroAddress;
        const joinTx = new Transaction(tableAddress, "0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f", ethers.parseEther("100"), ethers.ZeroHash, ethers.ZeroHash, Date.now(), 0, 0n, "join");
        const join2Tx = new Transaction(tableAddress, "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", ethers.parseEther("100"), ethers.ZeroHash, ethers.ZeroHash, Date.now(), 0, 0n, "join");

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

        it("should allow two players to join the game", async () => {
            const command = new GameStateCommand(ethers.ZeroAddress, privateKey);
            const result = await command.execute();

            expect(result).toBeDefined();
            const data: TexasHoldemGameState = result.data;
            const json = data.toJson();

            // Return the full ring of players
            expect(json.players.length).toBe(9);

            // Check the first player
            const player1 = json.players[0];
            expect(player1.address).toBe("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f");

            // Check the second player
            const player2 = json.players[1];
            expect(player2.address).toBe("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
        });
    });

    describe.only("GameStateCommand join table with transactions", () => {
        const tableAddress = ethers.ZeroAddress;
        const joinTx = new Transaction(tableAddress, "0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f", ethers.parseEther("100"), ethers.ZeroHash, ethers.ZeroHash, Date.now(), 0, 0n, "join");
        const join2Tx = new Transaction(tableAddress, "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", ethers.parseEther("100"), ethers.ZeroHash, ethers.ZeroHash, Date.now(), 0, 0n, "join");
        const sbTx = new Transaction(tableAddress, "0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f", 10n, ethers.ZeroHash, ethers.ZeroHash, Date.now(), 0, 0n, "bet");
        const bbTx = new Transaction(tableAddress, "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 25n, ethers.ZeroHash, ethers.ZeroHash, Date.now(), 0, 0n, "bet");

        const txs = [joinTx, join2Tx, sbTx];

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

        it("should allow two players to post blinds", async () => {
            const command = new GameStateCommand(ethers.ZeroAddress, privateKey);
            const result = await command.execute();

            expect(result).toBeDefined();
            const data: TexasHoldemGameState = result.data;
            const json = data.toJson();

            // Return the full ring of players
            expect(json.players.length).toBe(9);

            // Check the first player
            const player1 = json.players[0];
            expect(player1.address).toBe("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f");
            expect(player1.stack).toBe("100000000000000000000");
            expect(player1.isSmallBlind).toBe(true);

            // Check the second player
            const player2 = json.players[1];
            expect(player2.address).toBe("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(player2.stack).toBe("100000000000000000000");
            expect(player2.isBigBlind).toBe(true);
        });
    });
});
