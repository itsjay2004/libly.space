'use client';

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-muted/70 bg-background text-sm">
      <div className="container mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Links */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-muted-foreground">
          <Link href="https://libly.space/about-us" className="hover:text-foreground transition-colors" target="_blank">About</Link>
          <Link href="https://libly.space/contact" className="hover:text-foreground transition-colors" target="_blank">Contact</Link>
          <Link href="https://libly.space/privacy-policy" className="hover:text-foreground transition-colors" target="_blank">Privacy</Link>
          <Link href="https://libly.space/terms-conditions" className="hover:text-foreground transition-colors" target="_blank">Terms</Link>
        </div>

        {/* Right: Copyright */}
        <p className="text-center sm:text-right text-xs text-muted-foreground w-full sm:w-auto">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
            Libly.space
          </span>{" "}
          — All rights reserved.
        </p>
      </div>
    </footer>
  );
}
