import React from "react";
import { FaRegUserCircle } from "react-icons/fa";

type VacantPlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
};

const VacantPlayer: React.FC<VacantPlayerProps> = ({ left, top, index }) => {
    return (
        <div
            key={index}
            className="absolute flex flex-col justify-center text-gray-600 w-[175px] h-[170px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{
                left: left,
                top: top,
                transition: "top 1s ease, left 1s ease"
            }}
        >
            <div className="flex justify-center gap-4 mb-2">
                <FaRegUserCircle color="#f0f0f0" className="w-10 h-10" />
            </div>
            <div className="text-white">Vacant Seat</div>
        </div>
    );
};

export default VacantPlayer;
