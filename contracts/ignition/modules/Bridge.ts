import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BridgeModule = buildModule("BridgeModule", m => {
    const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const vault = "0x859329813d8e500F4f6Be0fc934E53AC16670fa0";
    const lock_time = 60 * 60;

    const bridge = m.contract("Bridge", [usdc, vault, lock_time]);

    return { bridge };
});

export default BridgeModule;
