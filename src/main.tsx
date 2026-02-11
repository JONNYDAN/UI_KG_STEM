// main.tsx
import "./global.css";

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { AuthProvider } from 'src/contexts/AuthContext';

import App from './app';
import { routesSection } from './routes/sections';
import { ErrorBoundary } from './routes/components';

// ----------------------------------------------------------------------

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <App />
      </AuthProvider>
    ),
    errorElement: <ErrorBoundary />,
    children: routesSection,
  },
]);

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </StrictMode>
);