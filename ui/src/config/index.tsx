import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { createConfig, http } from "wagmi";
import { metaMask } from "wagmi/connectors";

export const projectId = import.meta.env.VITE_PROJECT_ID || "";
if (!projectId) {
    throw new Error("Project ID is not defined");
}

export const metadata = {
    name: "AppKit",
    description: "Block52 AppKit",
    url: "https://app.block52.xyz/",
    icons: ["https://avatars.githubusercontent.com/u/179229932"]
};

export const networks = [mainnet] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
    projectId: projectId,
    networks,
    ssr: true
});

export const config = createConfig({
    chains: [mainnet],
    connectors: [metaMask()],
    transports: {
        [mainnet.id]: http()
    }
});
