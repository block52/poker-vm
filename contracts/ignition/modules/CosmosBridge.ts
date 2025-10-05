import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CosmosBridgeModule = buildModule("CosmosBridgeModule", m => {
    // Default to Base network addresses
    const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
    const vault = "0x893c26846d7cE76445230B2b6285a663BF4C3BF5"; // Vault address
    const router = "0x2626664c2603336E57B271c5C0b26F421741e481"; // Uniswap V3 SwapRouter on Base

    // For cosmosbase network, we'll use the same addresses as Base for now
    // These should be updated with actual CosmosBase addresses when available

    const cosmosBridge = m.contract("CosmosBridge", [usdc, vault, router]);

    return { cosmosBridge };
});

export default CosmosBridgeModule;