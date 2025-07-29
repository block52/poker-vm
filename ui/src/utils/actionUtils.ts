import { LegalActionDTO, NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";

export const hasAction = (legalActions: LegalActionDTO[], action: PlayerActionType | NonPlayerActionType): boolean => {
    return legalActions.some(legalAction => legalAction.action === action);
};

// Find the specific actions
export const getActionByType = (legalActions: LegalActionDTO[], actionType: PlayerActionType | NonPlayerActionType): LegalActionDTO | undefined => {
    return legalActions.find(action => action.action === actionType || action.action?.toString() === actionType?.toString());
};

// export const getAction = (legalActions: LegalActionDTO[], actionType: PlayerActionType | NonPlayerActionType): ( LegalActionDTO | undefined, boolean) => {
//     const action = getActionByType(legalActions, actionType);
//     const isActionAvailable = hasAction(legalActions, actionType);
//     return [action, isActionAvailable];
// };