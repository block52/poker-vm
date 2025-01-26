import { BlockCommand } from "./blockCommand";
import { BlockchainManagement } from "../state/blockchainManagement";
import { Block } from "../models";
import { Mempool } from "../core/mempool";
import { GameStateCommand } from "./gameStateCommand";
import { ethers } from "ethers";

const privateKey =
"0x0000000000000000000000000000000000000000000000000000000000000001";
//"0xb101505bc06d3df59f281d23395fc0225e6df8bf6c2a6e39358a3151f62bd0a8"

// Mock BlockchainManagement
jest.mock("../state/blockchainManagement");
jest.mock("../core/mempool");

describe("GameStateCommand", () => {
  let mockMempool: jest.Mocked<Mempool>;

  beforeEach(() => {
    mockMempool = new Mempool() as jest.Mocked<Mempool>;
    (Mempool as jest.Mock).mockImplementation(() => mockMempool);
  });

  it.only("should get default table state", async () => {
    // const specificBlock = new Block(5, "previousHash", Date.now(), "validator");
    // mockBlockchainManagement.getBlock.mockResolvedValue(specificBlock);

    // const params = {
    //   index: BigInt(5)
    // }

    const command = new GameStateCommand(ethers.ZeroAddress, privateKey);
    const result = await command.execute();

    expect(result).toBeDefined();
    
  });
});
