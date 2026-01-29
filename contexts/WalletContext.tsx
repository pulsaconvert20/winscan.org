'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { KeplrAccount, getSavedKeplrAccount, onKeplrAccountChange } from '@/lib/keplr';

interface WalletContextType {
  account: KeplrAccount | null;
  isConnected: boolean;
  setAccount: (account: KeplrAccount | null) => void;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  isConnected: false,
  setAccount: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<KeplrAccount | null>(null);

  useEffect(() => {
    const saved = getSavedKeplrAccount();
    if (saved) {
      setAccount(saved.account);
    }

    const cleanup = onKeplrAccountChange((accounts) => {
      if (accounts.length > 0) {
        const newAccount = {
          address: accounts[0].address,
          algo: accounts[0].algo,
          pubKey: accounts[0].pubKey,
          isNanoLedger: accounts[0].isNanoLedger || false,
        };
        setAccount(newAccount);
      } else {
        setAccount(null);
      }
    });

    return cleanup;
  }, []);

  return (
    <WalletContext.Provider value={{ 
      account, 
      isConnected: !!account,
      setAccount 
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
