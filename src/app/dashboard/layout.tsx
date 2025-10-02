"use client";

import type { ReactNode } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { LayoutDashboard, Users, Settings, LogOut, ChevronDown, Armchair, CreditCard, Bell } from 'lucide-react';
import Logo from "@/components/logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/dashboard/students", label: "Students", icon: <Users /> },
    { href: "/dashboard/seats", label: "Seats", icon: <Armchair /> },
    { href: "/dashboard/payments", label: "Payments", icon: <CreditCard /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings /> },
  ];

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
             <Logo />
             <h1 className="text-xl font-semibold font-headline text-foreground">Library Admin</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
               <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton 
                    isActive={pathname === item.href} 
                    tooltip={item.label}
                  >
                    {item.icon}
                    {item.label}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
         {/* Can be used for user profile, logout, etc. */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between h-20 px-4 sm:px-8">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
           <div className="flex items-center gap-4">
            {/* Can add breadcrumbs or page title here */}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-auto p-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="https://picsum.photos/seed/admin/40/40" />
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                       <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium text-foreground">Admin</p>
                        <p className="text-xs text-muted-foreground">admin@libly.space</p>
                      </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">Admin</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                admin@libly.space
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
