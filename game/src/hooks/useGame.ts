import { useState, useEffect, useCallback } from "react";
import { PlayerAction } from "@bitcoinbrisbane/block52";
import { Seat, TexasHoldemState } from "@/types/game";
import { useWallet } from "./useWallet";

export function useGame(gameAddress?: string) {
    const [state, setState] = useState<TexasHoldemState | undefined>();
    const { b52 } = useWallet();

    if (!gameAddress)
        return { state: undefined, performAction: undefined };

    const join = useCallback(function (address?: string) {
        if (address)
            b52?.playerJoin(gameAddress, address);
    }, [b52]);

    const performAction = useCallback(function (action: PlayerAction, amount?: number) {
        b52?.playerAction(gameAddress, action, amount?.toString() ?? "");
    }, [b52]);

    useEffect(() => {
        const id = setInterval(async () => {
            const dto = await b52?.getGameState(gameAddress);
            if (dto?.type === "game") {
                const flop = dto.communityCards.length ? dto.communityCards.slice(0, 3) : [0, 0, 0];
                const turn = dto.communityCards.at(3) ?? 0;
                const river = dto.communityCards.at(4) ?? 0;
                const players = dto.players.map(p => {
                    const seat = p.isBigBlind ? Seat.BB : p.isSmallBlind ? Seat.SB : Seat.NORMAL;
                    const lastMove = p.lastMove ? { action: p.lastMove.action, amount: p.lastMove.minAmount } : undefined;
                    const isTurn = !!p.validMoves.length;
                    return { ...p, isTurn, seat, lastMove };
                });
                setState({ ...dto, flop, turn, river, players });
            }
            else
                setState(undefined);
        }, 3000);
        return () => { clearInterval(id); };
    }, [b52]);

    return { state, join, performAction };
}