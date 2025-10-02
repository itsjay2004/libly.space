"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { students, payments, shifts } from "@/lib/data"
import { format, getMonth, getYear } from "date-fns"
import {
  PolarGrid,
  RadialBar,
  RadialBarChart,
} from "recharts"

export default function MonthlyCollectionStatus() {
  const currentMonth = getMonth(new Date());
  const currentYear = getYear(new Date());
  const monthName = format(new Date(), 'MMMM');

  const totalPossibleCollection = students
    .filter(s => s.status === 'active')
    .reduce((acc, student) => {
        const shift = shifts.find(sh => sh.id === student.shiftId);
        return acc + (shift?.fee || 0);
    }, 0);
    
  const currentMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.date);
    return getMonth(paymentDate) === currentMonth && getYear(paymentDate) === currentYear;
  });

  const collectedAmount = currentMonthPayments.reduce((acc, p) => acc + p.amount, 0);
  const percentage = totalPossibleCollection > 0 ? (collectedAmount / totalPossibleCollection) * 100 : 0;
  
  const chartData = [
    { name: "collected", value: percentage, fill: "hsl(var(--primary))" },
  ];


  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Collection</CardTitle>
        <CardDescription>{monthName} {currentYear}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <ChartContainer
          config={{}}
          className="mx-auto aspect-square h-48 w-48"
        >
          <RadialBarChart
            data={chartData}
            startAngle={-90}
            endAngle={270}
            innerRadius="70%"
            outerRadius="100%"
            barSize={16}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[80, 60]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `₹${collectedAmount.toLocaleString()}`}
                  label=" "
                />
              }
            />
          </RadialBarChart>
        </ChartContainer>
        <div className="text-center mt-4">
            <p className="text-3xl font-bold">₹{collectedAmount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Collected</p>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
            out of ₹{totalPossibleCollection.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  )
}
