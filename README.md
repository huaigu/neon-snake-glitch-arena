# 霓虹贪吃蛇故障竞技场 (Neon Snake Glitch Arena)

一个基于React的多人在线霓虹风格贪吃蛇游戏，支持Web3身份验证和实时多人对战。

## 🎮 项目简介

这是一个现代化的贪吃蛇游戏，具有以下特色功能：
- 🔥 霓虹赛博朋克视觉风格
- 🌐 多人实时对战
- 🔗 Web3身份验证 (MetaMask + 游客模式)
- 📱 响应式设计 (支持移动端和桌面端)
- 🚀 实时同步 (基于Multisynq)
- 🎯 观战模式
- ⚡ 动态速度提升系统

## 🛠 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **状态管理**: React Context + React Query
- **路由**: React Router DOM
- **Web3集成**: Ethers.js
- **实时同步**: Multisynq Client
- **数据库**: Supabase
- **部署**: Lovable Platform

## 📁 项目结构

```
neon-snake-glitch-arena/
├── public/                     # 静态资源
├── src/
│   ├── components/            # React组件
│   │   ├── ui/               # shadcn/ui基础组件
│   │   ├── GameArea.tsx      # 游戏区域组件
│   │   ├── SnakeGame.tsx     # 核心游戏组件
│   │   ├── GameLobbyComponent.tsx # 游戏大厅组件
│   │   └── Web3AuthButton.tsx     # Web3认证按钮
│   ├── contexts/             # React Context
│   │   ├── GameContext.tsx   # 游戏状态管理
│   │   ├── Web3AuthContext.tsx # Web3认证状态
│   │   ├── MultisynqContext.tsx # 实时同步状态
│   │   └── RoomContext.tsx   # 房间状态管理
│   ├── hooks/               # 自定义Hooks
│   │   ├── useSnakeGame.ts  # 游戏核心逻辑
│   │   ├── useGameLobby.ts  # 大厅逻辑
│   │   └── useMobileControls.ts # 移动端控制
│   ├── pages/               # 页面组件
│   │   ├── Landing.tsx      # 首页
│   │   ├── GameLobby.tsx    # 游戏大厅
│   │   ├── RoomPage.tsx     # 房间页面
│   │   └── Web3AuthPage.tsx # 认证页面
│   ├── integrations/        # 第三方集成
│   │   └── supabase/        # Supabase配置
│   ├── models/              # 数据模型
│   ├── types/               # TypeScript类型定义
│   └── utils/               # 工具函数
├── supabase/               # 数据库配置和迁移
└── 配置文件 (vite.config.ts, tailwind.config.ts, etc.)
```

## 🎯 核心组件介绍

### 1. 游戏核心 (`src/components/SnakeGame.tsx`)

主要的游戏组件，负责：
- 游戏画面渲染和交互
- 移动端和桌面端的响应式布局
- 实时游戏状态显示（速度、长度、倒计时等）
- 观战模式处理
- 游戏控制逻辑

**核心功能**:
```typescript
// 从useSnakeGame Hook获取游戏状态
const {
  snakes,           // 所有蛇的状态
  foods,            // 食物位置
  gameRunning,      // 游戏运行状态
  speedMultiplier,  // 当前速度倍数
  isSpectator,      // 是否为观战模式
  // ...更多状态
} = useSnakeGame();
```

### 2. Web3身份验证 (`src/contexts/Web3AuthContext.tsx`)

提供Web3身份验证功能：
- MetaMask钱包连接
- 消息签名验证
- 游客模式支持
- 用户状态持久化

**主要接口**:
```typescript
interface Web3AuthContextType {
  user: Web3User | null;        // 当前用户
  isConnecting: boolean;        // 连接状态
  signInWithEthereum: () => Promise<void>;  // Web3登录
  signInAsGuest: () => Promise<void>;       // 游客登录
  signOut: () => void;          // 登出
  isAuthenticated: boolean;     // 认证状态
}
```

### 3. 游戏逻辑Hook (`src/hooks/useSnakeGame.ts`)

核心游戏逻辑管理：
- 蛇的移动和碰撞检测
- 食物生成和消费
- 分数计算
- 速度提升系统
- 观战模式切换

### 4. 多人房间管理 (`src/contexts/RoomContext.tsx`)

管理多人游戏房间：
- 房间创建和加入
- 玩家列表管理
- 实时状态同步
- 房间配置管理

### 5. 游戏大厅 (`src/components/GameLobbyComponent.tsx`)

多人游戏大厅界面：
- 显示可用房间列表
- 创建新房间
- 加入现有房间
- 玩家状态展示

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 pnpm 或 bun

### 安装和运行

1. **克隆项目**
```bash
git clone <YOUR_GIT_URL>
cd neon-snake-glitch-arena
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
# 或
bun install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
pnpm dev
# 或
bun dev
```

4. **访问应用**
打开浏览器访问 `http://localhost:5173`

### 构建生产版本
```bash
npm run build
```

## 🎮 游戏特性

### 单人模式
- 经典贪吃蛇玩法
- 动态速度提升
- 分数系统
- 观战模式

### 多人模式
- 实时多人对战
- 房间系统
- 玩家排行榜
- 观战功能

### Web3集成
- MetaMask钱包登录
- 消息签名验证
- 游客模式备选
- 去中心化身份

### 响应式设计
- 桌面端完整界面
- 移动端优化布局
- 触摸控制支持
- 自适应UI组件

## 🔧 配置说明

### 环境变量
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Supabase配置
项目使用Supabase作为后端数据库，配置文件位于 `supabase/` 目录。

### Tailwind主题
自定义的赛博朋克配色主题定义在 `tailwind.config.ts` 中。

## 📱 移动端支持

项目完全支持移动端设备：
- 触摸手势控制
- 响应式布局
- 优化的UI组件
- 移动端专用控制逻辑

## 🤝 贡献指南

1. Fork 这个项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

这个项目是开源的，具体许可证信息请查看项目文件。

## 🔗 相关链接

- **项目地址**: https://lovable.dev/projects/b93e4565-5a53-4621-b33b-e222894116a2
- **技术文档**: 查看 `src/` 目录下的代码注释
- **问题反馈**: 使用GitHub Issues

---

**享受这个充满赛博朋克风格的贪吃蛇游戏体验！** 🐍✨
