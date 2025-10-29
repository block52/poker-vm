import { useState, useEffect } from "react";
import BotTable from "./components/BotTable";
import LogsTable from "./components/LogsTable";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
    const [activeTab, setActiveTab] = useState<"bots" | "logs">("bots");

    // Helper to get cookie value
    function getCookie(name: string) {
        const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
        return match ? decodeURIComponent(match[2]) : null;
    }

    // Helper to set cookie
    function setCookie(name: string, value: string, days = 365) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    }

    useEffect(() => {
        const key = getCookie("bot_api_key");
        if (!key) {
            const entered = window.prompt("Enter API Key for Bot API:", "");
            if (entered && entered.trim()) {
                setCookie("bot_api_key", entered.trim());
                window.location.reload();
            }
        }
    }, []);

    return (
        <div className="container-fluid mt-4">
            <h1 className="mb-4">🤖 Bot Dashboard</h1>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === "bots" ? "active" : ""}`} onClick={() => setActiveTab("bots")}>
                        Bots
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === "logs" ? "active" : ""}`} onClick={() => setActiveTab("logs")}>
                        Logs
                    </button>
                </li>
            </ul>

            <div className="tab-content">
                {activeTab === "bots" && <BotTable />}
                {activeTab === "logs" && <LogsTable />}
            </div>
        </div>
    );
}

export default App;
