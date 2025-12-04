import { colors, hexToRgba } from "../../utils/colorConfig";
import { useValidators, Validator } from "../../hooks/useValidators";

/**
 * ValidatorsTable - Displays a table of all validators with their status
 */
export function ValidatorsTable() {
    const { validators, isLoading, error, refetch } = useValidators();

    if (isLoading) {
        return (
            <div
                className="p-8 rounded-lg border text-center"
                style={{
                    backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                    borderColor: hexToRgba(colors.brand.primary, 0.2)
                }}
            >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.brand.primary }}></div>
                <p className="text-gray-400">Loading validators...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="p-8 rounded-lg border text-center"
                style={{
                    backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                    borderColor: hexToRgba("#EF4444", 0.3)
                }}
            >
                <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: colors.brand.primary }}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!validators || validators.length === 0) {
        return (
            <div
                className="p-8 rounded-lg border text-center"
                style={{
                    backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                    borderColor: hexToRgba(colors.brand.primary, 0.2)
                }}
            >
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <p className="text-gray-400 mb-2">No validators found</p>
                <p className="text-gray-500 text-sm">Deploy your first validator to get started</p>
            </div>
        );
    }

    return (
        <div
            className="rounded-lg border overflow-hidden"
            style={{
                backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                borderColor: hexToRgba(colors.brand.primary, 0.2)
            }}
        >
            {/* Table Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: hexToRgba(colors.brand.primary, 0.2) }}>
                <h2 className="text-lg font-semibold text-white">Active Validators</h2>
                <button
                    onClick={() => refetch()}
                    className="p-2 rounded-lg transition-colors hover:bg-white/10"
                    title="Refresh"
                >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-gray-400 text-sm border-b" style={{ borderColor: hexToRgba(colors.brand.primary, 0.1) }}>
                            <th className="px-4 py-3 font-medium">Validator</th>
                            <th className="px-4 py-3 font-medium">DNS</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Staked</th>
                            <th className="px-4 py-3 font-medium">SSL</th>
                            <th className="px-4 py-3 font-medium">Uptime</th>
                        </tr>
                    </thead>
                    <tbody>
                        {validators.map((validator: Validator) => (
                            <ValidatorRow key={validator.address} validator={validator} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

interface ValidatorRowProps {
    validator: Validator;
}

function ValidatorRow({ validator }: ValidatorRowProps) {
    const statusColors: Record<string, { bg: string; text: string }> = {
        active: { bg: hexToRgba("#22C55E", 0.2), text: "#22C55E" },
        inactive: { bg: hexToRgba("#EF4444", 0.2), text: "#EF4444" },
        jailed: { bg: hexToRgba("#F59E0B", 0.2), text: "#F59E0B" },
        unbonding: { bg: hexToRgba("#3B82F6", 0.2), text: "#3B82F6" },
    };

    const status = validator.status.toLowerCase();
    const statusStyle = statusColors[status] || statusColors.inactive;

    return (
        <tr className="border-b last:border-b-0 hover:bg-white/5 transition-colors" style={{ borderColor: hexToRgba(colors.brand.primary, 0.1) }}>
            <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.2) }}
                    >
                        <span className="text-white font-semibold">
                            {validator.moniker?.charAt(0)?.toUpperCase() || "V"}
                        </span>
                    </div>
                    <div>
                        <p className="text-white font-medium">{validator.moniker || "Unknown"}</p>
                        <p className="text-gray-500 text-xs font-mono">
                            {validator.address.slice(0, 10)}...{validator.address.slice(-6)}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-4">
                <span className="text-gray-300 font-mono text-sm">{validator.dns || "-"}</span>
            </td>
            <td className="px-4 py-4">
                <span
                    className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                >
                    {validator.status}
                </span>
            </td>
            <td className="px-4 py-4">
                <span className="text-white">{validator.stakedAmount} USDC</span>
            </td>
            <td className="px-4 py-4">
                {validator.sslEnabled ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                )}
            </td>
            <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${validator.uptime}%`,
                                backgroundColor: validator.uptime >= 95 ? "#22C55E" : validator.uptime >= 80 ? "#F59E0B" : "#EF4444"
                            }}
                        />
                    </div>
                    <span className="text-gray-400 text-sm">{validator.uptime}%</span>
                </div>
            </td>
        </tr>
    );
}
