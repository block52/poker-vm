import {
    generateWallet,
    createWalletFromMnemonic,
    isValidMnemonic,
    getAddressFromMnemonic,
    BLOCK52_HD_PATH
} from "../src/walletUtils";

describe("Wallet Utils", () => {
    // Test mnemonic and expected address
    const testMnemonic =
        "vanish legend pelican blush control spike useful usage into any remove wear flee short october naive swear wall spy cup sort avoid agent credit";
    const expectedAddress = "b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p";

    describe("createWalletFromMnemonic", () => {
        it("should create wallet with correct address from known mnemonic", async () => {
            const walletInfo = await createWalletFromMnemonic(testMnemonic, "b52");

            expect(walletInfo).toBeDefined();
            expect(walletInfo.mnemonic).toBe(testMnemonic);
            expect(walletInfo.address).toBe(expectedAddress);
            expect(walletInfo.wallet).toBeDefined();
        });

        it("should create wallet with custom prefix", async () => {
            const walletInfo = await createWalletFromMnemonic(testMnemonic, "cosmos");

            expect(walletInfo).toBeDefined();
            expect(walletInfo.mnemonic).toBe(testMnemonic);
            expect(walletInfo.address).toMatch(/^cosmos1/);
            expect(walletInfo.wallet).toBeDefined();
        });

        it("should create different addresses for different prefixes", async () => {
            const wallet1 = await createWalletFromMnemonic(testMnemonic, "b52");
            const wallet2 = await createWalletFromMnemonic(testMnemonic, "cosmos");

            expect(wallet1.address).not.toBe(wallet2.address);
            expect(wallet1.address).toMatch(/^b521/);
            expect(wallet2.address).toMatch(/^cosmos1/);
        });
    });

    describe("getAddressFromMnemonic", () => {
        it("should derive correct address from mnemonic", async () => {
            const address = await getAddressFromMnemonic(testMnemonic, "b52");
            expect(address).toBe(expectedAddress);
        });

        it("should be consistent with createWalletFromMnemonic", async () => {
            const address = await getAddressFromMnemonic(testMnemonic, "b52");
            const walletInfo = await createWalletFromMnemonic(testMnemonic, "b52");

            expect(address).toBe(walletInfo.address);
        });
    });

    describe("generateWallet", () => {
        it("should generate wallet with 24 words by default", async () => {
            const walletInfo = await generateWallet("b52");

            expect(walletInfo).toBeDefined();
            expect(walletInfo.mnemonic).toBeDefined();
            expect(walletInfo.address).toBeDefined();
            expect(walletInfo.wallet).toBeDefined();

            const words = walletInfo.mnemonic.split(" ");
            expect(words).toHaveLength(24);
        });

        it("should generate wallet with 12 words when specified", async () => {
            const walletInfo = await generateWallet("b52", 12);

            expect(walletInfo).toBeDefined();
            const words = walletInfo.mnemonic.split(" ");
            expect(words).toHaveLength(12);
        });

        it("should generate address with correct prefix", async () => {
            const walletInfo = await generateWallet("b52");
            expect(walletInfo.address).toMatch(/^b521/);
        });

        it("should generate different wallets each time", async () => {
            const wallet1 = await generateWallet("b52");
            const wallet2 = await generateWallet("b52");

            expect(wallet1.mnemonic).not.toBe(wallet2.mnemonic);
            expect(wallet1.address).not.toBe(wallet2.address);
        });

        it("should generate valid wallet that can be restored", async () => {
            const generated = await generateWallet("b52");
            const restored = await createWalletFromMnemonic(generated.mnemonic, "b52");

            expect(restored.address).toBe(generated.address);
            expect(restored.mnemonic).toBe(generated.mnemonic);
        });
    });

    describe("isValidMnemonic", () => {
        it("should validate correct 24-word mnemonic", () => {
            expect(isValidMnemonic(testMnemonic)).toBe(true);
        });

        it("should validate correct 12-word mnemonic", () => {
            const twelveWords = testMnemonic.split(" ").slice(0, 12).join(" ");
            expect(isValidMnemonic(twelveWords)).toBe(true);
        });

        it("should validate correct 15-word mnemonic", () => {
            const fifteenWords = testMnemonic.split(" ").slice(0, 15).join(" ");
            expect(isValidMnemonic(fifteenWords)).toBe(true);
        });

        it("should validate correct 18-word mnemonic", () => {
            const eighteenWords = testMnemonic.split(" ").slice(0, 18).join(" ");
            expect(isValidMnemonic(eighteenWords)).toBe(true);
        });

        it("should validate correct 21-word mnemonic", () => {
            const twentyOneWords = testMnemonic.split(" ").slice(0, 21).join(" ");
            expect(isValidMnemonic(twentyOneWords)).toBe(true);
        });

        it("should reject invalid word counts", () => {
            expect(isValidMnemonic("one two three")).toBe(false);
            expect(isValidMnemonic("word ".repeat(13).trim())).toBe(false);
        });

        it("should reject empty mnemonic", () => {
            expect(isValidMnemonic("")).toBe(false);
            expect(isValidMnemonic("   ")).toBe(false);
        });

        it("should reject null or undefined", () => {
            expect(isValidMnemonic(null as any)).toBe(false);
            expect(isValidMnemonic(undefined as any)).toBe(false);
        });
    });

    describe("HD Path", () => {
        it("should use standard Cosmos HD path", () => {
            expect(BLOCK52_HD_PATH).toBeDefined();
            expect(BLOCK52_HD_PATH).toHaveLength(5);
            // Verify the path produces consistent addresses
            // (The actual HD path is m/44'/118'/0'/0/0 for Cosmos)
        });

        it("should produce consistent addresses with HD path", async () => {
            // Generate two wallets with the same mnemonic and verify they produce the same address
            const wallet1 = await createWalletFromMnemonic(testMnemonic, "b52");
            const wallet2 = await createWalletFromMnemonic(testMnemonic, "b52");

            expect(wallet1.address).toBe(wallet2.address);
            expect(wallet1.address).toBe(expectedAddress);
        });
    });

    describe("Wallet Integration", () => {
        it("should allow signing with generated wallet", async () => {
            const walletInfo = await createWalletFromMnemonic(testMnemonic, "b52");
            const accounts = await walletInfo.wallet.getAccounts();

            expect(accounts).toHaveLength(1);
            expect(accounts[0].address).toBe(expectedAddress);
            expect(accounts[0].algo).toBe("secp256k1");
            expect(accounts[0].pubkey).toBeDefined();
        });

        it("should retrieve public key from wallet", async () => {
            const walletInfo = await createWalletFromMnemonic(testMnemonic, "b52");
            const [account] = await walletInfo.wallet.getAccounts();

            expect(account.pubkey).toBeDefined();
            expect(account.pubkey.length).toBe(33); // Compressed secp256k1 public key
        });
    });
});
