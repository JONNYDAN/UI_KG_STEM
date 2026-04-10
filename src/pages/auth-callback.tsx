import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/config-global';
import { useAuth } from 'src/contexts/AuthContext';
import { useRouter } from 'src/routes/hooks';
import {
  clearOidcRequestStorage,
  exchangeAuthorizationCode,
  exchangeOidcTokenForAppJwt,
  getOidcRequestContext,
} from 'src/services/oidcService';
import { getProfile } from 'src/services/authService';

const normalizeUser = (rawUser?: Record<string, any>) => ({
  id: String(rawUser?.id || rawUser?.user_id || ''),
  staffCode: String(rawUser?.staffCode || rawUser?.id || rawUser?.user_id || ''),
  name: String(rawUser?.name || rawUser?.full_name || rawUser?.username || 'SSO User'),
  username: String(rawUser?.username || rawUser?.email || rawUser?.id || rawUser?.user_id || ''),
  role: String(rawUser?.role || 'user'),
  group: Array.isArray(rawUser?.group) ? rawUser.group : [],
  photoURL: String(rawUser?.photoURL || rawUser?.avatar || ''),
});

export default function AuthCallbackPage() {
  const location = useLocation();
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const runCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const oidcError = params.get('error');
        const requestContext = getOidcRequestContext();

        if (oidcError) {
          clearOidcRequestStorage();
          const shouldRenderLocalLogin = ['login_required', 'interaction_required', 'consent_required'].includes(
            oidcError
          );

          if (shouldRenderLocalLogin) {
            const signInParams = new URLSearchParams();
            signInParams.set('from', requestContext.redirectAfterLogin || '/stem/query');
            signInParams.set('oidcError', oidcError);
            if (params.get('error_description')) {
              signInParams.set('oidcErrorDescription', params.get('error_description') || '');
            }
            router.replace(`/sign-in?${signInParams.toString()}`);
            return;
          }

          throw new Error(params.get('error_description') || oidcError);
        }

        if (!code) {
          throw new Error('Thiếu authorization code từ SSO callback');
        }

        if (!requestContext.codeVerifier || !requestContext.expectedState) {
          throw new Error('Không tìm thấy phiên đăng nhập SSO trước đó. Vui lòng thử lại.');
        }

        if (!state || state !== requestContext.expectedState) {
          throw new Error('State không hợp lệ, vui lòng đăng nhập lại.');
        }

        const oidcToken = await exchangeAuthorizationCode(code, requestContext.codeVerifier);
        const oidcAccessToken = oidcToken.access_token || oidcToken.id_token;

        if (!oidcAccessToken) {
          throw new Error('Không nhận được access_token hoặc id_token từ OIDC token endpoint');
        }

        const exchangeResponse = await exchangeOidcTokenForAppJwt(oidcAccessToken);

        if (!exchangeResponse.access) {
          throw new Error('Middleware không trả về access token của app');
        }

        let normalizedUser = normalizeUser(exchangeResponse.user);

        try {
          const profileResponse = await getProfile(exchangeResponse.access);
          const profileUser = profileResponse?.data?.user;
          if (profileUser) {
            normalizedUser = normalizeUser(profileUser);
          }
        } catch (profileError) {
          console.warn('Không thể hydrate profile từ STEM_KG_API, dùng payload exchange mặc định.', profileError);
        }

        login(normalizedUser, exchangeResponse.access, {
          refresh: exchangeResponse.refresh,
          tenant_slug: exchangeResponse.tenant_slug,
          tenant_context: exchangeResponse.tenant_context,
        });

        clearOidcRequestStorage();

        const redirectTo = requestContext.redirectAfterLogin || '/stem/query';
        const isAdmin = ['admin', 'ADMIN'].includes(normalizedUser.role || '');
        router.replace(redirectTo === '/' ? (isAdmin ? '/stem/admin' : '/stem/query') : redirectTo);
      } catch (callbackError: any) {
        console.error('OIDC callback error:', callbackError);
        clearOidcRequestStorage();
        setError(callbackError?.message || 'Đăng nhập SSO thất bại');
      }
    };

    runCallback();
  }, [location.search, login, router]);

  return (
    <>
      <title>{`Xác thực SSO - ${CONFIG.appName}`}</title>

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
        {error ? (
          <>
            <Alert severity="error" sx={{ maxWidth: 560, width: '100%' }}>
              {error}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Vui lòng quay lại trang đăng nhập và thử lại.
            </Typography>
          </>
        ) : (
          <>
            <CircularProgress />
            <Typography variant="body1">Đang xử lý đăng nhập SSO...</Typography>
          </>
        )}
      </Box>
    </>
  );
}
