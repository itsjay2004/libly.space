"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Student } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import StudentActions from "./student-actions"
import { startOfMonth, endOfMonth, differenceInDays, getDaysInMonth, addMonths, isSameMonth } from 'date-fns';

interface StudentWithDetails extends Student {
  shifts: { name: string, fee: number } | null;
  payments: { amount: number; status: 'paid' | 'due' }[];
}

export const columns: ColumnDef<StudentWithDetails>[] = [
  {
    accessorKey: "phone",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Phone Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === 'active' ? 'default' : 'destructive'} className={status === 'active' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}>
          {status}
        </Badge>
      )
    }
  },
  {
    accessorKey: "shifts.name",
    header: "Shift",
    cell: ({ row }) => {
        const shiftName = row.original.shifts?.name;
        return shiftName ? shiftName : <span className="text-muted-foreground">N/A</span>
    }
  },
  {
    accessorKey: "seat_number",
    header: "Seat",
     cell: ({ row }) => {
        const seat = row.getValue("seat_number") as number;
        return seat ? `#${seat}` : <span className="text-muted-foreground">N/A</span>
    }
  },
  {
    accessorKey: "join_date",
    header: "Join Date",
    cell: ({ row }) => {
        const joinDate = row.getValue("join_date") as string;
        if (!joinDate) return <span className="text-muted-foreground">N/A</span>;
        const formattedDate = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(joinDate));
        return <div>{formattedDate}</div>
    }
  },
  {
    id: "due",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const student = row.original;
      let calculatedDue = 0;

      const totalPaid = student.payments.reduce((acc, p) => acc + (p.amount || 0), 0);

      if (student.status === 'active' && student.shifts?.fee !== undefined) {
        const monthlyFee = student.shifts.fee;
        const studentJoinDate = new Date(student.join_date);
        const today = new Date();

        let totalExpectedFee = 0;

        const joinMonthStart = startOfMonth(studentJoinDate);
        const joinMonthEnd = endOfMonth(studentJoinDate);

        if (isSameMonth(studentJoinDate, today)) {
          const daysInJoinMonth = getDaysInMonth(studentJoinDate);
          const activeDaysThisMonth = differenceInDays(today, studentJoinDate) + 1;
          totalExpectedFee += (monthlyFee / daysInJoinMonth) * activeDaysThisMonth;
        } else {
          const daysInJoinMonth = getDaysInMonth(studentJoinDate);
          const activeDaysInJoiningMonth = differenceInDays(joinMonthEnd, studentJoinDate) + 1;
          totalExpectedFee += (monthlyFee / daysInJoinMonth) * activeDaysInJoiningMonth;

          let currentMonthIterator = addMonths(joinMonthStart, 1);
          while (currentMonthIterator < startOfMonth(today)) {
            totalExpectedFee += monthlyFee;
            currentMonthIterator = addMonths(currentMonthIterator, 1);
          }

          const daysInCurrentMonth = getDaysInMonth(today);
          const activeDaysInCurrentMonth = differenceInDays(today, startOfMonth(today)) + 1;
          totalExpectedFee += (monthlyFee / daysInCurrentMonth) * activeDaysInCurrentMonth;
        }
        
        calculatedDue = totalExpectedFee - totalPaid;
      }

      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(calculatedDue > 0 ? calculatedDue : 0);

      return <div className="text-right font-medium">{formatted}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const student = row.original

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <StudentActions student={student} onActionComplete={() => window.location.reload()} />
        </div>
      )
    },
  },
]
