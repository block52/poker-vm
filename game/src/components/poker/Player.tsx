import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { PlayerAction, Seat } from "@/types/game";

interface PlayerProps {
  address: string;
  chips: number;
  seat: Seat;
  isActive: boolean;
  isUser: boolean;
  isTurn: boolean;
  lastAction?: PlayerAction; // Optional since player may not have acted yet
}

const PlayerWidget: React.FC<PlayerProps> = ({ address, chips, seat, isActive, isUser, isTurn, lastAction }) => {
  // Format address to show first 6 and last 4 characters
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const color = isActive ? "bg-white" : "bg-gray-200";
  const borderColor = isTurn ? "border-black border-2" : "border-gray-400";

  return (
    <Card className={`${color} ${borderColor}`}>
      <CardHeader>
        <CardTitle>{isUser ? "You" : `Player ${seat}`}</CardTitle>
        <CardTitle>{formatAddress(address)}</CardTitle>
        <CardDescription>{chips} chips</CardDescription>
      </CardHeader>
      <CardFooter>
        {lastAction && <p>Last Action: {lastAction.action} {lastAction.amount}</p>}
      </CardFooter>
    </Card>
  );
};

export default PlayerWidget;
