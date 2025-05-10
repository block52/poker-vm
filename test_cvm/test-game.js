#!/usr/bin/env node

const { PlayerActionType, NonPlayerActionType, RPCMethods } = require("@bitcoinbrisbane/block52");

const axios = require("axios");
const chalk = require("chalk");
const { program } = require("commander");
const { Wallet } = require("ethers");
const path = require("path");
const dotenv = require("dotenv");

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
  baseGameConfig,
  TEN_TOKENS
} = testConstants;

// Configure CLI options
program
  .option("-u, --url <url>", "RPC URL", "http://localhost:3000")
  .option("-w, --wait <seconds>", "Wait time for mining (seconds)", "30")
  .option("-p, --players <number>", "Number of players to join (2 or 3)", "2") // Default to 2 players
  .option("-s, --seats <seats>", "Comma-separated seat numbers for each player (e.g. '1,3,5')")
  .parse(process.argv);

const options = program.opts();

// Configuration
const RPC_URL = options.url;
const WAIT_TIME = parseInt(options.wait, 10) * 1000;
const NUM_PLAYERS = parseInt(options.players, 10);

// Validate number of players
if (NUM_PLAYERS < 2 || NUM_PLAYERS > 3) {
  console.error(chalk.red("Error: Number of players must be 2 or 3"));
  process.exit(1);
}

// Parse seat assignments if provided
let SEAT_ASSIGNMENTS = [];
if (options.seats) {
  SEAT_ASSIGNMENTS = options.seats.split(",").map(seat => parseInt(seat.trim(), 10));
  if (SEAT_ASSIGNMENTS.length < NUM_PLAYERS) {
    console.error(chalk.red(`Error: Not enough seat numbers provided. Expected ${NUM_PLAYERS}, got ${SEAT_ASSIGNMENTS.length}`));
    process.exit(1);
  }
}

// Get private keys from environment variables
const PRIVATE_KEYS = [
  process.env.PRIVATE_KEY_DAN || process.env.PRIVATE_KEY_1 || "0xd33ffa661474e5de3e4e7547dee7e683c089ff433847fe22c9af4b555b085da7",
  process.env.PRIVATE_KEY_TRACEY || process.env.PRIVATE_KEY_2 || "0x0b3b0b79670811055a07a8376c6c776313e7239cfc44f645d08b3b83ca00a9dd",
  process.env.PRIVATE_KEY_HAMISH || process.env.PRIVATE_KEY_3 || "0xadea8f03e50b0d096352d294507eafe1e9d73f40de7db67837c41fd2cc71d8fa"
];

// Derive addresses from private keys - only use the number of players specified
const PLAYER_NAMES = ["Dan", "Tracey", "Hamish"];
const PLAYERS = PRIVATE_KEYS.slice(0, NUM_PLAYERS).map((privateKey, index) => {
  const wallet = new Wallet(privateKey);
  const name = PLAYER_NAMES[index];
  return {
    name,
    privateKey,
    address: wallet.address,
    wallet
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

function debug(message) {
  if (program.debug) {
    log(chalk.cyan(`[DEBUG] ${message}`));
  }
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
      // Always include these fields for consistent shape, even if they're empty
      data: requestPayload.data || null,
      signature: requestPayload.signature || null,
      publicKey: requestPayload.publicKey || null
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
      error: response.data.error || null  // Always include error field for consistent shape
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
async function joinTable(contractAddress, player, buyInAmount, actionIndex) {
  info(`Player ${player.name} (${player.address}) joining table ${contractAddress} with ${buyInAmount.toString()} tokens`);
  
  try {
    // Format parameters according to: [from, to, action, amount, nonce, index, data]
    const timestamp = Date.now();
    
    // Assign specific seat numbers based on player name or index
    let seatNumber;
    if (SEAT_ASSIGNMENTS.length > 0) {
      // Use provided seat assignments
      const playerIndex = PLAYERS.findIndex(p => p.name === player.name);
      seatNumber = SEAT_ASSIGNMENTS[playerIndex];
    } else {
      // Default seat numbers
      if (player.name === "Dan") {
        seatNumber = 1;
      } else if (player.name === "Tracey") {
        seatNumber = 2;
      } else if (player.name === "Hamish") {
        seatNumber = 3;
      }
    }
    
    // Log the seat number and action index assignment
    log(chalk.yellow(`Assigning ${player.name} to seat ${seatNumber} with action index ${actionIndex}`));
    
    // The action index is the 6th parameter, and the seat number is the 7th parameter (data)
    // Format matches [RPCMethods.PERFORM_ACTION]: [string, string, string, string | null, string, number, string]
    const params = [
      player.address,                 // from (1)
      contractAddress,                // to (2)
      NonPlayerActionType.JOIN,       // action (3)
      buyInAmount.toString(),         // amount (4)
      timestamp.toString(),           // nonce (5)
      actionIndex,                    // index (6) - action index number
      seatNumber.toString()           // data (7) - seat number as string (not number)
    ];
    
    // Log the RPC call parameters 
    log(chalk.yellow("Sending RPC call to join table:"));
    log(chalk.cyan(`Method: ${RPCMethods.PERFORM_ACTION}`));
    log(chalk.cyan(`Parameters: ${JSON.stringify(params, null, 2)}`));
    log(chalk.cyan(`Using private key for: ${player.name}`));
    
    // Send the RPC call
    const result = await rpcCall(RPCMethods.PERFORM_ACTION, params, player.privateKey);
    success(`Player ${player.name} joined successfully at seat ${seatNumber}`);
    return result;
  } catch (err) {
    error(`Failed to join table: ${err.message}`);
    console.error(err);
    process.exit(1);
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
  log("");
  info(`Getting game state for table: ${contractAddress}`);

  try {
    // Call the GET_GAME_STATE method with the contract address and player address
    const result = await rpcCall(RPCMethods.GET_GAME_STATE, [
      contractAddress,  // Table address
      player.address    // Caller address
    ], player.privateKey);
    
    if (!result) {
      error(`Failed to get game state for table ${contractAddress}`);
      return null;
    }

    success(`Retrieved game state for table: ${contractAddress}`);
    log(chalk.cyan("Game State:"));
    console.log(JSON.stringify(result, null, 2));

    // Debug seat assignments if in debug mode
    if (program.debug) {
      const players = result.data.players;
      if (players && players.length > 0) {
        debug("Seat assignments:");
        players.forEach(player => {
          debug(`Player ${player.address.slice(0, 8)}... is in seat ${player.seat}`);
        });
      }
    }
    
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

// Post small blind
async function postSmallBlind(contractAddress, player, smallBlindAmount, actionIndex) {
  info(`Player ${player.name} (${player.address}) posting small blind ${smallBlindAmount.toString()} tokens`);
  
  try {
    const timestamp = Date.now();
    
    // Based on the correct format: [from, to, action, amount, nonce, index, data]
    // index should be just the action index (number) and data is an optional 7th parameter
    const params = [
      player.address,                 // from
      contractAddress,                // to
      PlayerActionType.SMALL_BLIND,   // action
      smallBlindAmount.toString(),    // amount
      timestamp.toString(),           // nonce
      actionIndex,                    // index - IMPORTANT: Must match the expected action index (1 for small blind)
      ""                              // data - empty string as no additional data is needed
    ];
    
    // Log the RPC call parameters 
    log(chalk.yellow("Sending RPC call to post small blind:"));
    log(chalk.cyan(`Method: ${RPCMethods.PERFORM_ACTION}`));
    log(chalk.cyan(`Parameters: ${JSON.stringify(params, null, 2)}`));
    
    // Send the RPC call
    const result = await rpcCall(RPCMethods.PERFORM_ACTION, params, player.privateKey);
    success(`Player ${player.name} posted small blind successfully`);
    return result;
  } catch (err) {
    error(`Failed to post small blind: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
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
    
    // Print test configuration
    log(chalk.yellow("\nTest Configuration:"));
    log(chalk.cyan(`Number of players: ${NUM_PLAYERS}`));
    if (SEAT_ASSIGNMENTS.length > 0) {
      log(chalk.cyan(`Seat assignments: ${SEAT_ASSIGNMENTS.join(', ')}`));
    } else {
      log(chalk.cyan("Seat assignments: Default (1, 2, 3)"));
    }
    log(chalk.cyan(`RPC URL: ${RPC_URL}`));
    log(chalk.cyan(`Wait time: ${WAIT_TIME/1000} seconds`));
    
    // Step 4: Create a new contract
    log(chalk.yellow("\nCreating new game contract..."));
    const contractAddress = await createContractSchema();
    log(chalk.green(`Contract created at address: ${contractAddress}`));
    
    // Step 5: Players join the table
    log(chalk.yellow("\nPlayers joining the table..."));
    
    // Only use the first NUM_PLAYERS players
    const activePlayers = PLAYERS.slice(0, NUM_PLAYERS);
    
    // Join players to the table
    const buyInAmount = BigInt(TEN_TOKENS);
    for (let i = 0; i < activePlayers.length; i++) {
      await joinTable(contractAddress, activePlayers[i], buyInAmount, i);
      
      // Wait for mining to complete after each join
      await waitForMining();
      
      // Get current game state after each player joins
      const gameState = await getGameState(contractAddress, activePlayers[0]);
      log(chalk.cyan("\nCurrent game state after player joined:"));
      analyzeGameState(gameState);
    }
    
    // Step 6: Check the game state after all players have joined
    log(chalk.yellow("\nChecking game state after all players joined..."));
    const gameStateAfterJoin = await getGameState(contractAddress, activePlayers[0]);
    analyzeGameState(gameStateAfterJoin);
    
    // Step 7: First player posts small blind
    log(chalk.yellow("\nFirst player posting small blind..."));
    const smallBlindAmount = BigInt(ONE_TOKEN);
    await postSmallBlind(contractAddress, activePlayers[0], smallBlindAmount, 1);
    
    // Wait for mining to complete
    await waitForMining();
    
    // Step 8: Check game state after small blind
    log(chalk.yellow("\nChecking game state after small blind..."));
    const gameStateAfterSmallBlind = await getGameState(contractAddress, activePlayers[0]);
    analyzeGameState(gameStateAfterSmallBlind);
    
    // Continue with the rest of the game...
    
    log(chalk.green("\nTest completed successfully!"));
    
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run the test
runTest();