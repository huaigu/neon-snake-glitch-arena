
import { createRoot } from 'react-dom/client'
import { ReactTogether } from 'react-together'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <ReactTogether
    sessionParams={{
      appId: 'snakegame',
      apiKey: '2MQdiuJqkzrzwvcPqDwn2iQCr0t5CvIkDJxsakTThP',
      name: 'Lobby',
      password: 'Monad_SNAKE_GAMES',
    }}
  >
    <App />
  </ReactTogether>
);
