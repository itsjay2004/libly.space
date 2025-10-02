"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface CollectionChartProps {
  data: { month: string; total: number }[];
}

export default function CollectionChart({ data }: CollectionChartProps) {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Month-wise Collection</CardTitle>
        </CardHeader>
        <CardContent>
            <ChartContainer config={{}} className="h-64 w-full">
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="month"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value / 1000}k`}
                        />
                         <Tooltip
                            cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
                            content={<ChartTooltipContent
                                formatter={(value) => `₹${Number(value).toLocaleString()}`}
                                indicator="dot"
                            />}
                        />
                        <Bar
                            dataKey="total"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
    </Card>
  )
}
