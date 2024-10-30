import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Wallet } from "./components/wallet/Wallet";
import GamePage from "./components/pages/GamePage";
import HomePage from "./components/pages/HomePage";

import "./App.css";
import { ThemeProvider } from "./components/theme/ThemeProvider";

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="b52-ui-theme">
            <Router>
                <div className="App">
                    <div className="banner">
                        <Wallet />
                    </div>
                    <div className="content">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route
                                path="/game/:gameId"
                                element={<GamePage />}
                            />
                        </Routes>
                    </div>
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;
