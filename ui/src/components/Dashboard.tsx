import React from "react";

const Dashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-white text-center mb-8">Block 52 Poker - Electron Desktop App</h1>

                <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                    <h2 className="text-2xl font-semibold text-white mb-4">Welcome to Block 52 Poker Desktop</h2>

                    <p className="text-gray-300 mb-6">
                        This is the desktop version of Block 52 Poker, running in Electron without Web3 wallet integration. Web3 features have been disabled for
                        this desktop version.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-white mb-2">🎮 Game Features</h3>
                            <ul className="text-gray-300 space-y-2">
                                <li>• Poker table gameplay</li>
                                <li>• Real-time game state</li>
                                <li>• Player interactions</li>
                                <li>• Game history</li>
                            </ul>
                        </div>

                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-white mb-2">💻 Desktop Features</h3>
                            <ul className="text-gray-300 space-y-2">
                                <li>• Native desktop app</li>
                                <li>• Offline capable</li>
                                <li>• Enhanced security</li>
                                <li>• Better performance</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => (window.location.href = "/table/1")}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            Enter Poker Table
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
