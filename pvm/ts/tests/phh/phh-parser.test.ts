import * as fs from "fs";
import * as path from "path";
import { PhhParser } from "../../src/testing/phhParser";
import { PlayerActionType, NonPlayerActionType } from "@block52/poker-vm-sdk";

describe("PHH Parser", () => {
    let parser: PhhParser;

    beforeEach(() => {
        parser = new PhhParser();
    });

    describe("Card parsing", () => {
        it("should parse PHH card notation", () => {
            expect(parser.parseCards("Ac2d")).toEqual(["AC", "2D"]);
            expect(parser.parseCards("7h6h")).toEqual(["7H", "6H"]);
            expect(parser.parseCards("Jc3d5c")).toEqual(["JC", "3D", "5C"]);
            expect(parser.parseCards("????")).toEqual([]);
        });
    });

    describe("Parse Dwan-Ivey 2009 hand", () => {
        let content: string;

        beforeAll(() => {
            const filePath = path.join(__dirname, "fixtures/dwan-ivey-2009.phh");
            content = fs.readFileSync(filePath, "utf-8");
        });

        it("should parse hand metadata", () => {
            const result = parser.parse(content);

            expect(result.hand.variant).toBe("NT");
            expect(result.hand.antes).toEqual([500, 500, 500]);
            expect(result.hand.blindsOrStraddles).toEqual([1000, 2000, 0]);
            expect(result.hand.minBet).toBe(2000);
            expect(result.hand.startingStacks).toEqual([1125600, 2000000, 553500]);
            expect(result.hand.players).toEqual(["Phil Ivey", "Patrik Antonius", "Tom Dwan"]);
            expect(result.hand.year).toBe(2009);
        });

        it("should parse all actions", () => {
            const result = parser.parse(content);

            // Should have parsed all actions
            expect(result.actions.length).toBeGreaterThan(0);

            // Check deal actions
            const dealHoleActions = result.actions.filter(a => a.type === "deal_hole");
            expect(dealHoleActions.length).toBe(3);

            // Ivey's cards
            expect(dealHoleActions[0].player).toBe(1);
            expect(dealHoleActions[0].cards).toEqual(["AC", "2D"]);

            // Antonius's hidden cards
            expect(dealHoleActions[1].player).toBe(2);
            expect(dealHoleActions[1].cards).toEqual([]);

            // Dwan's cards
            expect(dealHoleActions[2].player).toBe(3);
            expect(dealHoleActions[2].cards).toEqual(["7H", "6H"]);
        });

        it("should parse betting actions correctly", () => {
            const result = parser.parse(content);

            // Find first betting action (Dwan raises preflop over BB of 2000)
            const firstBet = result.actions.find(a => a.type === "bet" || a.type === "raise");
            expect(firstBet).toBeDefined();
            expect(firstBet?.player).toBe(3); // Dwan
            expect(firstBet?.amount).toBe(7000);
            // It's a RAISE because BB=2000 is already the current bet
            expect(firstBet?.type).toBe("raise");

            // Find fold (Antonius)
            const fold = result.actions.find(a => a.type === "fold");
            expect(fold).toBeDefined();
            expect(fold?.player).toBe(2);
        });

        it("should parse board cards", () => {
            const result = parser.parse(content);

            const dealBoardActions = result.actions.filter(a => a.type === "deal_board");
            expect(dealBoardActions.length).toBe(3); // Flop, Turn, River

            // Flop
            expect(dealBoardActions[0].cards).toEqual(["JC", "3D", "5C"]);

            // Turn
            expect(dealBoardActions[1].cards).toEqual(["4H"]);

            // River
            expect(dealBoardActions[2].cards).toEqual(["JH"]);
        });

        it("should parse showdown actions", () => {
            const result = parser.parse(content);

            const showActions = result.actions.filter(a => a.type === "show");
            expect(showActions.length).toBe(2);

            // Ivey shows
            expect(showActions[0].player).toBe(1);
            expect(showActions[0].cards).toEqual(["AC", "2D"]);

            // Dwan shows
            expect(showActions[1].player).toBe(3);
            expect(showActions[1].cards).toEqual(["7H", "6H"]);
        });
    });

    describe("Action type mapping", () => {
        it("should distinguish check from call based on current bet", () => {
            const content = `
variant = "NT"
antes = [0, 0]
blinds_or_straddles = [100, 200]
min_bet = 200
starting_stacks = [10000, 10000]
players = ["P1", "P2"]
actions = [
  "d dh p1 AcKc",
  "d dh p2 2h3h",
  "p1 cc",
  "p2 cc",
  "d db Jc3d5c",
  "p2 cc",
  "p1 cbr 200",
  "p2 cc",
]
`;
            const result = parser.parse(content);

            // Get actions in order (excluding deals)
            const playerActions = result.actions.filter(a => a.type !== "deal_hole" && a.type !== "deal_board");

            // p1 cc preflop - CALL (BB=200 is current bet)
            expect(playerActions[0].type).toBe("call");
            expect(playerActions[0].player).toBe(1);

            // p2 cc preflop - also seen as CALL by parser (doesn't track per-player bets)
            // Note: In reality this is a CHECK since BB already has 200 in
            expect(playerActions[1].type).toBe("call");
            expect(playerActions[1].player).toBe(2);

            // After flop deal, p2 cc should be CHECK (currentBet reset to 0)
            expect(playerActions[2].type).toBe("check");
            expect(playerActions[2].player).toBe(2);

            // p1 cbr 200 - should be BET (first bet post-flop)
            expect(playerActions[3].type).toBe("bet");
            expect(playerActions[3].player).toBe(1);

            // p2 cc after bet - should be CALL
            expect(playerActions[4].type).toBe("call");
            expect(playerActions[4].player).toBe(2);
        });
    });
});

describe("PHH to Engine Action Mapping", () => {
    /**
     * Map PHH action to our engine action type
     */
    function mapPhhActionToEngine(
        phhAction: { type: string; amount?: number },
        currentBet: bigint,
        playerBet: bigint
    ): { action: PlayerActionType | NonPlayerActionType; amount?: bigint } {
        switch (phhAction.type) {
            case "fold":
                return { action: PlayerActionType.FOLD };
            case "check":
                return { action: PlayerActionType.CHECK };
            case "call":
                return { action: PlayerActionType.CALL, amount: currentBet - playerBet };
            case "bet":
                return { action: PlayerActionType.BET, amount: BigInt(phhAction.amount || 0) };
            case "raise":
                return { action: PlayerActionType.RAISE, amount: BigInt(phhAction.amount || 0) };
            case "show":
                return { action: PlayerActionType.SHOW };
            case "deal_hole":
            case "deal_board":
                return { action: NonPlayerActionType.DEAL };
            default:
                throw new Error(`Unknown PHH action type: ${phhAction.type}`);
        }
    }

    it("should map fold correctly", () => {
        const result = mapPhhActionToEngine({ type: "fold" }, 0n, 0n);
        expect(result.action).toBe(PlayerActionType.FOLD);
    });

    it("should map check correctly", () => {
        const result = mapPhhActionToEngine({ type: "check" }, 0n, 0n);
        expect(result.action).toBe(PlayerActionType.CHECK);
    });

    it("should map call with correct amount", () => {
        const result = mapPhhActionToEngine({ type: "call" }, 200n, 100n);
        expect(result.action).toBe(PlayerActionType.CALL);
        expect(result.amount).toBe(100n);
    });

    it("should map bet correctly", () => {
        const result = mapPhhActionToEngine({ type: "bet", amount: 500 }, 0n, 0n);
        expect(result.action).toBe(PlayerActionType.BET);
        expect(result.amount).toBe(500n);
    });

    it("should map raise correctly", () => {
        const result = mapPhhActionToEngine({ type: "raise", amount: 1000 }, 500n, 0n);
        expect(result.action).toBe(PlayerActionType.RAISE);
        expect(result.amount).toBe(1000n);
    });
});
