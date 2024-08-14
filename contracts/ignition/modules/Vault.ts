import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

const VaultModule = buildModule("VaultModule", m => {
    const token = "0x3B9a66A1e75c4be1e481d3E201771120D2c64265";
    const lock_time = 60 * 60 * 24 * 365;
    const min_stake = 1000n * 10n ** 18n;

    const vault = m.contract("Vault", [token, lock_time, 1000]);

    return { vault };
});

export default VaultModule;