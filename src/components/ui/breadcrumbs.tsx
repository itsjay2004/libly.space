'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");

    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return { href, label };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm text-muted-foreground", className)}
    >
      <Link href="/" className="hover:text-foreground">
        Home
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center">
          <ChevronRight className="mx-2 h-4 w-4" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}