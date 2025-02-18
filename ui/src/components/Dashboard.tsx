import React, { useEffect, useState } from "react"; // Import React and useEffect
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation
import { STORAGE_PUBLIC_KEY } from "../hooks/useUserWallet";
import "./Dashboard.css";
import useUserWalletConnect from "../hooks/useUserWalletConnect"; // Add this import
import useUserWallet from "../hooks/useUserWallet"; // Add this import
import axios from "axios";
import { PROXY_URL } from "../config/constants";
// Create an enum of game types
enum GameType {
    CASH = "cash",
    TOURNAMENT = "tournament"
}

enum Variant {
    TEXAS_HOLDEM = "texas-holdem",
    OMAHA = "omaha"
}

const Dashboard: React.FC = () => {
    const seats = [6, 8];

    const navigate = useNavigate();
    const [publicKey, setPublicKey] = useState<string>();
    const [typeSelected, setTypeSelected] = useState<string>("cash");
    const [variantSelected, setVariantSelected] = useState<string>("texas-holdem");
    const [seatSelected, setSeatSelected] = useState<number>(6);
    const { isConnected, open, address } = useUserWalletConnect();
    const { balance: b52Balance } = useUserWallet();
    const [games, setGames] = useState([]);

    // Add logging to fetch games
    const fetchGames = async () => {
        console.log("\n=== Fetching Games from Proxy ===");
        try {
            const response = await axios.get(`${PROXY_URL}/games`);
            console.log("Games Response:", response.data);
            
            // Map the response to our game types
            const games = response.data.map((game: any) => ({
                id: game.id,
                variant: game.variant,
                type: game.type,
                limit: game.limit,
                maxPlayers: game.max_players,
                minBuy: game.min,
                maxBuy: game.max
            }));
            
            console.log("Processed Games:", games);
            setGames(games);
        } catch (error) {
            console.error("Error fetching games:", error);
        }
    };

    useEffect(() => {
        console.log("Dashboard mounted, fetching games...");
        fetchGames();
    }, []);

    useEffect(() => {
        console.log("\n=== Dashboard Mounted ===");
        console.log("Connected Wallet:", address);
        console.log("Balance:", b52Balance);
        console.log("======================\n");

        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        console.log("Local Storage Key:", localKey);
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, []);

    const handleGameType = (type: GameType) => {
        console.log("\n=== Game Type Selected ===");
        console.log("Type:", type);
        
        if (type === GameType.CASH) {
            console.log("Setting type to CASH");
            setTypeSelected("cash");
        }

        if (type === GameType.TOURNAMENT) {
            console.log("Setting type to TOURNAMENT");
            setTypeSelected("tournament");
        }
    };

    const handleGameVariant = (variant: Variant) => {
        console.log("\n=== Game Variant Selected ===");
        console.log("Variant:", variant);
        
        if (variant === Variant.TEXAS_HOLDEM) {
            console.log("Setting variant to TEXAS HOLDEM");
            setVariantSelected("texas-holdem");
        }

        if (variant === Variant.OMAHA) {
            console.log("Setting variant to OMAHA");
            setVariantSelected("omaha");
        }
    };

    const handleSeat = (seat: number) => {
        setSeatSelected(seat);
    };

    const buildUrl = () => {
        // return `/table/${typeSelected}?variant=${variantSelected}&seats=${seatSelected}`;
        return `/table/0x0000000000000000000000000000000000000000`;
    }

    const handleNext = () => {
        const url = buildUrl();
        console.log("Next button clicked");

        // Redirect to the sit page
        navigate(url);
    };

    // const [loading, setLoading] = useState(true);
    // const [gameType, setGameType] = useState<string | null>(null);

    // Add function to format address
    const formatAddress = (address: string | undefined) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Add the same format function
    const formatBalance = (rawBalance: string | number) => {
        const value = Number(rawBalance) / 1e18;
        return value.toFixed(2);
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-gray-800 via-gray-900 to-black">
            <div className="bg-gray-800 p-10 rounded-xl shadow-2xl w-full max-w-xl">
                <h1 className="text-4xl font-extrabold text-center text-white mb-8">Start Playing Now</h1>

                {/* Show browser account balance in USDC */}
                {publicKey && (
                    <div className="text-center mb-6 space-y-2">
                        <p className="text-white text-lg">
                            Block 52 Account: <span className="font-mono text-pink-500">{publicKey}</span>
                        </p>
                        <p className="text-white text-lg">
                            Balance: <span className="font-bold text-pink-500">
                                ${formatBalance(b52Balance || '0')} USDC
                            </span>
                        </p>
                        <Link
                            to="/qr-deposit"
                            className="block mt-4 text-center text-white bg-green-600 hover:bg-green-700 rounded-xl py-4 px-8 text-xl font-bold transition duration-300 transform hover:scale-105 shadow-lg"
                        >
                            Deposit
                        </Link>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Game options always visible */}
                    <div className="flex justify-between gap-6">
                        <button
                            onClick={() => handleGameType(GameType.CASH)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                typeSelected === "cash" ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            Cash
                        </button>
                        <button
                            onClick={() => handleGameType(GameType.TOURNAMENT)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                typeSelected === "tournament" ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            Tournament
                        </button>
                    </div>

                    <div className="flex justify-between gap-6">
                        <button
                            onClick={() => handleGameVariant(Variant.TEXAS_HOLDEM)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                variantSelected === "texas-holdem" ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            Texas Holdem
                        </button>
                        <button
                            onClick={() => handleGameVariant(Variant.OMAHA)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                variantSelected === "omaha" ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            Omaha
                        </button>
                    </div>

                    <div className="flex justify-between gap-6">
                        <button
                            onClick={() => handleSeat(6)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                seatSelected === 6 ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            6 Seats
                        </button>
                        <button
                            onClick={() => handleSeat(9)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                seatSelected === 8 ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            8 Seats
                        </button>
                    </div>

                    <Link
                        to={buildUrl()}
                        className="block text-center text-white bg-pink-600 hover:bg-pink-700 rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md"
                    >
                        Next
                    </Link>

                    {/* Web3 wallet status below Next button */}
                    <div className="text-right mt-4">
                        <p className="text-white text-sm">
                            Web3 Wallet: <span className={`font-bold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                                {isConnected ? 'Connected' : 'Not Connected'}
                            </span>
                            {!isConnected && (
                                <button 
                                    onClick={open}
                                    className="ml-4 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-300"
                                >
                                    Connect
                                </button>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
