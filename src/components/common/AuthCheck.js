// src/components/common/AuthCheck.js
"use client"
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthCheck({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  redirectTo = "/login"
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
      router.push(`/dashboard/${session.user.role}`);
    }
  }, [session, status, router, allowedRoles, redirectTo, pathname]);
  
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!session) {
    return fallback;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    return fallback;
  }
  
  return children;
}