'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, differenceInDays } from "date-fns";
import Link from 'next/link';

// --- MODIFICATION: Define a specific type for the students this component receives ---
interface ExpiringStudent {
    id: string;
    name: string;
    membership_expiry_date: string;
}

interface ExpiringSoonProps {
    // --- MODIFICATION: This component now receives its data as a prop ---
    expiringStudents: ExpiringStudent[];
}

// --- MODIFICATION: The component is now a standard functional component ---
export default function ExpiringSoon({ expiringStudents }: ExpiringSoonProps) {

    // --- REMOVED: All `useState`, `useEffect`, `useCallback` and data fetching logic ---
    // The component is now much simpler and only responsible for displaying data.

    const getDaysLeftText = (expiryDate: string) => {
        const days = differenceInDays(new Date(expiryDate), new Date());
        if (days < 0) return 'Expired';
        if (days === 0) return 'Expires today';
        if (days === 1) return 'Expires in 1 day';
        return `Expires in ${days} days`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Expiring Soon</CardTitle>
                <CardDescription>Students whose memberships are ending in the next 10 days.</CardDescription>
            </CardHeader>
            <CardContent>
                {expiringStudents && expiringStudents.length > 0 ? (
                    <div className="space-y-4">
                        {expiringStudents.map((student) => (
                            <Link href={`/dashboard/students/${student.id}`} key={student.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted transition-colors">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt={student.name} />
                                    <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {getDaysLeftText(student.membership_expiry_date)}
                                    </p>
                                </div>
                            </Link>
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
