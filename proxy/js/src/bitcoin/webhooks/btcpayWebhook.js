const express = require("express");
const crypto = require("crypto");
const { ethers } = require("ethers");
require("dotenv").config();

// Import type definitions
require("../../types/btcpay");
const axios = require("axios");
const router = express.Router();


// Ethereum configuration for Bitcoin deposits (calls Bridge directly)
const BRIDGE_ADDRESS = "0x092eEA7cE31C187Ff2DC26d0C250B011AEC1a97d"; // Bridge contract
const RPC_URL = process.env.RPC_URL;
const TEXAS_HODL_PRIVATE_KEY = process.env.TEXAS_HODL_PRIVATE_KEY; // Different private key for Bitcoin deposits

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(TEXAS_HODL_PRIVATE_KEY, provider);

// BTCPay webhook configuration
const basic_auth = process.env.BTCPAY_BASIC_AUTH;
const WEBHOOK_SECRET = process.env.BTC_PAY_SERVER_WEBHOOK_SECRET || "";

// ERC-20 ABI (just the functions we need)
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
];

/**
 * Validates BTCPay webhook signature using HMAC-SHA256
 * @param {Buffer|string} payload - Raw webhook payload
 * @param {string} signature - Signature from BTCPay header
 * @param {string} secret - Webhook secret
 * @returns {boolean} True if signature is valid
 */
function validateWebhookSignature(payload, signature, secret) {
    try {
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(payload);
        const expectedSignature = `sha256=${hmac.digest("hex")}`;
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
        console.error("Error validating webhook signature:", error);
        return false;
    }
}

// const callApproval = async (amount) => {
//     try {
        
//         const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
//         const tokenContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

//         // Check current allowance
//         const currentAllowance = await tokenContract.allowance(wallet.address, spenderAddress);
//         console.log(`Current allowance: ${ethers.formatUnits(currentAllowance, decimals)}`);

//         console.log("Bridge deposit transaction sent:", tx.hash);
//         return { success: true, hash: tx.hash };
//     } catch (error) {
//         console.error("Error calling bridge deposit:", error);
//         return { success: false, error: error.message };
//     }
// }

// /**
//  * 
//  * @param {*} amount 
//  * @param {*} receiver 
//  * @returns 
//  */
// const callDepositUnderlying = async (amount, receiver) => {
//     try {
        
//         const abi = [
//             {
//                 inputs: [
//                     { internalType: "uint256", name: "amount", type: "uint256" },
//                     { internalType: "address", name: "receiver", type: "address" }
//                 ],
//                 name: "depositUnderlying",
//                 outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//                 stateMutability: "nonpayable",
//                 type: "function"
//             }
//         ];

//         const bridgeContract = new ethers.Contract(abi, ERC20_ABI, wallet);
//         const tx = await bridgeContract.depositUnderlying(wallet.address, receiver);

//         console.log("Bridge deposit transaction sent:", tx.hash);
//         return { success: true, hash: tx.hash };
//     } catch (error) {
//         console.error("Error calling bridge deposit:", error);
//         return { success: false, error: error.message };
//     }
// }

/**
 * Calls the Bridge contract directly to deposit USDC
 * @param {string} userAddress - Block52 user address (0x...)
 * @param {ethers.BigNumber|string} amount - USDC amount formatted with 6 decimals
 * @returns {Promise<ContractResult>} Contract call result
 */
async function callBridgeDeposit(userAddress, amount) {
    console.log("=== Calling Bridge.depositUnderlying ===");
    console.log("User Address:", userAddress);
    console.log("Amount:", amount);

    try {
        // Create Bridge contract interface
        const bridgeInterface = new ethers.Interface([
            {
                inputs: [
                    { internalType: "uint256", name: "amount", type: "uint256" },
                    { internalType: "address", name: "receiver", type: "address" }
                ],
                name: "depositUnderlying",
                outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                stateMutability: "nonpayable",
                type: "function"
            }
        ]);

        // Encode the function data for Bridge.depositUnderlying(amount, receiver)
        const data = bridgeInterface.encodeFunctionData("depositUnderlying", [amount, userAddress]);
        console.log("Encoded function data:", data);

        // Send transaction to Bridge contract
        const tx = await wallet.sendTransaction({
            to: BRIDGE_ADDRESS,
            data: data,
            gasLimit: 400000, // Higher gas limit for Bridge calls
            maxFeePerGas: ethers.parseUnits("3", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei")
        });

        console.log("Bridge deposit transaction sent:", tx.hash);
        return { success: true, hash: tx.hash };
    } catch (error) {
        console.error("Error calling bridge deposit:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Main BTCPay webhook handler
 * Processes webhook events and calls deposit contract for settled payments
 */
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
    console.log("=== BTCPay Webhook Received ===");

    try {
        // Validate webhook signature if secret is provided
        if (WEBHOOK_SECRET) {
            const signature = req.headers["btcpay-sig"];
            if (!signature || !validateWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
                console.error("Invalid webhook signature");
                return res.status(401).json({ error: "Invalid signature" });
            }
        }

        const { type, invoiceId, metadata } = req.body;

        console.log("Event type:", type);
        console.log("Invoice ID:", invoiceId);
        console.log("Metadata:", metadata);

        // Only process settlement events
        if (type === "InvoiceReceivedPayment") {
            console.log("Processing payment event:", type);

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${basic_auth}`
                }
            };

            // invoiceId = "T9vemfxo3nBoCws6MsVfr4";
            const btcPayResponse = await axios.get(
                `${process.env.BTC_PAY_SERVER}/api/v1/stores/${process.env.BTC_PAY_SERVER_STORE_ID}/invoices/${invoiceId}`,
                config
            );

            if (btcPayResponse.status !== 200) {
                res.send("500");
                return;
            }

            const amount = btcPayResponse.data?.paidAmount;
            console.log("BTC amount from payload:", amount);

            if (!amount) {
                res.status(500);
                return;
            }

            // Format USDC amount with 6 decimals (USDC has 6 decimal places)
            const usdcAmountFormatted = ethers.parseUnits(amount, 6);
            console.log("USDC amount formatted for contract:", usdcAmountFormatted.toString());

            // Call the Bridge contract directly with USDC amount
            const block52Address = metadata?.itemDesc;
            if (!block52Address) {
                res.status("500");
                return;
            }

            const result = await callBridgeDeposit(block52Address, usdcAmountFormatted);

            if (result.success) {
                console.log("Successfully called Bridge contract:", result.hash);
                res.status(200).json({
                    success: true,
                    message: "Bitcoin payment processed via Bridge successfully",
                    usdcAmount: amount,
                    txHash: result.hash
                });
            } else {
                console.error("Failed to call Bridge contract:", result.error);
                res.status(500).json({
                    success: false,
                    error: "Failed to process Bridge deposit",
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

router.post("/test", async (req, res) => {
    const address = "0x2B6be678D732346c364c98905A285C938056b0A8";
    const amount = ethers.parseUnits("10", 6);

    const result = await callBridgeDeposit(address, amount);
    console.log(result);
});

router.post("/create", async (req, res) => {
    const basic_auth = process.env.BTCPAY_BASIC_AUTH;

    const config = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${basic_auth}`
        }
    };

    const b52address = req.body.b52address;

    const invoice = {
        orderId: "test",
        itemDesc: "Bitcoin Buy In",
        metadata: {
            itemCode: "Texas Hodl BuyIn",
            orderUrl: "https://bitcoin.texashodl.net",
            itemDesc: b52address,
        },
        checkout: {
            speedPolicy: "HighSpeed",
            // paymentMethods: ["string"],
            defaultPaymentMethod: "BTC-CHAIN",
            lazyPaymentMethods: true,
            expirationMinutes: 90,
            monitoringMinutes: 90,
            paymentTolerance: 0,
            //redirectURL: "string",
            redirectAutomatically: true,
            //defaultLanguage: "string"
        },
        amount: req.body.amount,
        currency: "USD"
    };

    const response = await axios.post(`https://btcpay.bitcoinpokertour.com/api/v1/stores/${process.env.BTC_PAY_SERVER_STORE_ID}/invoices`, invoice, config);
    console.log(response.data);

    res.status(200).json("");
    return;
});

// Health check endpoint
router.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Bitcoin webhook handler is running",
        bridgeAddress: BRIDGE_ADDRESS,
        walletAddress: wallet.address,
        method: "depositUnderlying"
    });
});

module.exports = router;
