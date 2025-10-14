import { useState, useEffect } from "react";
import { generateWallet, createWalletFromMnemonic } from "../utils/walletUtils";
import { setCosmosMnemonic, setCosmosAddress, getCosmosMnemonic, getCosmosAddress, clearCosmosData, isValidSeedPhrase } from "../utils/cosmosUtils";
import { getColorWithOpacity } from "../utils/colorConfig";

const CosmosWalletPage = () => {
    const [mnemonic, setMnemonic] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [importMnemonic, setImportMnemonic] = useState("");
    const [error, setError] = useState<string>("");
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [aliceBalance, setAliceBalance] = useState<string | null>(null);
    const [bobBalance, setBobBalance] = useState<string | null>(null);

    // Check if wallet already exists
    const existingMnemonic = getCosmosMnemonic();
    const existingAddress = getCosmosAddress();

    // TODO: Move this to SDK - CosmosClient should implement IClient interface
    // This fetchBalance function should be part of the CosmosClient class
    // See: /Users/alexmiller/projects/pvm_cosmos_under_one_roof/poker-vm/sdk/src/cosmosClient.ts
    // The CosmosClient needs to implement the IClient interface from client.ts
    // Fetch test account balances
    const fetchBalance = async (address: string) => {
        try {
            const restUrl = import.meta.env.VITE_COSMOS_REST_URL || "http://localhost:1317";
            const response = await fetch(`${restUrl}/cosmos/bank/v1beta1/balances/${address}`);
            const data = await response.json();
            return data.balances || [];
        } catch (err) {
            console.error("Failed to fetch balance:", err);
            return null;
        }
    };

    // Load test account balances on mount
    useEffect(() => {
        fetchBalance("b521xa0ue7p4z4vlfphkvxwz0w8sj5gam8zxszqy9l").then(balances => {
            if (balances) {
                const formatted = balances.map((b: any) => `${(parseInt(b.amount) / 1000000).toFixed(2)} ${b.denom}`).join(", ");
                setAliceBalance(formatted || "0");
            }
        });
        fetchBalance("b521qu2qmrc6rve2az7r74nc5jh5fuqe8j5fpd7hq0").then(balances => {
            if (balances) {
                const formatted = balances.map((b: any) => `${(parseInt(b.amount) / 1000000).toFixed(2)} ${b.denom}`).join(", ");
                setBobBalance(formatted || "0");
            }
        });
    }, []);

    // Generate new wallet
    const generateWalletHandler = async () => {
        try {
            setIsGenerating(true);
            setError("");

            // Generate a new 24-word mnemonic
            const wallet = generateWallet("b52", 24);

            const newMnemonic = wallet.mnemonic;
            const newAddress = wallet.address;

            // Save to browser storage
            setCosmosMnemonic(newMnemonic);
            setCosmosAddress(newAddress);

            setMnemonic(newMnemonic);
            setAddress(newAddress);
            setShowMnemonic(true);

            console.log("✅ Wallet generated successfully!");
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

            // Create wallet from mnemonic
            const wallet = createWalletFromMnemonic(importMnemonic, "b52");

            const importedAddress = wallet.address;

            // Save to browser storage
            setCosmosMnemonic(importMnemonic);
            setCosmosAddress(importedAddress);

            setMnemonic(importMnemonic);
            setAddress(importedAddress);
            setImportMnemonic("");

            console.log("✅ Wallet imported successfully!");
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
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
    };

    return (
        <div className="min-h-screen p-8" style={{ backgroundColor: "var(--table-bg-base)" }}>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-2 text-center">Cosmos Wallet Manager</h1>
                <p className="text-center mb-8" style={{ color: "var(--ui-text-secondary)" }}>
                    Generate or import a wallet to receive deposits and play poker
                </p>

                {/* Existing Wallet Display */}
                {existingAddress && (
                    <div
                        className="rounded-lg p-6 mb-8 border shadow-lg"
                        style={{
                            backgroundColor: "var(--ui-bg-dark)",
                            borderColor: "var(--ui-border-color)",
                            boxShadow: `0 10px 30px ${getColorWithOpacity("brand.primary", 0.1)}`
                        }}
                    >
                        <h2 className="text-2xl font-semibold text-white mb-4">Current Wallet</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-gray-300 text-sm">Address</label>
                                <div className="flex gap-2 items-center mt-1">
                                    <input
                                        type="text"
                                        value={existingAddress}
                                        readOnly
                                        className="flex-1 text-white px-4 py-2 rounded border font-mono text-sm"
                                        style={{
                                            backgroundColor: "var(--table-bg-base)",
                                            borderColor: "var(--ui-border-color)"
                                        }}
                                    />
                                    <button
                                        onClick={() => copyToClipboard(existingAddress, "Address")}
                                        className="text-white px-4 py-2 rounded transition-colors"
                                        style={{ backgroundColor: "var(--brand-primary)" }}
                                        onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                                        onMouseOut={e => (e.currentTarget.style.opacity = "1")}
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
                                            className="flex-1 text-white px-4 py-2 rounded border font-mono text-sm"
                                            style={{
                                                backgroundColor: "var(--table-bg-base)",
                                                borderColor: "var(--ui-border-color)"
                                            }}
                                        />
                                        <button
                                            onClick={() => setShowMnemonic(!showMnemonic)}
                                            className="text-white px-4 py-2 rounded transition-colors"
                                            style={{ backgroundColor: "var(--ui-bg-medium)" }}
                                            onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                                            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                                        >
                                            {showMnemonic ? "Hide" : "Show"}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(existingMnemonic, "Seed Phrase")}
                                            className="text-white px-4 py-2 rounded transition-colors"
                                            style={{ backgroundColor: "var(--brand-primary)" }}
                                            onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                                            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
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
                    <div
                        className="rounded-lg p-6 mb-8 border shadow-lg"
                        style={{
                            backgroundColor: "var(--ui-bg-dark)",
                            borderColor: "var(--ui-border-color)",
                            boxShadow: `0 10px 30px ${getColorWithOpacity("brand.primary", 0.1)}`
                        }}
                    >
                        <h2 className="text-2xl font-semibold text-white mb-4">Generate New Wallet</h2>
                        <p className="mb-6" style={{ color: "var(--ui-text-secondary)" }}>
                            Create a new Cosmos wallet with a 24-word seed phrase. This will be saved in your browser.
                        </p>

                        <button
                            onClick={generateWalletHandler}
                            disabled={isGenerating}
                            className="w-full text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            style={{
                                background: `linear-gradient(to right, var(--brand-primary), var(--anim-color-2))`
                            }}
                            onMouseOver={e => !isGenerating && (e.currentTarget.style.opacity = "0.9")}
                            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
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
                                        className="w-full text-white px-4 py-3 rounded border font-mono text-sm mt-1"
                                        style={{
                                            backgroundColor: "var(--table-bg-base)",
                                            borderColor: "var(--ui-border-color)"
                                        }}
                                    />
                                    <button
                                        onClick={() => copyToClipboard(mnemonic, "Seed Phrase")}
                                        className="mt-2 text-white px-4 py-2 rounded transition-colors"
                                        style={{ backgroundColor: "var(--brand-primary)" }}
                                        onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                                        onMouseOut={e => (e.currentTarget.style.opacity = "1")}
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
                                        className="w-full text-white px-4 py-2 rounded border font-mono text-sm mt-1"
                                        style={{
                                            backgroundColor: "var(--table-bg-base)",
                                            borderColor: "var(--ui-border-color)"
                                        }}
                                    />
                                    <button
                                        onClick={() => copyToClipboard(address, "Address")}
                                        className="mt-2 text-white px-4 py-2 rounded transition-colors"
                                        style={{ backgroundColor: "var(--brand-primary)" }}
                                        onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                                        onMouseOut={e => (e.currentTarget.style.opacity = "1")}
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
                            boxShadow: `0 10px 30px ${getColorWithOpacity("brand.primary", 0.1)}`
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
                                    className="w-full text-white px-4 py-3 rounded border font-mono text-sm mt-1"
                                    style={{
                                        backgroundColor: "var(--table-bg-base)",
                                        borderColor: "var(--ui-border-color)",
                                        color: "white"
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleImportWallet}
                                disabled={isGenerating || !importMnemonic.trim()}
                                className="w-full text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                style={{
                                    background: `linear-gradient(to right, var(--accent-success), #14b8a6)`
                                }}
                                onMouseOver={e => (!isGenerating && !importMnemonic.trim()) || (e.currentTarget.style.opacity = "0.9")}
                                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
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

                {/* Test Addresses */}
                <div
                    className="mt-8 rounded-lg p-6 border"
                    style={{
                        backgroundColor: getColorWithOpacity("ui.bgDark", 0.5),
                        borderColor: getColorWithOpacity("brand.primary", 0.1)
                    }}
                >
                    <h3 className="text-lg font-semibold text-white mb-4">Development Test Accounts</h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-300 font-medium">Alice</span>
                                {aliceBalance && (
                                    <span
                                        className="text-xs px-2 py-1 rounded"
                                        style={{
                                            backgroundColor: getColorWithOpacity("accent.success", 0.2),
                                            color: "var(--accent-success)"
                                        }}
                                    >
                                        {aliceBalance}
                                    </span>
                                )}
                            </div>
                            <code className="font-mono text-xs block" style={{ color: "var(--brand-primary)" }}>
                                b521xa0ue7p4z4vlfphkvxwz0w8sj5gam8zxszqy9l
                            </code>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-300 font-medium">Bob</span>
                                {bobBalance && (
                                    <span
                                        className="text-xs px-2 py-1 rounded"
                                        style={{
                                            backgroundColor: getColorWithOpacity("accent.success", 0.2),
                                            color: "var(--accent-success)"
                                        }}
                                    >
                                        {bobBalance}
                                    </span>
                                )}
                            </div>
                            <code className="font-mono text-xs block" style={{ color: "var(--brand-primary)" }}>
                                b521qu2qmrc6rve2az7r74nc5jh5fuqe8j5fpd7hq0
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CosmosWalletPage;
