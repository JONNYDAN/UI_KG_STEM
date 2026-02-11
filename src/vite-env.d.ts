/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // thêm các biến môi trường khác nếu cần
  readonly VITE_APP_TITLE: string
  // ... more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}