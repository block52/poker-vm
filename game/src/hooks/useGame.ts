// TODO: Implement useGame hook
// For now just return the static game state

import { exampleState, TexasHoldemState } from "@/types/game";
import { useState } from "react";

export function useGame() {
    return useState<TexasHoldemState>(exampleState);
}