/// <reference types="vite/client" />

declare module 'virtual:stockfish-assets' {
  export const stockfishEngineScriptUrl: string;
  export const stockfishEngineWasmUrl: string;
  export const stockfishEngineAssetsAvailable: boolean;
  export const stockfishEngineAssetsError: string;
}
