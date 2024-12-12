// src/components/Deposit.tsx

import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import React, { useState } from 'react';
// import { ethers } from 'ethers';

const Deposit: React.FC = () => {
  const { open } = useAppKit()
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-4">Deposit USDC</h2>

        <button
          //   onClick={connectWallet}
          className="w-full p-3 bg-blue-500 text-white rounded-lg mb-4" onClick={open}
        >
          Connect
        </button>

        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount to Deposit (USDC)
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter amount"
          />
        </div>

        <div className="flex justify-between mb-4">
          <button
            // onClick={approveUSDC}
            className="w-1/2 p-3 bg-green-500 text-white rounded-lg mr-2"
            disabled={loading}
          >
            {loading ? 'Approving...' : 'Approve'}
          </button>
          <button
            // onClick={depositToBridge}
            className="w-1/2 p-3 bg-purple-500 text-white rounded-lg ml-2"
            disabled={loading}
          >
            {loading ? 'Depositing...' : 'Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
