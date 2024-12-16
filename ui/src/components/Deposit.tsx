import { useState } from "react";
import * as React from "react";
import useUserWalletConnect from "../hooks/useUserWalletConnect";
import useDepositUSDC from "../hooks/useDepositUSDC";
import useAllowance from "../hooks/useAllowance";
import useDecimal from "../hooks/useDecimals";
import useApprove from "../hooks/useApprove";
import { BigUnit } from "bigunit";
import spinner from "../../public/spinning-circles.svg"

const Deposit: React.FC = () => {
  const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || "";
  const BRIDGE_ADDRESS = import.meta.env.VITE_BRIDGE_ADDRESS || "";

  const { open, disconnect, isConnected, address } = useUserWalletConnect();
  const [loading, setLoading] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const { decimals } = useDecimal(USDC_ADDRESS);
  const { isApprovePending, isApproveConfirmed, approve } = useApprove();
  const { allowance } = useAllowance();
  const { submit, isDepositPending, isDepositConfirmed } = useDepositUSDC();

  React.useEffect(() => {
    setConnected(isConnected);
  }, [isConnected])

  const allowed = React.useMemo(() => {
    if (!allowance || !decimals || !amount) return false; // Ensure all values are valid

    const amountInBigInt = BigUnit.from(amount, decimals).toBigInt();
    return allowance >= amountInBigInt; // Compare BigInt values directly
  }, [amount, allowance, decimals]);

  const handleApprove = async () => {
    if (!address || !decimals) {
      console.error("Missing required information");
      return;
    }

    try {
      setLoading(true);
      console.log(`loading: `, loading)
      console.log("Initiating approval...");

      const amountInInteger = BigUnit.from(amount, decimals);
      const tx = await approve(USDC_ADDRESS, BRIDGE_ADDRESS, amountInInteger.toBigInt());
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const handleDeposit = async () => {
    if (allowed) {
      try {
        setLoading(true);
        console.log("Initiating deposit...");
        await submit(BigUnit.from(amount, decimals).toBigInt());
        console.log(`isPending:  `, isDepositPending)
        console.log("Deposit successful");
      } catch (err) {
        setLoading(false);
        console.error("Deposit failed:", err);
      }
    } else {
      console.error("Insufficient allowance. Please approve more USDC.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-4">Deposit USDC</h2>
        {connected === null ? <></>
          : <button
            className={`w-full p-3 ${connected ? "bg-blue-500" : "bg-red-500"} text-white rounded-lg mb-4`}
            onClick={connected ? disconnect : open}
          >
            {connected ? "Disconnect" : "Connect"}
          </button>
        }

        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount to Deposit (USDC)
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(+e.target.value)}
            className="mt-2 w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter amount"
          />
        </div>
        <h4 className="text-violet-500 mb-4">Address: {address}</h4>
        <div className="flex justify-between mb-4">
          {allowed ? (
            <button
              onClick={handleDeposit}
              className="flex justify-center gap-4 w-full p-3 bg-purple-500 text-white rounded-lg ml-2"
              disabled={isDepositPending}
            >
              {isDepositConfirmed ? "Deposit" : isDepositPending ? "Depositing..." : "Deposit"}
              {isDepositPending && <img src={spinner} />}
            </button>
          ) : (
            <button
              onClick={handleApprove}
              className={`flex justify-center gap-4 w-full p-3 bg-purple-500 text-white rounded-lg ml-2 ${amount === 0 && "opacity-50"}`}
              disabled={amount === 0 || isApprovePending}
            >
              {isApproveConfirmed ? "Approve" : isApprovePending ? "Approving..." : "Approve"}
              {isApprovePending && <img src={spinner} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deposit;
