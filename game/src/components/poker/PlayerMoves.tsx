import { useState } from 'react';
import { PlayerAction } from '@bitcoinbrisbane/block52';
import { ValidMove } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PlayerMoveProps {
  move: ValidMove;
  performAction: (action: PlayerAction, amount?: number) => void;
}

function PlayerMove({ move, performAction }: PlayerMoveProps) {
  const [raiseAmount, setRaiseAmount] = useState(move.minAmount);

  return (
    <div className="flex flex-col py-2">
      <div className="flex gap-4">
        <Button variant="secondary" onClick={() => performAction(move.action, raiseAmount)}>
          {move.action.toUpperCase()}
        </Button>
        {move.minAmount && move.maxAmount && <>
          <Input
            type="range"
            min={move.minAmount}
            max={move.maxAmount}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="flex-grow"
          />
          <Input
            type="number"
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="w-20"
          />
        </>}
      </div>
    </div>
  );
}

interface PlayerMovesProps {
  moves: ValidMove[];
  performAction: (action: PlayerAction, amount?: number) => void;
}

export default function PlayerMoves({ moves, ...remain }: PlayerMovesProps) {
  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {moves.map(m => <PlayerMove key={m.action} move={m} {...remain}></PlayerMove>)}
      </CardContent>
    </Card>
  );
}