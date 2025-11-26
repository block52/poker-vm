import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCosmosClient } from "../../utils/cosmos/client";
import { colors, hexToRgba } from "../../utils/colorConfig";
import { useNetwork } from "../../context/NetworkContext";
import { NetworkSelector } from "../../components/NetworkSelector";
import { microToUsdc } from "../../constants/currency";
import { AnimatedBackground } from "../../components/common/AnimatedBackground";

interface AccountInfo {
    address: string;
    type: string;
    balances: { denom: string; amount: string }[];
    totalUsdcValue: number;
}

export default function AllAccountsPage() {
    const navigate = useNavigate();
    const { currentNetwork } = useNetwork();

    const [accounts, setAccounts] = useState<AccountInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"balance" | "address">("balance");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [searchFilter, setSearchFilter] = useState("");

    const fetchAllAccounts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const restEndpoint = currentNetwork.rest;
            const cosmosClient = getCosmosClient({
                rpc: currentNetwork.rpc,
                rest: currentNetwork.rest
            });

            if (!cosmosClient) {
                throw new Error("Cosmos client not initialized");
            }

            // Fetch all accounts from the auth module
            const accountsResponse = await fetch(`${restEndpoint}/cosmos/auth/v1beta1/accounts?pagination.limit=1000`);

            if (!accountsResponse.ok) {
                throw new Error(`Failed to fetch accounts: ${accountsResponse.status}`);
            }

            const accountsData = await accountsResponse.json();
            const rawAccounts = accountsData.accounts || [];

            // Process accounts and fetch balances for each
            const accountsWithBalances: AccountInfo[] = await Promise.all(
                rawAccounts.map(async (account: any) => {
                    // Extract address based on account type
                    const address = account.address ||
                        account.base_account?.address ||
                        account.base_vesting_account?.base_account?.address ||
                        "";

                    // Determine account type
                    let type = "Unknown";
                    if (account["@type"]) {
                        const typePath = account["@type"];
                        type = typePath.split(".").pop() || "Unknown";
                    }

                    // Fetch balances for this account
                    let balances: { denom: string; amount: string }[] = [];
                    let totalUsdcValue = 0;

                    if (address) {
                        try {
                            const balanceResponse = await fetch(
                                `${restEndpoint}/cosmos/bank/v1beta1/balances/${address}`
                            );
                            if (balanceResponse.ok) {
                                const balanceData = await balanceResponse.json();
                                balances = balanceData.balances || [];

                                // Calculate total USDC value (sum usdc balances)
                                balances.forEach(b => {
                                    if (b.denom === "usdc" || b.denom === "uusdc") {
                                        totalUsdcValue += microToUsdc(b.amount);
                                    }
                                });
                            }
                        } catch (e) {
                            console.error(`Failed to fetch balance for ${address}:`, e);
                        }
                    }

                    return {
                        address,
                        type,
                        balances,
                        totalUsdcValue
                    };
                })
            );

            // Filter out accounts without addresses
            const validAccounts = accountsWithBalances.filter(a => a.address);

            setAccounts(validAccounts);
        } catch (err: any) {
            let errorMessage = "Failed to fetch accounts";

            if (err.message?.includes("timeout")) {
                errorMessage = "Request timeout - network may be slow";
            } else if (err.code === "ERR_NETWORK" || err.message?.includes("ECONNREFUSED")) {
                errorMessage = `Cannot connect to ${currentNetwork.name}`;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            console.error("Error fetching accounts:", err);
        } finally {
            setLoading(false);
        }
    }, [currentNetwork]);

    useEffect(() => {
        fetchAllAccounts();
    }, [fetchAllAccounts]);

    // Set page title
    useEffect(() => {
        document.title = "All Accounts - Block52 Explorer";

        return () => {
            document.title = "Block52 Chain";
        };
    }, []);

    // Sort and filter accounts
    const filteredAndSortedAccounts = useMemo(() => {
        let filtered = accounts;

        // Apply search filter
        if (searchFilter) {
            filtered = filtered.filter(a =>
                a.address.toLowerCase().includes(searchFilter.toLowerCase()) ||
                a.type.toLowerCase().includes(searchFilter.toLowerCase())
            );
        }

        // Sort
        return [...filtered].sort((a, b) => {
            if (sortBy === "balance") {
                return sortOrder === "desc"
                    ? b.totalUsdcValue - a.totalUsdcValue
                    : a.totalUsdcValue - b.totalUsdcValue;
            } else {
                return sortOrder === "desc"
                    ? b.address.localeCompare(a.address)
                    : a.address.localeCompare(b.address);
            }
        });
    }, [accounts, searchFilter, sortBy, sortOrder]);

    // Stats
    const stats = useMemo(() => {
        const totalAccounts = accounts.length;
        const totalUsdc = accounts.reduce((sum, a) => sum + a.totalUsdcValue, 0);
        const accountsWithBalance = accounts.filter(a => a.totalUsdcValue > 0).length;

        return { totalAccounts, totalUsdc, accountsWithBalance };
    }, [accounts]);

    const containerStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.ui.bgDark, 0.8),
            border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
        }),
        []
    );

    const formatBalance = (amount: string, denom: string) => {
        const value = microToUsdc(amount);
        return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${denom.replace("u", "").toUpperCase()}`;
    };

    const truncateAddress = (addr: string) => {
        if (addr.length <= 20) return addr;
        return `${addr.substring(0, 12)}...${addr.substring(addr.length - 8)}`;
    };

    const toggleSort = (field: "balance" | "address") => {
        if (sortBy === field) {
            setSortOrder(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center relative overflow-hidden p-6">
            <AnimatedBackground />

            {/* Network Selector */}
            <div className="absolute top-6 right-6 z-50">
                <NetworkSelector />
            </div>

            <div className="w-full max-w-7xl mt-12 relative z-10">
                {/* Header */}
                <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6" style={containerStyle}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-extrabold text-white mb-2">All Accounts</h1>
                            <p className="text-gray-300">View all accounts on {currentNetwork.name}</p>
                        </div>
                        <Link
                            to="/explorer"
                            className="px-4 py-2 rounded-lg transition-all text-center"
                            style={{
                                backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                border: `1px solid ${colors.brand.primary}`,
                                color: colors.brand.primary
                            }}
                        >
                            Back to Explorer
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl" style={containerStyle}>
                        <p className="text-gray-400 text-sm mb-1">Total Accounts</p>
                        <p className="text-3xl font-bold text-white">{stats.totalAccounts.toLocaleString()}</p>
                    </div>
                    <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl" style={containerStyle}>
                        <p className="text-gray-400 text-sm mb-1">Accounts With Balance</p>
                        <p className="text-3xl font-bold text-white">{stats.accountsWithBalance.toLocaleString()}</p>
                    </div>
                    <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl" style={containerStyle}>
                        <p className="text-gray-400 text-sm mb-1">Total USDC</p>
                        <p className="text-3xl font-bold" style={{ color: colors.brand.primary }}>
                            ${stats.totalUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Search and Refresh */}
                <div className="backdrop-blur-md p-4 rounded-xl shadow-2xl mb-6" style={containerStyle}>
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={e => setSearchFilter(e.target.value)}
                            placeholder="Search by address or account type..."
                            className="flex-1 px-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                            style={{
                                backgroundColor: hexToRgba(colors.ui.bgMedium, 0.8),
                                border: `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`
                            }}
                        />
                        <button
                            onClick={fetchAllAccounts}
                            disabled={loading}
                            className="px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
                            style={{
                                backgroundColor: colors.brand.primary,
                                color: "white"
                            }}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6 border-2 border-red-500" style={containerStyle}>
                        <p className="text-red-400 text-center">{error}</p>
                    </div>
                )}

                {/* Accounts Table */}
                {!error && (
                    <div className="backdrop-blur-md rounded-xl shadow-2xl overflow-hidden" style={containerStyle}>
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.brand.primary }}></div>
                                <p className="text-gray-400">Loading accounts...</p>
                            </div>
                        ) : filteredAndSortedAccounts.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-400">No accounts found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr style={{ backgroundColor: hexToRgba(colors.ui.bgMedium, 0.5) }}>
                                            <th className="px-6 py-4 text-left text-gray-400 font-semibold">#</th>
                                            <th
                                                className="px-6 py-4 text-left text-gray-400 font-semibold cursor-pointer hover:text-white transition-colors"
                                                onClick={() => toggleSort("address")}
                                            >
                                                Address {sortBy === "address" && (sortOrder === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th className="px-6 py-4 text-left text-gray-400 font-semibold">Type</th>
                                            <th
                                                className="px-6 py-4 text-right text-gray-400 font-semibold cursor-pointer hover:text-white transition-colors"
                                                onClick={() => toggleSort("balance")}
                                            >
                                                USDC Balance {sortBy === "balance" && (sortOrder === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th className="px-6 py-4 text-right text-gray-400 font-semibold">All Balances</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedAccounts.map((account, index) => (
                                            <tr
                                                key={account.address}
                                                className="border-t cursor-pointer hover:bg-white/5 transition-colors"
                                                style={{ borderColor: hexToRgba(colors.brand.primary, 0.1) }}
                                                onClick={() => navigate(`/explorer/address/${account.address}`)}
                                            >
                                                <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-white font-mono hover:underline" style={{ color: colors.brand.primary }}>
                                                        {truncateAddress(account.address)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className="px-2 py-1 rounded text-xs font-medium"
                                                        style={{
                                                            backgroundColor: hexToRgba(colors.brand.primary, 0.1),
                                                            color: colors.ui.textSecondary
                                                        }}
                                                    >
                                                        {account.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-white font-bold">
                                                        ${account.totalUsdcValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {account.balances.length === 0 ? (
                                                        <span className="text-gray-500">-</span>
                                                    ) : (
                                                        <div className="flex flex-col items-end gap-1">
                                                            {account.balances.slice(0, 3).map((b, i) => (
                                                                <span key={i} className="text-gray-300 text-sm">
                                                                    {formatBalance(b.amount, b.denom)}
                                                                </span>
                                                            ))}
                                                            {account.balances.length > 3 && (
                                                                <span className="text-gray-500 text-xs">
                                                                    +{account.balances.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Results count */}
                {!loading && !error && (
                    <div className="mt-4 text-center text-gray-400 text-sm">
                        Showing {filteredAndSortedAccounts.length} of {accounts.length} accounts
                    </div>
                )}
            </div>
        </div>
    );
}
