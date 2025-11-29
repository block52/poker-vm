import { verifySignature, castPemToHex, hexToPem, createAddress } from "./crypto";

// Mock crypto modules
jest.mock("crypto", () => {
    const originalModule = jest.requireActual("crypto");

    // Mock createVerify
    const mockVerify = {
        update: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
        verify: jest.fn().mockReturnValue(true)
    };

    return {
        ...originalModule,
        createVerify: jest.fn().mockReturnValue(mockVerify)
    };
});

describe("Crypto Utils", () => {

    describe("createAddress", () => {
        it("should create a hash from the input string", () => {
            const input = "testInput";
            const expectedHash = "0x3085620284f0960a276bbc3f0bd416449df14dbe";
            const address = createAddress(input);
            expect(address).toBe(expectedHash);
        });
    });

    describe("verifySignature", () => {
        it("should call crypto.createVerify with correct params", () => {
            const crypto = require("crypto");
            const mockVerify = crypto.createVerify();

            verifySignature("publicKey", "message", "signature");

            expect(crypto.createVerify).toHaveBeenCalledWith("SHA256");
            expect(mockVerify.update).toHaveBeenCalledWith("message");
            expect(mockVerify.end).toHaveBeenCalled();
            expect(mockVerify.verify).toHaveBeenCalledWith("publicKey", "signature", "hex");
        });

        it("should return the result of verify", () => {
            const result = verifySignature("publicKey", "message", "signature");
            expect(result).toBe(true);
        });
    });

    describe("castPemToHex", () => {
        it("should convert PEM to hex correctly", () => {
            // Mock a simple PEM format
            const pemKey = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEZeZLb4+dVIL8gRdcSJX5shqUVBLg
hkGQ9fkWl7JdAG9Xz+zx2rwADWpd3777BTRvRNYGlLtlZlTU5mOgwMKsaw==
-----END PUBLIC KEY-----`;

            const result = castPemToHex(pemKey);

            // Just verify it's a hex string of appropriate format
            expect(result).toMatch(/^[0-9a-f]+$/i);
            expect(result.length).toBeGreaterThan(0);
        });

        it("should remove header, footer and new lines", () => {
            // Create a spy on Buffer.from
            const fromSpy = jest.spyOn(Buffer, "from");

            const pemKey = `-----BEGIN PUBLIC KEY-----
Base64Content
WithMultipleLines
-----END PUBLIC KEY-----`;

            castPemToHex(pemKey);

            // Check that the correct string was passed to Buffer.from
            expect(fromSpy).toHaveBeenCalledWith("Base64ContentWithMultipleLines", "base64");

            fromSpy.mockRestore();
        });
    });

    describe("hexToPem", () => {
        beforeEach(() => {
            // Restore the original implementation for this test
            jest.restoreAllMocks();
        });

        it("should throw an error for invalid hex input", () => {
            expect(() => hexToPem("")).toThrow("Invalid hex key");
            expect(() => hexToPem("abc")).toThrow("Invalid hex key"); // Odd length
        });

        it("should convert private key hex to PEM", () => {
            // 64 bytes = 32 bytes private key
            const hexPrivateKey = "1".repeat(64);
            const result = hexToPem(hexPrivateKey);

            expect(result).toContain("-----BEGIN PRIVATE KEY-----");
            expect(result).toContain("-----END PRIVATE KEY-----");
        });

        it("should convert public key hex to PEM", () => {
            // Some other length for public key
            const hexPublicKey = "1".repeat(130);
            const result = hexToPem(hexPublicKey);

            expect(result).toContain("-----BEGIN PUBLIC KEY-----");
            expect(result).toContain("-----END PUBLIC KEY-----");
        });

        it("should format base64 content with line breaks", () => {
            // Create a long hex string that will produce more than 64 chars in base64
            const longHexKey = "1".repeat(200);
            const result = hexToPem(longHexKey);

            // The result should have multiple lines
            const lines = result.split("\n");
            expect(lines.length).toBeGreaterThan(3); // Header + footer + at least one content line

            // Content lines should be 64 chars or less
            const contentLines = lines.slice(1, -1); // Remove header and footer
            contentLines.forEach(line => {
                expect(line.length).toBeLessThanOrEqual(64);
            });
        });
    });
});
