import { createContext, useState, ReactNode, useEffect, useMemo, useRef } from "react";
import * as React from "react";
import { PlayerContextType } from "./types";
import { PlayerStatus, PlayerActionType, PlayerDTO } from "@bitcoinbrisbane/block52";
import axios from "axios";
import useUserWallet from "../hooks/useUserWallet";
import { STORAGE_PUBLIC_KEY } from "../hooks/useUserWallet";
import { toDollarFromString } from "../utils/numberUtils";
import { PROXY_URL } from '../App';

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [publicKey, setPublicKey] = React.useState<string>();
    const { b52 } = useUserWallet();
    const isInitialized = useRef(false);
    const [players, setPlayers] = useState<PlayerDTO[]>(
        Array.from({ length: 9 }, (_, index) => ({
            address: "0xa2F508c94a22D067Cbc001f493bfAD39555eA188",
            seat: index,
            stack: "",
            isSmallBlind: false,
            isBigBlind: false,
            isDealer: false,
            holeCards: undefined,
            status: PlayerStatus.NOT_ACTED,
            lastAction: undefined,
            actions: [],
            timeout: 30,
            signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
        }))
    );
    const [lastPot, setLastPot] = useState<number>(0);
    const [seat, seSeat] = useState<number>(0); // PlayerMockSeat
    const [openOneMore, setOpenOneMore] = useState<boolean>(false);
    const [openTwoMore, setOpenTwoMore] = useState<boolean>(false);
    const [showThreeCards, setShowThreeCards] = useState<boolean>(false);
    const [tableSize] = useState<number>(9);
    const [playerIndex, setPlayerIndex] = useState<number>(-1);
    const [dealerIndex, setDealerIndex] = useState<number>(0);
    const [nonce, setNonce] = useState<number>(1);
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
    const [pots, setPots] = useState<string[]>([]);
    const [nextToAct, setNextToAct] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [totalPot, setTotalPot] = useState<number>(0);
    const [gamePlayers, setGamePlayers] = useState<any>();
    const [smallBlind, setSmallBlind] = useState<string>("0");
    const [communityCards, setCommunityCards] = useState<string[]>([]);
    const [bigBlind, setBigBlind] = useState<string>("0");
    const [tableType, setTableType] = useState<string>("");
    const [roundType, setRoundType] = useState<string>("");
    const [playerSeats, setPlayerSeats] = useState<number[]>([]);

    
    const getPlayerSeats = (players: any) => {
        return players.map((player: { seat: number }) => player.seat);
    };

    React.useEffect(() => {
        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, []);

    const fetchData = async () => {
        if (!publicKey) return;

        setIsLoading(true);
        setError(null);

        try {
            const mock_url = "https://orca-app-k9l4d.ondigitalocean.app"
            const url = process.env.REACT_APP_PROXY_URL || "https://proxy.block52.xyz";
            const response = await axios.get(`${mock_url}/table/${publicKey}`);

            // const response = await axios.get(`${PROXY_URL}/table/${publicKey}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setPots(response.data.pots);
            setGamePlayers(response.data.players)
            setNextToAct(response.data.nextToAct);
            setSmallBlind(toDollarFromString(response.data.smallBlind));
            setBigBlind(toDollarFromString(response.data.bigBlind));
            setTableType(response.data.type);
            setRoundType(response.data.round);
            setCommunityCards(response.data.communityCards)
            setPlayerSeats(getPlayerSeats(response.data.players));
            let tmpTotalPot = 0; // Initialize tmpTotalPot with a value

            if (response.data.pots.length > 0) {
                response.data.pots.forEach((pot: any) => {
                    tmpTotalPot += +toDollarFromString(pot); // Accumulate the total
                });
            }

            setTotalPot(tmpTotalPot);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setIsLoading(false);
        }
    };

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
        fetchData();
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

    const performAction = React.useCallback(
        function (gameAddress: string, action: PlayerActionType, amount?: number, nonce?: number) {
            b52?.playerAction(gameAddress, action, amount?.toString() ?? "", nonce);
        },
        [b52]
    );

    const fold = () => {
        if (publicKey) {
            performAction(publicKey, PlayerActionType.FOLD, nonce);
        }
    };

    const check = () => {
        if (publicKey) {
            performAction(publicKey, PlayerActionType.CHECK, nonce);
        }
    };

    const call = () => {
        if (publicKey) {
            performAction(publicKey, PlayerActionType.CALL, nonce);
        }
    };

    const raise = (amount: number) => {
        if (publicKey) {
            performAction(publicKey, PlayerActionType.RAISE, amount, nonce);
        }
    };

    const bet = (amount: number) => {
        if (publicKey) {
            performAction(publicKey, PlayerActionType.BET, amount, nonce);
        }
    };

    const setPlayerAction = (action: PlayerActionType, amount?: number) => {
        if (action === PlayerActionType.FOLD) {
            fold();
        } else if (action === PlayerActionType.CHECK) {
            check();
        } else if (action === PlayerActionType.RAISE && amount !== undefined) {
            raise(amount);
        } else if (action === PlayerActionType.BET && amount !== undefined) {
            bet(amount);
        } else if (action === PlayerActionType.CALL) {
            call();
        }
    };

    const contextValue = useMemo(
        () => ({
            players,
            pots,
            seat,
            lastPot,
            totalPot,
            tableSize,
            nextToAct,
            playerSeats,
            smallBlind,
            tableType,
            roundType,
            bigBlind,
            communityCards,
            gamePlayers,
            playerIndex,
            dealerIndex,
            openOneMore,
            openTwoMore,
            showThreeCards,
            setPlayerAction: () => {}
        }),
        // [players, tableSize, playerIndex, dealerIndex, openOneMore, openTwoMore, showThreeCards, lastPot, fold, raise, check, setPlayerAction]
        [players, communityCards, pots, seat, playerSeats, tableType, roundType, smallBlind, bigBlind, totalPot, nextToAct, tableSize, playerIndex, gamePlayers, dealerIndex, openOneMore, openTwoMore, showThreeCards, lastPot, setPlayerAction]
    );

    return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>;
};
