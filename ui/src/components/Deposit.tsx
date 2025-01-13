import { useState, useEffect } from "react";
import * as React from "react";
import useUserWalletConnect from "../hooks/useUserWalletConnect";
import useDepositUSDC from "../hooks/useDepositUSDC";
import useAllowance from "../hooks/useAllowance";
import useDecimal from "../hooks/useDecimals";
import useApprove from "../hooks/useApprove";
import { BigUnit } from "bigunit";
import spinner from "../assets/spinning-circles.svg";
import useWalletBalance from "../hooks/useWalletBalance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { STORAGE_PUBLIC_KEY } from "../hooks/useUserWallet";
import { CONTRACT_ADDRESSES } from "../constants";
import { toDollarFromString } from "../utils/numberUtils";

const Deposit: React.FC = () => {
    const USDC_ADDRESS = CONTRACT_ADDRESSES.USDC;
    const BRIDGE_ADDRESS = CONTRACT_ADDRESSES.bridgeAddress;

    const { open, disconnect, isConnected, address } = useUserWalletConnect();
    const { submit, isDepositPending, isDepositConfirmed, isPending, depositError } = useDepositUSDC();
    const { isApprovePending, isApproveConfirmed, isLoading, approve, approveError } = useApprove();
    const [publicKey, setPublicKey] = useState<string>();
    const [amount, setAmount] = useState<string>("0");
    const { decimals } = useDecimal(USDC_ADDRESS);
    const [walletAllowance, setWalletAllowance] = useState<bigint>(BigInt(0));
    const [tmpWalletAllowance, setTmpWalletAllowance] = useState<bigint>(BigInt(0));
    const [tmpDepositAmount, setTmpDepositAmount] = useState<bigint>(BigInt(0));
    const { allowance } = useAllowance();
    const { balance } = useWalletBalance();

    // console.log("allowance: ", allowance);
    // console.log("balance: ", balance);

    const navigate = useNavigate();

    useEffect(() => {
        if (allowance) {
            setWalletAllowance(allowance);
        }
    }, [allowance]);

    useEffect(() => {
        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, []);

    useEffect(() => {
        if (isDepositConfirmed) {
            toast.success(`You have deposited ${amount}USDC to address(${BRIDGE_ADDRESS}) successfully`, { autoClose: 5000 });
            setAmount("0");
            setWalletAllowance(walletAllowance - tmpDepositAmount)
        }
    }, [isDepositConfirmed]);

    useEffect(() => {
        if (isApproveConfirmed) {
            toast.success(`You have approved ${amount}USDC successfully`, { autoClose: 5000 });
            setAmount("0");
            setWalletAllowance(tmpWalletAllowance)
        }
    }, [isApproveConfirmed]);

    useEffect(() => {
        if (depositError) {
            toast.error(`Failed to deposit`, { autoClose: 5000 });
        }
    }, [depositError]);

    useEffect(() => {
        if (approveError) {
            toast.error(`Failed to approve`, { autoClose: 5000 });
        }
    }, [approveError]);

    const allowed = React.useMemo(() => {
        if (!walletAllowance || !decimals || !+amount) return false;
        const amountInBigInt = BigUnit.from(+amount, decimals).toBigInt();
        return walletAllowance >= amountInBigInt;
    }, [amount, walletAllowance, decimals, isApproveConfirmed, isDepositConfirmed]);

    const handleApprove = async () => {
        if (!address || !decimals) {
            console.error("Missing required information");
            return;
        }
    
        try {
            const amountInInteger = BigUnit.from(+amount, decimals);
            const tx = await approve(USDC_ADDRESS, BRIDGE_ADDRESS, amountInInteger.toBigInt());
            setTmpWalletAllowance(amountInInteger.toBigInt()); // Fixed incorrect function call
        } catch (err) {
            console.error("Approval failed:", err);
        }
    };
    
    const handleDeposit = async () => {
        if (allowed) {
            try {
                console.log("Initiating deposit...");
                if (publicKey) {
                    await submit(BigUnit.from(+amount, decimals).toBigInt(), publicKey, USDC_ADDRESS);
                    setTmpDepositAmount(BigUnit.from(+amount, decimals).toBigInt()); // Fixed incorrect function call
                }
                console.log(`isPending:  `, isDepositPending);
                console.log("Deposit successful");
            } catch (err) {
                console.error("Deposit failed:", err);
            }
        } else {
            console.error("Insufficient allowance. Please approve more USDC.");
        }
    };
    

    const handleGoBack = () => {
        navigate("/");
    };

    if (isConnected === null) {
        return <></>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white relative">
            <button
                type="button"
                className="absolute top-8 left-8 flex items-center gap-2 py-1 px-2 text-lg border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-black rounded-lg"
                onClick={handleGoBack}
            >
                <i className="bi bi-arrow-left"></i>
                Lobby
            </button>
            <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-center mb-4">Deposit USDC</h2>
                <button
                    className={`w-full p-3 ${isConnected ? "bg-red-500" : "bg-blue-500"} text-white rounded-lg mb-4`}
                    onClick={isConnected ? disconnect : open}
                >
                    {isConnected ? "Disconnect" : "Connect Your Web3 Wallet"}
                </button>
                {address && <h4 className="border-b border-gray-600 text-blue-400 mb-2 break-words">Address: {address}</h4>}
                {balance && <h4 className="border-b border-gray-600 text-blue-400 mb-4">Balance: {balance} USDC</h4>}

                <div className="mb-4 relative">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
                        Amount to Deposit (USDC)
                    </label>
                    <input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="mt-2 w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg"
                        placeholder="Enter amount"
                    />

                    <span
                        onClick={() => {
                            balance && setAmount(BigUnit.from(BigInt(balance), decimals).toString());
                        }}
                        className="cursor-pointer bg-gray-700 py-2 text-gray-400 text-sm flex align-center justify-center absolute right-[10px] bottom-[6px]"
                    >
                        max
                    </span>
                </div>
                <div className="flex justify-between mb-4">
                    {allowed ? (
                        <button
                            onClick={handleDeposit}
                            className={`flex justify-center gap-4 w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg ${
                                +amount === 0 && "opacity-50"
                            }`}
                            disabled={+amount === 0 || isDepositPending || isPending}
                        >
                            {isDepositPending || isPending ? "Depositing..." : "Deposit"}
                            {(isDepositPending || isPending) && <img src={spinner} />}
                        </button>
                    ) : (
                        <button
                            onClick={handleApprove}
                            className={`flex justify-center gap-4 w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg ${
                                +amount === 0 && "opacity-50"
                            }`}
                            disabled={+amount === 0 || isApprovePending || isLoading}
                        >
                            {isLoading || isApprovePending ? "Approving..." : "Approve"}
                            {(isLoading || isApprovePending) && <img src={spinner} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Deposit;
