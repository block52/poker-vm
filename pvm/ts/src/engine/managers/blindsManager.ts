import { GameOptions } from "@bitcoinbrisbane/block52";

export type Blinds = {
    smallBlind: bigint;
    bigBlind: bigint;
};

export interface IBlindsManager {
    getBlinds(): Blinds;
}

export class CashGameBlindsManager implements IBlindsManager {
    private readonly gameOptions: GameOptions;

    constructor(gameOptions: GameOptions) {
        this.gameOptions = gameOptions;
    }

    getBlinds(): Blinds {
        return {
            smallBlind: this.gameOptions.smallBlind,
            bigBlind: this.gameOptions.bigBlind,
        };
    }
}

export class SitAndGoBlindsManager implements IBlindsManager {
    private readonly gameOptions: GameOptions;
    start: Date | undefined;
    private readonly levelLength: number; // in minutes

    constructor(levelLength: number, gameOptions: GameOptions) {
        this.levelLength = levelLength;
        this.gameOptions = gameOptions;
    }

    setStartTime(start: Date): void {
        this.start = start;
    }

    getBlinds(): Blinds {

        if (!this.start) {
            throw new Error("Start time not set. Please call setStartTime() before getting blinds.");
        }

        const timePast = Math.floor((Date.now() - this.start.getTime()) / 1000 / 60);

        const currentLevel = Math.floor(timePast / this.levelLength);
        const { smallBlind, bigBlind } = this.gameOptions;

        return {
            smallBlind: smallBlind * 2n ** BigInt(currentLevel),
            bigBlind: bigBlind * 2n ** BigInt(currentLevel),
        };
    }
}