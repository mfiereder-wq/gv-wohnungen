import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { Toaster as SonnerToaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GV Wohnungen – Bezahlbare Mietwohnungen in der Schweiz",
  description:
    "Finde guenstige Wohnungen in der Schweiz. Echte Inserate von flatfox.ch. Filtere nach Kanton, Preis und Zimmeranzahl.",
  keywords: [
    "Wohnung",
    "Miete",
    "Schweiz",
    "guenstig",
    "Immobilien",
    "Mietwohnung",
    "Wohnungssuche",
  ],
  authors: [{ name: "GV Wohnungen" }],
  openGraph: {
    title: "GV Wohnungen – Bezahlbare Mietwohnungen in der Schweiz",
    description:
      "Echte Wohnungen Schweiz von flatfox.ch. Links freischalten fuer CHF 5.90 / Woche.",
    siteName: "GV Wohnungen",
    type: "website",
    locale: "de_CH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de-CH" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster />
            <SonnerToaster
              position="top-center"
              richColors
              closeButton
              toastOptions={{
                style: { fontFamily: "var(--font-geist-sans)" },
              }}
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
