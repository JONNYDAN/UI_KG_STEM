import { ReactNode } from 'react';

import { useAuth } from 'src/contexts/AuthContext';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: string | string[];
  fallback?: ReactNode;
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleBasedRouteProps) {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}