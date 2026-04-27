import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/context/providers";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "AlproShop",
  description: "Simple e-commerce built with Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>
        <Providers>
          <Navbar />
          <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}