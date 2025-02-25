import { RandomCommand } from "./randomCommand";
import { signResult } from "./abstractSignedCommand";
import { ISignedResponse } from "./interfaces";
import crypto from "crypto";

jest.mock("./abstractSignedCommand");

describe("RandomCommand Unit Tests", () => {
    const privateKey = "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb";

    beforeEach(() => {
        jest.clearAllMocks();
        (signResult as jest.Mock).mockImplementation((data, key) => ({
            data,
            signature: "signature",
        }));
    });

    it("generates a random buffer of the correct size", async () => {
        const size = 32;
        const command = new RandomCommand(size, "seed", privateKey);
        const result: ISignedResponse<Buffer> = await command.execute();

        expect(result.data?.length).toBe(size);
        expect(result.data).toBeInstanceOf(Buffer);
    });

    it("calls signResult with correct arguments", async () => {
        const size = 16;
        const command = new RandomCommand(size, "", privateKey);
        const result = await command.execute();

        expect(signResult).toHaveBeenCalledWith(result.data, privateKey);
    });

    it("throws error if randomBytes fails", async () => {
        jest.spyOn(crypto, "randomBytes").mockImplementation(() => {
            throw new Error("Random generation failed");
        });

        const command = new RandomCommand(32, "", privateKey);
        await expect(command.execute()).rejects.toThrow("Random generation failed");
    });
});