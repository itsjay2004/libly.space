import { students, payments } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const student = students.find((s) => s.id === params.id);

  if (!student) {
    notFound();
  }

  const studentPayments = payments.filter((p) => p.studentId === student.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
          <AvatarFallback>{student.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
          <p className="text-muted-foreground">{student.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={student.status === "active" ? "default" : "secondary"}>
              {student.status}
            </Badge>
            <span>Joined on {format(new Date(student.joinDate), "MMMM d, yyyy")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Fee Details</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            ₹{student.feeDetails.totalFee.toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-green-500">
            ₹{student.feeDetails.paid.toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Dues</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-destructive">
            ₹{student.feeDetails.due.toLocaleString()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
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
              {studentPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.month}</TableCell>
                  <TableCell>{format(new Date(payment.date), "PPP")}</TableCell>
                  <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
