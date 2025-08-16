import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BookBlend",
  description: "Compare Goodreads users and discover overlap",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold">BookBlend</h1>
            <p className="text-sm text-gray-600">Like Spotify Blend, but for books.</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
