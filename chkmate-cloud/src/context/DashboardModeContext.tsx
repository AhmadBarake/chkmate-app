import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type DashboardMode = 'full' | 'simplified';

interface DashboardModeContextType {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
}

const DashboardModeContext = createContext<DashboardModeContextType>({
  mode: 'full',
  setMode: () => {},
});

const STORAGE_KEY = 'chkmate-dashboard-mode';

export function DashboardModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DashboardMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'simplified' ? 'simplified' : 'full';
  });

  const setMode = (newMode: DashboardMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  return (
    <DashboardModeContext.Provider value={{ mode, setMode }}>
      {children}
    </DashboardModeContext.Provider>
  );
}

export function useDashboardMode() {
  return useContext(DashboardModeContext);
}
