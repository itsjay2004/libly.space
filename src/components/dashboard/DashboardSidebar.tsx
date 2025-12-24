
'use client';

import { usePathname } from 'next/navigation';
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
} from '@/components/ui/sidebar';
import Logo from "@/components/logo";
import { CustomLink } from "@/components/ui/custom-link";
import { menuItems } from '@/constants/menu-items';
import { UserMenu } from '@/components/dashboard/UserMenu';


export function DashboardSidebar() {
    const pathname = usePathname();
    

    return (
        <Sidebar variant="inset" collapsible="offcanvas">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3">
                    <Logo />
                </div>
            </SidebarHeader>
            <SidebarContent className="ml-3 mt-1">
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <CustomLink
                                href={item.href}
                            >
                                <SidebarMenuButton
                                    isActive={pathname === item.href}
                                    tooltip={item.label}
                                    className={pathname === item.href ? 'bg-white dark:bg-black/80 border border-black-4 shadow-md p-4 font-bold' : 'hover:bg-blue-100 dark:hover:bg-zinc-800'}
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
                <UserMenu />
            </SidebarFooter>
        </Sidebar>
    );
}
