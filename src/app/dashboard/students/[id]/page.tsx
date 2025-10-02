import { students, payments } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import StudentActions from "@/components/students/student-actions";

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const student = students.find((s) => s.id === params.id);

  if (!student) {
    notFound();
  }

  const studentPayments = payments.filter((p) => p.studentId === student.id);

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
            <p className="text-muted-foreground">Detailed information about the student.</p>
        </div>
        <StudentActions student={student} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                 <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                  <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-semibold">{student.name}</h2>
                <p className="text-muted-foreground">{student.email}</p>
                <div className="mt-4 flex items-center gap-2">
                    <Badge variant={student.status === "active" ? "default" : "secondary"}>
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Contact & Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Phone:</strong> {student.phone}</p>
              <p><strong>Joined:</strong> {format(new Date(student.joinDate), "MMMM d, yyyy")}</p>
              <p><strong>Student ID:</strong> {student.studentId}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Fee Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Fee</p>
                            <p className="text-2xl font-bold">₹{student.feeDetails.totalFee.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Paid</p>
                            <p className="text-2xl font-bold text-green-600">₹{student.feeDetails.paid.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Due</p>
                            <p className="text-2xl font-bold text-destructive">₹{student.feeDetails.due.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>A record of all payments made by the student.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {studentPayments.length > 0 ? studentPayments.map((payment) => (
                        <TableRow key={payment.id}>
                        <TableCell>{payment.month}</TableCell>
                        <TableCell>{format(new Date(payment.date), "PPP")}</TableCell>
                        <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">No payment history available.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
