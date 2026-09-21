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
    "Finde günstige Wohnungen in der Schweiz. Echte Inserate von Flatfox, Homegate und Comparis. Filtere nach Kanton, Preis und Zimmeranzahl.",
  keywords: [
    "Wohnung",
    "Miete",
    "Schweiz",
    "günstig",
    "Immobilien",
    "Mietwohnung",
    "Wohnungssuche",
  ],
  authors: [{ name: "GV Wohnungen" }],
  openGraph: {
    title: "GV Wohnungen – Bezahlbare Mietwohnungen in der Schweiz",
    description:
      "Echte Wohnungen Schweiz von Flatfox, Homegate & Comparis. Inserat-Links freischalten für CHF 5.90 / Woche.",
    siteName: "GV Wohnungen",
    type: "website",
    locale: "de_CH",
    countryName: "Schweiz",
    url: "https://www.gv-wohnungen.online",
  },
  twitter: {
    card: "summary_large_image",
    title: "GV Wohnungen – Bezahlbare Mietwohnungen in der Schweiz",
    description: "Echte Wohnungen aus der Schweiz. Inserate von Flatfox, Homegate und Comparis.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
  alternates: {
    canonical: "https://www.gv-wohnungen.online",
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
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "GV Wohnungen",
              url: "https://www.gv-wohnungen.online",
              description:
                "Bezahlbare Mietwohnungen in der Schweiz – Inserate von Flatfox, Homegate und Comparis.",
              inLanguage: "de-CH",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://www.gv-wohnungen.online/?canton={canton}&maxRent={maxRent}",
                },
                "query-input": "required name=search_term",
              },
            }),
          }}
        />
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
