import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./context/AppContext";
import { NotificationProvider } from "./context/NotificationContext";

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
      <body className="min-h-screen bg-background text-foreground antialiased">

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--color-surface-elevated)",
              color: "var(--foreground)",
              border: "1px solid var(--border-subtle)",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "14px",
              boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
            },
          }}
        />

        {/* 🌐 GLOBAL STATE (VERY IMPORTANT) */}
        <NotificationProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </NotificationProvider>

      </body>
    </html>
  );
}