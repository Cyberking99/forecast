import { http, createConfig } from 'wagmi';
import { baseSepolia, localhost } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { porto } from 'porto/wagmi';

export const config = createConfig({
  chains: [baseSepolia, localhost],
  connectors: [
    injected(),
    porto()
  ],
  transports: {
    [baseSepolia.id]: http(),
    [localhost.id]: http(),
  },
});

