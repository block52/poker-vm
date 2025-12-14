import { LegalActionDTO, PlayerActionType, NonPlayerActionType } from "@block52/poker-vm-sdk";
import { hasAction, getActionByType } from "./actionUtils";

describe("actionUtils", () => {
    describe("hasAction", () => {
        const mockLegalActions: LegalActionDTO[] = [
            { action: PlayerActionType.FOLD, min: undefined, max: undefined, index: 0 },
            { action: PlayerActionType.CALL, min: undefined, max: undefined, index: 1 },
            { action: PlayerActionType.RAISE, min: undefined, max: undefined, index: 2 },
        ];

        it("should return true when action exists", () => {
            expect(hasAction(mockLegalActions, PlayerActionType.FOLD)).toBe(true);
            expect(hasAction(mockLegalActions, PlayerActionType.CALL)).toBe(true);
            expect(hasAction(mockLegalActions, PlayerActionType.RAISE)).toBe(true);
        });

        it("should return false when action does not exist", () => {
            expect(hasAction(mockLegalActions, PlayerActionType.BET)).toBe(false);
            expect(hasAction(mockLegalActions, PlayerActionType.CHECK)).toBe(false);
        });

        it("should handle empty legal actions array", () => {
            expect(hasAction([], PlayerActionType.FOLD)).toBe(false);
        });

        it("should work with NonPlayerActionType", () => {
            const actionsWithNonPlayer: LegalActionDTO[] = [
                { action: NonPlayerActionType.DEAL, min: undefined, max: undefined, index: 0 },
            ];
            expect(hasAction(actionsWithNonPlayer, NonPlayerActionType.DEAL)).toBe(true);
            expect(hasAction(actionsWithNonPlayer, NonPlayerActionType.LEAVE)).toBe(false);
        });
    });

    describe("getActionByType", () => {
        const mockLegalActions: LegalActionDTO[] = [
            { action: PlayerActionType.FOLD, min: "0", max: undefined, index: 0 },
            { action: PlayerActionType.CALL, min: "100", max: undefined, index: 1 },
            { action: PlayerActionType.RAISE, min: "200", max: "1000", index: 2 },
        ];

        it("should return the action when it exists", () => {
            const foldAction = getActionByType(mockLegalActions, PlayerActionType.FOLD);
            expect(foldAction).toBeDefined();
            expect(foldAction?.action).toBe(PlayerActionType.FOLD);
        });

        it("should return action with correct properties", () => {
            const raiseAction = getActionByType(mockLegalActions, PlayerActionType.RAISE);
            expect(raiseAction).toBeDefined();
            expect(raiseAction?.min).toBe("200");
            expect(raiseAction?.max).toBe("1000");
        });

        it("should return undefined when action does not exist", () => {
            const betAction = getActionByType(mockLegalActions, PlayerActionType.BET);
            expect(betAction).toBeUndefined();
        });

        it("should handle empty legal actions array", () => {
            const result = getActionByType([], PlayerActionType.FOLD);
            expect(result).toBeUndefined();
        });

        it("should work with NonPlayerActionType", () => {
            const actionsWithNonPlayer: LegalActionDTO[] = [
                { action: NonPlayerActionType.DEAL, min: undefined, max: undefined, index: 0 },
            ];
            const dealAction = getActionByType(actionsWithNonPlayer, NonPlayerActionType.DEAL);
            expect(dealAction).toBeDefined();
            expect(dealAction?.action).toBe(NonPlayerActionType.DEAL);
        });

        it("should return first match if multiple actions of same type exist", () => {
            const duplicateActions: LegalActionDTO[] = [
                { action: PlayerActionType.CALL, min: "100", max: undefined, index: 0 },
                { action: PlayerActionType.CALL, min: "200", max: undefined, index: 1 },
            ];
            const result = getActionByType(duplicateActions, PlayerActionType.CALL);
            expect(result?.min).toBe("100");
        });
    });
});
