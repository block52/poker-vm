import React from "react";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "../../components/common/AnimatedBackground";

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
        path: "/admin/test-signing",
        label: "Test Signing",
        description: "Test message signing and verification",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    }
];

const AdminDashboard: React.FC = () => {
    return (
        <div className="min-h-screen p-8 relative">
            <AnimatedBackground />
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-400">
                        Development and administrative tools for managing the poker platform
                    </p>
                </div>

                {/* Warning Banner */}
                <div className="mb-8 bg-yellow-900/30 rounded-lg p-4 border border-yellow-700">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-yellow-200 font-semibold mb-1">Development Mode Only</h3>
                            <p className="text-yellow-300 text-sm">
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
                            className="bg-gray-800 rounded-lg p-6 border border-gray-700 transition-all duration-200 hover:bg-gray-700/50 hover:border-gray-600"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-700">
                                    <svg
                                        className="w-6 h-6 text-blue-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
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
            </div>

            {/* Powered by Block52 */}
            <div className="fixed bottom-4 left-4 flex items-center z-10 opacity-30">
                <div className="flex flex-col items-start bg-transparent px-3 py-2 rounded-lg backdrop-blur-sm border-0">
                    <div className="text-left mb-1">
                        <span className="text-xs text-white font-medium tracking-wide">POWERED BY</span>
                    </div>
                    <img src="/block52.png" alt="Block52 Logo" className="h-6 w-auto object-contain pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
