import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme/theme-provider";
import { Navbar } from "./components/ui/navbar";
import { Footer } from "./components/ui/Footer";
import MempoolPage from "./components/pages/MempoolPage";
import TransactionsPage from "./components/pages/TransactionsPage";
import BlockPage from "./components/pages/BlockPage";
import LatestBlocksPage from "./components/pages/LatestBlocksPage";
import { MempoolProvider } from "./contexts/MempoolContext";

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="b52-ui-theme">
            <MempoolProvider>
                <Router>
                    <div className="min-h-screen bg-background text-foreground">
                        <Navbar />
                        <main className="p-4">
                            <Routes>
                                <Route path="/" element={<LatestBlocksPage />} />
                                <Route path="/blocks" element={<LatestBlocksPage />} />
                                <Route path="/latestblocks" element={<LatestBlocksPage />} />
                                <Route path="/block/:index" element={<BlockPage />} />
                                <Route path="/mempool" element={<MempoolPage />} />
                                <Route path="/transactions" element={<TransactionsPage />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </Router>
            </MempoolProvider>
        </ThemeProvider>
    );
}

export default App;
