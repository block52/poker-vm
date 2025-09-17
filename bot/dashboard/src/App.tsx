import BotTable from "./components/BotTable";

function App() {
    return (
        <div className="App">
            <nav className="navbar navbar-dark bg-dark">
                <div className="container">
                    <span className="navbar-brand mb-0 h1">🤖 Bots Dashboard</span>
                </div>
            </nav>
            <BotTable />
        </div>
    );
}

export default App;
