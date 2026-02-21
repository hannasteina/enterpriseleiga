import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Enterprise Leiga",
  description: "Leigukerfi - Enterprise Leiga",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="is">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white font-bold text-lg">
                E
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Enterprise Leiga
              </span>
            </a>

            <div className="hidden sm:flex items-center gap-6">
              <a
                href="/"
                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Forsíða
              </a>
              <a
                href="/leiga"
                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Leiga
              </a>
              <a
                href="/um"
                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Um okkur
              </a>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/innskraning"
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-dark)] transition-colors"
              >
                Innskráning
              </a>
            </div>
          </div>
        </nav>

        <main className="min-h-[calc(100vh-4rem)]">{children}</main>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-[var(--muted)]">
                &copy; {new Date().getFullYear()} Enterprise Leiga. Allur réttur áskilinn.
              </p>
              <div className="flex gap-4">
                <a
                  href="/skilmalar"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Skilmálar
                </a>
                <a
                  href="/personuvernd"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Persónuvernd
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
