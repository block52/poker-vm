import React, { useState } from "react";

interface PokerTableProps {
  tableName?: string;
  subTitle?: string;
}

interface PlayerPosition {
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  transform: string;
  chips: number;
  isPlayer?: boolean;
}

const PokerTable: React.FC<PokerTableProps> = ({ 
  tableName = "BLOCK 52",
  subTitle = "QG - dogINo Limit Hold 'em\nHand #1"
}) => {
  const [betAmount, setBetAmount] = useState(100);
  
  // Reorganized seat positions with chip counts
  const seats: PlayerPosition[] = [
    // Top 3 seats
    { position: { top: "0", left: "25%" }, transform: "translate(-50%, -50%)", chips: 1000 },
    { position: { top: "0", left: "50%" }, transform: "translate(-50%, -50%)", chips: 1500 },
    { position: { top: "0", left: "75%" }, transform: "translate(-50%, -50%)", chips: 2000 },
    
    // Middle 2 seats
    { position: { top: "50%", left: "0" }, transform: "translate(-50%, -50%)", chips: 2500 },
    { position: { top: "50%", right: "0" }, transform: "translate(50%, -50%)", chips: 1750 },
    
    // Bottom 3 seats (including player position)
    { position: { bottom: "0", left: "25%" }, transform: "translate(-50%, 50%)", chips: 3000 },
    { position: { bottom: "0", left: "50%" }, transform: "translate(-50%, 50%)", chips: 1250, isPlayer: true },
    { position: { bottom: "0", left: "75%" }, transform: "translate(-50%, 50%)", chips: 1800 },
  ];

  const PlayerCards = ({ isPlayer }: { isPlayer?: boolean }) => (
    <div className="flex -space-x-2 mb-2">
      <div className={`w-8 h-12 rounded bg-white border-2 border-gray-300 ${!isPlayer && "bg-red-600"}`} />
      <div className={`w-8 h-12 rounded bg-white border-2 border-gray-300 ${!isPlayer && "bg-red-600"}`} />
    </div>
  );

  const ActionButtons = () => (
    <div className="flex flex-col items-center gap-4 mt-20">
      <div className="flex gap-4">
        <button className="bg-red-500 text-white px-6 py-2 rounded-full font-bold hover:bg-red-600">
          Fold
        </button>
        <button className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-600">
          Call
        </button>
        <button className="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600">
          Bet
        </button>
      </div>
      
      <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-lg">
        <input
          type="range"
          min="100"
          max="5000"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          className="w-48"
        />
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          className="w-24 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 w-full h-screen p-4">
      <div className="flex flex-col items-center">
        {/* Main table */}
        <div className="relative w-full max-w-4xl mt-16">
          <svg 
            viewBox="0 0 800 400" 
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Table border */}
            <ellipse
              cx="400"
              cy="200"
              rx="380"
              ry="180"
              fill="#1d4ed8"
              className="drop-shadow-lg"
            />
            
            {/* Table inner */}
            <ellipse
              cx="400"
              cy="200"
              rx="360"
              ry="160"
              fill="#2563eb"
            />

            {/* Center text */}
            <text
              x="400"
              y="190"
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              className="text-2xl font-bold"
            >
              {tableName}
            </text>
            <text
              x="400"
              y="220"
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              className="text-sm"
            >
              {subTitle}
            </text>
          </svg>

          {/* Seat positions */}
          {seats.map((seat, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                ...seat.position,
                transform: seat.transform
              }}
            >
              <div className="flex flex-col items-center">
                <PlayerCards isPlayer={seat.isPlayer} />
                <div className="bg-gray-800/90 text-white px-4 py-2 rounded-full whitespace-nowrap text-center">
                  <div>SEAT OPEN</div>
                  <div className="text-yellow-400">${seat.chips}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Dealer button */}
          <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
            D
          </div>
        </div>

        {/* Action buttons below table */}
        <ActionButtons />
      </div>
    </div>
  );
};

export default PokerTable;