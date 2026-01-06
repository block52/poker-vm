import {
    PlayerStatus,
    TexasHoldemRound,
    GameOptions,
    PlayerActionType,
    NonPlayerActionType,
    GameType
} from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { SitAndGoBlindsManager } from "./managers/blindsManager";
import { PayoutManager } from "./managers/payoutManager";
import { mnemonic } from "./testConstants";

describe("Sit and Go - Simple Tournament", () => {
    // Player addresses
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";
    const PLAYER_3 = "0x3333333333333333333333333333333333333333";

    // Chip values - using small numbers for clarity
    const STARTING_STACK = 1000n;
    const SMALL_BLIND = 25n;
    const BIG_BLIND = 50n;

    let actionIndex: number;

    const createGame = (blindLevelDuration: number = 1): TexasHoldemGame => {
        const gameOptions: GameOptions = {
            minBuyIn: STARTING_STACK,
            maxBuyIn: STARTING_STACK,
            minPlayers: 3,
            maxPlayers: 3,
            smallBlind: SMALL_BLIND,
            bigBlind: BIG_BLIND,
            timeout: 60000,
            type: GameType.SIT_AND_GO,
            startingStack: STARTING_STACK,
            blindLevelDuration: blindLevelDuration // minutes per level
        };

        const baseGameConfig = {
            address: "0x0000000000000000000000000000000000000000",
            dealer: 3, // Dealer at seat 3
            nextToAct: 1,
            currentRound: "ante",
            communityCards: [],
            pot: 0n,
            players: [],
            now: Date.now()
        };

        return TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
    };

    const joinAllPlayers = (game: TexasHoldemGame): void => {
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, actionIndex++, STARTING_STACK, "seat=1", Date.now());
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, actionIndex++, STARTING_STACK, "seat=2", Date.now());
        game.performAction(PLAYER_3, NonPlayerActionType.JOIN, actionIndex++, STARTING_STACK, "seat=3", Date.now());
    };

    const playHandToShowdown = (game: TexasHoldemGame): void => {
        // Post blinds - with dealer at 3, SB=1, BB=2
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, actionIndex++, SMALL_BLIND, undefined, Date.now());
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, actionIndex++, BIG_BLIND, undefined, Date.now());
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, actionIndex++, undefined, undefined, Date.now());

        // Everyone calls/checks to showdown
        // P3 (UTG) calls 50
        game.performAction(PLAYER_3, PlayerActionType.CALL, actionIndex++, BIG_BLIND, undefined, Date.now());
        // P1 (SB) calls 25 more to match 50
        game.performAction(PLAYER_1, PlayerActionType.CALL, actionIndex++, SMALL_BLIND, undefined, Date.now());
        // P2 (BB) checks
        game.performAction(PLAYER_2, PlayerActionType.CHECK, actionIndex++, 0n, undefined, Date.now());

        // Flop - everyone checks
        game.performAction(PLAYER_1, PlayerActionType.CHECK, actionIndex++, 0n, undefined, Date.now());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, actionIndex++, 0n, undefined, Date.now());
        game.performAction(PLAYER_3, PlayerActionType.CHECK, actionIndex++, 0n, undefined, Date.now());

        // Turn - everyone checks
        game.performAction(PLAYER_1, PlayerActionType.CHECK, actionIndex++, 0n, undefined, Date.now());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, actionIndex++, 0n, undefined, Date.now());
        game.performAction(PLAYER_3, PlayerActionType.CHECK, actionIndex++, 0n, undefined, Date.now());

        // River - everyone checks
        game.performAction(PLAYER_1, PlayerActionType.CHECK, actionIndex++, 0n, undefined, Date.now());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, actionIndex++, 0n, undefined, Date.now());
        game.performAction(PLAYER_3, PlayerActionType.CHECK, actionIndex++, 0n, undefined, Date.now());

        // All show
        game.performAction(PLAYER_1, PlayerActionType.SHOW, actionIndex++, 0n, undefined, Date.now());
        game.performAction(PLAYER_2, PlayerActionType.SHOW, actionIndex++, 0n, undefined, Date.now());
        game.performAction(PLAYER_3, PlayerActionType.SHOW, actionIndex++, 0n, undefined, Date.now());
    };

    beforeEach(() => {
        actionIndex = 1;
    });

    describe("Blind Level Increases", () => {
        it("should increase blinds after the level duration passes", () => {
            const game = createGame(1); // 1 minute levels
            joinAllPlayers(game);

            // Check initial blinds
            expect(game.smallBlind).toBe(SMALL_BLIND);
            expect(game.bigBlind).toBe(BIG_BLIND);

            // Access the blinds manager directly to test level increases
            const blindsManager = game.blindsManager as SitAndGoBlindsManager;

            // Set start time to 2 minutes ago (should be level 2)
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
            blindsManager.setStartTime(twoMinutesAgo);

            const blinds = blindsManager.getBlinds();

            // Level 2: blinds should have doubled twice (25*2^2=100, 50*2^2=200)
            expect(blinds.smallBlind).toBe(SMALL_BLIND * 4n); // 100
            expect(blinds.bigBlind).toBe(BIG_BLIND * 4n); // 200
        });

        it("should double blinds each level", () => {
            const game = createGame(1);
            joinAllPlayers(game);

            const blindsManager = game.blindsManager as SitAndGoBlindsManager;

            // Level 0 (0-1 min)
            blindsManager.setStartTime(new Date());
            let blinds = blindsManager.getBlinds();
            expect(blinds.smallBlind).toBe(25n);
            expect(blinds.bigBlind).toBe(50n);

            // Level 1 (1-2 min) - doubles
            blindsManager.setStartTime(new Date(Date.now() - 1 * 60 * 1000));
            blinds = blindsManager.getBlinds();
            expect(blinds.smallBlind).toBe(50n);
            expect(blinds.bigBlind).toBe(100n);

            // Level 2 (2-3 min) - doubles again
            blindsManager.setStartTime(new Date(Date.now() - 2 * 60 * 1000));
            blinds = blindsManager.getBlinds();
            expect(blinds.smallBlind).toBe(100n);
            expect(blinds.bigBlind).toBe(200n);

            // Level 3 (3-4 min)
            blindsManager.setStartTime(new Date(Date.now() - 3 * 60 * 1000));
            blinds = blindsManager.getBlinds();
            expect(blinds.smallBlind).toBe(200n);
            expect(blinds.bigBlind).toBe(400n);
        });
    });

    describe("Players Busting Out", () => {
        it("should mark a player as BUSTED when they have 0 chips after a hand", () => {
            const game = createGame();
            joinAllPlayers(game);

            // Play a hand normally
            playHandToShowdown(game);

            // Manually set P3's chips to 0 to simulate them losing all chips
            const p3 = game.getPlayer(PLAYER_3);
            expect(p3).toBeDefined();
            p3!.chips = 0n;

            // Start new hand - this triggers reInit which marks 0-chip players as BUSTED
            game.performAction(PLAYER_1, NonPlayerActionType.NEW_HAND, actionIndex++, undefined, `deck=${mnemonic}`, Date.now());

            // Check P3 is now BUSTED
            expect(game.getPlayer(PLAYER_3)?.status).toBe(PlayerStatus.BUSTED);

            // Check results include the busted player
            const state = game.toJson();
            expect(state.results?.length).toBe(1);
            expect(state.results?.[0].playerId).toBe(PLAYER_3);
            expect(state.results?.[0].place).toBe(3); // 3rd place (first to bust in 3-player)
        });

        it("should track multiple players busting simultaneously", () => {
            const game = createGame();
            joinAllPlayers(game);

            // Play hand
            playHandToShowdown(game);

            // P2 and P3 both bust after the hand
            game.getPlayer(PLAYER_2)!.chips = 0n;
            game.getPlayer(PLAYER_3)!.chips = 0n;
            game.performAction(PLAYER_1, NonPlayerActionType.NEW_HAND, actionIndex++, undefined, `deck=${mnemonic}`, Date.now());

            // Both should be marked as BUSTED
            expect(game.getPlayer(PLAYER_2)?.status).toBe(PlayerStatus.BUSTED);
            expect(game.getPlayer(PLAYER_3)?.status).toBe(PlayerStatus.BUSTED);

            // Results should have 2 entries
            const state = game.toJson();
            expect(state.results?.length).toBe(2);

            // P1 is the only active player (winner)
            expect(game.getPlayer(PLAYER_1)?.status).toBe(PlayerStatus.ACTIVE);
            expect(game.findActivePlayers().length).toBe(1);
        });
    });

    describe("Tournament Payouts", () => {
        it("should calculate correct payouts for a 3-player SNG using PayoutManager", () => {
            // Test PayoutManager directly
            // Total prize pool = 3 * 1000 = 3000
            // For <6 players: 1st = 80%, 2nd = 20%, 3rd = 0%

            const game = createGame();
            joinAllPlayers(game);

            const players = game.getSeatedPlayers();
            const buyIn = STARTING_STACK;

            const payoutManager = new PayoutManager(buyIn, players);

            // 1st place = 80% of 3000 = 2400
            expect(payoutManager.calculatePayout(1)).toBe((buyIn * 3n * 80n) / 100n);

            // 2nd place = 20% of 3000 = 600
            expect(payoutManager.calculatePayout(2)).toBe((buyIn * 3n * 20n) / 100n);

            // 3rd place = 0%
            expect(payoutManager.calculatePayout(3)).toBe(0n);
        });

        it("should record correct payout in results when player busts", () => {
            const game = createGame();
            joinAllPlayers(game);

            // Play hand and bust P3
            playHandToShowdown(game);
            game.getPlayer(PLAYER_3)!.chips = 0n;
            game.performAction(PLAYER_1, NonPlayerActionType.NEW_HAND, actionIndex++, undefined, `deck=${mnemonic}`, Date.now());

            // P3 (3rd place) should have 0 payout
            const state = game.toJson();
            const p3Result = state.results?.find(r => r.playerId === PLAYER_3);
            expect(p3Result?.place).toBe(3);
            expect(BigInt(p3Result?.payout || 0)).toBe(0n); // 3rd place = 0% for <6 players
        });
    });

    describe("Full SNG Flow", () => {
        it("should complete a full 3-player SNG with blind increases and player busting", () => {
            const game = createGame(1); // 1 minute blind levels

            // Join all players
            joinAllPlayers(game);
            expect(game.getPlayerCount()).toBe(3);

            // Verify initial blinds
            const blindsManager = game.blindsManager as SitAndGoBlindsManager;
            let blinds = blindsManager.getBlinds();
            expect(blinds.smallBlind).toBe(25n);
            expect(blinds.bigBlind).toBe(50n);

            // Play first hand
            playHandToShowdown(game);

            // Simulate time passing for blind level increase
            blindsManager.setStartTime(new Date(Date.now() - 2 * 60 * 1000));
            blinds = blindsManager.getBlinds();
            expect(blinds.smallBlind).toBe(100n); // Level 2
            expect(blinds.bigBlind).toBe(200n);

            // Both P2 and P3 bust (tournament ends)
            game.getPlayer(PLAYER_2)!.chips = 0n;
            game.getPlayer(PLAYER_3)!.chips = 0n;
            game.performAction(PLAYER_1, NonPlayerActionType.NEW_HAND, actionIndex++, undefined, `deck=${mnemonic}`, Date.now());

            // Verify both players are BUSTED
            expect(game.getPlayer(PLAYER_2)?.status).toBe(PlayerStatus.BUSTED);
            expect(game.getPlayer(PLAYER_3)?.status).toBe(PlayerStatus.BUSTED);

            // Verify results
            const state = game.toJson();
            expect(state.results?.length).toBe(2);

            // Verify payouts using PayoutManager structure (for <6 players)
            // Note: When both bust simultaneously, order depends on seat iteration
            const p2Result = state.results?.find(r => r.playerId === PLAYER_2);
            const p3Result = state.results?.find(r => r.playerId === PLAYER_3);
            expect(p2Result).toBeDefined();
            expect(p3Result).toBeDefined();

            // P1 is the winner and still active
            expect(game.getPlayer(PLAYER_1)?.status).toBe(PlayerStatus.ACTIVE);
            expect(game.findActivePlayers().length).toBe(1);
            expect(game.findActivePlayers()[0].address).toBe(PLAYER_1);
        });
    });
});
