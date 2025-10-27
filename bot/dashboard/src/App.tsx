import { useState, useEffect } from "react";
import BotTable from "./components/BotTable";
import LogsTable from "./components/LogsTable";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
    const [activeTab, setActiveTab] = useState<"bots" | "logs">("bots");
    const [apiKey, setApiKey] = useState<string>("");
    const [showDialog, setShowDialog] = useState(false);

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
            setShowDialog(true);
        } else {
            setApiKey(key);
        }
    }, []);

    function handleApiKeySubmit(e: React.FormEvent) {
        e.preventDefault();
        if (apiKey) {
            setCookie("bot_api_key", apiKey);
            setShowDialog(false);
            window.location.reload();
        }
    }

    return (
        <>
            {showDialog && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <form onSubmit={handleApiKeySubmit} style={{ background: "white", padding: 32, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                        <h2>Enter API Key</h2>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="API Key"
                            style={{ width: 240, marginBottom: 16 }}
                            autoFocus
                        />
                        <br />
                        <button type="submit" className="btn btn-primary">
                            Save
                        </button>
                    </form>
                </div>
            )}
            <div className="container-fluid mt-4">
                <h1 className="mb-4">Bot Dashboard</h1>

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
        </>
    );
}

export default App;
