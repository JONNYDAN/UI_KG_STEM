import { useState } from 'react';

import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { changePassword } from 'src/services/userService';

type Props = {
  user: {
    staffCode: string;
    name: string;
  };
};

export function ChangePasswordView({ user }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // reset thông báo
    setMessage(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không trùng khớp' });
      return;
    }

    try {
      setLoading(true);

      // Gọi API đổi mật khẩu
      const result = await changePassword(oldPassword, newPassword, confirmPassword);

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Đổi mật khẩu thành công!' });
        // Reset form
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: result.message || 'Đổi mật khẩu thất bại' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Lỗi kết nối đến máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContent>
      <Container maxWidth="sm">
        <Card>
          <CardContent>
            <Typography variant="h5" mb={3}>
              Đổi mật khẩu
            </Typography>

            {/* Hiển thị thông báo */}
            {message && (
              <Alert severity={message.type} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            {/* Thông tin user */}
            <Typography variant="body1" mb={2}>
              <strong>Tài khoản:</strong> {user.name} ({user.staffCode})
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Mật khẩu cũ"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Mật khẩu mới"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Xác nhận mật khẩu mới"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ mt: 1 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Đổi mật khẩu'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </DashboardContent>
  );
}
