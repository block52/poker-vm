import React from "react";

type BadgeProps = {
    count: number; // The number displayed in the badge
    value: number; // The larger number displayed next to the badge
    color?: string;
    // Timer extension props
    canExtend?: boolean;
    onExtend?: () => void;
};

const Badge: React.FC<BadgeProps> = React.memo(({ count, value, color, canExtend, onExtend }) => {
    // Format the value to always show 2 decimal places
    const formattedValue = value.toFixed(2);

    return (
        <div className="flex items-center bg-[#c0d6d9] rounded-full px-0.5 py-0.5 shadow-[1px_2px_6px_3px_rgba(0,0,0,0.3)]">
            <div style={{ backgroundColor: color }} className={"flex items-center justify-center w-6 h-6 text-white text-sm font-bold rounded-full"}>
                {count}
            </div>
            <div className="ml-2 text-xl sm:text-lg font-semibold text-black flex justify-between ml-auto mr-auto">${formattedValue}</div>
            
            {/* Timer Extension Icon - Timer icon inside badge */}
            {canExtend && onExtend && (
                <div 
                    className="ml-2 mr-1 w-5 h-5 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 transform hover:scale-110"
                    onClick={onExtend}
                >
                    <svg 
                        className="w-3 h-3 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        {/* Clock circle */}
                        <circle cx="12" cy="12" r="8" strokeWidth="2"/>
                        {/* Clock hands */}
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
                        {/* Plus symbol in corner */}
                        <circle cx="18" cy="6" r="3" fill="currentColor"/>
                        <path stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 6h2M18 5v2"/>
                    </svg>
                </div>
            )}
        </div>
    );
});

export default Badge;
