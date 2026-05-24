import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MilkGuard - Virtual Milk Adulteration Detection Lab",
  description: "Interactive 3D simulation for detecting milk adulterants - BITsathy Hackathon 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0a0f1e" }}>
        {children}
      </body>
    </html>
  );
}