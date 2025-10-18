import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import Link from "next/link";
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { format, addDays, startOfToday } from 'date-fns';
import type { Student } from '@/lib/types';

export default async function ExpiringSoon() {
  const cookieStore = cookies();
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: libraryData, error: libraryError } = await supabase
    .from('libraries')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (libraryError || !libraryData) {
    console.error("Dashboard Widget Error: Could not fetch library.", libraryError);
    return null;
  }

  const today = startOfToday();
  const sevenDaysFromNow = addDays(today, 7);

  const { data: expiringStudents, error: studentsError } = await supabase
    .from('students')
    .select('id, name, phone, membership_expiry_date')
    .eq('library_id', libraryData.id)
    .gte('membership_expiry_date', today.toISOString())
    .lte('membership_expiry_date', sevenDaysFromNow.toISOString())
    .order('membership_expiry_date', { ascending: true });
    
  if (studentsError) {
    console.error("Dashboard Widget Error: Could not fetch expiring students.", studentsError);
    return (
        <Card>
            <CardHeader>
                <CardTitle>Memberships Expiring Soon</CardTitle>
                <CardDescription>Students whose membership is expiring in the next 7 days.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-red-500 text-center py-4">Could not load student data.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memberships Expiring Soon</CardTitle>
        <CardDescription>Students whose membership is expiring in the next 7 days.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {expiringStudents && expiringStudents.length > 0 ? (
            expiringStudents.map((student) => (
            <div key={student.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                 <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt={student.name} />
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.phone}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Expires on</p>
                    <p className="text-sm font-medium">
                        {student.membership_expiry_date ? format(new Date(student.membership_expiry_date), 'dd MMM yyyy') : 'N/A'}
                    </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/students/${student.id}`}>View</Link>
                </Button>
              </div>
            </div>
            ))
        ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No memberships are expiring in the next 7 days.</p>
        )}
      </CardContent>
    </Card>
  )
}
