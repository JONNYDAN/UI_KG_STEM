const OIDC_SCOPE = import.meta.env.VITE_OIDC_SCOPE || 'openid profile email';

const storageKeys = {
  verifier: 'oidc_code_verifier',
  state: 'oidc_state',
  nonce: 'oidc_nonce',
  redirectAfterLogin: 'oidc_redirect_after_login',
};

interface AuthorizeOptions {
  prompt?: string;
}

interface OidcAuthorizeRequest {
  client_id: string;
  redirect_uri: string;
  response_type: 'code';
  scope: string;
  state: string;
  nonce: string;
  code_challenge: string;
  code_challenge_method: 'S256';
  prompt?: string;
}

const getOidcIssuer = () => {
  const issuer = window.__ENV__?.VITE_OIDC_ISSUER || import.meta.env.VITE_OIDC_ISSUER;
  if (!issuer) {
    throw new Error('Thiếu cấu hình VITE_OIDC_ISSUER');
  }
  return issuer.replace(/\/$/, '');
};

const getClientId = () => {
  const clientId = window.__ENV__?.VITE_OIDC_CLIENT_ID || import.meta.env.VITE_OIDC_CLIENT_ID;
  if (!clientId) {
    throw new Error('Thiếu cấu hình VITE_OIDC_CLIENT_ID');
  }
  return clientId;
};

const getRedirectUri = () =>
  window.__ENV__?.VITE_OIDC_REDIRECT_URI ||
  import.meta.env.VITE_OIDC_REDIRECT_URI ||
  `${window.location.origin}/auth/callback`;

const randomString = (length = 64) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((value) => charset[value % charset.length])
    .join('');
};

const base64UrlEncode = (input: ArrayBuffer) => {
  const bytes = new Uint8Array(input);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const sha256 = async (plainText: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  return crypto.subtle.digest('SHA-256', data);
};

export const clearOidcRequestStorage = () => {
  sessionStorage.removeItem(storageKeys.verifier);
  sessionStorage.removeItem(storageKeys.state);
  sessionStorage.removeItem(storageKeys.nonce);
  sessionStorage.removeItem(storageKeys.redirectAfterLogin);
};

const prepareOidcAuthorizeRequest = async (
  redirectAfterLogin = '/',
  options?: AuthorizeOptions
): Promise<OidcAuthorizeRequest> => {
  const codeVerifier = randomString(96);
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));
  const state = randomString(32);
  const nonce = randomString(32);

  sessionStorage.setItem(storageKeys.verifier, codeVerifier);
  sessionStorage.setItem(storageKeys.state, state);
  sessionStorage.setItem(storageKeys.nonce, nonce);
  sessionStorage.setItem(storageKeys.redirectAfterLogin, redirectAfterLogin);

  return {
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: OIDC_SCOPE,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    ...(options?.prompt ? { prompt: options.prompt } : {}),
  };
};

export const buildOidcAuthorizeUrl = async (
  redirectAfterLogin = '/',
  options?: AuthorizeOptions
): Promise<string> => {
  const authorizeRequest = await prepareOidcAuthorizeRequest(redirectAfterLogin, options);

  const authorizeUrl = new URL(`${getOidcIssuer()}/api/oidc/authorize/`);
  Object.entries(authorizeRequest).forEach(([key, value]) => {
    if (value) {
      authorizeUrl.searchParams.set(key, value);
    }
  });

  return authorizeUrl.toString();
};

interface MiddlewareCredentialLoginRequest {
  email: string;
  password: string;
  redirectAfterLogin?: string;
}

interface MiddlewareCredentialLoginResponse {
  redirect_url?: string;
  detail?: string;
  message?: string;
  error?: string;
}

const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const loginViaOidcMiddleware = async ({
  email,
  password,
  redirectAfterLogin = '/stem/query',
}: MiddlewareCredentialLoginRequest): Promise<MiddlewareCredentialLoginResponse> => {
  const authorizeRequest = await prepareOidcAuthorizeRequest(redirectAfterLogin);

  const response = await fetch(`${getOidcIssuer()}/api/oidc/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email,
      username: email,
      password,
      ...authorizeRequest,
    }),
  });

  const jsonData = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(
      jsonData?.detail ||
        jsonData?.message ||
        jsonData?.error ||
        'Đăng nhập middleware thất bại'
    );
  }

  return jsonData || {};
};

export const getOidcRequestContext = () => ({
  codeVerifier: sessionStorage.getItem(storageKeys.verifier),
  expectedState: sessionStorage.getItem(storageKeys.state),
  nonce: sessionStorage.getItem(storageKeys.nonce),
  redirectAfterLogin: sessionStorage.getItem(storageKeys.redirectAfterLogin) || '/',
});

export interface OidcTokenResponse {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

export interface ExchangeResponse {
  access: string;
  refresh?: string;
  tenant_slug?: string;
  user?: Record<string, any>;
  tenant_context?: Record<string, any>;
}

export const exchangeAuthorizationCode = async (
  code: string,
  codeVerifier: string
): Promise<OidcTokenResponse> => {
  const payload = new URLSearchParams();
  payload.set('grant_type', 'authorization_code');
  payload.set('client_id', getClientId());
  payload.set('redirect_uri', getRedirectUri());
  payload.set('code', code);
  payload.set('code_verifier', codeVerifier);

  const response = await fetch(`${getOidcIssuer()}/api/oidc/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Đổi authorization code thất bại');
  }

  return response.json();
};

export const exchangeOidcTokenForAppJwt = async (oidcAccessToken: string): Promise<ExchangeResponse> => {
  const response = await fetch(`${getOidcIssuer()}/api/oidc/exchange/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      access_token: oidcAccessToken,
      client_id: getClientId(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Đổi OIDC token sang app JWT thất bại');
  }

  return response.json();
};

export const buildSsoLogoutUrl = () => {
  const postLogoutRedirectUri =
    window.__ENV__?.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ||
    import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ||
    window.location.origin;
  const url = new URL(`${getOidcIssuer()}/api/oidc/logout/`);
  url.searchParams.set('client_id', getClientId());
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  return url.toString();
};
