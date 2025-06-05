import React from "react";
import { formatWeiToSimpleDollars } from "../../../utils/numberUtils";

type ChipProps = {
    amount: string | bigint;
};

const Chip: React.FC<ChipProps> = React.memo(({ amount }) => {
    // Convert amount to string and check if it's greater than 0
    const amountStr = amount.toString();
    const numericAmount = Number(amountStr);
    
    if (numericAmount > 0) {
        // Format the chip amount properly from Wei-stored amounts to readable dollar amounts
        // Since sumOfBets is already in Wei format representing dollar amounts, we use the simple conversion
        const formattedAmount = formatWeiToSimpleDollars(amountStr);
        
        return (
            <div className="relative h-[24px] sm:h-[20px] pl-[12px] sm:pl-[10px] pr-[12px] sm:pr-[10px] rounded-full bg-[#00000054] flex items-center">
                <img src={"/cards/chip.svg"} alt="Chip Icon" className="absolute left-[-18px] sm:left-[-16px] w-[22px] sm:w-[18px] h-auto" />
                <span className="text-[#dbd3d3] text-lg sm:text-sm font-medium whitespace-nowrap">
                    ${formattedAmount}
                </span>
            </div>
        );
    }
    return null;
});

export default Chip;
