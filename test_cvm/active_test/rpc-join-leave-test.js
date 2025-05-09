const axios = require('axios');
const { ethers } = require('ethers');
const chalk = require('chalk');

// Configuration
const RPC_URL = 'http://localhost:3000';
const WAIT_TIME = 30 * 1000; // 30 seconds

// Players for testing
const PLAYERS = [
  {
    name: 'Dan',
    privateKey: '',
    address: '0xE8DE79b707BfB7d8217cF0a494370A9cC251602C'
  },
  {
    name: 'Tracey',
    privateKey: '',
    address: '0x4260E88e81E60113146092Fb9474b61C59f7552e'
  },
  {
    name: 'Hamish',
    privateKey: '',
    address: '0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD'
  }
];

// Constants from testConstants.ts
const ONE_TOKEN = '100000000000000000';
const ONE_HUNDRED_TOKENS = '10000000000000000000';

// Logging functions
function log(message) { console.log(message); }
function success(message) { console.log(chalk.green(`✅ ${message}`)); }
function error(message) { console.error(chalk.red(`❌ ${message}`)); }
function info(message) { console.log(chalk.blue(`ℹ️ ${message}`)); }

// Helper function for RPC calls
async function rpcCall(method, params = []) {
  try {
    const response = await axios.post(RPC_URL, {
      jsonrpc: '2.0',
      id: Date.now().toString(),
      method,
      params
    });
    
    if (response.data.error) {
      error(`RPC Error: ${JSON.stringify(response.data.error)}`);
      throw new Error(response.data.error.message || JSON.stringify(response.data.error));
    }
    
    return response.data.result;
  } catch (err) {
    error(`RPC Call failed: ${err.message}`);
    throw err;
  }
}

// Wait for server to be available
async function waitForServer(maxAttempts = 30) {
  log(chalk.yellow('Waiting for server to be available...'));
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(RPC_URL);
      success('Server is up and running!');
      return true;
    } catch (err) {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Server did not become available in time');
}

// Wait for mining to complete
async function waitForMining() {
  log(chalk.yellow(`Waiting for node to complete mining (${WAIT_TIME/1000}s)...`));
  await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
  success('Mining wait time completed');
}

// Create accounts for players
async function createAccounts() {
  info('Creating accounts for all players...');
  
  for (const player of PLAYERS) {
    try {
      await rpcCall('create_account', [player.privateKey]);
      success(`Created account for ${player.name} (${player.address})`);
    } catch (err) {
      // If the account already exists, this is fine
      if (err.message.includes('already exists')) {
        info(`Account for ${player.name} already exists`);
      } else {
        throw err;
      }
    }
  }
}

// Create a new game (contract schema)
async function createGame() {
  info('Creating Texas Holdem contract schema...');
  
  const category = 'poker';
  const name = 'Texas Holdem';
  // Schema format: game_type,game_variant,min_players,max_players,small_blind,big_blind,min_buyin,max_buyin,timeout
  // For this test, we're creating a game with a smaller blind and buy-in to match test constants
  const schema = `texas,cash,2,9,${ONE_TOKEN},${ethers.parseEther('2').toString()},${ONE_TOKEN},${ethers.parseEther('1000').toString()},6000`;
  
  try {
    const result = await rpcCall('create_contract_schema', [category, name, schema]);
    const contractAddress = result.data;
    success(`Contract schema created with address: ${contractAddress}`);
    return contractAddress;
  } catch (err) {
    error(`Failed to create contract schema: ${err.message}`);
    throw err;
  }
}

// Test 1: Player should be able to join a game
async function testPlayerJoin(contractAddress) {
  info('TEST: Player should be able to join a game');
  
  try {
    // Player 1 joins the game
    const player = PLAYERS[0];
    info(`${player.name} joining game at seat 1...`);
    
    // Convert to Wei (18 decimals)
    const buyInAmount = ONE_HUNDRED_TOKENS;
    
    const joinResult = await rpcCall('perform_action', [
      player.address,
      contractAddress,
      'JOIN',
      buyInAmount,
      0, // nonce
      0  // seat index
    ]);
    
    success(`${player.name} joined the game`);
    
    // Get game state to verify
    const gameState = await rpcCall('get_game_state', [contractAddress, player.address]);
    
    // Verify player is in the game
    const playerInGame = gameState.data.players.some(p => p.address.toLowerCase() === player.address.toLowerCase());
    
    if (playerInGame) {
      success('Verified player is in the game');
    } else {
      error('Player not found in game state after joining');
      throw new Error('Player join verification failed');
    }
    
    return gameState;
  } catch (err) {
    error(`Test failed: ${err.message}`);
    throw err;
  }
}

// Test 2: Player should not be able to join more than once
async function testPlayerCannotJoinTwice(contractAddress) {
  info('TEST: Player should not be able to join more than once');
  
  try {
    // Player 1 tries to join again
    const player = PLAYERS[0];
    info(`${player.name} attempting to join game again at seat 2...`);
    
    try {
      await rpcCall('perform_action', [
        player.address,
        contractAddress,
        'JOIN',
        ONE_HUNDRED_TOKENS,
        1, // nonce
        1  // different seat
      ]);
      
      error('Player was able to join twice, but should not be allowed');
      throw new Error('Player was allowed to join twice');
    } catch (err) {
      if (err.message.includes('Player already joined') || 
          err.message.includes('Operation failed')) {
        success('Correctly prevented player from joining twice');
      } else {
        throw err;
      }
    }
  } catch (err) {
    error(`Test failed: ${err.message}`);
    throw err;
  }
}

// Test 3: Should track player positions correctly
async function testPlayerPositions(contractAddress) {
  info('TEST: Should track player positions correctly');
  
  try {
    // Player 2 joins the game
    const player2 = PLAYERS[1];
    info(`${player2.name} joining game at seat 2...`);
    
    await rpcCall('perform_action', [
      player2.address,
      contractAddress,
      'JOIN',
      ONE_HUNDRED_TOKENS,
      0, // nonce
      1  // seat index (2nd seat)
    ]);
    
    success(`${player2.name} joined the game`);
    
    // Get game state to verify
    const gameState = await rpcCall('get_game_state', [contractAddress, player2.address]);
    
    // Find players by address
    const player1InGame = gameState.data.players.find(
      p => p.address.toLowerCase() === PLAYERS[0].address.toLowerCase()
    );
    const player2InGame = gameState.data.players.find(
      p => p.address.toLowerCase() === player2.address.toLowerCase()
    );
    
    if (!player1InGame || !player2InGame) {
      error('Not all players found in game state');
      throw new Error('Player verification failed');
    }
    
    // Verify player positions
    if (player1InGame.seatIndex === 0 && player2InGame.seatIndex === 1) {
      success('Verified player positions are tracked correctly');
    } else {
      error(`Incorrect player positions. Player 1: ${player1InGame.seatIndex}, Player 2: ${player2InGame.seatIndex}`);
      throw new Error('Player positions verification failed');
    }
    
    return gameState;
  } catch (err) {
    error(`Test failed: ${err.message}`);
    throw err;
  }
}

// Test 4: Player should be able to leave
async function testPlayerLeave(contractAddress) {
  info('TEST: Player should be able to leave');
  
  try {
    // Player 1 leaves the game
    const player = PLAYERS[0];
    info(`${player.name} leaving game...`);
    
    await rpcCall('perform_action', [
      player.address,
      contractAddress,
      'LEAVE',
      0, // amount to withdraw
      2, // nonce
      0  // seat index
    ]);
    
    success(`${player.name} left the game`);
    
    // Get game state to verify
    const gameState = await rpcCall('get_game_state', [contractAddress, player.address]);
    
    // Check player is no longer in the game
    const playerStillInGame = gameState.data.players.some(
      p => p.address.toLowerCase() === player.address.toLowerCase()
    );
    
    if (!playerStillInGame) {
      success('Verified player is no longer in the game');
    } else {
      error('Player still found in game state after leaving');
      throw new Error('Player leave verification failed');
    }
    
    return gameState;
  } catch (err) {
    error(`Test failed: ${err.message}`);
    throw err;
  }
}

// Main function to run all tests
async function runTests() {
  try {
    // Step 1: Wait for server to be available
    await waitForServer();
    
    // Step 2: Wait for mining to complete
    await waitForMining();
    
    // Step 3: Create accounts for all players
    await createAccounts();
    
    // Step 4: Create a new game
    const contractAddress = await createGame();
    
    // Step 5: Run tests
    await testPlayerJoin(contractAddress);
    await testPlayerCannotJoinTwice(contractAddress);
    await testPlayerPositions(contractAddress);
    await testPlayerLeave(contractAddress);
    
    success('All tests completed successfully!');
  } catch (err) {
    error(`Test suite failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the tests
runTests(); 