import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BridgeModule = buildModule("BridgeModule", m => {
    let usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    let vault = "0x893c26846d7cE76445230B2b6285a663BF4C3BF5";
    let router = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"; // base v3 Router 2 // ethers.ZeroAddress;

    // if (m. === "mainnet") {
    //     usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    //     vault = "";
    //     router = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
    // }

    const bridge = m.contract("Bridge", [usdc, vault, router]);

    return { bridge };
});

export default BridgeModule;
