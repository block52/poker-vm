import PlayerWidget from "./Player";


import { Player } from "@/types/game";

interface PlayerListProps {
  players: Player[];
  you: Player;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, you }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {players.map((player) => (
        <PlayerWidget
          isActive={player.isActive}
          isEliminated={player.isEliminated}
          seat={player.seat}
          isUser={you === player}
          isTurn={player.isTurn}
          key={player.address}
          address={player.address}
          chips={player.chips}
          lastMove={player.lastMove}
        />
      ))}
    </div>
  );
};

export default PlayerList;
