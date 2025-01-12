import React, { useEffect, useState } from "react"; // Import React and useEffect
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation
import { STORAGE_PUBLIC_KEY } from "../hooks/useUserWallet";
import "./Dashboard.css";

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
    const seats = [6, 9];

    const navigate = useNavigate();
    const [publicKey, setPublicKey] = useState<string>();
    const [typeSelected, setTypeSelected] = useState<string>("cash");
    const [variantSelected, setVariantSelected] = useState<string>("texas-holdem");
    const [seatSelected, setSeatSelected] = useState<number>(6);

    useEffect(() => {
        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, []);

    const handleGameType = (type: GameType) => {
        if (type === GameType.CASH) {
            setTypeSelected("cash");
        }

        if (type === GameType.TOURNAMENT) {
            setTypeSelected("tournament");
        }
    };

    const handleGameVariant = (variant: Variant) => {
        if (variant === Variant.TEXAS_HOLDEM) {
            setVariantSelected("texas-holdem");
        }

        if (variant === Variant.OMAHA) {
            setVariantSelected("omaha");
        }
    };

    const handleSeat = (seat: number) => {
        setSeatSelected(seat);
    };

    const buildUrl = () => {
        return `/table/${typeSelected}?variant=${variantSelected}&seats=${seatSelected}`;
    }

    const handleNext = () => {
        const url = buildUrl();
        console.log("Next button clicked");

        // Redirect to the sit page
        navigate(url);
    };

    // const [loading, setLoading] = useState(true);
    // const [gameType, setGameType] = useState<string | null>(null);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-gray-800 via-gray-900 to-black">
            {/* Main Dashboard Container */}
            <div className="bg-gray-800 p-10 rounded-xl shadow-2xl w-full max-w-xl">
                <h1 className="text-4xl font-extrabold text-center text-white mb-8">Start Playing Now</h1>

                {/* Navigation Links */}
                <div className="space-y-6">
                    {/* Link to Deposit page */}
                    <Link
                        to="/deposit"
                        className="block text-center text-white bg-blue-500 hover:bg-blue-600 rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md"
                    >
                        Connect Wallet
                    </Link>

                    <div className="flex justify-between gap-6">
                        {/* Set type to Cash*/}
                        <button
                            onClick={() => handleGameType(GameType.CASH)}
                            // If type is selected, set background to gray-700
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                typeSelected === "cash" ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            Cash
                        </button>

                        {/* Set type to Tournament*/}
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
                        {/* Set type to Texas Holdem*/}
                        <button
                            onClick={() => handleGameVariant(Variant.TEXAS_HOLDEM)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                variantSelected === "texas-holdem" ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            Texas Holdem
                        </button>

                        {/* Set type to OMAHA */}
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
                        {/* Set seats */}
                        <button
                            onClick={() => handleSeat(6)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                seatSelected === 6 ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            6 Seats
                        </button>

                        {/* Set seats */}
                        <button
                            onClick={() => handleSeat(9)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                seatSelected === 9 ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            9 Seats
                        </button>
                    </div>

                    <Link
                        to={buildUrl()}
                        className="block text-center text-white bg-pink-600 hover:bg-pink-700 rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md"
                    >
                        Next
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
