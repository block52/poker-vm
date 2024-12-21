import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from "dotenv";
dotenv.config();

const PK = process.env.PK || "";

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 1337,
            forking: {
                url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
            }
        },
        base: {
			accounts: PK ? [PK] : [],
			chainId: 8453,
			url: "https://mainnet.base.org",
		},
        mainnet: {
            chainId: 1,
            url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
            accounts: PK ? [PK] : []
        },
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
            base: process.env.ETHERSCAN_API_KEY || ""
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
