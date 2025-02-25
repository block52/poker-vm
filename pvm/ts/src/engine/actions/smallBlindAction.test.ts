import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import SmallBlindAction from "./smallBlindAction";
import TexasHoldemGame from "../texasHoldem";

describe("SmallBlindAction", () => {
    let game: TexasHoldemGame;
    let updateMock: any;
    let action: SmallBlindAction;
    let player: Player;

    beforeEach(() => {
        console.log("\n=== POKER HAND SETUP ===");
        console.log("Game State: Starting new hand");
        console.log("Round: ANTE (where blinds are posted)");
        
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x123",             // address
            undefined,           // lastAction
            1000n,              // chips
            undefined,          // holeCards
            PlayerStatus.ACTIVE  // status
        );
        playerStates.set(0, initialPlayer);

        game = new TexasHoldemGame(
            "0xgame",
            10n,          // minBuyIn
            30n,          // maxBuyIn
            2,            // minPlayers
            9,            // maxPlayers
            10n,          // smallBlind
            20n,          // bigBlind
            0,            // dealer
            1,            // nextToAct
            TexasHoldemRound.ANTE,
            [],           // communityCards
            0n,           // pot
            playerStates
        );

        updateMock = {
            addAction: jest.fn(action => {
                console.log("Action recorded:", action);
                console.log("Pot will be updated with this amount");
            })
        };

        action = new SmallBlindAction(game, updateMock);
        player = new Player(
            "0x123",             // address
            undefined,           // lastAction
            1000n,              // chips
            undefined,          // holeCards
            PlayerStatus.ACTIVE  // status
        );
        console.log("Player stack size:", player.chips.toString());
        console.log("Small blind amount:", game.smallBlind.toString());
    });

    describe("type", () => {
        it("should return SMALL_BLIND action type", () => {
            console.log("\n=== GAME STATE: ANTE ROUND ===");
            console.log("Position: Small Blind (first to act)");
            console.log("Expected Action: Post small blind");
            const type = action.type;
            console.log("Action type returned:", type);
            expect(action.type).toBe(PlayerActionType.SMALL_BLIND);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            console.log("\n=== GAME STATE: ANTE ROUND - VERIFY SMALL BLIND ===");
            console.log("Checking if player can post small blind:");
            console.log("1. Must be player's turn");
            console.log("2. Must be in ANTE round");
            console.log("3. Player must be active");

            jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x123");
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        it("should return correct range for small blind", () => {
            console.log("\n=== Verifying Small Blind Amount ===");
            console.log("Small blind is a fixed amount - player must post exactly this amount");
            const range = action.verify(player);
            console.log("Valid betting range:", range);
            console.log(`Must bet exactly ${game.smallBlind.toString()} chips`);
            expect(range).toEqual({
                minAmount: game.smallBlind,
                maxAmount: game.smallBlind
            });
        });
    });

    describe("getDeductAmount", () => {
        it("should return small blind amount", () => {
            console.log("\n=== GAME STATE: ANTE ROUND - CALCULATING SMALL BLIND ===");
            console.log("Getting amount to deduct from player's stack");
            const amount = action.getDeductAmount();
            console.log(`Will deduct ${amount.toString()} chips from player's stack of ${player.chips.toString()}`);
            expect(amount).toBe(game.smallBlind);
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            console.log("\n=== GAME STATE: ANTE ROUND - EXECUTING SMALL BLIND ===");
            console.log("Setting up for small blind execution:");
            console.log("1. Confirming it's player's turn");
            console.log("2. Verifying we're in ANTE round");
            console.log("3. Checking player is active");

            jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x123");
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        it("should deduct small blind amount from player chips", () => {
            console.log("\n=== Processing Small Blind Deduction ===");
            const initialChips = player.chips;
            console.log("Player's stack before small blind:", initialChips.toString());
            action.execute(player, game.smallBlind);
            console.log("Player's stack after small blind:", player.chips.toString());
            console.log(`Deducted ${game.smallBlind.toString()} chips`);
            expect(player.chips).toBe(initialChips - game.smallBlind);
        });

        it("should add small blind action to update", () => {
            console.log("\n=== Recording Small Blind Action ===");
            console.log("Recording that player has posted small blind:");
            action.execute(player, game.smallBlind);
            console.log("Action recorded in game history");
            console.log("Next: Big blind player will act");
            expect(updateMock.addAction).toHaveBeenCalledWith({
                playerId: player.id,
                action: PlayerActionType.SMALL_BLIND,
                amount: game.smallBlind
            });
        });

        it("should throw error if amount doesn't match small blind", () => {
            console.log("\n=== Validating Small Blind Amount ===");
            console.log("Attempting to post incorrect small blind amount");
            console.log(`Required amount: ${game.smallBlind.toString()}`);
            console.log(`Attempted amount: ${(game.smallBlind + 1n).toString()}`);
            expect(() => action.execute(player, game.smallBlind + 1n))
                .toThrow("Amount is greater than maximum allowed.");
        });
    });
});
