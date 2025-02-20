// src/middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  console.log("Middleware running on:", request.nextUrl.pathname);
  
  // Get token from request
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-dont-use-this-in-production",
    secureCookie: process.env.NODE_ENV === "production",
  });
  
  // Log token details for debugging
  console.log("Token in middleware:", {
    exists: !!token,
    id: token?.id?.substring(0, 5) || 'none',
    email: token?.email || 'none',
    role: token?.role || 'none',
    path: request.nextUrl.pathname
  });
  
  // Define protected routes
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/jobs/post") ||
    request.nextUrl.pathname.startsWith("/messages");
  
  // Define role-specific routes
  const isCustomerRoute = request.nextUrl.pathname.startsWith("/dashboard/customer");
  const isTradespersonRoute = request.nextUrl.pathname.startsWith("/dashboard/tradesperson");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/dashboard/admin");

  // If not authenticated and trying to access protected route
  if (!token && isProtectedRoute) {
    console.log("Redirecting unauthenticated user to login");
    
    // Store the full URL including protocol and host
    const redirectUrl = request.nextUrl.clone();
    const callbackUrl = encodeURIComponent(redirectUrl.pathname);
    
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
    );
  }

  // If authenticated and trying to access auth pages
  if (token && (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register" ||
    request.nextUrl.pathname === "/register-tradesperson"
  )) {
    console.log("Redirecting authenticated user to dashboard");
    return NextResponse.redirect(
      new URL(`/dashboard/${token.role}`, request.url)
    );
  }

  // Check role-based access for authenticated users
  if (token && isProtectedRoute) {
    console.log(`Checking role access: user role=${token.role}, route=${request.nextUrl.pathname}`);
    
    // Restrict customer routes to customers/admins
    if (isCustomerRoute && token.role !== "customer" && token.role !== "admin") {
      console.log("Redirecting to appropriate dashboard based on role");
      return NextResponse.redirect(
        new URL(`/dashboard/${token.role}`, request.url)
      );
    }
    
    // Restrict tradesperson routes to tradespeople/admins
    if (isTradespersonRoute && token.role !== "tradesperson" && token.role !== "admin") {
      console.log("Redirecting to appropriate dashboard based on role");
      return NextResponse.redirect(
        new URL(`/dashboard/${token.role}`, request.url)
      );
    }
    
    // Restrict admin routes to admins
    if (isAdminRoute && token.role !== "admin") {
      console.log("Redirecting to appropriate dashboard based on role");
      return NextResponse.redirect(
        new URL(`/dashboard/${token.role}`, request.url)
      );
    }
  }

  console.log("Middleware allowing request to proceed");
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/post",
    "/messages/:path*",
    "/login",
    "/register",
    "/register-tradesperson"
  ],
};