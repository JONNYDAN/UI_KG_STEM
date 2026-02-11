import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from 'src/contexts/AuthContext';

import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string | string[];
  requiredGroups?: string | string[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  requiredGroups,
  fallbackPath = '/sign-in' 
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, hasRole, hasGroup, user, isLoading } = useAuth();

  // Hiển thị loading trong khi đang khôi phục trạng thái
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Chưa đăng nhập hoặc token hết hạn -> redirect đến login
  if (!isAuthenticated) {
    // Nếu token hết hạn, có thể thêm thông báo hoặc log
    console.warn('Authentication failed. Redirecting to login...');
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;
  }

  // Có required roles nhưng user không có quyền -> redirect
  if (requiredRoles && !hasRole(requiredRoles)) {
    console.warn(`User ${user?.username} with role ${user?.role} attempted to access route requiring roles:`, requiredRoles);
    return <Navigate to="/404" replace />;
  }

  // Có required groups nhưng user không có group -> redirect
  if (requiredGroups && !hasGroup(requiredGroups)) {
    console.warn(`User ${user?.username} with groups ${user?.group} attempted to access route requiring groups:`, requiredGroups);
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
}