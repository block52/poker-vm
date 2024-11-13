import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BridgeModule = buildModule("BridgeModule", m => {
    const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const vault = "0x961106278AD74432a0e7e532dBed2F2906725544";
    const lock_time = 60;

    const bridge = m.contract("Bridge", [usdc, vault, lock_time]);

    return { bridge };
});

export default BridgeModule;
