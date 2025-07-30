import React, { useCallback, useState } from "react";

const SitInAndOutOptions: React.FC<{ tableId: string }> = ({ tableId }) => {
    const [sitOutNextHand, setSitOutNextHand] = useState(false);
    const [sitOutNextBigBlind, setSitOutNextBigBlind] = useState(false);

    // Suppress React warning about unused variables
    console.log("SitInAndOutOptions mounted for table:", tableId);

    // Mock function to handle sit out next hand
    const handleSitOutNextHand = useCallback(async (enabled: boolean) => {
        try {
            // Update local storage for persistence
            setSitOutNextHand(enabled);
            localStorage.setItem("sit_out_next_hand", JSON.stringify(enabled));
        } catch (error) {
            console.error("Error updating sit out next hand:", error);
            // Revert the checkbox state on error
            setSitOutNextHand(!enabled);
        }
    }, []);

    // Mock function to handle sit out next big blind
    const handleSitOutNextBigBlind = useCallback(async (enabled: boolean) => {
        try {
            // console.log(`Setting sit out next big blind: ${enabled}`);

            // // Mock API call
            // const response = await fetch("/api/player/sit-out-next-big-blind", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json"
            //     },
            //     body: JSON.stringify({
            //         playerId: localStorage.getItem("user_eth_public_key"),
            //         sitOutNextBigBlind: enabled
            //     })
            // });

            // if (!response.ok) {
            //     throw new Error("Failed to update big blind preference");
            // }

            // Update local storage for persistence
            setSitOutNextBigBlind(enabled);
            localStorage.setItem("sit_out_next_big_blind", JSON.stringify(enabled));
        } catch (error) {
            console.error("Error updating sit out next big blind:", error);
            // Revert the checkbox state on error
            setSitOutNextBigBlind(!enabled);
        }
    }, []);

    // Event handlers for checkboxes
    const onSitOutNextHandChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const isChecked = e.target.checked;
            handleSitOutNextHand(isChecked);
        },
        [handleSitOutNextHand]
    );

    const onSitOutNextBigBlindChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const isChecked = e.target.checked;
            handleSitOutNextBigBlind(isChecked);
        },
        [handleSitOutNextBigBlind]
    );

    return (
        <div className="ml-[50px] text-white p-4 rounded bg-gray-800 border border-gray-600 shadow-lg w-[300px]">
            {/* Sit Out Options */}
            <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-200">Sit Out Options</h3>

                <label className="flex items-center mb-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-500 border-gray-600 rounded focus:ring-0"
                        checked={sitOutNextHand}
                        onChange={onSitOutNextHandChange}
                    />
                    <span className="ml-2 text-sm">Sit out next hand</span>
                </label>

                <label className="flex items-center mb-3 cursor-pointer hover:bg-gray-700 p-1 rounded">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-500 border-gray-600 rounded focus:ring-0"
                        checked={sitOutNextBigBlind}
                        onChange={onSitOutNextBigBlindChange}
                    />
                    <span className="ml-2 text-sm">Sit out next big blind</span>
                </label>
            </div>

            {/* Action Buttons */}
            {/* <div className="flex flex-col gap-2">
                <button
                    onClick={handleSitOutNow}
                    className="w-full py-2 px-3 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors duration-200"
                >
                    Sit Out Now
                </button>

                <button
                    onClick={handleSitBackIn}
                    className="w-full py-2 px-3 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors duration-200"
                >
                    Sit Back In
                </button>
            </div> */}

            {/* Status Information */}
            <div className=""> {/* "mt-3 pt-3 border-t border-gray-600" */}
                <div className="text-xs text-gray-400">
                    {sitOutNextHand && (
                        <div className="flex items-center mb-1">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                            Will sit out next hand
                        </div>
                    )}
                    {sitOutNextBigBlind && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                            Will sit out next big blind
                        </div>
                    )}
                    {!sitOutNextHand && !sitOutNextBigBlind && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Playing all hands
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SitInAndOutOptions;
