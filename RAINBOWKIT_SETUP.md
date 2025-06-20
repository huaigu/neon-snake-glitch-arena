# RainbowKit集成文档

本项目已成功集成RainbowKit来替换原有的window.metamask连接方式，并支持Monad testnet。

## 🎯 主要变更

### 1. 添加RainbowKit配置
- 创建了 `src/lib/rainbowkit-config.ts` 配置文件
- 添加了Monad testnet链配置：
  - Chain ID: 10143
  - RPC: https://testnet-rpc.monad.xyz
  - Explorer: https://testnet.monadexplorer.com/
  - Symbol: MON

### 2. 更新应用架构
- 在 `App.tsx` 中集成了 `WagmiProvider` 和 `RainbowKitProvider`
- 配置了深色主题，匹配项目的赛博朋克风格
- 设置了青色 (`#00ffff`) 作为主色调

### 3. 重构钱包连接
- 更新 `Web3AuthContext.tsx` 使用wagmi hooks替代window.ethereum
- 集成了 `useAccount`, `useConnect`, `useDisconnect`, `useSignMessage`
- 保持了原有的用户认证流程和游客模式

### 4. 更新连接按钮
- 更新 `Web3AuthButton.tsx` 使用RainbowKit的 `ConnectButton.Custom`
- 更新 `Web3AuthPage.tsx` 页面完全集成RainbowKit连接体验
- 提供了更好的用户体验和错误处理
- 支持网络切换提示和连接状态显示

## 🔧 配置步骤

### 1. 获取WalletConnect项目ID

1. 访问 [WalletConnect Cloud](https://cloud.walletconnect.com)
2. 创建免费账户
3. 创建新项目并获取项目ID
4. 在项目根目录创建 `.env` 文件：

```env
VITE_WALLETCONNECT_PROJECT_ID=你的_walletconnect_项目id
```

### 2. 环境变量配置

参考 `.env.example` 文件配置必要的环境变量：

```env
# WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Supabase配置（如果需要）
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎨 主题自定义

RainbowKit已配置为深色主题以匹配项目的赛博朋克风格：

```typescript
RainbowKitProvider({
  theme: darkTheme({
    accentColor: '#00ffff',  // 青色主色调
    accentColorForeground: 'black',
    borderRadius: 'medium',
  })
})
```

## 🌐 支持的链

当前配置支持以下区块链网络：

1. **Monad Testnet** (主要) - Chain ID: 10143
2. Ethereum Mainnet
3. Polygon
4. Optimism
5. Arbitrum
6. Base

## 🔄 迁移说明

### 从window.ethereum到wagmi的变更：

**之前:**
```javascript
await window.ethereum.request({ method: 'eth_requestAccounts' });
const provider = new ethers.BrowserProvider(window.ethereum);
```

**现在:**
```javascript
const { connect, connectors } = useConnect();
const { address, isConnected } = useAccount();
await connect({ connector });
```

### 签名消息的变更：

**之前:**
```javascript
const signer = await provider.getSigner();
const signature = await signer.signMessage(message);
```

**现在:**
```javascript
const { signMessage } = useSignMessage();
await signMessage({ message, account: address });
```

## 🚀 功能特性

### 1. 多钱包支持
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow Wallet
- Safe Wallet
- 以及更多...

### 2. 网络切换
- 自动检测当前网络
- 提示用户切换到支持的网络
- 无缝的网络切换体验

### 3. 用户体验提升
- 现代化的连接界面
- 实时连接状态显示
- 错误处理和重试机制
- 移动端友好设计

### 4. 安全性
- 签名验证
- 安全的消息签名流程
- 防止未授权访问

## 🎮 游戏集成

RainbowKit集成保持了与游戏系统的完全兼容：

- **用户认证**: 保持原有的签名认证流程
- **游客模式**: 继续支持无钱包游戏
- **房间系统**: 与Multisynq房间系统完全兼容
- **用户标识**: 钱包地址作为用户唯一标识

## 🐛 故障排除

### 1. 构建错误
如果遇到构建错误，请确保：
- 安装了所有必要的依赖
- 配置了正确的WalletConnect项目ID
- 环境变量设置正确

### 2. 连接问题
如果钱包连接有问题：
- 检查钱包是否安装
- 确认网络配置正确
- 尝试刷新页面

### 3. Monad Testnet连接
如果无法连接到Monad Testnet：
- 确认RPC端点可访问
- 检查网络配置
- 验证Chain ID (10143)

## 📝 开发说明

### 1. 添加新链
在 `src/lib/rainbowkit-config.ts` 中添加新的链配置：

```typescript
export const newChain = defineChain({
  id: chainId,
  name: 'Chain Name',
  nativeCurrency: {
    decimals: 18,
    name: 'Token Name',
    symbol: 'SYMBOL',
  },
  rpcUrls: {
    default: { http: ['https://rpc-url'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer-url' },
  },
});
```

### 2. 自定义主题
修改 `App.tsx` 中的主题配置：

```typescript
RainbowKitProvider({
  theme: darkTheme({
    accentColor: '#your-color',
    accentColorForeground: 'white',
    borderRadius: 'large',
  })
})
```

## 🎯 下一步计划

1. **ENS支持**: 添加ENS域名解析
2. **多签钱包**: 增强Safe等多签钱包支持
3. **移动端优化**: 进一步优化移动端体验
4. **链上功能**: 集成更多链上功能

---

**注意**: 确保在生产环境中使用自己的WalletConnect项目ID，不要使用临时ID。 