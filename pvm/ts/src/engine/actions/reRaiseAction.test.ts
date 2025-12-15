import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import RaiseAction from "./raiseAction";
import { IUpdate } from "../types";
import { getDefaultGame, ONE_THOUSAND_TOKENS, ONE_TOKEN, TWO_TOKENS, FIVE_TOKENS } from "../testConstants";

describe("Re Raise Action", () => {
    let game: TexasHoldemGame;
    let updateMock: IUpdate;
    let action: RaiseAction;
    let player: Player;

    beforeEach(() => {
        const PLAYER_1 = "0x11111111111111111111111111111111111111111"; // Mock player address
        const PLAYER_2 = "0x22222222222222222222222222222222222222222"; // Mock player address
        const PLAYER_3 = "0x33333333333333333333333333333333333333333"; // Mock player address
        const PLAYER_4 = "0x44444444444444444444444444444444444444444"; // Mock player address

        // Setup initial game state
        const playerStates = new Map<number, Player | null>();

        const p1 = new Player(
            PLAYER_1,
            undefined, // lastAction
            ONE_THOUSAND_TOKENS, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(0, p1);

        game = getDefaultGame(playerStates);

        updateMock = {
            addAction: jest.fn()
        };

        action = new RaiseAction(game, updateMock);

        player = new Player(
            "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
            undefined, // lastAction
            ONE_THOUSAND_TOKENS, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );

        // Mock game methods
        jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
        jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);

        // Mock getActionsForRound to return different actions based on round
        jest.spyOn(game, "getActionsForRound").mockImplementation((round) => {
            if (round === TexasHoldemRound.ANTE) {
                return [
                    {
                        playerId: PLAYER_1,
                        amount: ONE_TOKEN,
                        action: PlayerActionType.SMALL_BLIND,
                        index: 1,
                        seat: 2,
                        timestamp: Date.now()
                    },
                    {
                        playerId: PLAYER_2,
                        amount: TWO_TOKENS,
                        action: PlayerActionType.BIG_BLIND,
                        index: 2,
                        seat: 3,
                        timestamp: Date.now()
                    }
                ];
            } else {
                return [
                    {
                        playerId: PLAYER_3,
                        amount: FIVE_TOKENS,
                        action: PlayerActionType.BET,
                        index: 3,
                        seat: 3,
                        timestamp: Date.now()
                    },
                    {
                        playerId: PLAYER_4,
                        amount: 1300000000000000000n, // 13 tokens
                        action: PlayerActionType.RAISE,
                        index: 4,
                        seat: 4,
                        timestamp: Date.now()
                    }
                ];
            }
        });

        const bets = new Map<string, bigint>();
        bets.set(PLAYER_1, ONE_TOKEN); // 1 token (small blind)
        bets.set(PLAYER_2, TWO_TOKENS); // 2 tokens (big blind)
        bets.set(PLAYER_3, FIVE_TOKENS); // 5 tokens
        bets.set(PLAYER_4, 1300000000000000000n); // 13 tokens
        jest.spyOn(game, "getBets").mockReturnValue(bets);

        // Mock addAction method on game
        game.addAction = jest.fn();
    });

    describe("verify", () => {
        it("should return correct range for a re raise", () => {
            const range = action.verify(player);

            // In this scenario:
            // - Small blind: 1 token
            // - Big blind: 2 tokens
            // - Bet: 5 tokens
            // - Raise: 13 tokens (raise of 8 tokens from 5 to 13)
            // 
            // To re-raise, minimum should be current bet (13) + last raise amount (8) = 21 tokens
            const expectedMinAmount = 2100000000000000000n; // 21 tokens

            expect(range).toEqual({
                minAmount: expectedMinAmount,
                maxAmount: player.chips
            });
        });
    });
});
