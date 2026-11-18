
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hostelhub-vert.vercel.app"),
  title: {
    default: "HostelHub – Hostel Snack Ordering",
    template: "%s · HostelHub",
  },
  description: "Order snacks, drinks and noodles from HostelHub.",
  applicationName: "HostelHub",
  manifest: "/manifest.json",
  openGraph: {
    title: "HostelHub – Hostel Snack Ordering",
    description: "Your hostel snack ordering app.",
    images: ["/HostelHub-logo.png"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SplashScreen>{children}</SplashScreen>
      </body>
    </html>
  );
}
