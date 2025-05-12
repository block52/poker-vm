import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { PROXY_URL } from "../../config/constants";

interface ShowCardsParams {
    userAddress: string;
    privateKey: string;
    publicKey: string;
    actionIndex: number;
}

export function useTableShow(tableId?: string) {
    const [isShowing, setIsShowing] = useState(false);

    const showCards = async (params: ShowCardsParams) => {
        if (!tableId) {
            console.error("No table ID provided");
            return;
        }

        setIsShowing(true);

        try {
            // Create a wallet instance to sign the message
            const wallet = new ethers.Wallet(params.privateKey);

            // Create the message to sign
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const message = `show:0:${tableId}:${timestamp}`;

            // Sign the message
            const signature = await wallet.signMessage(message);

            // Send the request to the proxy
            const response = await axios.post(`${PROXY_URL}/table/${tableId}/show`, {
                userAddress: params.userAddress,
                publicKey: params.publicKey,
                signature,
                index: params.actionIndex,
                timestamp
            });

            // If successful, you might want to trigger a refresh of game state
            return response.data;
        } catch (error) {
            console.error("Error showing cards:", error);
            throw error;
        } finally {
            setIsShowing(false);
        }
    };

    return {
        showCards,
        isShowing
    };
}
