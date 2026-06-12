/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_PO_FEEDBACK_ENDPOINT?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_ADMIN_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
