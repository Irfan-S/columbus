import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";
import { BottomNav } from "@/components/layout/bottom-nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Columbus — Dive Site Comparison",
  description:
    "Find dive sites similar to your favorites. Compare pelagic life, macro, landscape, currents, and visibility across dive sites worldwide.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Columbus",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c4a6e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground pb-16 sm:pb-0">
        <TooltipProvider>
          {children}
          <BottomNav />
        </TooltipProvider>
        <footer className="text-xs text-muted-foreground text-center py-2 px-4 border-t mb-16 sm:mb-0">
          © Columbus contributors · Dive site data:{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            © OpenStreetMap contributors
          </a>{" "}
          (<a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">ODbL 1.0</a>
          ) ·{" "}
          <a href="https://www.diveboard.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Diveboard
          </a>{" "}
          (<a href="https://creativecommons.org/licenses/by-nc-nd/3.0/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">CC BY-NC-ND 3.0</a>
          ) · © Mapbox
        </footer>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
