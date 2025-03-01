import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Eip1193Provider, ethers, parseUnits } from 'ethers';
import axios from 'axios';
import { PROXY_URL } from '../config/constants';
import useUserWallet from "../hooks/useUserWallet";
import useUserWalletConnect from "../hooks/useUserWalletConnect";

const DEPOSIT_ADDRESS = '0xADB8401D85E203F101aC715D5Aa7745a0ABcd42C';
const TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';


console.log('PROXY_URL:', PROXY_URL); // Debug log
const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY || '6PJHUB57D1GDFJ4SHUI5ZRI2VU3944IQP2';
const RPC_URL = "https://mainnet.infura.io/v3/4a91824fbc7d402886bf0d302677153f";

interface DepositSession {
    _id: string;
    userAddress: string;
    depositAddress: string;
    status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
    expiresAt: string;
    amount: number | null; 
}

// Add ERC20 Transfer event interface
interface TransferEvent {
    from: string;
    to: string;
    value: bigint;
}

// Add USDC contract ABI (just the transfer method)
const USDC_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
];

const QRDeposit: React.FC = () => {
    const { balance: b52Balance } = useUserWallet();
    const { isConnected, open, address: web3Address } = useUserWalletConnect();
    const [showQR, setShowQR] = useState<boolean>(false);
    const [latestTransaction, setLatestTransaction] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
    const [copied, setCopied] = useState<boolean>(false);
    const [isQuerying, setIsQuerying] = useState<boolean>(false);
    const [loggedInAccount, setLoggedInAccount] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentSession, setCurrentSession] = useState<DepositSession | null>(null);
    const [depositAmount, setDepositAmount] = useState<string>("");
    const [web3Balance, setWeb3Balance] = useState<string>("0");
    const [isTransferring, setIsTransferring] = useState(false);
    const [displayBalance, setDisplayBalance] = useState<string>("0");

    // Update displayBalance when b52Balance changes
    useEffect(() => {
        if (b52Balance) {
            setDisplayBalance(b52Balance.toString());
        }
    }, [b52Balance]);

    // Add countdown timer effect
    useEffect(() => {
        if (!showQR || !currentSession || currentSession.status !== 'PENDING' || timeLeft <= 0) {
            return;
        }

        console.log('Starting countdown timer from:', timeLeft); // Debug log

        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                const newTime = prevTime - 1;
                console.log('Time remaining:', newTime); // Debug log
                
                if (newTime <= 0) {
                    // Session expired
                    setShowQR(false);
                    setCurrentSession(prev => prev ? {...prev, status: 'EXPIRED'} : null);
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        // Cleanup timer on unmount or when conditions change
        return () => {
            console.log('Clearing timer'); // Debug log
            clearInterval(timer);
        };
    }, [showQR, currentSession, timeLeft]);

    // Format time function
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Check for existing session on component mount
    useEffect(() => {
        const checkExistingSession = async () => {
            if (!loggedInAccount) return;
            
            try {
                const response = await axios.get(`${PROXY_URL}/deposit-sessions/user/${loggedInAccount}`);
                if (response.data) {
                    const session = response.data;
                    setCurrentSession(session);
                    setSessionId(session._id);
                    setShowQR(true);
                    
                    // Calculate remaining time
                    const expiresAt = new Date(session.expiresAt).getTime();
                    const now = new Date().getTime();
                    const remainingTime = Math.max(0, Math.floor((expiresAt - now) / 1000));
                    setTimeLeft(Math.min(remainingTime, 300));
                    
                    if (remainingTime > 0) {
                        startPolling();
                    }
                }
            } catch (error) {
                console.log('No active session found');
            }
        };

        checkExistingSession();
    }, [loggedInAccount]);

    // Get the stored public key on component mount
    useEffect(() => {
        const storedKey = localStorage.getItem('user_eth_public_key');
        if (storedKey) {
            setLoggedInAccount(storedKey);
            console.log('Loaded logged in account:', storedKey);
        }
    }, []);

    // Function to get USDC balance of connected wallet
    const fetchWeb3Balance = async () => {
        if (!web3Address) return;
        
        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const usdcContract = new ethers.Contract(TOKEN_ADDRESS, USDC_ABI, provider);
            const balance = await usdcContract.balanceOf(web3Address);
            setWeb3Balance(ethers.formatUnits(balance, 6)); // USDC has 6 decimals
        } catch (error) {
            console.error('Error fetching USDC balance:', error);
        }
    };

    // Fetch balance when wallet connects
    useEffect(() => {
        if (web3Address) {
            fetchWeb3Balance();
        }
    }, [web3Address]);

    const handleGenerateQR = async () => {
        console.log('Generate QR button clicked');
        
        if (!loggedInAccount) {
            setError('Please connect your wallet first');
            return;
        }

        try {
            const payload = {
                userAddress: loggedInAccount,
                depositAddress: DEPOSIT_ADDRESS
            };
            console.log('Creating new deposit session:', payload);

            const response = await axios.post(`${PROXY_URL}/deposit-sessions`, payload);
            console.log('Session created:', response.data);

            setCurrentSession(response.data);
            setSessionId(response.data._id);
            setShowQR(true);
            setTimeLeft(300); // 5 minutes
            startPolling();
            setError(null);
        } catch (error: any) {
            console.error('Failed to create deposit session:', error);
            setError(error.response?.data?.error || 'Failed to create deposit session');
        }
    };

    const completeSession = async (amount: number) => {
        if (!sessionId) return;

        try {
            const response = await axios.put(`${PROXY_URL}/deposit-sessions/${sessionId}/complete`, {
                amount
            });
            console.log('Session completed:', response.data);
            setCurrentSession(response.data);
            setShowQR(false);
            
            // Add the deposited amount to the display balance
            if (response.data.amount) {
                const newAmount = (Number(displayBalance) + Number(response.data.amount) / 1e6).toString();
                setDisplayBalance(newAmount);
            }
        } catch (error) {
            console.error('Failed to complete session:', error);
        }
    };

    const startPolling = () => {
        console.log('Starting transaction polling');
        
        const interval = setInterval(async () => {
            setIsQuerying(true);
            try {
                const response = await axios.get(
                    `https://api.etherscan.io/api?module=account&action=txlist&address=${DEPOSIT_ADDRESS}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`
                );
                
                if (response.data.status === '1' && response.data.result.length > 0) {
                    const latestTx = response.data.result[0];
                    setLatestTransaction(latestTx);
                    
                    // If we find a new transaction, complete the session
                    if (currentSession?.status === 'PENDING') {
                        await completeSession(parseFloat(ethers.formatEther(latestTx.value)));
                    }
                }
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setIsQuerying(false);
            }
        }, 5000);

        return () => clearInterval(interval);
    };

    // Function to copy text to clipboard
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Add function to check for token transfers
    const checkForTransfer = async () => {
        if (!currentSession || currentSession.status !== 'PENDING') return;
        
        try {
            setIsQuerying(true);
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            
            // Get token contract
            const tokenContract = new ethers.Contract(
                TOKEN_ADDRESS,
                ["event Transfer(address indexed from, address indexed to, uint256 value)"],
                provider
            );

            // Get latest block number
            const latestBlock = await provider.getBlockNumber();
            
            // Look for Transfer events in last few blocks
            const events = await tokenContract.queryFilter(
                tokenContract.filters.Transfer(null, DEPOSIT_ADDRESS),
                latestBlock - 10,
                latestBlock
            );

            if (events.length > 0) {
                const lastTransfer = events[events.length - 1] as ethers.EventLog;
                if (!lastTransfer.args) return;
                const [from, to, value] = lastTransfer.args;
                
                console.log('=== Transfer Detected ===');
                console.log('From:', from);
                console.log('To:', to);
                console.log('Value:', value.toString());
                console.log('Session ID:', currentSession._id);
                
                const response = await axios.put(
                    `${PROXY_URL}/deposit-sessions/${currentSession._id}/complete`,
                    { amount: value.toString() }
                );

                if (response.data) {
                    setCurrentSession(response.data);
                    setShowQR(false);
                }
            }
        } catch (error) {
            console.error('Error checking for transfers:', error);
        } finally {
            setIsQuerying(false);
        }
    };

    // Add polling effect
    useEffect(() => {
        if (!showQR || !currentSession || currentSession.status !== 'PENDING') return;

        const interval = setInterval(checkForTransfer, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [showQR, currentSession]);

    // Add a format function
    const formatBalance = (rawBalance: string | number) => {
        // Convert the raw balance (with 18 decimals) to a human-readable number
        const value = Number(rawBalance) / 1e18;
        return value.toFixed(2);
    };

    // Function to handle direct USDC transfer
    const handleDirectTransfer = async () => {
        if (!web3Address || !currentSession) return;
        
        setIsTransferring(true);
        try {
            // Get signer from connected wallet
            const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider); 
            const signer = await provider.getSigner();
            
            // Create USDC contract instance
            const usdcContract = new ethers.Contract(TOKEN_ADDRESS, USDC_ABI, signer);
            
            // Convert amount to USDC units (6 decimals)
            const amount = parseUnits(depositAmount, 6);
            
            // Send transfer transaction
            const tx = await usdcContract.transfer(DEPOSIT_ADDRESS, amount);
            await tx.wait();

            // Update session with amount
            await completeSession(parseFloat(depositAmount));
            
            // Refresh balances
            fetchWeb3Balance();
            
            // Show success message
            alert('Deposit successful!');
        } catch (error) {
            console.error('Transfer failed:', error);
            alert('Transfer failed. Please try again.');
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-6">
                <h1 className="text-2xl font-bold text-center mb-6">Deposit USDC in to Block52</h1>
                
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                    <p className="text-lg mb-2">Block 52 Balance:</p>
                    <p className="text-xl font-bold text-pink-500">
                        ${formatBalance(displayBalance || '0')} USDC
                    </p>
                </div>

                {/* Session Status */}
                {currentSession && (
                    <div className="bg-gray-700 rounded-lg p-4 mb-6">
                        <h2 className="text-lg font-semibold mb-2">Session Status</h2>
                        <p className="text-sm text-gray-300">Status: {currentSession.status}</p>
                        <p className="text-sm text-gray-300">Session ID: {currentSession._id}</p>
                        {currentSession.amount && (
                            <p className="text-sm text-gray-300">
                                Amount: ${(Number(currentSession.amount) / 1e6).toFixed(2)} USDC
                            </p>
                        )}
                    </div>
                )}

                {/* Timer Display */}
                {showQR && currentSession?.status === 'PENDING' && (
                    <div className="text-center mb-4">
                        <div className="text-xl font-bold">
                            Time Remaining: {formatTime(timeLeft)}
                        </div>
                        <div className="text-sm text-gray-400">
                            Session will expire in {Math.floor(timeLeft / 60)} minutes and {timeLeft % 60} seconds
                        </div>
                    </div>
                )}

                {/* Block52 Account Display */}
                {!showQR && (
                    <div className="bg-gray-700 rounded-lg p-4 mb-6">
                        <h2 className="text-lg font-semibold mb-2">Block52 Account</h2>
                        <p className="text-sm text-gray-300 break-all">
                            {loggedInAccount || 'Not logged in'}
                        </p>
                    </div>
                )}

                {/* Web3 Wallet Connection Section */}
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">Deposit with Web3 Wallet</h2>
                    
                    {!isConnected ? (
                        <button
                            onClick={open}
                            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Connect Wallet
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span>Connected: {web3Address?.slice(0, 6)}...{web3Address?.slice(-4)}</span>
                                <span>Balance: {web3Balance} USDC</span>
                            </div>
                            
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="Enter USDC amount"
                                    className="w-full p-2 bg-gray-600 rounded border border-gray-500"
                                    min="0"
                                    step="0.01"
                                />
                                
                                <button
                                    onClick={handleDirectTransfer}
                                    disabled={!depositAmount || isTransferring || !currentSession}
                                    className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 
                                             disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isTransferring ? 'Processing...' : 'Deposit USDC'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {!showQR ? (
                    <button
                        onClick={handleGenerateQR}
                        disabled={!loggedInAccount}
                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        Generate Deposit QR Code
                    </button>
                ) : (
                    <>
                        <div className="bg-gray-700 rounded-lg p-4 mb-6">
                            <h2 className="text-lg font-semibold mb-2">Pay with USDC ERC20</h2>
                            <p className="text-sm text-gray-300 mb-4">
                                Only send USDC using the Ethereum network
                            </p>
                        </div>

                        {/* QR Code */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-white p-4 rounded-lg">
                                <QRCodeSVG 
                                    value={`ethereum:${DEPOSIT_ADDRESS}`}
                                    size={200}
                                    level="H"
                                />
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400">Payment address</label>
                                <div 
                                    className="flex items-center justify-between bg-gray-700 p-2 rounded cursor-pointer"
                                    onClick={() => copyToClipboard(DEPOSIT_ADDRESS)}
                                >
                                    <span className="text-sm">{`${DEPOSIT_ADDRESS}`}</span>
                                    
                                </div>
                            </div>

                            {/* Latest Transaction */}
                            {latestTransaction && (
                                <div className="mt-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold">Latest Transaction</h3>
                                        <span className={`text-xs ${isQuerying ? 'text-green-400' : 'text-gray-400'}`}>
                                            {isQuerying ? '🔄 Checking for new transactions...' : 'Last checked just now'}
                                        </span>
                                    </div>
                                    <div className="bg-gray-700 p-3 rounded text-sm">
                                        <p>Hash: {latestTransaction.hash.slice(0, 10)}...{latestTransaction.hash.slice(-8)}</p>
                                        <p>Amount: {ethers.formatEther(latestTransaction.value)} ETH</p>
                                        <p>From: {latestTransaction.from.slice(0, 6)}...{latestTransaction.from.slice(-4)}</p>
                                        <p>Age: {new Date(latestTransaction.timeStamp * 1000).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Error message display */}
            {error && (
                <div className="mt-4 p-3 bg-red-500 text-white rounded">
                    Error: {error}
                </div>
            )}
        </div>
    );
};

export default QRDeposit; 