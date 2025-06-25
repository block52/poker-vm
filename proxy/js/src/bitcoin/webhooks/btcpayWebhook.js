const express = require("express");
const crypto = require("crypto");
const { ethers } = require("ethers");
require("dotenv").config();

// Import type definitions
require("../../types/btcpay");

const router = express.Router();

// BTCPay webhook configuration
const WEBHOOK_SECRET = process.env.BTCPAY_WEBHOOK_SECRET;

// Ethereum configuration (reuse from existing deposit system)
const DEPOSIT_ADDRESS = "0xADB8401D85E203F101aC715D5Aa7745a0ABcd42C";
const RPC_URL = "https://mainnet.infura.io/v3/4a91824fbc7d402886bf0d302677153f";
const PRIVATE_KEY = process.env.DEPOSIT_PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Hardcoded BTC to USDC conversion rate 
// TODO: Replace with live price feed in production
const BTC_TO_USDC_RATE = 97000; // 1 BTC = 97,000 USDC (update this rate as needed)

/**
 * Validates BTCPay webhook signature using HMAC-SHA256
 * @param {Buffer|string} payload - Raw webhook payload
 * @param {string} signature - Signature from BTCPay header
 * @param {string} secret - Webhook secret
 * @returns {boolean} True if signature is valid
 */
function validateWebhookSignature(payload, signature, secret) {
    try {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(payload);
        const expectedSignature = `sha256=${hmac.digest('hex')}`;
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error("Error validating webhook signature:", error);
        return false;
    }
}

/**
 * Calls the deposit contract to forward USDC deposit
 * @param {string} userAddress - Block52 user address (0x...)
 * @param {ethers.BigNumber|string} amount - USDC amount formatted with 6 decimals
 * @returns {Promise<ContractResult>} Contract call result
 */
async function callDepositContract(userAddress, amount) {
    console.log("=== Calling Deposit Contract ===");
    console.log("User Address:", userAddress);
    console.log("Amount:", amount);

    try {
        // Create interface for the deposit contract
        const depositInterface = new ethers.Interface([
            {
                "inputs": [
                    {"internalType": "address", "name": "user", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "forwardDepositUnderlying",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]);

        // Encode the function data
        const data = depositInterface.encodeFunctionData("forwardDepositUnderlying", [userAddress, amount]);
        console.log("Encoded function data:", data);

        // Send transaction
        const tx = await wallet.sendTransaction({
            to: DEPOSIT_ADDRESS,
            data: data,
            gasLimit: 300000,
            maxFeePerGas: ethers.parseUnits("3", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei")
        });

        console.log("Transaction sent:", tx.hash);
        return { success: true, hash: tx.hash };
    } catch (error) {
        console.error("Error calling deposit contract:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Extracts Block52 address from BTCPay invoice metadata
 * @param {Block52Metadata|Object|null} metadata - Invoice metadata
 * @returns {string|null} Block52 address or null if not found
 */
function extractBlock52Address(metadata) {
    if (!metadata) return null;
    
    // Look for b52address in metadata
    if (metadata.b52address) {
        return metadata.b52address;
    }
    
    // Also check if it's nested in other properties
    for (const key in metadata) {
        if (typeof metadata[key] === 'object' && metadata[key].b52address) {
            return metadata[key].b52address;
        }
    }
    
    return null;
}

/**
 * Main BTCPay webhook handler
 * Processes webhook events and calls deposit contract for settled payments
 */
router.post("/", express.raw({ type: 'application/json' }), async (req, res) => {
    console.log("=== BTCPay Webhook Received ===");
    
    try {
        // Validate webhook signature if secret is provided
        if (WEBHOOK_SECRET) {
            const signature = req.headers['btcpay-sig'];
            if (!signature || !validateWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
                console.error("Invalid webhook signature");
                return res.status(401).json({ error: "Invalid signature" });
            }
        }

        // Parse the webhook payload
        const payload = JSON.parse(req.body.toString());
        console.log("Webhook payload:", JSON.stringify(payload, null, 2));

        const { type, invoiceId, metadata } = payload;
        
        console.log("Event type:", type);
        console.log("Invoice ID:", invoiceId);
        console.log("Metadata:", metadata);

        // Only process settlement events
        if (type === "InvoiceSettled" || type === "InvoiceProcessing") {
            console.log("Processing payment event:", type);
            
            // Extract Block52 address from metadata
            const block52Address = extractBlock52Address(metadata);
            
            if (!block52Address) {
                console.error("No Block52 address found in metadata");
                return res.status(400).json({ error: "No Block52 address in metadata" });
            }

            console.log("Found Block52 address:", block52Address);

            // Validate the address format
            if (!ethers.isAddress(block52Address)) {
                console.error("Invalid Block52 address format:", block52Address);
                return res.status(400).json({ error: "Invalid Block52 address format" });
            }

            // Get the BTC amount from the payload
            let btcAmount = payload.amount || payload.price;
            if (!btcAmount) {
                console.error("No amount found in webhook payload");
                return res.status(400).json({ error: "No amount found in payload" });
            }

            console.log("BTC amount from payload:", btcAmount);

            // Convert BTC to USDC using hardcoded rate
            const usdcAmount = parseFloat(btcAmount) * BTC_TO_USDC_RATE;
            console.log("Converted USDC amount:", usdcAmount);

            // Format USDC amount with 6 decimals (USDC has 6 decimal places)
            const usdcAmountFormatted = ethers.parseUnits(usdcAmount.toFixed(6), 6);
            console.log("USDC amount formatted for contract:", usdcAmountFormatted.toString());

            // Call the deposit contract with USDC amount
            const result = await callDepositContract(block52Address, usdcAmountFormatted);
            
            if (result.success) {
                console.log("Successfully called deposit contract:", result.hash);
                res.status(200).json({ 
                    success: true, 
                    message: "Bitcoin payment processed successfully",
                    btcAmount: btcAmount,
                    usdcAmount: usdcAmount.toFixed(6),
                    conversionRate: BTC_TO_USDC_RATE,
                    txHash: result.hash 
                });
            } else {
                console.error("Failed to call deposit contract:", result.error);
                res.status(500).json({ 
                    success: false, 
                    error: "Failed to process deposit",
                    details: result.error 
                });
            }
        } else {
            console.log("Ignoring event type:", type);
            res.status(200).json({ message: "Event ignored" });
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Health check endpoint
router.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Bitcoin webhook handler is running" });
});

module.exports = router; 