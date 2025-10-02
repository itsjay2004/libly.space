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
import { LayoutDashboard, Users, Settings, LogOut, Armchair, CreditCard, Bell } from 'lucide-react';
import Logo from "@/components/logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard />, title: "Dashboard", description: "An overview of your library's status." },
    { href: "/dashboard/students", label: "Students", icon: <Users />, title: "Student Management", description: "Add, view, and manage student profiles." },
    { href: "/dashboard/seats", label: "Seats", icon: <Armchair />, title: "Seat Management", description: "Visually manage seat assignments for each shift." },
    { href: "/dashboard/payments", label: "Payments", icon: <CreditCard />, title: "Payment Management", description: "Record new payments and view transaction history." },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings />, title: "Library Settings", description: "Configure your library's capacity and shifts." },
  ];

  let currentPage = menuItems.find((item) => pathname === item.href);

  if (pathname.startsWith('/dashboard/students/') && pathname !== '/dashboard/students') {
      currentPage = { href: pathname, label: "Student Profile", icon: <Users />, title: "Student Profile", description: "Detailed information about the student."}
  }


  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
             <Logo />
             <h1 className="text-xl font-semibold font-headline text-foreground">libly.space</h1>
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
        <header className="flex items-center justify-between h-20 px-4 border-b sm:px-8">
          <div className="flex items-center gap-4">
             <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div>
              {currentPage && (
                <>
                  <h1 className="text-xl font-bold tracking-tight">{currentPage.title}</h1>
                  <p className="text-sm text-muted-foreground">{currentPage.description}</p>
                </>
              )}
            </div>
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
