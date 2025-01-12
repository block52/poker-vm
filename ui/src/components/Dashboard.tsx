import * as React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import { STORAGE_PUBLIC_KEY } from "../hooks/useUserWallet";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
    const [publicKey, setPublicKey] = React.useState<string>();

    React.useEffect(() => {
        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, []);

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
                        className="block text-center text-white bg-pink-600 hover:bg-pink-700 rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md"
                    >
                        Connect Wallet
                    </Link>

                    <div className="flex justify-between gap-6">
                        <Link
                            key="1"
                            to={`/table/${publicKey}`}
                            className="text-white bg-gray-600 hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md"
                        >
                            Cash
                        </Link>

                        <Link
                            to={`/tournament/${publicKey}`}
                            className="text-white bg-gray-600 hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md"
                        >
                            Tournament
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
