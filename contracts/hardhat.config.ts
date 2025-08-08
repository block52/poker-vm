import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify"; 

import dotenv from "dotenv";
dotenv.config();

const PK = process.env.PK || "";

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 1337,
            // Temporarily disable forking for tests
            // forking: {
            //     url: `${process.env.RPC_URL}`
            // }
        },
        sepolia: {
            url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
            accounts: PK ? [PK] : [],
            chainId: 11155111
        },
        base: {
			accounts: PK ? [PK] : [],
			chainId: 8453,
			url: "https://mainnet.base.org",
		},
        baseSepolia: {
            accounts: PK ? [PK] : [],
            chainId: 84532,
            url: "https://sepolia.base.org",
        },
        mainnet: {
            chainId: 1,
            url: `${process.env.RPC_URL}`,
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
            sepolia: process.env.ETHERSCAN_API_KEY || "",
            base: process.env.ETHERSCAN_API_KEY || "",
            baseSepolia: process.env.ETHERSCAN_API_KEY || "",
            mainnet: process.env.ETHERSCAN_API_KEY || ""
        },
        customChains: [
            {
                network: "base",
                chainId: 8453,
                urls: {
                    apiURL: "https://api.basescan.org/api",
                    browserURL: "https://basescan.org"
                }
            },
            {
                network: "baseSepolia",
                chainId: 84532,
                urls: {
                    apiURL: "https://api-sepolia.basescan.org/api",
                    browserURL: "https://sepolia.basescan.org"
                }
            }
        ]
    }
};

export default config;
