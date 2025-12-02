import { ethers } from "ethers";
import { isEmptyAddress, isValidPlayerAddress } from "./addressUtils";

describe("addressUtils", () => {
    describe("isEmptyAddress", () => {
        it("should return true for undefined", () => {
            expect(isEmptyAddress(undefined)).toBe(true);
        });

        it("should return true for null", () => {
            expect(isEmptyAddress(null)).toBe(true);
        });

        it("should return true for empty string", () => {
            expect(isEmptyAddress("")).toBe(true);
        });

        it("should return true for ethers ZeroAddress", () => {
            expect(isEmptyAddress(ethers.ZeroAddress)).toBe(true);
        });

        it("should return true for lowercase zero address", () => {
            expect(isEmptyAddress("0x0000000000000000000000000000000000000000")).toBe(true);
        });

        it("should return true for uppercase zero address", () => {
            expect(isEmptyAddress("0x0000000000000000000000000000000000000000".toUpperCase())).toBe(true);
        });

        it("should return true for mixed case zero address", () => {
            expect(isEmptyAddress("0x0000000000000000000000000000000000000000")).toBe(true);
        });

        it("should return false for valid Ethereum address", () => {
            expect(isEmptyAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")).toBe(false);
        });

        it("should return false for valid address with leading zeros", () => {
            expect(isEmptyAddress("0x0000000000000000000000000000000000000001")).toBe(false);
        });

        it("should return false for checksum address", () => {
            expect(isEmptyAddress("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed")).toBe(false);
        });
    });

    describe("isValidPlayerAddress", () => {
        it("should return false for undefined", () => {
            expect(isValidPlayerAddress(undefined)).toBe(false);
        });

        it("should return false for null", () => {
            expect(isValidPlayerAddress(null)).toBe(false);
        });

        it("should return false for empty string", () => {
            expect(isValidPlayerAddress("")).toBe(false);
        });

        it("should return false for ethers ZeroAddress", () => {
            expect(isValidPlayerAddress(ethers.ZeroAddress)).toBe(false);
        });

        it("should return false for zero address", () => {
            expect(isValidPlayerAddress("0x0000000000000000000000000000000000000000")).toBe(false);
        });

        it("should return true for valid Ethereum address", () => {
            expect(isValidPlayerAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")).toBe(true);
        });

        it("should return true for valid address with leading zeros", () => {
            expect(isValidPlayerAddress("0x0000000000000000000000000000000000000001")).toBe(true);
        });

        it("should return true for checksum address", () => {
            expect(isValidPlayerAddress("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed")).toBe(true);
        });
    });
});
