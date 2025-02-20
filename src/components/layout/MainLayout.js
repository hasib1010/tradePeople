// src/components/layout/MainLayout.js
"use client"
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export default function MainLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    // Handle redirects based on authentication and path
    if (status === 'authenticated' && pathname === '/') {
      // If logged in and on landing page, redirect to dashboard
      const dashboardPath = `/dashboard/${session.user.role}`;
      router.replace(dashboardPath);
    }
  }, [status, session, pathname, router]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}