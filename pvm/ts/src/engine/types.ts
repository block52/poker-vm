// !! TODO: Cleanup

import { Player } from "../models/game";

export enum States {
    INIT = "INIT",
    WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
    DEALING = "DEALING",
    BETTING = "BETTING",
    SHOWDOWN = "SHOWDOWN",
    END = "END",
}

export enum Actions {
    JOIN = "JOIN",
    START = "START",
    BET = "BET",
    CHECK = "CHECK",
    FOLD = "FOLD",
    CALL = "CALL",
    RAISE = "RAISE",
    SHOWDOWN = "SHOWDOWN",
    END = "END",
}

export enum Round {
    PREFLOP = "PREFLOP",
    FLOP = "FLOP",
    TURN = "TURN",
    RIVER = "RIVER",
}

export interface IPoker {
    deal(): void;
    join(player: Player): void;
}