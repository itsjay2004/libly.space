"use client"

import * as React from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PaymentMethodChartProps {
  data: {
    payment_method: string;
    total: number;
  }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const chartConfig = {
  total: {
    label: "Total",
  },
  UPI: {
    label: "UPI",
    color: "#0088FE",
  },
  Cash: {
    label: "Cash",
    color: "#00C49F",
  },
  Card: {
    label: "Card",
    color: "#FFBB28",
  },
  Other: {
    label: "Other",
    color: "#FF8042",
  },
}

export default function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Report</CardTitle>
          <CardDescription>No payment data for the current month.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No data to display</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method Report</CardTitle>
        <CardDescription>Distribution of payment methods for the current month.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
                nameKey="payment_method"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent formatter={(value, name) => `${name}: ${value}`} />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
