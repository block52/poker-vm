// usePlayerContext.ts
import { useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { PlayerContextType } from "./types";

export const usePlayerContext = (): PlayerContextType => {
    console.log("usePlayerContext called from:", new Error().stack?.split("\n")[2]?.trim());
    
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error("usePlayerContext must be used within a PlayerProvider");
    }
    
    console.log("usePlayerContext returning data:", {
        contextKeys: Object.keys(context),
        hasData: !!context
    });
    
    return context;
};
