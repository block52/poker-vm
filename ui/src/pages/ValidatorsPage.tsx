import { useState } from "react";
import { AnimatedBackground } from "../components/common/AnimatedBackground";
import { colors, hexToRgba } from "../utils/colorConfig";
import { ValidatorsTable } from "../components/validators/ValidatorsTable";
import { DeployValidatorModal } from "../components/validators/DeployValidatorModal";

/**
 * ValidatorsPage - Admin interface for viewing and deploying validators
 *
 * Features:
 * - View all existing validators with status
 * - Deploy new validators with DNS, SSL, and bond configuration
 * - MetaMask integration for USDC bonding to L1 contract
 */
export default function ValidatorsPage() {
    const [showDeployModal, setShowDeployModal] = useState(false);

    return (
        <div className="min-h-screen p-8 relative">
            <AnimatedBackground />
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Validators
                            </h1>
                            <p className="text-gray-400">
                                View and manage network validators and nodes
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeployModal(true)}
                            className="px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
                            style={{
                                backgroundColor: colors.brand.primary,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Deploy Validator
                            </div>
                        </button>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mb-8">
                    <div
                        className="flex items-center gap-3 p-4 rounded-lg border"
                        style={{
                            backgroundColor: hexToRgba(colors.brand.primary, 0.1),
                            borderColor: hexToRgba(colors.brand.primary, 0.3)
                        }}
                    >
                        <svg className="w-6 h-6 flex-shrink-0" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p style={{ color: colors.brand.primary }} className="font-semibold">Validator Requirements</p>
                            <p className="text-gray-400 text-sm">
                                Validators must bond USDC to the L1 contract. Ensure your MetaMask wallet has sufficient USDC before deploying.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Validators Table */}
                <ValidatorsTable />

                {/* Deploy Modal */}
                <DeployValidatorModal
                    isOpen={showDeployModal}
                    onClose={() => setShowDeployModal(false)}
                />

                {/* Powered by Block52 Footer */}
                <div className="fixed bottom-4 left-4 flex items-center z-10 opacity-30">
                    <div className="flex flex-col items-start bg-transparent px-3 py-2 rounded-lg backdrop-blur-sm border-0">
                        <div className="text-left mb-1">
                            <span className="text-xs text-white font-medium tracking-wide">POWERED BY</span>
                        </div>
                        <img src="/block52.png" alt="Block52 Logo" className="h-6 w-auto object-contain pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
