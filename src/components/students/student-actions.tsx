"use client"

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { shifts } from "@/lib/data";
import type { Student } from "@/lib/types";
import { PlusCircle, Edit, Trash2, MoreHorizontal, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default function StudentActions({ student }: { student?: Student }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const studentData = Object.fromEntries(formData.entries());
    console.log(studentData);
    
    toast({
      title: student ? "Student Updated" : "Student Added",
      description: `${studentData.name} has been successfully ${student ? 'updated' : 'added'}.`,
    });
    setOpen(false);
  };

  const formContent = (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{student ? "Edit Student" : "Add New Student"}</DialogTitle>
        <DialogDescription>
          {student ? "Update the student's details." : "Fill in the details for the new student."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Name</Label>
          <Input id="name" name="name" defaultValue={student?.name} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={student?.email} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phone" className="text-right">Phone</Label>
          <Input id="phone" name="phone" defaultValue={student?.phone} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="shiftId" className="text-right">Shift</Label>
          <Select name="shiftId" defaultValue={student?.shiftId ?? undefined}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a shift" />
            </SelectTrigger>
            <SelectContent>
              {shifts.map(shift => (
                <SelectItem key={shift.id} value={shift.id}>{shift.name} ({new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(shift.fee)})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="seatNumber" className="text-right">Seat No.</Label>
          <Input id="seatNumber" name="seatNumber" type="number" defaultValue={student?.seatNumber ?? ''} className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );

  if (student) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/dashboard/students/${student.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => toast({ title: "Action not implemented", description: "Delete functionality is a work in progress."})}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent className="sm:max-w-[425px]">
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
