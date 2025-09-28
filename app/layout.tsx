import "./globals.css";
import type { Metadata } from "next";
import { Crimson_Text, Inter } from "next/font/google";
import Header from "../components/Header";

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-crimson-text",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BookBlend",
  description: "Like Spotiify Blend, but for Goodreads",
  openGraph: {
    title: "BookBlend",
    description: "Like Spotiify Blend, but for Goodreads",
    images: [
      {
        url: "/img/Social.png",
        width: 1200,
        height: 630,
        alt: "BookBlend - Like Spotiify Blend, but for Goodreads",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookBlend",
    description: "Like Spotiify Blend, but for Goodreads",
    images: ["/img/Social.png"],
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-screen antialiased ${inter.variable} ${crimsonText.variable}`}>
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 lg:py-12">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
