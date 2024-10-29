import PlayerWidget from "./Player";


import { Player } from "@/types/game";

interface PlayerListProps {
  players: Player[];
}

const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {players.map((player) => (
        <PlayerWidget
          key={player.address}
          address={player.address}
          chips={player.chips}
          lastAction={player.lastAction}
        />
      ))}
    </div>
  );
};

export default PlayerList;
