import { SitAndGoStatusManager } from "./statusManager";
import { GameOptions, GameStatus, PlayerStatus } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";

describe("SitAndGoStatusManager", () => {
    let gameOptions: GameOptions;
    let players: Player[];

    beforeEach(() => {
        gameOptions = {
            minPlayers: 6,
            maxPlayers: 9
        } as GameOptions;

        players = [];
    });

    describe("getState", () => {
        it("should return WAITING_FOR_PLAYERS when fewer than min players", () => {
            players = Array.from({ length: 3 }, (_, i) => ({
                id: i.toString(),
                status: PlayerStatus.ACTIVE
            } as Player));

            const statusManager = new SitAndGoStatusManager(players, gameOptions);
            expect(statusManager.getState()).toBe(GameStatus.WAITING_FOR_PLAYERS);
        });

        it("should return WAITING_FOR_PLAYERS when exactly one less than min players", () => {
            players = Array.from({ length: 5 }, (_, i) => ({
                id: i.toString(),
                status: PlayerStatus.ACTIVE
            } as Player));

            const statusManager = new SitAndGoStatusManager(players, gameOptions);
            expect(statusManager.getState()).toBe(GameStatus.WAITING_FOR_PLAYERS);
        });

        it("should return IN_PROGRESS when exactly min players", () => {
            players = Array.from({ length: 6 }, (_, i) => ({
                id: i.toString(),
                status: PlayerStatus.ACTIVE
            } as Player));

            const statusManager = new SitAndGoStatusManager(players, gameOptions);
            expect(statusManager.getState()).toBe(GameStatus.IN_PROGRESS);
        });

        it("should return IN_PROGRESS when between min and max players", () => {
            players = Array.from({ length: 7 }, (_, i) => ({
                id: i.toString(),
                status: PlayerStatus.ACTIVE
            } as Player));

            const statusManager = new SitAndGoStatusManager(players, gameOptions);
            expect(statusManager.getState()).toBe(GameStatus.IN_PROGRESS);
        });

        it("should return IN_PROGRESS when exactly max players", () => {
            players = Array.from({ length: 9 }, (_, i) => ({
                id: i.toString(),
                status: PlayerStatus.ACTIVE
            } as Player));

            const statusManager = new SitAndGoStatusManager(players, gameOptions);
            expect(statusManager.getState()).toBe(GameStatus.IN_PROGRESS);
        });

        it("should return FINISHED when more than max players", () => {
            players = Array.from({ length: 10 }, (_, i) => ({
                id: i.toString(),
                status: PlayerStatus.ACTIVE
            } as Player));

            const statusManager = new SitAndGoStatusManager(players, gameOptions);
            expect(statusManager.getState()).toBe(GameStatus.FINISHED);
        });
    });
});
