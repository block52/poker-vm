import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DEPLOYED_TOKEN = "0x785282367Fb4ef95d8A9aC00bFe7609aCc0aE87D";
const DEPLOYED_BRIDGE = "0xAbaC38Bb3d9cdf0a68AA36E64a9D492C51e296ff";

const DepositTestModuleV2 = buildModule("DepositTestModuleV2", (m) => {
    const deposit = m.contract("Deposit", [DEPLOYED_TOKEN, DEPLOYED_BRIDGE]);
    return { deposit };
});

export default DepositTestModuleV2; 