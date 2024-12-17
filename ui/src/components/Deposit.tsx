import { useState } from "react";
import * as React from "react";
import useUserWalletConnect from "../hooks/useUserWalletConnect";
import useDepositUSDC from "../hooks/useDepositUSDC";
import useAllowance from "../hooks/useAllowance";
import useDecimal from "../hooks/useDecimals";
import useApprove from "../hooks/useApprove";
import { BigUnit } from "bigunit";
import spinner from "../../public/spinning-circles.svg"
import useWalletBalance from "../hooks/useWalletBalance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BaseError } from "viem";

const Deposit: React.FC = () => {
  const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || "";
  const BRIDGE_ADDRESS = import.meta.env.VITE_BRIDGE_ADDRESS || "";

  const { open, disconnect, isConnected, address } = useUserWalletConnect();
  const { submit, isDepositPending, isDepositConfirmed, isPending, depositError } = useDepositUSDC();
  const { isApprovePending, isApproveConfirmed, isLoading, approve, approveError } = useApprove();
  const [amount, setAmount] = useState<number>(0);
  const { decimals } = useDecimal(USDC_ADDRESS);
  const { allowance } = useAllowance();
  const { balance } = useWalletBalance();

  React.useEffect(() => {
    if (isDepositConfirmed) {
      toast.success(`You have deposited ${amount}USDC to address(${BRIDGE_ADDRESS}) successfully`, { autoClose: 5000 })
      setAmount(0);
    }
  }, [isDepositConfirmed])

  React.useEffect(() => {
    if (isApproveConfirmed) {
      toast.success(`You have approved ${amount}USDC successfully`, { autoClose: 5000 })
      setAmount(0);
    }
  }, [isApproveConfirmed])
  
  React.useEffect(() => {
    if (depositError) {
      toast.error(`Failed to deposit`, { autoClose: 5000 })
    }
  }, [depositError])
  
  React.useEffect(() => {
    if (approveError) {
      toast.error(`Failed to approve`, { autoClose: 5000 })
    }
  }, [approveError])

  const allowed = React.useMemo(() => {
    if (!allowance || !decimals || !amount) return false;
    const amountInBigInt = BigUnit.from(amount, decimals).toBigInt();
    return allowance >= amountInBigInt;
  }, [amount, allowance, decimals, isApproveConfirmed, isDepositConfirmed]);

  console.log(`isDepositPending:  `, isDepositPending)
  console.log(`isDepositConfirmed:  `, isDepositConfirmed)
  console.log(`isPending:  `, isPending)
  console.log(`isConnected:  `, isConnected)
  console.log(`allowance:  `, allowance)
  console.log(`isApproveLoading:  `, isLoading)
  console.log(`isApprovePending:  `, isApprovePending)
  console.log(`isApproveConfirmed: `, isApproveConfirmed)
  console.log(`allowed:  `, allowed)

  const handleApprove = async () => {
    if (!address || !decimals) {
      console.error("Missing required information");
      return;
    }

    try {
      const amountInInteger = BigUnit.from(amount, decimals);
      const tx = await approve(USDC_ADDRESS, BRIDGE_ADDRESS, amountInInteger.toBigInt());
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const handleDeposit = async () => {
    if (allowed) {
      try {
        console.log("Initiating deposit...");
        await submit(BigUnit.from(amount, decimals).toBigInt());
        console.log(`isPending:  `, isDepositPending)
        console.log("Deposit successful");
      } catch (err) {
        console.error("Deposit failed:", err);
      }
    } else {
      console.error("Insufficient allowance. Please approve more USDC.");
    }
  };

  if (isConnected === null) {
    return <></>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-4">Deposit USDC</h2>
        <button
          className={`w-full p-3 ${isConnected ? "bg-red-500" : "bg-blue-500"} text-white rounded-lg mb-4`}
          onClick={isConnected ? disconnect : open}
        >
          {isConnected ? "Disconnect" : "Connect"}
        </button>
        {address &&
          <h4 className="border-b text-blue-500 mb-2 break-words">Address: {address}</h4>
        }
        {balance &&
          <h4 className="border-b text-blue-500 mb-4">Balance: {Number(balance) / (10 ** decimals)}USDC (BASE USD Coin )</h4>
        }

        <div className="mb-4 relative">
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
          <span
            onClick={() => setAmount(Number(balance) / (10 ** decimals))}
            className="cursor-pointer bg-white py-2 text-gray-400 text-sm flex align-center justify-center absolute right-[10px] bottom-[6px]"
          >
            max
          </span>
        </div>
        <div className="flex justify-between mb-4">
          {allowed ? (
            <button
              onClick={handleDeposit}
              className="flex justify-center gap-4 w-full p-3 bg-purple-500 text-white rounded-lg ml-2"
              disabled={amount === 0 || isDepositPending || isPending}
            >
              {(isDepositPending || isPending) ? "Depositing..." : "Deposit"}
              {(isDepositPending || isPending) && <img src={spinner} />}
            </button>
          ) : (
            <button
              onClick={handleApprove}
              className={`flex justify-center gap-4 w-full p-3 bg-purple-500 text-white rounded-lg ${amount === 0 && "opacity-50"}`}
              disabled={amount === 0 || isApprovePending || isLoading}
            >
              {(isLoading || isApprovePending) ? "Approving..." : "Approve"}
              {(isLoading || isApprovePending) && <img src={spinner} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deposit;
