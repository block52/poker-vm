import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Deposit from "./components/Deposit";
import PlayPage from "./components/playPage/PlayPage";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { projectId, metadata, networks, wagmiAdapter } from "./config";
import { mainnet } from "@reown/appkit/networks";
import { includeWalletIds } from "./walletIds/includeWalletIds";
import { featuredWalletIds } from "./walletIds/featuredWalletIds";

const queryClient = new QueryClient();

// Create modal
createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata,
    features: {
        socials: false,
        email: false,
        analytics: true
    },
    featuredWalletIds: featuredWalletIds,
    includeWalletIds: includeWalletIds,
    enableCoinbase: true,
    defaultNetwork: mainnet,
    allWallets: "SHOW"
})

function App() {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <div className="bg-[#2c3245] min-h-screen">
                        <Routes>
                            <Route path="/" element={<PlayPage />} />
                            <Route path="/deposit" element={<Deposit />} />
                        </Routes>
                    </div>
                </Router>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

export default App;
