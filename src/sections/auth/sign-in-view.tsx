import { useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import { useAuth } from 'src/contexts/AuthContext';

import { Iconify } from 'src/components/iconify';

import { loginAPI } from '../../services/authService';

// ----------------------------------------------------------------------

export function SignInView() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '', 
    password: '',
  });

  // Determine where to redirect after login. ProtectedRoute stores attempted location in
  // location.state.from. It might be a Location object or a string.
  const fromState = (location.state as any)?.from;
  const redirectTo =
    typeof fromState === 'string'
      ? fromState
      : fromState
      ? `${fromState.pathname || '/tutorial'}${fromState.search || ''}`
      : null;

  useEffect(() => {
    if (isAuthenticated) {
      const isAdmin = ['admin', 'ADMIN'].includes(user?.role || '');
      router.push(redirectTo || (isAdmin ? '/stem/admin' : '/stem/query'));
    }
  }, [isAuthenticated, router, redirectTo, user?.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Xóa lỗi khi người dùng bắt đầu nhập
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate form
      if (!formData.username || !formData.password) {
        setError('Vui lòng nhập tên đăng nhập và mật khẩu');
        return;
      }

      const result = await loginAPI(formData);
      
      // Kiểm tra cấu trúc response và điều chỉnh cho phù hợp
      if (result.success && result.data) {
        // Gọi hàm login từ AuthContext với đúng cấu trúc
        login(result.data.user, result.data.token);
        const isAdmin = ['admin', 'ADMIN'].includes(result.data.user?.role || '');
        router.push(redirectTo || (isAdmin ? '/stem/admin' : '/stem/query'));
      } else {
        setError(result.message || 'Đăng nhập thất bại');
      }
      
    } catch (err: any) {
      console.error("Lỗi đăng nhập", err);
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignIn();
    }
  };

  const renderForm = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      <TextField
        fullWidth
        name="username" // Đổi từ email sang username
        label="Tên đăng nhập"
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
        value={formData.username}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        disabled={loading}
      />

      {/* <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Link variant="body2" color="inherit">
          Quên mật khẩu?
        </Link>
      </Box> */}

      <TextField
        fullWidth
        name="password"
        label="Mật khẩu"
        type={showPassword ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => setShowPassword(!showPassword)} 
                  edge="end"
                  disabled={loading}
                >
                  <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
        value={formData.password}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        disabled={loading}
      />

      {/* Hiển thị lỗi */}
      {error && (
        <Typography 
          color="error" 
          variant="body2" 
          sx={{ 
            mb: 2, 
            width: '100%',
            textAlign: 'center'
          }}
        >
          {error}
        </Typography>
      )}

      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        onClick={handleSignIn}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </Button>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Đăng nhập</Typography>
      </Box>
      
      {renderForm}
      
      <Divider sx={{ my: 3, '&::before, &::after': { borderTopStyle: 'dashed' } }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontWeight: 'fontWeightMedium' }}
        >
          HCMUE
        </Typography>
      </Divider>
      
      <Box
        sx={{
          gap: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          Bạn đã có tài khoản chưa?
          <Link variant="subtitle2" sx={{ ml: 0.5 }} href="/sign-up">
            Hãy bắt đầu nào
          </Link>
        </Typography>
      </Box>
    </>
  );
}