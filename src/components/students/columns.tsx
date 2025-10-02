"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Student } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { shifts } from "@/lib/data"
import StudentActions from "./student-actions"

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "studentId",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Student ID
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
    accessorKey: "shiftId",
    header: "Shift",
    cell: ({ row }) => {
        const shiftId = row.getValue("shiftId") as string;
        const shift = shifts.find(s => s.id === shiftId);
        return shift ? shift.name : <span className="text-muted-foreground">N/A</span>
    }
  },
  {
    accessorKey: "seatNumber",
    header: "Seat",
     cell: ({ row }) => {
        const seat = row.getValue("seatNumber") as number;
        return seat ? `#${seat}` : <span className="text-muted-foreground">N/A</span>
    }
  },
    {
    accessorKey: "feeDetails.due",
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
      const due = parseFloat(row.getValue("feeDetails_due"));
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(due);
      return <div className="text-right font-medium">{formatted}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const student = row.original

      return (
        <StudentActions student={student} />
      )
    },
  },
]
