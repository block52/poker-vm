import React, { useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
//import './wallet.css';

export const Wallet: React.FC = () => {
  const appWallet = useWallet();
  const [b52Balance, setB52Balance] = useState(0);
  useEffect(() => {
    if (appWallet.b52 && appWallet.address) {
      debugger;
        appWallet.b52.getAccount(appWallet.address).then((account) => {
        setB52Balance(Number(account.balance));
      });
    }
  }, [appWallet.b52]);

  if (!appWallet.ethereum || !appWallet.b52) {
    return <div className="wallet-box">Loading wallet...</div>;
  }
  

  return (
    <div className="wallet-box">
      <h2>Wallet</h2>
      <p><strong>Address:</strong> {appWallet.ethereum.address}</p>
      <p><strong>B52 Balance:</strong> ${b52Balance} USD</p>
    </div>
  );
};
