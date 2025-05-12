type ChipProps = {
    amount: number;
};

const Chip: React.FC<ChipProps> = ({ amount }) => {
    if (amount > 0) {
        return (
            <div className="relative h-[20px] pl-[10px] pr-[10px] rounded-full bg-[#00000054] flex items-center">
                <img src={"/cards/chip.svg"} alt="Chip Icon" className="absolute left-[-16px] w-[18px] h-auto" />
                <span className="text-[#dbd3d3] text-sm font-medium whitespace-nowrap">
                    $
                    {amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </span>
            </div>
        );
    }
    return null;
};

export default Chip;
