export const dynamic = "force-dynamic";

import Navbar from "@/src/components/Navbar/Navbar";
import Announcement from "@/src/components/Announcement/Announcement";
import Footer from "@/src/components/Footer/Footer";
import CookieBanner from "@/src/components/Cookie/Cookie";
import WhatsAppButton from "@/src/components/WhatsappButton/WhatsappButton";
import ScrollToTop from "@/src/components/Scrolltotop/Scrolltotop";
import Providers from "./providers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "WIN-DIA — The Divine Healthy Crunch",
    template: "%s | WIN-DIA",
  },
  description: "WIN-DIA — premium low-GI, gluten-free, and vegan khakhra snacks made in India. Shop healthy crunch delivered pan-India.",
  keywords: ["khakhra", "healthy snacks", "low GI snacks", "gluten free snacks", "vegan snacks India", "WIN-DIA"],
  openGraph: {
    type: "website",
    siteName: "WIN-DIA",
    title: "WIN-DIA — The Divine Healthy Crunch",
    description: "Premium low-GI, gluten-free, and vegan khakhra snacks. Shop healthy crunch delivered pan-India.",
    url: siteUrl,
    images: [{ url: "/images/hero-bg.png", width: 1200, height: 630, alt: "WIN-DIA — The Divine Healthy Crunch" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WIN-DIA — The Divine Healthy Crunch",
    description: "Premium low-GI, gluten-free, and vegan khakhra snacks, delivered pan-India.",
    images: ["/images/hero-bg.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <Providers>
          <Navbar />
          <Announcement />

          <main id="main-content">
            {children}
          </main>

          <Footer />
        </Providers>
        <CookieBanner />
        <WhatsAppButton />
        <ScrollToTop />
      </body>
    </html>
  );
}