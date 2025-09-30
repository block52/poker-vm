import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RIOTokenModule = buildModule("RIOTokenModule", (m) => {
  const rioToken = m.contract("RIOToken");

  return { rioToken };
});

export default RIOTokenModule;