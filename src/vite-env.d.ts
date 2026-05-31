/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_PO_FEEDBACK_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
