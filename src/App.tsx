
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "./contexts/GameContext";
import { RoomProvider } from "./contexts/RoomContext";
import Landing from "./pages/Landing";
import GameLobbyPage from "./pages/GameLobbyPage";
import RoomPage from "./pages/RoomPage";
import GameLobby from "./pages/GameLobby";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RoomProvider>
        <GameProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/lobby" element={<GameLobbyPage />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
              <Route path="/old-lobby" element={<GameLobby />} />
              <Route path="/game" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </GameProvider>
      </RoomProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
