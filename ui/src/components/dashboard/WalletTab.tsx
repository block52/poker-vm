import React from "react";
import { colors, hexToRgba } from "../../utils/colorConfig";
import { formatAddress } from "../common/utils";

interface WalletTabProps {
    // Web3 Wallet props
    isConnected: boolean;
    address: string | undefined;
    open: () => void;
    disconnect: () => void;
    web3Balance: string;
    fetchWeb3Balance: () => void;

    // Cosmos Wallet props
    cosmosWallet: any;
    setShowCosmosImportModal: (show: boolean) => void;
    setShowCosmosTransferModal: (show: boolean) => void;

    // Deposit/Withdraw handlers
    handleDepositClick: () => void;
    handleWithdrawClick: () => void;

    // Memoized components
    DepositButton: React.ComponentType<{ onClick: () => void; disabled?: boolean }>;
    WithdrawButton: React.ComponentType<{ onClick: () => void }>;
}

export const WalletTab: React.FC<WalletTabProps> = ({
    isConnected,
    address,
    open,
    disconnect,
    web3Balance,
    fetchWeb3Balance,
    cosmosWallet,
    setShowCosmosImportModal,
    setShowCosmosTransferModal,
    handleDepositClick,
    handleWithdrawClick,
    DepositButton,
    WithdrawButton
}) => {
    const walletSectionStyle = {
        backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
        border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
    };

    const handleWalletMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.2);
    };

    const handleWalletMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.1);
    };

    return (
        <div className="space-y-6">
            {/* Web3 Wallet Section */}
            <div
                className="backdrop-blur-sm p-5 rounded-xl shadow-lg transition-all duration-300"
                style={{
                    backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.2);
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.1);
                }}
            >
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-white">
                        Web3 Wallet <span className="text-xs font-normal text-gray-400">(Optional)</span>
                    </h2>
                    <div className="relative group">
                        <svg
                            className="w-5 h-5 text-gray-400 hover:text-white cursor-help transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div
                            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20"
                            style={{
                                backgroundColor: colors.ui.bgDark,
                                border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                            }}
                        >
                            <h3 className="font-bold mb-2" style={{ color: colors.brand.primary }}>
                                External Web3 Wallet
                            </h3>
                            <p className="mb-2">Connect your favorite Web3 wallet like MetaMask, WalletConnect, or Coinbase Wallet.</p>
                            <p className="mb-2">This is completely optional - you can play using only the Block52 Game Wallet.</p>
                            <p>Having a connected wallet provides additional features and easier withdrawals in the future.</p>
                            <div
                                className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent"
                                style={{ borderTopColor: colors.ui.bgDark }}
                            ></div>
                        </div>
                    </div>
                </div>

                {!isConnected ? (
                    <button
                        onClick={open}
                        className="w-full py-3 px-4 rounded-lg transition duration-300 shadow-md hover:opacity-90"
                        style={{
                            background: `linear-gradient(135deg, ${hexToRgba(colors.brand.primary, 0.7)} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`
                        }}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-white">Connect Wallet</span>
                        </div>
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center" style={{ color: "white" }}>
                            <span>
                                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                            <button
                                onClick={disconnect}
                                className="text-xs px-3 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-lg transition duration-300 shadow-md"
                            >
                                Disconnect
                            </button>
                        </div>

                        <div
                            className="p-3 rounded-lg"
                            style={{
                                backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.2) }}
                                    >
                                        <span className="font-bold text-lg" style={{ color: colors.brand.primary }}>
                                            $
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "white" }}>
                                            Web3 Wallet USDC Balance
                                        </p>
                                        <p className="text-xs" style={{ color: colors.ui.textSecondary }}>
                                            Available on Base Chain
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <p className="text-lg font-bold" style={{ color: colors.brand.primary }}>
                                            ${web3Balance}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => fetchWeb3Balance()}
                                        className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                        title="Refresh balance"
                                    >
                                        <svg className="w-4 h-4" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Block52 Wallet Section */}
            <div
                className="backdrop-blur-sm p-5 rounded-xl shadow-lg transition-all duration-300"
                style={walletSectionStyle}
                onMouseEnter={handleWalletMouseEnter}
                onMouseLeave={handleWalletMouseLeave}
            >
                <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-white">Block52 Game Wallet</h2>
                    <div className="relative group">
                        <svg
                            className="w-5 h-5 text-gray-400 hover:text-white cursor-help transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div
                            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20"
                            style={{
                                backgroundColor: colors.ui.bgDark,
                                border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                            }}
                        >
                            <h3 className="font-bold mb-2" style={{ color: colors.brand.primary }}>
                                Layer 2 Gaming Wallet
                            </h3>
                            <p className="mb-2">This is your Layer 2 gaming wallet, automatically created for you with no Web3 wallet required!</p>
                            <p className="mb-2">You can deposit funds using ERC20 tokens, and the bridge will automatically credit your game wallet.</p>
                            <p>All your in-game funds are secured on the blockchain and can be withdrawn at any time.</p>
                            <div
                                className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent"
                                style={{ borderTopColor: colors.ui.bgDark }}
                            ></div>
                        </div>
                    </div>
                </div>

                {cosmosWallet.address && (
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                            <div
                                className="flex items-center justify-between p-2 rounded-lg"
                                style={{
                                    backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                }}
                            >
                                <p className="font-mono text-xs tracking-wider break-all hidden md:block" style={{ color: colors.brand.primary }}>
                                    {cosmosWallet.address || "No Cosmos wallet connected"}
                                </p>
                                <p className="font-mono text-xs tracking-wider md:hidden" style={{ color: colors.brand.primary }}>
                                    {cosmosWallet.address ? formatAddress(cosmosWallet.address) : "No wallet"}
                                </p>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(cosmosWallet.address || "");
                                        }}
                                        className="ml-2 p-1 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                        title="Copy address"
                                        disabled={!cosmosWallet.address}
                                    >
                                        <svg className="w-4 h-4" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Cosmos Wallet Balances Section */}
                        <div className="space-y-2 mt-3">
                            <p className="text-white text-xs font-semibold mb-2">Cosmos Balances:</p>
                            {cosmosWallet.isLoading ? (
                                <div className="text-gray-400 text-sm text-center py-2">Loading balances...</div>
                            ) : cosmosWallet.error ? (
                                <div className="text-red-400 text-sm text-center py-2">Error loading balances</div>
                            ) : !cosmosWallet.address ? (
                                <div className="text-gray-400 text-sm text-center py-2">No wallet connected</div>
                            ) : cosmosWallet.balance.length === 0 ? (
                                <div className="text-yellow-400 text-sm text-center py-2">⚠️ No tokens found - You need tokens to play!</div>
                            ) : (
                                <div className="space-y-2">
                                    {cosmosWallet.balance.map((balance: any, idx: number) => {
                                        // Format balance with proper decimals (6 for micro-denominated tokens)
                                        const isMicroDenom = balance.denom === "b52Token" || balance.denom === "usdc";
                                        const numericAmount = isMicroDenom ? Number(balance.amount) / 1_000_000 : Number(balance.amount);

                                        const displayAmount = numericAmount.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 6
                                        });

                                        // For usdc, show USD equivalent
                                        const isUSDC = balance.denom === "usdc";
                                        const usdValue = isUSDC
                                            ? numericAmount.toLocaleString("en-US", {
                                                  style: "currency",
                                                  currency: "USD",
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2
                                              })
                                            : null;

                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 rounded-lg"
                                                style={{
                                                    backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                                }}
                                            >
                                                <div>
                                                    <p className="text-white text-sm font-bold">{balance.denom}</p>
                                                    <p className="text-gray-400 text-xs">Cosmos Chain</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-white font-bold text-lg">{displayAmount}</span>
                                                        <span className="text-gray-400 text-xs">{balance.denom}</span>
                                                    </div>
                                                    {usdValue && <div className="text-gray-400 text-xs">≈ {usdValue}</div>}
                                                    <div className="text-xs text-gray-500">{Number(balance.amount).toLocaleString("en-US")} micro-units</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {cosmosWallet.address && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowCosmosTransferModal(true)}
                                        className="flex-1 px-3 py-2 text-sm text-white rounded-lg transition duration-300 shadow-md hover:opacity-90"
                                        style={{ backgroundColor: colors.brand.primary }}
                                    >
                                        Send b52USD
                                    </button>
                                    <button
                                        onClick={() => cosmosWallet.refreshBalance()}
                                        className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300"
                                    >
                                        Refresh
                                    </button>
                                </div>
                            </div>
                        )}

                        {!cosmosWallet.address && (
                            <div className="mt-2 flex justify-center">
                                <button
                                    onClick={() => setShowCosmosImportModal(true)}
                                    className="text-sm underline transition duration-300 hover:opacity-80"
                                    style={{ color: colors.brand.primary }}
                                >
                                    Import Cosmos Seed Phrase
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                            <DepositButton onClick={handleDepositClick} disabled={false} />
                            <WithdrawButton onClick={handleWithdrawClick} />
                        </div>
                        <div className="mt-2 flex justify-center gap-4">
                            <a
                                href="/wallet"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm underline transition duration-300 hover:opacity-80 flex items-center gap-1"
                                style={{ color: colors.brand.primary }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                </svg>
                                Cosmos Wallet
                            </a>
                            <a
                                href="/explorer"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm underline transition duration-300 hover:opacity-80 flex items-center gap-1"
                                style={{ color: colors.brand.primary }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                </svg>
                                Block Explorer
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletTab;
