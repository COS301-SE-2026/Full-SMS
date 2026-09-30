import type { Metadata } from "next";
import { Public_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/auth/ClientLayout";
import { AuthProvider } from "@/contexts/authContext/AuthContext";
import { ToastProvider } from "@/contexts/toastContext/ToastContext";
import { Hdf5DataProvider } from "@/contexts/hdf5Context/Hdf5DataContext";
import { AnalysisTabProvider } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import { BrandStyleProvider } from "@/contexts/brandStyleContext/brandStyleContext";
import { SessionDataProvider } from "@/contexts/sessionsContext/sessionContext";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Full SMS",
  description: "Single Molecule Spectroscopy Analysis Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ToastProvider>
          <BrandStyleProvider>
            <AuthProvider>
              <Hdf5DataProvider>
                <AnalysisTabProvider>
                  <SessionDataProvider>
                    <ClientLayout>{children}</ClientLayout>
                  </SessionDataProvider>
                </AnalysisTabProvider>
              </Hdf5DataProvider>
            </AuthProvider>
          </BrandStyleProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
