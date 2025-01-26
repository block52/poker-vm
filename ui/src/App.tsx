import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Deposit from "./components/Deposit";
import Table from "./components/playPage/Table";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { projectId, metadata, networks, wagmiAdapter } from "./config";
import { mainnet } from "@reown/appkit/networks";
import { includeWalletIds } from "./walletIds/includeWalletIds";
import { featuredWalletIds } from "./walletIds/featuredWalletIds";
import { ToastContainer } from "react-toastify";
import Dashboard from "./components/Dashboard";
import useUserWallet from "./hooks/useUserWallet";
import QRDeposit from './components/QRDeposit';

// Move this to a separate config file (e.g., src/config.ts)
export const PROXY_URL = process.env.REACT_APP_PROXY_URL || 'https://proxy.block52.xyz';
console.log('PROXY_URL in App:', PROXY_URL); // Debug log

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
    const { account, balance, isLoading } = useUserWallet();
    
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <div className="bg-[#2c3245] min-h-screen">
                        <Routes>
                            <Route path="/table/:id" element={<Table />} />
                            <Route path="/deposit" element={<Deposit />} />
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/qr-deposit" element={<QRDeposit />} />
                        </Routes>
                    </div>
                </Router>
            </QueryClientProvider>
            <ToastContainer
                position="top-right"
                autoClose={false}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss={false}
                draggable
                pauseOnHover={false}
                closeButton={true}
                theme={"dark"}
            />
        </WagmiProvider>
    );
}

export default App;
