import React, { useEffect, useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import { TransferButton } from "./TransferButton";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import './wallet.css';

export const Wallet: React.FC = () => {
    const appWallet = useWallet();
    const [b52Balance, setB52Balance] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const refreshBalance = async () => {
        if (appWallet.b52 && appWallet.address) {
            const account = await appWallet.b52.getAccount(appWallet.address);
            setB52Balance(Number(account.balance));
        }
    };

    useEffect(() => {
        refreshBalance();

        const intervalId = setInterval(refreshBalance, 30000);

        return () => clearInterval(intervalId);
    }, [appWallet.b52, appWallet.address]);

    if (!appWallet.ethereum || !appWallet.b52) {
        return <div className="wallet-box">Loading wallet...</div>;
    }

    return (
        <div className="wallet-box">
            <h2>Wallet</h2>
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
                <div className="flex items-center justify-between space-x-4">
                    <div>
                        <p><strong>Address:</strong> {appWallet.ethereum.address}</p>
                        <p><strong>B52 Balance:</strong> ${b52Balance} USD</p>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <CaretSortIcon className="h-4 w-4" />
                            <span className="sr-only">Toggle</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="space-y-2">
                    <TransferButton onTransferComplete={refreshBalance} />
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};
