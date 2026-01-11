import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * CosmosBridge deployment module for Ethereum Mainnet
 *
 * This deploys the CosmosBridge contract configured for Ethereum mainnet USDC.
 *
 * Required parameters:
 * - vault: Address of the Vault contract for validator signature verification
 *
 * Deploy command:
 *   npx hardhat ignition deploy ./ignition/modules/CosmosBridgeMainnet.ts \
 *     --network mainnet \
 *     --parameters '{"vault": "<VAULT_ADDRESS>"}'
 *
 * Verify command:
 *   npx hardhat verify --network mainnet <DEPLOYED_ADDRESS> \
 *     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" \
 *     "<VAULT_ADDRESS>" \
 *     "0xE592427A0AEce92De3Edee1F18E0157C05861564"
 */
const CosmosBridgeMainnetModule = buildModule("CosmosBridgeMainnetModule", m => {
    // Ethereum Mainnet addresses
    const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC on Ethereum Mainnet
    const vault = m.getParameter("vault", "0x0000000000000000000000000000000000000000"); // Vault address (required parameter)
    const router = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 SwapRouter on Mainnet

    const cosmosBridge = m.contract("CosmosBridge", [usdc, vault, router]);

    return { cosmosBridge };
});

export default CosmosBridgeMainnetModule;
