#!/usr/bin/env node
import chalk from "chalk";
import inquirer from "inquirer";
import crypto from "crypto";
import { Wallet } from "ethers";
import { ethers } from "ethers";

import { TexasHoldemGameStateDTO, NodeRpcClient, TexasHoldemStateDTO, TexasHoldemRound } from "@bitcoinbrisbane/block52";

import dotenv from "dotenv";
dotenv.config();

let pk = process.env.PRIVATE_KEY || "";
let address = "0xd5caa0c159a708c34255a58fc26a16567b66e3fb24";
let node = process.env.NODE_URL || "http://localhost:3000"; // "https://node1.block52.xyz";
let nonce: number = 0;

const createPrivateKey = async () => {
    // Generate a new ed25519 key pair
    const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
    console.log(chalk.green("Private key:"));

    // Export the private key in DER format and convert to hex
    pk = privateKey
        .export({
            type: "pkcs8",
            format: "der"
        })
        .toString("hex");

    console.log(pk);
    console.log(chalk.green("Public key:"));
    console.log(publicKey.export({ type: "spki", format: "pem" }).toString());
};

const syncNonce = async () => {
    const rpcClient = new NodeRpcClient(node, pk);
    const response = await rpcClient.getAccount(address);

    if (response) {
        nonce = response?.nonce || 0;
    }
};

const join = async (address: string, amount: bigint): Promise<void> => {
    const rpcClient = new NodeRpcClient(node, pk);
    await rpcClient.playerJoin(address);
};

const getGameState = async (address: string): Promise<TexasHoldemGameStateDTO> => {
    const rpcClient = new NodeRpcClient(node, pk);
    const dto = await rpcClient.getGameState(address);

    const state = dto as TexasHoldemGameStateDTO;
    return state;
};

const getAccount = async (address: string): Promise<any> => {
    const rpcClient = new NodeRpcClient(node, pk);
    const response = await rpcClient.getAccount(address);

    if (response) {
        nonce = response?.nonce || 0;
    }

    return response;
};

// Convert card number to readable format
const cardToString = (card: number): string => {
    if (card === 0) return "🂠"; // Back of card for hidden cards

    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

    // Card numbers are 1-indexed, with 1-13 being spades, 14-26 being hearts, etc.
    const suitIndex = Math.floor((card - 1) / 13);
    const rankIndex = (card - 1) % 13;

    const suit = suits[suitIndex] || "?";
    const rank = ranks[rankIndex] || "?";

    // Color hearts and diamonds in red
    if (suitIndex === 1 || suitIndex === 2) {
        return chalk.red(`${rank}${suit}`);
    }

    return `${rank}${suit}`;
};

// Format chips from wei (10^18) to readable format
const formatChips = (chipString: string): string => {
    // Convert from string to number, then divide by 10^18
    try {
        const chips = parseFloat(chipString) / Math.pow(10, 18);
        return chips.toFixed(2);
    } catch (e) {
        return "0.00";
    }
};

// Helper to determine which positions players are in
const getPlayerPosition = (playerIndex: number, state: TexasHoldemGameStateDTO): string => {
    if (playerIndex === state.dealer) return "D";
    if (playerIndex === state.smallBlindPosition) return "SB";
    if (playerIndex === state.bigBlindPosition) return "BB";
    return "";
};

// Display game state as a table
const displayGameState = (state: TexasHoldemGameStateDTO, myPublicKey: string): void => {
    // Find my player
    const myPlayer = state.players.find(p => p.address === myPublicKey);

    console.log(chalk.cyan("=".repeat(60)));
    console.log(chalk.cyan(`My Public Key: ${myPublicKey.substring(0, 8)}...${myPublicKey.substring(myPublicKey.length - 6)}`));
    console.log(chalk.green(`My Chips: ${myPlayer ? formatChips(myPlayer.stack) : "0.00"}`));
    console.log(chalk.cyan("=".repeat(60)));

    // Game info
    console.log(chalk.yellow(`Game Type: ${state.type} | Round: ${state.round} | Blinds: ${formatChips(state.smallBlind)}/${formatChips(state.bigBlind)}`));

    // Community cards
    let communityCardsStr = "Board: ";
    if (state.communityCards.length === 0) {
        communityCardsStr += "No cards yet";
    } else {
        communityCardsStr += state.communityCards.map(card => cardToString(card)).join(" ");
    }
    console.log(chalk.white(communityCardsStr));

    // Pot information
    console.log(chalk.magenta(`Pot${state.pots.length > 1 ? "s" : ""}: ${state.pots.map(pot => formatChips(pot)).join(" + ")}`));

    // Display table with players
    console.log(chalk.cyan("\nPlayers:"));
    console.log(chalk.cyan("-".repeat(80)));
    console.log(
        chalk.cyan("Seat").padEnd(6) +
            chalk.cyan("Position").padEnd(10) +
            chalk.cyan("Address").padEnd(20) +
            chalk.cyan("Chips").padEnd(12) +
            chalk.cyan("Bet").padEnd(12) +
            chalk.cyan("Cards").padEnd(15) +
            chalk.cyan("Status")
    );
    console.log(chalk.cyan("-".repeat(80)));

    // Sort players by seat index
    const sortedPlayers = [...state.players].sort((a, b) => a.seat - b.seat);

    for (const player of sortedPlayers) {
        const isNextToAct = player.seat === state.nextToAct;
        const isMyPlayer = player.address === myPublicKey;

        // Highlight current player
        const rowStyle = isNextToAct ? chalk.green : isMyPlayer ? chalk.yellow : chalk.white;

        let status = "";
        if (player.status) status = "Folded";
        else if (player.status) status = "All-In";
        else if (isNextToAct) status = "Action";

        // Format player cards - show only if it's my player or we're at showdown
        let cardsDisplay = "";
        if (isMyPlayer || state.round === "showdown") {
            if (player.holeCards) {
                cardsDisplay = player.holeCards?.map(card => cardToString(card)).join(" ");
            }
        } else {
            cardsDisplay = "🂠 🂠"; // Back of cards
        }

        console.log(
            rowStyle(
                String(player.seat).padEnd(6) +
                    getPlayerPosition(player.seat, state).padEnd(10) +
                    (player.address.substring(0, 6) + "...").padEnd(20) +
                    formatChips(player.stack).padEnd(12) +
                    // formatChips(player.bet).padEnd(12) +
                    cardsDisplay.padEnd(15) +
                    status
            )
        );
    }

    // Show winners if available
    if (state.winners && state.winners.length > 0) {
        console.log(chalk.cyan("\nWinners:"));
        console.log(chalk.cyan("-".repeat(50)));
        for (const winner of state.winners) {
            // const player = state.players.find(p => p.seat === winner.address);
            // if (player) {
            //     console.log(
            //         chalk.green(`Seat ${winner.playerIndex} (${player.address.substring(0, 6)}...) won ${formatChips(winner.amount)} with ${winner.handName}`)
            //     );
            // }
        }
    }

    console.log(chalk.cyan("=".repeat(60)));
};

const interactiveAction = async () => {
    console.log(chalk.yellow("Welcome to the interactive CLI tool!"));

    // Check node connectivity
    console.log(chalk.yellow(`Checking for node at ${node}...`));
    try {
        const response = await fetch(node);
        const text = await response.text();
        if (text.includes("PVM RPC Server")) {
            console.log(chalk.green("✓ Node is running"));
        }
    } catch (error) {
        console.log(chalk.red("✗ Cannot connect to node at", node));
    }

    console.log(chalk.yellow("Checking for private key in PRIVATE_KEY environment variable..."));

    if (process.env.PRIVATE_KEY) {
        try {
            const wallet = new Wallet(process.env.PRIVATE_KEY);
            console.log(chalk.green("✓ Found valid private key"));
            console.log(chalk.cyan(`Current active address: ${wallet.address}`));
        } catch (error) {
            console.log(chalk.red("✗ Invalid private key found in PRIVATE_KEY"));
        }
    } else {
        console.log(chalk.yellow("✗ No private key found in PRIVATE_KEY"));
    }

    let continueSession = true;
    while (continueSession) {
        const { action } = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message: "What would you like to do?",
                choices: [
                    { name: "Create an account", value: "new_account" },
                    { name: "Import a private key", value: "import_key" },
                    { name: "Get account", value: "get_account" },
                    { name: "Create a game (coming soon)", value: "create_game" },
                    { name: "Join a game", value: "join_game" },
                    { name: "Status", value: "status" },
                    { name: "Exit", value: "exit" }
                ]
            }
        ]);

        switch (action) {
            case "new_account":
                // console.log(chalk.green("Hello!"));
                createPrivateKey();
                break;
            case "import_key":
                const { privateKey } = await inquirer.prompt([
                    {
                        type: "input",
                        name: "privateKey",
                        message: "Enter your private key:"
                    }
                ]);
                try {
                    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
                    console.log(chalk.yellow("Attempting to use key:", formattedKey));

                    const wallet = new Wallet(formattedKey);
                    pk = formattedKey;
                    address = wallet.address;
                    console.log(chalk.green("Private key imported successfully!"));
                    console.log(chalk.cyan(`Address: ${address}`));
                } catch (error: any) {
                    console.error(chalk.red("Invalid private key format:", error.message));
                    console.error(chalk.yellow("Debug info:"));
                    console.error(chalk.yellow("Key length:", privateKey.length));
                    console.error(chalk.yellow("Key:", privateKey));
                }
                break;
            case "get_account":
                try {
                    const response = await getAccount(address);
                    if (response) {
                        console.log(chalk.green("Account found:"));
                        console.log(chalk.cyan(JSON.stringify(response, null, 2)));
                    } else {
                        console.log(chalk.red("No account found"));
                        console.log(chalk.yellow("Hint: You need to create or import an account first"));
                    }
                } catch (error: any) {
                    console.error(chalk.red("Failed to fetch account:"), error.message);
                }
                break;
            case "status":
                try {
                    console.log(chalk.yellow("Fetching game state..."));

                    const { tableAddress: inputAddress } = await inquirer.prompt([
                        {
                            type: "input",
                            name: "tableAddress",
                            message: "Enter table address (leave empty for default table):",
                            default: ""
                        }
                    ]);

                    const tableAddress = inputAddress.trim() ? inputAddress : ethers.ZeroAddress;
                    console.log(
                        chalk.yellow(
                            tableAddress === ethers.ZeroAddress
                                ? "No table address provided, using default table (0x0000...0000)"
                                : `Using table address: ${tableAddress}`
                        )
                    );

                    const state = await getGameState(tableAddress);

                    // Add these lines to show raw state
                    console.log(chalk.cyan("\nRaw game state:"));
                    console.log(chalk.cyan(JSON.stringify(state, null, 2)));
                    console.log(chalk.cyan("============================================================\n"));

                    if (!state) {
                        console.log(chalk.red("No active game found"));
                        console.log(chalk.yellow("Using default table state"));
                        break;
                    }

                    if (!state.players) {
                        console.log(chalk.red("Invalid game state received"));
                        console.log(chalk.yellow("Game state:", JSON.stringify(state, null, 2)));
                        break;
                    }

                    // displayGameState(state, address); // address here is still user's address for display
                    await pokerInteractiveAction();
                } catch (error: any) {
                    console.error(chalk.red("Failed to fetch game state:"), error.message);
                    console.log(chalk.yellow("Make sure you're connected to the correct node"));
                }
                break;
            case "join_game":
                try {
                    console.log(chalk.yellow(`Getting table state for ${address}...`));

                    const gameState = await getGameState(address);
                    console.log(chalk.cyan("Current table state:"));
                    console.log(chalk.cyan(JSON.stringify(gameState, null, 2)));

                    // Table stakes
                    const minBuyIn = BigInt("1000000000000000000"); // 1 USDC
                    const maxBuyIn = BigInt("5000000000000000000"); // 5 USDC

                    const { buyInAmount } = await inquirer.prompt([
                        {
                            type: "input",
                            name: "buyInAmount",
                            message: `Enter buy-in amount in USDC (minimum: 1.00 USDC, maximum: 5.00 USDC):`,
                            default: "3.0", // Default to 3 USDC
                            validate: input => {
                                try {
                                    const amount = ethers.parseEther(input);
                                    if (amount < minBuyIn) return `Must be at least 1.00 USDC`;
                                    if (amount > maxBuyIn) return `Must be at most 5.00 USDC`;
                                    return true;
                                } catch (error) {
                                    return "Please enter a valid number";
                                }
                            }
                        }
                    ]);

                    const buyInWei = ethers.parseEther(buyInAmount);
                    console.log(chalk.yellow(`Attempting to join game with ${buyInAmount} USDC...`));

                    const result = await join(address, buyInWei);

                    console.log(chalk.cyan("Response:"), result);
                } catch (error: any) {
                    console.error(chalk.red("Failed to join game:"), error.message);
                }
                break;
            case "exit":
                continueSession = false;
                console.log(chalk.yellow("Goodbye!"));
                break;
        }

        if (continueSession) {
            const { continue: shouldContinue } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "continue",
                    message: "Would you like to perform another action?",
                    default: true
                }
            ]);
            continueSession = shouldContinue;

            if (!shouldContinue) {
                console.log(chalk.yellow("Good luck!"));
            }
        }
    }
};

type ActionChoice = {
    action: string;
    value: string;
};

const getLegalActions = (address: string, publicKey: string): ActionChoice[] => {
    const actions: ActionChoice[] = [];

    actions.push({ action: "Check", value: "check" });
    actions.push({ action: "Call", value: "call" });
    actions.push({ action: "Fold", value: "fold" });
    actions.push({ action: "Raise", value: "raise" });
    actions.push({ action: "All-In", value: "all-in" });
    actions.push({ action: "Exit", value: "exit" });

    return actions;
};

const pokerInteractiveAction = async () => {
    const actions = await getLegalActions(address, pk);

    let continueSession = true;
    while (continueSession) {
        const { action } = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message: "What would you like to do?",
                choices: actions.map(a => ({ name: a.action, value: a.value }))
            }
        ]);

        switch (action) {
            case "check":
                console.log(chalk.green("Checking..."));
                break;
            case "call":
                console.log(chalk.green("Calling..."));
                break;
            case "fold":
                console.log(chalk.green("Folding..."));
                break;
            case "raise":
                console.log(chalk.green("Raising..."));
                break;
            case "all-in":
                console.log(chalk.green("Going all-in..."));
                break;
            case "exit":
                continueSession = false;
                console.log(chalk.yellow("Goodbye!"));
                break;
        }
    }
};

interactiveAction();
