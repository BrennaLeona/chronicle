import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ChronicleProvider } from './store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChronicleProvider>
      <App />
    </ChronicleProvider>
  </StrictMode>,
);
