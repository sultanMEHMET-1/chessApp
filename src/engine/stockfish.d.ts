declare module 'stockfish' {
  type StockfishInstance = {
    postMessage: (command: string) => void;
    onmessage: ((event: MessageEvent | string) => void) | null;
  };

  const stockfish: () => StockfishInstance;
  export default stockfish;
}
