import React, { useState, useMemo } from "react";
import { SigningCosmosClient, createWalletFromMnemonic as createWalletSDK } from "@bitcoinbrisbane/block52";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { colors, hexToRgba } from "../utils/colorConfig";
import { getCosmosMnemonic, getCosmosAddress } from "../utils/cosmos/storage";
import defaultLogo from "../assets/YOUR_CLUB.png";
import { useNavigate } from "react-router-dom";

interface TestResult {
    functionName: string;
    status: "pending" | "success" | "error";
    message: string;
    txHash?: string;
    data?: any;
}

export default function TestSigningPage() {
    const navigate = useNavigate();
    const [signingClient, setSigningClient] = useState<SigningCosmosClient | null>(null);
    const [wallet, setWallet] = useState<DirectSecp256k1HdWallet | null>(null);
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [balances, setBalances] = useState<{ denom: string; amount: string }[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isInitializing, setIsInitializing] = useState(false);

    // Test inputs
    const [recipientAddress, setRecipientAddress] = useState("");
    const [sendAmount, setSendAmount] = useState("1000000"); // 1 uusdc
    const [sendDenom, setSendDenom] = useState("uusdc");
    const [gameType, setGameType] = useState("cash");
    const [minPlayers, setMinPlayers] = useState(2);
    const [maxPlayers, setMaxPlayers] = useState(6);
    const [minBuyIn, setMinBuyIn] = useState("100000000"); // 100 b52USDC
    const [maxBuyIn, setMaxBuyIn] = useState("500000000"); // 500 b52USDC
    const [smallBlind, setSmallBlind] = useState("1000000"); // 1 b52USDC
    const [bigBlind, setBigBlind] = useState("2000000"); // 2 b52USDC
    const [timeout, setTimeout] = useState(30);
    const [gameId, setGameId] = useState("");
    const [seat, setSeat] = useState(0);
    const [buyInAmount, setBuyInAmount] = useState("100000000");
    const [action, setAction] = useState("fold");
    const [actionAmount, setActionAmount] = useState("0");

    const clubName = import.meta.env.VITE_CLUB_NAME || "Block52 Poker";
    const clubLogo = import.meta.env.VITE_CLUB_LOGO || defaultLogo;

    // Styles
    const containerStyle = useMemo(() => ({
        backgroundColor: hexToRgba(colors.ui.bgDark, 0.8),
        border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
    }), []);

    const inputStyle = useMemo(() => ({
        backgroundColor: hexToRgba(colors.ui.bgMedium, 0.8),
        border: `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`
    }), []);

    const addResult = (result: TestResult) => {
        setTestResults(prev => [result, ...prev]);
    };

    const initializeClient = async () => {
        setIsInitializing(true);
        addResult({
            functionName: "Initialize SigningCosmosClient",
            status: "pending",
            message: "Initializing client with mnemonic..."
        });

        try {
            // Get mnemonic from storage
            const mnemonic = getCosmosMnemonic();
            if (!mnemonic) {
                throw new Error("No mnemonic found. Please create a wallet first at /wallet");
            }

            console.log("🔐 Initializing SigningCosmosClient...");
            console.log("Mnemonic:", mnemonic.substring(0, 20) + "...");

            // Create wallet from mnemonic
            const hdWallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
                prefix: "b52"
            });

            const [account] = await hdWallet.getAccounts();
            console.log("✅ Wallet address:", account.address);

            // Create SigningCosmosClient
            const client = new SigningCosmosClient({
                rpcEndpoint: import.meta.env.VITE_COSMOS_RPC_URL || "http://localhost:26657",
                restEndpoint: import.meta.env.VITE_COSMOS_REST_URL || "http://localhost:1317",
                chainId: "pokerchain",
                prefix: "b52",
                denom: "stake", // Gas token
                gasPrice: "0.001stake",
                wallet: hdWallet
            });

            setSigningClient(client);
            setWallet(hdWallet);
            setWalletAddress(account.address);

            // Fetch balances
            console.log("💰 Fetching balances...");
            const userBalances = await client.getAllBalances(account.address);
            console.log("✅ Balances:", userBalances);
            setBalances(userBalances);

            addResult({
                functionName: "Initialize SigningCosmosClient",
                status: "success",
                message: `Client initialized successfully!`,
                data: {
                    address: account.address,
                    balances: userBalances,
                    rpcEndpoint: import.meta.env.VITE_COSMOS_RPC_URL || "http://localhost:26657",
                    restEndpoint: import.meta.env.VITE_COSMOS_REST_URL || "http://localhost:1317"
                }
            });
        } catch (error: any) {
            console.error("❌ Failed to initialize:", error);
            addResult({
                functionName: "Initialize SigningCosmosClient",
                status: "error",
                message: error.message
            });
        } finally {
            setIsInitializing(false);
        }
    };

    const testGetWalletAddress = async () => {
        if (!signingClient) {
            addResult({
                functionName: "getWalletAddress()",
                status: "error",
                message: "Client not initialized"
            });
            return;
        }

        addResult({
            functionName: "getWalletAddress()",
            status: "pending",
            message: "Getting wallet address..."
        });

        try {
            const address = await signingClient.getWalletAddress();
            console.log("✅ getWalletAddress():", address);

            addResult({
                functionName: "getWalletAddress()",
                status: "success",
                message: `Address: ${address}`,
                data: { address }
            });
        } catch (error: any) {
            console.error("❌ getWalletAddress() failed:", error);
            addResult({
                functionName: "getWalletAddress()",
                status: "error",
                message: error.message
            });
        }
    };

    const testSendTokens = async () => {
        if (!signingClient || !walletAddress) {
            addResult({
                functionName: "sendTokens()",
                status: "error",
                message: "Client not initialized"
            });
            return;
        }

        if (!recipientAddress) {
            addResult({
                functionName: "sendTokens()",
                status: "error",
                message: "Please enter recipient address"
            });
            return;
        }

        addResult({
            functionName: "sendTokens()",
            status: "pending",
            message: `Sending ${sendAmount} to ${recipientAddress}...`
        });

        try {
            console.log("💸 sendTokens():", {
                from: walletAddress,
                to: recipientAddress,
                amount: sendAmount,
                denom: sendDenom
            });

            const txHash = await signingClient.sendTokens(
                walletAddress,
                recipientAddress,
                BigInt(sendAmount),
                sendDenom,
                "Test transfer via SDK"
            );

            console.log("✅ sendTokens() successful:", txHash);

            addResult({
                functionName: "sendTokens()",
                status: "success",
                message: `Tokens sent successfully!`,
                txHash,
                data: {
                    from: walletAddress,
                    to: recipientAddress,
                    amount: sendAmount,
                    denom: "b52USDC"
                }
            });
        } catch (error: any) {
            console.error("❌ sendTokens() failed:", error);
            addResult({
                functionName: "sendTokens()",
                status: "error",
                message: error.message
            });
        }
    };

    const testCreateGame = async () => {
        if (!signingClient) {
            addResult({
                functionName: "createGame()",
                status: "error",
                message: "Client not initialized"
            });
            return;
        }

        addResult({
            functionName: "createGame()",
            status: "pending",
            message: "Creating poker game..."
        });

        try {
            console.log("🎮 createGame():", {
                gameType,
                minPlayers,
                maxPlayers,
                minBuyIn,
                maxBuyIn,
                smallBlind,
                bigBlind,
                timeout
            });

            const txHash = await signingClient.createGame(
                gameType,
                minPlayers,
                maxPlayers,
                BigInt(minBuyIn),
                BigInt(maxBuyIn),
                BigInt(smallBlind),
                BigInt(bigBlind),
                timeout
            );

            console.log("✅ createGame() successful:", txHash);

            addResult({
                functionName: "createGame()",
                status: "success",
                message: `Game created successfully!`,
                txHash,
                data: {
                    gameType,
                    minPlayers,
                    maxPlayers,
                    minBuyIn,
                    maxBuyIn,
                    smallBlind,
                    bigBlind,
                    timeout
                }
            });
        } catch (error: any) {
            console.error("❌ createGame() failed:", error);
            addResult({
                functionName: "createGame()",
                status: "error",
                message: error.message
            });
        }
    };

    const testJoinGame = async () => {
        if (!signingClient) {
            addResult({
                functionName: "joinGame()",
                status: "error",
                message: "Client not initialized"
            });
            return;
        }

        if (!gameId) {
            addResult({
                functionName: "joinGame()",
                status: "error",
                message: "Please enter game ID"
            });
            return;
        }

        addResult({
            functionName: "joinGame()",
            status: "pending",
            message: `Joining game ${gameId}...`
        });

        try {
            console.log("🪑 joinGame():", { gameId, seat, buyInAmount });

            const txHash = await signingClient.joinGame(
                gameId,
                seat,
                BigInt(buyInAmount)
            );

            console.log("✅ joinGame() successful:", txHash);

            addResult({
                functionName: "joinGame()",
                status: "success",
                message: `Joined game successfully!`,
                txHash,
                data: { gameId, seat, buyInAmount }
            });
        } catch (error: any) {
            console.error("❌ joinGame() failed:", error);
            addResult({
                functionName: "joinGame()",
                status: "error",
                message: error.message
            });
        }
    };

    const testPerformAction = async () => {
        if (!signingClient) {
            addResult({
                functionName: "performAction()",
                status: "error",
                message: "Client not initialized"
            });
            return;
        }

        if (!gameId) {
            addResult({
                functionName: "performAction()",
                status: "error",
                message: "Please enter game ID"
            });
            return;
        }

        addResult({
            functionName: "performAction()",
            status: "pending",
            message: `Performing action ${action}...`
        });

        try {
            console.log("🃏 performAction():", { gameId, action, amount: actionAmount });

            const txHash = await signingClient.performAction(
                gameId,
                action,
                BigInt(actionAmount)
            );

            console.log("✅ performAction() successful:", txHash);

            addResult({
                functionName: "performAction()",
                status: "success",
                message: `Action performed successfully!`,
                txHash,
                data: { gameId, action, amount: actionAmount }
            });
        } catch (error: any) {
            console.error("❌ performAction() failed:", error);
            addResult({
                functionName: "performAction()",
                status: "error",
                message: error.message
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#2c3245] p-6">
            <div className="w-full max-w-7xl">
                {/* Header */}
                <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6" style={containerStyle}>
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Back to Dashboard</span>
                        </button>
                        <img src={clubLogo} alt={clubName} className="h-12" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-2">SigningCosmosClient Test Page</h1>
                    <p className="text-gray-300">Test all SDK functions from Lucas's SigningCosmosClient</p>
                </div>

                {/* Token Info Section */}
                <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6" style={{
                    backgroundColor: hexToRgba(colors.accent.glow, 0.1),
                    border: `1px solid ${hexToRgba(colors.accent.glow, 0.3)}`
                }}>
                    <h2 className="text-xl font-bold mb-3" style={{ color: colors.accent.glow }}>
                        💡 Where Do Test Tokens Come From?
                    </h2>
                    <div className="space-y-3 text-gray-300 text-sm">
                        <div>
                            <span className="font-semibold">You need TWO types of tokens:</span>
                        </div>
                        <div className="ml-4 space-y-2">
                            <div>
                                <span className="font-semibold" style={{ color: colors.brand.primary }}>1. stake</span> (or b52) - For gas fees
                                <div className="text-xs text-gray-400 ml-4 mt-1">
                                    • Used to pay for ALL blockchain transactions
                                    <br />
                                    • Without this, your transactions will fail!
                                    <br />
                                    • Get from: Faucet or genesis account
                                </div>
                            </div>
                            <div>
                                <span className="font-semibold" style={{ color: colors.accent.success }}>2. uusdc</span> - For poker games
                                <div className="text-xs text-gray-400 ml-4 mt-1">
                                    • Used for game buy-ins and bets
                                    <br />
                                    • Get from: Bridge deposit from Base Chain or mint via blockchain command
                                    <br />
                                    • ⚠️ Note: Use "uusdc" denom, NOT "b52USDC"!
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 p-3 rounded" style={{ backgroundColor: hexToRgba(colors.ui.bgDark, 0.6) }}>
                            <div className="font-semibold mb-2">📋 How to Get Test Tokens:</div>
                            <div className="text-xs font-mono space-y-1 text-gray-400">
                                <div># Option 1: Use genesis account (has tokens by default)</div>
                                <div className="text-gray-500">pokerchaind keys list</div>
                                <div className="mt-2"># Option 2: Send from another account</div>
                                <div className="text-gray-500">pokerchaind tx bank send [from] {walletAddress || "[your-address]"} 1000000stake</div>
                                <div className="mt-2"># Option 3: Bridge USDC from Base Chain</div>
                                <div className="text-gray-500">Use the bridge at /deposit page</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Initialization Section */}
                <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6" style={containerStyle}>
                    <h2 className="text-2xl font-bold text-white mb-4">1. Initialize Client</h2>
                    {!signingClient ? (
                        <button
                            onClick={initializeClient}
                            disabled={isInitializing}
                            className="w-full py-3 px-6 text-white font-bold rounded-lg transition duration-300 shadow-md"
                            style={{
                                background: isInitializing
                                    ? `linear-gradient(135deg, ${hexToRgba(colors.ui.bgDark, 0.5)} 0%, ${hexToRgba(colors.ui.bgDark, 0.3)} 100%)`
                                    : `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`
                            }}
                        >
                            {isInitializing ? "Initializing..." : "Initialize SigningCosmosClient"}
                        </button>
                    ) : (
                        <div>
                            <div className="text-green-400 font-semibold mb-4">
                                ✅ Client Initialized
                            </div>
                            <div className="space-y-2">
                                <div className="text-gray-300">
                                    <span className="font-semibold">Address:</span>{" "}
                                    <span className="font-mono text-sm" style={{ color: colors.brand.primary }}>
                                        {walletAddress}
                                    </span>
                                </div>
                                <div className="text-gray-300">
                                    <span className="font-semibold">Balances:</span>
                                </div>
                                {balances.length === 0 ? (
                                    <div className="text-yellow-400 text-sm ml-4">
                                        ⚠️ No tokens found - You need tokens to send transactions!
                                    </div>
                                ) : (
                                    <div className="ml-4 space-y-1">
                                        {balances.map((balance, idx) => (
                                            <div key={idx} className="text-sm">
                                                <span className="font-mono" style={{ color: colors.accent.success }}>
                                                    {balance.denom === "stake" || balance.denom === "b52"
                                                        ? `${(Number(balance.amount) / 1_000_000).toFixed(6)} ${balance.denom}`
                                                        : balance.denom === "b52USDC" || balance.denom === "uusdc"
                                                        ? `${(Number(balance.amount) / 1_000_000).toFixed(6)} ${balance.denom}`
                                                        : `${balance.amount} ${balance.denom}`}
                                                </span>
                                                <span className="text-gray-500 text-xs ml-2">
                                                    ({balance.amount} micro-units)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {signingClient && (
                    <>
                        {/* Test Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* getWalletAddress() */}
                            <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl" style={containerStyle}>
                                <h3 className="text-xl font-bold text-white mb-4">2. getWalletAddress()</h3>
                                <button
                                    onClick={testGetWalletAddress}
                                    className="w-full py-2 px-4 text-white font-bold rounded-lg"
                                    style={{ background: colors.brand.primary }}
                                >
                                    Test Get Wallet Address
                                </button>
                            </div>

                            {/* sendTokens() */}
                            <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl" style={containerStyle}>
                                <h3 className="text-xl font-bold text-white mb-4">3. sendTokens()</h3>
                                <input
                                    type="text"
                                    placeholder="Recipient address"
                                    value={recipientAddress}
                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                    className="w-full p-2 rounded-lg text-white mb-2"
                                    style={inputStyle}
                                />
                                <input
                                    type="number"
                                    placeholder="Amount (micro-units)"
                                    value={sendAmount}
                                    onChange={(e) => setSendAmount(e.target.value)}
                                    className="w-full p-2 rounded-lg text-white mb-2"
                                    style={inputStyle}
                                />
                                <select
                                    value={sendDenom}
                                    onChange={(e) => setSendDenom(e.target.value)}
                                    className="w-full p-2 rounded-lg text-white mb-3"
                                    style={inputStyle}
                                >
                                    <option value="uusdc">uusdc (poker tokens)</option>
                                    <option value="stake">stake (gas tokens)</option>
                                </select>
                                <button
                                    onClick={testSendTokens}
                                    className="w-full py-2 px-4 text-white font-bold rounded-lg"
                                    style={{ background: colors.accent.success }}
                                >
                                    Test Send Tokens
                                </button>
                            </div>
                        </div>

                        {/* createGame() */}
                        <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6" style={containerStyle}>
                            <h3 className="text-xl font-bold text-white mb-4">4. createGame()</h3>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="Game Type"
                                    value={gameType}
                                    onChange={(e) => setGameType(e.target.value)}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="number"
                                    placeholder="Timeout (seconds)"
                                    value={timeout}
                                    onChange={(e) => setTimeout(Number(e.target.value))}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="number"
                                    placeholder="Min Players"
                                    value={minPlayers}
                                    onChange={(e) => setMinPlayers(Number(e.target.value))}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="number"
                                    placeholder="Max Players"
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="text"
                                    placeholder="Min Buy-In"
                                    value={minBuyIn}
                                    onChange={(e) => setMinBuyIn(e.target.value)}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="text"
                                    placeholder="Max Buy-In"
                                    value={maxBuyIn}
                                    onChange={(e) => setMaxBuyIn(e.target.value)}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="text"
                                    placeholder="Small Blind"
                                    value={smallBlind}
                                    onChange={(e) => setSmallBlind(e.target.value)}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="text"
                                    placeholder="Big Blind"
                                    value={bigBlind}
                                    onChange={(e) => setBigBlind(e.target.value)}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                            </div>
                            <button
                                onClick={testCreateGame}
                                className="w-full py-2 px-4 text-white font-bold rounded-lg"
                                style={{ background: colors.brand.primary }}
                            >
                                Test Create Game
                            </button>
                        </div>

                        {/* joinGame() */}
                        <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6" style={containerStyle}>
                            <h3 className="text-xl font-bold text-white mb-4">5. joinGame()</h3>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="Game ID"
                                    value={gameId}
                                    onChange={(e) => setGameId(e.target.value)}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="number"
                                    placeholder="Seat"
                                    value={seat}
                                    onChange={(e) => setSeat(Number(e.target.value))}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="text"
                                    placeholder="Buy-In Amount"
                                    value={buyInAmount}
                                    onChange={(e) => setBuyInAmount(e.target.value)}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                            </div>
                            <button
                                onClick={testJoinGame}
                                className="w-full py-2 px-4 text-white font-bold rounded-lg"
                                style={{ background: colors.accent.success }}
                            >
                                Test Join Game
                            </button>
                        </div>

                        {/* performAction() */}
                        <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6" style={containerStyle}>
                            <h3 className="text-xl font-bold text-white mb-4">6. performAction()</h3>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="Game ID"
                                    value={gameId}
                                    onChange={(e) => setGameId(e.target.value)}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <select
                                    value={action}
                                    onChange={(e) => setAction(e.target.value)}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                >
                                    <option value="fold">Fold</option>
                                    <option value="call">Call</option>
                                    <option value="raise">Raise</option>
                                    <option value="bet">Bet</option>
                                    <option value="check">Check</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Amount"
                                    value={actionAmount}
                                    onChange={(e) => setActionAmount(e.target.value)}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                            </div>
                            <button
                                onClick={testPerformAction}
                                className="w-full py-2 px-4 text-white font-bold rounded-lg"
                                style={{ background: colors.accent.withdraw }}
                            >
                                Test Perform Action
                            </button>
                        </div>
                    </>
                )}

                {/* Test Results */}
                <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl" style={containerStyle}>
                    <h2 className="text-2xl font-bold text-white mb-4">Test Results</h2>
                    {testResults.length === 0 ? (
                        <p className="text-gray-400">No tests run yet</p>
                    ) : (
                        <div className="space-y-3">
                            {testResults.map((result, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: hexToRgba(colors.ui.bgMedium, 0.6),
                                        border: `1px solid ${
                                            result.status === "success"
                                                ? colors.accent.success
                                                : result.status === "error"
                                                ? colors.accent.danger
                                                : hexToRgba(colors.brand.primary, 0.3)
                                        }`
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="font-mono text-sm" style={{ color: colors.brand.primary }}>
                                            {result.functionName}
                                        </span>
                                        <span
                                            className={`text-xs font-bold ${
                                                result.status === "success"
                                                    ? "text-green-400"
                                                    : result.status === "error"
                                                    ? "text-red-400"
                                                    : "text-yellow-400"
                                            }`}
                                        >
                                            {result.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm mb-2">{result.message}</p>
                                    {result.txHash && (
                                        <p className="text-xs font-mono text-gray-400">
                                            Tx: {result.txHash}
                                        </p>
                                    )}
                                    {result.data && (
                                        <pre className="text-xs text-gray-400 mt-2 overflow-auto">
                                            {JSON.stringify(result.data, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
