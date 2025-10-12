import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import BlocksPage from "./components/BlocksPage";
import TransactionPage from "./components/TransactionPage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <nav
          style={{
            backgroundColor: "#333",
            color: "white",
            padding: "15px 20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "20px", alignItems: "center" }}>
            <h2 style={{ margin: 0, marginRight: "30px" }}>Cosmos Explorer</h2>
            <Link to="/" style={{ color: "white", textDecoration: "none", fontSize: "16px" }}>
              Latest Blocks
            </Link>
            <Link to="/transaction" style={{ color: "white", textDecoration: "none", fontSize: "16px" }}>
              Search Transaction
            </Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<BlocksPage />} />
          <Route path="/transaction" element={<TransactionPage />} />
        </Routes>

        <footer
          style={{
            marginTop: "50px",
            padding: "20px",
            textAlign: "center",
            color: "#999",
            borderTop: "1px solid #eee",
            fontSize: "14px",
          }}
        >
          <p>Cosmos Explorer for Pokerchain</p>
          <p style={{ fontSize: "12px", marginTop: "5px" }}>
            REST API: http://localhost:1317
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
