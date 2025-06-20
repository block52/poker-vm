import { ethers } from "ethers";
import { NewCommand } from "./newCommand";
import { seed } from "../engine/testConstants";

describe("NewCommand", () => {
    // Test constants
    const VALID_PRIVATE_KEY = "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb";

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should generate seed with exactly 52 numbers", () => {
            const newCommand = new NewCommand(ethers.ZeroAddress, 1, 1, VALID_PRIVATE_KEY, seed);
            const generatedSeed = newCommand.seed;

            expect(generatedSeed).toHaveLength(52);
        });
    });
});
