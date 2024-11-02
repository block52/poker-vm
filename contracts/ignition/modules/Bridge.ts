import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BridgeModule = buildModule("BridgeModule", m => {
    const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const vault = "0x687e526CE88a3E2aB889b3F110cF1C3cCfebafd7"
    const lock_time = 60 * 60 * 24 * 365;

    const bridge = m.contract("Bridge", [usdc, vault, lock_time]);

    return { bridge };
});

export default BridgeModule;