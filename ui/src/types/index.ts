export type Player = {
    address: string;
    seat: number;
    legalActions: {
        action: string;
        min: string;
        max: string;
    }[];
    timeout: number;
}

export type TableData = {
    smallBlindPosition: number;
    bigBlindPosition: number;
    nextToAct: number;
    dealer: number;
    players: Player[];
    round: string;
    pots: string[];
}
