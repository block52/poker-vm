import { GameOptions } from "@block52/poker-vm-sdk";

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

    constructor(gameOptions: GameOptions, start?: Date) {
        // Use blindLevelDuration from gameOptions, default to 10 minutes
        this.levelLength = gameOptions.blindLevelDuration ?? 10;
        this.gameOptions = gameOptions;
        this.start = start;
    }

    setStartTime(start: Date): void {
        this.start = start;
    }

    getBlinds(): Blinds {
        // Return initial blinds if start time is not set
        if (!this.start) {
            return { smallBlind: this.gameOptions.smallBlind, bigBlind: this.gameOptions.bigBlind };
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