import { useState } from "react";
import BotTable from "./components/BotTable";
import LogsTable from "./components/LogsTable";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
    const [activeTab, setActiveTab] = useState<"bots" | "logs">("bots");

    return (
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
    );
}

export default App;
