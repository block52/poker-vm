import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme/theme-provider";
import { Navbar } from "./components/ui/navbar";
import BlocksPage from "./components/pages/BlocksPage";
import MempoolPage from "./components/pages/MempoolPage";
import TransactionsPage from "./components/pages/TransactionsPage";
import BlockPage from "./components/pages/BlockPage";

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="b52-ui-theme">
            <Router>
                <div className="min-h-screen bg-background text-foreground">
                    <Navbar />
                    <main className="p-4">
                        <Routes>
                            <Route path="/" element={<BlocksPage />} />
                            <Route path="/blocks" element={<BlocksPage />} />
                            <Route path="/block/:hash" element={<BlockPage />} />
                            <Route path="/mempool" element={<MempoolPage />} />
                            <Route path="/transactions" element={<TransactionsPage />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;
