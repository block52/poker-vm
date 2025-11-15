import { useState } from "react";
import { generateWallet as generateWalletSDK, createWalletFromMnemonic as createWalletSDK } from "@bitcoinbrisbane/block52";
import { setCosmosMnemonic, setCosmosAddress, getCosmosMnemonic, getCosmosAddress, clearCosmosData, isValidSeedPhrase } from "../utils/cosmos";
import { colors, hexToRgba } from "../utils/colorConfig";

const CosmosWalletPage = () => {
    const [mnemonic, setMnemonic] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [importMnemonic, setImportMnemonic] = useState("");
    const [error, setError] = useState<string>("");
    const [showMnemonic, setShowMnemonic] = useState(false);

    // Check if wallet already exists
    const existingMnemonic = getCosmosMnemonic();
    const existingAddress = getCosmosAddress();

    // Generate new wallet
    const generateWalletHandler = async () => {
        try {
            setIsGenerating(true);
            setError("");

            // Generate a new 24-word mnemonic using SDK (proper BIP39 + bech32)
            const walletInfo = await generateWalletSDK("b52", 24);

            const newMnemonic = walletInfo.mnemonic;
            const newAddress = walletInfo.address;

            // Save to browser storage
            setCosmosMnemonic(newMnemonic);
            setCosmosAddress(newAddress);

            setMnemonic(newMnemonic);
            setAddress(newAddress);
            setShowMnemonic(true);

            console.log("✅ Wallet generated successfully with proper bech32 encoding!");
            console.log("Address:", newAddress);
        } catch (err) {
            console.error("Failed to generate wallet:", err);
            setError("Failed to generate wallet. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Import existing wallet
    const handleImportWallet = async () => {
        try {
            setIsGenerating(true);
            setError("");

            // Validate mnemonic
            if (!isValidSeedPhrase(importMnemonic)) {
                setError("Invalid seed phrase. Must be 12, 15, 18, 21, or 24 words.");
                return;
            }

            // Create wallet from mnemonic using SDK (proper BIP39 + bech32)
            const walletInfo = await createWalletSDK(importMnemonic, "b52");

            const importedAddress = walletInfo.address;

            // Save to browser storage
            setCosmosMnemonic(importMnemonic);
            setCosmosAddress(importedAddress);

            setMnemonic(importMnemonic);
            setAddress(importedAddress);
            setImportMnemonic("");

            console.log("✅ Wallet imported successfully with proper bech32 encoding!");
            console.log("Address:", importedAddress);
        } catch (err) {
            console.error("Failed to import wallet:", err);
            setError("Failed to import wallet. Please check your seed phrase.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Clear wallet
    const handleClearWallet = () => {
        if (window.confirm("Are you sure you want to clear your wallet? Make sure you have saved your seed phrase!")) {
            clearCosmosData();
            setMnemonic("");
            setAddress("");
            setShowMnemonic(false);
            console.log("Wallet cleared");
            // Reload page to update existingAddress/existingMnemonic
            window.location.reload();
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <h1 className="text-4xl font-bold text-white mb-2 text-center">Block52 Wallet Manager</h1>
                <p className="text-center mb-8 text-gray-400">Generate or import a wallet to receive deposits and play poker</p>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Existing Wallet Display */}
                {existingAddress && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                        <h2 className="text-2xl font-semibold text-white mb-4">Current Wallet</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-gray-300 text-sm">Address</label>
                                <div className="flex gap-2 items-center mt-1">
                                    <input
                                        type="text"
                                        value={existingAddress}
                                        readOnly
                                        className="flex-1 text-white px-4 py-2 rounded border font-mono text-sm bg-gray-900 border-gray-600"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(existingAddress, "Address")}
                                        className="text-white px-4 py-2 rounded transition-all hover:bg-blue-700 bg-blue-600"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            {existingMnemonic && (
                                <div>
                                    <label className="text-gray-300 text-sm">Seed Phrase</label>
                                    <div className="flex gap-2 items-center mt-1">
                                        <input
                                            type={showMnemonic ? "text" : "password"}
                                            value={existingMnemonic}
                                            readOnly
                                            className="flex-1 text-white px-4 py-2 rounded border font-mono text-sm bg-gray-900 border-gray-600"
                                        />
                                        <button
                                            onClick={() => setShowMnemonic(!showMnemonic)}
                                            className="text-white px-4 py-2 rounded transition-all hover:bg-gray-600 bg-gray-700"
                                        >
                                            {showMnemonic ? "Hide" : "Show"}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(existingMnemonic, "Seed Phrase")}
                                            className="text-white px-4 py-2 rounded transition-all hover:bg-blue-700 bg-blue-600"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleClearWallet}
                                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold mt-4 transition-colors"
                            >
                                Clear Wallet
                            </button>
                        </div>
                    </div>
                )}

                {/* Generate New Wallet */}
                {!existingAddress && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                        <h2 className="text-2xl font-semibold text-white mb-4">Generate New Wallet</h2>
                        <p className="mb-6 text-gray-400">Create a new Block52 wallet with a 24-word seed phrase. This will be saved in your browser.</p>

                        <button
                            onClick={generateWalletHandler}
                            disabled={isGenerating}
                            className="w-full text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-blue-600 hover:bg-blue-700"
                        >
                            {isGenerating ? "Generating..." : "Generate New Wallet"}
                        </button>

                        {mnemonic && (
                            <div className="mt-6 space-y-4">
                                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                                    <p className="text-yellow-300 font-semibold">⚠️ Important!</p>
                                    <p className="text-yellow-200 text-sm mt-2">
                                        Write down your seed phrase and store it safely. This is the only way to recover your wallet.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-gray-300 text-sm">Your Seed Phrase</label>
                                    <textarea
                                        value={mnemonic}
                                        readOnly
                                        rows={3}
                                        className="w-full text-white px-4 py-3 rounded border font-mono text-sm mt-1 bg-gray-900 border-gray-600"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(mnemonic, "Seed Phrase")}
                                        className="mt-2 text-white px-4 py-2 rounded transition-colors bg-blue-600 hover:bg-blue-700"
                                    >
                                        Copy Seed Phrase
                                    </button>
                                </div>

                                <div>
                                    <label className="text-gray-300 text-sm">Your Address</label>
                                    <input
                                        type="text"
                                        value={address}
                                        readOnly
                                        className="w-full text-white px-4 py-2 rounded border font-mono text-sm mt-1 bg-gray-900 border-gray-600"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(address, "Address")}
                                        className="mt-2 text-white px-4 py-2 rounded transition-colors bg-blue-600 hover:bg-blue-700"
                                    >
                                        Copy Address
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Import Existing Wallet */}
                {!existingAddress && (
                    <div
                        className="rounded-lg p-6 border shadow-lg"
                        style={{
                            backgroundColor: "var(--ui-bg-dark)",
                            borderColor: "var(--ui-border-color)",
                            boxShadow: `0 10px 30px ${hexToRgba(colors.brand.primary, 0.1)}`
                        }}
                    >
                        <h2 className="text-2xl font-semibold text-white mb-4">Import Existing Wallet</h2>
                        <p className="mb-6" style={{ color: "var(--ui-text-secondary)" }}>
                            Import an existing wallet using your 12 or 24-word seed phrase.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-300 text-sm">Seed Phrase</label>
                                <textarea
                                    value={importMnemonic}
                                    onChange={e => setImportMnemonic(e.target.value)}
                                    placeholder="Enter your seed phrase (12 or 24 words)"
                                    rows={3}
                                    className="w-full text-white px-4 py-3 rounded border font-mono text-sm mt-1 bg-gray-900 border-gray-600"
                                />
                            </div>

                            <button
                                onClick={handleImportWallet}
                                disabled={isGenerating || !importMnemonic.trim()}
                                className="w-full text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                            >
                                {isGenerating ? "Importing..." : "Import Wallet"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mt-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CosmosWalletPage;
