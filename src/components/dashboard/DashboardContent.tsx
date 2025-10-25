
'use client';

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from "@/hooks/use-user";
import ImportStatusBanner from '@/components/dashboard/import-status-banner';
import { menuItems } from '@/constants/menu-items';
import { Banners } from '@/components/dashboard/Banners';

interface DashboardContentProps {
    children: ReactNode;
}

export function DashboardContent({ children }: DashboardContentProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading, userDetails } = useUser();
    const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        } else if (!isLoading && userDetails) {
            setOnboardingStatus(userDetails.onboarding_status);
        }
    }, [user, isLoading, router, userDetails]);

    let titleToDisplay: string = "";
    let descriptionToDisplay: string = "";

    // Check for the specific dynamic student profile route
    if (pathname.startsWith("/dashboard/students/") && pathname !== "/dashboard/students") {
        titleToDisplay = "Student Profile";
        descriptionToDisplay = "Detailed view and management of a student's information.";
    } else if (pathname === "/dashboard") {
        // Special handling for the exact dashboard home page
        const dashboardItem = menuItems.find(item => item.href === "/dashboard");
        titleToDisplay = `👋 Hi ${userDetails?.full_name || "User"}`;
        descriptionToDisplay = dashboardItem?.description || "";
    } else {
        // For all other direct /dashboard/* pages, find the best match
        // Exclude the root dashboard from this search to allow specific sub-pages to match first
        let currentPage = menuItems.find((item) => pathname.startsWith(item.href) && item.href !== "/dashboard");

        if (currentPage) {
            titleToDisplay = currentPage.title;
            descriptionToDisplay = currentPage.description;
        } else {
          // Fallback for unmatched routes, if necessary
          titleToDisplay = "Dashboard"; // Generic fallback
          descriptionToDisplay = "View and manage your library data."; // Generic fallback
        }
    }

    return (
        <div className="h-screen p-2">
            <div className="subtle-gradient dark:bg-zinc-900 rounded-2xl h-full flex flex-col">
                <header className="flex items-center justify-between h-20 px-4 sm:px-8">
                    <div className="flex justify-between border-b w-full py-4">
                        <div className="flex items-center gap-4">
                            <div className="md:hidden">
                                <SidebarTrigger />
                            </div>
                            <div className="">
                                <h1 className="text-xl font-bold tracking-tight">{titleToDisplay} </h1>
                                {descriptionToDisplay && <p className="text-sm text-muted-foreground">{descriptionToDisplay}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="bg-gray-200 dark:bg-zinc-800 rounded-full">
                                <Bell className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto no-scrollbar">
                    <div className="flex flex-col gap-4 mb-4">
                        {onboardingStatus === 'importing' && <ImportStatusBanner />}
                        <Banners />
                    </div>
                    {children}
                </main>
            </div>
        </div>
    );
}
