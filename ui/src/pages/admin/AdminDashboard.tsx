import React from "react";
import { Link } from "react-router-dom";
import { colors, hexToRgba } from "../../utils/colorConfig";

interface AdminMenuItem {
    path: string;
    label: string;
    description: string;
    icon: string;
}

const adminMenuItems: AdminMenuItem[] = [
    {
        path: "/admin/genesis",
        label: "Genesis State",
        description: "View and debug genesis configuration",
        icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    },
    {
        path: "/admin/bridge",
        label: "Bridge Admin",
        description: "Monitor and manage the USDC bridge",
        icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    },
    {
        path: "/admin/bridge-manual",
        label: "Manual Bridge Trigger",
        description: "Manually trigger bridge deposit processing",
        icon: "M13 10V3L4 14h7v7l9-11h-7z"
    },
    {
        path: "/admin/tables",
        label: "Table Admin",
        description: "Create and manage poker tables",
        icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    },
    {
        path: "/admin/test-signing",
        label: "Test Signing",
        description: "Test message signing and verification",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    }
];

const AdminDashboard: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: colors.brand.primary }}>
                    Admin Dashboard
                </h1>
                <p className="text-gray-400">
                    Development and administrative tools for managing the poker platform
                </p>
            </div>

            {/* Warning Banner */}
            <div
                className="mb-8 p-4 rounded-lg border"
                style={{
                    backgroundColor: hexToRgba("#FCD34D", 0.1),
                    borderColor: hexToRgba("#FCD34D", 0.3)
                }}
            >
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <p className="text-yellow-400 font-semibold">Development Mode Only</p>
                        <p className="text-yellow-400/70 text-sm">
                            These tools are only available in development environments.
                        </p>
                    </div>
                </div>
            </div>

            {/* Admin Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminMenuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="p-6 rounded-lg border transition-all duration-200 hover:scale-[1.02]"
                        style={{
                            backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                            borderColor: hexToRgba(colors.brand.primary, 0.2)
                        }}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className="p-3 rounded-lg"
                                style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.1) }}
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ color: colors.brand.primary }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    {item.label}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Links */}
            <div className="mt-8 pt-8 border-t" style={{ borderColor: hexToRgba(colors.brand.primary, 0.2) }}>
                <h2 className="text-xl font-semibold text-white mb-4">Quick Links</h2>
                <div className="flex flex-wrap gap-4">
                    <Link
                        to="/explorer"
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: hexToRgba(colors.brand.primary, 0.1),
                            color: colors.brand.primary
                        }}
                    >
                        Block Explorer
                    </Link>
                    <Link
                        to="/wallet"
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: hexToRgba(colors.brand.primary, 0.1),
                            color: colors.brand.primary
                        }}
                    >
                        Wallet
                    </Link>
                    <Link
                        to="/"
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: hexToRgba(colors.brand.primary, 0.1),
                            color: colors.brand.primary
                        }}
                    >
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
