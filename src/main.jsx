import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';
import './assets/styles/global.css';

const theme = localStorage.getItem('eventpilot.theme') || 'light';
document.documentElement.dataset.theme = theme;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
