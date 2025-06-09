import { IClient, LegalActionDTO, NodeRpcClient, NonPlayerActionType, PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { ethers, Wallet } from "ethers";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const TABLE_ADDRESS = "0xd8f7d91143321a1830c9996f1e4e0654ba455714";
const NODE_URL = process.env.NODE_URL || "http://localhost:3000"; // "https://node1.block52.xyz";

// Add nonce tracking
let nonce: number = 0;
let play = true;

// Remove the global pk variable since we'll use the selected key
let _node: IClient;
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

            // If we can deal, then deal
            const canDeal = actions.some(action => action.action === NonPlayerActionType.DEAL);
            if (canDeal) {
                console.log(chalk.cyan("Dealing cards..."));
                const response = await _node.deal(TABLE_ADDRESS, "", wallet.address);
                console.log(chalk.cyan("Deal action posted successfully:", response?.hash));
                continue; // Skip to next iteration after dealing
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
                // const randomIndex = Math.floor(Math.random() * actionCount);
                
                // Can check?
                const canCheck = actions.some(action => action.action === PlayerActionType.CHECK);
                if (canCheck) {
                    console.log(chalk.cyan("Check..."));
                    const response = await _node.playerAction(TABLE_ADDRESS, PlayerActionType.CHECK, "0");
                    console.log(chalk.cyan("Check posted successfully:", response?.hash));

                    continue; // Skip to next iteration after check
                }

                // Can call?
                const canCall = actions.some(action => action.action === PlayerActionType.CALL);
                if (canCall) {
                    console.log(chalk.cyan("Calling..."));
                    const amount = actions.find(action => action.action === PlayerActionType.CALL)?.min || "0";
                    const response = await _node.playerAction(TABLE_ADDRESS, PlayerActionType.CALL, amount);
                    console.log(chalk.cyan("Call posted successfully:", response?.hash));
                    continue; // Skip to next iteration after call
                }

                // Can show?
                const canShow = actions.some(action => action.action === PlayerActionType.SHOW);
                if (canShow) {
                    console.log(chalk.cyan("Showing cards..."));
                    const response = await _node.playerAction(TABLE_ADDRESS, PlayerActionType.SHOW, "0");
                    console.log(chalk.cyan("Show posted successfully:", response?.hash));
                    continue; // Skip to next iteration after show
                }

                // // Can fold?
                // const canFold = actions.some(action => action.action === PlayerActionType.FOLD);
                // if (canFold) {
                //     console.log(chalk.cyan("Folding like a nit..."));
                //     const response = await _node.playerAction(TABLE_ADDRESS, PlayerActionType.FOLD, "0");
                //     console.log(chalk.cyan("Fold posted successfully:", response?.hash));

                //     continue; // Skip to next iteration after fold
                // }
            }
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
