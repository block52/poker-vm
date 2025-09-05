// Use local proxy for development, DigitalOcean for production
export const PROXY_URL = window.location.hostname === "localhost" 
    ? "http://localhost:8080"  // Local proxy server
    : "https://orca-app-ikx23.ondigitalocean.app"; // Production DigitalOcean app 
export const DEPOSIT_ADDRESS = "0xADB8401D85E203F101aC715D5Aa7745a0ABcd42C";
export const TOKEN_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
