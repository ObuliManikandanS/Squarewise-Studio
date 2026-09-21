import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VortexPlots | Tamil Nadu Property Intelligence",
  description: "Research 38 Tamil Nadu districts, calculate property scenarios and space efficiency, and download transparent analysis reports.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
