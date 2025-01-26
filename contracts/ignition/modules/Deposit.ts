import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDCTOKEN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";    // USDC on Ethereum
const DEPLOYED_BRIDGE = "0xBf1e380f3D1AE31854764081C488EaDA9F4CB195";   // BridgeModule#Bridge on Ethereum

const DepositTestModule = buildModule("DepositTestModule", (m) => {
    // Deploy new version of Deposit contract with token and bridge addresses
    const deposit = m.contract("Deposit", [USDCTOKEN, DEPLOYED_BRIDGE]);

    return { deposit };
});

export default DepositTestModule; 