#!/usr/bin/env node
const axios = require('axios');
const chalk = require('chalk');
const { program } = require('commander');
const { Wallet } = require('ethers');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import constants from testConstants.ts
// Note: This requires ts-node to run or the constants file to be compiled to JS
const testConstants = require('./lucas_tests_files/testConstants');
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
  .option('-u, --url <url>', 'RPC URL', 'http://localhost:3000')
  .option('-w, --wait <seconds>', 'Wait time for mining (seconds)', '30')
  .parse(process.argv);

const options = program.opts();

// Configuration
const RPC_URL = options.url;
const WAIT_TIME = parseInt(options.wait, 10) * 1000;

// Get private keys from environment variables
const PRIVATE_KEYS = [
  process.env.PRIVATE_KEY_DAN || process.env.PRIVATE_KEY_1 || '0xd33ffa661474e5de3e4e7547dee7e683c089ff433847fe22c9af4b555b085da7',
  process.env.PRIVATE_KEY_TRACEY || process.env.PRIVATE_KEY_2 || '0x0b3b0b79670811055a07a8376c6c776313e7239cfc44f645d08b3b83ca00a9dd',
  process.env.PRIVATE_KEY_HAMISH || process.env.PRIVATE_KEY_3 || '0xadea8f03e50b0d096352d294507eafe1e9d73f40de7db67837c41fd2cc71d8fa'
];

// Derive addresses from private keys
const PLAYERS = PRIVATE_KEYS.map((privateKey, index) => {
  const wallet = new Wallet(privateKey);
  const name = ['Dan', 'Tracey', 'Hamish'][index];
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
    } catch (error) {
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

// Print player details
function printPlayerDetails() {
  log(chalk.yellow('Player Details:'));
  
  PLAYERS.forEach(player => {
    console.log(chalk.cyan(`\nPlayer: ${player.name}`));
    console.log(`Private Key: ${player.privateKey.substring(0, 10)}...${player.privateKey.substring(player.privateKey.length - 8)}`); // Only show part of the key for security
    console.log(`Address: ${player.address}`);
  });
  
  success('Addresses derived from private keys successfully');
}

// Create contract schema using NEW RPC method
async function createContractSchema() {
  info('Creating Texas Holdem contract schema...');
  
  // Format for schema: game_type,game_variant,min_players,max_players,small_blind,big_blind,min_buyin,max_buyin,timeout
  const schemaStr = `texas,cash,${gameOptions.minPlayers},${gameOptions.maxPlayers},${gameOptions.smallBlind.toString()},${gameOptions.bigBlind.toString()},${gameOptions.minBuyIn.toString()},${gameOptions.maxBuyIn.toString()},${gameOptions.timeout}`;
  
  log(chalk.yellow('Contract schema string: ' + schemaStr));
  log(chalk.yellow('This would be used with the NEW RPC method next'));
  
  // Placeholder for actual implementation for the contract schema creation using RPC
  // const result = await rpcCall('new', [
  //   "",  // Empty for auto-generated address
  //   schemaStr
  // ]);
  // 
  // const contractAddress = result.address || result;
  // success(`Contract schema created with address: ${contractAddress}`);
  // return contractAddress;
  
  return "0x0000000000000000000000000000000000000000";
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
    log(chalk.yellow('\nConstants from testConstants.ts:'));
    console.log(`ONE_TOKEN: ${ONE_TOKEN.toString()}`);
    console.log(`TWO_TOKENS: ${TWO_TOKENS.toString()}`);
    console.log(`ONE_HUNDRED_TOKENS: ${ONE_HUNDRED_TOKENS.toString()}`);
    console.log(`ONE_THOUSAND_TOKENS: ${ONE_THOUSAND_TOKENS.toString()}`);
    console.log('\nGame Options:');
    console.log(JSON.stringify(gameOptions, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2
    ));
    
    // Step 5: Create contract schema placeholder
    const contractAddress = await createContractSchema();
    
    // Stop here as requested
    success('Test completed');
    
  } catch (err) {
    error(`Test failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the test
runTest();
