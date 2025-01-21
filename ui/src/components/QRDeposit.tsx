import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ethers } from 'ethers';
import axios from 'axios';

const DEPOSIT_ADDRESS = '0xBf1e380f3D1AE31854764081C488EaDA9F4CB195';
const ETHERSCAN_API_KEY = 'YOUR_ETHERSCAN_API_KEY'; // You'll need to get this from Etherscan

const QRDeposit: React.FC = () => {
    const [latestTransaction, setLatestTransaction] = useState<any>(null);
    const [expiryTime] = useState<number>(3 * 60 * 60); // 3 hours in seconds
    const [timeLeft, setTimeLeft] = useState<number>(expiryTime);
    const [copied, setCopied] = useState<boolean>(false);

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

    // Function to format time remaining
    const formatTimeLeft = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    };

    // Check for new transactions
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await axios.get(
                    `https://api.etherscan.io/api?module=account&action=txlist&address=${DEPOSIT_ADDRESS}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`
                );
                
                if (response.data.status === '1' && response.data.result.length > 0) {
                    setLatestTransaction(response.data.result[0]);
                }
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        };

        // Fetch initially and then every 30 seconds
        fetchTransactions();
        const interval = setInterval(fetchTransactions, 30000);

        return () => clearInterval(interval);
    }, []);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-6">
                <h1 className="text-2xl font-bold text-center mb-6">Deposit USDC</h1>
                
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
                            <span className="text-sm">{`${DEPOSIT_ADDRESS.slice(0, 6)}...${DEPOSIT_ADDRESS.slice(-4)}`}</span>
                            <span className="text-xs text-gray-400">
                                {copied ? 'Copied!' : 'Click to copy'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400">Expires in</label>
                        <div className="bg-gray-700 p-2 rounded">
                            <span>{formatTimeLeft(timeLeft)}</span>
                        </div>
                    </div>

                    {/* Latest Transaction */}
                    {latestTransaction && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2">Latest Transaction</h3>
                            <div className="bg-gray-700 p-3 rounded text-sm">
                                <p>Hash: {latestTransaction.hash.slice(0, 10)}...{latestTransaction.hash.slice(-8)}</p>
                                <p>Amount: {ethers.formatEther(latestTransaction.value)} ETH</p>
                                <p>From: {latestTransaction.from.slice(0, 6)}...{latestTransaction.from.slice(-4)}</p>
                                <p>Age: {new Date(latestTransaction.timeStamp * 1000).toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRDeposit; 