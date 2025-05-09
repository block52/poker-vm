#!/usr/bin/env node
const axios = require("axios");
const chalk = require("chalk");
const { program } = require("commander");
const { Wallet } = require("ethers");
const path = require("path");
const dotenv = require("dotenv");
const { RPCMethods, NonPlayerActionType } = require("@bitcoinbrisbane/block52");

// Load environment variables from .env file
dotenv.config();

// Import constants from testConstants.ts
// Note: This requires ts-node to run or the constants file to be compiled to JS
const testConstants = require("./lucas_tests_files/testConstants");
const { 
  ONE_TOKEN, 
  TWO_TOKENS, 
  ONE_HUNDRED_TOKENS,
  ONE_THOUSAND_TOKENS,
  gameOptions,
  defaultPositions,
  baseGameConfig
} = testConstants;

// Configure CLI options
program
  .option("-u, --url <url>", "RPC URL", "http://localhost:3000")
  .option("-w, --wait <seconds>", "Wait time for mining (seconds)", "30")
  .parse(process.argv);

const options = program.opts();

// Configuration
const RPC_URL = options.url;
const WAIT_TIME = parseInt(options.wait, 10) * 1000;

// Get private keys from environment variables
const PRIVATE_KEYS = [
  process.env.PRIVATE_KEY_DAN || process.env.PRIVATE_KEY_1 || "0xd33ffa661474e5de3e4e7547dee7e683c089ff433847fe22c9af4b555b085da7",
  process.env.PRIVATE_KEY_TRACEY || process.env.PRIVATE_KEY_2 || "0x0b3b0b79670811055a07a8376c6c776313e7239cfc44f645d08b3b83ca00a9dd",
  process.env.PRIVATE_KEY_HAMISH || process.env.PRIVATE_KEY_3 || "0xadea8f03e50b0d096352d294507eafe1e9d73f40de7db67837c41fd2cc71d8fa"
];

// Derive addresses from private keys
const PLAYERS = PRIVATE_KEYS.map((privateKey, index) => {
  const wallet = new Wallet(privateKey);
  const name = ["Dan", "Tracey", "Hamish"][index];
  return {
    name,
    privateKey,
    address: wallet.address
  };
});

// Logging helper functions
function log(message) {
  console.log(message);
}

function success(message) {
  console.log(chalk.green(`✅ ${message}`));
}

function error(message) {
  console.error(chalk.red(`❌ ${message}`));
}

function info(message) {
  console.log(chalk.blue(`ℹ️ ${message}`));
}

// Helper function for RPC calls
async function rpcCall(method, params = [], privateKey = null) {
  try {
    // Create request payload with base properties
    const requestPayload = {
      jsonrpc: "2.0",
      id: Date.now().toString(),
      method,
      params
    };
    
    // Print out the full RPC request structure
    log(chalk.magenta("\n📡 RPC REQUEST:"));
    log(chalk.magenta("-".repeat(50)));
    log(chalk.magenta("Method: ") + chalk.white(method));
    log(chalk.magenta("Params: ") + chalk.white(JSON.stringify(params, null, 2)));
    
    // If private key is provided, sign the request
    if (privateKey) {
      const wallet = new Wallet(privateKey);
      const messageToSign = JSON.stringify(requestPayload);
      const signature = await wallet.signMessage(messageToSign);
      
      // Add signature and publicKey to the request
      requestPayload.signature = signature;
      requestPayload.publicKey = wallet.address;
      
      log(chalk.magenta("Signed by: ") + chalk.white(wallet.address));
    }
    
    // Create and log the RPCRequest object structure as defined in rpc.d.ts
    log(chalk.magenta("RPCRequest format according to rpc.d.ts:"));
    const rpcRequestObject = {
      id: requestPayload.id,
      method: requestPayload.method,
      params: requestPayload.params,
      // Only include these if they exist
      ...(requestPayload.signature && { signature: requestPayload.signature }),
      ...(requestPayload.data && { data: requestPayload.data }),
      ...(requestPayload.publicKey && { publicKey: requestPayload.publicKey })
    };
    log(chalk.white(JSON.stringify(rpcRequestObject, null, 2)));
    log(chalk.magenta("-".repeat(50)));
    
    const response = await axios.post(RPC_URL, requestPayload);
    
    if (response.data.error) {
      error(`RPC Error: ${JSON.stringify(response.data.error)}`);
      throw new Error(response.data.error.message || JSON.stringify(response.data.error));
    }
    
    // Log RPC response in RPCResponse format
    log(chalk.green("✅ RPC Response received"));
    log(chalk.magenta("RPCResponse format according to rpc.d.ts:"));
    
    // Format the response to match RPCResponse<T> structure
    const rpcResponseObject = {
      id: response.data.id,
      result: response.data.result,  // ISignedResponse<T> with data and signature
      ...(response.data.error && { error: response.data.error })
    };
    
    log(chalk.white(JSON.stringify(rpcResponseObject, null, 2)));
    
    // Check if result has the expected ISignedResponse structure
    if (response.data.result && typeof response.data.result === 'object') {
      log(chalk.magenta("ISignedResponse<T> structure check:"));
      const hasDataProperty = 'data' in response.data.result;
      const hasSignatureProperty = 'signature' in response.data.result;
      
      if (hasDataProperty && hasSignatureProperty) {
        log(chalk.green("✓ Response follows the ISignedResponse<T> interface with data and signature properties"));
      } else {
        log(chalk.yellow("⚠ Response may not follow ISignedResponse<T> interface:"));
        log(chalk.yellow(`  - data property: ${hasDataProperty ? 'present' : 'missing'}`));
        log(chalk.yellow(`  - signature property: ${hasSignatureProperty ? 'present' : 'missing'}`));
      }
    }
    
    return response.data.result;
  } catch (err) {
    error(`RPC Call failed: ${err.message}`);
    throw err;
  }
}

// Wait for server to be available
async function waitForServer(maxAttempts = 30) {
  log(chalk.yellow("Waiting for server to be available..."));
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(RPC_URL);
      success("Server is up and running!");
      return true;
    } catch (error) {
      process.stdout.write(".");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error("Server did not become available in time");
}

// Wait for mining to complete
async function waitForMining() {
  log(chalk.yellow(`Waiting for node to complete mining (${WAIT_TIME/1000}s)...`));
  await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
  success("Mining wait time completed");
}

// Print player details
function printPlayerDetails() {
  log(chalk.yellow("Player Details:"));
  
  PLAYERS.forEach(player => {
    console.log(chalk.cyan(`\nPlayer: ${player.name}`));
    console.log(`Private Key: ${player.privateKey.substring(0, 10)}...${player.privateKey.substring(player.privateKey.length - 8)}`); // Only show part of the key for security
    console.log(`Address: ${player.address}`);
  });
  
  success("Addresses derived from private keys successfully");
}

// Create contract schema using NEW RPC method
async function createContractSchema() {
  info("Creating Texas Holdem contract schema...");
  
  // Format for schema: game_type,game_variant,min_players,max_players,small_blind,big_blind,min_buyin,max_buyin,timeout
  const schemaStr = `texas,cash,${gameOptions.minPlayers},${gameOptions.maxPlayers},${gameOptions.smallBlind.toString()},${gameOptions.bigBlind.toString()},${gameOptions.minBuyIn.toString()},${gameOptions.maxBuyIn.toString()},${gameOptions.timeout}`;
  
  log(chalk.yellow("Contract schema string: " + schemaStr));
  
  // Use the specified table ID to create the contract schema
  const tableId = "0x22dfa2150160484310c5163f280f49e23b8fd34326";
  log(chalk.cyan(`Using table ID: ${tableId}`));
  
  try {
    // Using RPCMethods.NEW from the Block52 package for type safety
    const result = await rpcCall(RPCMethods.NEW, [
      tableId,  // Use the specified table address
      schemaStr
    ]);
    
    // Fix the formatting for the contract address
    const contractAddress = typeof result === "object" ? 
      (result.address || tableId) : 
      (result || tableId);
      
    success(`Contract schema created with address: ${contractAddress}`);
    return contractAddress;
  } catch (err) {
    error(`Failed to create contract schema: ${err.message}`);
    log(chalk.yellow("Using fallback table ID for further steps"));
    return tableId;
  }
}

// Join a player to the table via RPC
async function joinTable(contractAddress, player, buyInAmount) {
  info(`Player ${player.name} (${player.address}) joining table ${contractAddress} with ${buyInAmount.toString()} tokens`);
  
  try {
    // Format parameters according to: [from, to, action, amount, nonce, index]
    const timestamp = Date.now();
    const actionIndex = 0; // Action index for join (usually 0 for the first action)
    
    // Based on proxy/js/src/index.js structure:
    // [from, to, action, amount, nonce, index]
    const params = [
      player.address,                // from: player address
      contractAddress,               // to: table address
      "join",                        // action: "join" string directly (NonPlayerActionType.JOIN)
      buyInAmount.toString(),        // amount: buy-in amount
      timestamp.toString(),          // nonce: timestamp as string
      actionIndex                    // index: action index
    ];
    
    // Log the RPC call parameters 
    log(chalk.yellow("Sending RPC call to join table:"));
    log(chalk.cyan(`Method: ${RPCMethods.PERFORM_ACTION}`));
    log(chalk.cyan(`Parameters: ${JSON.stringify(params, null, 2)}`));
    log(chalk.cyan(`Using private key for: ${player.name}`));
    
    // Implement the actual RPC call to join the table with the player's private key for signing
    const result = await rpcCall(RPCMethods.PERFORM_ACTION, params, player.privateKey);
    
    success(`Player ${player.name} successfully joined table ${contractAddress}`);
    log(chalk.cyan("Join response:"));
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (err) {
    error(`Failed to join table: ${err.message}`);
    return null;
  }
}

// Check account balance via RPC
async function getAccountBalance(address) {
  info(`Checking balance for account: ${address}`);
  
  try {
    // Implement the actual RPC call to get account info
    const result = await rpcCall(RPCMethods.GET_ACCOUNT, [address]);
    
    success(`Retrieved account info for: ${address}`);
    log(chalk.cyan("Account details:"));
    console.log(JSON.stringify(result, null, 2));
    
    // The balance is inside the "data" object
    const balance = result?.data?.balance || "0";
    log(chalk.cyan(`Extracted balance: ${balance}`));
    return balance;
  } catch (err) {
    error(`Failed to retrieve account balance: ${err.message}`);
    return "0";
  }
}

// Get game state using GET_GAME_STATE RPC method
async function getGameState(contractAddress, player) {
  info(`Getting game state for table: ${contractAddress}`);
  
  try {
    // Call the GET_GAME_STATE method with the contract address and player address
    const result = await rpcCall(RPCMethods.GET_GAME_STATE, [
      contractAddress,  // Table address
      player.address    // Caller address
    ], player.privateKey);
    
    success(`Retrieved game state for table: ${contractAddress}`);
    log(chalk.cyan("Game State:"));
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (err) {
    error(`Failed to get game state: ${err.message}`);
    return null;
  }
}

// Analyze game state to determine next player to act
async function analyzeGameState(gameState) {
  if (!gameState || !gameState.data) {
    error("Invalid game state data");
    return;
  }
  
  const state = gameState.data;
  const nextToActIndex = state.nextToAct;
  
  // Find the player who is next to act
  const nextPlayer = state.players.find(p => p.seat === nextToActIndex);
  if (!nextPlayer) {
    log(chalk.yellow(`No player found at seat ${nextToActIndex}`));
    return;
  }
  
  // Find the player's name by address
  const playerName = PLAYERS.find(p => p.address.toLowerCase() === nextPlayer.address.toLowerCase())?.name || "Unknown";
  
  log(chalk.green(`\n=== GAME ANALYSIS ===`));
  log(chalk.cyan(`Current game round: ${state.round}`));
  log(chalk.cyan(`Next player to act: ${playerName} (Seat ${nextPlayer.seat}, Address: ${nextPlayer.address})`));
  log(chalk.cyan(`Player stack: ${nextPlayer.stack}`));
  
  // Display legal actions
  if (nextPlayer.legalActions && nextPlayer.legalActions.length > 0) {
    log(chalk.cyan(`Legal actions for ${playerName}:`));
    nextPlayer.legalActions.forEach(action => {
      log(chalk.yellow(`- ${action.action} (min: ${action.min}, max: ${action.max})`));
    });
  } else {
    log(chalk.red(`No legal actions available for ${playerName}`));
  }
  
  // Show pot size if available
  if (state.pots && state.pots.length > 0) {
    const totalPot = state.pots.reduce((acc, pot) => acc + BigInt(pot || "0"), BigInt(0));
    log(chalk.cyan(`Total pot: ${totalPot.toString()}`));
  }
  
  log(chalk.green(`=== END ANALYSIS ===\n`));
}

// Main function
async function runTest() {
  try {
    // Step 1: Wait for server to be available
    await waitForServer();
    
    // Step 2: Wait for mining to complete
    await waitForMining();
    
    // Step 3: Print player details
    printPlayerDetails();
    
    // Step 4: Print the constants from testConstants.ts
    log(chalk.yellow("\nConstants from testConstants.ts:"));
    console.log(`ONE_TOKEN: ${ONE_TOKEN.toString()}`);
    console.log(`TWO_TOKENS: ${TWO_TOKENS.toString()}`);
    console.log(`ONE_HUNDRED_TOKENS: ${ONE_HUNDRED_TOKENS.toString()}`);
    console.log(`ONE_THOUSAND_TOKENS: ${ONE_THOUSAND_TOKENS.toString()}`);
    console.log("\nGame Options:");
    console.log(JSON.stringify(gameOptions, (key, value) => 
      typeof value === "bigint" ? value.toString() : value, 2
    ));
    
    // Step 5: Create contract schema with the specific table ID
    const contractAddress = await createContractSchema();
    
    // Wait a bit for the contract creation to be mined
    log(chalk.yellow("\nWaiting for the contract creation to be mined..."));
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 6: Check player balances first
    for (const player of PLAYERS) {
      log(chalk.yellow(`\nChecking balance for ${player.name} before joining...`));
      const balance = await getAccountBalance(player.address);
      log(chalk.cyan(`${player.name}'s balance: ${balance}`));
      
      // Convert balance to BigInt for comparison
      const balanceBigInt = BigInt(balance || "0");
      
      // Set buy-in amount to 1 ETH (less than the minimum game buy-in, just for testing)
      // The min buy-in is probably 100 ETH (100000000000000000000)
      // So we'll try a much smaller amount like 1 ETH
      const buyInAmount = BigInt("1000000000000000000"); // 1 ETH
      
      // Only try to join if player has sufficient balance
      if (balanceBigInt >= buyInAmount) {
        log(chalk.green(`${player.name} has sufficient funds to join with 1 ETH!`));
        await joinTable(contractAddress, player, buyInAmount);
      } else {
        log(chalk.red(`${player.name} doesn't have enough funds to join. Needs ${buyInAmount.toString()}, has ${balanceBigInt.toString()}`));
      }
      
      // Wait a bit between operations
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Step 7: Get the game state after all players have joined
    log(chalk.yellow("\nGetting game state after all players have joined..."));

    // Get game state from each player's perspective
    for (const player of PLAYERS) {
      log(chalk.yellow(`\n${player.name}'s view of the game state:`));
      log(chalk.yellow("=".repeat(50)));
      const gameState = await getGameState(contractAddress, player);
      
      // Only analyze the game state from the first player's perspective
      if (player === PLAYERS[0]) {
        await analyzeGameState(gameState);
      }
      
      log(chalk.yellow("=".repeat(50)));
      
      // Wait briefly between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Stop here as requested
    success("Test completed");
    
  } catch (err) {
    error(`Test failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the test
runTest();