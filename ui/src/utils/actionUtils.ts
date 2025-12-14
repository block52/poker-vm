import { LegalActionDTO, NonPlayerActionType, PlayerActionType } from "@block52/poker-vm-sdk";

export const hasAction = (legalActions: LegalActionDTO[], action: PlayerActionType | NonPlayerActionType): boolean => {
    return legalActions.some(legalAction => legalAction.action === action);
};

// Find the specific actions
export const getActionByType = (legalActions: LegalActionDTO[], actionType: PlayerActionType | NonPlayerActionType): LegalActionDTO | undefined => {
    return legalActions.find(action => action.action === actionType || action.action?.toString() === actionType?.toString());
};