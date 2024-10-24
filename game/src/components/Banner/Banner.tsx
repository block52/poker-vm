import React from 'react';
import { Wallet } from '../wallet/wallet';
import './Banner.css';

export const Banner: React.FC = () => {
  return (
    <div className="banner">
      <h1>B52 Game</h1>
      <Wallet />
    </div>
  );
};
