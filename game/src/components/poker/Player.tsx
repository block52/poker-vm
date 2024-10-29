import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PlayerAction } from "@/types/game";

interface PlayerProps {
  address: string;
  chips: number;
  lastAction?: PlayerAction; // Optional since player may not have acted yet
}

const PlayerWidget: React.FC<PlayerProps> = ({ address, chips, lastAction }) => {
  // Format address to show first 6 and last 4 characters
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player</CardTitle>
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
