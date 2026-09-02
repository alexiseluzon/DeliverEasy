import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "DelivEasy — Vendor Dashboard",
  description: "Manage catalog, orders, and deliveries in one place.",
  metadataBase: new URL("https://delivereasy.example.com"),
  openGraph: {
    title: "DelivEasy — Vendor Dashboard",
    description: "Manage catalog, orders, and deliveries in one place.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DelivEasy",
  applicationCategory: "BusinessApplication",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ToastProvider>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main id="main-content" style={{ flex: 1, padding: 32 }}>
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
