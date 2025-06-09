import { LegalActionDTO, NodeRpcClient, PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { ethers, Wallet } from "ethers";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const TABLE_ADDRESS = "0x485d3acabab7f00713d27bde1ea826a2963afe63";
const NODE_URL = process.env.NODE_URL || "http://localhost:3000"; // "https://node1.block52.xyz";

// Add nonce tracking
let nonce: number = 0;
let play = true;

// Remove the global pk variable since we'll use the selected key
let _node: NodeRpcClient;
let selectedPrivateKey: string = process.env.PRIVATE_KEY || "";

const getClient = () => {
    if (_node) {
        return _node;
    }

    console.log(chalk.cyan("\nDebug - getClient:"));
    console.log(chalk.cyan("- Has existing client:", !!_node));
    console.log(chalk.cyan("- Selected private key available:", !!selectedPrivateKey));
    console.log(chalk.cyan("- Selected private key length:", selectedPrivateKey?.length));
    console.log(chalk.cyan("- NODE_URL:", NODE_URL));

    // Make sure private key has 0x prefix
    const formattedKey = selectedPrivateKey.startsWith("0x") ? selectedPrivateKey : `0x${selectedPrivateKey}`;
    console.log(chalk.cyan("- Creating new client with key:", formattedKey.slice(0, 6) + "..." + formattedKey.slice(-4)));
    _node = new NodeRpcClient(NODE_URL, formattedKey);
    return _node;
};

const getGameState = async (tableAddress: string): Promise<TexasHoldemStateDTO> => {
    const client = getClient();
    const dto = await client.getGameState(tableAddress, ethers.ZeroAddress);
    return dto;
};

const join = async (tableAddress: string, amount: bigint, seat: number): Promise<string> => {
    const client = getClient();

    try {
        const response = await client.playerJoin(tableAddress, amount, seat);
        console.log(chalk.cyan("- Join response:", response));
        return response.hash;
    } catch (error) {
        console.error(chalk.red("- Join error details:"), error);
        throw error;
    }
};

// Format chips from wei (10^18) to readable format
const formatChips = (chipString: string): string => {
    try {
        const chips = parseFloat(chipString) / Math.pow(10, 18);
        return chips.toFixed(2);
    } catch (e) {
        return "0.00";
    }
};

async function checkAccount(address: string): Promise<void> {
    console.log(chalk.yellow(`\nChecking account details for ${address}...`));
    try {
        const client = getClient();
        const account = await client.getAccount(address);
        console.log(chalk.green("\nAccount Details:"));
        console.log(chalk.cyan(JSON.stringify(account, null, 2)));

        nonce = account.nonce;
    } catch (error) {
        console.error(chalk.red("Failed to fetch account details:"), error);
    }
}

async function getLegalActions(address: string, playerId: string): Promise<LegalActionDTO[]> {
    console.log(chalk.yellow(`\nChecking account details for ${address}...`));
    try {
        const client = getClient();
        const actions = await client.getLegalActions(address, playerId);
        return actions;
    } catch (error) {
        throw new Error(`Failed to fetch legal actions: ${error}`);
    }
}

// Modify the joinGame function to use these helpers
async function joinGame(wallet: Wallet): Promise<boolean> {
    try {
        console.log(chalk.cyan("\nDebug - joinGame:"));
        console.log(chalk.cyan("- Wallet address:", wallet.address));
        console.log(chalk.cyan("- Has private key:", !!wallet.privateKey));
        console.log(chalk.cyan("- Selected private key:", selectedPrivateKey.slice(0, 6) + "..." + selectedPrivateKey.slice(-4)));

        const gameState = await getGameState(TABLE_ADDRESS);
        const myPlayer = gameState.players.find(p => p.address === wallet.address);

        if (myPlayer) {
            console.log(chalk.green("You are already seated at this table!"));
            console.log(chalk.cyan("Your stack:"), formatChips(myPlayer.stack));
            return true;
        }

        let seats = [1, 2, 3, 4, 5, 6, 7, 8, 9];

        // Reduce players.seats to an array of available seats
        const occupiedSeats = gameState.players
            .filter(p => p.seat !== undefined)
            .map(p => p.seat)
            .filter(seat => seat !== undefined);

        // Filter out occupied seats
        seats = seats.filter(seat => !occupiedSeats.includes(seat));

        // Table stakes
        const defaultBuyIn = BigInt("1000000000000000000"); // BigInt(gameState.gameOptions.minBuyIn || "1000000000000000000"); // minimum buy-in

        const result = await join(TABLE_ADDRESS, defaultBuyIn, seats[0]);
        console.log(chalk.cyan("Join result:", result));
        return true;
    } catch (error: any) {
        console.error(chalk.red("Failed to join game:"), error.message);
        console.error(chalk.red("Error stack:"), error.stack);
        return false;
    }
}

// Modify the main loop to include small blind posting
async function main() {
    const wallet = new Wallet(selectedPrivateKey);
    console.log(chalk.cyan(`Active address: ${wallet.address}`));

    // Create client and check account balance
    console.log(chalk.cyan("Creating RPC client..."));
    console.log(chalk.cyan("Using private key:", selectedPrivateKey.slice(0, 6) + "..." + selectedPrivateKey.slice(-4)));

    await checkAccount(wallet.address);
    await joinGame(wallet);

    // Continuous monitoring loop
    console.log(chalk.yellow("\nStarting continuous monitoring (checking every 10 seconds)..."));
    while (play) {
        console.log(chalk.cyan("\n=== Checking game state ==="));
        console.log(chalk.cyan("Time: " + new Date().toLocaleTimeString()));

        try {

            const gameState = await getGameState(TABLE_ADDRESS);
            console.log(chalk.cyan("Game state fetched successfully."));

            const actions = await getLegalActions(TABLE_ADDRESS, wallet.address);
            console.log(chalk.cyan(`${actions.length} Legal actions available...`));

            const actionCount = actions.length;
            if (actionCount === 0) {
                console.log(chalk.yellow("No legal actions available at this time."));
            }

            // If legal actions contain post-small-blind, we can post small blind
            const hasPostSmallBlind = actions.some(action => action.action === PlayerActionType.SMALL_BLIND);
            if (hasPostSmallBlind) {
                console.log(chalk.cyan("Posting small blind..."));
                const response = await _node.playerAction(TABLE_ADDRESS, PlayerActionType.SMALL_BLIND, gameState.gameOptions.smallBlind || "1");
                console.log(chalk.cyan("Small blind posted successfully:", response?.hash));
            }

            const hasPostBigBlind = actions.some(action => action.action === PlayerActionType.BIG_BLIND);
            if (hasPostBigBlind) {
                console.log(chalk.cyan("Posting big blind..."));
                const response = await _node.playerAction(TABLE_ADDRESS, PlayerActionType.BIG_BLIND, gameState.gameOptions.bigBlind || "0");
                console.log(chalk.cyan("Big blind posted successfully:", response?.hash));
            }

            if (actionCount > 0) {
                // select random action
                const randomIndex = Math.floor(Math.random() * actionCount);
                const action = actions[randomIndex];
                console.log(chalk.cyan(`Selected action: ${action.action}`));
                // console.log(chalk.cyan(`Selected action: ${action.action} with amount ${formatChips(action.?min.toString())}`));
            }

            // const state = await checkGameState(client);
            // if (!hasJoined) {
            //     const myPlayer = state.players.find(p => p.address === wallet.address);
            //     if (myPlayer) {
            //         console.log(chalk.green(`\nYou are seated at seat ${myPlayer.seat}`));
            //         console.log(chalk.green(`Your stack: ${formatChips(myPlayer.stack)} USDC`));
            //         hasJoined = true;
            //         // Wait 5 seconds after joining before posting small blind
            //         console.log(chalk.yellow("Waiting 5 seconds before posting small blind..."));
            //         await new Promise(resolve => setTimeout(resolve, 5000));
            //     } else if (state.players.length === 0) {
            //         console.log(chalk.yellow("\nTable is empty!"));
            //         hasJoined = await joinGame(client, wallet);
            //     } else {
            //         console.log(chalk.yellow("\nTable has players but you're not seated."));
            //         hasJoined = await joinGame(client, wallet);
            //     }
            // } else if (!hasPostedSmallBlind) {
            //     // Try to post small blind if we haven't yet
            //     await postSmallBlind(client, state, wallet);
            //     // Check if we successfully posted the small blind
            //     const updatedState = await checkGameState(client);
            //     const myPlayer = updatedState.players.find(p => p.address === wallet.address);
            //     if (myPlayer?.lastAction?.action === PlayerActionType.SMALL_BLIND) {
            //         hasPostedSmallBlind = true;
            //         console.log(chalk.green("Small blind posted successfully!"));
            //     }
            // }
        } catch (error) {
            console.error(chalk.red("Error in main loop:"), error);
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

main().catch(error => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
});
