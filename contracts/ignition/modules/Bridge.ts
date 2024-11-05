import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BridgeModule = buildModule("BridgeModule", m => {
    const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const vault = "0x893c26846d7cE76445230B2b6285a663BF4C3BF5"
    const lock_time = 60 * 60;

    const bridge = m.contract("Bridge", [usdc, vault, lock_time]);

    return { bridge };
});

export default BridgeModule;