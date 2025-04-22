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
import { PROXY_URL } from "./config/constants";
import { TableProvider } from "./context/TableContext";
// TODO: Remove TableProvider once all hooks are fully implemented and tested

console.log("PROXY_URL in App:", PROXY_URL); // Debug log

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

function App() {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <div className="bg-[#2c3245] min-h-screen">
                        <Routes>
                            <Route
                                path="/table/:id"
                                element={
                                    <TableProvider>
                                        <Table />
                                    </TableProvider>
                                }
                            />
                            <Route path="/deposit" element={<Deposit />} />
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/qr-deposit" element={<QRDeposit />} />
                        </Routes>
                    </div>
                </Router>
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
            </QueryClientProvider>
        </WagmiProvider>
    );
}

export default App;
