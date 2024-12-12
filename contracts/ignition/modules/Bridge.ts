import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BridgeModule = buildModule("BridgeModule", m => {
    let usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    let vault = "0x961106278AD74432a0e7e532dBed2F2906725544";
    let router = "0x2626664c2603336E57B271c5C0b26F421741e481"; // base v3 Router 2 // ethers.ZeroAddress;

    // if (m. === "mainnet") {
    //     usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    //     vault = "";
    //     router = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
    // }

    const bridge = m.contract("Bridge", [usdc, vault, router]);

    return { bridge };
});

export default BridgeModule;
