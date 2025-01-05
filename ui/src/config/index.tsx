import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { etherlink } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { createConfig, http } from 'wagmi';
import { metaMask } from 'wagmi/connectors';

export const projectId = import.meta.env.VITE_PROJECT_ID || "";
if (!projectId) {
  throw new Error('Project ID is not defined');
}

export const metadata = {
  name: 'AppKit',
  description: 'AppKit Example',
  url: 'https://app.block52.xyz/',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

export const networks = [etherlink] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  projectId: projectId,
  networks,
  ssr: true,
});

export const config = createConfig({
  chains: [etherlink],
  connectors: [metaMask()],
  transports: {
    [etherlink.id]: http(),
  },
});
