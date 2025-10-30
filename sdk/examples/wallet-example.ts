import { generateWallet, createWalletFromMnemonic, getAddressFromMnemonic, isValidMnemonic } from "../src/walletUtils";

async function main() {
    console.log("=== Block52 Wallet Utilities Example ===\n");

    // Example 1: Generate a new wallet
    console.log("1. Generating a new wallet with 24 words...");
    const newWallet = await generateWallet("b52", 24);
    console.log("   Mnemonic:", newWallet.mnemonic);
    console.log("   Address:", newWallet.address);
    console.log();

    // Example 2: Create wallet from known mnemonic
    console.log("2. Creating wallet from known mnemonic...");
    const knownMnemonic = "vanish legend pelican blush control spike useful usage into any remove wear flee short october naive swear wall spy cup sort avoid agent credit";
    const knownWallet = await createWalletFromMnemonic(knownMnemonic, "b52");
    console.log("   Address:", knownWallet.address);
    console.log("   Expected: b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p");
    console.log("   Match:", knownWallet.address === "b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p" ? "✓" : "✗");
    console.log();

    // Example 3: Get address from mnemonic (quick lookup)
    console.log("3. Quick address lookup from mnemonic...");
    const address = await getAddressFromMnemonic(knownMnemonic, "b52");
    console.log("   Address:", address);
    console.log();

    // Example 4: Validate mnemonics
    console.log("4. Validating mnemonics...");
    console.log("   Valid 24-word mnemonic:", isValidMnemonic(knownMnemonic) ? "✓" : "✗");
    console.log("   Invalid 3-word mnemonic:", isValidMnemonic("one two three") ? "✓" : "✗");
    console.log("   Empty mnemonic:", isValidMnemonic("") ? "✓" : "✗");
    console.log();

    // Example 5: Get account info from wallet
    console.log("5. Getting account info from wallet...");
    const accounts = await knownWallet.wallet.getAccounts();
    console.log("   Address:", accounts[0].address);
    console.log("   Algorithm:", accounts[0].algo);
    console.log("   Public Key Length:", accounts[0].pubkey.length, "bytes");
    console.log();

    console.log("=== Example Complete ===");
}

main().catch(console.error);
