/// <reference types="vite/client" />

interface Window {
  injectGold?: (amount?: number) => number;
  setGold?: (amount: number) => number;
  getGold?: () => number;
  uw2?: {
    injectGold: (amount?: number) => number;
    setGold: (amount: number) => number;
    getGold: () => number;
    state: any;
    [key: string]: any;
  };
}

