#!/usr/bin/env node
import chalk from "chalk";
import inquirer, { restoreDefaultPrompts } from "inquirer";
import crypto from "crypto";
import { Wallet } from "ethers";
import { ethers } from "ethers";

import { TexasHoldemStateDTO, NodeRpcClient, TexasHoldemRound, PlayerDTO, PlayerActionType } from "@bitcoinbrisbane/block52";
import dotenv from "dotenv";

dotenv.config();

// Default contract address on L2
let defaultTableAddress = "0x22dfa2150160484310c5163f280f49e23b8fd34326";
let node = process.env.NODE_URL || "http://localhost:3000"; // "https://node1.block52.xyz";
let nonce: number = 0;

let _node: NodeRpcClient;

// Get command line arguments
const args = process.argv.slice(2);

// Check if a private key was provided as a command-line argument
let pk = "";

if (args.length > 0) {
    const potentialKey = args[0].startsWith("0x") ? args[0] : `0x${args[0]}`;
    try {
        // Validate the key by creating a wallet
        const wallet = new Wallet(potentialKey);
        pk = potentialKey;

        console.log(chalk.green("Private key set from command line arguments"));
        console.log(chalk.cyan(`Address: ${wallet.address}`));
    } catch (error) {
        console.log(chalk.red("Invalid private key provided as argument. Will try environment variable."));
    }
}

// If no valid key from command line, try environment variable
if (!pk) {
    if (process.env.PRIVATE_KEY) {
        console.log(chalk.green("Private key set from environment variable"));
        pk = process.env.PRIVATE_KEY;
    } else {
        console.log(chalk.red("No private key found in environment variable"));
    }
}

const getClient = () => {
    if (_node) {
        return _node;
    }

    _node = new NodeRpcClient(node, pk);
    return _node;
};

const getAddress = () => {
    // If we have a valid private key, set the address
    if (pk) {
        try {
            const wallet = new Wallet(pk);
            return wallet.address;
        } catch (error) {
            // Invalid key format - will be handled in the interactive menu
        }
    }

    throw new Error("No valid private key found");
}

/**
 * Parse command with parameters
 * Handles input like "join 0x00" or "bet 5.5"
 * @param input User input string
 * @returns Object with command and params
 */
const parseCommand = (input: string): { command: string; params: string[] } => {
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const params = parts.slice(1);

    return { command, params };
};

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

const syncNonce = async (address: string) => {
    const rpcClient = getClient();
    const response = await rpcClient.getAccount(address);

    if (response) {
        nonce = response?.nonce || 0;
    }
};

const join = async (tableAddress: string, amount: bigint): Promise<string> => {
    const rpcClient = getClient();
    const response = await rpcClient.playerJoin(tableAddress, amount, nonce);

    // console.log(chalk.green("Join response:"), response.hash);
    return response.hash;
};

const getGameState = async (tableAddress: string): Promise<TexasHoldemStateDTO> => {
    const rpcClient = getClient();
    const dto = await rpcClient.getGameState(tableAddress);

    return dto;
};

const getAccount = async (address: string): Promise<any> => {
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
const renderCard = (mnemonic: string): string => {
    if (!mnemonic) return "🂠"; // Back of card for hidden cards

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
        case "C": suit = "♣"; break;
        case "D": suit = "♦"; break;
        case "H": suit = "♥"; break;
        case "S": suit = "♠"; break;
        default:
            throw new Error(`Invalid suit character: ${suitChar}`);
    }

    // Color hearts and diamonds in red
    if (suit === "♦" || suit === "♥") {
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
const getPlayerPositionMarker = (seat: number, state: TexasHoldemStateDTO): string => {
    let nextToAct = seat === state.nextToAct ? " *" : "";
    if (seat === state.dealer) return `D${nextToAct}`;
    if (seat === state.smallBlindPosition) return `SB${nextToAct}`;
    if (seat === state.bigBlindPosition) return `BB${nextToAct}`;
    return nextToAct;
};

const shortenAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Display game state as a table
const renderGameState = (state: TexasHoldemStateDTO, publicKey: string): void => {
    // Find my player
    const myPlayer = state.players.find(p => p.address === publicKey);

    console.log(chalk.cyan("=".repeat(60)));
    console.log(chalk.cyan(`My Public Key: ${publicKey.substring(0, 8)}...${publicKey.substring(publicKey.length - 6)}`));
    console.log(chalk.green(`My Chips: ${myPlayer ? formatChips(myPlayer.stack) : "0.00"}`));
    console.log(chalk.cyan("=".repeat(60)));

    // Game info
    console.log(chalk.yellow(`Game Type: ${state.type} | Round: ${state.round} | Blinds: ${formatChips(state.smallBlind)}/${formatChips(state.bigBlind)}`));

    // Community cards
    let communityCardsStr = "Board: ";
    if (state.communityCards.length === 0) {
        communityCardsStr += "No cards yet";
    } else {
        communityCardsStr += state.communityCards.map(card => renderCard(card)).join(" ");
    }
    console.log(chalk.white(communityCardsStr));

    // Pot information
    console.log(chalk.magenta(`Pot${state.pots.length > 1 ? "s" : ""}: ${state.pots.map(pot => formatChips(pot)).join(" + ")}`));

    // Display table with players
    console.log(chalk.cyan("\nPlayers:"));
    console.log(chalk.cyan("-".repeat(80)));
    console.log(
        chalk.cyan("Seat".padEnd(6)) +
        // chalk.cyan("Position".padEnd(10)) +
        chalk.cyan("Address".padEnd(20)) +
        chalk.cyan("Chips".padEnd(12)) +
        chalk.cyan("Bet".padEnd(12)) +
        chalk.cyan("Cards".padEnd(15)) +
        chalk.cyan("Status")
    );
    console.log(chalk.cyan("-".repeat(80)));

    // Sort players by seat index
    const sortedPlayers = [...state.players].sort((a, b) => a.seat - b.seat);

    for (const player of sortedPlayers) {
        // const isNextToAct = player.seat === state.nextToAct;
        const isMyPlayer = player.address === publicKey;

        // Highlight current player
        // const rowStyle = isNextToAct ? chalk.green : isMyPlayer ? chalk.yellow : chalk.white;
        const rowStyle = isMyPlayer ? chalk.green : chalk.white;

        // Format player cards - show only if it's my player or we're at showdown
        let cardsDisplay = player?.holeCards ? "🂠 🂠" : "";
        if (isMyPlayer || state.round === "showdown") {
            if (player.holeCards) {
                cardsDisplay = player.holeCards?.map(card => renderCard(card)).join(" ");
            }
        } // else {
        //     cardsDisplay = "🂠 🂠"; // Back of cards
        // }

        const marker = getPlayerPositionMarker(player.seat, state);
        const seat = `${player.seat} ${marker}`;

        const bet = player?.sumOfBets || "0"; //.lastAction?.amount || "0";

        console.log(
            rowStyle(
                String(seat).padEnd(6) +
                // getPlayerPosition(player.seat, state).padEnd(10) +
                (shortenAddress(player.address)).padEnd(20) +
                formatChips(player.stack).padEnd(12) +
                formatChips(bet).padEnd(12) +
                cardsDisplay.padEnd(15) +
                player.status
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
    let address = getAddress();

    let continueSession = true;
    while (continueSession) {
        const { userInput } = await inquirer.prompt([
            {
                type: "list",
                name: "userInput",
                message: "What would you like to do?",
                choices: [
                    { name: "Join a game", value: "join_game" },
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
            case "state":
                try {
                    console.log(chalk.yellow("Fetching game state..."));

                    const { tableAddress: inputAddress } = await inquirer.prompt([
                        {
                            type: "input",
                            name: "tableAddress",
                            message: "Enter table address (leave empty for default table):",
                            default: defaultTableAddress
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
                } catch (error: any) {
                    console.error(chalk.red("Failed to fetch game state:"), error.message);
                    console.log(chalk.yellow("Make sure you're connected to the correct node"));
                }
                break;
            case "join_game":
                try {
                    console.log(chalk.yellow(`Getting table state for ${defaultTableAddress}...`));

                    const gameState = await getGameState(defaultTableAddress);
                    const myPlayer = gameState.players.find(p => p.address === address);

                    if (myPlayer) {
                        console.log(chalk.green("You are already seated at this table!"));
                        console.log(chalk.cyan("Your stack:"), formatChips(myPlayer.stack));

                        renderGameState(gameState, address);
                        await pokerInteractiveAction(defaultTableAddress, address);
                        break;
                    }

                    // console.log(chalk.cyan("Current table state:"));
                    // console.log(chalk.cyan(JSON.stringify(gameState, null, 2)));

                    // Table stakes
                    const minBuyIn = 1000000000000000000n; // 1 USDC
                    const maxBuyIn = 5000000000000000000n; // 5 USDC

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

                    const result = await join(defaultTableAddress, buyInWei);

                    if (result) {
                        console.log(chalk.cyan("Response:"), result);
                        await pokerInteractiveAction(defaultTableAddress, address);
                    }
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

const getLegalActions = async (tableAddress: string, address: string): Promise<ActionChoice[]> => {
    const actions: ActionChoice[] = [];
    actions.push({ action: "Exit", value: "exit" });

    const client = getClient();
    const state = await client.getGameState(tableAddress);

    if (!state) {
        console.log(chalk.red("No active game found"));
        return actions;
    }

    // Find my seat
    const myPlayer = state.players.find(p => p.address === address);
    if (!myPlayer) {
        console.log(chalk.red("You are not seated at this table"));
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

const pokerInteractiveAction = async (tableAddress: string, address: string) => {
    const client = getClient();

    let continueSession = true;
    while (continueSession) {
        const state = await getGameState(tableAddress);
        renderGameState(state, address);

        // todo: call node to get legal actions
        const actions = await getLegalActions(tableAddress, address);
        actions.push({ action: "Refresh", value: "refresh" });

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
                await client.playerAction(tableAddress, PlayerActionType.CHECK, "", nonce);
                break;
            case "post small blind":
                console.log(chalk.green("Posting small blind..."));
                await client.playerAction(tableAddress, PlayerActionType.SMALL_BLIND, "", nonce);
                break;
            case "post big blind":
                console.log(chalk.green("Posting big blind..."));
                await client.playerAction(tableAddress, PlayerActionType.BIG_BLIND, "", nonce);
                break;
            case "bet":
                console.log(chalk.green("Betting..."));
                await client.playerAction(tableAddress, PlayerActionType.BET, "", nonce);
                break;
            case "call":
                console.log(chalk.green("Calling..."));
                await client.playerAction(tableAddress, PlayerActionType.CALL, "", nonce);
                break;
            case "deal":
                console.log(chalk.green("Deal..."));
                await client.playerAction(tableAddress, PlayerActionType.DEAL, "", nonce);
                break;
            case "fold":
                console.log(chalk.green("Folding..."));
                await client.playerAction(tableAddress, PlayerActionType.FOLD, "", nonce);
                break;
            case "raise":
                console.log(chalk.green("Raising..."));
                break;
            case "all-in":
                console.log(chalk.green("Going all-in..."));
                break;
            case "refresh":
                // Will refresh game state anyway
                console.log(chalk.green("Refreshing game state..."));
                break;
            case "exit":
                continueSession = false;
                console.log(chalk.yellow("Goodbye!"));
                break;
        }

        await syncNonce(address);
    }
};

interactiveAction();
