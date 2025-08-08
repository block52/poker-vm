import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ValidatorNFTBaseModule from "./ValidatorNFTBase";

const ValidatorSale1USDCModule = buildModule("ValidatorSale1USDCModule", (m) => {
  // Get the deployed ValidatorNFT contract from the previous module
  const { validatorNFT } = m.useModule(ValidatorNFTBaseModule);
  
  // Treasury address - you'll need to replace this with the actual treasury address
  const treasuryAddress = m.getParameter("treasuryAddress", "0x0000000000000000000000000000000000000000");

  // Deploy the ValidatorSale1USDC contract
  const validatorSale = m.contract("ValidatorSale1USDC", [
    validatorNFT,
    treasuryAddress
  ]);

  // Grant MINTER_ROLE to the ValidatorSale contract
  const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
  m.call(validatorNFT, "grantRole", [MINTER_ROLE, validatorSale]);

  return { validatorNFT, validatorSale };
});

export default ValidatorSale1USDCModule;