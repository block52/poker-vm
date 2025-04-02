import { useEffect, useState } from "react";
import { useTableContext } from "../../../context/TableContext";
import { PlayerStatus } from "@bitcoinbrisbane/block52";

type ProgressBarProps = {
    index: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ index }) => {
    const [progress, setProgress] = useState(0);
    const { tableData } = useTableContext();

    // Get players from tableData instead of PlayerContext
    const players = tableData?.data?.players || [];
    const currentPlayer = players[index] || { status: PlayerStatus.NOT_ACTED };

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (currentPlayer.status === PlayerStatus.ACTIVE) {
            setProgress(0); // Reset progress when "thinking" starts

            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 30) {
                        clearInterval(interval!); // Stop progress
                        return prev;
                    }
                    return prev + 1; // Increment progress
                });
            }, 1000); // Update every second
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [currentPlayer.status]);

    if (currentPlayer.status === PlayerStatus.ACTIVE) {
        return (
            <div className={"animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2"}>
                <span className="ml-2 text-white text-sm w-[15px]">{30 - progress}</span>
                <div className="relative flex-1 mr-[10px] h-full w-[calc(100%-25px)] bg-[#f0f0f030] rounded-md overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-white"
                        style={{
                            width: `${(30 - progress) * 3.333}%`, // 30 seconds to fill 100%
                            transition: "width 1s linear"
                        }}
                    ></div>
                </div>
            </div>
        );
    } else {
        return null;
    }
};

export default ProgressBar;
