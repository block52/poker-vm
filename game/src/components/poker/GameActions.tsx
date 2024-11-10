import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GameActionsProps {
  onCall?: () => void;
  onRaise?: (amount: number) => void;
  onCheck?: () => void;
  onFold?: () => void;
  minRaise?: number;
  maxRaise?: number;
}

export function GameActions({
  onCall,
  onRaise,
  onCheck,
  onFold,
  minRaise = 0,
  maxRaise = 100,
}: GameActionsProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <Button onClick={() => onCall?.()} variant="secondary">
          Call
        </Button>
        <Button onClick={() => onCheck?.()} variant="secondary">
          Check
        </Button>
        <Button onClick={() => onFold?.()} variant="secondary">
          Fold
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <Input
          type="range"
          min={minRaise}
          max={maxRaise}
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
        <Button variant="secondary" onClick={() => onRaise?.(raiseAmount)}>
          Raise
        </Button>
      </div>
    </div>
  );
} 