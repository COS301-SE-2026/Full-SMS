import { Public_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/auth/ClientLayout";
import { AuthProvider } from "@/contexts/authContext/AuthContext";
import { ToastProvider } from "@/contexts/toastContext/ToastContext";
import { Hdf5DataProvider } from "@/contexts/Hdf5DataContext";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ToastProvider>
          <AuthProvider>
            <Hdf5DataProvider>
              <ClientLayout>{children}</ClientLayout>
            </Hdf5DataProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
