import { LegalActionDTO, PlayerActionType, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { hasAction, getActionByType } from "./actionUtils";

describe("actionUtils", () => {
    describe("hasAction", () => {
        const mockLegalActions: LegalActionDTO[] = [
            { action: PlayerActionType.FOLD } as LegalActionDTO,
            { action: PlayerActionType.CALL } as LegalActionDTO,
            { action: PlayerActionType.RAISE } as LegalActionDTO,
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
                { action: NonPlayerActionType.DEAL } as LegalActionDTO,
            ];
            expect(hasAction(actionsWithNonPlayer, NonPlayerActionType.DEAL)).toBe(true);
            expect(hasAction(actionsWithNonPlayer, NonPlayerActionType.SHOWDOWN)).toBe(false);
        });
    });

    describe("getActionByType", () => {
        const mockLegalActions: LegalActionDTO[] = [
            { action: PlayerActionType.FOLD, minAmount: "0" } as LegalActionDTO,
            { action: PlayerActionType.CALL, minAmount: "100" } as LegalActionDTO,
            { action: PlayerActionType.RAISE, minAmount: "200", maxAmount: "1000" } as LegalActionDTO,
        ];

        it("should return the action when it exists", () => {
            const foldAction = getActionByType(mockLegalActions, PlayerActionType.FOLD);
            expect(foldAction).toBeDefined();
            expect(foldAction?.action).toBe(PlayerActionType.FOLD);
        });

        it("should return action with correct properties", () => {
            const raiseAction = getActionByType(mockLegalActions, PlayerActionType.RAISE);
            expect(raiseAction).toBeDefined();
            expect(raiseAction?.minAmount).toBe("200");
            expect(raiseAction?.maxAmount).toBe("1000");
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
                { action: NonPlayerActionType.DEAL } as LegalActionDTO,
            ];
            const dealAction = getActionByType(actionsWithNonPlayer, NonPlayerActionType.DEAL);
            expect(dealAction).toBeDefined();
            expect(dealAction?.action).toBe(NonPlayerActionType.DEAL);
        });

        it("should return first match if multiple actions of same type exist", () => {
            const duplicateActions: LegalActionDTO[] = [
                { action: PlayerActionType.CALL, minAmount: "100" } as LegalActionDTO,
                { action: PlayerActionType.CALL, minAmount: "200" } as LegalActionDTO,
            ];
            const result = getActionByType(duplicateActions, PlayerActionType.CALL);
            expect(result?.minAmount).toBe("100");
        });
    });
});
