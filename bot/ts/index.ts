import { NodeRpcClient, PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { Wallet } from "ethers";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const TABLE_ADDRESS = "0x22dfa2150160484310c5163f280f49e23b8fd34326";
const NODE_URL = process.env.NODE_URL || "http://localhost:3000";

// Add nonce tracking
let nonce: number = 0;

// Remove the global pk variable since we'll use the selected key
let _node: NodeRpcClient;
let selectedPrivateKey: string = ""; // Add this to store the selected key

const getClient = () => {
    console.log(chalk.cyan("\nDebug - getClient:"));
    console.log(chalk.cyan("- Has existing client:", !!_node));
    console.log(chalk.cyan("- Selected private key available:", !!selectedPrivateKey));
    console.log(chalk.cyan("- Selected private key length:", selectedPrivateKey?.length));
    console.log(chalk.cyan("- NODE_URL:", NODE_URL));

    if (_node) {
        return _node;
    }

    // Make sure private key has 0x prefix
    const formattedKey = selectedPrivateKey.startsWith('0x') ? selectedPrivateKey : `0x${selectedPrivateKey}`;
    console.log(chalk.cyan("- Creating new client with key:", formattedKey.slice(0, 6) + "..." + formattedKey.slice(-4)));
    _node = new NodeRpcClient(NODE_URL, formattedKey);
    return _node;
};

const getGameState = async (tableAddress: string): Promise<TexasHoldemStateDTO> => {
    const rpcClient = getClient();
    const dto = await rpcClient.getGameState(tableAddress);
    return dto;
};

const join = async (tableAddress: string, amount: bigint): Promise<string> => {
    console.log(chalk.cyan("\nDebug - join function:"));
    console.log(chalk.cyan("- Table address:", tableAddress));
    console.log(chalk.cyan("- Amount:", formatChips(amount.toString())));
    console.log(chalk.cyan("- Current nonce:", nonce));
    
    const rpcClient = getClient();
    console.log(chalk.cyan("- Got RPC client"));
    
    try {
        const response = await rpcClient.playerJoin(tableAddress, amount, nonce);
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

async function checkNodeConnection(): Promise<boolean> {
    console.log(chalk.yellow(`Checking for node at ${NODE_URL}...`));
    try {
        const response = await fetch(NODE_URL);
        const text = await response.text();
        if (text.includes("PVM RPC Server")) {
            console.log(chalk.green("✓ Node is running"));
            return true;
        }
    } catch (error) {
        console.log(chalk.red("✗ Cannot connect to node at", NODE_URL));
    }
    return false;
}

async function selectPrivateKey(): Promise<string> {
    const keys = {
        PRIVATEKEY1CHARLIE: process.env.PRIVATEKEY1CHARLIE,
        PRIVATEKEY2BEN: process.env.PRIVATEKEY2BEN,
        PRIVATEKEY3TRACEY: process.env.PRIVATEKEY3TRACEY
    };

    // Check which keys are available
    const availableKeys = Object.entries(keys)
        .filter(([_, value]) => value)
        .map(([name, value]) => {
            try {
                // Make sure to add 0x prefix if it's missing
                const formattedValue = value!.startsWith('0x') ? value! : `0x${value!}`;
                const wallet = new Wallet(formattedValue);
                return { name, value: formattedValue, address: wallet.address };
            } catch {
                return null;
            }
        })
        .filter((key): key is { name: string; value: string; address: string } => key !== null);

    if (availableKeys.length === 0) {
        throw new Error("No valid private keys found in environment variables");
    }

    // Log available keys
    console.log(chalk.cyan("\nAvailable accounts:"));
    availableKeys.forEach((key, index) => {
        console.log(chalk.green(`[${index + 1}] ${key.name}: ${key.address}`));
    });

    // Get user input for account selection
    console.log(chalk.yellow("\nSelect an account (enter the number):"));
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve, reject) => {
        readline.question('> ', (answer: string) => {
            readline.close();
            const index = parseInt(answer) - 1;
            
            if (isNaN(index) || index < 0 || index >= availableKeys.length) {
                console.log(chalk.red("Invalid selection. Using first account."));
                resolve(availableKeys[0].value);
            } else {
                const selected = availableKeys[index];
                console.log(chalk.yellow(`Selected account: ${selected.name}`));
                resolve(selected.value);
            }
        });
    });
}

async function checkAccount(client: NodeRpcClient, address: string): Promise<void> {
    console.log(chalk.yellow(`\nChecking account details for ${address}...`));
    try {
        const account = await client.getAccount(address);
        console.log(chalk.green("\nAccount Details:"));
        console.log(chalk.cyan(JSON.stringify(account, null, 2)));
    } catch (error) {
        console.error(chalk.red("Failed to fetch account details:"), error);
    }
}

async function checkGameState(client: NodeRpcClient): Promise<TexasHoldemStateDTO> {
    console.log(chalk.yellow(`\nChecking game state for table ${TABLE_ADDRESS}...`));
    try {
        const state = await client.getGameState(TABLE_ADDRESS);
        console.log(chalk.green("\nComplete Game State:"));
        console.log(chalk.cyan(JSON.stringify(state, null, 2)));
        return state;
    } catch (error) {
        console.error(chalk.red("Failed to fetch game state:"), error);
        throw error;
    }
}

// Modify the joinGame function to use these helpers
async function joinGame(client: NodeRpcClient, wallet: Wallet): Promise<boolean> {
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

        // Table stakes
        const minBuyIn = BigInt("1000000000000000000"); // 1 USDC
        const maxBuyIn = BigInt("5000000000000000000"); // 5 USDC
        const defaultBuyIn = BigInt("3000000000000000000"); // 3 USDC

        // Try to join in a seat that's not the small blind position
        for (let seat = 2; seat <= 9; seat++) {
            if (!gameState.players.find(p => p.seat === seat)) {
                console.log(chalk.yellow(`Attempting to join game in seat ${seat} with 3.0 USDC...`));
                
                try {
                    const result = await join(TABLE_ADDRESS, defaultBuyIn);
                    if (result) {
                        console.log(chalk.green("Join successful:"), result);
                        
                        // Wait for join to be processed
                        console.log(chalk.yellow("Waiting for join to be processed..."));
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        
                        // Verify join
                        const newState = await getGameState(TABLE_ADDRESS);
                        const joinedPlayer = newState.players.find(p => p.address === wallet.address);
                        
                        if (joinedPlayer) {
                            console.log(chalk.green(`Successfully joined in seat ${joinedPlayer.seat}!`));
                            return true;
                        }
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        console.error(chalk.red(`Failed to join in seat ${seat}:`, error.message));
                      } else {
                        console.error(chalk.red(`Failed to join in seat ${seat}:`, 'An unknown error occurred'));
                      }
                }
            }
        }

        console.log(chalk.red("Could not find a suitable seat to join"));
        return false;
    } catch (error: any) {
        console.error(chalk.red("Failed to join game:"), error.message);
        console.error(chalk.red("Error stack:"), error.stack);
        return false;
    }
}

// Add this helper function to handle small blind posting
async function postSmallBlind(client: NodeRpcClient, state: TexasHoldemStateDTO, wallet: Wallet) {
    console.log(chalk.yellow("\nChecking if we need to post small blind..."));
    
    const myPlayer = state.players.find(p => p.address === wallet.address);
    if (!myPlayer) return;

    // Check if we're in the small blind position and it's our turn
    if (myPlayer.seat === state.smallBlindPosition && 
        state.nextToAct === myPlayer.seat &&
        myPlayer.actions.some(a => a.action === PlayerActionType.SMALL_BLIND)) {
        
        console.log(chalk.yellow("Posting small blind..."));
        try {
            await client.playerAction(
                TABLE_ADDRESS,
                PlayerActionType.SMALL_BLIND,
                state.smallBlind,  // Use the small blind amount from game state
                nonce
            );
            console.log(chalk.green("Successfully posted small blind!"));
            nonce++;
        } catch (error) {
            if (error instanceof Error) {
                console.error(chalk.red("Failed to post small blind:", error.message));
            }
        }
    }
}

// Modify the main loop to include small blind posting
async function main() {
    // Check node connection
    const nodeRunning = await checkNodeConnection();
    if (!nodeRunning) {
        console.log(chalk.red("Cannot proceed without node connection"));
        process.exit(1);
    }

    // Select and validate private key
    selectedPrivateKey = await selectPrivateKey();
    const wallet = new Wallet(selectedPrivateKey);
    console.log(chalk.cyan(`Active address: ${wallet.address}`));

    // Create client and check account balance
    console.log(chalk.cyan("Creating RPC client..."));
    console.log(chalk.cyan("Using private key:", selectedPrivateKey.slice(0, 6) + "..." + selectedPrivateKey.slice(-4)));
    const client = new NodeRpcClient(NODE_URL, selectedPrivateKey);
    await checkAccount(client, wallet.address);

    let hasJoined = false;
    let hasPostedSmallBlind = false;

    // Continuous monitoring loop
    console.log(chalk.yellow("\nStarting continuous monitoring (checking every 10 seconds)..."));
    while (true) {
        console.log(chalk.cyan("\n=== Checking game state ==="));
        console.log(chalk.cyan("Time: " + new Date().toLocaleTimeString()));
        
        try {
            const state = await checkGameState(client);
            
            if (!hasJoined) {
                const myPlayer = state.players.find(p => p.address === wallet.address);
                if (myPlayer) {
                    console.log(chalk.green(`\nYou are seated at seat ${myPlayer.seat}`));
                    console.log(chalk.green(`Your stack: ${formatChips(myPlayer.stack)} USDC`));
                    hasJoined = true;
                    
                    // Wait 5 seconds after joining before posting small blind
                    console.log(chalk.yellow("Waiting 5 seconds before posting small blind..."));
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else if (state.players.length === 0) {
                    console.log(chalk.yellow("\nTable is empty!"));
                    hasJoined = await joinGame(client, wallet);
                } else {
                    console.log(chalk.yellow("\nTable has players but you're not seated."));
                    hasJoined = await joinGame(client, wallet);
                }
            } else if (!hasPostedSmallBlind) {
                // Try to post small blind if we haven't yet
                await postSmallBlind(client, state, wallet);
                
                // Check if we successfully posted the small blind
                const updatedState = await checkGameState(client);
                const myPlayer = updatedState.players.find(p => p.address === wallet.address);
                if (myPlayer?.lastAction?.action === PlayerActionType.SMALL_BLIND) {
                    hasPostedSmallBlind = true;
                    console.log(chalk.green("Small blind posted successfully!"));
                }
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