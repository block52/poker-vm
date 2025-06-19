import { ethers } from "ethers";
import { NewCommand } from "./newCommand";

describe("NewCommand", () => {
    // Test constants
    const VALID_PRIVATE_KEY = "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb";

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should generate seed with exactly 52 numbers", () => {
            const newCommand = new NewCommand(ethers.ZeroAddress, 1, 1, VALID_PRIVATE_KEY, "29-34-15-41-5-21-9-23-37-5-17-13-11-1-40-44-16-21-42-46-41-23-34-30-48-36-32-33-40-7-9-3-30-42-2-19-24-34-24-46-2-31-10-43-49-11-29-49-49-23-14-2");
            const seed = newCommand.seed;

            expect(seed).toHaveLength(52);
        });
    });
});
