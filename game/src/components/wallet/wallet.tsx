import React from 'react';
import { useWallet } from '../../hooks/useWallet';
//import './wallet.css';

export const Wallet: React.FC = () => {
  const wallet = useWallet();

  if (!wallet) {
    return <div className="wallet-box">Loading wallet...</div>;
  }

  return (
    <div className="wallet-box">
      <h2>Wallet</h2>
      <p><strong>Address:</strong> {wallet.address}</p>
      <p><strong>Balance:</strong> 0 USD</p>
    </div>
  );
};
