import { createContext, useState, ReactNode, useEffect, useMemo, useRef } from "react";
import * as React from "react";
import { Player, PlayerContextType } from "./types";
import { PlayerStatus, PlayerActionType, NodeRpcClient } from "@bitcoinbrisbane/block52";
import { useParams } from "react-router-dom";
import userUserLastAction from "../hooks/useUserLastAction";
import axios from "axios";
import useUserWallet from "../hooks/useUserWallet";
import { STORAGE_PUBLIC_KEY } from "../hooks/useUserWallet";

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [publicKey, setPublicKey] = React.useState<string>();
    const { b52 } = useUserWallet();
    const isInitialized = useRef(false);
    const [players, setPlayers] = useState<Player[]>(
        Array.from({ length: 9 }, (_, index) => ({
            index,
            address: "0xa2F508c94a22D067Cbc001f493bfAD39555eA188",
            status: PlayerStatus.NOT_ACTED,
            seat: index,
            holeCards: ["3A", "5B"],
            lastAction: {
                action: PlayerStatus.NOT_ACTED,
                amount: 0
            },
            actions: [PlayerActionType.CHECK, PlayerActionType.BET, PlayerActionType.FOLD],
            action: PlayerStatus.NOT_ACTED,
            timeout: 30,
            signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
        }))
    );
    const [lastPot, setLastPot] = useState<number>(0);
    const [openOneMore, setOpenOneMore] = useState<boolean>(false);
    const [openTwoMore, setOpenTwoMore] = useState<boolean>(false);
    const [showThreeCards, setShowThreeCards] = useState<boolean>(false);
    const [tableSize] = useState<number>(9);
    const [playerIndex, setPlayerIndex] = useState<number>(-1);
    const [dealerIndex, setDealerIndex] = useState<number>(0);
    const [nonce, setNonce] = useState<number>(0);
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
    const [seat, setSeat] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    React.useEffect(() => {
        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, []);

    const fetchNonce = async () => {
        if (!publicKey) return;

        setIsLoading(true);
        setError(null);

        try {
            const url = process.env.REACT_APP_PROXY_URL || "https://proxy.block52.xyz";
            const response = await axios.get(`${url}/account/${publicKey}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setNonce(response.data.nonce);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNonce();
    }, [publicKey]);

    const fetchType = async (player: number, address: string) => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const url = process.env.REACT_APP_PROXY_URL || "https://proxy.block52.xyz";
            const response = await axios.get(`${url}/table/${address}/player/${player}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let updatedPlayers = players;
            updatedPlayers[player] = response.data;
            setPlayers([...updatedPlayers]);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setIsLoading(false);
        }
    };

    // useEffect(() => {
    //     fetchType();
    // }, [address, player]);

    // Function to update player details
    // const updatePlayer = (index: number, updatedPlayer: Player) => {
    //     setPlayers(prev => prev.map(player => (player.index === index ? updatedPlayer : player)));
    // };

    // const nextPlayer = (turn: number, amount: number) => {
    //     console.log(`NEXT`, turn, amount, players);
    //     const allIdle = players.every(player => player.status !== PlayerStatus.NOT_ACTED);
    //     if (allIdle) {
    //         console.warn("All players are not idle. Resetting players.");
    //         return -1;
    //     }
    //     let player = turn;
    //     let attempts = 0; // Safeguard against infinite loops
    //     while (amount && attempts < tableSize) {
    //         player = (player + 1) % tableSize;
    //         if (players[player].status === PlayerStatus.NOT_ACTED) {
    //             amount--;
    //         }
    //         attempts++;
    //     }

    //     return player;
    // };

    // const newGame = (dealer: number) => {
    //     console.log("GAME START", playerIndex);
    //     let updatedPlayers = players;
    //     const nextPlayerIndex = nextPlayer(dealer, 3);

    //     updatedPlayers[nextPlayer(dealer, 1)].pot = 2;
    //     updatedPlayers[nextPlayer(dealer, 2)].pot = 4;
    //     updatedPlayers[nextPlayer(dealer, 1)].balance = 198;
    //     updatedPlayers[nextPlayer(dealer, 2)].balance = 196;
    //     updatedPlayers[nextPlayerIndex].status = PlayerStatus.ACTIVE;
    //     setLastPot(4);
    //     setDealerIndex(dealer);
    //     setPlayers([...updatedPlayers]);
    //     setPlayerIndex(nextPlayerIndex);
    // };

    const amount = 10;

    const performAction = React.useCallback(
        function (gameAddress: string, action: PlayerActionType, amount?: number, nonce?: number) {
            b52?.playerAction(gameAddress, action, amount?.toString() ?? "", nonce);
        },
        [b52]
    );

    const fold = () => {
        if (publicKey) {
            performAction(publicKey, PlayerActionType.FOLD, amount, nonce);
        }
    };

    const check = () => {
        if (publicKey) {
            performAction(publicKey, PlayerActionType.CHECK, amount, nonce)
        }
    }

    // const check = () => {
    //     console.log("check", playerIndex, players, lastPot);
    //     if (timer) {
    //         clearTimeout(timer);
    //         setTimer(null);
    //     }

    //     let updatedPlayers = players;
    //     const nextPlayerIndex = nextPlayer(playerIndex, 1);
    //     const checkPot = lastPot - updatedPlayers[playerIndex].pot;
    //     console.log(`POT, LASTPOT`, updatedPlayers[playerIndex].pot, lastPot);
    //     if (updatedPlayers[playerIndex].pot == lastPot) {
    //         if (showThreeCards) {
    //             if (openOneMore) {
    //                 setOpenTwoMore(true);
    //             } else {
    //                 setOpenOneMore(true);
    //             }
    //         } else {
    //             setShowThreeCards(true);
    //         }
    //     }
    //     if (updatedPlayers[playerIndex].balance <= checkPot) {
    //         updatedPlayers[playerIndex].status = PlayerActionType.ALL_IN;
    //         updatedPlayers[playerIndex].pot += updatedPlayers[playerIndex].balance;
    //         updatedPlayers[playerIndex].balance = 0;
    //     } else {
    //         updatedPlayers[playerIndex].status = PlayerStatus.NOT_ACTED;
    //         updatedPlayers[playerIndex].balance -= checkPot;
    //         updatedPlayers[playerIndex].pot = lastPot;
    //     }

    //     if (!players[nextPlayerIndex]) {
    //         console.error(`Player at index ${nextPlayerIndex} does not exist.`);
    //         let allPot = 0;
    //         players.map(player => {
    //             allPot += player.pot;
    //         });
    //         updatedPlayers[playerIndex].balance += allPot;
    //         players.map((player, index) => {
    //             if (index !== playerIndex) {
    //                 updatedPlayers[playerIndex].status = PlayerStatus.NOT_ACTED;
    //             }
    //             updatedPlayers[playerIndex].pot = 0;
    //         });
    //         return true;
    //     }
    //     updatedPlayers[nextPlayerIndex].status = PlayerStatus.ACTIVE;
    //     setPlayers([...updatedPlayers]);
    //     setPlayerIndex(nextPlayerIndex);

    //     return true;
    // };

    // const raise = (amount: number) => {
    //     if (playerIndex < 0 || playerIndex >= players.length || !players[playerIndex]) {
    //         console.error("Invalid playerIndex:", playerIndex);
    //         return false;
    //     }

    //     if (lastPot >= players[playerIndex].pot + amount || players[playerIndex].balance < amount) {
    //         console.error("Invalid amount to raise.");
    //         return false;
    //     }

    //     if (timer) {
    //         console.log("Clearing timer...");
    //         clearTimeout(timer);
    //         setTimer(null);
    //     }

    //     const nextPlayerIndex = nextPlayer(playerIndex, 1);

    //     let updatedPlayers = players;

    //     if (updatedPlayers[playerIndex].balance === amount) {
    //         updatedPlayers[playerIndex].status = PlayerActionType.ALL_IN;
    //         updatedPlayers[playerIndex].pot += updatedPlayers[playerIndex].balance;
    //         updatedPlayers[playerIndex].balance = 0;
    //     } else {
    //         updatedPlayers[playerIndex].status = PlayerStatus.NOT_ACTED;
    //         updatedPlayers[playerIndex].balance -= amount;
    //         updatedPlayers[playerIndex].pot += amount;
    //     }

    //     setLastPot(updatedPlayers[playerIndex].pot);

    //     if (!players[nextPlayerIndex]) {
    //         console.error(`Player at index ${nextPlayerIndex} does not exist.`);
    //         let allPot = 0;
    //         players.map(player => {
    //             allPot += player.pot;
    //         });
    //         updatedPlayers[playerIndex].balance += allPot;
    //         players.map((player, index) => {
    //             if (index !== playerIndex) {
    //                 updatedPlayers[playerIndex].status = PlayerStatus.NOT_ACTED;
    //             }
    //             updatedPlayers[playerIndex].pot = 0;
    //         });
    //         return true;
    //     }
    //     updatedPlayers[nextPlayerIndex].status = PlayerStatus.ACTIVE;
    //     setPlayers([...updatedPlayers]);
    //     setPlayerIndex(nextPlayerIndex);
    //     return true;
    // };

    // useEffect(() => {
    //     if (playerIndex < 0) return;
    //     console.log("useEffect", playerIndex);
    //     if (playerIndex === 0) {
    //         console.log("It's your turn.");

    //         // Clear any existing timer to avoid overlap

    //         if (timer) {
    //             clearTimeout(timer);
    //             setTimer(null);
    //         }

    //         // Start a 30-second timer for the current player
    //         const newTimer = setTimeout(() => {
    //             fold();
    //         }, 30000); // 30 seconds
    //         setTimer(newTimer);
    //         return;
    //     }

    //     setTimeout(() => {
    //         let isSuccess = false;
    //         do {
    //             const randValue = Math.floor(Math.random() * 3);
    //             if (randValue === 0) {
    //                 isSuccess = fold();
    //             } else if (randValue === 1) {
    //                 isSuccess = check();
    //             } else {
    //                 isSuccess = raise(Math.floor(Math.random() * 50 + 1));
    //             }
    //         } while (!isSuccess);
    //     }, Math.floor(Math.random() * 5 + 4) * 1000);
    // }, [playerIndex]);

    // useEffect(() => {
    //     if (!isInitialized.current) {
    //         newGame(0);
    //         isInitialized.current = true;
    //     }
    // }, []);

    // const setPlayerAction = (action: "fold" | "check" | "raise", amount?: number) => {
    //     if (action === "fold") {
    //         fold();
    //     } else if (action === "check") {
    //         check();
    //     } else if (action === "raise" && amount !== undefined) {
    //         raise(amount);
    //     }
    // };

    const contextValue = useMemo(
        () => ({
            players,
            lastPot,
            tableSize,
            playerIndex,
            dealerIndex,
            openOneMore,
            openTwoMore,
            showThreeCards,
            setPlayerAction: () => {}
        }),
        // [players, tableSize, playerIndex, dealerIndex, openOneMore, openTwoMore, showThreeCards, lastPot, fold, raise, check, setPlayerAction]
        [players, tableSize, playerIndex, dealerIndex, openOneMore, openTwoMore, showThreeCards, lastPot]
    );

    return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>;
};
