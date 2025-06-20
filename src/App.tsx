
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "./contexts/GameContext";
import { RoomProvider } from "./contexts/RoomContext";
import { Web3AuthProvider } from "./contexts/Web3AuthContext";
import { MultisynqProvider } from "./contexts/MultisynqContext";
import Landing from "./pages/Landing";
import GameLobbyPage from "./pages/GameLobbyPage";
import RoomPage from "./pages/RoomPage";
import GameLobby from "./pages/GameLobby";
import Web3AuthPage from "./pages/Web3AuthPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Web3AuthProvider>
        <MultisynqProvider>
          <RoomProvider>
            <GameProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Web3AuthPage />} />
                  <Route path="/lobby" element={<GameLobbyPage />} />
                  <Route path="/room/:roomId" element={<RoomPage />} />
                  <Route path="/old-lobby" element={<GameLobby />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </GameProvider>
          </RoomProvider>
        </MultisynqProvider>
      </Web3AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
