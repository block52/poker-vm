#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const crypto_1 = __importDefault(require("crypto"));
const ethers_1 = require("ethers");
const ethers_2 = require("ethers");
const block52_1 = require("@bitcoinbrisbane/block52");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Default contract address on L2
let defaultTableAddress = "0x22dfa2150160484310c5163f280f49e23b8fd34326";
let node = process.env.NODE_URL || "http://localhost:3000"; // "https://node1.block52.xyz";
let nonce = 0;
let _node;
// Get command line arguments
const args = process.argv.slice(2);
// Check if a private key was provided as a command-line argument
let pk = "";
if (args.length > 0) {
    const potentialKey = args[0].startsWith("0x") ? args[0] : `0x${args[0]}`;
    try {
        // Validate the key by creating a wallet
        const wallet = new ethers_1.Wallet(potentialKey);
        pk = potentialKey;
        console.log(chalk_1.default.green("Private key set from command line arguments"));
        console.log(chalk_1.default.cyan(`Address: ${wallet.address}`));
    }
    catch (error) {
        console.log(chalk_1.default.red("Invalid private key provided as argument. Will try environment variable."));
    }
}
// If no valid key from command line, try environment variable
if (!pk) {
    if (process.env.PRIVATE_KEY) {
        console.log(chalk_1.default.green("Private key set from environment variable"));
        pk = process.env.PRIVATE_KEY;
    }
    else {
        console.log(chalk_1.default.red("No private key found in environment variable"));
    }
}
const getClient = () => {
    if (_node) {
        return _node;
    }
    _node = new block52_1.NodeRpcClient(node, pk);
    return _node;
};
const getAddress = () => {
    // If we have a valid private key, set the address
    if (pk) {
        try {
            const wallet = new ethers_1.Wallet(pk);
            return wallet.address;
        }
        catch (error) {
            // Invalid key format - will be handled in the interactive menu
        }
    }
    throw new Error("No valid private key found");
};
const getPublicKeyDetails = (privateKey) => {
    try {
        // Create wallet from private key
        const wallet = new ethers_2.ethers.Wallet(privateKey);
        // Get the different components
        const publicKey = wallet.signingKey.publicKey; // Full public key (65 bytes)
        const compressedPublicKey = wallet.signingKey.compressedPublicKey; // Compressed public key (33 bytes)
        const address = wallet.address; // Ethereum address (20 bytes)
        return publicKey;
        // console.log("\nKey Details:");
        // console.log("------------");
        // console.log("Private Key:", privateKey);
        // console.log("\nPublic Key (uncompressed):", publicKey);
        // console.log("Public Key Length:", ethers.getBytes(publicKey).length, "bytes");
        // console.log("\nPublic Key (compressed):", compressedPublicKey);
        // console.log("Compressed Public Key Length:", ethers.getBytes(compressedPublicKey).length, "bytes");
        // console.log("\nEthereum Address:", address);
        // console.log("Address Length:", ethers.getBytes(address).length, "bytes");
        // console.log("\nRelationship:");
        // console.log("-------------");
        // console.log("1. Private Key → Public Key: Generated using elliptic curve cryptography");
        // console.log("2. Public Key → Address: Keccak256 hash of public key, take last 20 bytes");
    }
    catch (error) {
        console.error("Error:", error);
        throw new Error("Invalid private key");
    }
};
/**
 * Parse command with parameters
 * Handles input like "join 0x00" or "bet 5.5"
 * @param input User input string
 * @returns Object with command and params
 */
const parseCommand = (input) => {
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const params = parts.slice(1);
    return { command, params };
};
const createPrivateKey = async () => {
    // Generate a new ed25519 key pair
    const { privateKey, publicKey } = crypto_1.default.generateKeyPairSync("ed25519");
    console.log(chalk_1.default.green("Private key:"));
    // Export the private key in DER format and convert to hex
    pk = privateKey
        .export({
        type: "pkcs8",
        format: "der"
    })
        .toString("hex");
    console.log(pk);
    console.log(chalk_1.default.green("Public key:"));
    console.log(publicKey.export({ type: "spki", format: "pem" }).toString());
};
const syncNonce = async (address) => {
    const rpcClient = getClient();
    const response = await rpcClient.getAccount(address);
    if (response) {
        nonce = response?.nonce || 0;
    }
};
const join = async (tableAddress, amount) => {
    const rpcClient = getClient();
    const response = await rpcClient.playerJoin(tableAddress, amount, nonce);
    // console.log(chalk.green("Join response:"), response.hash);
    return response.hash;
};
const getGameState = async (tableAddress) => {
    const rpcClient = getClient();
    const dto = await rpcClient.getGameState(tableAddress);
    return dto;
};
const getAccount = async (address) => {
    const rpcClient = getClient();
    const response = await rpcClient.getAccount(address);
    if (response) {
        nonce = response?.nonce || 0;
    }
    return response;
};
// // Convert card number to readable format
// const cardToString = (card: number): string => {
//     if (card === 0) return "🂠"; // Back of card for hidden cards
//     const suits = ["♠", "♥", "♦", "♣"];
//     const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
//     // Card numbers are 1-indexed, with 1-13 being spades, 14-26 being hearts, etc.
//     const suitIndex = Math.floor((card - 1) / 13);
//     const rankIndex = (card - 1) % 13;
//     const suit = suits[suitIndex] || "?";
//     const rank = ranks[rankIndex] || "?";
//     // Color hearts and diamonds in red
//     if (suitIndex === 1 || suitIndex === 2) {
//         return chalk.red(`${rank}${suit}`);
//     }
//     return `${rank}${suit}`;
// };
// Convert card number to readable format
const renderCard = (mnemonic) => {
    if (!mnemonic)
        return "🂠"; // Back of card for hidden cards
    // const suits = ["♠", "♥", "♦", "♣"];
    // const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const match = mnemonic.match(/^([AJQKajqk]|[0-9]+)([CDHS])$/i);
    if (!match) {
        throw new Error(`Invalid card mnemonic: ${mnemonic}`);
    }
    const rank = match[1].toUpperCase();
    const suitChar = match[2].toUpperCase();
    // Convert suit character to SUIT enum
    let suit = "";
    switch (suitChar) {
        case "C":
            suit = "♣";
            break;
        case "D":
            suit = "♦";
            break;
        case "H":
            suit = "♥";
            break;
        case "S":
            suit = "♠";
            break;
        default:
            throw new Error(`Invalid suit character: ${suitChar}`);
    }
    // Color hearts and diamonds in red
    if (suit === "♦" || suit === "♥") {
        return chalk_1.default.red(`${rank}${suit}`);
    }
    return `${rank}${suit}`;
};
// Format chips from wei (10^18) to readable format
const formatChips = (chipString) => {
    // Convert from string to number, then divide by 10^18
    try {
        const chips = parseFloat(chipString) / Math.pow(10, 18);
        return chips.toFixed(2);
    }
    catch (e) {
        return "0.00";
    }
};
// Helper to determine which positions players are in
const getPlayerPositionMarker = (seat, state) => {
    let nextToAct = seat === state.nextToAct ? " *" : "";
    if (seat === state.dealer)
        return `D${nextToAct}`;
    if (seat === state.smallBlindPosition)
        return `SB${nextToAct}`;
    if (seat === state.bigBlindPosition)
        return `BB${nextToAct}`;
    return nextToAct;
};
const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
// Display game state as a table
const renderGameState = (state, publicKey) => {
    // Find my player
    const myPlayer = state.players.find(p => p.address === publicKey);
    console.log(chalk_1.default.cyan("=".repeat(60)));
    console.log(chalk_1.default.cyan(`My Public Key: ${publicKey.substring(0, 8)}...${publicKey.substring(publicKey.length - 6)}`));
    console.log(chalk_1.default.green(`My Chips: ${myPlayer ? formatChips(myPlayer.stack) : "0.00"}`));
    console.log(chalk_1.default.cyan("=".repeat(60)));
    // Game info
    console.log(chalk_1.default.yellow(`Game Type: ${state.type} | Round: ${state.round} | Blinds: ${formatChips(state.smallBlind)}/${formatChips(state.bigBlind)}`));
    // Community cards
    let communityCardsStr = "Board: ";
    if (state.communityCards.length === 0) {
        communityCardsStr += "No cards yet";
    }
    else {
        communityCardsStr += state.communityCards.map(card => renderCard(card)).join(" ");
    }
    console.log(chalk_1.default.white(communityCardsStr));
    // Pot information
    console.log(chalk_1.default.magenta(`Pot${state.pots.length > 1 ? "s" : ""}: ${state.pots.map(pot => formatChips(pot)).join(" + ")}`));
    // Display table with players
    console.log(chalk_1.default.cyan("\nPlayers:"));
    console.log(chalk_1.default.cyan("-".repeat(80)));
    console.log(chalk_1.default.cyan("Seat".padEnd(6)) +
        // chalk.cyan("Position".padEnd(10)) +
        chalk_1.default.cyan("Address".padEnd(20)) +
        chalk_1.default.cyan("Chips".padEnd(12)) +
        chalk_1.default.cyan("Bet".padEnd(12)) +
        chalk_1.default.cyan("Cards".padEnd(15)) +
        chalk_1.default.cyan("Status"));
    console.log(chalk_1.default.cyan("-".repeat(80)));
    // Sort players by seat index
    const sortedPlayers = [...state.players].sort((a, b) => a.seat - b.seat);
    for (const player of sortedPlayers) {
        const isMyPlayer = player.address === publicKey;
        const isNextPlayer = player.seat === state.nextToAct;
        // Highlight my player in green, next to act with an asterisk
        const rowStyle = isMyPlayer ? chalk_1.default.green : (isNextPlayer ? chalk_1.default.yellow : chalk_1.default.white);
        // Format player cards - show only if it's my player or we're at showdown
        let cardsDisplay = "";
        if (player.holeCards) {
            if (isMyPlayer || state.round === "showdown") {
                // Show actual cards if they're mine or we're at showdown
                cardsDisplay = player.holeCards.map(card => renderCard(card)).join(" ");
            }
            else {
                // Otherwise show back of cards
                cardsDisplay = "🂠 🂠";
            }
        }
        const marker = getPlayerPositionMarker(player.seat, state);
        const seat = `${player.seat} ${marker}`;
        const bet = player?.sumOfBets || "0";
        console.log(rowStyle(String(seat).padEnd(6) +
            // getPlayerPosition(player.seat, state).padEnd(10) +
            (shortenAddress(player.address)).padEnd(20) +
            formatChips(player.stack).padEnd(12) +
            formatChips(bet).padEnd(12) +
            cardsDisplay.padEnd(15) +
            player.status));
    }
    // Show winners if available
    if (state.winners && state.winners.length > 0) {
        console.log(chalk_1.default.cyan("\nWinners:"));
        console.log(chalk_1.default.cyan("-".repeat(50)));
        for (const winner of state.winners) {
            // const player = state.players.find(p => p.seat === winner.address);
            // if (player) {
            //     console.log(
            //         chalk.green(`Seat ${winner.playerIndex} (${player.address.substring(0, 6)}...) won ${formatChips(winner.amount)} with ${winner.handName}`)
            //     );
            // }
        }
    }
    console.log(chalk_1.default.cyan("=".repeat(60)));
};
const interactiveAction = async () => {
    console.log(chalk_1.default.yellow("Welcome to the interactive CLI tool!"));
    // Check node connectivity
    console.log(chalk_1.default.yellow(`Checking for node at ${node}...`));
    try {
        const response = await fetch(node);
        const text = await response.text();
        if (text.includes("PVM RPC Server")) {
            console.log(chalk_1.default.green("✓ Node is running"));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red("✗ Cannot connect to node at", node));
    }
    console.log(chalk_1.default.yellow("Checking for private key in PRIVATE_KEY environment variable..."));
    let address = getAddress();
    let continueSession = true;
    while (continueSession) {
        const { userInput } = await inquirer_1.default.prompt([
            {
                type: "list",
                name: "userInput",
                message: "What would you like to do?",
                choices: [
                    { name: "Join a game", value: "join_game" },
                    { name: "Leave game", value: "leave_game" },
                    { name: "Create an account", value: "new_account" },
                    { name: "Import a private key", value: "import_key" },
                    { name: "Get account", value: "get_account" },
                    { name: "Create a game (coming soon)", value: "create_game" },
                    { name: "Game state", value: "state" },
                    { name: "Exit", value: "exit" }
                ]
            }
        ]);
        const { command, params } = parseCommand(userInput);
        switch (command) {
            case "new_account":
                // console.log(chalk.green("Hello!"));
                createPrivateKey();
                break;
            case "import_key":
                const { privateKey } = await inquirer_1.default.prompt([
                    {
                        type: "input",
                        name: "privateKey",
                        message: "Enter your private key:"
                    }
                ]);
                try {
                    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
                    console.log(chalk_1.default.yellow("Attempting to use key:", formattedKey));
                    const wallet = new ethers_1.Wallet(formattedKey);
                    pk = formattedKey;
                    address = wallet.address;
                    console.log(chalk_1.default.green("Private key imported successfully!"));
                    console.log(chalk_1.default.cyan(`Address: ${address}`));
                }
                catch (error) {
                    console.error(chalk_1.default.red("Invalid private key format:", error.message));
                    console.error(chalk_1.default.yellow("Debug info:"));
                    console.error(chalk_1.default.yellow("Key length:", privateKey.length));
                    console.error(chalk_1.default.yellow("Key:", privateKey));
                }
                break;
            case "get_account":
                try {
                    const response = await getAccount(address);
                    if (response) {
                        console.log(chalk_1.default.green("Account found:"));
                        console.log(chalk_1.default.cyan(JSON.stringify(response, null, 2)));
                    }
                    else {
                        console.log(chalk_1.default.red("No account found"));
                        console.log(chalk_1.default.yellow("Hint: You need to create or import an account first"));
                    }
                }
                catch (error) {
                    console.error(chalk_1.default.red("Failed to fetch account:"), error.message);
                }
                break;
            case "state":
                try {
                    console.log(chalk_1.default.yellow("Fetching game state..."));
                    const { tableAddress: inputAddress } = await inquirer_1.default.prompt([
                        {
                            type: "input",
                            name: "tableAddress",
                            message: "Enter table address (leave empty for default table):",
                            default: defaultTableAddress
                        }
                    ]);
                    const tableAddress = inputAddress.trim() ? inputAddress : ethers_2.ethers.ZeroAddress;
                    console.log(chalk_1.default.yellow(tableAddress === ethers_2.ethers.ZeroAddress
                        ? "No table address provided, using default table (0x0000...0000)"
                        : `Using table address: ${tableAddress}`));
                    const state = await getGameState(tableAddress);
                    renderGameState(state, address);
                    // // Add these lines to show raw state
                    // console.log(chalk.cyan("\nRaw game state:"));
                    // console.log(chalk.cyan(JSON.stringify(state, null, 2)));
                    // console.log(chalk.cyan("============================================================\n"));
                    // if (!state) {
                    //     console.log(chalk.red("No active game found"));
                    //     console.log(chalk.yellow("Using default table state"));
                    //     break;
                    // }
                    // if (!state.players) {
                    //     console.log(chalk.red("Invalid game state received"));
                    //     console.log(chalk.yellow("Game state:", JSON.stringify(state, null, 2)));
                    //     break;
                    // }
                    // // renderGameState(state, address); // address here is still user's address for display
                    // await pokerInteractiveAction();
                }
                catch (error) {
                    console.error(chalk_1.default.red("Failed to fetch game state:"), error.message);
                    console.log(chalk_1.default.yellow("Make sure you're connected to the correct node"));
                }
                break;
            case "join_game":
                try {
                    console.log(chalk_1.default.yellow(`Getting table state for ${defaultTableAddress}...`));
                    const gameState = await getGameState(defaultTableAddress);
                    const myPlayer = gameState.players.find(p => p.address === address);
                    if (myPlayer) {
                        console.log(chalk_1.default.green("You are already seated at this table!"));
                        console.log(chalk_1.default.cyan("Your stack:"), formatChips(myPlayer.stack));
                        renderGameState(gameState, address);
                        await pokerInteractiveAction(defaultTableAddress, address);
                        break;
                    }
                    // console.log(chalk.cyan("Current table state:"));
                    // console.log(chalk.cyan(JSON.stringify(gameState, null, 2)));
                    // Table stakes
                    const minBuyIn = 1000000000000000000n; // 1 USDC
                    const maxBuyIn = 5000000000000000000n; // 5 USDC
                    const { buyInAmount } = await inquirer_1.default.prompt([
                        {
                            type: "input",
                            name: "buyInAmount",
                            message: `Enter buy-in amount in USDC (minimum: 1.00 USDC, maximum: 5.00 USDC):`,
                            default: "3.0", // Default to 3 USDC
                            validate: input => {
                                try {
                                    const amount = ethers_2.ethers.parseEther(input);
                                    if (amount < minBuyIn)
                                        return `Must be at least 1.00 USDC`;
                                    if (amount > maxBuyIn)
                                        return `Must be at most 5.00 USDC`;
                                    return true;
                                }
                                catch (error) {
                                    return "Please enter a valid number";
                                }
                            }
                        }
                    ]);
                    const buyInWei = ethers_2.ethers.parseEther(buyInAmount);
                    console.log(chalk_1.default.yellow(`Attempting to join game with ${buyInAmount} USDC...`));
                    const result = await join(defaultTableAddress, buyInWei);
                    if (result) {
                        console.log(chalk_1.default.cyan("Response:"), result);
                        await pokerInteractiveAction(defaultTableAddress, address);
                    }
                }
                catch (error) {
                    console.error(chalk_1.default.red("Failed to join game:"), error.message);
                }
                break;
            case "leave_game":
                try {
                    console.log(chalk_1.default.yellow(`Getting table state for ${defaultTableAddress}...`));
                    const gameState = await getGameState(defaultTableAddress);
                    const myPlayer = gameState.players.find(p => p.address === address);
                    if (!myPlayer) {
                        console.log(chalk_1.default.red("You are not seated at this table!"));
                        break;
                    }
                    console.log(chalk_1.default.yellow(`Attempting to leave game...`));
                    const result = await leave(defaultTableAddress);
                    if (result) {
                        console.log(chalk_1.default.green("Successfully left the game"));
                        console.log(chalk_1.default.cyan("Response:"), result);
                    }
                }
                catch (error) {
                    console.error(chalk_1.default.red("Failed to leave game:"), error.message);
                }
                break;
            case "exit":
                continueSession = false;
                console.log(chalk_1.default.yellow("Goodbye!"));
                break;
        }
        if (continueSession) {
            const { continue: shouldContinue } = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "continue",
                    message: "Would you like to perform another action?",
                    default: true
                }
            ]);
            continueSession = shouldContinue;
            if (!shouldContinue) {
                console.log(chalk_1.default.yellow("Good luck!"));
            }
        }
    }
};
const getLegalActions = async (tableAddress, address) => {
    const actions = [];
    actions.push({ action: "Exit", value: "exit" });
    const client = getClient();
    const state = await client.getGameState(tableAddress);
    if (!state) {
        console.log(chalk_1.default.red("No active game found"));
        return actions;
    }
    // Find my seat
    const myPlayer = state.players.find(p => p.address === address);
    if (!myPlayer) {
        console.log(chalk_1.default.red("You are not seated at this table"));
        return actions;
    }
    // if (state.nextToAct !== myPlayer.seat) {
    //     console.log(chalk.red("It's not your turn to act"));
    //     return actions;
    // }
    // if (state.round === TexasHoldemRound.PREFLOP) {
    //     if (state.smallBlindPosition === myPlayer.seat) {
    //         actions.push({ action: "Post Small Blind", value: "smallblind" });
    //     }
    //     if (state.bigBlindPosition === myPlayer.seat) {
    //         actions.push({ action: "Post Big Blind", value: "bigblind" });
    //     }
    // }
    for (const legalAction of myPlayer.legalActions) {
        const action = legalAction.action;
        actions.push({ action, value: legalAction.action });
    }
    return actions;
};
const pokerInteractiveAction = async (tableAddress, address) => {
    const client = getClient();
    let continueSession = true;
    while (continueSession) {
        const state = await getGameState(tableAddress);
        renderGameState(state, address);
        // todo: call node to get legal actions
        const actions = await getLegalActions(tableAddress, address);
        actions.push({ action: "Refresh", value: "refresh" });
        const { action } = await inquirer_1.default.prompt([
            {
                type: "list",
                name: "action",
                message: "What would you like to do?",
                choices: actions.map(a => ({ name: a.action, value: a.value }))
            }
        ]);
        switch (action) {
            case "check":
                console.log(chalk_1.default.green("Checking..."));
                await client.playerAction(tableAddress, block52_1.PlayerActionType.CHECK, "", nonce);
                break;
            case "post small blind":
                console.log(chalk_1.default.green("Posting small blind..."));
                await client.playerAction(tableAddress, block52_1.PlayerActionType.SMALL_BLIND, "", nonce);
                break;
            case "post big blind":
                console.log(chalk_1.default.green("Posting big blind..."));
                await client.playerAction(tableAddress, block52_1.PlayerActionType.BIG_BLIND, "", nonce);
                break;
            case "bet":
                console.log(chalk_1.default.green("Betting..."));
                await client.playerAction(tableAddress, block52_1.PlayerActionType.BET, "", nonce);
                break;
            case "call":
                console.log(chalk_1.default.green("Calling..."));
                await client.playerAction(tableAddress, block52_1.PlayerActionType.CALL, "", nonce);
                break;
            case "deal":
                console.log(chalk_1.default.green("Deal..."));
                // use native crypto functions to generate a seed
                const seed = crypto_1.default.randomBytes(32).toString("hex");
                const publicKey = getPublicKeyDetails(pk);
                await client.deal(tableAddress, seed, publicKey);
                break;
            case "fold":
                console.log(chalk_1.default.green("Folding..."));
                await client.playerAction(tableAddress, block52_1.PlayerActionType.FOLD, "", nonce);
                break;
            case "raise":
                console.log(chalk_1.default.green("Raising..."));
                break;
            case "all-in":
                console.log(chalk_1.default.green("Going all-in..."));
                break;
            case "refresh":
                // Will refresh game state anyway
                console.log(chalk_1.default.green("Refreshing game state..."));
                break;
            case "exit":
                continueSession = false;
                console.log(chalk_1.default.yellow("Goodbye!"));
                break;
        }
        await syncNonce(address);
    }
};
const leave = async (tableAddress) => {
    const rpcClient = getClient();
    // First get the game state to check player's stack
    const state = await getGameState(tableAddress);
    const address = getAddress();
    const player = state.players.find(p => p.address === address);
    if (!player) {
        throw new Error("Player not found at table");
    }
    const stack = BigInt(player.stack);
    const response = await rpcClient.playerLeave(tableAddress, stack, nonce);
    return response.hash;
};
interactiveAction();
