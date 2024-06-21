import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultModule = buildModule("VaultModule", m => {
    const token = "0x3B9a66A1e75c4be1e481d3E201771120D2c64265";
    const local_token = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const dev = "0x6e38e66E0A6eEeF959e27742e99482a3f12FEB91";

    const vault = m.contract("Vault", [token, dev]);

    return { vault };
});

export default VaultModule;