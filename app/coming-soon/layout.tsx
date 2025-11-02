import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://finishmywork.com"),
  title: "FinishMyWork - Coming Soon",
  description:
    "FinishMyWork — where students outsource the grind & take back their freedom. Join our waitlist to get early access and updates.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "FinishMyWork - Coming Soon",
    description:
      "FinishMyWork — where students outsource the grind & take back their freedom. Join our waitlist to get early access and updates.",
    url: "https://finishmywork.com",
    siteName: "FinishMyWork",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FinishMyWork — get your assignments done, enjoy your life.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinishMyWork - Coming Soon",
    description:
      "FinishMyWork — where students outsource the grind & take back their freedom. Join our waitlist to get early access and updates.",
    images: ["/og-image.png"],
  },
};

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
