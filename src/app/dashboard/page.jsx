"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { redirect } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login?callbackUrl=/dashboard");
    },
  });

  const router = useRouter();

  useEffect(() => {
    // If authenticated, redirect to the role-specific dashboard
    if (status === "authenticated" && session?.user?.role) {
      router.push(`/dashboard/${session.user.role}`);
    }
  }, [status, session, router]);

  // Loading state while checking auth status
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    );
  }

  // This should never be reached if onUnauthenticated is working properly
  return null;
}