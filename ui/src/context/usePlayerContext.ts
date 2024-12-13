// usePlayerContext.ts
import { useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { PlayerContextType } from "./types";

export const usePlayerContext = (): PlayerContextType => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error("usePlayerContext must be used within a PlayerProvider");
    }
    return context;
};
