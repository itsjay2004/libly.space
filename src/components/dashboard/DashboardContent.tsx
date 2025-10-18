
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

export function DashboardContent({ children }: { children: ReactNode }) {
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

    let currentPage = menuItems.find((item) => pathname === item.href);

    const isDashboardPage = pathname === '/dashboard';

    return (
        <div className="h-screen p-2">
            <div className="bg-white dark:bg-black/80 rounded rounded-2xl h-full flex flex-col">
                <header className="flex items-center justify-between h-20 px-4 sm:px-8">
                    <div className="flex justify-between border-b w-full py-4">
                        <div className="flex items-center gap-4">
                            <div className="md:hidden">
                                <SidebarTrigger />
                            </div>
                            <div className="">
                                {currentPage && (
                                    <>
                                        <h1 className="text-xl font-bold tracking-tight">{isDashboardPage ? `👋 Hi ${user?.user_metadata.full_name || "User"}` : `${currentPage.title}`} </h1>
                                        <p className="text-sm text-muted-foreground">{currentPage.description}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="bg-gray-200 dark:bg-zinc-800">
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
