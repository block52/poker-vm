import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const defaultKey =
  "0000000000000000000000000000000000000000000000000000000000000001";
const defaultRpcUrl = "http://localhost:8545";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/0PISwk2ZJQ4XJt4-OHdq5ACx_jmnGzxX",
      accounts: {
        mnemonic: "",
        path: "m/44'/60'/0'/0", // 0x1A4222655CA7B38e5bF769251514fF75A5B402B1
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
    },
  },
  solidity: "0.8.24",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;
