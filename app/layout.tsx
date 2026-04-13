import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./context/AppContext";

export const metadata = {
  title: "NPCI Onboarding App",
  description: "AI-enabled onboarding experience for NPCI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">

        {/* 🔔 GLOBAL TOAST */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#111",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "10px 14px",
              borderRadius: "10px",
            },
          }}
        />

        {/* 🌐 GLOBAL STATE (VERY IMPORTANT) */}
        <AppProvider>
          {children}
        </AppProvider>

      </body>
    </html>
  );
}