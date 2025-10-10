require('dotenv').config();
const { ethers } = require('ethers');

async function checkBalance() {
    try {
        // Get private key from .env
        const privateKey = process.env.PK;
        const apiKey = process.env.ETHERSCAN_API_KEY;

        if (!privateKey) {
            console.error('❌ Error: PK not found in .env file');
            process.exit(1);
        }

        if (!apiKey) {
            console.error('⚠️  Warning: ETHERSCAN_API_KEY not found in .env file');
            console.log('   API key is optional for balance checks, but needed for verification');
            console.log('');
        }

        // Get wallet address from private key
        const wallet = new ethers.Wallet(privateKey);
        const address = wallet.address;

        console.log('');
        console.log('🔍 Checking Balance...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📍 Address: ${address}`);
        console.log('');

        // Define chains to check
        const chains = [
            { id: 8453, name: 'Base', rpc: 'https://mainnet.base.org', explorer: 'basescan.org' },
            { id: 1, name: 'Ethereum', rpc: 'https://eth.llamarpc.com', explorer: 'etherscan.io' },
            { id: 42161, name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', explorer: 'arbiscan.io' },
            { id: 10, name: 'Optimism', rpc: 'https://mainnet.optimism.io', explorer: 'optimistic.etherscan.io' },
        ];

        // Check balance on each chain
        for (const chain of chains) {
            try {
                const provider = new ethers.JsonRpcProvider(chain.rpc);
                const balance = await provider.getBalance(address);
                const balanceInEth = ethers.formatEther(balance);

                // Use Etherscan V2 API if API key is available
                let explorerBalance = null;
                if (apiKey && chain.id === 8453) { // Only for Base using Etherscan V2 API
                    try {
                        const response = await fetch(
                            `https://api.etherscan.io/v2/api?chainid=${chain.id}&module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`
                        );
                        const data = await response.json();
                        if (data.status === '1') {
                            explorerBalance = ethers.formatEther(data.result);
                        }
                    } catch (e) {
                        // Silently fail if API call doesn't work
                    }
                }

                // Display balance
                const balanceEmoji = parseFloat(balanceInEth) > 0 ? '✅' : '⚠️ ';
                console.log(`${balanceEmoji} ${chain.name.padEnd(12)} ${balanceInEth.padStart(18)} ETH`);

                if (explorerBalance && explorerBalance !== balanceInEth) {
                    console.log(`   (Etherscan API: ${explorerBalance} ETH)`);
                }

                // Show explorer link
                console.log(`   🔗 https://${chain.explorer}/address/${address}`);
                console.log('');

            } catch (error) {
                console.log(`❌ ${chain.name.padEnd(12)} Error: ${error.message}`);
                console.log('');
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');

        // Check if we have enough on Base for deployment
        const baseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        const baseBalance = await baseProvider.getBalance(address);
        const baseBalanceInEth = parseFloat(ethers.formatEther(baseBalance));

        if (baseBalanceInEth < 0.001) {
            console.log('⚠️  WARNING: Base balance is low!');
            console.log('   Recommended: At least 0.001 ETH for contract deployment');
            console.log('   Current Base balance:', baseBalanceInEth, 'ETH');
            console.log('');
        } else {
            console.log('✅ Base balance is sufficient for deployment');
            console.log('');
        }

        // Test API key if provided
        if (apiKey) {
            console.log('🔑 Testing Etherscan API Key...');
            try {
                const response = await fetch(
                    `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`
                );
                const data = await response.json();

                if (data.status === '1') {
                    console.log('✅ API Key is valid and working!');
                    console.log(`   Balance from API: ${ethers.formatEther(data.result)} ETH`);
                } else {
                    console.log('❌ API Key test failed:', data.message || data.result);
                }
            } catch (error) {
                console.log('❌ API Key test error:', error.message);
            }
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkBalance();
