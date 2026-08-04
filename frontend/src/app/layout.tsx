import type { Metadata } from "next";
import { Providers } from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Intellix — Premium AI Generation Platform", template: "%s | Intellix" },
  description: "Generate stunning AI images, videos, logos, and more with the world's most advanced creative platform.",
  openGraph: {
    title: "Intellix — Premium AI Generation Platform",
    description: "Generate stunning AI images, videos, logos, and more.",
    siteName: "Intellix",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
