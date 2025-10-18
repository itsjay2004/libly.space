
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { useTheme } from "next-themes";
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { CustomLink } from "@/components/ui/custom-link";
import { Settings, LogOut, Moon, Sun } from 'lucide-react';

export function UserMenu() {
    const router = useRouter();
    const { user } = useUser();
    const { setTheme } = useTheme();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
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
    );
}
