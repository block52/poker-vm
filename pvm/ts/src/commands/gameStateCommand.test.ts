import { Block, Transaction } from "../models";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { GameStateCommand } from "./gameStateCommand";
import { ethers } from "ethers";

const privateKey = "0x0000000000000000000000000000000000000000000000000000000000000001";
//"0xb101505bc06d3df59f281d23395fc0225e6df8bf6c2a6e39358a3151f62bd0a8"

jest.mock('../core/mempool', () => {
  const originalModule = jest.requireActual('../core/mempool');
  
  return {
    ...originalModule,
    getMempoolInstance: jest.fn(),
    Mempool: jest.fn()
  };
});

describe("GameStateCommand", () => {
    let mockMempool: jest.Mocked<Mempool>;
    // const mockMempool = new Mempool() as jest.Mocked<Mempool>;

    beforeEach(() => {
      // Create a mock Mempool instance
      mockMempool = {
        findAll: jest.fn().mockReturnValue([]),
        get: jest.fn().mockReturnValue([]),
        // Add other methods you might use
      } as unknown as jest.Mocked<Mempool>;
  
      // Mock getMempoolInstance to return the mock Mempool
      (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);
    });

    it.only("should get default table state", async () => {
        // const mempool = new Mempool();
        // // const specificBlock = new Block(5, "previousHash", Date.now(), "validator");
        // // mockBlockchainManagement.getBlock.mockResolvedValue(specificBlock);

        // const tx = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 100n, ethers.ZeroAddress, ethers.ZeroHash, Date.now(), 0, 0n, "join");
        // await mempool.add(tx);
        // const txs = [tx];
        // mockMempool.get.mockReturnValue(txs);

        const command = new GameStateCommand(ethers.ZeroAddress, privateKey);
        const result = await command.execute();

        expect(result).toBeDefined();
    });
});
