import React, { createContext, useState, ReactNode, useEffect, useMemo, useRef } from "react";
import { Player, PlayerContextType, PlayerStatus } from "./types";
import axios from "axios";

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);
export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const isInitialized = useRef(false);

    const mock_result = {
        id: "f478bdf612c71fb7a897c7b280204fdedf9e7e0a8aa2257e9f5936a1d16e77bd",
        button: 1,
        playerCount: 9,
        players: [
            {
                id: "0x8bD248230bd946d4a3cd242b719D6A43a09ec5DC",
                seat: 1,
                stack: "197000000000000000000",
                bet: "1000000000000000000",
                hand: [],
                status: "active",
                action: "check"
            },
            {
                id: "0x3BCe51A82e5B03dD99028924A95fF7402ec57a7D",
                seat: 2,
                stack: "150000000000000000000",
                bet: "1000000000000000000",
                hand: [],
                status: "active",
                action: "check"
            },
            {
                id: "0xf79b08D9567521AA9AFA96dc1DD2926F232f46Ad",
                seat: 3,
                stack: "69000000000000000000",
                bet: "1000000000000000000",
                hand: [],
                status: "active",
                action: "check"
            },
            {
                id: "0x4697899fA658b9478A897b63b1b880711FE07fEb",
                seat: 4,
                stack: "81000000000000000000",
                bet: "1000000000000000000",
                hand: [],
                status: "active",
                action: "check"
            },
            {
                id: "0x1c29D4a10C3c3e92F21179AFb1b6a43fcff8308f",
                seat: 5,
                stack: "51000000000000000000",
                bet: "1000000000000000000",
                hand: [],
                status: "active",
                action: "check"
            },
            {
                id: "0x2c944e3af70b0E004DF938dC5344543bd2B020f8",
                seat: 6,
                stack: "88000000000000000000",
                bet: "1000000000000000000",
                hand: [],
                status: "active",
                action: "check"
            },
            {
                id: "0xa936AcF77a39f67562B70ac453ECA7f215e5A63c",
                seat: 7,
                stack: "88000000000000000000",
                bet: "1000000000000000000",
                hand: [],
                status: "active",
                action: "check"
            },
            {
                id: "0x93b744A0c68AD252D884648A80a72e67De3983Ee",
                seat: 8,
                stack: "55000000000000000000",
                bet: "1000000000000000000",
                hand: [],
                status: "active",
                action: "check"
            },
            {
                id: "0xF295e3B54D7D8D6afaA6199d937002A54BbB61F6",
                seat: 9,
                stack: "138000000000000000000",
                bet: "1000000000000000000",
                hand: [],
                status: "active",
                action: "check"
            }
        ],
        pots: ["50000000000000000000", "10000000000000000000"],
        sb: "500000000000000000",
        bb: "1000000000000000000",
        board: [],
        signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    const [players, setPlayers] = useState<Player[]>(mock_result.players.map((player, index) => ({
        id: player.id,
        index: index,
        stack: parseInt(player.stack),
        status: PlayerStatus.Idle,
        pot: parseInt(player.bet)
    })));

    // Array.from({ length: 9 }, (_, index) => ({
    //     id: `player-${index}`,
    //     index,
    //     stack: 200,
    //     status: PlayerStatus.Idle,
    //     pot: 0
    // }))

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

    const getTable = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/table`);
            setDealerIndex(response.data.button);

            const players = response.data.players.map((player: any, index: number) => ({
                id: player.id,
                index,
                stack: parseInt(player.stack),
                status: player.status,
                pot: parseInt(player.bet)
            }));

            setPlayers(players);

            console.log(response.data);
        } catch (err) {
            console.error(err);
        }
    };

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

    // TODO: THIS SHOULD BE NEW HAND
    const newGame = (dealer: number) => {
        console.log("GAME START", playerIndex);
        const updatedPlayers = players;
        const nextPlayerIndex = nextPlayer(dealer, 3);

        updatedPlayers[nextPlayer(dealer, 1)].pot = 2;
        updatedPlayers[nextPlayer(dealer, 2)].pot = 4;
        updatedPlayers[nextPlayer(dealer, 1)].stack = 198;
        updatedPlayers[nextPlayer(dealer, 2)].stack = 196;
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
            updatedPlayers[playerIndex].stack += allPot;
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
                    setOpenTwoMore(true);
                } else {
                    setOpenOneMore(true);
                }
            } else {
                setShowThreeCards(true);
            }
        }
        if (updatedPlayers[playerIndex].stack <= checkPot) {
            updatedPlayers[playerIndex].status = PlayerStatus.AllIn;
            updatedPlayers[playerIndex].pot += updatedPlayers[playerIndex].stack;
            updatedPlayers[playerIndex].stack = 0;
        } else {
            updatedPlayers[playerIndex].status = PlayerStatus.Idle;
            updatedPlayers[playerIndex].stack -= checkPot;
            updatedPlayers[playerIndex].pot = lastPot;
        }

        if (!players[nextPlayerIndex]) {
            console.error(`Player at index ${nextPlayerIndex} does not exist.`);
            let allPot = 0;
            players.map(player => {
                allPot += player.pot;
            });
            updatedPlayers[playerIndex].stack += allPot;
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

        if (lastPot >= players[playerIndex].pot + amount || players[playerIndex].stack < amount) {
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

        if (updatedPlayers[playerIndex].stack === amount) {
            updatedPlayers[playerIndex].status = PlayerStatus.AllIn;
            updatedPlayers[playerIndex].pot += updatedPlayers[playerIndex].stack;
            updatedPlayers[playerIndex].stack = 0;
        } else {
            updatedPlayers[playerIndex].status = PlayerStatus.Idle;
            updatedPlayers[playerIndex].stack -= amount;
            updatedPlayers[playerIndex].pot += amount;
        }

        setLastPot(updatedPlayers[playerIndex].pot);

        if (!players[nextPlayerIndex]) {
            console.error(`Player at index ${nextPlayerIndex} does not exist.`);
            let allPot = 0;
            players.map(player => {
                allPot += player.pot;
            });
            updatedPlayers[playerIndex].stack += allPot;
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
                } 
                if (randValue === 1) {
                    isSuccess = check();
                } else {
                    isSuccess = raise(Math.floor(Math.random() * 50 + 1));
                }
            } while (!isSuccess);
        }, Math.floor(Math.random() * 5 + 4) * 1000);
    }, [playerIndex]);

    useEffect(() => {
        if (!isInitialized.current) {
            // TODO: GET ID FROM QUERY PARAMS
            getTable();
            newGame(0);
            isInitialized.current = true;
        }
    }, []);

    const setPlayerAction = (action: "fold" | "check" | "raise", amount?: number) => {
        if (action === "fold") {
            fold();
        }
        if (action === "check") {
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
