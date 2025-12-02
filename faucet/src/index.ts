import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createSigningClientFromMnemonic, getAddressFromMnemonic } from "@bitcoinbrisbane/block52";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const FAUCET_AMOUNT = 10; // 10 STAKE per request
const RATE_LIMIT_HOURS = 24;
const RATE_LIMIT_MS = RATE_LIMIT_HOURS * 60 * 60 * 1000;

// Network configuration (defaults to Texas Hodl)
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "https://node.texashodl.net/rpc/";
const REST_ENDPOINT = process.env.REST_ENDPOINT || "https://node.texashodl.net";
const CHAIN_ID = process.env.CHAIN_ID || "pokerchain";

// In-memory rate limiting (resets on server restart)
// For production, use Redis or a database
const requestHistory: Map<string, number> = new Map();

// CORS configuration
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) {
            return callback(null, true);
        }

        // Allow localhost ports 3000-6000
        const localhostMatch = origin.match(/^http:\/\/localhost:(\d+)$/);
        if (localhostMatch) {
            const port = parseInt(localhostMatch[1]);
            if (port >= 3000 && port <= 6000) {
                return callback(null, true);
            }
        }

        // Allow any domain with "block" in it (e.g., block52.xyz, block52.com)
        if (origin.toLowerCase().includes("block")) {
            return callback(null, true);
        }

        // Allow any domain with "texashodl" in it
        if (origin.toLowerCase().includes("texashodl")) {
            return callback(null, true);
        }

        // Reject other origins
        console.log(`[CORS] Rejected origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
    res.json({
        status: "ok",
        version: "1.0.0",
        faucetAmount: FAUCET_AMOUNT,
        rateLimitHours: RATE_LIMIT_HOURS
    });
});

// Get faucet info
app.get("/info", async (_req: Request, res: Response) => {
    try {
        const mnemonic = process.env.FAUCET_MNEMONIC;
        if (!mnemonic) {
            return res.json({
                configured: false,
                faucetAmount: FAUCET_AMOUNT,
                rateLimitHours: RATE_LIMIT_HOURS
            });
        }

        const faucetAddress = await getAddressFromMnemonic(mnemonic, "b52");

        res.json({
            configured: true,
            faucetAddress,
            faucetAmount: FAUCET_AMOUNT,
            rateLimitHours: RATE_LIMIT_HOURS,
            network: {
                rpc: RPC_ENDPOINT,
                rest: REST_ENDPOINT,
                chainId: CHAIN_ID
            }
        });
    } catch (error: any) {
        console.error("Error getting faucet info:", error);
        res.status(500).json({ error: "Failed to get faucet info" });
    }
});

// Check if address can request (rate limit check)
app.get("/check/:address", (req: Request, res: Response) => {
    const { address } = req.params;

    if (!address || !address.startsWith("b52")) {
        return res.status(400).json({ error: "Invalid address format" });
    }

    const lastRequest = requestHistory.get(address);
    const now = Date.now();

    if (!lastRequest) {
        return res.json({
            canRequest: true,
            waitTimeMs: 0,
            waitTimeFormatted: null
        });
    }

    const timeSinceLastRequest = now - lastRequest;
    if (timeSinceLastRequest >= RATE_LIMIT_MS) {
        return res.json({
            canRequest: true,
            waitTimeMs: 0,
            waitTimeFormatted: null
        });
    }

    const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
    const hours = Math.floor(waitTime / (60 * 60 * 1000));
    const minutes = Math.floor((waitTime % (60 * 60 * 1000)) / (60 * 1000));

    res.json({
        canRequest: false,
        waitTimeMs: waitTime,
        waitTimeFormatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    });
});

// Request STAKE from faucet
app.post("/faucet", async (req: Request, res: Response) => {
    const { address } = req.body;

    // Validate address
    if (!address || typeof address !== "string") {
        return res.status(400).json({ error: "Address is required" });
    }

    if (!address.startsWith("b52")) {
        return res.status(400).json({ error: "Invalid address format. Must start with 'b52'" });
    }

    // Check rate limit
    const lastRequest = requestHistory.get(address);
    const now = Date.now();

    if (lastRequest) {
        const timeSinceLastRequest = now - lastRequest;
        if (timeSinceLastRequest < RATE_LIMIT_MS) {
            const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
            const hours = Math.floor(waitTime / (60 * 60 * 1000));
            const minutes = Math.floor((waitTime % (60 * 60 * 1000)) / (60 * 1000));
            const waitFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

            return res.status(429).json({
                error: `Rate limited. Please wait ${waitFormatted} before requesting again.`,
                waitTimeMs: waitTime,
                waitTimeFormatted: waitFormatted
            });
        }
    }

    // Get faucet mnemonic
    const mnemonic = process.env.FAUCET_MNEMONIC;
    if (!mnemonic) {
        console.error("FAUCET_MNEMONIC not set in environment");
        return res.status(503).json({ error: "Faucet not configured" });
    }

    try {
        console.log(`[Faucet] Processing request for ${address}...`);

        // Get faucet address from mnemonic
        const faucetAddress = await getAddressFromMnemonic(mnemonic, "b52");

        // Create signing client
        const signingClient = await createSigningClientFromMnemonic(
            {
                rpcEndpoint: RPC_ENDPOINT,
                restEndpoint: REST_ENDPOINT,
                chainId: CHAIN_ID,
                prefix: "b52",
                denom: "stake",
                gasPrice: "0.025stake"
            },
            mnemonic
        );

        console.log(`[Faucet] Sending ${FAUCET_AMOUNT} STAKE from ${faucetAddress} to ${address}`);

        // Send STAKE (10 STAKE = 10,000,000 ustake)
        const amount = BigInt(FAUCET_AMOUNT * 1000000);
        const txHash = await signingClient.sendTokens(
            faucetAddress,
            address,
            amount,
            "stake",
            `Faucet: ${FAUCET_AMOUNT} STAKE`
        );

        // Record the request for rate limiting
        requestHistory.set(address, now);

        console.log(`[Faucet] Success! TX: ${txHash}`);

        res.json({
            success: true,
            txHash,
            amount: FAUCET_AMOUNT,
            denom: "STAKE",
            message: `Successfully sent ${FAUCET_AMOUNT} STAKE to ${address}`
        });
    } catch (error: any) {
        console.error("[Faucet] Error:", error);

        if (error.message?.includes("insufficient funds")) {
            return res.status(503).json({
                error: "Faucet wallet is empty. Please contact an administrator."
            });
        }

        if (error.message?.includes("account does not exist")) {
            return res.status(503).json({
                error: "Faucet wallet not initialized on chain."
            });
        }

        res.status(500).json({
            error: error.message || "Failed to send tokens"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
========================================
  Block52 Testnet Faucet Server
========================================
  Port: ${PORT}
  Amount: ${FAUCET_AMOUNT} STAKE per request
  Rate Limit: ${RATE_LIMIT_HOURS} hours

  Network:
    RPC: ${RPC_ENDPOINT}
    REST: ${REST_ENDPOINT}
    Chain ID: ${CHAIN_ID}

  Endpoints:
    GET  /health     - Health check
    GET  /info       - Faucet info
    GET  /check/:addr - Check rate limit
    POST /faucet     - Request STAKE
========================================
`);

    // Check if mnemonic is configured
    if (!process.env.FAUCET_MNEMONIC) {
        console.warn("WARNING: FAUCET_MNEMONIC not set!");
        console.warn("Set it in .env file or environment variable");
    } else {
        console.log("Faucet wallet configured");
    }
});
