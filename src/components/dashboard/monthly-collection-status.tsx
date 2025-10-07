"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton";
import { format, getMonth, getYear, startOfMonth } from "date-fns"
import {
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
}
from "recharts"
import { createClient } from "@/lib/supabase/client"; // Use client-side Supabase client
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import type { Student, Payment, Shift } from '@/lib/types';

interface MonthlyData {
  month: string;
  collected: number;
  expected: number;
}

export default function MonthlyCollectionStatus() {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: userLoading, error: userError } = useUser();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || userLoading) return;

      setLoading(true);
      setError(null);

      const { data: libraryData, error: libraryError } = await supabase
        .from('libraries')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (libraryError || !libraryData) {
        console.error("Error fetching library for collection status:", libraryError);
        setError("Error loading collection status.");
        setLoading(false);
        return;
      }

      const libraryId = libraryData.id;

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          status,
          join_date,
          shifts ( fee )
        `)
        .eq('library_id', libraryId);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_date, for_month')
        .in('student_id', studentsData?.map(s => s.id) || []); // Filter payments by student IDs in the current library

      if (studentsError || paymentsError) {
        console.error("Error fetching data for collection status:", studentsError || paymentsError);
        setError("Error loading collection status.");
        setLoading(false);
        return;
      }

      const students = studentsData || [];
      const payments = paymentsData || [];

      const monthlyCollectionMap = new Map<string, { collected: number, expected: number }>();

      const currentYear = getYear(new Date());

      for (let i = 0; i < 12; i++) {
        const monthKey = format(new Date(currentYear, i, 1), "MMM yyyy");
        monthlyCollectionMap.set(monthKey, { collected: 0, expected: 0 });
      }

      payments.forEach(payment => {
        if (payment.payment_date && payment.amount) {
          const paymentDate = new Date(payment.payment_date);
          if (getYear(paymentDate) === currentYear) {
            const monthKey = format(paymentDate, "MMM yyyy");
            const current = monthlyCollectionMap.get(monthKey);
            if (current) {
              current.collected += payment.amount;
            }
          }
        }
      });

      students.forEach(student => {
        if (student.status === 'active' && student.shifts?.fee) {
          const monthlyFee = student.shifts.fee;
          const joinDate = new Date(student.join_date);

          for (let i = 0; i < 12; i++) {
            const monthStart = new Date(currentYear, i, 1);
            // Only count expected fee for months after or including join month
            if (monthStart >= startOfMonth(joinDate) && monthStart <= new Date()) { // Only count up to the current month
              const monthKey = format(monthStart, "MMM yyyy");
              const current = monthlyCollectionMap.get(monthKey);
              if (current) {
                current.expected += monthlyFee; 
              }
            }
          }
        }
      });

      const sortedChartData: MonthlyData[] = Array.from(monthlyCollectionMap.entries())
        .sort(([keyA], [keyB]) => new Date(keyA).getTime() - new Date(keyB).getTime())
        .map(([month, data]) => ({
          month,
          collected: data.collected,
          expected: data.expected,
        }));
      
      setChartData(sortedChartData);
      setLoading(false);
    };

    if (user && !userLoading) {
      fetchData();
    }
  }, [user, userLoading, supabase]);

  if (userLoading || loading) {
    return (
        <Card>
            <CardHeader className="items-center pb-4">
                <CardTitle>Monthly Collection Status</CardTitle>
                <CardDescription>Overview of collected vs. expected fees for the current year.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-0 h-[250px] w-full">
                <Skeleton className="h-full w-full" />
            </CardContent>
        </Card>
    );
  }

  if (userError) {
    return <p>Error: {userError}</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!user) {
    return <p>Please log in to view collection status.</p>;
  }

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Monthly Collection Status</CardTitle>
        <CardDescription>Overview of collected vs. expected fees for the current year.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-0">
        <ChartContainer
          config={{
            collected: { color: "hsl(var(--chart-1))" },
            expected: { color: "hsl(var(--chart-2))" },
          }}
          className="h-[250px] w-full"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarGrid />
            <PolarRadiusAxis angle={-90} domain={[0, Math.max(...chartData.map(d => Math.max(d.collected, d.expected)), 150)]} />
            <Radar
              name="Collected"
              dataKey="collected"
              stroke="var(--color-collected)"
              fill="var(--color-collected)"
              fillOpacity={0.9}
            />
            <Radar
              name="Expected"
              dataKey="expected"
              stroke="var(--color-expected)"
              fill="var(--color-expected)"
              fillOpacity={0.5}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
