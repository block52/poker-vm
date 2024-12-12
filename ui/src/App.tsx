import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Deposit from "./components/Deposit";
import PlayPage from "./components/playPage/PlayPage";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { projectId, metadata, networks, wagmiAdapter } from "./config";
import { mainnet } from "@reown/appkit/networks";

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
    featuredWalletIds: [
        "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
        "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
        "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709"
    ],
    includeWalletIds: [
        "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
        "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
        "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709",
        "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393",
        "8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4",
        "c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a",
        "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369",
        "225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f"
    ],
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
                            {/* Route for the PlayPage */}
                            <Route path="/" element={<PlayPage />} />

                            {/* Route for the Deposit Page */}
                            <Route path="/deposit" element={<Deposit />} />
                        </Routes>
                    </div>
                </Router>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

export default App;
