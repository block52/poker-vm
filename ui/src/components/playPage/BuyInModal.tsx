import React, { useState } from "react";
import { ethers } from "ethers";
import useUserWallet from "../../hooks/useUserWallet";
import { useMinAndMaxBuyIns } from "../../hooks/useMinAndMaxBuyIns";
import { useNavigate } from "react-router-dom";

interface BuyInModalProps {
    tableId: string;
    onClose: () => void;
    onJoin: (buyInAmount: string, waitForBigBlind: boolean) => void;
}

const BuyInModal: React.FC<BuyInModalProps> = ({ tableId, onClose, onJoin }) => {
    const { balance } = useUserWallet();
    const { minBuyInWei, maxBuyInWei, minBuyInFormatted, maxBuyInFormatted } = useMinAndMaxBuyIns(tableId);

      // ──────────── derive big/small blind ────────────
  // maxBuyIn = 100 × bigBlind  ⇒  bigBlind = maxBuyIn / 100
  const bigBlind = parseFloat(maxBuyInFormatted) / 100;
  const smallBlind = bigBlind / 2;
  const stakeLabel = `$${smallBlind.toFixed(2)} / $${bigBlind.toFixed(2)}`;
    
    const [buyInAmount, setBuyInAmount] = useState("" + maxBuyInFormatted);
    const [buyInError, setBuyInError] = useState("");
    const [waitForBigBlind, setWaitForBigBlind] = useState(true);

    const navigate = useNavigate();
    const balanceFormatted = balance ? parseFloat(ethers.formatUnits(balance, 18)) : 0;

    const handleBuyInChange = (amount: string) => {
        setBuyInAmount(amount);
        setBuyInError("");
        localStorage.setItem("buy_in_amount", amount);
    };

    const handleJoinClick = () => {
        try {
            const buyInWei = ethers.parseUnits(buyInAmount, 18).toString();

            if (BigInt(buyInWei) < BigInt(minBuyInWei)) {
                setBuyInError(`Minimum buy-in is $${minBuyInFormatted}`);
                return;
            }

            if (BigInt(buyInWei) > BigInt(maxBuyInWei)) {
                setBuyInError(`Maximum buy-in is $${maxBuyInFormatted}`);
                return;
            }

            if (balanceFormatted < parseFloat(minBuyInFormatted)) {
                setBuyInError("Your available balance does not reach the minimum buy-in amount for this game. Please deposit to continue.");
                return;
            }

            localStorage.setItem("buy_in_amount", buyInAmount);
            localStorage.setItem("wait_for_big_blind", JSON.stringify(waitForBigBlind));

            onJoin(buyInAmount, waitForBigBlind);
        } catch (error) {
            setBuyInError("Invalid input amount.");
        }
    };

    const isDisabled = balanceFormatted < parseFloat(minBuyInFormatted);

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl w-96 border border-gray-700 overflow-hidden relative">
          <div className="absolute -right-8 -top-8 text-6xl opacity-10 rotate-12">
            ♠
          </div>
          <div className="absolute -left-8 -bottom-8 text-6xl opacity-10 -rotate-12">
            ♥
          </div>
  
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
            <span className="text-green-400 mr-2">♣</span>
            Buy In
            <span className="text-red-400 ml-2">♦</span>
          </h2>
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent mb-4 opacity-50"></div>
  
          {/* Playable Balance */}
          <div className="mb-4 text-center">
            <p className="text-gray-300 text-sm">Playable Balance:</p>
            <p className="text-orange-400 text-xl font-bold">
              {balanceFormatted.toFixed(2)}
            </p>
          </div>
  
          {/* Stake Dropdown (now dynamic) */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-1 font-medium text-sm">
              Select Stake
            </label>
            <select
              disabled
              value={stakeLabel}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 text-sm"
            >
              <option>{stakeLabel}</option>
            </select>
          </div>
  
          {/* Buy-In Amount Selection */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-medium text-sm">
              Select Buy-In Amount
            </label>
            <div className="flex justify-between gap-2 mb-2">
              <button
                onClick={() => handleBuyInChange(maxBuyInFormatted)}
                className="flex-1 py-2 text-sm text-white bg-gray-700 rounded"
              >
                MAX
                <br />
                {maxBuyInFormatted}
              </button>
              <button
                onClick={() => handleBuyInChange(minBuyInFormatted)}
                className="flex-1 py-2 text-sm text-white bg-gray-700 rounded"
              >
                MIN
                <br />
                {minBuyInFormatted}
              </button>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1 text-center">
                  OTHER
                </label>
                <input
                  type="number"
                  value={buyInAmount}
                  onChange={(e) => handleBuyInChange(e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm text-center focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                  placeholder="0.00"
                />
              </div>
            </div>
            {buyInError && (
              <p className="text-red-400 mt-2">⚠️ {buyInError}</p>
            )}
          </div>
  
          {/* Wait for Big Blind */}
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              className="mr-2"
              onChange={() => setWaitForBigBlind(!waitForBigBlind)}
            />
            <label className="text-gray-300 text-sm">Wait for Big Blind</label>
          </div>
  
          {/* Action Buttons */}
          <div className="flex justify-between space-x-4 mb-4">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-lg bg-gray-600 text-white font-medium flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinClick}
              disabled={isDisabled}
              className={`px-5 py-3 rounded-lg font-medium flex-1 ${
                isDisabled
                  ? "bg-gray-500 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg hover:from-green-500 hover:to-green-400 transform hover:scale-105"
              }`}
            >
              Take My Seat
            </button>
          </div>
  
          {isDisabled && (
            <div className="text-red-400 text-sm mb-4">
              Your available balance does not reach the minimum buy-in amount for
              this game. Please{" "}
              <span
                className="underline cursor-pointer text-white"
                onClick={() => navigate("/qr-deposit")}
              >
                deposit
              </span>{" "}
              to continue.
            </div>
          )}
  
          <div className="text-xs text-gray-400">
            <strong>Please Note:</strong> This table has no all-in protection.
          </div>
        </div>
      </div>
    );
};

export default BuyInModal;
