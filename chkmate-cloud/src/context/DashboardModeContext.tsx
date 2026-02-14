import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type DashboardMode = 'lite' | 'full' | 'simplified';

interface DashboardModeContextType {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
}

const DashboardModeContext = createContext<DashboardModeContextType>({
  mode: 'lite',
  setMode: () => {},
});

const STORAGE_KEY = 'chkmate-dashboard-mode';

export function DashboardModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DashboardMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'full' || stored === 'simplified' || stored === 'lite') return stored;
    return 'lite';
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
