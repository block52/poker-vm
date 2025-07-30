import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDC_TOKEN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";    // USDC on Ethereum
const DEPLOYED_BRIDGE = "0x092eEA7cE31C187Ff2DC26d0C250B011AEC1a97d";   // BridgeModule#Bridge on Ethereum

const DepositModule = buildModule("DepositModule", (m) => {
    // Deploy new version of Deposit contract with token and bridge addresses
    const deposit = m.contract("Deposit", [USDC_TOKEN, DEPLOYED_BRIDGE]);

    return { deposit };
});

export default DepositModule; 