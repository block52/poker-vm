import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const BridgeModule = buildModule("BridgeModule", m => {
    const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const vault = "0x961106278AD74432a0e7e532dBed2F2906725544";
    const router = "0x2626664c2603336E57B271c5C0b26F421741e481"; // base v3 Router 2 // ethers.ZeroAddress;

    const bridge = m.contract("Bridge", [usdc, vault, router]);

    return { bridge };
});

export default BridgeModule;
