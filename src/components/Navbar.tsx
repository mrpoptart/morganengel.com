"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/", label: "Blog" },
  { href: "/trips", label: "Trips" },
  { href: "/tags", label: "Tags" },
  { href: "/about", label: "About" },
];

function isLinkActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  // daisyUI's dropdown stays open while the trigger holds focus; blurring it on
  // tap closes the mobile menu after a selection.
  const closeMenu = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="navbar bg-base-100/80 backdrop-blur-xl border-b border-base-content/5 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center"
        >
          <img src="/favicon.png" alt="ME" className="w-7 h-7" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = isLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-all duration-300 border-b-2 pb-0.5 ${
                  isActive
                    ? "text-primary border-primary"
                    : "text-base-content/60 border-transparent hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <div className="dropdown dropdown-end lg:hidden">
          <div
            tabIndex={0}
            role="button"
            aria-label="Open menu"
            className="btn btn-ghost btn-square"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu menu-lg bg-base-200 rounded-box shadow-2xl mt-3 w-60 p-2 gap-1 z-[1]"
          >
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  className={
                    isLinkActive(pathname, link.href)
                      ? "active font-medium"
                      : undefined
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {isAdmin && (
              <>
                <li className="menu-title px-0 py-0">
                  <div className="border-t border-base-content/10 my-1" />
                </li>
                <li>
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className={
                      pathname.startsWith("/admin")
                        ? "active font-medium"
                        : undefined
                    }
                  >
                    Admin
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
