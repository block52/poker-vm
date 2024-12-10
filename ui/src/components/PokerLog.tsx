import React from "react";

type HandResult = {
    id: string;
    player: string;
    description: string;
    winnings: string;
    cards: string[]; // Array of card names like "9D", "5S" (e.g., "9 of Diamonds", "5 of Spades")
};

const PokerLog: React.FC = () => {
    const logs: HandResult[] = [
        {
            id: "4720731082",
            player: "Player 2",
            description: "wins main pot (1,600) with (Two pair, nines and fives).",
            winnings: "1,600",
            cards: ["9D", "5D", "1D", "JS", "9S"]
        },
        {
            id: "4720731369",
            player: "Player 6",
            description: "wins main pot (1,210) with (Two pair, kings and threes).",
            winnings: "1,210",
            cards: ["KS", "KC", "1C", "3S", "QH"]
        }
    ];

    // Helper function to get SVG paths for cards
    const getCardSvg = (card: string) => {
        const suits: Record<string, string> = {
            S: "C",
            H: "B",
            D: "D",
            C: "A"
        };
        const rank = card.slice(0, -1); // e.g., "9" or "A"
        const suit = card.slice(-1); // e.g., "D" or "S"

        return `/cards/${rank}${suits[suit]}.svg`; // Update to match your SVG file structure
    };

    return (
        <div className="text-white rounded-lg w-full h-full p-4 overflow-y-auto scrollbar-hide">
            <div className="mb-4">
                <p>You're connected to our server.</p>
                <p>Enjoy your game.</p>
                <p className="mt-2">You have successfully added 120 in chips.</p>
            </div>
            {logs.map(log => (
                <div key={log.id} className="mb-6 border-b border-gray-700 pb-4">
                    <p className="text-sm text-gray-400 mb-2">&lt;&lt; Result for hand {log.id} &gt;&gt;</p>
                    <p>
                        <span className="font-bold">{log.player}</span> {log.description}
                    </p>
                    <div className="flex mt-2 space-x-2">
                        {log.cards.map((card, index) => (
                            <div key={index} className="w-12 h-16">
                                <img src={getCardSvg(card)} alt={card} className="w-full h-full object-contain" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <p>Player 1, you have 15 seconds left.</p>
        </div>
    );
};

export default PokerLog;
