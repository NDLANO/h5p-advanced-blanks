/** RequireJS module loader declaration. */
declare let require: {
  /** Synchronous module loader. */
  <T>(path: string): T;

  /** Asynchronous module loader with callback. */
  (paths: string[], callback: (...modules: any[]) => void): void;

  /** Asynchronous module loader with ensure. */
  ensure: (paths: string[], callback: (require: <T>(path: string) => T) => void) => void;
};
