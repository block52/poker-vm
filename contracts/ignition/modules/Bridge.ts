import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BridgeModule = buildModule("BridgeModule", m => {
    const token = "";
    const lock_time = 60 * 60 * 24 * 365;
    const min_stake = 1000n * 10n ** 18n;

    const bridge = m.contract("Bridge", [token, lock_time, 1000]);

    return { bridge };
});

export default BridgeModule;