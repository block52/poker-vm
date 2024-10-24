import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Wallet } from './components/wallet/wallet';
import { Game } from './components/Game/Game';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <div className="banner">
          <Wallet />
        </div>
        <div className="content">
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/game/:gameId" element={<Game />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
