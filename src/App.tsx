import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { config } from "./lib/rainbowkit-config";
import { GameProvider } from "./contexts/GameContext";
import { RoomProvider } from "./contexts/RoomContext";
import { Web3AuthProvider } from "./contexts/Web3AuthContext";
import { MultisynqProvider } from "./contexts/MultisynqContext";
import Landing from "./pages/Landing";
import GameLobbyPage from "./pages/GameLobbyPage";
import RoomPage from "./pages/RoomPage";
import GameLobby from "./pages/GameLobby";
import Web3AuthPage from "./pages/Web3AuthPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// 组件用于条件渲染是否需要MultisynqProvider
const AppRoutes = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    // Landing页面不需要MultisynqProvider，直接渲染
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
    );
  }

  // 其他页面需要MultisynqProvider
  return (
    <MultisynqProvider>
      <RoomProvider>
        <GameProvider>
          <Routes>
            <Route path="/auth" element={<Web3AuthPage />} />
            <Route path="/lobby" element={<GameLobbyPage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/old-lobby" element={<GameLobby />} />
            <Route path="/game" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </GameProvider>
      </RoomProvider>
    </MultisynqProvider>
  );
};

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider 
        theme={darkTheme({
          accentColor: '#00ffff',
          accentColorForeground: 'black',
          borderRadius: 'medium',
        })}
      >
        <TooltipProvider>
          <Web3AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </Web3AuthProvider>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
