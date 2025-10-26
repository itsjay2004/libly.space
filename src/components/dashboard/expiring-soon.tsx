'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, differenceInDays } from "date-fns";
import { CustomLink } from "@/components/ui/custom-link";

interface ExpiringStudent {
    id: string;
    name: string;
    membership_expiry_date: string;
}

interface ExpiringSoonProps {
    expiringStudents: ExpiringStudent[];
}

export default function ExpiringSoon({ expiringStudents }: ExpiringSoonProps) {
    const getDaysLeftText = (expiryDate: string) => {
        const days = differenceInDays(new Date(expiryDate), new Date());
        if (days < 0) return 'Expired';
        if (days === 0) return 'Expires today';
        if (days === 1) return 'Expires in 1 day';
        return `Expires in ${days} days`;
    };

    return (
        <Card className="expiring-soon-card rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-pink-100/40 p-4 shadow-sm">
            <CardHeader>
                <CardTitle>Expiring Soon</CardTitle>
                <CardDescription>Memberships ending in the next 10 days.</CardDescription>
            </CardHeader>
            <CardContent>
                {expiringStudents && expiringStudents.length > 0 ? (
                    <div className="space-y-2">
                        {expiringStudents.map((student) => (
                            <CustomLink 
                                href={`/dashboard/students/${student.id}`} 
                                key={student.id} 
                                className="flex items-center gap-4 p-3 rounded-lg bg-background/50 hover:bg-muted transition-colors border"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}&backgroundColor=b6e3f4,ffd5dc,ffdfbf,d0bfff,bddff4&fontSize=50&fontFamily=Helvetica&radius=10`} alt={student.name} />
                                    <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {getDaysLeftText(student.membership_expiry_date)}
                                    </p>
                                </div>
                            </CustomLink>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        No memberships are expiring soon.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
