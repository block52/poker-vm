import { BlockCommand } from "./blockCommand";
import { BlockchainManagement } from "../state/blockchainManagement";
import { Block } from "../models";
import { ZeroHash } from "ethers";

// Mock BlockchainManagement
jest.mock("../state/blockchainManagement");

describe("BlockCommand", () => {
  let mockBlockchainManagement: jest.Mocked<BlockchainManagement>;

  beforeEach(() => {
    mockBlockchainManagement = new BlockchainManagement() as jest.Mocked<BlockchainManagement>;
    (BlockchainManagement as jest.Mock).mockImplementation(() => mockBlockchainManagement);
  });


  it("should get specific block when index is provided", async () => {
    const specificBlock = new Block(5, "previousHash", Date.now(), "validator");
    mockBlockchainManagement.getBlock.mockResolvedValue(specificBlock);

    const command = new BlockCommand(BigInt(5));
    const result = await command.execute();

    expect(result).toBe(specificBlock);
    expect(mockBlockchainManagement.getBlock).toHaveBeenCalledWith(5);
  });

  it("should get last block when no index is provided", async () => {
    const lastBlock = new Block(10, "previousHash", Date.now(), "validator");
    mockBlockchainManagement.getLastBlock.mockResolvedValue(lastBlock);

    const command = new BlockCommand(undefined);
    const result = await command.execute();

    expect(result).toBe(lastBlock);
    expect(mockBlockchainManagement.getLastBlock).toHaveBeenCalled();
  });
});
