import React, { useState } from "react";

type PlayerCardProps = {
    id: number;
    label: string;
    left?: string;
    top?: string;
    color?: string;
    onClose: () => void;
    setStartIndex: (index: number) => void;
};

const PlayerCard: React.FC<PlayerCardProps> = ({ id, label, left, top, color, onClose, setStartIndex }) => {
    const [note, setNote] = useState("");

    const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNote(e.target.value);
    };

    return (
        <div className="absolute w-64 h-56 ml-[-72px] mt-[45px] rounded-2xl shadow-lg bg-[#c0d6d9] flex flex-col items-center px-1 py-1 z-[15]"
            style={{
                left: left,
                top: top
            }}>
            {/* Header Section */}
            <div className="flex justify-between items-center w-full mb-2">
                <div style={{ backgroundColor: color }} className={`flex items-center justify-center w-7 h-7 text-white text-sm font-bold rounded-full`}>
                    {id}
                </div>
                <button
                    onClick={onClose}
                    className="text-xl text-gray-700 hover:text-red-500 transition mr-2"
                >
                    ✕
                </button>
            </div>
            <div className="px-2 w-64">
                {/* Label */}
                <div className="font-bold text-lg text-black bg-white py-1 w-full mb-4 rounded-2xl cursor-pointer" onClick={() => { setStartIndex(id - 1); onClose() }}>{label}</div>

                {/* Note Input */}
                <input
                    type="text"
                    placeholder="Enter note"
                    value={note}
                    onChange={handleNoteChange}
                    className="w-full h-[70px] mb-4 text-gray-700 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 p-4"
                />

                {/* Icons Section */}
                <div className="flex justify-around w-full">
                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xl cursor-pointer hover:opacity-75 transition">
                        🔥
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-400 text-white flex items-center justify-center text-xl cursor-pointer hover:opacity-75 transition">
                        🍂
                    </div>
                    <div className="w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center text-xl cursor-pointer hover:opacity-75 transition">
                        🌟
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xl cursor-pointer hover:opacity-75 transition">
                        🐟
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl cursor-pointer hover:opacity-75 transition">
                        ⛰️
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xl cursor-pointer hover:opacity-75 transition">
                        🛡️
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerCard;
