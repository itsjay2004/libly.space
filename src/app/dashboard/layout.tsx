
'use client';

import { ReactNode } from "react";
import { SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { SidebarProvider } from "@/contexts/SidebarContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardContent>{children}</DashboardContent>
      </SidebarInset>
    </SidebarProvider>
  );
}
