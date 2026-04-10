import { useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useAuth } from 'src/contexts/AuthContext';
import { buildOidcAuthorizeUrl } from 'src/services/oidcService';

const toPathString = (fromState: any) => {
  if (!fromState) return '';
  if (typeof fromState === 'string') return fromState;
  return `${fromState.pathname || ''}${fromState.search || ''}`;
};

export default function AuthBootstrapPage() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();
  const router = useRouter();
  const [error, setError] = useState('');
  const [silentAttempted, setSilentAttempted] = useState(false);

  const fromPath = useMemo(() => toPathString((location.state as any)?.from), [location.state]);
  const redirectAfterLogin = fromPath && fromPath !== '/' ? fromPath : '/stem/query';

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      const isAdmin = ['admin', 'ADMIN'].includes(user?.role || '');
      const target = fromPath && fromPath !== '/' ? fromPath : isAdmin ? '/stem/admin' : '/stem/query';
      router.replace(target);
      return;
    }

    if (silentAttempted) {
      const signInParams = new URLSearchParams();
      signInParams.set('from', fromPath || redirectAfterLogin);
      if (error) {
        signInParams.set('bootstrapError', error);
      }
      router.replace(`/sign-in?${signInParams.toString()}`);
      return;
    }

    const runSilentCheck = async () => {
      try {
        const authUrl = await buildOidcAuthorizeUrl(redirectAfterLogin, { prompt: 'none' });
        setSilentAttempted(true);
        window.location.assign(authUrl);
      } catch (bootstrapError: any) {
        setSilentAttempted(true);
        setError(bootstrapError?.message || 'Không thể kiểm tra phiên SSO tự động.');
      }
    };

    runSilentCheck();
  }, [
    error,
    fromPath,
    isAuthenticated,
    isLoading,
    redirectAfterLogin,
    router,
    silentAttempted,
    user?.role,
  ]);

  return (
    <>
      <title>{`Đang kiểm tra đăng nhập - ${CONFIG.appName}`}</title>

      <Box
        sx={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          p: 3,
        }}
      >
        <CircularProgress />
        <Typography variant="body1">Đang kiểm tra phiên đăng nhập Etechs SSO...</Typography>
      </Box>
    </>
  );
}
