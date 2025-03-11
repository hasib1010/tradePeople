// src/components/common/Navbar.js
"use client"
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

// Create a global event for refreshing unread counts
export const refreshUnreadCount = () => {
  // Use a custom event to trigger refresh across components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('refresh-unread-count'));
  }
};

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setIsMenuOpen(false);
      setIsProfileMenuOpen(false);
    };

    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (status === 'authenticated') {
      try {
        const response = await fetch('/api/messages/unread?t=' + new Date().getTime());
        if (response.ok) {
          const data = await response.json();
          setUnreadMessages(data.count);
        }
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
      }
    }
  };

  // Listen for the global refresh event
  useEffect(() => {
    const handleRefresh = () => {
      fetchUnreadCount();
    };

    window.addEventListener('refresh-unread-count', handleRefresh);
    return () => window.removeEventListener('refresh-unread-count', handleRefresh);
  }, []);

  // Fetch unread counts on load and when pathname changes
  useEffect(() => {
    fetchUnreadCount();

    // Poll for new messages every 30 seconds
    const intervalId = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(intervalId);
  }, [status, pathname, searchParams]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
    setIsProfileMenuOpen(false);
  };

  const handleProfileMenuClick = (e) => {
    e.stopPropagation();
    setIsProfileMenuOpen(!isProfileMenuOpen);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    toast.success("Signed Out", {
      onClose: () => {
        signOut({ redirect: true, callbackUrl: "/" }); // Redirect after toast disappears
      },
    });
  };

  const isAuthenticated = status === "authenticated";
  const userRole = session?.user?.role || "";

  // Role-specific navigation items
  const getNavItems = () => {
    // Common nav items for all users
    const commonItems = [
      {
        href: "/",
        label: "Home",
        isActive: pathname === "/"
      }
    ];

    // Items for authenticated users
    if (isAuthenticated) {
      switch (userRole) {
        case "admin":
          return [
            {
              href: "/dashboard/admin",
              label: "Dashboard",
              isActive: pathname.includes("/dashboard")
            },
            {
              href: "/admin/users",
              label: "Manage Users",
              isActive: pathname.includes("/admin/users")
            },
            {
              href: "/admin/tradespeople",
              label: "Manage Tradespeople",
              isActive: pathname.includes("/admin/tradespeople")
            },
            {
              href: "/admin/jobs/manage",
              label: "Manage Jobs",
              isActive: pathname.includes("/admin/jobs/manage")
            },
            {
              href: "/admin/verifications",
              label: "Verifications",
              isActive: pathname.includes("/admin/verifications")
            }
          ];
        case "tradesperson":
          return [

            {
              href: "/jobs",
              label: "Find Jobs",
              isActive: pathname === "/jobs" || pathname.startsWith("/jobs/")
            },
            {
              href: "/dashboard/tradesperson",
              label: "Dashboard",
              isActive: pathname.includes("/dashboard")
            },
            {
              href: "/applications",
              label: "My Applications",
              isActive: pathname.includes("/applications")
            },
            {
              href: "/messages",
              label: "Messages",
              isActive: pathname === "/messages" || pathname.startsWith("/messages/"),
              badge: unreadMessages > 0 ? unreadMessages : null
            }
          ];
        case "customer":
          return [

            {
              href: "/tradespeople",
              label: "Find Tradespeople",
              isActive: pathname === "/tradespeople" || pathname.startsWith("/tradespeople/")
            },
            {
              href: "/dashboard/customer",
              label: "Dashboard",
              isActive: pathname.includes("/dashboard")
            },
            {
              href: "/jobs/post",
              label: "Post a Job",
              isActive: pathname === "/jobs/post"
            },
            {
              href: "/my-jobs",
              label: "My Jobs",
              isActive: pathname === "/my-jobs" || pathname.startsWith("/my-jobs/")
            },
            {
              href: "/messages",
              label: "Messages",
              isActive: pathname === "/messages" || pathname.startsWith("/messages/"),
              badge: unreadMessages > 0 ? unreadMessages : null
            }
          ];
        default:
          return commonItems;
      }
    } else {
      // Non-authenticated users
      return [
        ...commonItems,
        {
          href: "/jobs",
          label: "Find Jobs",
          isActive: pathname === "/jobs" || pathname.startsWith("/jobs/")
        },
        {
          href: "/tradespeople",
          label: "Find Tradespeople",
          isActive: pathname === "/tradespeople" || pathname.startsWith("/tradespeople/")
        }
      ];
    }
  };

  // Get profile menu items based on role
  const getProfileMenuItems = () => {
    const commonItems = [
      {
        href: `/dashboard/${userRole}`,
        label: "Dashboard"
      },
      {
        href: "/profile",
        label: "Profile"
      },
      {
        href: "/messages",
        label: "Messages",
        badge: unreadMessages > 0 ? unreadMessages : null
      }
    ];

    switch (userRole) {
      case "admin":
        return [
          ...commonItems,
          {
            href: "/admin/settings",
            label: "Platform Settings"
          }
        ];
      case "tradesperson":
        return [
          ...commonItems,
          {
            href: "/credits",
            label: "Credits"
          },
          {
            href: "/subscriptions",
            label: "Subscription"
          },
          {
            href: "/portfolio",
            label: "Portfolio"
          }
        ];
      case "customer":
        return [
          ...commonItems,
          {
            href: "/my-jobs",
            label: "My Jobs"
          },
          {
            href: "/favorites",
            label: "Saved Tradespeople"
          }
        ];
      default:
        return commonItems;
    }
  };

  const navItems = getNavItems();
  const profileMenuItems = isAuthenticated ? getProfileMenuItems() : [];

  return (
    <nav className="bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/new Logo.png"
                  alt="MyTradePerson"
                  width={50}
                  height={50}
                  className="rounded-lg shadow-lg object-cover "
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${item.isActive
                    ? "border-green-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={handleProfileMenuClick}
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none ring-2 ring-offset-2 ring-green-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </span>
                    )}
                    {session.user.profileImage || session.user.image ? (
                      <Image
                        className="h-10 w-10 object-cover rounded-full"
                        src={session.user.profileImage || session.user.image}
                        alt={session.user.name || "User profile"}
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                        {session.user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </button>
                </div>

                {/* Role-based Profile dropdown */}
                {isProfileMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-gray-500 text-xs">{session.user.email}</p>
                      <p className="text-xs font-medium text-green-600 mt-1 capitalize">{userRole}</p>
                    </div>

                    {profileMenuItems.map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 relative"
                        role="menuitem"
                      >
                        {item.label}
                        {item.badge && (
                          <span className="absolute right-4 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </Link>
                    ))}

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex sm:items-center">
                <Link
                  href="/login"
                  className="block text-center border border-pink-600 hover:text-pink-600 px-6 py-2 rounded-md transition-all bg-pink-600 hover:bg-transparent text-white"
                >
                  Sign in
                </Link>

                <Link
                  href="/register"
                  className="ml-4 block text-center border border-green-600 text-green-600 px-6 py-2 rounded-md transition-all hover:bg-green-600 hover:text-white"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={handleMenuClick}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu - role specific */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center justify-between pl-3 pr-4 py-2 border-l-4 text-base font-medium ${item.isActive
                  ? "border-green-500 text-green-700 bg-green-50"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                {/* Show profile menu items in mobile menu too */}
                {profileMenuItems.map((item, index) => (
                  <Link
                    key={`profile-${index}`}
                    href={item.href}
                    className="flex items-center justify-between pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                ))}

                <button
                  onClick={handleLogout}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-gray-50 hover:border-red-300 hover:text-red-700"
                >
                  Sign out
                </button>
              </>
            )}

            {!isAuthenticated && (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="space-y-2 px-3">
                  <Link
                    href="/login"
                    className="block text-center border border-pink-600 hover:text-pink-600 px-6 py-2 rounded-md transition-all bg-pink-600 hover:bg-transparent text-white"
                  >
                    Sign in
                  </Link>

                  <Link
                    href="/register"
                    className="lg:ml-4 block text-center border border-green-600 text-green-600 px-6 py-2 rounded-md transition-all hover:bg-green-600 hover:text-white"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}