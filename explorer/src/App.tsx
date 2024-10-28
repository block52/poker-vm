import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme/theme-provider";
import MempoolPage from "./components/pages/MempoolPage";
import HomePage from "./components/pages/HomePage";
import { Navbar } from "./components/ui/navbar";


function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Router>
                <div className="min-h-screen bg-background text-foreground">
                    <Navbar />
                    <main className="p-4">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/mempool" element={<MempoolPage />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;