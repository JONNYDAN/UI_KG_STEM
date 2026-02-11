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

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, authToken: string) => void;
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

    if (storedToken && storedUser) {
      // Kiểm tra token có hợp lệ không
      const tokenValid = checkTokenValidity(storedToken);
      
      if (tokenValid) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsTokenValid(true);
      } else {
        // Token hết hạn, xóa dữ liệu đăng nhập
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsTokenValid(false);
      }
    } else {
      setIsTokenValid(false);
    }
    
    setIsLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setIsTokenValid(true);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsTokenValid(false);
    localStorage.removeItem('authToken');
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