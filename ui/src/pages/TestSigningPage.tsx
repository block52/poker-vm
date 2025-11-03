import React, { useState, useMemo } from "react";
import { SigningCosmosClient } from "@bitcoinbrisbane/block52";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { colors, hexToRgba } from "../utils/colorConfig";
import { getCosmosMnemonic } from "../utils/cosmos/storage";
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
    // const [wallet, setWallet] = useState<DirectSecp256k1HdWallet | null>(null); // Removed unused 'wallet'
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [balances, setBalances] = useState<{ denom: string; amount: string }[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isInitializing, setIsInitializing] = useState(false);

    // Test inputs
    const [recipientAddress, setRecipientAddress] = useState("");
    const [sendAmount, setSendAmount] = useState("1000000"); // 1 usdc
    const [sendDenom, setSendDenom] = useState("usdc");
    const [gameType, setGameType] = useState("sit-and-go");
    const [minPlayers, setMinPlayers] = useState(2);
    const [maxPlayers, setMaxPlayers] = useState(6);
    const [minBuyIn, setMinBuyIn] = useState("5000000"); // 5 usdc
    const [maxBuyIn, setMaxBuyIn] = useState("50000000"); // 50 usdc (max you can afford!)
    const [sitAndGoBuyIn, setSitAndGoBuyIn] = useState("10000000"); // 10 usdc for sit-and-go
    const [smallBlind, setSmallBlind] = useState("100000"); // 0.1 usdc
    const [bigBlind, setBigBlind] = useState("200000"); // 0.2 usdc
    const [timeout, setTimeout] = useState(30);
    const [gameId, setGameId] = useState("");
    const [seat, setSeat] = useState(1);
    const [buyInAmount, setBuyInAmount] = useState("10000000"); // 10 usdc - matches sit-and-go default
    const [action, setAction] = useState("fold");
    const [actionAmount, setActionAmount] = useState("0");

    const clubName = import.meta.env.VITE_CLUB_NAME || "Block52 Poker";
    const clubLogo = import.meta.env.VITE_CLUB_LOGO || defaultLogo;

    // Test accounts from genesis - Static addresses from TEST_ACTORS.md
    const TEST_ACCOUNTS = [
        {
            name: "alice",
            address: "b521dfe7r39q88zeqtde44efdqeky9thdtwngkzy2y",
            mnemonic:
                "cement shadow leave crash crisp aisle model hip lend february library ten cereal soul bind boil bargain barely rookie odor panda artwork damage reason"
        },
        {
            name: "bob",
            address: "b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p",
            mnemonic:
                "vanish legend pelican blush control spike useful usage into any remove wear flee short october naive swear wall spy cup sort avoid agent credit"
        },
        {
            name: "charlie",
            address: "b521xkh7eznh50km2lxh783sqqyml8fjwl0tqjsc0c",
            mnemonic:
                "video short denial minimum vague arm dose parrot poverty saddle kingdom life buyer globe fashion topic vicious theme voice keep try jacket fresh potato"
        },
        {
            name: "diana",
            address: "b521n25h4eg6uhtdvs26988k9ye497sylum8lz5vns",
            mnemonic:
                "twice bacon whale space improve galaxy liberty trumpet outside sunny action reflect doll hill ugly torch ride gossip snack fork talk market proud nothing"
        }
    ];

    // const [testAccountBalances, setTestAccountBalances] = useState<Record<string, { denom: string; amount: string }[]>>({}); // Removed unused

    const copyCommand = (account: string, denom: string, amount: string) => {
        const command = `pokerchaind tx bank send ${account} ${walletAddress} ${amount}${denom} --chain-id pokerchain --keyring-backend test -y`;
        navigator.clipboard.writeText(command);
        alert(`Command copied to clipboard!\n\n${command}`);
    };

    // Styles
    const containerStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.ui.bgDark, 0.8),
            border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
        }),
        []
    );

    const inputStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.ui.bgMedium, 0.8),
            border: `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`
        }),
        []
    );

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
                denom: "b52Token", // Native gas token (changed from 'stake' Oct 18, 2025)
                gasPrice: "0.01b52Token", // Must match validator minimum-gas-prices
                wallet: hdWallet
            });

            setSigningClient(client);
            setWalletAddress(account.address);

            // Fetch balances
            console.log("💰 Fetching balances...");
            const userBalances = await client.getAllBalances(account.address);
            console.log("✅ Balances:", userBalances);
            setBalances(userBalances);

            addResult({
                functionName: "Initialize SigningCosmosClient",
                status: "success",
                message: "Client initialized successfully!",
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
            // Strip any decimals and validate the amount
            const cleanAmount = sendAmount.split(".")[0]; // Remove decimal part
            if (!cleanAmount || isNaN(Number(cleanAmount)) || Number(cleanAmount) <= 0) {
                throw new Error("Amount must be a positive integer (micro-units, no decimals)");
            }

            console.log("💸 sendTokens():", {
                from: walletAddress,
                to: recipientAddress,
                amount: cleanAmount,
                originalInput: sendAmount,
                denom: sendDenom
            });

            const txHash = await signingClient.sendTokens(walletAddress, recipientAddress, BigInt(cleanAmount), sendDenom, "Test transfer via SDK");

            console.log("✅ sendTokens() successful:", txHash);

            addResult({
                functionName: "sendTokens()",
                status: "success",
                message: "Tokens sent successfully!",
                txHash,
                data: {
                    from: walletAddress,
                    to: recipientAddress,
                    amount: cleanAmount,
                    denom: sendDenom
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
            // For sit-and-go/tournament games, use single buy-in for both min and max
            const isTournament = gameType === "SIT_AND_GO" || gameType === "TOURNAMENT";

            // Validate and clean all BigInt inputs
            const cleanMinBuyIn = isTournament ? sitAndGoBuyIn.split(".")[0] : minBuyIn.split(".")[0];
            const cleanMaxBuyIn = isTournament ? sitAndGoBuyIn.split(".")[0] : maxBuyIn.split(".")[0];
            const cleanSmallBlind = smallBlind.split(".")[0];
            const cleanBigBlind = bigBlind.split(".")[0];

            if (!cleanMinBuyIn || isNaN(Number(cleanMinBuyIn)) || Number(cleanMinBuyIn) <= 0) {
                throw new Error("Min buy-in must be a positive integer (micro-units)");
            }
            if (!cleanMaxBuyIn || isNaN(Number(cleanMaxBuyIn)) || Number(cleanMaxBuyIn) <= 0) {
                throw new Error("Max buy-in must be a positive integer (micro-units)");
            }
            if (!cleanSmallBlind || isNaN(Number(cleanSmallBlind)) || Number(cleanSmallBlind) <= 0) {
                throw new Error("Small blind must be a positive integer (micro-units)");
            }
            if (!cleanBigBlind || isNaN(Number(cleanBigBlind)) || Number(cleanBigBlind) <= 0) {
                throw new Error("Big blind must be a positive integer (micro-units)");
            }

            console.log("🎮 createGame():", {
                gameType,
                minPlayers,
                maxPlayers,
                minBuyIn: cleanMinBuyIn,
                maxBuyIn: cleanMaxBuyIn,
                smallBlind: cleanSmallBlind,
                bigBlind: cleanBigBlind,
                timeout
            });

            const txHash = await signingClient.createGame(
                gameType,
                minPlayers,
                maxPlayers,
                BigInt(cleanMinBuyIn),
                BigInt(cleanMaxBuyIn),
                BigInt(cleanSmallBlind),
                BigInt(cleanBigBlind),
                timeout
            );

            console.log("✅ createGame() successful:", txHash);

            addResult({
                functionName: "createGame()",
                status: "success",
                message: "Game created successfully!",
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
            // Validate and clean buy-in amount
            const cleanBuyInAmount = buyInAmount.split(".")[0];
            if (!cleanBuyInAmount || isNaN(Number(cleanBuyInAmount)) || Number(cleanBuyInAmount) <= 0) {
                throw new Error("Buy-in amount must be a positive integer (micro-units)");
            }

            console.log("🪑 joinGame():", {
                gameId,
                seat,
                buyInAmount: cleanBuyInAmount,
                originalInput: buyInAmount
            });

            const txHash = await signingClient.joinGame(gameId, seat, BigInt(cleanBuyInAmount));

            console.log("✅ joinGame() successful:", txHash);

            addResult({
                functionName: "joinGame()",
                status: "success",
                message: "Joined game successfully!",
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
            // Validate and clean action amount
            const cleanActionAmount = actionAmount.split(".")[0];
            if (!cleanActionAmount || isNaN(Number(cleanActionAmount)) || Number(cleanActionAmount) < 0) {
                throw new Error("Action amount must be a non-negative integer (micro-units)");
            }

            console.log("🃏 performAction():", {
                gameId,
                action,
                amount: cleanActionAmount,
                originalInput: actionAmount
            });

            const txHash = await signingClient.performAction(gameId, action, BigInt(cleanActionAmount));

            console.log("✅ performAction() successful:", txHash);

            addResult({
                functionName: "performAction()",
                status: "success",
                message: "Action performed successfully!",
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

    const testQueryGames = async () => {
        if (!signingClient) {
            addResult({
                functionName: "queryGames()",
                status: "error",
                message: "Client not initialized"
            });
            return;
        }

        addResult({
            functionName: "queryGames()",
            status: "pending",
            message: "Querying all games from blockchain..."
        });

        try {
            const games = await signingClient.queryGames();

            console.log("✅ queryGames() successful:", games);

            addResult({
                functionName: "queryGames()",
                status: "success",
                message: `Found ${games.length} game(s)!`,
                data: { count: games.length, games }
            });
        } catch (error: any) {
            console.error("❌ queryGames() failed:", error);
            addResult({
                functionName: "queryGames()",
                status: "error",
                message: error.message
            });
        }
    };

    const testQueryGameState = async () => {
        if (!signingClient) {
            addResult({
                functionName: "queryGameState()",
                status: "error",
                message: "Client not initialized"
            });
            return;
        }

        if (!gameId) {
            addResult({
                functionName: "queryGameState()",
                status: "error",
                message: "Please enter game ID"
            });
            return;
        }

        addResult({
            functionName: "queryGameState()",
            status: "pending",
            message: `Querying game state for ${gameId}...`
        });

        try {
            const gameState = await signingClient.queryGameState(gameId);

            console.log("✅ queryGameState() successful:", gameState);

            addResult({
                functionName: "queryGameState()",
                status: "success",
                message: "Game state retrieved!",
                data: {
                    gameId,
                    players: gameState.players?.length || 0,
                    round: gameState.round,
                    actionCount: gameState.actionCount,
                    gameState
                }
            });
        } catch (error: any) {
            console.error("❌ queryGameState() failed:", error);
            addResult({
                functionName: "queryGameState()",
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
                        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
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
                <div
                    className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6"
                    style={{
                        backgroundColor: hexToRgba(colors.accent.glow, 0.1),
                        border: `1px solid ${hexToRgba(colors.accent.glow, 0.3)}`
                    }}
                >
                    <h2 className="text-xl font-bold mb-3" style={{ color: colors.accent.glow }}>
                        💡 Where Do Test Tokens Come From?
                    </h2>
                    <div className="space-y-3 text-gray-300 text-sm">
                        <div>
                            <span className="font-semibold">You need TWO types of tokens:</span>
                        </div>
                        <div className="ml-4 space-y-2">
                            <div>
                                <span className="font-semibold" style={{ color: colors.brand.primary }}>
                                    1. b52Token
                                </span>{" "}
                                - For gas fees
                                <div className="text-xs text-gray-400 ml-4 mt-1">
                                    • Used to pay for ALL blockchain transactions
                                    <br />
                                    • Without this, your transactions will fail!
                                    <br />
                                    • Get from: Faucet or genesis account
                                    <br />• Note: Changed from 'stake' to 'b52Token' on Oct 18, 2025
                                </div>
                            </div>
                            <div>
                                <span className="font-semibold" style={{ color: colors.accent.success }}>
                                    2. usdc
                                </span>{" "}
                                - For poker games
                                <div className="text-xs text-gray-400 ml-4 mt-1">
                                    • Used for game buy-ins and bets
                                    <br />
                                    • Get from: Bridge deposit from Base Chain or mint via blockchain command
                                    <br />• ⚠️ Note: Use "usdc" denom (not "uusdc" or "b52USDC")
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 p-3 rounded" style={{ backgroundColor: hexToRgba(colors.ui.bgDark, 0.6) }}>
                            <div className="font-semibold mb-2">📋 How to Get Test Tokens:</div>
                            <div className="text-xs font-mono space-y-1 text-gray-400">
                                <div># Option 1: Use genesis account (has tokens by default)</div>
                                <div className="text-gray-500">pokerchaind keys list</div>
                                <div className="mt-2"># Option 2: Send from another account</div>
                                <div className="text-gray-500">pokerchaind tx bank send [from] {walletAddress || "[your-address]"} 1000000b52Token</div>
                                <div className="mt-2"># Option 3: Bridge USDC from Base Chain</div>
                                <div className="text-gray-500">Use the bridge at /deposit page</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Accounts Section */}
                {walletAddress && (
                    <div
                        className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6"
                        style={{
                            backgroundColor: hexToRgba(colors.accent.success, 0.1),
                            border: `1px solid ${hexToRgba(colors.accent.success, 0.3)}`
                        }}
                    >
                        <h2 className="text-xl font-bold mb-4" style={{ color: colors.accent.success }}>
                            🏦 Test Accounts - Send Tokens to Your Wallet
                        </h2>
                        <div className="text-sm text-gray-300 mb-4">
                            Click "Copy Command" to copy the CLI command, then run it in your terminal where pokerchaind is running.
                        </div>

                        {/* Command Explanation */}
                        <div
                            className="mb-4 p-3 rounded text-xs"
                            style={{
                                backgroundColor: hexToRgba(colors.ui.bgDark, 0.4),
                                border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                            }}
                        >
                            <div className="font-semibold text-white mb-2">📚 Command Breakdown:</div>
                            <div className="space-y-1 text-gray-400 font-mono">
                                <div>
                                    <span className="text-gray-300">pokerchaind tx bank send</span> - Send tokens command
                                </div>
                                <div>
                                    <span className="text-gray-300">[from]</span> - Source account name (alice, bob, etc.)
                                </div>
                                <div>
                                    <span className="text-gray-300">[to]</span> - Your wallet address (destination)
                                </div>
                                <div>
                                    <span className="text-gray-300">[amount][denom]</span> - Amount + token type (10000000b52Token or 50000000usdc)
                                </div>
                                <div>
                                    <span className="text-gray-300">--chain-id pokerchain</span> - Blockchain network ID
                                </div>
                                <div>
                                    <span className="text-gray-300">--keyring-backend test</span> - Use test keyring (for development)
                                </div>
                                <div>
                                    <span className="text-gray-300">-y</span> - Auto-confirm transaction (skip prompt)
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {TEST_ACCOUNTS.map(account => (
                                <div
                                    key={account.address}
                                    className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-white capitalize">{account.name}</span>
                                        <span className="text-xs text-gray-400 font-mono">
                                            {account.address.substring(0, 10)}...{account.address.substring(account.address.length - 6)}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {/* b52Token command */}
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1 font-mono">
                                                pokerchaind tx bank send {account.name} {walletAddress.substring(0, 10)}... 10000000b52Token
                                            </div>
                                            <button
                                                onClick={() => copyCommand(account.name, "b52Token", "10000000")}
                                                className="w-full py-2 px-3 text-xs font-medium rounded transition duration-200 hover:opacity-80"
                                                style={{
                                                    backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.4)}`,
                                                    color: colors.brand.primary
                                                }}
                                            >
                                                📋 Copy: Send 10 b52Token (gas)
                                            </button>
                                        </div>
                                        {/* usdc command */}
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1 font-mono">
                                                pokerchaind tx bank send {account.name} {walletAddress.substring(0, 10)}... 50000000usdc
                                            </div>
                                            <button
                                                onClick={() => copyCommand(account.name, "usdc", "50000000")}
                                                className="w-full py-2 px-3 text-xs font-medium rounded transition duration-200 hover:opacity-80"
                                                style={{
                                                    backgroundColor: hexToRgba(colors.accent.success, 0.2),
                                                    border: `1px solid ${hexToRgba(colors.accent.success, 0.4)}`,
                                                    color: colors.accent.success
                                                }}
                                            >
                                                📋 Copy: Send 50 usdc (poker)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 rounded text-xs" style={{ backgroundColor: hexToRgba(colors.ui.bgDark, 0.4) }}>
                            <div className="text-gray-400">
                                <strong className="text-white">Your address:</strong> <span className="font-mono text-gray-300">{walletAddress}</span>
                            </div>
                            <div className="text-gray-500 mt-2">After running the command, refresh this page to see your new balance.</div>
                        </div>
                    </div>
                )}

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
                            <div className="text-green-400 font-semibold mb-4">✅ Client Initialized</div>
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
                                    <div className="text-yellow-400 text-sm ml-4">⚠️ No tokens found - You need tokens to send transactions!</div>
                                ) : (
                                    <div className="ml-4 space-y-2">
                                        {balances.map((balance, idx) => {
                                            // Format balance with proper decimals (6 for micro-denominated tokens)
                                            const isMicroDenom = balance.denom === "b52Token" || balance.denom === "usdc";
                                            const numericAmount = isMicroDenom ? Number(balance.amount) / 1_000_000 : Number(balance.amount);

                                            const displayAmount = numericAmount.toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 6
                                            });

                                            // For usdc, show USD equivalent
                                            const isUSDC = balance.denom === "usdc";
                                            const usdValue = isUSDC
                                                ? numericAmount.toLocaleString("en-US", {
                                                      style: "currency",
                                                      currency: "USD",
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2
                                                  })
                                                : null;

                                            return (
                                                <div key={idx} className="text-sm">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="font-bold text-lg" style={{ color: colors.accent.success }}>
                                                            {displayAmount}
                                                        </span>
                                                        <span className="text-white font-medium">{balance.denom}</span>
                                                        {usdValue && <span className="text-gray-400 text-sm">≈ {usdValue}</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500 ml-1">
                                                        {Number(balance.amount).toLocaleString("en-US")} micro-units
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                                <div className="space-y-3 mb-3">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
                                        <input
                                            type="text"
                                            placeholder="b521..."
                                            value={recipientAddress}
                                            onChange={e => setRecipientAddress(e.target.value)}
                                            className="w-full p-2 rounded-lg text-white"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">
                                            Amount (micro-units)
                                            {sendAmount && (
                                                <span className="ml-2 text-xs" style={{ color: colors.accent.success }}>
                                                    = {(Number(sendAmount) / 1_000_000).toFixed(6)} {sendDenom}
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="1000000"
                                            value={sendAmount}
                                            onChange={e => setSendAmount(e.target.value)}
                                            className="w-full p-2 rounded-lg text-white"
                                            style={inputStyle}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Example: 1000000 = 1 {sendDenom}, 10000 = 0.01 {sendDenom}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Token Type</label>
                                        <select
                                            value={sendDenom}
                                            onChange={e => setSendDenom(e.target.value)}
                                            className="w-full p-2 rounded-lg text-white"
                                            style={inputStyle}
                                        >
                                            <option value="usdc">usdc (poker tokens)</option>
                                            <option value="b52Token">b52Token (gas tokens)</option>
                                        </select>
                                    </div>
                                </div>
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
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Game Type</label>
                                    <select
                                        value={gameType}
                                        onChange={e => setGameType(e.target.value)}
                                        className="w-full p-2 rounded-lg text-white"
                                        style={inputStyle}
                                    >
                                        <option value="sit-and-go">Sit & Go</option>
                                        <option value="texas-holdem">Texas Hold"em</option>
                                        <option value="omaha">Omaha</option>
                                        <option value="seven-card-stud">Seven Card Stud</option>
                                    </select>
                                </div>
                                <input
                                    type="number"
                                    placeholder="Timeout (seconds)"
                                    value={timeout}
                                    onChange={e => setTimeout(Number(e.target.value))}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="number"
                                    placeholder="Min Players"
                                    value={minPlayers}
                                    onChange={e => setMinPlayers(Number(e.target.value))}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />
                                <input
                                    type="number"
                                    placeholder="Max Players"
                                    value={maxPlayers}
                                    onChange={e => setMaxPlayers(Number(e.target.value))}
                                    className="p-2 rounded-lg text-white"
                                    style={inputStyle}
                                />

                                {/* Conditional rendering based on game type */}
                                {gameType === "sit-and-go" ? (
                                    // Sit & Go / Tournament: single buy-in
                                    <div className="col-span-2">
                                        <label className="block text-sm text-gray-400 mb-1">Tournament Buy-In (usdc micro-units)</label>
                                        <input
                                            type="text"
                                            placeholder="10000000"
                                            value={sitAndGoBuyIn}
                                            onChange={e => setSitAndGoBuyIn(e.target.value)}
                                            className="w-full p-2 rounded-lg text-white"
                                            style={inputStyle}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">10,000,000 = 10 usdc (your balance: 50 usdc)</p>
                                    </div>
                                ) : (
                                    // Cash Game: min/max buy-in range
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Min Buy-In"
                                            value={minBuyIn}
                                            onChange={e => setMinBuyIn(e.target.value)}
                                            className="p-2 rounded-lg text-white"
                                            style={inputStyle}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Max Buy-In"
                                            value={maxBuyIn}
                                            onChange={e => setMaxBuyIn(e.target.value)}
                                            className="p-2 rounded-lg text-white"
                                            style={inputStyle}
                                        />
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Small Blind (usdc micro-units)</label>
                                    <input
                                        type="text"
                                        placeholder="100000"
                                        value={smallBlind}
                                        onChange={e => setSmallBlind(e.target.value)}
                                        className="w-full p-2 rounded-lg text-white"
                                        style={inputStyle}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">100,000 = 0.1 usdc</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Big Blind (usdc micro-units)</label>
                                    <input
                                        type="text"
                                        placeholder="200000"
                                        value={bigBlind}
                                        onChange={e => setBigBlind(e.target.value)}
                                        className="w-full p-2 rounded-lg text-white"
                                        style={inputStyle}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">200,000 = 0.2 usdc</p>
                                </div>
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
                            <div className="space-y-3 mb-3">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Game ID (from createGame transaction)</label>
                                    <input
                                        type="text"
                                        placeholder="0x645d17cae33d8832e38cb16639983d2239631356d60e3656d54036f7792b13ed"
                                        value={gameId}
                                        onChange={e => setGameId(e.target.value)}
                                        className="w-full p-2 rounded-lg text-white"
                                        style={inputStyle}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Seat Number (0-5)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={seat}
                                            onChange={e => setSeat(Number(e.target.value))}
                                            className="w-full p-2 rounded-lg text-white"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Buy-In Amount (usdc micro-units)</label>
                                        <input
                                            type="text"
                                            placeholder="10000000"
                                            value={buyInAmount}
                                            onChange={e => setBuyInAmount(e.target.value)}
                                            className="w-full p-2 rounded-lg text-white"
                                            style={inputStyle}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">10,000,000 = 10 usdc (must match game's buy-in)</p>
                                    </div>
                                </div>
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
                            <div className="space-y-3 mb-3">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Game ID (same as joinGame)</label>
                                    <input
                                        type="text"
                                        placeholder="0x645d17cae33d8832e38cb16639983d2239631356d60e3656d54036f7792b13ed"
                                        value={gameId}
                                        onChange={e => setGameId(e.target.value)}
                                        className="w-full p-2 rounded-lg text-white"
                                        style={inputStyle}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Action Type</label>
                                        <select
                                            value={action}
                                            onChange={e => setAction(e.target.value)}
                                            className="w-full p-2 rounded-lg text-white"
                                            style={inputStyle}
                                        >
                                            <option value="fold">Fold</option>
                                            <option value="call">Call</option>
                                            <option value="raise">Raise</option>
                                            <option value="bet">Bet</option>
                                            <option value="check">Check</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Amount (0 for fold/check)</label>
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={actionAmount}
                                            onChange={e => setActionAmount(e.target.value)}
                                            className="w-full p-2 rounded-lg text-white"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={testPerformAction}
                                className="w-full py-2 px-4 text-white font-bold rounded-lg"
                                style={{ background: colors.accent.withdraw }}
                            >
                                Test Perform Action
                            </button>
                        </div>

                        {/* queryGames() */}
                        <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6" style={containerStyle}>
                            <h3 className="text-xl font-bold text-white mb-4">7. queryGames()</h3>
                            <p className="text-gray-400 text-sm mb-4">Query all games from the blockchain</p>
                            <button
                                onClick={testQueryGames}
                                className="w-full py-2 px-4 text-white font-bold rounded-lg"
                                style={{ background: colors.brand.primary }}
                            >
                                Test Query Games
                            </button>
                        </div>

                        {/* queryGameState() */}
                        <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6" style={containerStyle}>
                            <h3 className="text-xl font-bold text-white mb-4">8. queryGameState()</h3>
                            <div className="space-y-3 mb-3">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Game ID (from createGame or list)</label>
                                    <input
                                        type="text"
                                        placeholder="0x..."
                                        value={gameId}
                                        onChange={e => setGameId(e.target.value)}
                                        className="w-full p-2 rounded-lg text-white"
                                        style={inputStyle}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Same Game ID used above</p>
                                </div>
                            </div>
                            <button
                                onClick={testQueryGameState}
                                className="w-full py-2 px-4 text-white font-bold rounded-lg"
                                style={{ background: colors.brand.primary }}
                            >
                                Test Query Game State
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
                                                result.status === "success" ? "text-green-400" : result.status === "error" ? "text-red-400" : "text-yellow-400"
                                            }`}
                                        >
                                            {result.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm mb-2">{result.message}</p>
                                    {result.txHash && <p className="text-xs font-mono text-gray-400">Tx: {result.txHash}</p>}
                                    {result.data && <pre className="text-xs text-gray-400 mt-2 overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
