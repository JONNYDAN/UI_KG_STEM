import { useState } from 'react';

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

import { registerAPI } from '../../services/authService';

export function SignUpView() {
  const router = useRouter();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State cho form
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    password_confirmation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.username || !formData.password) return;
      if (formData.password !== formData.password_confirmation) return;

      const result = await registerAPI({
        username: formData.username,
        password: formData.password,
        name: formData.name || formData.username,
      });
      if (result?.success && result?.data) {
        login(result.data.user, result.data.token);
        router.push('/stem/query');
      }
    } catch (err) {
      console.error("Lỗi đăng ký", err);
    }
  };

  const renderForm = (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column' }}>
      <TextField
        fullWidth
        name="name"
        label="Họ và tên"
        value={formData.name}
        onChange={handleChange}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="username"
        label="Tên đăng nhập"
        value={formData.username}
        onChange={handleChange}
        sx={{ mb: 3 }}
      />

      <TextField
        fullWidth
        name="password"
        label="Mật khẩu"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange}
        sx={{ mb: 3 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        name="password_confirmation"
        label="Xác nhận mật khẩu"
        type={showConfirmPassword ? 'text' : 'password'}
        value={formData.password_confirmation}
        onChange={handleChange}
        sx={{ mb: 3 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                <Iconify icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        fullWidth
        size="large"
        type="button"
        color="inherit"
        variant="contained"
        onClick={handleSubmit}
      >
        Đăng ký
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
        <Typography variant="h5">Đăng ký</Typography>
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
      <Box sx={{ gap: 1, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Bạn đã có tài khoản?
          <Link variant="subtitle2" sx={{ ml: 0.5 }} href="/sign-in">
            Tiến hành thôi !
          </Link>
        </Typography>
      </Box>
    </>
  );
}