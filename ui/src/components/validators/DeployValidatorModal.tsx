import { useState } from "react";
import { colors, hexToRgba } from "../../utils/colorConfig";
import { useDeployValidator } from "../../hooks/useValidators";
import { useAccount, useConnect } from "wagmi";
import { toast } from "react-toastify";

interface DeployValidatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * DeployValidatorModal - Modal for deploying a new validator node
 *
 * Form fields:
 * - DNS (required)
 * - SSL checkbox
 * - Deploy execution layer checkbox
 * - USDC bond amount
 * - MetaMask wallet connection
 */
export function DeployValidatorModal({ isOpen, onClose }: DeployValidatorModalProps) {
    const [dns, setDns] = useState("");
    const [sslEnabled, setSslEnabled] = useState(true);
    const [deployExecutionLayer, setDeployExecutionLayer] = useState(true);
    const [bondAmount, setBondAmount] = useState("1000");
    const [moniker, setMoniker] = useState("");

    const { address, isConnected } = useAccount();
    const { connectors, connect } = useConnect();
    const { deployValidator, isDeploying } = useDeployValidator();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!dns.trim()) {
            toast.error("DNS is required");
            return;
        }

        if (!isConnected) {
            toast.error("Please connect your wallet first");
            return;
        }

        try {
            await deployValidator({
                dns: dns.trim(),
                sslEnabled,
                deployExecutionLayer,
                bondAmount: parseFloat(bondAmount),
                moniker: moniker.trim() || undefined,
                walletAddress: address!,
            });

            toast.success("Validator deployment initiated!");
            onClose();
            resetForm();
        } catch (error: any) {
            toast.error(error.message || "Failed to deploy validator");
        }
    };

    const resetForm = () => {
        setDns("");
        setSslEnabled(true);
        setDeployExecutionLayer(true);
        setBondAmount("1000");
        setMoniker("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg mx-4 rounded-xl border shadow-2xl"
                style={{
                    backgroundColor: colors.ui.bgDark,
                    borderColor: hexToRgba(colors.brand.primary, 0.3)
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: hexToRgba(colors.brand.primary, 0.2) }}>
                    <h2 className="text-xl font-bold text-white">Deploy Validator</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Moniker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Validator Name (Moniker)
                        </label>
                        <input
                            type="text"
                            value={moniker}
                            onChange={(e) => setMoniker(e.target.value)}
                            placeholder="My Validator Node"
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-2"
                            style={{
                                borderColor: hexToRgba(colors.brand.primary, 0.3),
                            }}
                        />
                    </div>

                    {/* DNS */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            DNS <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={dns}
                            onChange={(e) => setDns(e.target.value)}
                            placeholder="validator.example.com"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-2"
                            style={{
                                borderColor: hexToRgba(colors.brand.primary, 0.3),
                            }}
                        />
                        <p className="text-gray-500 text-xs mt-1">
                            The DNS endpoint for your validator node
                        </p>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sslEnabled}
                                onChange={(e) => setSslEnabled(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-600 bg-white/5 text-blue-500 focus:ring-blue-500"
                            />
                            <div>
                                <span className="text-white font-medium">Enable SSL</span>
                                <p className="text-gray-500 text-xs">Secure connections with TLS/SSL certificates</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={deployExecutionLayer}
                                onChange={(e) => setDeployExecutionLayer(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-600 bg-white/5 text-blue-500 focus:ring-blue-500"
                            />
                            <div>
                                <span className="text-white font-medium">Deploy Execution Layer</span>
                                <p className="text-gray-500 text-xs">Include execution layer node deployment</p>
                            </div>
                        </label>
                    </div>

                    {/* Bond Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            USDC Bond Amount
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={bondAmount}
                                onChange={(e) => setBondAmount(e.target.value)}
                                min="100"
                                step="100"
                                className="w-full px-4 py-3 pr-16 rounded-lg bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-2"
                                style={{
                                    borderColor: hexToRgba(colors.brand.primary, 0.3),
                                }}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                USDC
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                            Minimum bond: 100 USDC. Higher bonds may increase validator priority.
                        </p>
                    </div>

                    {/* Wallet Connection */}
                    <div
                        className="p-4 rounded-lg border"
                        style={{
                            backgroundColor: hexToRgba(colors.brand.primary, 0.05),
                            borderColor: hexToRgba(colors.brand.primary, 0.2)
                        }}
                    >
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Wallet Connection
                        </label>
                        {isConnected ? (
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <span className="text-white font-mono text-sm">
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                </span>
                                <span className="text-green-400 text-sm">Connected</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    const metamask = connectors.find(c => c.name === "MetaMask");
                                    if (metamask) {
                                        connect({ connector: metamask });
                                    } else if (connectors[0]) {
                                        connect({ connector: connectors[0] });
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 35 33" fill="none">
                                    <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25"/>
                                    <path d="M2.04175 1L15.0519 10.809L12.7336 4.99099L2.04175 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
                                </svg>
                                Connect MetaMask
                            </button>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 rounded-lg border text-gray-300 font-medium hover:bg-white/5 transition-colors"
                            style={{ borderColor: hexToRgba(colors.brand.primary, 0.3) }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isDeploying || !isConnected || !dns.trim()}
                            className="flex-1 px-4 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: colors.brand.primary }}
                        >
                            {isDeploying ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Deploying...
                                </div>
                            ) : (
                                "Deploy Validator"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
