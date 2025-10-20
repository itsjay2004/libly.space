'use client';

import { ReactNode } from "react";
import { SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { SidebarProvider } from "@/contexts/SidebarContext";
// --- NEW: Import the UserProvider ---
import { UserProvider } from "@/contexts/UserContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // --- MODIFICATION: Wrap the entire dashboard with UserProvider ---
    <UserProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <DashboardContent>{children}</DashboardContent>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}
