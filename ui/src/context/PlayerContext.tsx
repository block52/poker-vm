import React, { createContext, useState, ReactNode, useEffect, useMemo, useRef } from "react";
import { Player, PlayerContextType, PlayerStatus } from "./types";
export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const isInitialized = useRef(false);
    const [players, setPlayers] = useState<Player[]>(
        Array.from({ length: 9 }, (_, index) => ({
            index,
            balance: 200,
            status: PlayerStatus.Idle,
            pot: 0
        }))
    );
    const [lastPot, setLastPot] = useState<number>(0);
    const [openOneMore, setOpenOneMore] = useState<boolean>(false);
    const [openTwoMore, setOpenTwoMore] = useState<boolean>(false);
    const [showThreeCards, setShowThreeCards] = useState<boolean>(false);
    const [tableSize] = useState<number>(9);
    const [playerIndex, setPlayerIndex] = useState<number>(-1);
    const [dealerIndex, setDealerIndex] = useState<number>(0);
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    // Function to update player details
    // const updatePlayer = (index: number, updatedPlayer: Player) => {
    //     setPlayers(prev => prev.map(player => (player.index === index ? updatedPlayer : player)));
    // };

    const nextPlayer = (turn: number, amount: number) => {
        console.log(`NEXT`, turn, amount, players);
        const allIdle = players.every(player => player.status !== PlayerStatus.Idle);

        if (allIdle) {
            console.warn("All players are not idle. Resetting players.");
            return -1;
        }
        let player = turn;
        let attempts = 0; // Safeguard against infinite loops
        while (amount && attempts < tableSize) {
            player = (player + 1) % tableSize;
            if (players[player].status === PlayerStatus.Idle) {
                amount--;
            }
            attempts++;
        }

        return player;
    };

    const newGame = (dealer: number) => {
        console.log("GAME START", playerIndex);
        let updatedPlayers = players;
        const nextPlayerIndex = nextPlayer(dealer, 3);

        updatedPlayers[nextPlayer(dealer, 1)].pot = 2;
        updatedPlayers[nextPlayer(dealer, 2)].pot = 4;
        updatedPlayers[nextPlayer(dealer, 1)].balance = 198;
        updatedPlayers[nextPlayer(dealer, 2)].balance = 196;
        updatedPlayers[nextPlayerIndex].status = PlayerStatus.Turn;
        setLastPot(4);
        setDealerIndex(dealer);
        setPlayers([...updatedPlayers]);
        setPlayerIndex(nextPlayerIndex);
    };

    const fold = () => {
        console.log("fold", playerIndex, players);
        if (timer) {
            clearTimeout(timer);
            setTimer(null);
        }

        let updatedPlayers = players;
        const nextPlayerIndex = nextPlayer(playerIndex, 1);
        updatedPlayers[playerIndex].status = PlayerStatus.Fold; //PlayerActions.Fold; //PlayerStatus.Fold;
        if (!players[nextPlayerIndex]) {
            console.error(`Player at index ${nextPlayerIndex} does not exist.`);
            let allPot = 0;
            players.map(player => {
                allPot += player.pot;
            });
            updatedPlayers[playerIndex].balance += allPot;
            players.map((player, index) => {
                // Hack to fix compiler error
                console.log(`INDEX`, index, player);

                if (index !== playerIndex) {
                    updatedPlayers[playerIndex].status = PlayerStatus.Idle;
                }
                updatedPlayers[playerIndex].pot = 0;
            });
            return true;
        }
        updatedPlayers[nextPlayerIndex].status = PlayerStatus.Turn;
        setPlayers([...updatedPlayers]);
        setPlayerIndex(nextPlayerIndex);

        return true;
    };

    const check = () => {
        console.log("check", playerIndex, players, lastPot);
        if (timer) {
            clearTimeout(timer);
            setTimer(null);
        }

        let updatedPlayers = players;
        const nextPlayerIndex = nextPlayer(playerIndex, 1);
        const checkPot = lastPot - updatedPlayers[playerIndex].pot;
        console.log(`POT, LASTPOT`, updatedPlayers[playerIndex].pot, lastPot);
        if (updatedPlayers[playerIndex].pot === lastPot) {

            if (showThreeCards) {
                if (openOneMore) {
                    setOpenTwoMore(true)
                } else {
                    setOpenOneMore(true);
                }
            } else {
                setShowThreeCards(true)
            }

        }
        if (updatedPlayers[playerIndex].balance <= checkPot) {
            updatedPlayers[playerIndex].status = PlayerStatus.AllIn;
            updatedPlayers[playerIndex].pot += updatedPlayers[playerIndex].balance;
            updatedPlayers[playerIndex].balance = 0;
        } else {
            updatedPlayers[playerIndex].status = PlayerStatus.Idle;
            updatedPlayers[playerIndex].balance -= checkPot;
            updatedPlayers[playerIndex].pot = lastPot;
        }

        if (!players[nextPlayerIndex]) {
            console.error(`Player at index ${nextPlayerIndex} does not exist.`);
            let allPot = 0;
            players.map(player => {
                allPot += player.pot;
            });
            updatedPlayers[playerIndex].balance += allPot;
            players.map((player, index) => {
                // Hack to fix compiler error
                console.log(`INDEX`, index, player);
                if (index !== playerIndex) {
                    updatedPlayers[playerIndex].status = PlayerStatus.Idle;
                }
                updatedPlayers[playerIndex].pot = 0;
            });
            return true;
        }
        updatedPlayers[nextPlayerIndex].status = PlayerStatus.Turn;
        setPlayers([...updatedPlayers]);
        setPlayerIndex(nextPlayerIndex);

        return true;
    };

    const raise = (amount: number) => {
        if (playerIndex < 0 || playerIndex >= players.length || !players[playerIndex]) {
            console.error("Invalid playerIndex:", playerIndex);
            return false;
        }

        if (lastPot >= players[playerIndex].pot + amount || players[playerIndex].balance < amount) {
            console.error("Invalid amount to raise.");
            return false;
        }

        if (timer) {
            console.log("Clearing timer...");
            clearTimeout(timer);
            setTimer(null);
        }

        const nextPlayerIndex = nextPlayer(playerIndex, 1);
        let updatedPlayers = players;

        if (updatedPlayers[playerIndex].balance === amount) {
            updatedPlayers[playerIndex].status = PlayerStatus.AllIn;
            updatedPlayers[playerIndex].pot += updatedPlayers[playerIndex].balance;
            updatedPlayers[playerIndex].balance = 0;
        } else {
            updatedPlayers[playerIndex].status = PlayerStatus.Idle;
            updatedPlayers[playerIndex].balance -= amount;
            updatedPlayers[playerIndex].pot += amount;
        }

        setLastPot(updatedPlayers[playerIndex].pot);

        if (!players[nextPlayerIndex]) {
            console.error(`Player at index ${nextPlayerIndex} does not exist.`);
            let allPot = 0;
            players.map(player => {
                allPot += player.pot;
            });
            updatedPlayers[playerIndex].balance += allPot;
            players.map((player, index) => {
                // Hack to fix compiler error
                console.log(`INDEX`, index, player);

                if (index !== playerIndex) {
                    updatedPlayers[playerIndex].status = PlayerStatus.Idle;
                }
                updatedPlayers[playerIndex].pot = 0;
            });
            return true;
        }
        updatedPlayers[nextPlayerIndex].status = PlayerStatus.Turn;
        setPlayers([...updatedPlayers]);
        setPlayerIndex(nextPlayerIndex);
        return true;
    };

    useEffect(() => {
        if (playerIndex < 0) return;
        console.log("useEffect", playerIndex);
        if (playerIndex === 0) {
            console.log("It's your turn.");

            // Clear any existing timer to avoid overlap

            if (timer) {
                clearTimeout(timer);
                setTimer(null);
            }

            // Start a 30-second timer for the current player
            const newTimer = setTimeout(() => {
                fold();
            }, 30000); // 30 seconds
            setTimer(newTimer);
            return;
        }

        setTimeout(() => {
            let isSuccess = false;
            do {
                const randValue = Math.floor(Math.random() * 3);
                if (randValue === 0) {
                    isSuccess = fold();
                } else if (randValue === 1) {
                    isSuccess = check();
                } else {
                    isSuccess = raise(Math.floor(Math.random() * 50 + 1));
                }
            } while (!isSuccess);
        }, Math.floor(Math.random() * 5 + 4) * 1000);
    }, [playerIndex]);

    useEffect(() => {
        if (!isInitialized.current) {
            newGame(0);
            isInitialized.current = true;
        }
    }, []);

    const setPlayerAction = (action: "fold" | "check" | "raise", amount?: number) => {
        if (action === "fold") {
            fold();
        } else if (action === "check") {
            check();
        } else if (action === "raise" && amount !== undefined) {
            raise(amount);
        }
    };

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
            setPlayerAction
        }),
        [players, tableSize, playerIndex, dealerIndex, openOneMore, openTwoMore, showThreeCards, lastPot, fold, raise, check, setPlayerAction]
    );

    return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>;
};
