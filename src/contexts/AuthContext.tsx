import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  staffCode: string;
  name: string;
  username: string;
  role: string;
  group: string[];
  photoURL: string;
}

interface AuthSession {
  access: string;
  refresh?: string;
  tenant_slug?: string;
  tenant_context?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  session: AuthSession | null;
  login: (userData: User, authToken: string, sessionData?: Partial<AuthSession>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (requiredRoles: string | string[]) => boolean;
  hasGroup: (requiredGroups: string | string[]) => boolean;
  isLoading: boolean; 
  isTokenValid: boolean; // Thêm trạng thái token hợp lệ
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false); // Thêm state kiểm tra token

  // Hàm kiểm tra token có hợp lệ không
  const checkTokenValidity = (tokenToCheck: string): boolean => {
    try {
      // Kiểm tra token có tồn tại và đúng định dạng JWT không
      if (!tokenToCheck || typeof tokenToCheck !== 'string') {
        return false;
      }

      const parts = tokenToCheck.split('.');
      
      // JWT phải có 3 phần: header.payload.signature
      if (parts.length !== 3) {
        return false;
      }

      // Sửa Base64URL decoding (JWT sử dụng Base64URL)
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Thêm padding nếu cần
      const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      
      const payload = JSON.parse(atob(paddedBase64));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token has expired');
        return false; // Token đã hết hạn
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      console.log('Token might be invalid or not a JWT');
      return false;
    }
  };

  useEffect(() => {
    // Kiểm tra localStorage khi component mount
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    const storedRefreshToken = localStorage.getItem('refreshToken') || undefined;
    const storedTenantSlug = localStorage.getItem('tenantSlug') || undefined;
    const storedTenantContextRaw = localStorage.getItem('tenantContext');

    let storedTenantContext: Record<string, any> | undefined;
    if (storedTenantContextRaw) {
      try {
        storedTenantContext = JSON.parse(storedTenantContextRaw);
      } catch {
        storedTenantContext = undefined;
      }
    }

    if (storedToken && storedUser) {
      // Kiểm tra token có hợp lệ không
      const tokenValid = checkTokenValidity(storedToken);
      
      if (tokenValid) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setSession({
          access: storedToken,
          refresh: storedRefreshToken,
          tenant_slug: storedTenantSlug,
          tenant_context: storedTenantContext,
        });
        setIsTokenValid(true);
      } else {
        // Token hết hạn, xóa dữ liệu đăng nhập
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantSlug');
        localStorage.removeItem('tenantContext');
        localStorage.removeItem('user');
        setIsTokenValid(false);
      }
    } else {
      setIsTokenValid(false);
    }
    
    setIsLoading(false);
  }, []);

  const login = (userData: User, authToken: string, sessionData?: Partial<AuthSession>) => {
    setUser(userData);
    setToken(authToken);
    const nextSession: AuthSession = {
      access: authToken,
      refresh: sessionData?.refresh,
      tenant_slug: sessionData?.tenant_slug,
      tenant_context: sessionData?.tenant_context,
    };
    setSession(nextSession);
    setIsTokenValid(true);

    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));

    if (nextSession.refresh) {
      localStorage.setItem('refreshToken', nextSession.refresh);
    } else {
      localStorage.removeItem('refreshToken');
    }

    if (nextSession.tenant_slug) {
      localStorage.setItem('tenantSlug', nextSession.tenant_slug);
    } else {
      localStorage.removeItem('tenantSlug');
    }

    if (nextSession.tenant_context) {
      localStorage.setItem('tenantContext', JSON.stringify(nextSession.tenant_context));
    } else {
      localStorage.removeItem('tenantContext');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSession(null);
    setIsTokenValid(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantSlug');
    localStorage.removeItem('tenantContext');
    localStorage.removeItem('user');
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const hasGroup = (requiredGroups: string | string[]): boolean => {
    if (!user?.group) return false;
    
    const groups = Array.isArray(requiredGroups) ? requiredGroups : [requiredGroups];
    const userGroups = user.group;
    
    return groups.some(group => userGroups.includes(group));
  };

  const value = {
    user,
    token,
    session,
    login,
    logout,
    isAuthenticated: !!user && !!token && isTokenValid, // Cập nhật để bao gồm kiểm tra token
    hasRole,
    hasGroup,
    isLoading,
    isTokenValid,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}