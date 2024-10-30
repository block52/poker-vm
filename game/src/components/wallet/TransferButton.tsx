import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";

interface TransferButtonProps {
  onTransferComplete: () => Promise<void>;
}

export const TransferButton: React.FC<TransferButtonProps> = ({ onTransferComplete }) => {
  const { b52, address } = useWallet();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    if (!b52 || !address || !toAddress || !amount) {
      console.error("Missing required fields");
      return;
    }

    setIsLoading(true);
    try {
      b52.transfer(address, toAddress, amount.toString()).then((result) => {
        console.log(result);
        setIsLoading(false);
        setToAddress("");
        setAmount("");
        onTransferComplete();
      }).catch((error) => {
        console.error("Transfer failed:", error);
        setIsLoading(false);
      });

      // Clear fields after successful transfer
      setToAddress("");
      setAmount("");
      console.log("Transfer successful");
    } catch (error) {
      console.error("Transfer failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <Input
        type="text"
        placeholder="Recipient Address (0x...)"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
      />
      <Input
        type="number"
        placeholder="Amount (USD)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0"
        step="0.01"
      />
      <Button 
        onClick={handleTransfer}
        disabled={!b52 || !toAddress || !amount || isLoading}
        variant="default"
      >
        {isLoading ? "Transferring..." : "Transfer"}
      </Button>
    </div>
  );
} 