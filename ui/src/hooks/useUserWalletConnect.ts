import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";

interface UseUsreWalletConnectResult {
    open: () => void;
    disconnect: () => void;
    isConnected: boolean;
    address: string | undefined;
}

const useUserWalletConnect = (): UseUsreWalletConnectResult => {
    const { open } = useAppKit()
    const { disconnect } = useDisconnect()
    const { address, isConnected } = useAppKitAccount()

    return {
        open,
        disconnect,
        isConnected,
        address,
    };
};

export default useUserWalletConnect;
