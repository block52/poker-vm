export type Player = {
    seat: number;
    legalActions: {
        action: string;
        min: string;
        max: string;
    }[];
}

export type TableData = {
    smallBlindPosition: number;
    bigBlindPosition: number;
    nextToAct: number;
    players: Player[];
}
