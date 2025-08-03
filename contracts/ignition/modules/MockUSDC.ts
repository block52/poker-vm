import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockUSDCModule = buildModule("MockUSDCModule", (m) => {
  // Deploy the MockUSDC contract
  const mockUSDC = m.contract("MockUSDC");

  return { mockUSDC };
});

export default MockUSDCModule;