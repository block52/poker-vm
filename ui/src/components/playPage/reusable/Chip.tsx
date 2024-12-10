import React from "react";

type ChipProps = {
    amount: number;
};

const Chip: React.FC<ChipProps> = ({ amount }) => {
    if (amount > 0) {
        return (
            <div className="relative w-[50px] h-[20px] rounded-tl-3xl rounded-tr-xl rounded-bl-3xl rounded-br-xl bg-[#00000054] flex items-center justify-between">
                <img src={`/cards/chip.svg`} alt="Chip Button" className="absolute w-[20px] h-[auto] " />
                <span className="absolute right-[7px] text-[#dbd3d3]">{amount}</span>
            </div>
        );
    }
    return null;
};

export default Chip;
