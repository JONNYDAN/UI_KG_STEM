import { useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

export function SignUpView() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleBackToLogin = () => {
    setSubmitting(true);
    router.push('/sign-in');
  };

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
      <Alert severity="info" sx={{ mb: 3 }}>
        Tài khoản của hệ STEM hiện được quản lý tập trung qua Etechs SSO. Vui lòng quay lại trang đăng nhập để tiếp tục.
      </Alert>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column' }}>
        <Button
          fullWidth
          size="large"
          type="button"
          color="inherit"
          variant="contained"
          onClick={handleBackToLogin}
          disabled={submitting}
        >
          {submitting ? 'Đang chuyển hướng...' : 'Quay lại đăng nhập SSO'}
        </Button>
      </Box>
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
