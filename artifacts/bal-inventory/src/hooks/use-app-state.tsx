import React, { createContext, useContext, useState, useEffect } from "react";

interface AppStateContextType {
  seasonId: number | undefined;
  marketId: number | undefined;
  setSeasonId: (id: number | undefined) => void;
  setMarketId: (id: number | undefined) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  // Try to load from localStorage
  const [seasonId, setSeasonId] = useState<number | undefined>(() => {
    const saved = localStorage.getItem("bal_seasonId");
    return saved ? parseInt(saved) : undefined;
  });
  
  const [marketId, setMarketId] = useState<number | undefined>(() => {
    const saved = localStorage.getItem("bal_marketId");
    return saved ? parseInt(saved) : undefined;
  });

  // Save to localStorage when changed
  useEffect(() => {
    if (seasonId !== undefined) localStorage.setItem("bal_seasonId", seasonId.toString());
    else localStorage.removeItem("bal_seasonId");
  }, [seasonId]);

  useEffect(() => {
    if (marketId !== undefined) localStorage.setItem("bal_marketId", marketId.toString());
    else localStorage.removeItem("bal_marketId");
  }, [marketId]);

  return (
    <AppStateContext.Provider value={{ seasonId, marketId, setSeasonId, setMarketId }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
