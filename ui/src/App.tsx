import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Deposit from "./components/Deposit";
import Table from "./components/playPage/Table";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { projectId, metadata, networks, wagmiAdapter } from "./config";
import { mainnet } from "@reown/appkit/networks";
import { ToastContainer } from "react-toastify";
import Dashboard from "./components/Dashboard";
import QRDeposit from "./components/QRDeposit";
import { GameStateProvider } from "./context/GameStateContext";
import { generateCSSVariables } from "./utils/colorConfig";
import { useEffect } from "react";
import FaviconSetter from "./components/FaviconSetter";

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
    enableCoinbase: true,
    defaultNetwork: mainnet,
    allWallets: "SHOW"
});

// Main App content to be wrapped with providers
function AppContent() {
    // Inject CSS variables on mount
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = generateCSSVariables();
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <div className="bg-[#2c3245] min-h-screen">
            <FaviconSetter />
            <Routes>
                <Route path="/table/:id" element={<Table />} />
                <Route path="/deposit" element={<Deposit />} />
                <Route path="/qr-deposit" element={<QRDeposit />} />
                <Route path="/" element={<Dashboard />} />
            </Routes>
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
        </div>
    );
}

function App() {
    return (
        // Router should be the outermost wrapper
        <Router>
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiAdapter.wagmiConfig}>
                    <GameStateProvider>
                        <AppContent />
                    </GameStateProvider>
                </WagmiProvider>
            </QueryClientProvider>
        </Router>
    );
}

export default App;
