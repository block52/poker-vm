import React from "react";
import { TexasHoldemRound, ActionDTO } from "@block52/poker-vm-sdk";
import { RaiseSlider } from "./RaiseSlider";
import { PotSizedBetButtons } from "./PotSizedBetButtons";

interface RaiseBetControlsProps {
    amount: number;
    minAmount: number;
    maxAmount: number;
    formattedMaxAmount: string;
    step: number;
    totalPot: number;
    totalPotMicro: bigint;
    callAmountMicro: bigint;
    isInvalid: boolean;
    isMobileLandscape: boolean;
    currentRound: TexasHoldemRound;
    previousActions: ActionDTO[];
    disabled: boolean;
    onAmountChange: (amount: number) => void;
    onIncrement: () => void;
    onDecrement: () => void;
}

export const RaiseBetControls: React.FC<RaiseBetControlsProps> = ({
    amount,
    minAmount,
    maxAmount,
    formattedMaxAmount,
    step,
    totalPot,
    totalPotMicro,
    callAmountMicro,
    isInvalid,
    isMobileLandscape,
    currentRound,
    previousActions,
    disabled,
    onAmountChange,
    onIncrement,
    onDecrement
}) => {
    return (
        <>
            {/* Slider Row */}
            <RaiseSlider
                value={amount}
                min={minAmount}
                max={maxAmount}
                step={step}
                formattedMax={formattedMaxAmount}
                isInvalid={isInvalid}
                disabled={disabled}
                isMobileLandscape={isMobileLandscape}
                onChange={onAmountChange}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
            />

            {/* Pot-Sized Bet Buttons - Hide in mobile landscape to save space */}
            {!isMobileLandscape && (
                <PotSizedBetButtons
                    totalPot={totalPot}
                    totalPotMicro={totalPotMicro}
                    callAmountMicro={callAmountMicro}
                    minAmount={minAmount}
                    maxAmount={maxAmount}
                    currentRound={currentRound}
                    previousActions={previousActions}
                    disabled={disabled}
                    onAmountSelect={onAmountChange}
                />
            )}
        </>
    );
};
