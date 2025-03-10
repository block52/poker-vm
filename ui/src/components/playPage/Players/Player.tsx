import * as React from "react";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { usePlayerContext } from "../../../context/usePlayerContext";
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import { BigUnit } from "bigunit";
import useUserBySeat from "../../../hooks/useUserBySeat";
import { STORAGE_PUBLIC_KEY } from "../../../hooks/useUserWallet";

type PlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
    currentIndex: number;
    color?: string;
    status?: string;
};

const Player: React.FC<PlayerProps> = ({ left, top, index, color }) => {
    const [publicKey, setPublicKey] = React.useState<string>();
    const { seat } = usePlayerContext();
    
    
    React.useEffect(() => {
        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        if (!localKey) return setPublicKey(undefined);
        
        setPublicKey(localKey);
    }, []);
    
    const { data } = useUserBySeat(publicKey || "", seat);

    if(!data) {
        return <></>
    }

    // Add null check for holeCards
    const stackValue = data?.stack ? BigUnit.from(data.stack, 18).toNumber() : 0;
    const holeCards = data.holeCards || ['Back', 'Back']; // Default to back of cards if no hole cards

    return (
        <div
            key={index}
            className={`${
                data.status && data.status === PlayerStatus.FOLDED ? "opacity-60" : ""
            } absolute flex flex-col justify-center text-gray-600 w-[150px] h-[140px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
            style={{
                left: left,
                top: top,
                transition: "top 1s ease, left 1s ease"
            }}
        >
            <div className="flex justify-center gap-1">
                <img src={`/cards/${holeCards[0]}.svg`} width={60} height={80} />
                <img src={`/cards/${holeCards[1]}.svg`} width={60} height={80} />
                {/* <HandCard frontSrc={`/cards/1A.svg`} backSrc="/cards/Back.svg" flipped={flipped1} />
                <HandCard frontSrc={`/cards/1C.svg`} backSrc="/cards/Back.svg" flipped={flipped2} /> */}
            </div>
            <div className="relative flex flex-col justify-end mt-[-6px] mx-1s">
                <div
                    style={{ backgroundColor: color }}
                    className={`b-[0%] mt-[auto] w-full h-[55px]  shadow-[1px_2px_6px_2px_rgba(0,0,0,0.3)] rounded-tl-2xl rounded-tr-2xl rounded-bl-md rounded-br-md flex flex-col`}
                >
                    {/* <p className="text-white font-bold text-sm mt-auto mb-1.5 self-center">+100</p> */}
                    <ProgressBar index={index} />
                    {data.status && data.status === PlayerStatus.FOLDED && (
                        <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">FOLD</span>
                    )}
                    {data.status && data.status === PlayerStatus.ALL_IN && (
                        <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">All In</span>
                    )}
                </div>
                <div className="absolute top-[0%] w-full">
                    <Badge count={index + 1} value={stackValue} color={color} />
                </div>
            </div>
        </div>
    );
};

export default Player;
