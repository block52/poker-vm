import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Move, Seat } from "@/types/game";

interface PlayerProps {
    address: string;
    chips: number;
    seat: Seat;
    isActive: boolean;
    isEliminated: boolean;
    isUser: boolean;
    isTurn: boolean;
    lastMove?: Move; // Optional since player may not have acted yet
}

const PlayerWidget: React.FC<PlayerProps> = ({ address, chips, seat, isActive, isEliminated, isUser, isTurn, lastMove }) => {
    // Format address to show first 6 and last 4 characters
    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const color = isTurn ? "bg-green-100" : isActive ? "bg-white" : isEliminated ? "bg-red-100" : "bg-gray-200";
    const borderColor = isTurn ? "border-black border-2" : "border-gray-400";

    return (
        <Card className={`${color} ${borderColor}`}>
            <CardHeader>
                <CardTitle>{`${isUser ? "You" : "Player"}`}</CardTitle>
                <CardDescription>{seat}</CardDescription>
                <CardDescription>{formatAddress(address)}</CardDescription>
                <CardDescription>{chips} chips</CardDescription>
            </CardHeader>
            <CardFooter>
                {isEliminated ? "ELIMINATED" : lastMove && <p>Last: {lastMove.action.toUpperCase()} {lastMove.amount ? "$" : ""}{lastMove.amount}</p>}
            </CardFooter>
        </Card>
    );
};

export default PlayerWidget;
