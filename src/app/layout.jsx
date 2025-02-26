import { Inter } from "next/font/google";
import ClientLayout from "@/components/layout/ClientLayout";
import ToastProvider from "@/components/layout/TostProvider"; // Import the new component
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "tradePeople - Connect with Skilled Tradespeople",
  description:
    "Find skilled tradespeople for your projects or grow your trade business with exclusive leads",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider /> 
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
