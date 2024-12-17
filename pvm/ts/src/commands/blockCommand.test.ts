import { BlockCommand } from "./blockCommand";
import { BlockchainManagement } from "../state/blockchainManagement";
import { Block } from "../models";

const privateKey =
"0x0000000000000000000000000000000000000000000000000000000000000001";
//"0xb101505bc06d3df59f281d23395fc0225e6df8bf6c2a6e39358a3151f62bd0a8"

// Mock BlockchainManagement
jest.mock("../state/blockchainManagement");

describe.skip("BlockCommand", () => {
  let mockBlockchainManagement: jest.Mocked<BlockchainManagement>;

  beforeEach(() => {
    mockBlockchainManagement = new BlockchainManagement() as jest.Mocked<BlockchainManagement>;
    (BlockchainManagement as jest.Mock).mockImplementation(() => mockBlockchainManagement);
  });

  it("should get specific block when index is provided", async () => {
    const specificBlock = new Block(5, "previousHash", Date.now(), "validator");
    mockBlockchainManagement.getBlock.mockResolvedValue(specificBlock);

    const params = {
      index: BigInt(5)
    }

    const command = new BlockCommand(params, privateKey);
    const {data: result} = await command.execute();

    expect(result).toBe(specificBlock);
    expect(mockBlockchainManagement.getBlock).toHaveBeenCalledWith(5);
  });

  it("should get last block when no index is provided", async () => {
    const lastBlock = new Block(10, "previousHash", Date.now(), "validator");
    mockBlockchainManagement.getLastBlock.mockResolvedValue(lastBlock);

    const params = {
      index: undefined
    }

    const command = new BlockCommand(params, privateKey);
    const result = await command.execute();

    expect(result).toBe(lastBlock);
    expect(mockBlockchainManagement.getLastBlock).toHaveBeenCalled();
  });
});
