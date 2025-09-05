import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ValidatorNFTModule = buildModule("ValidatorNFTModule", (m) => {
  // Deploy the ValidatorNFT contract
  const validatorNFT = m.contract("ValidatorNFT");

  return { validatorNFT };
});

export default ValidatorNFTModule;