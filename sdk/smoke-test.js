#!/usr/bin/env node

// Quick smoke test to verify the built SDK can be imported and make basic calls
const { CosmosClient, getDefaultCosmosConfig } = require('./dist/index.js');

async function smokeTest() {
    console.log('🧪 Starting SDK smoke test...');

    try {
        // Test 1: Can we import and instantiate the SDK?
        const config = getDefaultCosmosConfig('node1.block52.xyz');
        console.log('✅ Config created:', {
            restEndpoint: config.restEndpoint,
            chainId: config.chainId,
            denom: config.denom
        });

        const client = new CosmosClient(config);
        console.log('✅ CosmosClient instantiated');

        // Test 2: Can we get current block height?
        console.log('\n📏 Testing getHeight()...');
        const height = await client.getHeight();
        console.log('✅ Current block height:', height);

        // Test 3: Can we list games?
        console.log('\n🎮 Testing listGames()...');
        const games = await client.listGames();
        console.log('✅ Games retrieved:', games.length, 'games found');
        if (games.length > 0) {
            console.log('   Sample game:', JSON.stringify(games[0], null, 2).substring(0, 200) + '...');
        }

        // Test 4: Can we get latest block?
        console.log('\n🔗 Testing getLatestBlock()...');
        const latestBlock = await client.getLatestBlock();
        console.log('✅ Latest block retrieved, height:', latestBlock.block?.header?.height);

        console.log('\n🎉 All smoke tests passed! SDK is working correctly.');

    } catch (error) {
        console.error('❌ Smoke test failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

smokeTest();