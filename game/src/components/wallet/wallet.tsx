import React, { useEffect, useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import { TransferButton } from "./TransferButton";
import { Button } from "@/components/ui/button";
import "./wallet.css";

export const Wallet: React.FC = () => {
    const appWallet = useWallet();
    const [b52Balance, setB52Balance] = useState(0);

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

            <div className="flex items-center justify-between space-x-4">
                <div>
                    <p>
                        <strong>Address:</strong> {appWallet.ethereum.address}
                    </p>
                    <p>
                        <strong>B52 Balance:</strong> ${b52Balance} USD
                    </p>
                </div>

                <Button variant="ghost" size="sm">
                    <span className="sr-only">Toggle</span>
                </Button>
            </div>

            <TransferButton onTransferComplete={refreshBalance} />
        </div>
    );
};
