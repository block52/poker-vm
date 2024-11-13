import { Seat, TexasHoldemState } from "@/types/game";
import { useState, useEffect } from "react";
import { useWallet } from "./useWallet";

export function useGame() {
    const [state, setState] = useState<TexasHoldemState>();
    const { b52 } = useWallet();

    useEffect(() => {
        const id = setInterval(async () => {
            const dto = await b52?.getGameState("0x1234");
            console.log(b52);
            console.log(dto);
            if (dto) {
                const flop = dto.communityCards.length ? dto.communityCards.slice(0, 3) : [0, 0, 0];
                const turn = dto.communityCards.at(3) ?? 0;
                const river = dto.communityCards.at(4) ?? 0;
                const players = dto.players.map(p => {
                    const seat = p.isBigBlind ? Seat.BB : p.isSmallBlind ? Seat.SB : Seat.NORMAL;
                    const lastMove = p.lastMove ? { action: p.lastMove.action, amount: p.lastMove.minAmount } : undefined;
                    const isTurn = !!p.validMoves?.length;
                    return { ...p, isTurn, seat, lastMove };
                });
                setState({ ...dto, flop, turn, river, players });
            }
        }, 3000);
        return () => { clearInterval(id); };
    }, []);

    return { state };
}