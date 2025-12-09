import { NonPlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import TopUpAction from "./topUpAction";
import { IUpdate } from "../types";
import { getDefaultGame, ONE_HUNDRED_TOKENS, FIFTY_TOKENS, TEN_TOKENS } from "../testConstants";

describe("TopUpAction", () => {
    let action: TopUpAction;
    let game: TexasHoldemGame;
    let bustedPlayer: Player;
    let sittingOutPlayer: Player;
    let activePlayer: Player;
    let updateMock: IUpdate;

    beforeEach(() => {
        // Mock the IUpdate interface
        updateMock = {
            addAction: jest.fn()
        };

        // Create default game with max buy-in of 100 tokens
        const playerStates = new Map<number, Player | null>();
        playerStates.set(1, new Player(
            "0x1111111111111111111111111111111111111111",
            undefined,
            0n, // Busted player
            undefined,
            PlayerStatus.BUSTED
        ));
        playerStates.set(2, new Player(
            "0x2222222222222222222222222222222222222222",
            undefined,
            FIFTY_TOKENS,
            undefined,
            PlayerStatus.SITTING_OUT
        ));
        playerStates.set(3, new Player(
            "0x3333333333333333333333333333333333333333",
            undefined,
            FIFTY_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        ));

        game = getDefaultGame(playerStates);

        // Setup game for ante round
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
        jest.spyOn(game, "maxBuyIn", "get").mockReturnValue(ONE_HUNDRED_TOKENS);

        action = new TopUpAction(game, updateMock);

        bustedPlayer = new Player(
            "0x1111111111111111111111111111111111111111",
            undefined,
            0n,
            undefined,
            PlayerStatus.BUSTED
        );

        sittingOutPlayer = new Player(
            "0x2222222222222222222222222222222222222222",
            undefined,
            FIFTY_TOKENS,
            undefined,
            PlayerStatus.SITTING_OUT
        );

        activePlayer = new Player(
            "0x3333333333333333333333333333333333333333",
            undefined,
            FIFTY_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        );

        // Mock game methods
        jest.spyOn(game, "addNonPlayerAction").mockImplementation();
    });

    describe("type", () => {
        it("should return TOP_UP type", () => {
            expect(action.type).toBe(NonPlayerActionType.TOP_UP);
        });
    });

    describe("verify", () => {
        it("should return correct range for busted player", () => {
            const result = action.verify(bustedPlayer);
            expect(result).toEqual({ minAmount: 1n, maxAmount: ONE_HUNDRED_TOKENS });
        });

        it("should return correct range for player with partial chips", () => {
            const result = action.verify(sittingOutPlayer);
            expect(result).toEqual({ minAmount: 1n, maxAmount: FIFTY_TOKENS }); // Can top up to reach 100
        });

        it("should throw error if player is ACTIVE", () => {
            expect(() => action.verify(activePlayer))
                .toThrow("Cannot top up while in an active hand");
        });

        it("should throw error if player is ALL_IN", () => {
            const allInPlayer = new Player(
                "0x4444444444444444444444444444444444444444",
                undefined,
                FIFTY_TOKENS,
                undefined,
                PlayerStatus.ALL_IN
            );

            expect(() => action.verify(allInPlayer))
                .toThrow("Cannot top up while in an active hand");
        });

        it("should throw error if player already at maximum", () => {
            const maxedPlayer = new Player(
                "0x5555555555555555555555555555555555555555",
                undefined,
                ONE_HUNDRED_TOKENS,
                undefined,
                PlayerStatus.SITTING_OUT
            );

            expect(() => action.verify(maxedPlayer))
                .toThrow("Already at maximum buy-in");
        });

        it("should throw error if amount exceeds maximum", () => {
            const tooMuch = ONE_HUNDRED_TOKENS + 1n;
            expect(() => action.verify(bustedPlayer, tooMuch))
                .toThrow("Top-up amount exceeds table maximum");
        });

        it("should throw error if amount is zero", () => {
            expect(() => action.verify(bustedPlayer, 0n))
                .toThrow("Top-up amount must be positive");
        });

        it("should throw error if amount is negative", () => {
            expect(() => action.verify(bustedPlayer, -10n))
                .toThrow("Top-up amount must be positive");
        });

        it("should allow valid amount within range", () => {
            const result = action.verify(bustedPlayer, TEN_TOKENS);
            expect(result).toEqual({ minAmount: 1n, maxAmount: ONE_HUNDRED_TOKENS });
        });
    });

    describe("execute", () => {
        it("should add chips to busted player", () => {
            const initialChips = bustedPlayer.chips;
            action.execute(bustedPlayer, 1, TEN_TOKENS);
            expect(bustedPlayer.chips).toBe(initialChips + TEN_TOKENS);
        });

        it("should add chips to sitting out player", () => {
            const initialChips = sittingOutPlayer.chips;
            action.execute(sittingOutPlayer, 1, TEN_TOKENS);
            expect(sittingOutPlayer.chips).toBe(initialChips + TEN_TOKENS);
        });

        it("should change BUSTED player to SITTING_OUT", () => {
            expect(bustedPlayer.status).toBe(PlayerStatus.BUSTED);
            action.execute(bustedPlayer, 1, TEN_TOKENS);
            expect(bustedPlayer.status).toBe(PlayerStatus.SITTING_OUT);
        });

        it("should keep SITTING_OUT player as SITTING_OUT", () => {
            expect(sittingOutPlayer.status).toBe(PlayerStatus.SITTING_OUT);
            action.execute(sittingOutPlayer, 1, TEN_TOKENS);
            expect(sittingOutPlayer.status).toBe(PlayerStatus.SITTING_OUT);
        });

        it("should call addNonPlayerAction with correct parameters", () => {
            action.execute(bustedPlayer, 5, TEN_TOKENS);
            expect(game.addNonPlayerAction).toHaveBeenCalledWith(
                {
                    playerId: bustedPlayer.address,
                    action: NonPlayerActionType.TOP_UP,
                    amount: TEN_TOKENS,
                    index: 5
                },
                ""
            );
        });

        it("should throw error if amount not provided", () => {
            expect(() => action.execute(bustedPlayer, 1, undefined))
                .toThrow("Top-up amount is required and must be positive");
        });

        it("should throw error if amount is zero", () => {
            expect(() => action.execute(bustedPlayer, 1, 0n))
                .toThrow("Top-up amount is required and must be positive");
        });

        it("should throw error if trying to top up active player", () => {
            expect(() => action.execute(activePlayer, 1, TEN_TOKENS))
                .toThrow("Cannot top up while in an active hand");
        });

        it("should allow topping up to exactly max buy-in", () => {
            const initialChips = bustedPlayer.chips;
            action.execute(bustedPlayer, 1, ONE_HUNDRED_TOKENS);
            expect(bustedPlayer.chips).toBe(initialChips + ONE_HUNDRED_TOKENS);
        });

        it("should throw error if topping up beyond max buy-in", () => {
            expect(() => action.execute(sittingOutPlayer, 1, ONE_HUNDRED_TOKENS))
                .toThrow("Top-up amount exceeds table maximum");
        });

        it("should allow FOLDED player to top up", () => {
            const foldedPlayer = new Player(
                "0x6666666666666666666666666666666666666666",
                undefined,
                TEN_TOKENS,
                undefined,
                PlayerStatus.FOLDED
            );

            const initialChips = foldedPlayer.chips;
            action.execute(foldedPlayer, 1, TEN_TOKENS);
            expect(foldedPlayer.chips).toBe(initialChips + TEN_TOKENS);
        });
    });
});
