import { ethers } from "ethers";
import { NewCommand } from "./newCommand";
import { seed } from "../engine/testConstants";
import { getGameManagementInstance } from "../state/index";
import { getMempoolInstance } from "../core/mempool";
import type { IGameManagement } from "../state/interfaces";
import type { Mempool } from "../core/mempool";

// Mock the external dependencies
jest.mock("../state/index");
jest.mock("../core/mempool");

describe("NewCommand", () => {
    // Test constants
    const VALID_PRIVATE_KEY = "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb";

    // Mock instances
    const mockGameManagement: Partial<IGameManagement> = {
        getByAddress: jest.fn(),
        getGameOptions: jest.fn(),
        getState: jest.fn(),
        create: jest.fn(),
        saveFromJSON: jest.fn(),
        getAll: jest.fn(),
    };

    const mockMempool: Partial<Mempool> = {
        add: jest.fn(),
        get: jest.fn(),
        getTransaction: jest.fn(),
        has: jest.fn(),
        find: jest.fn(),
        findAll: jest.fn(),
        remove: jest.fn(),
        purge: jest.fn(),
        clear: jest.fn(),
    };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock implementations
        (getGameManagementInstance as jest.Mock).mockReturnValue(mockGameManagement);
        (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);
    });

    describe("constructor", () => {
        it("should generate seed with exactly 52 numbers", () => {
            const newCommand = new NewCommand(ethers.ZeroAddress, 1, 1, VALID_PRIVATE_KEY, seed);
            const generatedSeed = newCommand.seed;

            expect(generatedSeed).toHaveLength(52);
        });
    });
});
