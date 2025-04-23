import React from "react";
import { useParams } from "react-router-dom";
import { usePlayerTimer } from "../../../hooks/usePlayerTimer";

type ProgressBarProps = {
    index: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ index }) => {
    const { id } = useParams<{ id: string }>();
    const { isActive, timeRemaining, timeoutValue } = usePlayerTimer(id, index);

    // If player is not active, don't show progress bar
    if (!isActive) {
        return null;
    }

    // Calculate progress percentage
    const progressPercentage = (timeRemaining / timeoutValue) * 100;

    return (
        <div className="animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2">
            <span className="ml-2 text-white text-sm w-[15px]">{timeRemaining}</span>
            <div className="relative flex-1 mr-[10px] h-full w-[calc(100%-25px)] bg-[#f0f0f030] rounded-md overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full bg-white"
                    style={{
                        width: `${progressPercentage}%`,
                        transition: "width 1s linear"
                    }}
                ></div>
            </div>
        </div>
    );
};

export default ProgressBar;
