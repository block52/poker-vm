// Use local proxy for development, DigitalOcean for production
export const PROXY_URL = window.location.hostname === "localhost"
    ? "http://localhost:8080"  // Local proxy server
    : "https://orca-app-ikx23.ondigitalocean.app"; // Production DigitalOcean app

// Ethereum Mainnet addresses (primary - default network)
export const ETH_CHAIN_ID = 1;
export const ETH_RPC_URL = "https://eth.llamarpc.com"; // Public RPC
export const ETH_USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC on Ethereum
export const COSMOS_BRIDGE_ADDRESS = "0x0000000000000000000000000000000000000000"; // TODO: Update after deployment

// Legacy Ethereum Mainnet addresses (old system - deprecated)
export const DEPOSIT_ADDRESS = "0xADB8401D85E203F101aC715D5Aa7745a0ABcd42C";
export const TOKEN_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Ethereum mainnet USDC

// Base Chain addresses (legacy/fallback)
export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL = "https://mainnet.base.org";
export const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
export const BASE_COSMOS_BRIDGE_ADDRESS = "0xcc391c8f1aFd6DB5D8b0e064BA81b1383b14FE5B"; // CosmosBridge on Base
