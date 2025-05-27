import { formatChipAmount } from "../../../utils/numberUtils";

type ChipProps = {
    amount: string | number;
};

const Chip: React.FC<ChipProps> = ({ amount }) => {
    // Convert amount to string and check if it's greater than 0
    const amountStr = amount.toString();
    const numericAmount = Number(amountStr);
    
    if (numericAmount > 0) {
        // Format the chip amount properly from Wei-stored USDC to readable dollar amounts
        // This handles the conversion from Wei format to proper USDC display
        const formattedAmount = formatChipAmount(amountStr);
        
        return (
            <div className="relative h-[20px] pl-[10px] pr-[10px] rounded-full bg-[#00000054] flex items-center">
                <img src={"/cards/chip.svg"} alt="Chip Icon" className="absolute left-[-16px] w-[18px] h-auto" />
                <span className="text-[#dbd3d3] text-sm font-medium whitespace-nowrap">
                    ${formattedAmount}
                </span>
            </div>
        );
    }
    return null;
};

export default Chip;
