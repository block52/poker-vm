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
        base: {
            accounts: PK ? [PK] : [],
            chainId: 8453,
            url: "https://mainnet.base.org",
        },
        cosmosbase: {
            accounts: PK ? [PK] : [],
            chainId: 8453, // Update with actual CosmosBase chain ID when available
            url: "https://rpc.cosmosbase.network", // Update with actual CosmosBase RPC URL
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
            base: process.env.ETHERSCAN_API_KEY || "",
            cosmosbase: process.env.COSMOSBASE_API_KEY || process.env.ETHERSCAN_API_KEY || "",
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
                network: "cosmosbase",
                chainId: 8453, // Update with actual CosmosBase chain ID
                urls: {
                    apiURL: "https://api.cosmosbase.network/api", // Update with actual API URL
                    browserURL: "https://explorer.cosmosbase.network" // Update with actual explorer URL
                }
            }
        ]
    }
};

export default config;
