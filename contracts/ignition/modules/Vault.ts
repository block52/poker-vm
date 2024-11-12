import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultModule = buildModule("VaultModule", m => {
    const usdc = "0x859329813d8e500F4f6Be0fc934E53AC16670fa0";
    const lock_time = 60 * 60 * 24;
    const min_stake = 100n;

    const vault = m.contract("Vault", [usdc, lock_time, min_stake]);

    return { vault };
});

export default VaultModule;