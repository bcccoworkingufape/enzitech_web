import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { SettingsProvider } from './context/SettingsContext';
import { SnackbarProvider } from './context/SnackbarContext';
import './styles/theme.css';
import './styles/components.css';
import './styles/layout.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (count, error) => count < 2 && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <SnackbarProvider>
            <DialogProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </DialogProvider>
          </SnackbarProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
