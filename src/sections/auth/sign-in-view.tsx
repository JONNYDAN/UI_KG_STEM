import { useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { useAuth } from 'src/contexts/AuthContext';
import { buildOidcAuthorizeUrl, loginViaOidcMiddleware } from 'src/services/oidcService';

// ----------------------------------------------------------------------

export function SignInView() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Determine where to redirect after login. ProtectedRoute stores attempted location in
  // location.state.from. It might be a Location object or a string.
  const fromState = (location.state as any)?.from;
  const query = new URLSearchParams(location.search);
  const fromQuery = query.get('from');
  const redirectTo =
    typeof fromState === 'string'
      ? fromState
      : fromState
      ? `${fromState.pathname || '/stem/query'}${fromState.search || ''}`
      : fromQuery || null;

  const oidcErrorDescription =
    (location.state as any)?.oidcErrorDescription ||
    query.get('oidcErrorDescription') ||
    query.get('bootstrapError') ||
    '';

  useEffect(() => {
    if (isAuthenticated) {
      const isAdmin = ['admin', 'ADMIN'].includes(user?.role || '');
      router.push(redirectTo || (isAdmin ? '/stem/admin' : '/stem/query'));
    }
  }, [isAuthenticated, router, redirectTo, user?.role]);

  const handleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const authUrl = await buildOidcAuthorizeUrl(redirectTo || '/stem/query');
      window.location.assign(authUrl);
    } catch (err: any) {
      console.error('Lỗi bắt đầu đăng nhập SSO', err);
      setError(err.message || 'Không thể bắt đầu đăng nhập SSO');
    } finally {
      setLoading(false);
    }
  }, [redirectTo]);

  const handleFormSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!email || !password) {
        setError('Vui lòng nhập email và mật khẩu.');
        return;
      }

      try {
        setFormLoading(true);
        setError('');

        const response = await loginViaOidcMiddleware({
          email: email.trim(),
          password,
          redirectAfterLogin: redirectTo || '/stem/query',
        });

        if (!response.redirect_url) {
          throw new Error('Middleware không trả về redirect_url để hoàn tất OIDC.');
        }

        window.location.assign(response.redirect_url);
      } catch (submitError: any) {
        console.error('Lỗi đăng nhập middleware', submitError);
        setError(submitError?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      } finally {
        setFormLoading(false);
      }
    },
    [email, password, redirectTo]
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
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 320 }}>
          Truy cập hệ thống Etechs EDS bằng tài khoản SSO dùng chung của Etechs.
        </Typography>
      </Box>
      
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        {error && (
          <Typography
            color="error"
            variant="body2"
            sx={{
              mb: 2,
              width: '100%',
              textAlign: 'center',
            }}
          >
            {error}
          </Typography>
        )}

        {!error && oidcErrorDescription && (
          <Typography
            color="warning.main"
            variant="body2"
            sx={{
              mb: 2,
              width: '100%',
              textAlign: 'center',
            }}
          >
            {oidcErrorDescription}
          </Typography>
        )}

        <Box component="form" onSubmit={handleFormSubmit} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={formLoading || loading}
            autoComplete="email"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="password"
            label="Mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={formLoading || loading}
            autoComplete="current-password"
            sx={{ mb: 2 }}
          />

          <Button
            fullWidth
            size="large"
            type="submit"
            color="primary"
            variant="contained"
            disabled={formLoading || loading}
            sx={{ mb: 2 }}
          >
            {formLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </Box>

        <Button
          fullWidth
          size="large"
          type="button"
          color="inherit"
          variant="contained"
          onClick={handleSignIn}
          disabled={loading || formLoading}
          sx={{ mb: 2 }}
        >
          {loading ? 'Đang chuyển hướng SSO...' : 'Đăng nhập với Etechs SSO'}
        </Button>
      </Box>
      
      <Divider sx={{ my: 3, '&::before, &::after': { borderTopStyle: 'dashed' } }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontWeight: 'fontWeightMedium' }}
        >
          Etechs EDS
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
          Tài khoản được quản lý tập trung qua Etechs SSO.
          <Link variant="subtitle2" sx={{ ml: 0.5 }} href="/sign-up">
            Xem hướng dẫn
          </Link>
        </Typography>
      </Box>
    </>
  );
}
