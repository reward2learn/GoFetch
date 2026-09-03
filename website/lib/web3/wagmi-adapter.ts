import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "wagmi";
import { sepolia, baseSepolia, mainnet, base } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

export const supportedChains = [sepolia, baseSepolia, mainnet, base] as const;

export const wagmiAdapter = new WagmiAdapter({
  networks: [sepolia, baseSepolia],
  projectId,
  transports: {
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
