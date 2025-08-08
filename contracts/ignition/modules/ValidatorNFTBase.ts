import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ValidatorNFTBaseModule = buildModule("ValidatorNFTBaseModule", (m) => {
  // Deploy the ValidatorNFT contract with name and symbol
  const validatorNFT = m.contract("ValidatorNFT", ["Poker Validator NFT", "PVNFT"]);

  return { validatorNFT };
});

export default ValidatorNFTBaseModule;