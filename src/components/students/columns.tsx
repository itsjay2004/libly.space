"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { StudentWithRelations } from "@/lib/types" // Assuming a unified type
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import StudentActions from "./student-actions"
import { format, isFuture } from 'date-fns';

export const columns: ColumnDef<StudentWithRelations>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "phone",
    header: "Phone Number",
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.membership_expiry_date, // Accessor for sorting/filtering
    cell: ({ row }) => {
      const expiryDate = row.original.membership_expiry_date;
      const isActive = expiryDate ? isFuture(new Date(expiryDate)) : false;
      const statusText = isActive ? 'Active' : 'Expired';
      
      return (
        <Badge variant={isActive ? 'default' : 'destructive'} className={isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {statusText}
        </Badge>
      )
    }
  },
  {
    accessorKey: "membership_expiry_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Expiry Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const expiryDate = row.getValue("membership_expiry_date") as string;
      if (!expiryDate) return <span className="text-muted-foreground">Not Set</span>;
      return <div>{format(new Date(expiryDate), "dd MMM yyyy")}</div>
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
        return <div>{format(new Date(joinDate), "dd MMM yyyy")}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const student = row.original
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <StudentActions student={student} />
        </div>
      )
    },
  },
]
