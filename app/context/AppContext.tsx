"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type AppContextType = {
  uploadedDocs: number;
  totalDocs: number;
  setUploadedDocs: (val: number) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [uploadedDocs, setUploadedDocs] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("uploadedDocs");
    return saved ? Number(saved) : 0;
  });
  const totalDocs = 15;

  // 🔥 SAVE TO LOCAL STORAGE
  useEffect(() => {
    localStorage.setItem("uploadedDocs", uploadedDocs.toString());
  }, [uploadedDocs]);

  return (
    <AppContext.Provider
      value={{ uploadedDocs, totalDocs, setUploadedDocs }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("Context not found");
  return context;
}