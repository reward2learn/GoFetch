import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

export const wagmiAdapter = new WagmiAdapter({
  networks: [baseSepolia],
  projectId,
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
