import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

import { ProtectedRoute } from 'src/components/ProtectedRoute';

// Pages - Only essential pages for STEM query system
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const SignUpPage = lazy(() => import('src/pages/sign-up'));
export const StemQueryPage = lazy(() => import('src/pages/stem-query'));
export const StemAdminPage = lazy(() => import('src/pages/stem-admin'));
export const EntityManagementPage = lazy(() => import('src/pages/entity-management'));
export const SROManagementPage = lazy(() => import('src/pages/sro-management'));
export const DiagramGraphPage = lazy(() => import('src/pages/diagram-graph'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);



export const routesSection: RouteObject[] = [
  {
    element: (
      <Suspense fallback={renderFallback()}>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </Suspense>
    ),
    children: [
      // Default home route - STEM Query
      {
        index: true,
        element: (
          <ProtectedRoute>
            <StemQueryPage />
          </ProtectedRoute>
        ),
      },
      // STEM Query - User Interface
      {
        path: 'stem/query',
        element: (
          <ProtectedRoute>
            <StemQueryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'stem/diagram-graph',
        element: (
          <ProtectedRoute>
            <DiagramGraphPage />
          </ProtectedRoute>
        ),
      },
      // STEM Admin - Query Logs View
      {
        path: 'stem/admin',
        element: (
          <ProtectedRoute requiredRoles={['admin', 'ADMIN']}>
            <StemAdminPage />
          </ProtectedRoute>
        ),
      },
      // Entity Management - Admin Management Interface
      {
        path: 'stem/entities',
        element: (
          <ProtectedRoute requiredRoles={['admin', 'ADMIN']}>
            <EntityManagementPage />
          </ProtectedRoute>
        ),
      },
      // SRO Management - Triple Management Interface
      {
        path: 'stem/triples',
        element: (
          <ProtectedRoute requiredRoles={['admin', 'ADMIN']}>
            <SROManagementPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Authentication Routes
  {
    path: 'sign-in',
    element: (
      <Suspense fallback={renderFallback()}>
        <AuthLayout>
          <SignInPage />
        </AuthLayout>
      </Suspense>
    ),
  },
  {
    path: 'sign-up',
    element: (
      <Suspense fallback={renderFallback()}>
        <AuthLayout>
          <SignUpPage />
        </AuthLayout>
      </Suspense>
    ),
  },
  // Error Pages
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];