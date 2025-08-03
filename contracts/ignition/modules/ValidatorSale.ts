import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ValidatorNFTModule from "./ValidatorNFT";

const ValidatorSaleModule = buildModule("ValidatorSaleModule", (m) => {
  // Get the deployed ValidatorNFT contract from the previous module
  const { validatorNFT } = m.useModule(ValidatorNFTModule);

  // Base mainnet native USDC address
  const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  
  // Treasury address - you'll need to replace this with the actual treasury address
  // Using a placeholder for now
  const treasuryAddress = m.getParameter("treasuryAddress", "0x0000000000000000000000000000000000000000");

  // Deploy the ValidatorSale contract
  const validatorSale = m.contract("ValidatorSale", [
    validatorNFT,
    USDC_BASE,
    treasuryAddress
  ]);

  // Grant MINTER_ROLE to the ValidatorSale contract
  const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
  m.call(validatorNFT, "grantRole", [MINTER_ROLE, validatorSale]);

  return { validatorNFT, validatorSale };
});

export default ValidatorSaleModule;