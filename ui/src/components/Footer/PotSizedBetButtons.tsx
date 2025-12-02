import React from "react";
import { TexasHoldemRound, ActionDTO } from "@bitcoinbrisbane/block52";
import { calculatePotBetAmount } from "../../utils/calculatePotBetAmount";
import { microBigIntToUsdc } from "../../constants/currency";

interface PotSizedBetButtonsProps {
    totalPot: number;
    totalPotMicro: bigint;
    callAmountMicro: bigint;
    minAmount: number;
    maxAmount: number;
    currentRound: TexasHoldemRound;
    previousActions: ActionDTO[];
    disabled: boolean;
    onAmountSelect: (amount: number) => void;
}

export const PotSizedBetButtons: React.FC<PotSizedBetButtonsProps> = ({
    totalPot,
    totalPotMicro,
    callAmountMicro,
    minAmount,
    maxAmount,
    currentRound,
    previousActions,
    disabled,
    onAmountSelect
}) => {
    const potBetOptions = [
        { label: "1/4 Pot", multiplier: 0.25 },
        { label: "1/2 Pot", multiplier: 0.5 },
        { label: "3/4 Pot", multiplier: 0.75 }
    ];

    const calculateFractionBet = (multiplier: number) => {
        return Math.max(totalPot * multiplier, minAmount);
    };

    const calculateFullPotBet = () => {
        const potBetMicro: bigint = calculatePotBetAmount({
            currentRound,
            previousActions,
            callAmount: callAmountMicro,
            pot: totalPotMicro
        });
        return microBigIntToUsdc(potBetMicro);
    };

    return (
        <div className="flex justify-between gap-1 lg:gap-2 mb-1">
            {potBetOptions.map(({ label, multiplier }) => (
                <button
                    key={label}
                    className="btn-pot px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs transition-all duration-200 transform hover:scale-105"
                    onClick={() => onAmountSelect(calculateFractionBet(multiplier))}
                    disabled={disabled}
                >
                    {label}
                </button>
            ))}

            <button
                className="btn-pot px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs transition-all duration-200 transform hover:scale-105"
                onClick={() => onAmountSelect(calculateFullPotBet())}
                disabled={disabled}
            >
                Pot
            </button>

            <button
                className="btn-all-in px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs transition-all duration-200 font-medium transform active:scale-105"
                onClick={() => onAmountSelect(maxAmount)}
                disabled={disabled}
            >
                ALL-IN
            </button>
        </div>
    );
};
