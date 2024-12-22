import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultModule = buildModule("VaultModule", m => {
    const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const lock_time = 90;
    const min_stake = 100n;

    const vault = m.contract("Vault", [usdc, lock_time, min_stake]);

    return { vault };
});

export default VaultModule;
