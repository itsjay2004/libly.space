"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface MonthlyRevenueChartProps {
  data: { month: string; total: number }[];
}

export default function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const chartConfig = {
    total: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue Overview</CardTitle>
        <CardDescription>Total collections over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis 
                        tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                    />
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                        formatter={(value) => `₹${Number(value).toLocaleString()}`}
                        indicator="dot"
                    />}
                    />
                    <Bar 
                        dataKey="total" 
                        fill="var(--color-total)" 
                        radius={4}
                    />
                </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Keep tracking your library's financial health.
        </div>
      </CardFooter>
    </Card>
  )
}
