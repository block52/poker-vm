import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PokerTable from "./PokerTable"; // Adjust this import path as needed

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/table" element={<PokerTable />} />
        <Route path="/" element={<Navigate to="/table" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;