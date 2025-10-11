import { useContext } from "react";
import { CosmosContext } from "../context/CosmosContext";

export const useCosmosContext = () => {
    const context = useContext(CosmosContext);
    if (!context) {
        throw new Error("useCosmosContext must be used within a CosmosProvider");
    }
    return context;
};