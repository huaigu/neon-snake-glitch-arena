import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { defineChain } from 'viem';

// 定义Monad testnet链
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

// 临时的项目ID - 请在 https://cloud.walletconnect.com 获取您自己的项目ID
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'c5b87b96e3b4b0e5ff1b4a3c2d9e8f7a';

export const config = getDefaultConfig({
  appName: 'Neon Snake Arena',
  projectId,
  chains: [monadTestnet, mainnet, polygon, optimism, arbitrum, base],
  ssr: false, // 这是一个客户端应用
}); 