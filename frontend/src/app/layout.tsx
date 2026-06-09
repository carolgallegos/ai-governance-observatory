import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Nav } from "@/components/Nav";
import { ObservatoryBar } from "@/components/ObservatoryBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Governance Observatory",
  description: "Compare national AI policies, AGRI scores, and document-backed analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Nav />
        <ObservatoryBar />
        <main className="container main-content">{children}</main>
        <footer className="container footer">
          <p>
            <strong>AI Governance Observatory</strong> — built by{" "}
            <a href="https://github.com/carolgallegos">Carol V. Gallegos</a>. Compare tool for national AI policy;
            not legal advice.
          </p>
          <p className="footer-links">
            <a href="https://github.com/carolgallegos/ai-governance-observatory">GitHub</a>
            <span aria-hidden> · </span>
            <a href="/methodology">Methodology</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
