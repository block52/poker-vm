import { NetworkEndpoints } from "../context/NetworkContext";

/**
 * Represents a peer discovered via the network
 */
export interface DiscoveredPeer {
    id: string;
    moniker: string;
    remoteIp: string;
    listenAddr: string;
}

/**
 * Represents a node with its endpoints
 */
export interface DiscoveredNode {
    id: string;
    moniker: string;
    remoteIp: string;
    listenAddr: string;
    endpoints: NetworkEndpoints | null;
    isPreset: boolean;
}

/**
 * Response from /rpc/net_info endpoint
 */
interface NetInfoResponse {
    result?: {
        peers?: Array<{
            node_info: {
                id: string;
                moniker: string;
                listen_addr: string;
            };
            remote_ip: string;
        }>;
    };
}

/**
 * Cache key for localStorage
 */
const DISCOVERED_NODES_CACHE_KEY = "discovered_nodes_cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Extract domain from listen_addr (e.g., "node1.block52.xyz:26656" -> "node1.block52.xyz")
 */
function extractDomain(listenAddr: string): string | null {
    // Remove tcp:// prefix if present
    const addr = listenAddr.replace(/^tcp:\/\//, "");

    // Split by : to get host part
    const [host] = addr.split(":");

    // Check if it's a domain (not 0.0.0.0 or IP-like)
    if (host === "0.0.0.0" || host === "localhost") {
        return null;
    }

    // Check if it looks like a domain (contains letters and dots)
    if (/^[a-zA-Z]/.test(host) && host.includes(".")) {
        return host;
    }

    return null;
}

/**
 * Build potential endpoints from a discovered peer
 */
function buildEndpointsFromPeer(peer: DiscoveredPeer): NetworkEndpoints | null {
    const domain = extractDomain(peer.listenAddr);

    if (domain) {
        // Domain-based node - use HTTPS with standard paths
        return {
            name: peer.moniker,
            rest: `https://${domain}`,
            rpc: `https://${domain}/rpc/`,
            grpc: `grpcs://${domain}:9443`,
            ws: `wss://${domain}/ws`
        };
    }

    // IP-based node - these are usually firewalled, skip them
    // Most nodes don't expose REST API on raw IPs
    return null;
}

/**
 * Discover peers from a seed node using the /rpc/net_info endpoint
 */
export async function discoverPeers(seedNode: NetworkEndpoints): Promise<DiscoveredPeer[]> {
    try {
        const response = await fetch(
            `${seedNode.rpc}net_info`,
            { signal: AbortSignal.timeout(10000) }
        );

        if (!response.ok) {
            console.warn(`Failed to fetch net_info from ${seedNode.name}: ${response.status}`);
            return [];
        }

        const data: NetInfoResponse = await response.json();
        const peers = data.result?.peers || [];

        return peers.map(peer => ({
            id: peer.node_info.id,
            moniker: peer.node_info.moniker,
            listenAddr: peer.node_info.listen_addr,
            remoteIp: peer.remote_ip
        }));
    } catch (error) {
        console.warn(`Error discovering peers from ${seedNode.name}:`, error);
        return [];
    }
}

/**
 * Discover and validate nodes from multiple seed nodes
 */
export async function discoverNodes(
    seedNodes: NetworkEndpoints[],
    existingPresets: NetworkEndpoints[]
): Promise<DiscoveredNode[]> {
    const allPeers: DiscoveredPeer[] = [];
    const seenIds = new Set<string>();

    // Discover peers from all seed nodes
    for (const seed of seedNodes) {
        const peers = await discoverPeers(seed);
        for (const peer of peers) {
            if (!seenIds.has(peer.id)) {
                seenIds.add(peer.id);
                allPeers.push(peer);
            }
        }
    }

    // Convert peers to nodes
    const nodes: DiscoveredNode[] = allPeers.map(peer => {
        const endpoints = buildEndpointsFromPeer(peer);

        // Check if this matches an existing preset (by comparing domains/IPs)
        const isPreset = existingPresets.some(preset => {
            const presetDomain = new URL(preset.rest).hostname;
            const peerDomain = extractDomain(peer.listenAddr);
            return presetDomain === peerDomain || presetDomain === peer.remoteIp;
        });

        return {
            id: peer.id,
            moniker: peer.moniker,
            remoteIp: peer.remoteIp,
            listenAddr: peer.listenAddr,
            endpoints,
            isPreset
        };
    });

    return nodes;
}

/**
 * Get cached discovered nodes from localStorage
 */
export function getCachedNodes(): DiscoveredNode[] | null {
    try {
        const cached = localStorage.getItem(DISCOVERED_NODES_CACHE_KEY);
        if (!cached) return null;

        const { nodes, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        if (age > CACHE_TTL_MS) {
            localStorage.removeItem(DISCOVERED_NODES_CACHE_KEY);
            return null;
        }

        return nodes;
    } catch {
        return null;
    }
}

/**
 * Cache discovered nodes to localStorage
 */
export function cacheNodes(nodes: DiscoveredNode[]): void {
    try {
        localStorage.setItem(
            DISCOVERED_NODES_CACHE_KEY,
            JSON.stringify({
                nodes,
                timestamp: Date.now()
            })
        );
    } catch (error) {
        console.warn("Failed to cache discovered nodes:", error);
    }
}

/**
 * Clear the node discovery cache
 */
export function clearNodeCache(): void {
    localStorage.removeItem(DISCOVERED_NODES_CACHE_KEY);
}
