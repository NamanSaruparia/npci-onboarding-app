"use client";

import { createContext, useContext, useState, useEffect } from "react";

type AppContextType = {
  uploadedDocs: number;
  totalDocs: number;
  setUploadedDocs: (val: number) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: any) {
  const [uploadedDocs, setUploadedDocs] = useState(0);
  const totalDocs = 15;

  // 🔥 LOAD FROM LOCAL STORAGE
  useEffect(() => {
    const saved = localStorage.getItem("uploadedDocs");
    if (saved) {
      setUploadedDocs(Number(saved));
    }
  }, []);

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