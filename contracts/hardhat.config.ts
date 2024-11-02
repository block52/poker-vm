import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from "dotenv";
dotenv.config();

const DEPLOYER_PRIVATE_KEY = process.env.PK || "";

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 1337
        },
        base: {
            accounts: DEPLOYER_PRIVATE_KEY,
            chainId: 8453,
            url: "https://mainnet.base.org"
        }
    },
    solidity: "0.8.24",
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 40000
    },
    etherscan: {
        apiKey: {
            base: process.env.BASESCAN_API_KEY || ""
        },
        customChains: [
            {
                network: "base",
                chainId: 8453,
                urls: {
                    apiURL: "https://api.basescan.org/api",
                    browserURL: "https://basescan.org"
                }
            }
        ]
    }
};

export default config;
