import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Toaster } from "react-hot-toast";
import Navbar from '@/components/Navbar';
import logo from '../logo.png';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Celebra - Social Media",
  description: "Connect with friends and share your moments",
  icons: {
    icon: logo.src,
    apple: logo.src,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href={logo.src} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
            <Navbar />
            {children}
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
