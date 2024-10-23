import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultModule = buildModule("VaultModule", m => {
    // const token = "0x7D9aAe2950a2c703159Bc42d2D28882904029130";
    const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const lock_time = 60 * 60 * 24 * 365;
    const min_stake = 100n;

    const vault = m.contract("Vault", [usdc, lock_time, min_stake]);

    return { vault };
});

export default VaultModule;