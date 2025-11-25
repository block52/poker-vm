// Test script to debug create game transaction
const { createSigningClientFromMnemonic, COSMOS_CONSTANTS } = require('./sdk/dist/index.js');

async function testCreateGame() {
    console.log('🧪 Testing Create Game Transaction\n');

    // Test configuration (you'll need to replace with actual values)
    const config = {
        rpcEndpoint: 'https://node1.block52.xyz/rpc/', // Trailing slash required by nginx config
        restEndpoint: 'https://node1.block52.xyz',
        chainId: COSMOS_CONSTANTS.CHAIN_ID,
        prefix: COSMOS_CONSTANTS.ADDRESS_PREFIX,
        denom: 'stake',
        gasPrice: COSMOS_CONSTANTS.DEFAULT_GAS_PRICE
    };

    // You'll need to replace this with your actual mnemonic
    // This is just a test mnemonic - DO NOT use with real funds
    const testMnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

    try {
        console.log('1️⃣ Creating signing client...');
        const signingClient = await createSigningClientFromMnemonic(config, testMnemonic);
        console.log('✅ Signing client created\n');

        console.log('2️⃣ Preparing game parameters...');
        const gameType = 'cash';
        const minPlayers = 2;
        const maxPlayers = 9;
        const minBuyIn = BigInt(1000000); // 1 USDC in micro-units
        const maxBuyIn = BigInt(10000000); // 10 USDC
        const smallBlind = BigInt(10000); // 0.01 USDC
        const bigBlind = BigInt(20000); // 0.02 USDC
        const timeout = 300; // 5 minutes

        console.log('Game Parameters:', {
            gameType,
            minPlayers,
            maxPlayers,
            minBuyIn: minBuyIn.toString(),
            maxBuyIn: maxBuyIn.toString(),
            smallBlind: smallBlind.toString(),
            bigBlind: bigBlind.toString(),
            timeout
        });
        console.log('');

        console.log('3️⃣ Calling createGame...');
        const txHash = await signingClient.createGame(
            gameType,
            minPlayers,
            maxPlayers,
            minBuyIn,
            maxBuyIn,
            smallBlind,
            bigBlind,
            timeout
        );

        console.log('\n✅ SUCCESS!');
        console.log('Transaction Hash:', txHash);

    } catch (error) {
        console.error('\n❌ ERROR!');
        console.error('Error type:', error.constructor?.name);
        console.error('Error message:', error.message);
        console.error('\nFull error object:');
        console.error(error);

        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
    }
}

console.log('COSMOS_CONSTANTS:', COSMOS_CONSTANTS);
console.log('');

// Run the test
testCreateGame().catch(console.error);
