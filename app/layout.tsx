import type { Metadata } from "next";
import { Aleo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/shared/toaster";

const aleo = Aleo({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

const aleoHeading = Aleo({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dropwell",
  description: "Track every delivery and keep customers informed.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      suppressHydrationWarning 
      lang="en"
      className={cn("h-full", "antialiased", aleo.variable, aleoHeading.variable, geistMono.variable)}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
