/// <reference types="vite/client" />
interface Window {
  __ENV__?: {
    VITE_API_URL?: string
    VITE_API_BASE_URL?: string
    VITE_OIDC_ISSUER?: string
    VITE_OIDC_CLIENT_ID?: string
    VITE_OIDC_REDIRECT_URI?: string
    VITE_OIDC_POST_LOGOUT_REDIRECT_URI?: string
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_OIDC_ISSUER?: string
  readonly VITE_OIDC_CLIENT_ID?: string
  readonly VITE_OIDC_REDIRECT_URI?: string
  readonly VITE_OIDC_POST_LOGOUT_REDIRECT_URI?: string
  readonly VITE_OIDC_SCOPE?: string
  readonly VITE_OIDC_ENABLE_LOGOUT_REDIRECT?: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
