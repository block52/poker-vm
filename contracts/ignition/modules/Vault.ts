import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultModule = buildModule("VaultModule", m => {
    const token = "0xe7d69c2351cdb850D5DB9e4eCd9C7a1059Db806a";
    const lock_time = 60 * 60 * 24 * 365;
    const min_stake = 10n * 10n ** 18n;

    const vault = m.contract("Vault", [token, lock_time, min_stake]);

    return { vault };
});

export default VaultModule;