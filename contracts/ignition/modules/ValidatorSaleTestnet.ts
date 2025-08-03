import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ValidatorNFTModule from "./ValidatorNFT";
import MockUSDCModule from "./MockUSDC";

const ValidatorSaleTestnetModule = buildModule("ValidatorSaleTestnetModule", (m) => {
  // Get the deployed contracts from previous modules
  const { validatorNFT } = m.useModule(ValidatorNFTModule);
  const { mockUSDC } = m.useModule(MockUSDCModule);

  // Treasury address - you'll need to replace this with the actual treasury address
  // Using a placeholder for now
  const treasuryAddress = m.getParameter("treasuryAddress", "0x0000000000000000000000000000000000000000");

  // Deploy the ValidatorSale contract with MockUSDC
  const validatorSale = m.contract("ValidatorSale", [
    validatorNFT,
    mockUSDC,
    treasuryAddress
  ]);

  // Grant MINTER_ROLE to the ValidatorSale contract
  const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
  m.call(validatorNFT, "grantRole", [MINTER_ROLE, validatorSale]);

  return { validatorNFT, mockUSDC, validatorSale };
});

export default ValidatorSaleTestnetModule;