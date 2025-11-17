import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface NetworkEndpoints {
    name: string;
    rpc: string;
    rest: string;
    grpc: string;
}

// TODO: Dynamic endpoint discovery from validators API
// Future enhancement: Fetch validators from /cosmos/staking/v1beta1/validators
// and dynamically build network list from validator metadata.
// Example:
//   curl -s https://block52.xyz/cosmos/staking/v1beta1/validators | jq
//   Extract validator monikers ("block52", "texashodl") and map to REST endpoints
//   This would allow automatic network discovery without hardcoding endpoints
//
// NETWORK ENDPOINT PATTERN (Reverse Proxy with Path-based Routing):
// ==================================================================
// Each validator domain uses path-based routing instead of subdomains:
//
//   Base Domain: https://block52.xyz
//   ├── REST API:  https://block52.xyz/          (Cosmos SDK REST, port 1317 proxied)
//   ├── RPC:       https://block52.xyz/rpc/      (Tendermint RPC, port 26657 proxied)
//   └── gRPC:      grpcs://block52.xyz:9443      (gRPC with TLS)
//
// Benefits:
//   - Single domain with SSL certificate
//   - CORS configured at reverse proxy level
//   - Cleaner URLs without subdomain proliferation
//   - Easy to add new endpoints as paths
//
// Same pattern applies to all validator domains (block52.xyz, texashodl.net, etc.)
//
// NETWORK STATUS (Last tested: 2025-11-05):
// ✅ Localhost - Works with `ignite chain serve`
// ❌ Block52 (node1.block52.xyz) - Currently not responding/down
// ✅ Texas Hodl (node.texashodl.net) - Working, use for production testing
//
// CLI TEST COMMANDS (run in terminal to verify endpoints):
//
// Test Localhost (when ignite chain serve is running):
//   curl -s http://localhost:26657/status | jq '.result.sync_info.latest_block_height'
//
// Test Block52:
//   curl -s --max-time 10 https://node1.block52.xyz/cosmos/base/tendermint/v1beta1/node_info | jq '.default_node_info.moniker'
//
// Test Texas Hodl:
//   curl -s https://node.texashodl.net/cosmos/base/tendermint/v1beta1/node_info | jq '.default_node_info.moniker'
//   curl -s https://node.texashodl.net/cosmos/base/tendermint/v1beta1/blocks/latest | jq '.block.header.height'
//
export const NETWORK_PRESETS: NetworkEndpoints[] = [
    // ✅ WORKING - Default for local development with `ignite chain serve`
    {
        name: "Localhost",
        rpc: "http://localhost:26657",
        rest: "http://localhost:1317",
        grpc: "http://localhost:9090"
    },
    // ✅ WORKING - Recommended for production testing
    {
        name: "Texas Hodl",
        rpc: "https://texashodl.net/rpc",
        rest: "https://node.texashodl.net",
        grpc: "grpcs://texashodl.net:9443"
    },
    // ⚠️ Block52 - Using direct ports to avoid CORS issues with HTTPS redirects
    // HTTPS endpoints return 301 redirects which cause CORS errors
    // Using direct RPC port 26657 and REST port 1317 instead
    {
        name: "Block52",
        rpc: "http://node1.block52.xyz:26657",
        rest: "https://node1.block52.xyz",
        grpc: "grpcs://node1.block52.xyz:9443"
    }
];

interface NetworkContextType {
    currentNetwork: NetworkEndpoints;
    setNetwork: (network: NetworkEndpoints) => void;
    availableNetworks: NetworkEndpoints[];
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize with the first network (Node 1 Remote)
    const [currentNetwork, setCurrentNetwork] = useState<NetworkEndpoints>(() => {
        // Try to load from localStorage
        const saved = localStorage.getItem("selectedNetwork");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return NETWORK_PRESETS[0];
            }
        }
        return NETWORK_PRESETS[0];
    });

    // Save to localStorage whenever network changes
    useEffect(() => {
        localStorage.setItem("selectedNetwork", JSON.stringify(currentNetwork));
    }, [currentNetwork]);

    const setNetwork = (network: NetworkEndpoints) => {
        setCurrentNetwork(network);
    };

    return (
        <NetworkContext.Provider
            value={{
                currentNetwork,
                setNetwork,
                availableNetworks: NETWORK_PRESETS
            }}
        >
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = (): NetworkContextType => {
    const context = useContext(NetworkContext);
    if (!context) {
        throw new Error("useNetwork must be used within a NetworkProvider");
    }
    return context;
};
