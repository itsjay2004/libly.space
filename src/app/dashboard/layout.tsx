
'use client';

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { LayoutDashboard, Users, Settings, LogOut, Armchair, CreditCard, Bell, Moon, Sun } from 'lucide-react';
import Logo from "@/components/logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { CustomLink } from "@/components/ui/custom-link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { setTheme } = useTheme();
  const supabase = createClient();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard />, title: "Dashboard", description: "An overview of your library's status." },
    { href: "/dashboard/students", label: "Students", icon: <Users />, title: "Student Management", description: "Add, view, and manage student profiles." },
    { href: "/dashboard/seats", label: "Seats", icon: <Armchair />, title: "Seat Management", description: "Visually manage seat assignments for each shift." },
    { href: "/dashboard/payments", label: "Payments", icon: <CreditCard />, title: "Payment Management", description: "Record new payments and view transaction history." },
    { href: "/dashboard/library", label: "Library", icon: <Settings />, title: "Library Settings", description: "Configure your library's capacity and shifts." },
    { href: "/dashboard/account", label: "Account", icon: <Users />, title: "Account Settings", description: "Manage your account details." },
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
        <SidebarContent className="ml-3 mt-1">
          <SidebarMenu>
            {menuItems.map((item) => (
               <SidebarMenuItem key={item.href}>
                <CustomLink href={item.href}>
                  <SidebarMenuButton 
                    isActive={pathname === item.href} 
                    tooltip={item.label}
                  >
                    {item.icon}
                    {item.label}
                  </SidebarMenuButton>
                </CustomLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                       <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{user?.user_metadata?.full_name ?? 'Admin'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2" align="end" forceMount side="top">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name ?? 'Admin'}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <CustomLink href="/dashboard/account">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Account</span>
                        </CustomLink>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span>Toggle theme</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => setTheme("light")}>
                            Light
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTheme("dark")}>
                            Dark
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTheme("system")}>
                            System
                          </DropdownMenuItem>
                          </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-red-300 dark:hover:bg-red-300">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
          </DropdownMenu>
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
            <Button variant="ghost" size="icon" className="bg-gray-200 dark:bg-gray-200">
                <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
