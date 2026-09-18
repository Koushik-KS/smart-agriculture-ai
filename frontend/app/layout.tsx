import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Agriculture AI",
  description:
    "AI-powered agricultural intelligence for crop recommendation, plant disease detection, yield prediction, and decision support.",
  keywords: [
    "Smart Agriculture AI",
    "Agriculture AI",
    "Crop Recommendation",
    "Plant Disease Detection",
    "Yield Prediction",
    "Machine Learning",
    "Artificial Intelligence",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}